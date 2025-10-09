const XLSX = require('xlsx');
const Evidence = require('../models/Evidence/Evidence');
const mongoose = require('mongoose');

const identifyCodeType = (code) => {
    if (!code) return null;

    const trimmedCode = code.trim();

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
        console.log('Reading Excel file:', filePath);

        // Đọc file Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const dataWithHeader = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        console.log('Excel data preview:', {
            totalRows: dataWithHeader.length,
            sampleRow: dataWithHeader[0],
            headers: Object.keys(dataWithHeader[0] || {})
        });

        if (dataWithHeader.length === 0) {
            throw new Error('File không có dữ liệu');
        }

        // Kiểm tra tham số bắt buộc
        if (!academicYearId || !programId || !organizationId || !userId) {
            throw new Error('Thiếu các tham số bắt buộc (academicYearId, programId, organizationId, userId).');
        }

        const findColumn = (row, possibleNames) => {
            for (const name of possibleNames) {
                if (row[name] !== undefined) return name;
            }
            return null;
        };

        const firstRow = dataWithHeader[0];

        const sttCol = findColumn(firstRow, ['STT', 'TT', 'Số TT', 'So TT']);
        const codeCol = findColumn(firstRow, ['Mã', 'Ma', 'Mã minh chứng', 'Code', 'Mã MC']);
        const nameCol = findColumn(firstRow, ['Tên', 'Ten', 'Tên minh chứng', 'Name', 'Tên MC']);

        console.log('Detected columns:', { sttCol, codeCol, nameCol });

        if (!codeCol) {
            throw new Error('Không tìm thấy cột "Mã" trong file Excel. Các cột tìm thấy: ' + Object.keys(firstRow).join(', '));
        }

        const StandardModel = mongoose.model('Standard');
        const CriteriaModel = mongoose.model('Criteria');

        // Load tất cả Standard và Criteria thuộc năm học hiện tại
        const [allStandards, allCriteria] = await Promise.all([
            StandardModel.find({ academicYearId, programId, organizationId }).lean(),
            CriteriaModel.find({ academicYearId, programId, organizationId }).lean()
        ]);

        console.log('Found in DB:', {
            standards: allStandards.length,
            criteria: allCriteria.length
        });

        const standardMap = {};
        allStandards.forEach(std => {
            standardMap[std.code] = std._id;
            standardMap[parseInt(std.code, 10)] = std._id;
        });

        const criteriaMap = {};
        allCriteria.forEach(crit => {
            const standard = allStandards.find(s =>
                s._id.toString() === crit.standardId.toString()
            );
            if (standard) {
                const key = `${standard.code}.${crit.code}`;
                criteriaMap[key] = crit._id;
            }
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

        // Xử lý từng dòng
        for (let i = 0; i < dataWithHeader.length; i++) {
            const row = dataWithHeader[i];
            const rowNum = i + 2; // +2 vì Excel bắt đầu từ 1 và có header

            const codeStr = String(row[codeCol] || '').trim();
            const nameStr = nameCol ? String(row[nameCol] || '').trim() : '';

            if (!codeStr && !nameStr) continue;
            if (!codeStr) continue; // Bỏ qua nếu không có mã

            console.log(`Row ${rowNum}: Processing code="${codeStr}", name="${nameStr}"`);

            // Nhận diện loại mã
            const identified = identifyCodeType(codeStr);

            if (!identified) {
                results.errors.push({
                    row: rowNum,
                    code: codeStr,
                    message: 'Không nhận diện được định dạng mã'
                });
                console.log(`  → Error: Unknown code format`);
                continue;
            }

            console.log(`  → Identified as: ${identified.type}`);

            try {
                if (identified.type === 'standard') {
                    currentStandardCode = identified.parsed.standardCode;
                    let standardName = nameStr || `Tiêu chuẩn ${currentStandardCode}`;

                    // 1. Tìm kiếm Standard đã tồn tại
                    currentStandardId = standardMap[currentStandardCode];

                    if (!currentStandardId && standardName) {
                        // TẠO MỚI STANDARD
                        const newStandard = new StandardModel({
                            academicYearId,
                            code: currentStandardCode,
                            name: standardName,
                            programId,
                            organizationId,
                            createdBy: userId,
                            updatedBy: userId
                        });

                        const savedStandard = await newStandard.save();
                        currentStandardId = savedStandard._id;

                        // Cập nhật lại Map và danh sách
                        standardMap[currentStandardCode] = currentStandardId;
                        allStandards.push(savedStandard.toObject());

                        results.created.push({ row: rowNum, code: codeStr, name: standardName, type: 'standard' });
                        console.log(`  → CREATED new standard: ${currentStandardCode}`);

                    } else if (!currentStandardId) {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: `Không tìm thấy Tiêu chuẩn ${currentStandardCode} và thiếu tên để tạo mới`
                        });
                    } else {
                        console.log(`  → Found existing standard: ${currentStandardCode}`);
                    }

                    currentCriteriaId = null; // Reset Criteria context

                } else if (identified.type === 'criteria') {
                    currentStandardCode = identified.parsed.standardCode;
                    currentCriteriaCode = identified.parsed.criteriaCode;
                    const criteriaKey = `${currentStandardCode}.${currentCriteriaCode}`;
                    let criteriaName = nameStr || `Tiêu chí ${criteriaKey}`;

                    // Lấy Standard cha (Nếu nó vừa được tạo ở trên hoặc đã tồn tại)
                    currentStandardId = standardMap[currentStandardCode];

                    if (!currentStandardId) {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: `Tiêu chuẩn ${currentStandardCode} chưa tồn tại. Không thể tạo Tiêu chí ${criteriaKey}.`
                        });
                        currentCriteriaId = null;
                        continue;
                    }

                    // 1. Tìm kiếm Criteria đã tồn tại
                    currentCriteriaId = criteriaMap[criteriaKey];

                    if (!currentCriteriaId && criteriaName) {
                        // TẠO MỚI CRITERIA
                        const newCriteria = new CriteriaModel({
                            academicYearId,
                            code: currentCriteriaCode,
                            name: criteriaName,
                            programId,
                            organizationId,
                            standardId: currentStandardId,
                            createdBy: userId,
                            updatedBy: userId
                        });

                        const savedCriteria = await newCriteria.save();
                        currentCriteriaId = savedCriteria._id;

                        // Cập nhật lại Map và danh sách
                        criteriaMap[criteriaKey] = currentCriteriaId;
                        allCriteria.push(savedCriteria.toObject());

                        results.created.push({ row: rowNum, code: codeStr, name: criteriaName, type: 'criteria' });
                        console.log(`  → CREATED new criteria: ${criteriaKey}`);

                    } else if (!currentCriteriaId) {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: `Không tìm thấy Tiêu chí ${criteriaKey} và thiếu tên để tạo mới`
                        });
                    } else {
                        console.log(`  → Found existing criteria: ${criteriaKey}`);
                    }

                } else if (identified.type === 'evidence') {
                    // Xử lý minh chứng
                    if (!nameStr) {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: 'Thiếu tên minh chứng'
                        });
                        console.log(`  → Error: Missing name`);
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
                            row: rowNum,
                            code: codeStr,
                            message: `Không tìm thấy tiêu chuẩn ${stdCode} hoặc tiêu chí ${criteriaKey}. Hãy đảm bảo chúng nằm trên hoặc đã tồn tại.`
                        });
                        console.log(`  → Error: Standard or Criteria not found`);
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
                            existingEvidence.programId = programId; // Lấy từ tham số
                            existingEvidence.organizationId = organizationId; // Lấy từ tham số
                            existingEvidence.updatedBy = userId;

                            await existingEvidence.save();

                            results.updated.push({
                                row: rowNum,
                                code: identified.original,
                                name: nameStr
                            });
                            console.log(`  → Updated existing evidence`);
                        } else {
                            // Tạo mới nếu chưa tồn tại
                            const newEvidence = new Evidence({
                                academicYearId,
                                code: identified.original,
                                name: nameStr,
                                programId, // Lấy từ tham số
                                organizationId, // Lấy từ tham số
                                standardId: evidenceStandardId,
                                criteriaId: evidenceCriteriaId,
                                createdBy: userId,
                                updatedBy: userId
                            });

                            await newEvidence.save();

                            results.created.push({
                                row: rowNum,
                                code: identified.original,
                                name: nameStr
                            });
                            console.log(`  → Created new evidence`);
                        }
                    } else {
                        // Mode create
                        if (existingEvidence) {
                            results.errors.push({
                                row: rowNum,
                                code: identified.original,
                                message: 'Mã minh chứng đã tồn tại'
                            });
                            console.log(`  → Error: Evidence already exists`);
                            continue;
                        }

                        const newEvidence = new Evidence({
                            academicYearId,
                            code: identified.original,
                            name: nameStr,
                            programId, // Lấy từ tham số
                            organizationId, // Lấy từ tham số
                            standardId: evidenceStandardId,
                            criteriaId: evidenceCriteriaId,
                            createdBy: userId,
                            updatedBy: userId
                        });

                        await newEvidence.save();

                        results.created.push({
                            row: rowNum,
                            code: identified.original,
                            name: nameStr
                        });
                        console.log(`  → Created new evidence`);
                    }

                    results.success.push({
                        row: rowNum,
                        code: identified.original,
                        name: nameStr,
                        action: existingEvidence ? 'updated' : 'created'
                    });
                }

            } catch (error) {
                // SỬA: Log toàn bộ chi tiết lỗi Validation hoặc CastError
                const errorMessage = error.message || 'Lỗi không xác định';
                console.error(`  → Error processing row ${rowNum} (${identified.type}):`, errorMessage, error);

                // Nếu là lỗi validation Mongoose, lấy thông báo chi tiết
                if (error.name === 'ValidationError') {
                    const messages = Object.values(error.errors).map(err => err.message).join('; ');
                    results.errors.push({
                        row: rowNum,
                        code: codeStr,
                        message: `Lỗi Validation: ${messages}` // Sửa lỗi chi tiết hơn
                    });
                } else if (error.name === 'CastError') {
                    results.errors.push({
                        row: rowNum,
                        code: codeStr,
                        message: `Lỗi định dạng ID: ${error.reason.message}`
                    });
                } else {
                    results.errors.push({
                        row: rowNum,
                        code: codeStr,
                        message: errorMessage // Lỗi chung (như "Không tìm thấy tiêu chuẩn")
                    });
                }
            }
        }

        const createdStandards = results.created.filter(r => r.type === 'standard').length;
        const createdCriteria = results.created.filter(r => r.type === 'criteria').length;
        const createdEvidences = results.created.filter(r => r.type !== 'standard' && r.type !== 'criteria').length;


        console.log('\n=== Import Summary ===');
        console.log('Created Standards:', createdStandards);
        console.log('Created Criteria:', createdCriteria);
        console.log('Created Evidences:', createdEvidences);
        console.log('Updated:', results.updated.length);
        console.log('Errors:', results.errors.length);

        return {
            success: true,
            message: `Import hoàn tất: ${createdStandards} TC, ${createdCriteria} TC, ${createdEvidences} MC tạo mới, ${results.updated.length} MC cập nhật, ${results.errors.length} lỗi`,
            data: {
                total: results.success.length + createdStandards + createdCriteria,
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