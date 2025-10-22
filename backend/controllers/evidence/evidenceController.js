const Evidence = require('../../models/Evidence/Evidence');
const File = require('../../models/Evidence/File');
const AcademicYear = require('../../models/system/AcademicYear');
const exportService = require('../../services/exportService');
const { importEvidencesFromExcel } = require('../../services/importService');
const searchService = require('../../services/searchService');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const Department = require('../../models/User/Department');
const User = require('../../models/User/User');
const Notification = require('../../models/system/Notification');

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
            departmentId,
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

        let filterDepartmentIds = [];
        if (departmentId) {
            filterDepartmentIds = Array.isArray(departmentId) ? filterDepartmentIds : departmentId.split(',');
        }


        if (req.user.role !== 'admin') {
            if (!req.user.department) {
                query.departmentId = null;
            } else {
                const userDeptId = req.user.department.toString();

                if (filterDepartmentIds.length > 0) {
                    if (!filterDepartmentIds.includes(userDeptId)) {
                        return res.status(403).json({
                            success: false,
                            message: 'Bạn không có quyền xem minh chứng của phòng ban khác.'
                        });
                    }
                    query.departmentId = userDeptId;
                } else {
                    query.departmentId = userDeptId;
                }
            }
        } else if (filterDepartmentIds.length > 0) {
            query.departmentId = { $in: filterDepartmentIds };
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
                .populate('departmentId', 'name code')
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('files', 'originalName size mimeType uploadedAt approvalStatus rejectionReason uploadedBy')
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
            .populate('departmentId', 'name code')
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

        if (req.user.role !== 'admin') {
            if (evidence.departmentId._id.toString() !== req.user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem minh chứng của phòng ban khác'
                });
            }
        }

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
            departmentId,
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

        console.log('Creating evidence with data:', { name, standardId, criteriaId, academicYearId, departmentId });

        if (!name || !programId || !organizationId || !departmentId || !standardId || !criteriaId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        if (req.user.role !== 'admin') {
            if (req.user.role !== 'manager') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền tạo minh chứng'
                });
            }
            if (!req.user.department || req.user.department !== departmentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền tạo minh chứng cho phòng ban của bạn'
                });
            }
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
            departmentId,
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
            { path: 'departmentId', select: 'name code' },
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

        if (req.user.role !== 'admin') {
            if (req.user.role !== 'manager') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền cập nhật minh chứng'
                });
            }
            if (evidence.departmentId.toString() !== req.user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền cập nhật minh chứng của phòng ban bạn'
                });
            }
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
            { path: 'departmentId', select: 'name code' },
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

        if (req.user.role !== 'admin') {
            if (req.user.role !== 'manager') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xóa minh chứng'
                });
            }
            if (evidence.departmentId.toString() !== req.user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền xóa minh chứng của phòng ban bạn'
                });
            }
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
        const { programId, organizationId, departmentId } = req.query;
        const academicYearId = req.academicYearId;

        let queryParams = { academicYearId, programId, organizationId };

        if (departmentId) {
            queryParams.departmentId = departmentId;
        }

        const tree = await Evidence.getTreeByAcademicYear(queryParams);

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

        if (req.user.role !== 'admin') {
            if (req.user.department) {
                searchParams.departmentId = req.user.department;
            }
        }

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
        const { programId, organizationId, departmentId, standardId, criteriaId } = req.query;
        const academicYearId = req.academicYearId;

        let matchStage = { academicYearId };

        if (programId) matchStage.programId = programId;
        if (organizationId) matchStage.organizationId = organizationId;
        if (standardId) matchStage.standardId = standardId;
        if (criteriaId) matchStage.criteriaId = criteriaId;

        if (req.user.role !== 'admin') {
            if (req.user.department) {
                matchStage.departmentId = new mongoose.Types.ObjectId(req.user.department);
            }
        } else if (departmentId) {
            matchStage.departmentId = new mongoose.Types.ObjectId(departmentId);
        }

        const stats = await Evidence.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalEvidences: { $sum: 1 },

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
                totalFilesSize: totalFilesSize,
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê: ' + error.message
        });
    }
};

