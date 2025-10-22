const XLSX = require('xlsx');
const Evidence = require('../models/Evidence/Evidence');
const mongoose = require('mongoose');

const removeLeadingZero = (str) => {
    return str.replace(/^0+/, '');
};

const identifyCodeType = (code) => {
    if (!code) return null;

    const trimmedCode = String(code).trim();

    const evidencePattern = /^([A-Y]\d+)\.(\d{1,2})\.(\d{1,2})\.(\d{2})$/;
    const evidenceMatch = trimmedCode.match(evidencePattern);
    if (evidenceMatch) {
        const standardCode = evidenceMatch[2].padStart(2, '0');
        const criteriaCode = evidenceMatch[3].padStart(2, '0');

        return {
            type: 'evidence',
            parsed: {
                prefixAndBox: evidenceMatch[1],
                standardCode: standardCode,
                criteriaCode: criteriaCode,
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

    const standardTextPattern = /Tiêu chuẩn\s+(\d{1,2})/i;
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

    const criteriaTextPattern = /Tiêu chí\s+(\d{1,2})\.(\d{1,2})/i;
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

const importEvidencesFromExcel = async (filePath, academicYearId, programId, organizationId, departmentId, userId, mode = 'create') => {
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

        if (!academicYearId || !programId || !organizationId || !departmentId || !userId) {
            throw new Error('Thiếu các tham số bắt buộc (academicYearId, programId, organizationId, departmentId, userId).');
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
            StandardModel.find({ academicYearId, programId, organizationId, departmentId }).lean(),
            CriteriaModel.find({ academicYearId, programId, organizationId, departmentId }).lean()
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
                    message: 'Không nhận diện được định dạng mã'
                });
                console.log(`  → Error: Unknown code format`);
                continue;
            }

            console.log(`  → Identified as: ${identified.type}`);

            try {
                if (identified.type === 'standard') {
                    currentStandardCode = identified.parsed.standardCode;
                    let displayCode = removeLeadingZero(currentStandardCode);
                    let standardName = nameStr || `Tiêu chuẩn ${displayCode}`;

                    currentStandardId = standardMap[currentStandardCode];

                    if (!currentStandardId && standardName) {
                        const newStandard = new StandardModel({
                            academicYearId,
                            code: currentStandardCode,
                            name: standardName,
                            programId,
                            organizationId,
                            departmentId,
                            createdBy: userId,
                            updatedBy: userId
                        });

                        const savedStandard = await newStandard.save();
                        currentStandardId = savedStandard._id;

                        standardMap[currentStandardCode] = currentStandardId;
                        allStandards.push(savedStandard.toObject());

                        results.created.push({ row: rowNum, code: currentStandardCode, name: standardName, type: 'standard' });
                        console.log(`  → CREATED new standard: ${currentStandardCode}`);

                    } else if (!currentStandardId) {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: `Không tìm thấy Tiêu chuẩn ${displayCode} và thiếu tên để tạo mới`
                        });
                    } else {
                        console.log(`  → Found existing standard: ${currentStandardCode}`);
                    }

                    currentCriteriaId = null;

                } else if (identified.type === 'criteria') {
                    currentStandardCode = identified.parsed.standardCode;
                    currentCriteriaCode = identified.parsed.criteriaCode;
                    const criteriaKey = `${currentStandardCode}.${currentCriteriaCode}`;
                    let displayCode = `${removeLeadingZero(currentStandardCode)}.${removeLeadingZero(currentCriteriaCode)}`;
                    let criteriaName = nameStr || `Tiêu chí ${criteriaKey}`;

                    currentStandardId = standardMap[currentStandardCode];

                    if (!currentStandardId) {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: `Tiêu chuẩn ${removeLeadingZero(currentStandardCode)} chưa tồn tại. Không thể tạo Tiêu chí ${displayCode}.`
                        });
                        currentCriteriaId = null;
                        continue;
                    }

                    currentCriteriaId = criteriaMap[criteriaKey];

                    if (!currentCriteriaId && criteriaName) {
                        const newCriteria = new CriteriaModel({
                            academicYearId,
                            code: currentCriteriaCode,
                            name: criteriaName,
                            programId,
                            organizationId,
                            departmentId,
                            standardId: currentStandardId,
                            createdBy: userId,
                            updatedBy: userId
                        });

                        const savedCriteria = await newCriteria.save();
                        currentCriteriaId = savedCriteria._id;

                        criteriaMap[criteriaKey] = currentCriteriaId;
                        allCriteria.push(savedCriteria.toObject());

                        results.created.push({ row: rowNum, code: criteriaKey, name: criteriaName, type: 'criteria' });
                        console.log(`  → CREATED new criteria: ${criteriaKey}`);

                    } else if (!currentCriteriaId) {
                        results.errors.push({
                            row: rowNum,
                            code: codeStr,
                            message: `Không tìm thấy Tiêu chí ${displayCode} và thiếu tên để tạo mới`
                        });
                    } else {
                        console.log(`  → Found existing criteria: ${criteriaKey}`);
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
                            message: `Không tìm thấy tiêu chuẩn ${removeLeadingZero(stdCode)} hoặc tiêu chí ${removeLeadingZero(stdCode)}.${removeLeadingZero(critCode)}. Hãy đảm bảo chúng nằm trên hoặc đã tồn tại.`
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
                            existingEvidence.departmentId = departmentId;
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
                                departmentId: departmentId,
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
                            departmentId: departmentId,
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
            message: `Import hoàn tất: ${createdStandards} Tiêu chuẩn, ${createdCriteria} Tiêu chí, ${createdEvidences} Minh chứng tạo mới, ${results.updated.length} Minh chứng cập nhật, ${results.errors.length} lỗi`,
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