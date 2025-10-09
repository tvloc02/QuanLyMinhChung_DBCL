const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Evidence = require('../models/Evidence/Evidence');
const { Standard, Criteria } = require('../models/Evidence/Program');
const fs = require('fs');

const importEvidences = async (filePath, academicYearId, programId, organizationId, userId) => {
    try {
        if (!academicYearId) {
            return {
                success: false,
                message: 'Academic Year ID is required for import'
            };
        }

        // Read file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawData.length === 0) {
            return {
                success: false,
                message: 'File không có dữ liệu để import'
            };
        }

        if (rawData.length > 1000) {
            return {
                success: false,
                message: 'Số lượng bản ghi không được vượt quá 1000'
            };
        }

        // Validate headers
        const requiredHeaders = ['Tên minh chứng (*)', 'Mã tiêu chuẩn (*)', 'Mã tiêu chí (*)'];
        const headers = Object.keys(rawData[0]);
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

        if (missingHeaders.length > 0) {
            return {
                success: false,
                message: `Thiếu các cột bắt buộc: ${missingHeaders.join(', ')}`
            };
        }

        // Get existing standards and criteria for this academic year
        const [standards, criterias] = await Promise.all([
            Standard.find({
                academicYearId: mongoose.Types.ObjectId(academicYearId),
                programId: mongoose.Types.ObjectId(programId),
                organizationId: mongoose.Types.ObjectId(organizationId),
                status: 'active'
            }),
            Criteria.find({
                academicYearId: mongoose.Types.ObjectId(academicYearId),
                programId: mongoose.Types.ObjectId(programId),
                organizationId: mongoose.Types.ObjectId(organizationId),
                status: 'active'
            })
        ]);

        const standardMap = new Map();
        standards.forEach(std => standardMap.set(std.code, std));

        const criteriaMap = new Map();
        criterias.forEach(crit => criteriaMap.set(`${crit.standardId}_${crit.code}`, crit));

        // Process data
        const results = {
            total: rawData.length,
            success: 0,
            failed: 0,
            skipped: 0,
            errors: [],
            successItems: [],
            failedItems: []
        };

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const rowIndex = i + 2; // Excel row number (starting from 2, assuming header at 1)

            try {
                const evidenceData = await processImportRow(
                    row,
                    rowIndex,
                    academicYearId,
                    programId,
                    organizationId,
                    userId,
                    standardMap,
                    criteriaMap
                );

                if (evidenceData.error) {
                    results.failed++;
                    results.errors.push(`Dòng ${rowIndex}: ${evidenceData.error}`);
                    results.failedItems.push({ row: rowIndex, data: row, error: evidenceData.error });
                    continue;
                }

                // Check if evidence with same code already exists in this academic year
                const existingEvidence = await Evidence.findOne({
                    code: evidenceData.code,
                    academicYearId: mongoose.Types.ObjectId(academicYearId)
                });
                if (existingEvidence) {
                    results.skipped++;
                    results.errors.push(`Dòng ${rowIndex}: Mã minh chứng ${evidenceData.code} đã tồn tại trong năm học này`);
                    continue;
                }

                // Create evidence
                const evidence = new Evidence(evidenceData);
                await evidence.save();

                results.success++;
                results.successItems.push({
                    row: rowIndex,
                    code: evidence.code,
                    name: evidence.name
                });

            } catch (error) {
                results.failed++;
                results.errors.push(`Dòng ${rowIndex}: ${error.message}`);
                results.failedItems.push({ row: rowIndex, data: row, error: error.message });
            }
        }

        return {
            success: true,
            message: `Import hoàn tất. Thành công: ${results.success}, Thất bại: ${results.failed}, Bỏ qua: ${results.skipped}`,
            data: results
        };

    } catch (error) {
        console.error('Import evidences error:', error);
        return {
            success: false,
            message: 'Lỗi khi đọc file import: ' + error.message
        };
    }
};

