const Evidence = require('../../models/Evidence/Evidence');
const File = require('../../models/Evidence/File');
const AcademicYear = require('../../models/system/AcademicYear');
const exportService = require('../../services/exportService');
const { importEvidencesFromExcel } = require('../../services/importService'); // <- Đã require đúng hàm
const searchService = require('../../services/searchService');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

let Standard, Criteria;

try {
    const ProgramModel = require('../../models/Evidence/Program');
    if (ProgramModel.Standard && ProgramModel.Criteria) {
        Standard = ProgramModel.Standard;
        Criteria = ProgramModel.Criteria;
    } else {
        Standard = ProgramModel;
        Criteria = ProgramModel;
    }
} catch (e) {
    try {
        Standard = require('../../models/Evidence/Standard');
        Criteria = require('../../models/Evidence/Criteria');
    } catch (e2) {
        console.error('Cannot load Standard and Criteria models:', e2);
    }
}

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

        const academicYearId = req.academicYearId;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

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
                        },
                        academicYear: req.currentAcademicYear
                    }
                });
            }
        }

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
        if (status) { query.status = status; }
        if (documentType) query.documentType = documentType;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [evidences, total] = await Promise.all([
            Evidence.find(query)
                .populate('academicYearId', 'name code')
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('files', 'originalName size mimeType uploadedAt approvalStatus rejectionReason uploadedBy') // Thêm approvalStatus, rejectionReason, uploadedBy
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
                },
                academicYear: req.currentAcademicYear
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
        const academicYearId = req.academicYearId;

        const evidence = await Evidence.findOne({ _id: id, academicYearId })
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email')
            .populate({
                path: 'files',
                select: 'originalName storedName size mimeType uploadedAt downloadCount approvalStatus rejectionReason uploadedBy',
                populate: {
                    path: 'uploadedBy',
                    select: 'fullName email'
                }
            });

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng trong năm học này'
            });
        }

        // ==========================================================
        // === SỬA ĐỔI: BỎ HOÀN TOÀN LOGIC KIỂM TRA QUYỀN TRUY CẬP ===
        // MỌI NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP ĐỀU CÓ QUYỀN TRUY CẬP CHI TIẾT
        /*
        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(evidence.standardId._id) &&
            !req.user.hasCriteriaAccess(evidence.criteriaId._id)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập minh chứng này'
            });
        }
        */
        // ==========================================================

        if (evidence.status === 'new') {
            evidence.status = 'in_progress';
            await evidence.save();
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

        const academicYearId = req.academicYearId;

        console.log('Creating evidence with data:', { name, standardId, criteriaId, academicYearId });

        if (!name || !programId || !organizationId || !standardId || !criteriaId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(standardId) &&
            !req.user.hasCriteriaAccess(criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo minh chứng cho tiêu chuẩn/tiêu chí này'
            });
        }

        if (!Standard || !Criteria) {
            console.error('Standard or Criteria model not loaded!');
            return res.status(500).json({
                success: false,
                message: 'Lỗi cấu hình hệ thống: không load được model Standard/Criteria'
            });
        }

        console.log('Finding standard and criteria...');
        const mongoose = require('mongoose');
        const StandardModel = mongoose.model('Standard');
        const CriteriaModel = mongoose.model('Criteria');

        const [standard, criteria] = await Promise.all([
            StandardModel.findOne({ _id: standardId, academicYearId }),
            CriteriaModel.findOne({ _id: criteriaId, academicYearId })
        ]);

        console.log('Found:', { standard: standard?.code, criteria: criteria?.code });

        if (!standard || !criteria) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu chuẩn hoặc tiêu chí không tồn tại trong năm học này'
            });
        }

        let evidenceCode = code;

        if (!evidenceCode) {
            try {
                evidenceCode = await Evidence.generateCode(
                    academicYearId,
                    standard.code,
                    criteria.code,
                    1
                );
                console.log('Generated code:', evidenceCode);
            } catch (genError) {
                console.error('Code generation error:', genError);
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi tạo mã minh chứng tự động: ' + genError.message
                });
            }
        } else {
            const existingEvidence = await Evidence.findOne({
                code: evidenceCode,
                academicYearId
            });

            if (existingEvidence) {
                return res.status(400).json({
                    success: false,
                    message: `Mã minh chứng ${evidenceCode} đã tồn tại trong năm học này`
                });
            }
        }

        const evidence = new Evidence({
            academicYearId,
            name: name.trim(),
            status: 'new',
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
            { path: 'academicYearId', select: 'name code' },
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
        console.error('Error stack:', error.stack);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mã minh chứng đã tồn tại'
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo minh chứng: ' + error.message
        });
    }
};

