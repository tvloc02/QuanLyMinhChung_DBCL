const mongoose = require('mongoose');
const Criteria = require('../../models/Evidence/Criteria');
const Standard = require('../../models/Evidence/Standard');
const permissionService = require('../../services/permissionService');

const getCriteria = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            standardId,
            programId,
            organizationId,
            status,
            type,
            sortBy = 'code',
            sortOrder = 'asc'
        } = req.query;

        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

        if (req.user.role === 'reporter') {
            const accessibleCriteriaIds = await permissionService.getAccessibleCriteriaIds(userId, academicYearId);
            if (accessibleCriteriaIds.length > 0) {
                query._id = { $in: accessibleCriteriaIds };
            } else {
                query._id = new mongoose.Types.ObjectId();
            }
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (standardId) query.standardId = standardId;
        if (programId) query.programId = programId;
        if (organizationId) query.organizationId = organizationId;
        if (status) query.status = status;
        if (type) query.type = type;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [criteria, total] = await Promise.all([
            Criteria.find(query)
                .populate('academicYearId', 'name code')
                .populate('standardId', 'name code')
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('assignedReporters', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Criteria.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                criteria,
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
        console.error('Get criteria error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách tiêu chí'
        });
    }
};

const getCriteriaByStandard = async (req, res) => {
    try {
        const { standardId } = req.query;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        if (!standardId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu standardId'
            });
        }

        let query = {
            academicYearId,
            standardId,
            status: 'active'
        };

        if (req.user.role === 'reporter') {
            const accessibleCriteriaIds = await permissionService.getAccessibleCriteriaIds(userId, academicYearId);
            if (accessibleCriteriaIds.length > 0) {
                query._id = { $in: accessibleCriteriaIds };
            } else {
                query._id = new mongoose.Types.ObjectId();
            }
        }

        const criteria = await Criteria.find(query)
            .populate('standardId', 'name code')
            .populate('assignedReporters', 'fullName email')
            .sort({ code: 1 });

        res.json({
            success: true,
            data: criteria
        });

    } catch (error) {
        console.error('Get criteria by standard error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách tiêu chí'
        });
    }
};

const getCriteriaById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const criteria = await Criteria.findOne({ _id: id, academicYearId })
            .populate('academicYearId', 'name code')
            .populate('standardId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email')
            .populate('assignedReporters', 'fullName email');

        if (!criteria) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chí trong năm học này'
            });
        }

        res.json({
            success: true,
            data: criteria
        });

    } catch (error) {
        console.error('Get criteria by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin tiêu chí'
        });
    }
};

const createCriteria = async (req, res) => {
    try {
        const {
            name,
            code,
            description,
            standardId,
            requirements,
            guidelines,
            indicators,
            status,
            autoGenerateCode
        } = req.body;

        const academicYearId = req.academicYearId;

        if (!academicYearId) {
            return res.status(400).json({
                success: false,
                message: 'Không xác định được năm học hiện tại'
            });
        }

        if (!standardId) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu chuẩn là bắt buộc'
            });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            const canEditStandard = await permissionService.canEditStandard(req.user.id, standardId, academicYearId);
            if (!canEditStandard) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền tạo tiêu chí'
                });
            }
        }

        const standard = await Standard.findOne({ _id: standardId, academicYearId })
            .populate('programId organizationId');

        if (!standard) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu chuẩn không tồn tại trong năm học này'
            });
        }

        let criteriaCode = code;

        if (autoGenerateCode || !criteriaCode) {
            const lastCriteria = await Criteria.findOne({
                academicYearId,
                standardId
            })
                .sort({ code: -1 })
                .select('code');

            if (lastCriteria) {
                const lastCode = parseInt(lastCriteria.code);
                criteriaCode = (lastCode + 1).toString().padStart(2, '0');
            } else {
                criteriaCode = '01';
            }
        } else {
            criteriaCode = criteriaCode.toString().padStart(2, '0');
        }

        if (!/^\d{1,2}$/.test(criteriaCode)) {
            return res.status(400).json({
                success: false,
                message: 'Mã tiêu chí phải là số từ 1-99'
            });
        }

        const existingCriteria = await Criteria.findOne({
            academicYearId,
            standardId,
            code: criteriaCode
        });

        if (existingCriteria) {
            return res.status(400).json({
                success: false,
                message: `Mã tiêu chí ${criteriaCode} đã tồn tại trong tiêu chuẩn này. Vui lòng chọn mã khác.`
            });
        }

        const criteria = new Criteria({
            academicYearId,
            name: name.trim(),
            code: criteriaCode,
            description: description?.trim() || '',
            standardId,
            programId: standard.programId._id,
            organizationId: standard.organizationId._id,
            requirements: requirements?.trim() || '',
            guidelines: guidelines?.trim() || '',
            indicators: Array.isArray(indicators) ? indicators : [],
            status: status || 'draft',
            createdBy: req.user.id,
            updatedBy: req.user.id,
            assignedReporters: []
        });

        await criteria.save();

        await criteria.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo tiêu chí thành công',
            data: criteria
        });

    } catch (error) {
        console.error('Create criteria error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                details: messages
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mã tiêu chí đã tồn tại trong tiêu chuẩn này'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo tiêu chí'
        });
    }
};