// Process single row from import file
const processImportRow = async (row, rowIndex, academicYearId, programId, organizationId, userId, standardMap, criteriaMap) => {
    try {
        // Extract data from row
        const name = (row['Tên minh chứng (*)'] || '').toString().trim();
        const standardCode = (row['Mã tiêu chuẩn (*)'] || '').toString().trim().padStart(2, '0');
        const criteriaCode = (row['Mã tiêu chí (*)'] || '').toString().trim().padStart(2, '0');
        const description = (row['Mô tả'] || '').toString().trim();
        const documentNumber = (row['Số hiệu văn bản'] || '').toString().trim();
        const documentType = (row['Loại văn bản'] || '').toString().trim();
        const issuingAgency = (row['Cơ quan ban hành'] || '').toString().trim();
        const notes = (row['Ghi chú'] || '').toString().trim();

        // Validate required fields
        if (!name) {
            return { error: 'Tên minh chứng không được để trống' };
        }
        if (!standardCode) {
            return { error: 'Mã tiêu chuẩn không được để trống' };
        }
        if (!criteriaCode) {
            return { error: 'Mã tiêu chí không được để trống' };
        }

        // Find standard
        const standard = standardMap.get(standardCode);
        if (!standard) {
            return { error: `Không tìm thấy tiêu chuẩn với mã ${standardCode} trong năm học này` };
        }

        // Find criteria
        const criteria = criteriaMap.get(`${standard._id}_${criteriaCode}`);
        if (!criteria) {
            return { error: `Không tìm thấy tiêu chí với mã ${criteriaCode} trong tiêu chuẩn ${standardCode} của năm học này` };
        }

        // Generate evidence code
        const evidenceCode = await Evidence.generateCode(academicYearId, standardCode, criteriaCode);

        // Parse dates
        let issueDate = null;
        let effectiveDate = null;

        if (row['Ngày ban hành (dd/mm/yyyy)']) {
            issueDate = parseDate(row['Ngày ban hành (dd/mm/yyyy)']);
            if (!issueDate) {
                return { error: 'Ngày ban hành không đúng định dạng dd/mm/yyyy' };
            }
        }

        if (row['Ngày hiệu lực (dd/mm/yyyy)']) {
            effectiveDate = parseDate(row['Ngày hiệu lực (dd/mm/yyyy)']);
            if (!effectiveDate) {
                return { error: 'Ngày hiệu lực không đúng định dạng dd/mm/yyyy' };
            }
        }

        // Validate document type
        const validDocumentTypes = ['Quyết định', 'Thông tư', 'Nghị định', 'Luật', 'Báo cáo', 'Kế hoạch', 'Khác'];
        if (documentType && !validDocumentTypes.includes(documentType)) {
            return { error: `Loại văn bản không hợp lệ. Chỉ chấp nhận: ${validDocumentTypes.join(', ')}` };
        }

        return {
            academicYearId: mongoose.Types.ObjectId(academicYearId),
            name,
            description,
            code: evidenceCode,
            programId: mongoose.Types.ObjectId(programId),
            organizationId: mongoose.Types.ObjectId(organizationId),
            standardId: standard._id,
            criteriaId: criteria._id,
            documentNumber,
            documentType: documentType || 'Khác',
            issueDate,
            effectiveDate,
            issuingAgency,
            notes,
            status: 'active',
            createdBy: mongoose.Types.ObjectId(userId),
            updatedBy: mongoose.Types.ObjectId(userId)
        };

    } catch (error) {
        return { error: error.message };
    }
};

// Parse date from DD/MM/YYYY format
const parseDate = (dateString) => {
    if (!dateString) return null;

    const dateStr = dateString.toString().trim();
    const parts = dateStr.split('/');

    if (parts.length !== 3) return null;

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed in JavaScript Date
    const year = parseInt(parts[2]);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) return null;

    const date = new Date(year, month, day);

    // Check if date is valid
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        return null;
    }

    return date;
};

// Generate import template
const generateTemplate = async (programId, organizationId, academicYearId) => {
    try {
        if (!academicYearId) {
            throw new Error('Academic Year ID is required for template generation');
        }

        const exportService = require('./exportService');
        return await exportService.exportImportTemplate(programId, organizationId, academicYearId);
    } catch (error) {
        console.error('Generate template error:', error);
        throw error;
    }
};