const updateEvidence = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;

        const evidence = await Evidence.findOne({ _id: id, academicYearId });
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng trong năm học này'
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
                academicYearId,
                _id: { $ne: id }
            });
            if (existingEvidence) {
                return res.status(400).json({
                    success: false,
                    message: `Mã minh chứng ${updateData.code} đã tồn tại trong năm học này`
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
            { path: 'academicYearId', select: 'name code' },
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
        const academicYearId = req.academicYearId;

        const evidence = await Evidence.findOne({ _id: id, academicYearId });
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng trong năm học này'
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

const generateCode = async (req, res) => {
    try {
        const { standardCode, criteriaCode, boxNumber = 1 } = req.body;
        const academicYearId = req.academicYearId;

        const code = await Evidence.generateCode(academicYearId, standardCode, criteriaCode, boxNumber);

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
        const academicYearId = req.academicYearId;

        const tree = await Evidence.getTreeByAcademicYear(academicYearId, programId, organizationId);

        res.json({
            success: true,
            data: {
                tree,
                academicYear: req.currentAcademicYear
            }
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
        searchParams.academicYearId = req.academicYearId;

        const evidences = await Evidence.advancedSearch(searchParams);

        res.json({
            success: true,
            data: {
                evidences,
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Advanced search error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm nâng cao'
        });
    }
};

const getStatistics = async (req, res) => {
    try {
        const { programId, organizationId, standardId, criteriaId } = req.query;
        const academicYearId = req.academicYearId;

        let matchStage = { academicYearId };

        if (programId) matchStage.programId = programId;
        if (organizationId) matchStage.organizationId = organizationId;
        if (standardId) matchStage.standardId = standardId;
        if (criteriaId) matchStage.criteriaId = criteriaId;

        const stats = await Evidence.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalEvidences: { $sum: 1 },
                    // Loại bỏ các trường gây lỗi (activeEvidences, inactiveEvidences, totalFilesSize, totalFilesSizeByExtension)

                    newEvidences: {
                        $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
                    },
                    inProgressEvidences: {
                        $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
                    },
                    completedEvidences: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    approvedEvidences: {
                        $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
                    },
                    rejectedEvidences: {
                        $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                    },
                    // Chỉ giữ lại totalFiles (tính theo độ dài mảng, an toàn)
                    totalFiles: { $sum: { $size: '$files' }
                    },
                }
            }
        ]);

        const result = stats[0] || {
            totalEvidences: 0,
            newEvidences: 0,
            inProgressEvidences: 0,
            completedEvidences: 0,
            approvedEvidences: 0,
            rejectedEvidences: 0,
            totalFiles: 0
        };

        // Bổ sung tính TotalFilesSize một cách an toàn bằng truy vấn phụ
        let totalFilesSize = 0;
        try {
            const evidenceIds = await Evidence.find(matchStage).distinct('_id');

            const fileStats = await File.aggregate([
                { $match: { evidenceId: { $in: evidenceIds }, type: 'file' } },
                { $group: { _id: null, totalSize: { $sum: '$size' } } }
            ]);
            totalFilesSize = fileStats[0]?.totalSize || 0;
        } catch (err) {
            console.warn("Could not calculate totalFilesSize, returning 0:", err.message);
        }


        res.json({
            success: true,
            data: {
                ...result,
                totalFilesSize: totalFilesSize, // Thêm trường totalFilesSize đã tính toán an toàn
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Get statistics error:', error);
        // Trả về thông báo lỗi chi tiết để hỗ trợ debug
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê: ' + error.message
        });
    }
};

const copyEvidenceToAnotherYear = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetAcademicYearId, targetStandardId, targetCriteriaId, newCode } = req.body;

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin và manager mới có quyền sao chép minh chứng giữa các năm học'
            });
        }

        const evidence = await Evidence.findOne({
            _id: id,
            academicYearId: req.academicYearId
        });

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        const targetAcademicYear = await AcademicYear.findById(targetAcademicYearId);
        if (!targetAcademicYear) {
            return res.status(404).json({
                success: false,
                message: 'Năm học đích không tồn tại'
            });
        }

        const existingEvidence = await Evidence.findOne({
            code: newCode,
            academicYearId: targetAcademicYearId
        });
        if (existingEvidence) {
            return res.status(400).json({
                success: false,
                message: `Mã minh chứng ${newCode} đã tồn tại trong năm học đích`
            });
        }

        const copiedEvidence = await evidence.copyTo(
            targetAcademicYearId,
            targetStandardId,
            targetCriteriaId,
            newCode,
            req.user.id
        );

        await copiedEvidence.save();

        res.status(201).json({
            success: true,
            message: 'Sao chép minh chứng sang năm học khác thành công',
            data: copiedEvidence
        });

    } catch (error) {
        console.error('Copy evidence to another year error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi sao chép minh chứng'
        });
    }
};

