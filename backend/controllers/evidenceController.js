const Evidence = require('../models/Evidence');
const { Standard, Criteria } = require('../models/Program');
const File = require('../models/File');
const exportService = require('../services/exportService');
const importService = require('../services/importService');
const searchService = require('../services/searchService');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

const getEvidences = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            programId,
            organizationId,
            standardId,
            criteriaId,
            status,
            documentType,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        // Xây dựng query dựa trên quyền của user
        if (req.user.role !== 'admin') {
            const accessibleStandards = req.user.standardAccess || [];
            const accessibleCriteria = req.user.criteriaAccess || [];

            if (accessibleStandards.length > 0 || accessibleCriteria.length > 0) {
                query.$or = [];
                if (accessibleStandards.length > 0) {
                    query.$or.push({ standardId: { $in: accessibleStandards } });
                }
                if (accessibleCriteria.length > 0) {
                    query.$or.push({ criteriaId: { $in: accessibleCriteria } });
                }
            } else {
                // Nếu không có quyền nào, không trả về kết quả nào
                return res.json({
                    success: true,
                    data: {
                        evidences: [],
                        pagination: {
                            current: pageNum,
                            pages: 0,
                            total: 0,
                            hasNext: false,
                            hasPrev: false
                        }
                    }
                });
            }
        }

        // Áp dụng các filter
        if (search) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { documentNumber: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (programId) query.programId = programId;
        if (organizationId) query.organizationId = organizationId;
        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;
        if (status) query.status = status;
        if (documentType) query.documentType = documentType;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [evidences, total] = await Promise.all([
            Evidence.find(query)
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('files', 'originalName size mimeType uploadedAt')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Evidence.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                evidences,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get evidences error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách minh chứng'
        });
    }
};

const getEvidenceById = async (req, res) => {
    try {
        const { id } = req.params;

        const evidence = await Evidence.findById(id)
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email')
            .populate({
                path: 'files',
                select: 'originalName storedName size mimeType uploadedAt downloadCount',
                populate: {
                    path: 'uploadedBy',
                    select: 'fullName email'
                }
            });

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        // Kiểm tra quyền truy cập
        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(evidence.standardId._id) &&
            !req.user.hasCriteriaAccess(evidence.criteriaId._id)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập minh chứng này'
            });
        }

        res.json({
            success: true,
            data: evidence
        });

    } catch (error) {
        console.error('Get evidence by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin minh chứng'
        });
    }
};

// Tạo minh chứng mới
const createEvidence = async (req, res) => {
    try {
        const {
            name,
            description,
            programId,
            organizationId,
            standardId,
            criteriaId,
            code,
            documentNumber,
            documentType,
            issueDate,
            effectiveDate,
            issuingAgency,
            notes,
            tags
        } = req.body;

        // Kiểm tra quyền truy cập
        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(standardId) &&
            !req.user.hasCriteriaAccess(criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo minh chứng cho tiêu chuẩn/tiêu chí này'
            });
        }

        const [standard, criteria] = await Promise.all([
            Standard.findById(standardId),
            Criteria.findById(criteriaId)
        ]);

        if (!standard || !criteria) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu chuẩn hoặc tiêu chí không tồn tại'
            });
        }

        let evidenceCode = code;
        if (!evidenceCode) {
            evidenceCode = await Evidence.generateCode(
                standard.code,
                criteria.code
            );
        } else {
            const existingEvidence = await Evidence.findOne({ code: evidenceCode });
            if (existingEvidence) {
                return res.status(400).json({
                    success: false,
                    message: `Mã minh chứng ${evidenceCode} đã tồn tại`
                });
            }
        }

        const evidence = new Evidence({
            name: name.trim(),
            description: description?.trim(),
            code: evidenceCode,
            programId,
            organizationId,
            standardId,
            criteriaId,
            documentNumber: documentNumber?.trim(),
            documentType,
            issueDate: issueDate ? new Date(issueDate) : undefined,
            effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
            issuingAgency: issuingAgency?.trim(),
            notes: notes?.trim(),
            tags: tags || [],
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await evidence.save();

        await evidence.populate([
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'criteriaId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo minh chứng thành công',
            data: evidence
        });

    } catch (error) {
        console.error('Create evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo minh chứng'
        });
    }
};