// Validate import file before processing
const validateImportFile = async (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            return {
                success: false,
                message: 'File không tồn tại'
            };
        }

        const stats = fs.statSync(filePath);
        if (stats.size > 10 * 1024 * 1024) { // 10MB
            return {
                success: false,
                message: 'File quá lớn (tối đa 10MB)'
            };
        }

        // Try to read the file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
            return {
                success: false,
                message: 'File không có sheet nào'
            };
        }

        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (data.length === 0) {
            return {
                success: false,
                message: 'File không có dữ liệu'
            };
        }

        if (data.length > 1000) {
            return {
                success: false,
                message: 'Số lượng bản ghi không được vượt quá 1000'
            };
        }

        // Check headers
        const requiredHeaders = ['Tên minh chứng (*)', 'Mã tiêu chuẩn (*)', 'Mã tiêu chí (*)'];
        const headers = Object.keys(data[0]);
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

        if (missingHeaders.length > 0) {
            return {
                success: false,
                message: `Thiếu các cột bắt buộc: ${missingHeaders.join(', ')}`
            };
        }

        return {
            success: true,
            message: 'File hợp lệ',
            data: {
                totalRows: data.length,
                headers: headers
            }
        };

    } catch (error) {
        console.error('Validate import file error:', error);
        return {
            success: false,
            message: 'Lỗi khi đọc file: ' + error.message
        };
    }
};

// Import users from Excel file
const importUsers = async (filePath, createdBy) => {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawData.length === 0) {
            return {
                success: false,
                message: 'File không có dữ liệu để import'
            };
        }

        const User = require('../models/User/User');
        const results = {
            total: rawData.length,
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const rowIndex = i + 2;

            try {
                const email = (row['Email (*)'] || '').toString().trim().toLowerCase();
                const fullName = (row['Họ và tên (*)'] || '').toString().trim();
                const phoneNumber = (row['Số điện thoại'] || '').toString().trim();
                const role = (row['Vai trò (*)'] || 'staff').toString().trim();
                const department = (row['Phòng ban'] || '').toString().trim();
                const position = (row['Chức vụ'] || '').toString().trim();

                // Validate required fields
                if (!email || !fullName) {
                    results.failed++;
                    results.errors.push(`Dòng ${rowIndex}: Email và họ tên là bắt buộc`);
                    continue;
                }

                // Clean email
                const cleanEmail = email.replace('@cmc.edu.vn', '');

                // Check if user exists
                const existingUser = await User.findOne({ email: new RegExp(`^${cleanEmail}`, 'i') });
                if (existingUser) {
                    results.failed++;
                    results.errors.push(`Dòng ${rowIndex}: Email ${email} đã tồn tại`);
                    continue;
                }

                // Create user
                const defaultPassword = User.generateDefaultPassword(cleanEmail);
                const user = new User({
                    email: cleanEmail,
                    fullName,
                    password: defaultPassword,
                    phoneNumber,
                    role,
                    department,
                    position,
                    status: 'active'
                });

                await user.save();
                results.success++;

            } catch (error) {
                results.failed++;
                results.errors.push(`Dòng ${rowIndex}: ${error.message}`);
            }
        }

        return {
            success: true,
            message: `Import hoàn tất. Thành công: ${results.success}, Thất bại: ${results.failed}`,
            data: results
        };

    } catch (error) {
        console.error('Import users error:', error);
        return {
            success: false,
            message: 'Lỗi khi import người dùng: ' + error.message
        };
    }
};