const importEvidences = async (req, res) => {
    try {
        const file = req.file;
        const { programId, organizationId, mode } = req.body;

        // Lấy từ middleware và auth thay vì req.body
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file được upload'
            });
        }

        const result = await importEvidencesFromExcel(
            file.path,
            academicYearId,
            programId,
            organizationId,
            userId,
            mode
        );

        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        console.log('Import success/failure summary:', result);

        res.json(result);

    } catch (error) {
        console.error('Import evidences error:', error);
        if (error.message.includes('Lỗi khi import file:')) {
            return res.status(400).json({
                success: false,
                message: error.message.replace('Lỗi khi import file: ', '')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi import minh chứng: ' + error.message
        });
    }
};

const incrementEvidenceDownload = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const evidence = await Evidence.findOne({ _id: id, academicYearId });
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        await evidence.incrementDownload(req.user.id);

        res.json({
            success: true,
            message: 'Tăng lượt tải thành công',
            data: evidence.downloadStats
        });

    } catch (error) {
        console.error('Increment download error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tăng lượt tải'
        });
    }
};

const validateEvidenceFileName = async (req, res) => {
    try {
        const { id } = req.params;
        const { fileName } = req.body;
        const academicYearId = req.academicYearId;

        const evidence = await Evidence.findOne({ _id: id, academicYearId });
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        try {
            evidence.validateFileName(fileName);
            res.json({
                success: true,
                message: 'Tên file hợp lệ'
            });
        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }

    } catch (error) {
        console.error('Validate file name error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi kiểm tra tên file'
        });
    }
};

const moveEvidence = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetStandardId, targetCriteriaId, newCode } = req.body;
        const academicYearId = req.academicYearId;

        // Tìm minh chứng trong năm học hiện tại
        const evidence = await Evidence.findOne({ _id: id, academicYearId });
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng trong năm học này'
            });
        }

        // Kiểm tra quyền
        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(evidence.standardId) &&
            !req.user.hasCriteriaAccess(evidence.criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền di chuyển minh chứng này'
            });
        }

        // Kiểm tra trùng mã mới
        const existingEvidence = await Evidence.findOne({
            code: newCode,
            academicYearId,
            _id: { $ne: id }
        });
        if (existingEvidence) {
            return res.status(400).json({
                success: false,
                message: `Mã minh chứng ${newCode} đã tồn tại trong năm học này`
            });
        }

        // Gọi method moveTo từ model
        const movedEvidence = await evidence.moveTo(
            targetStandardId,
            targetCriteriaId,
            newCode,
            req.user.id
        );

        res.json({
            success: true,
            message: 'Di chuyển minh chứng thành công',
            data: movedEvidence
        });

    } catch (error) {
        console.error('Move evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi di chuyển minh chứng'
        });
    }
};


const getFullEvidenceTree = async (req, res) => {
    try {
        const { programId, organizationId } = req.query;
        const academicYearId = req.academicYearId;

        console.log('getFullEvidenceTree called:', { programId, organizationId, academicYearId });

        if (!programId || !organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin programId hoặc organizationId'
            });
        }

        const mongoose = require('mongoose');
        const StandardModel = mongoose.model('Standard');
        const CriteriaModel = mongoose.model('Criteria');

        const [standards, allCriteria, evidences] = await Promise.all([
            StandardModel.find({ academicYearId, programId }).sort({ code: 1 }).lean(),
            CriteriaModel.find({ academicYearId, programId }).sort({ standardCode: 1, code: 1 }).lean(),
            Evidence.find({
                academicYearId,
                programId,
                organizationId
            })
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .populate({
                    path: 'files',
                    select: 'originalName size mimeType uploadedAt approvalStatus rejectionReason uploadedBy'
                })
                .sort({ code: 1 })
                .lean()
        ]);

        console.log('Query results:', {
            standards: standards.length,
            criteria: allCriteria.length,
            evidences: evidences.length
        });

        const tree = [];

        standards.forEach(standard => {
            const standardCriteria = allCriteria.filter(c =>
                c.standardCode === standard.code ||
                c.standardId?.toString() === standard._id.toString()
            );

            console.log(`Standard ${standard.code} has ${standardCriteria.length} criteria`);

            const standardNode = {
                id: standard._id,
                code: standard.code,
                name: standard.name,
                type: 'standard',
                hasEvidence: false,
                criteria: []
            };

            standardCriteria.forEach(criterion => {
                const criterionEvidences = evidences.filter(e => {
                    const matchByStandardCode = e.standardId?.code === standard.code;
                    const matchByCriteriaCode = e.criteriaId?.code === criterion.code;
                    const matchByCriteriaId = e.criteriaId?._id?.toString() === criterion._id.toString();

                    return matchByStandardCode && (matchByCriteriaCode || matchByCriteriaId);
                });

                console.log(`  Criteria ${criterion.code} has ${criterionEvidences.length} evidences`);

                const criterionNode = {
                    id: criterion._id,
                    code: criterion.code,
                    name: criterion.name,
                    type: 'criteria',
                    hasEvidence: criterionEvidences.length > 0,
                    evidences: criterionEvidences.map(e => ({
                        id: e._id,
                        code: e.code,
                        name: e.name,
                        fileCount: e.files?.length || 0,
                        status: e.status
                    }))
                };

                if (criterionNode.hasEvidence) {
                    standardNode.hasEvidence = true;
                }

                standardNode.criteria.push(criterionNode);
            });

            tree.push(standardNode);
        });

        // Tính statistics
        const statistics = {
            totalStandards: standards.length,
            totalCriteria: allCriteria.length,
            totalEvidences: evidences.length,
            standardsWithEvidence: tree.filter(s => s.hasEvidence).length,
            criteriaWithEvidence: tree.reduce((sum, s) =>
                sum + s.criteria.filter(c => c.hasEvidence).length, 0
            )
        };

        console.log('Statistics:', statistics);
        console.log('Tree structure:', JSON.stringify(tree, null, 2));

        res.json({
            success: true,
            data: {
                tree,
                academicYear: req.currentAcademicYear,
                statistics
            }
        });

    } catch (error) {
        console.error('Get full evidence tree error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy cây minh chứng đầy đủ: ' + error.message
        });
    }
};