const updateEvidence = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const evidence = await Evidence.findById(id);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(evidence.standardId) &&
            !req.user.hasCriteriaAccess(evidence.criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền cập nhật minh chứng này'
            });
        }

        if (updateData.code && updateData.code !== evidence.code) {
            const existingEvidence = await Evidence.findOne({
                code: updateData.code,
                _id: { $ne: id }
            });
            if (existingEvidence) {
                return res.status(400).json({
                    success: false,
                    message: `Mã minh chứng ${updateData.code} đã tồn tại`
                });
            }
        }

        const allowedFields = [
            'name', 'description', 'documentNumber', 'documentType',
            'issueDate', 'effectiveDate', 'issuingAgency', 'notes', 'tags', 'status'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                evidence[field] = updateData[field];
            }
        });

        evidence.updatedBy = req.user.id;
        await evidence.save();

        await evidence.populate([
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'criteriaId', select: 'name code' },
            { path: 'updatedBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật minh chứng thành công',
            data: evidence
        });

    } catch (error) {
        console.error('Update evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật minh chứng'
        });
    }
};

const deleteEvidence = async (req, res) => {
    try {
        const { id } = req.params;

        const evidence = await Evidence.findById(id);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(evidence.standardId) &&
            !req.user.hasCriteriaAccess(evidence.criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xóa minh chứng này'
            });
        }

        const files = await File.find({ evidenceId: id });
        for (const file of files) {
            if (fs.existsSync(file.filePath)) {
                fs.unlinkSync(file.filePath);
            }
            await File.findByIdAndDelete(file._id);
        }

        await Evidence.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa minh chứng thành công'
        });

    } catch (error) {
        console.error('Delete evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa minh chứng'
        });
    }
};

const bulkDeleteEvidences = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách ID không hợp lệ'
            });
        }

        const evidences = await Evidence.find({ _id: { $in: ids } });
        for (const evidence of evidences) {
            if (req.user.role !== 'admin' &&
                !req.user.hasStandardAccess(evidence.standardId) &&
                !req.user.hasCriteriaAccess(evidence.criteriaId)) {
                return res.status(403).json({
                    success: false,
                    message: `Không có quyền xóa minh chứng ${evidence.code}`
                });
            }
        }

        const files = await File.find({ evidenceId: { $in: ids } });
        for (const file of files) {
            if (fs.existsSync(file.filePath)) {
                fs.unlinkSync(file.filePath);
            }
        }

        await File.deleteMany({ evidenceId: { $in: ids } });
        await Evidence.deleteMany({ _id: { $in: ids } });

        res.json({
            success: true,
            message: `Xóa thành công ${evidences.length} minh chứng`
        });

    } catch (error) {
        console.error('Bulk delete evidences error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa minh chứng'
        });
    }
};

const copyEvidence = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetStandardId, targetCriteriaId, newCode } = req.body;

        const evidence = await Evidence.findById(id);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        const existingEvidence = await Evidence.findOne({ code: newCode });
        if (existingEvidence) {
            return res.status(400).json({
                success: false,
                message: `Mã minh chứng ${newCode} đã tồn tại`
            });
        }

        const copiedEvidence = await evidence.copyTo(
            targetStandardId,
            targetCriteriaId,
            newCode,
            req.user.id
        );

        await copiedEvidence.save();

        res.status(201).json({
            success: true,
            message: 'Sao chép minh chứng thành công',
            data: copiedEvidence
        });

    } catch (error) {
        console.error('Copy evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi sao chép minh chứng'
        });
    }
};

const moveEvidence = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetStandardId, targetCriteriaId, newCode } = req.body;

        const evidence = await Evidence.findById(id);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        const existingEvidence = await Evidence.findOne({
            code: newCode,
            _id: { $ne: id }
        });
        if (existingEvidence) {
            return res.status(400).json({
                success: false,
                message: `Mã minh chứng ${newCode} đã tồn tại`
            });
        }

        await evidence.moveTo(targetStandardId, targetCriteriaId, newCode, req.user.id);
        await evidence.save();

        res.json({
            success: true,
            message: 'Di chuyển minh chứng thành công',
            data: evidence
        });

    } catch (error) {
        console.error('Move evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi di chuyển minh chứng'
        });
    }
};

const generateCode = async (req, res) => {
    try {
        const { standardCode, criteriaCode, boxNumber = 1 } = req.body;

        const code = await Evidence.generateCode(standardCode, criteriaCode, boxNumber);

        res.json({
            success: true,
            data: { code }
        });

    } catch (error) {
        console.error('Generate code error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo mã minh chứng'
        });
    }
};