const identifyCodeType = (code) => {
    if (!code) return null;

    const trimmedCode = code.trim();

    // Kiểm tra mã minh chứng: H2.02.01.01
    const evidencePattern = /^H(\d+)\.(\d{2})\.(\d{2})\.(\d{2})$/;
    const evidenceMatch = trimmedCode.match(evidencePattern);
    if (evidenceMatch) {
        return {
            type: 'evidence',
            parsed: {
                boxNumber: evidenceMatch[1],
                standardCode: evidenceMatch[2],
                criteriaCode: evidenceMatch[3],
                sequenceNumber: evidenceMatch[4]
            },
            original: trimmedCode
        };
    }

    // Kiểm tra mã tiêu chí: 2.1 hoặc 02.01
    const criteriaPattern = /^(\d{1,2})\.(\d{1,2})$/;
    const criteriaMatch = trimmedCode.match(criteriaPattern);
    if (criteriaMatch) {
        return {
            type: 'criteria',
            parsed: {
                standardCode: criteriaMatch[1].padStart(2, '0'),
                criteriaCode: criteriaMatch[2].padStart(2, '0')
            },
            original: trimmedCode
        };
    }

    // Kiểm tra mã tiêu chuẩn: số đơn (1, 2, 3...) hoặc 01, 02...
    const standardPattern = /^(\d{1,2})$/;
    const standardMatch = trimmedCode.match(standardPattern);
    if (standardMatch) {
        return {
            type: 'standard',
            parsed: {
                standardCode: standardMatch[1].padStart(2, '0')
            },
            original: trimmedCode
        };
    }

    // Kiểm tra text "Tiêu chuẩn X"
    const standardTextPattern = /Tiêu chuẩn\s+(\d+)/i;
    const standardTextMatch = trimmedCode.match(standardTextPattern);
    if (standardTextMatch) {
        return {
            type: 'standard',
            parsed: {
                standardCode: standardTextMatch[1].padStart(2, '0')
            },
            original: trimmedCode
        };
    }

    // Kiểm tra text "Tiêu chí X.Y"
    const criteriaTextPattern = /Tiêu chí\s+(\d+)\.(\d+)/i;
    const criteriaTextMatch = trimmedCode.match(criteriaTextPattern);
    if (criteriaTextMatch) {
        return {
            type: 'criteria',
            parsed: {
                standardCode: criteriaTextMatch[1].padStart(2, '0'),
                criteriaCode: criteriaTextMatch[2].padStart(2, '0')
            },
            original: trimmedCode
        };
    }

    return null;
};

