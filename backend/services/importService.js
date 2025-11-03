const XLSX = require('xlsx');
const Evidence = require('../models/Evidence/Evidence');
const mongoose = require('mongoose');

const identifyCodeType = (code) => {
    if (!code) return null;

    const trimmedCode = code.trim();

    const evidencePattern = /^([A-Y]\d+)\.(\d{2})\.(\d{2})\.(\d{2})$/;
    const evidenceMatch = trimmedCode.match(evidencePattern);
    if (evidenceMatch) {
        return {
            type: 'evidence',
            parsed: {
                prefixAndBox: evidenceMatch[1],
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
            const code = std.code.padStart(2, '0');
            standardMap[code] = std._id;
        });

        const criteriaMap = {};
        allCriteria.forEach(crit => {
            const standard = allStandards.find(s =>
                s._id.toString() === crit.standardId.toString()
            );
            if (standard) {
                const stdCode = standard.code.padStart(2, '0');
                const critCode = crit.code.padStart(2, '0');
                const key = `${stdCode}.${critCode}`;
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

        for (let i = 0; i < dataWithHeader.length; i++) {
            const row = dataWithHeader[i];
            const rowNum = i + 2;

            const codeStr = String(row[codeCol] || '').trim();
            const nameStr = nameCol ? String(row[nameCol] || '').trim() : '';

            if (!codeStr && !nameStr) continue;
            if (!codeStr) continue;

            console.log(`Row ${rowNum}: Processing code="${codeStr}", name="${nameStr}"`);

            const identified = identifyCodeType(codeStr);

            if (!identified) {
                results.errors.push({
                    row: rowNum,
                    code: codeStr,
                    message: 'Định dạng mã không hợp lệ'
                });
                console.log(`  → Error: Invalid code format`);
                continue;
            }

            try {
                if (identified.type === 'standard') {
                    const stdCode = identified.parsed.standardCode;

                    if (standardMap[stdCode]) {
                        currentStandardId = standardMap[stdCode];
                        currentStandardCode = stdCode;
                        console.log(`  → Found existing standard: ${stdCode}`);
                    } else {
                        if (!nameStr) {
                            results.errors.push({
                                row: rowNum,
                                code: codeStr,
                                message: 'Thiếu tên tiêu chuẩn để tạo mới'
                            });
                            console.log(`  → Error: Missing name`);
                            continue;
                        }

                        const newStandard = new StandardModel({
                            academicYearId,
                            code: stdCode,
                            name: nameStr,
                            programId,
                            organizationId,
                            createdBy: userId
                        });

                        await newStandard.save();
                        standardMap[stdCode] = newStandard._id;
                        currentStandardId = newStandard._id;
                        currentStandardCode = stdCode;

                        results.created.push({
                            row: rowNum,
                            code: stdCode,
                            type: 'standard',
                            name: nameStr
                        });
                        console.log(`  → Created new standard`);
                    }

                } else if (identified.type === 'criteria') {
                    const critCode = identified.parsed.criteriaCode;
                    const stdCode = identified.parsed.standardCode;

                    if (!currentStandardId && !standardMap[stdCode]) {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: `Không tìm thấy tiêu chuẩn ${stdCode}`
                        });
                        console.log(`  → Error: Standard not found`);
                        continue;
                    }

                    if (!currentStandardId || currentStandardCode !== stdCode) {
                        currentStandardId = standardMap[stdCode];
                        currentStandardCode = stdCode;
                    }

                    const criteriaKey = `${stdCode}.${critCode}`;

                    if (criteriaMap[criteriaKey]) {
                        currentCriteriaId = criteriaMap[criteriaKey];
                        currentCriteriaCode = criteriaKey;
                        console.log(`  → Found existing criteria: ${criteriaKey}`);
                    } else {
                        if (!nameStr) {
                            results.errors.push({
                                row: rowNum,
                                code: codeStr,
                                message: `Không tìm thấy Tiêu chí ${criteriaKey} và thiếu tên để tạo mới`
                            });
                            console.log(`  → Error: Missing name`);
                            continue;
                        }

                        const newCriteria = new CriteriaModel({
                            academicYearId,
                            standardId: currentStandardId,
                            code: critCode,
                            name: nameStr,
                            programId,
                            organizationId,
                            createdBy: userId
                        });

                        await newCriteria.save();
                        criteriaMap[criteriaKey] = newCriteria._id;
                        currentCriteriaId = newCriteria._id;
                        currentCriteriaCode = criteriaKey;

                        results.created.push({
                            row: rowNum,
                            code: criteriaKey,
                            type: 'criteria',
                            name: nameStr
                        });
                        console.log(`  → Created new criteria`);
                    }

                } else if (identified.type === 'evidence') {
                    if (!nameStr) {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: 'Thiếu tên minh chứng'
                        });
                        console.log(`  → Error: Missing name`);
                        continue;
                    }

                    const stdCode = identified.parsed.standardCode;
                    const critCode = identified.parsed.criteriaCode;
                    const criteriaKey = `${stdCode}.${critCode}`;
                    const evidenceCode = identified.original;

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

                    const existingEvidence = await Evidence.findOne({
                        code: evidenceCode,
                        academicYearId
                    });

                    if (mode === 'update') {
                        if (existingEvidence) {
                            existingEvidence.name = nameStr;
                            existingEvidence.standardId = evidenceStandardId;
                            existingEvidence.criteriaId = evidenceCriteriaId;
                            existingEvidence.programId = programId;
                            existingEvidence.organizationId = organizationId;
                            existingEvidence.updatedBy = userId;

                            await existingEvidence.save();

                            results.updated.push({
                                row: rowNum,
                                code: evidenceCode,
                                name: nameStr
                            });
                            console.log(`  → Updated existing evidence`);
                        } else {
                            const newEvidence = new Evidence({
                                academicYearId,
                                code: evidenceCode,
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
                                code: evidenceCode,
                                name: nameStr
                            });
                            console.log(`  → Created new evidence`);
                        }
                    } else {
                        if (existingEvidence) {
                            results.errors.push({
                                row: rowNum,
                                code: evidenceCode,
                                message: 'Mã minh chứng đã tồn tại'
                            });
                            console.log(`  → Error: Evidence already exists`);
                            continue;
                        }

                        const newEvidence = new Evidence({
                            academicYearId,
                            code: evidenceCode,
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
                            code: evidenceCode,
                            name: nameStr
                        });
                        console.log(`  → Created new evidence`);
                    }

                    results.success.push({
                        row: rowNum,
                        code: evidenceCode,
                        name: nameStr,
                        action: existingEvidence ? 'updated' : 'created'
                    });
                }

            } catch (error) {
                const errorMessage = error.message || 'Lỗi không xác định';
                console.error(`  → Error processing row ${rowNum} (${identified.type}):`, errorMessage, error);

                if (error.name === 'ValidationError') {
                    const messages = Object.values(error.errors).map(err => err.message).join('; ');
                    results.errors.push({
                        row: rowNum,
                        code: codeStr,
                        message: `Lỗi Validation: ${messages}`
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
                        message: errorMessage
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

const importEvidencesFromTask = async (filePath, taskId, reportType, userId, academicYearId) => {
    try {
        const Task = mongoose.model('Task');
        const task = await Task.findById(taskId).lean();

        if (!task) {
            throw new Error('Không tìm thấy nhiệm vụ');
        }

        if (!task.assignedTo.map(id => id.toString()).includes(userId.toString())) {
            throw new Error('Bạn không được phép thực hiện hành động này');
        }

        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const errors = [];
        let successCount = 0;

        const startRow = reportType === 'overall_tdg' ? 3 : 2;

        const StandardModel = mongoose.model('Standard');
        const CriteriaModel = mongoose.model('Criteria');

        for (let i = startRow; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            try {
                let stdId = task.standardId;
                let critId = task.criteriaId;

                if (reportType === 'overall_tdg') {
                    const stdCode = row[1]?.toString().trim();
                    const critCode = row[3]?.toString().trim();
                    const evidenceCode = row[5]?.toString().trim().toUpperCase();

                    if (!stdCode || !critCode || !evidenceCode) {
                        errors.push(`Hàng ${i + 1}: Thiếu mã tiêu chuẩn, mã tiêu chí hoặc mã minh chứng`);
                        continue;
                    }

                    const std = await StandardModel.findOne({
                        academicYearId,
                        code: stdCode
                    });

                    if (!std) {
                        errors.push(`Hàng ${i + 1}: Không tìm thấy tiêu chuẩn ${stdCode}`);
                        continue;
                    }

                    const crit = await CriteriaModel.findOne({
                        academicYearId,
                        standardId: std._id,
                        code: critCode
                    });

                    if (!crit) {
                        errors.push(`Hàng ${i + 1}: Không tìm thấy tiêu chí ${critCode} trong tiêu chuẩn ${stdCode}`);
                        continue;
                    }

                    stdId = std._id;
                    critId = crit._id;
                } else if (reportType === 'standard') {
                    const critCode = row[1]?.toString().trim();
                    const evidenceCode = row[3]?.toString().trim().toUpperCase();

                    if (!critCode || !evidenceCode) {
                        errors.push(`Hàng ${i + 1}: Thiếu mã tiêu chí hoặc mã minh chứng`);
                        continue;
                    }

                    const crit = await CriteriaModel.findOne({
                        academicYearId,
                        standardId: task.standardId,
                        code: critCode
                    });

                    if (!crit) {
                        errors.push(`Hàng ${i + 1}: Không tìm thấy tiêu chí ${critCode}`);
                        continue;
                    }

                    critId = crit._id;
                } else if (reportType === 'criteria') {
                    const evidenceCode = row[2]?.toString().trim().toUpperCase();
                    if (!evidenceCode) {
                        errors.push(`Hàng ${i + 1}: Thiếu mã minh chứng`);
                        continue;
                    }
                }

                const existingEvidence = await Evidence.findOne({
                    code: row[reportType === 'overall_tdg' ? 5 : (reportType === 'standard' ? 3 : 2)]?.toString().trim().toUpperCase(),
                    academicYearId
                });

                if (!existingEvidence) {
                    const evidenceName = row[reportType === 'overall_tdg' ? 6 : (reportType === 'standard' ? 4 : 2)]?.toString().trim();
                    const newEvidence = new Evidence({
                        academicYearId,
                        code: row[reportType === 'overall_tdg' ? 5 : (reportType === 'standard' ? 3 : 2)]?.toString().trim().toUpperCase(),
                        name: evidenceName || 'Minh chứng',
                        standardId: stdId,
                        criteriaId: critId,
                        status: 'new',
                        createdBy: userId,
                        updatedBy: userId
                    });

                    await newEvidence.save();
                }
                successCount++;
            } catch (error) {
                errors.push(`Hàng ${i + 1}: ${error.message}`);
            }
        }

        return {
            success: true,
            message: 'Import hoàn tất',
            data: {
                successCount,
                errors,
                details: {
                    errors
                }
            }
        };

    } catch (error) {
        console.error('Import from task error:', error);
        throw new Error('Lỗi khi import: ' + error.message);
    }
};

module.exports = {
    importEvidencesFromExcel,
    identifyCodeType,
    importEvidencesFromTask
};