const copyEvidenceToAnotherYear = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetAcademicYearId, targetStandardId, targetCriteriaId, targetDepartmentId, newCode } = req.body;

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

        if (req.user.role === 'manager') {
            if (evidence.departmentId.toString() !== req.user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền copy minh chứng của phòng ban bạn'
                });
            }
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
            targetDepartmentId,
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
        const { programId, organizationId, departmentId, mode } = req.body;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Không có file được upload'
            });
        }

        if (req.user.role !== 'admin') {
            if (req.user.role !== 'manager') {
                return res.status(403).json({
                    success: false,
                    message: 'Chỉ Admin và Manager mới có quyền import minh chứng'
                });
            }

            if (req.user.department?.toString() !== departmentId?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền import minh chứng cho phòng ban của bạn'
                });
            }
        }

        const result = await importEvidencesFromExcel(
            file.path,
            req.academicYearId,
            programId,
            organizationId,
            departmentId,
            req.user.id,
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

        const evidence = await Evidence.findOne({ _id: id, academicYearId });
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng trong năm học này'
            });
        }

        if (req.user.role !== 'admin') {
            if (req.user.role !== 'manager') {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền di chuyển minh chứng'
                });
            }
            if (evidence.departmentId.toString() !== req.user.department) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn chỉ có quyền di chuyển minh chứng của phòng ban bạn'
                });
            }
        }

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
        const { programId, organizationId, departmentId } = req.query;
        const academicYearId = req.academicYearId;

        const userDeptId = req.user.department?.toString();

        if (!programId || !organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin programId hoặc organizationId'
            });
        }

        const mongoose = require('mongoose');
        const StandardModel = mongoose.model('Standard');
        const CriteriaModel = mongoose.model('Criteria');

        let standardCriteriaQuery = {
            academicYearId,
            programId,
            organizationId
        };

        let evidenceQuery = {
            academicYearId,
            programId,
            organizationId
        };

        // LOGIC MỚI: Lọc Tiêu chuẩn/Tiêu chí/Minh chứng theo departmentId nếu có chọn filter
        if (departmentId) {
            standardCriteriaQuery.departmentId = departmentId;
            evidenceQuery.departmentId = departmentId;
        } else if (req.user.role !== 'admin') {
            // Khi Manager không chọn phòng ban, Evidence Query không lọc theo phòng ban
            // -> Trả về tất cả Evidences (cho phép Manager thấy tất cả các phòng ban)
            // standardCriteriaQuery cũng không lọc theo departmentId -> Trả về tất cả S/C
        }


        const [standards, allCriteria, evidences] = await Promise.all([
            StandardModel.find(standardCriteriaQuery).sort({ code: 1 }).lean(),
            CriteriaModel.find(standardCriteriaQuery).sort({ standardId: 1, code: 1 }).lean(),
            Evidence.find(evidenceQuery)
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .populate('departmentId', 'name code')
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
                        status: e.status,
                        departmentId: e.departmentId?._id.toString()
                    }))
                };

                if (criterionNode.hasEvidence) {
                    standardNode.hasEvidence = true;
                }

                standardNode.criteria.push(criterionNode);
            });

            tree.push(standardNode);
        });

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

        res.json({
            success: true,
            data: {
                tree,
                academicYear: req.currentAcademicYear,
                statistics,
                userRole: req.user.role,
                userDepartmentId: userDeptId
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
        const { programId, organizationId, departmentId, standardId, criteriaId, format = 'xlsx' } = req.query;
        const academicYearId = req.academicYearId;

        const query = { academicYearId };

        if (programId) query.programId = programId;
        if (organizationId) query.organizationId = organizationId;
        if (departmentId) query.departmentId = departmentId;
        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;

        if (req.user.role !== 'admin' && req.user.department) {
            query.departmentId = req.user.department;
        }

        const evidences = await Evidence.find(query)
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('departmentId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .lean();

        const data = evidences.map(e => ({
            Mã_Minh_Chứng: e.code,
            Tên_Minh_Chứng: e.name,
            Mô_Tả: e.description,
            Chương_Trình: e.programId?.name,
            Tổ_Chức: e.organizationId?.name,
            Phòng_Ban: e.departmentId?.name,
            Tiêu_Chuẩn: e.standardId?.code,
            Tiêu_Chí: e.criteriaId?.code,
            Số_Hiệu_Văn_Bản: e.documentNumber,
            Ngày_Ban_Hành: e.issueDate ? new Date(e.issueDate).toLocaleDateString('vi-VN') : '',
            Cơ_Quan_Ban_Hành: e.issuingAgency,
            Trạng_Thái: e.status,
            Ngày_Tạo: e.createdAt.toLocaleDateString('vi-VN'),
            Người_Tạo: e.createdBy?.fullName
        }));

        const buffer = exportService.exportData(data, format);

        const fileName = `Export_MinhChung_${Date.now()}.${format}`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.send(buffer);

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
        const userId = req.user.id;

        const FileModel = mongoose.model('File');
        const file = await FileModel.findById(fileId);

        if (!file) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy file' });
        }

        const evidence = await Evidence.findById(file.evidenceId);

        if (!evidence) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy minh chứng' });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ success: false, message: 'Chỉ Admin hoặc Manager mới có quyền phê duyệt file' });
        }

        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({ success: false, message: 'Lý do từ chối là bắt buộc' });
        }

        const oldStatus = file.approvalStatus;
        file.approvalStatus = status;
        file.approvedBy = userId;
        file.rejectionReason = status === 'rejected' ? rejectionReason : undefined;
        file.approvedAt = new Date();

        await file.save();

        await evidence.updateStatus();

        res.json({
            success: true,
            message: `File đã được ${status === 'approved' ? 'phê duyệt' : 'từ chối'}`,
            data: { fileStatus: file.approvalStatus, evidenceStatus: evidence.status }
        });

    } catch (error) {
        console.error('Approve file error:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi phê duyệt file' });
    }
};

const getEvidenceByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const academicYearId = req.academicYearId;

        const evidence = await Evidence.findOne({ code, academicYearId })
            .populate('departmentId', 'name code')
            .select('-files -changeHistory -downloadStats');

        if (!evidence) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy minh chứng' });
        }

        res.json({ success: true, data: evidence });

    } catch (error) {
        console.error('Get evidence by code error:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy minh chứng theo mã' });
    }
};

const getPublicEvidence = async (req, res) => {
    try {
        const { id } = req.params;

        const evidence = await Evidence.findById(id)
            .populate('departmentId', 'name code')
            .select('-files -changeHistory -downloadStats -createdBy -updatedBy');

        if (!evidence) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy minh chứng công khai' });
        }

        res.json({ success: true, data: evidence });

    } catch (error) {
        console.error('Get public evidence error:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy minh chứng công khai' });
    }
};

const sendCompletionRequest = async (req, res) => {
    try {
        const { departmentId } = req.body;
        const academicYearId = req.academicYearId;

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Admin mới có quyền gửi yêu cầu hoàn thiện'
            });
        }

        if (!departmentId) {
            return res.status(400).json({
                success: false,
                message: 'Phòng ban là bắt buộc'
            });
        }

        const department = await Department.findById(departmentId);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Phòng ban không tồn tại'
            });
        }

        const managers = await User.find({
            department: departmentId,
            role: 'manager',
            status: 'active'
        });

        if (managers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy quản lý nào trong phòng ban này'
            });
        }

        const notifications = managers.map(manager => ({
            recipientId: manager._id,
            senderId: req.user.id,
            type: 'completion_request',
            title: 'Yêu cầu hoàn thiện cây minh chứng',
            message: `Admin yêu cầu hoàn thiện cây minh chứng cho phòng ban ${department.name}. Vui lòng upload file Excel gồm tiêu chuẩn, tiêu chí và minh chứng.`,
            data: {
                departmentId,
                academicYearId,
                requestedBy: req.user.id,
                requestedAt: new Date()
            },
            read: false,
            createdAt: new Date(),
            priority: 'high'
        }));

        await Notification.insertMany(notifications);

        res.json({
            success: true,
            message: `Đã gửi yêu cầu đến ${managers.length} quản lý phòng ban`,
            data: {
                managersCount: managers.length,
                managerIds: managers.map(m => m._id)
            }
        });

    } catch (error) {
        console.error('Send completion request error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi gửi yêu cầu'
        });
    }
};

const submitCompletionNotification = async (req, res) => {
    try {
        const { departmentId, message } = req.body;
        const academicYearId = req.academicYearId;

        if (req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Quản lý mới có quyền gửi xác nhận hoàn thiện'
            });
        }


        if (req.user.department?.toString() !== departmentId?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có quyền gửi xác nhận cho phòng ban của bạn'
            });
        }

        const department = await Department.findById(departmentId);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Phòng ban không tồn tại'
            });
        }

        const admins = await User.find({
            role: 'admin',
            status: 'active'
        });

        if (admins.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy admin'
            });
        }

        const notifications = admins.map(admin => ({
            recipientId: admin._id,
            senderId: req.user.id,
            type: 'completion_notification',
            title: 'Cây minh chứng đã được hoàn thiện',
            message: message || `Quản lý phòng ban ${department.name} đã hoàn thiện cây minh chứng.`,
            data: {
                departmentId,
                academicYearId,
                submittedBy: req.user.id,
                submittedAt: new Date()
            },
            read: false,
            createdAt: new Date(),
            priority: 'normal'
        }));

        await Notification.insertMany(notifications);

        res.json({
            success: true,
            message: `Đã gửi xác nhận đến ${admins.length} admin`,
            data: {
                adminsCount: admins.length,
                adminIds: admins.map(a => a._id)
            }
        });

    } catch (error) {
        console.error('Submit completion notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi gửi xác nhận'
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
    approveFile,
    getEvidenceByCode,
    getPublicEvidence,
    sendCompletionRequest,
    submitCompletionNotification
};