const importEvidencesFromExcel = async (filePath, academicYearId, programId, organizationId, userId, mode = 'create') => {
    try {
        // Đọc file Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (data.length < 2) {
            throw new Error('File không có dữ liệu');
        }

        const StandardModel = mongoose.model('Standard');
        const CriteriaModel = mongoose.model('Criteria');

        // Lấy tất cả standards và criteria trong năm học
        const [allStandards, allCriteria] = await Promise.all([
            StandardModel.find({ academicYearId }).lean(),
            CriteriaModel.find({ academicYearId }).lean()
        ]);

        // Tạo map để tra cứu nhanh
        const standardMap = {};
        allStandards.forEach(std => {
            standardMap[std.code] = std._id;
        });

        const criteriaMap = {};
        allCriteria.forEach(crit => {
            const key = `${crit.standardCode}.${crit.code}`;
            criteriaMap[key] = crit._id;
        });

        let currentStandardId = null;
        let currentCriteriaId = null;
        let currentStandardCode = null;
        let currentCriteriaCode = null;

        const results = {
            success: [],
            errors: [],
            updated: [],
            created: []
        };

        // Bắt đầu từ dòng 2 (bỏ qua header)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 2) continue;

            const [stt, code, name] = row;
            const codeStr = String(code || '').trim();
            const nameStr = String(name || '').trim();

            if (!codeStr) continue;

            // Nhận diện loại mã
            const identified = identifyCodeType(codeStr);

            if (!identified) {
                results.errors.push({
                    row: i + 1,
                    code: codeStr,
                    message: 'Không nhận diện được định dạng mã'
                });
                continue;
            }

            try {
                if (identified.type === 'standard') {
                    // Cập nhật context tiêu chuẩn hiện tại
                    currentStandardCode = identified.parsed.standardCode;
                    currentStandardId = standardMap[currentStandardCode];

                    if (!currentStandardId) {
                        results.errors.push({
                            row: i + 1,
                            code: codeStr,
                            message: `Không tìm thấy tiêu chuẩn ${currentStandardCode} trong hệ thống`
                        });
                        currentStandardId = null;
                    }
                    currentCriteriaId = null;

                } else if (identified.type === 'criteria') {
                    // Cập nhật context tiêu chí hiện tại
                    currentStandardCode = identified.parsed.standardCode;
                    currentCriteriaCode = identified.parsed.criteriaCode;
                    const criteriaKey = `${currentStandardCode}.${currentCriteriaCode}`;
                    currentCriteriaId = criteriaMap[criteriaKey];
                    currentStandardId = standardMap[currentStandardCode];

                    if (!currentCriteriaId) {
                        results.errors.push({
                            row: i + 1,
                            code: codeStr,
                            message: `Không tìm thấy tiêu chí ${criteriaKey} trong hệ thống`
                        });
                        currentCriteriaId = null;
                    }

                } else if (identified.type === 'evidence') {
                    // Xử lý minh chứng
                    if (!nameStr) {
                        results.errors.push({
                            row: i + 1,
                            code: codeStr,
                            message: 'Thiếu tên minh chứng'
                        });
                        continue;
                    }

                    // Lấy standardId và criteriaId từ mã minh chứng
                    const stdCode = identified.parsed.standardCode;
                    const critCode = identified.parsed.criteriaCode;
                    const criteriaKey = `${stdCode}.${critCode}`;

                    const evidenceStandardId = standardMap[stdCode];
                    const evidenceCriteriaId = criteriaMap[criteriaKey];

                    if (!evidenceStandardId || !evidenceCriteriaId) {
                        results.errors.push({
                            row: i + 1,
                            code: codeStr,
                            message: `Không tìm thấy tiêu chuẩn ${stdCode} hoặc tiêu chí ${criteriaKey}`
                        });
                        continue;
                    }

                    // Kiểm tra xem minh chứng đã tồn tại chưa
                    const existingEvidence = await Evidence.findOne({
                        code: identified.original,
                        academicYearId
                    });

                    if (mode === 'update') {
                        if (existingEvidence) {
                            // Cập nhật
                            existingEvidence.name = nameStr;
                            existingEvidence.standardId = evidenceStandardId;
                            existingEvidence.criteriaId = evidenceCriteriaId;
                            existingEvidence.programId = programId;
                            existingEvidence.organizationId = organizationId;
                            existingEvidence.updatedBy = userId;

                            await existingEvidence.save();

                            results.updated.push({
                                row: i + 1,
                                code: identified.original,
                                name: nameStr
                            });
                        } else {
                            // Tạo mới nếu chưa tồn tại
                            const newEvidence = new Evidence({
                                academicYearId,
                                code: identified.original,
                                name: nameStr,
                                programId,
                                organizationId,
                                standardId: evidenceStandardId,
                                criteriaId: evidenceCriteriaId,
                                createdBy: userId,
                                updatedBy: userId
                            });

                            await newEvidence.save();

                            results.created.push({
                                row: i + 1,
                                code: identified.original,
                                name: nameStr
                            });
                        }
                    } else {
                        // Mode create
                        if (existingEvidence) {
                            results.errors.push({
                                row: i + 1,
                                code: identified.original,
                                message: 'Mã minh chứng đã tồn tại'
                            });
                            continue;
                        }

                        const newEvidence = new Evidence({
                            academicYearId,
                            code: identified.original,
                            name: nameStr,
                            programId,
                            organizationId,
                            standardId: evidenceStandardId,
                            criteriaId: evidenceCriteriaId,
                            createdBy: userId,
                            updatedBy: userId
                        });

                        await newEvidence.save();

                        results.created.push({
                            row: i + 1,
                            code: identified.original,
                            name: nameStr
                        });
                    }

                    results.success.push({
                        row: i + 1,
                        code: identified.original,
                        name: nameStr,
                        action: existingEvidence ? 'updated' : 'created'
                    });
                }

            } catch (error) {
                results.errors.push({
                    row: i + 1,
                    code: codeStr,
                    message: error.message
                });
            }
        }

        return {
            success: true,
            message: `Import hoàn tất: ${results.created.length} tạo mới, ${results.updated.length} cập nhật, ${results.errors.length} lỗi`,
            data: {
                total: results.success.length,
                created: results.created.length,
                updated: results.updated.length,
                errors: results.errors.length,
                details: results
            }
        };

    } catch (error) {
        console.error('Import error:', error);
        throw new Error('Lỗi khi import file: ' + error.message);
    }
};

module.exports = {
    importEvidencesFromExcel,
    identifyCodeType
};

module.exports = {
    importEvidences,
    generateTemplate,
    validateImportFile,
    importUsers
};