const updateCriteria = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const criteria = await Criteria.findOne({ _id: id, academicYearId })
            .populate('standardId', 'code');

        if (!criteria) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chí trong năm học này'
            });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            const canEdit = await permissionService.canEditCriteria(userId, id, academicYearId);
            if (!canEdit) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền chỉnh sửa tiêu chí này'
                });
            }
        }

        if (updateData.code && updateData.code !== criteria.code) {
            const newCode = updateData.code.toString().padStart(2, '0');

            const existingCriteria = await Criteria.findOne({
                academicYearId,
                standardId: criteria.standardId,
                code: newCode,
                _id: { $ne: id }
            });

            if (existingCriteria) {
                return res.status(400).json({
                    success: false,
                    message: `Mã tiêu chí ${newCode} đã tồn tại trong tiêu chuẩn này`
                });
            }

            updateData.code = newCode;
        }

        const isInUse = await criteria.isInUse();
        if (isInUse && (updateData.code || updateData.standardId)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể thay đổi mã hoặc tiêu chuẩn của tiêu chí đang được sử dụng'
            });
        }

        const allowedFields = [
            'name', 'description',
            'requirements', 'guidelines', 'indicators', 'status'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                criteria[field] = updateData[field];
            }
        });

        if (updateData.code) {
            criteria.code = updateData.code;
        }

        criteria.updatedBy = userId;
        await criteria.save();

        await criteria.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'updatedBy', select: 'fullName email' },
            { path: 'assignedReporters', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật tiêu chí thành công',
            data: criteria
        });

    } catch (error) {
        console.error('Update criteria error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật tiêu chí'
        });
    }
};

const deleteCriteria = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const criteria = await Criteria.findOne({ _id: id, academicYearId });
        if (!criteria) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chí trong năm học này'
            });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ quản lý mới có thể xóa tiêu chí'
            });
        }

        const isInUse = await criteria.isInUse();
        if (isInUse) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tiêu chí đang được sử dụng'
            });
        }

        await Criteria.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa tiêu chí thành công'
        });

    } catch (error) {
        console.error('Delete criteria error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa tiêu chí'
        });
    }
};

const assignReporters = async (req, res) => {
    try {
        const { id } = req.params;
        const { reporterIds } = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const criteria = await Criteria.findOne({ _id: id, academicYearId });

        if (!criteria) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chí'
            });
        }

        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            const canAssign = await permissionService.canAssignReporters(userId, criteria.standardId, id, academicYearId);
            if (!canAssign) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền phân công reporter cho tiêu chí này'
                });
            }
        }

        if (!Array.isArray(reporterIds) || reporterIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách reporter không hợp lệ'
            });
        }

        criteria.assignedReporters = reporterIds;
        criteria.updatedBy = userId;

        await criteria.save();

        await criteria.populate('assignedReporters', 'fullName email');

        res.json({
            success: true,
            message: 'Phân công reporter thành công',
            data: criteria
        });

    } catch (error) {
        console.error('Assign reporters error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi phân công reporter'
        });
    }
};

const getCriteriaStatistics = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const stats = await Criteria.aggregate([
            { $match: { academicYearId: new mongoose.Types.ObjectId(academicYearId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusStats = stats.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        const typeStats = await Criteria.aggregate([
            { $match: { academicYearId: new mongoose.Types.ObjectId(academicYearId) } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                statusStats,
                typeStats,
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Get criteria statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê tiêu chí'
        });
    }
};

module.exports = {
    getCriteria,
    getCriteriaByStandard,
    getCriteriaById,
    createCriteria,
    updateCriteria,
    deleteCriteria,
    assignReporters,
    getCriteriaStatistics
};