const getEvidenceTree = async (req, res) => {
    try {
        const { programId, organizationId } = req.query;

        const evidences = await Evidence.find({
            programId,
            organizationId,
            status: 'active'
        })
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .sort({ 'standardId.code': 1, 'criteriaId.code': 1, code: 1 });

        const tree = {};
        evidences.forEach(evidence => {
            const standardKey = `${evidence.standardId.code} - ${evidence.standardId.name}`;
            const criteriaKey = `${evidence.criteriaId.code} - ${evidence.criteriaId.name}`;

            if (!tree[standardKey]) {
                tree[standardKey] = {
                    standard: evidence.standardId,
                    criteria: {}
                };
            }

            if (!tree[standardKey].criteria[criteriaKey]) {
                tree[standardKey].criteria[criteriaKey] = {
                    criteria: evidence.criteriaId,
                    evidences: []
                };
            }

            tree[standardKey].criteria[criteriaKey].evidences.push({
                _id: evidence._id,
                code: evidence.code,
                name: evidence.name,
                fileCount: evidence.files.length
            });
        });

        res.json({
            success: true,
            data: tree
        });

    } catch (error) {
        console.error('Get evidence tree error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy cây minh chứng'
        });
    }
};

const advancedSearch = async (req, res) => {
    try {
        const searchParams = req.body;
        const evidences = await Evidence.advancedSearch(searchParams);

        res.json({
            success: true,
            data: evidences
        });

    } catch (error) {
        console.error('Advanced search error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm nâng cao'
        });
    }
};

const bulkDownload = async (req, res) => {
    try {
        const { ids } = req.body;

        const evidences = await Evidence.find({ _id: { $in: ids } })
            .populate('files');

        if (evidences.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng nào'
            });
        }

        const archive = archiver('zip');
        const filename = `evidences_${Date.now()}.zip`;

        res.attachment(filename);
        archive.pipe(res);

        for (const evidence of evidences) {
            for (const file of evidence.files) {
                if (fs.existsSync(file.filePath)) {
                    archive.file(file.filePath, {
                        name: `${evidence.code}/${file.storedName}`
                    });
                }
            }
        }

        await archive.finalize();

    } catch (error) {
        console.error('Bulk download error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải xuống'
        });
    }
};

const importEvidences = async (req, res) => {
    try {
        const file = req.file;
        const { programId, organizationId } = req.body;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file được upload'
            });
        }

        const result = await importService.importEvidences(
            file.path,
            programId,
            organizationId,
            req.user.id
        );

        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        res.json(result);

    } catch (error) {
        console.error('Import evidences error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi import minh chứng'
        });
    }
};

const downloadImportTemplate = async (req, res) => {
    try {
        const { programId, organizationId } = req.query;

        const templateData = await importService.generateTemplate(programId, organizationId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="evidence_import_template.xlsx"');

        res.send(templateData);

    } catch (error) {
        console.error('Download import template error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải template'
        });
    }
};

const exportEvidences = async (req, res) => {
    try {
        const filters = req.query;
        const format = filters.format || 'xlsx';

        const data = await exportService.exportEvidences(filters, format);

        const filename = `evidences_export_${Date.now()}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        if (format === 'xlsx') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        } else {
            res.setHeader('Content-Type', 'text/csv');
        }

        res.send(data);

    } catch (error) {
        console.error('Export evidences error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi export minh chứng'
        });
    }
};

const getStatistics = async (req, res) => {
    try {
        const { programId, organizationId, standardId, criteriaId } = req.query;

        let matchStage = {};
        if (programId) matchStage.programId = mongoose.Types.ObjectId(programId);
        if (organizationId) matchStage.organizationId = mongoose.Types.ObjectId(organizationId);
        if (standardId) matchStage.standardId = mongoose.Types.ObjectId(standardId);
        if (criteriaId) matchStage.criteriaId = mongoose.Types.ObjectId(criteriaId);

        const stats = await Evidence.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalEvidences: { $sum: 1 },
                    activeEvidences: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    inactiveEvidences: {
                        $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
                    },
                    totalFiles: { $sum: { $size: '$files' } }
                }
            }
        ]);

        const result = stats[0] || {
            totalEvidences: 0,
            activeEvidences: 0,
            inactiveEvidences: 0,
            totalFiles: 0
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê'
        });
    }
};

const searchInFiles = async (req, res) => {
    try {
        const { keyword } = req.query;

        const results = await searchService.searchInFiles(keyword);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Search in files error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm trong file'
        });
    }
};

module.exports = {
    getEvidences,
    getEvidenceById,
    createEvidence,
    updateEvidence,
    deleteEvidence,
    bulkDeleteEvidences,
    copyEvidence,
    moveEvidence,
    generateCode,
    getEvidenceTree,
    advancedSearch,
    bulkDownload,
    importEvidences,
    downloadImportTemplate,
    exportEvidences,
    getStatistics,
    searchInFiles
};