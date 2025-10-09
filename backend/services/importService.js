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

        const [allStandards, allCriteria] = await Promise.all([
            StandardModel.find({ academicYearId }).lean(),
            CriteriaModel.find({ academicYearId }).lean()
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

            if (!codeStr) continue;

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

                    // Lấy tên tiêu chuẩn từ cột tên (nameCol)
                    let standardName = nameStr || `Tiêu chuẩn ${currentStandardCode}`;

                    // Tìm kiếm Standard đã tồn tại
                    let existingStandard = allStandards.find(s => s.code === currentStandardCode);

                    if (existingStandard) {
                        // Cập nhật Standard (nếu muốn)
                        currentStandardId = existingStandard._id;
                        console.log(`  → Found existing standard: ${currentStandardCode}`);
                    } else {
                        // TẠO MỚI STANDARD
                        if (standardName) {
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

                            // Cập nhật lại Standard Map và danh sách
                            standardMap[currentStandardCode] = currentStandardId;
                            allStandards.push(savedStandard.toObject());

                            results.created.push({
                                row: rowNum,
                                code: codeStr,
                                message: `Tạo mới Tiêu chuẩn ${currentStandardCode}`
                            });
                            console.log(`  → Created new standard: ${currentStandardCode}`);
                        } else {
                            results.errors.push({
                                row: rowNum,
                                code: codeStr,
                                message: `Không tìm thấy Tiêu chuẩn ${currentStandardCode} và thiếu tên để tạo mới`
                            });
                            currentStandardId = null;
                        }
                    }

                    if (currentStandardId) {
                        console.log(`  → Set current standard: ${currentStandardCode}`);
                    } else {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: `Không tìm thấy hoặc tạo được Tiêu chuẩn ${currentStandardCode}`
                        });
                    }

                    currentCriteriaId = null;

                } else if (identified.type === 'criteria') {
                    currentStandardCode = identified.parsed.standardCode;
                    currentCriteriaCode = identified.parsed.criteriaCode;
                    const criteriaKey = `${currentStandardCode}.${currentCriteriaCode}`;

                    currentStandardId = standardMap[currentStandardCode];
                    let criteriaName = nameStr || `Tiêu chí ${criteriaKey}`;


                    if (!currentStandardId) {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: `Tiêu chuẩn ${currentStandardCode} chưa tồn tại. Không thể tạo Tiêu chí ${criteriaKey}.`
                        });
                        currentCriteriaId = null;
                        currentStandardId = null; // Đặt lại để tránh nhầm lẫn

                    } else {
                        // Tìm kiếm Criteria đã tồn tại
                        let existingCriteria = allCriteria.find(c => {
                            const stdIdString = c.standardId.toString();
                            const parentStd = allStandards.find(s => s._id.toString() === stdIdString);
                            return parentStd && parentStd.code === currentStandardCode && c.code === currentCriteriaCode;
                        });

                        if (existingCriteria) {
                            // Cập nhật Criteria (nếu muốn)
                            currentCriteriaId = existingCriteria._id;
                            console.log(`  → Found existing criteria: ${criteriaKey}`);
                        } else {
                            // TẠO MỚI CRITERIA
                            if (criteriaName) {
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

                                // Cập nhật lại Criteria Map và danh sách
                                criteriaMap[criteriaKey] = currentCriteriaId;
                                allCriteria.push(savedCriteria.toObject());

                                results.created.push({
                                    row: rowNum,
                                    code: codeStr,
                                    message: `Tạo mới Tiêu chí ${criteriaKey}`
                                });
                                console.log(`  → Created new criteria: ${criteriaKey}`);
                            } else {
                                results.errors.push({
                                    row: rowNum,
                                    code: codeStr,
                                    message: `Không tìm thấy Tiêu chí ${criteriaKey} và thiếu tên để tạo mới`
                                });
                                currentCriteriaId = null;
                            }
                        }
                    }

                    if (currentCriteriaId) {
                        console.log(`  → Set current criteria: ${criteriaKey}`);
                    } else {
                        currentCriteriaId = null;
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
                            message: `Không tìm thấy tiêu chuẩn ${stdCode} hoặc tiêu chí ${criteriaKey}`
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
                            existingEvidence.programId = programId;
                            existingEvidence.organizationId = organizationId;
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
                                programId,
                                organizationId,
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
                            programId,
                            organizationId,
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
                console.error(`  → Error processing row ${rowNum}:`, error);
                results.errors.push({
                    row: rowNum,
                    code: codeStr,
                    message: error.message
                });
            }
        }

        console.log('\n=== Import Summary ===');
        console.log('Created:', results.created.length);
        console.log('Updated:', results.updated.length);
        console.log('Errors:', results.errors.length);

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