const exportEvidences = async (req, res) => {
    try {
        const { programId, organizationId, format = 'xlsx' } = req.query;
        const academicYearId = req.academicYearId;

        console.log('Export request:', { programId, organizationId, academicYearId, format });

        if (!programId || !organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin programId hoặc organizationId'
            });
        }

        const evidences = await Evidence.find({
            academicYearId,
            programId,
            organizationId
        })
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('files')
            .sort({ code: 1 })
            .lean();

        console.log(`Found ${evidences.length} evidences to export`);

        const XLSX = require('xlsx');
        const workbook = XLSX.utils.book_new();

        const data = [
            ['STT', 'Mã minh chứng', 'Tên minh chứng', 'Tiêu chuẩn', 'Tiêu chí', 'Số file', 'Trạng thái']
        ];

        const statusMap = {
            'active': 'Hoạt động',
            'inactive': 'Không hoạt động',
            'new': 'Mới',
            'in_progress': 'Đang thực hiện',
            'completed': 'Hoàn thành',
            'approved': 'Đã duyệt',
            'rejected': 'Từ chối'
        };

        evidences.forEach((evidence, index) => {
            data.push([
                index + 1,
                evidence.code || '',
                evidence.name || '',
                evidence.standardId ? `${evidence.standardId.code} - ${evidence.standardId.name}` : '',
                evidence.criteriaId ? `${evidence.criteriaId.code} - ${evidence.criteriaId.name}` : '',
                evidence.files?.length || 0,
                statusMap[evidence.status] || 'Mới'
            ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(data);

        worksheet['!cols'] = [
            { wch: 5 },
            { wch: 15 },
            { wch: 50 },
            { wch: 40 },
            { wch: 40 },
            { wch: 10 },
            { wch: 12 }
        ];

        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách minh chứng');

        // Tạo buffer từ workbook
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Đặt headers cho response
        const filename = `minh-chung_${req.currentAcademicYear?.code || 'export'}_${Date.now()}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Length', buffer.length);

        // Gửi buffer
        res.send(buffer);

        console.log('Export completed successfully');

    } catch (error) {
        console.error('Export evidences error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi export minh chứng: ' + error.message
        });
    }
};

const approveFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { status, rejectionReason } = req.body;

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền duyệt file'
            });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        file.approvalStatus = status;
        file.approvedBy = req.user.id;
        file.approvalDate = new Date();

        if (status === 'rejected' && rejectionReason) {
            file.rejectionReason = rejectionReason;
        }

        await file.save();

        const evidence = await Evidence.findById(file.evidenceId);
        if (evidence) {
            await evidence.updateStatus();
        }

        res.json({
            success: true,
            message: status === 'approved' ? 'Duyệt file thành công' : 'Từ chối file thành công',
            data: file
        });

    } catch (error) {
        console.error('Approve file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi duyệt file'
        });
    }
};

module.exports = {
    getEvidences,
    getEvidenceById,
    createEvidence,
    updateEvidence,
    deleteEvidence,
    generateCode,
    getEvidenceTree,
    advancedSearch,
    getStatistics,
    copyEvidenceToAnotherYear,
    exportEvidences,
    importEvidences,
    incrementEvidenceDownload,
    validateEvidenceFileName,
    moveEvidence,
    getFullEvidenceTree,
    approveFile
};