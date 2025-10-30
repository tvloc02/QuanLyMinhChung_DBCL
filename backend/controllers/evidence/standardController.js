const mongoose = require('mongoose');
const Standard = require('../../models/Evidence/Standard');
const Program = require('../../models/Evidence/Program');
const Organization = require('../../models/Evidence/Organization');
const permissionService = require('../../services/permissionService');

const getStandards = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            programId,
            organizationId,
            status,
            sortBy = 'order',
            sortOrder = 'asc'
        } = req.query;

        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

        if (req.user.role === 'reporter') {
            const accessibleStandardIds = await permissionService.getAccessibleStandardIds(userId, academicYearId);
            if (accessibleStandardIds.length > 0) {
                query._id = { $in: accessibleStandardIds };
            }
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
            ];
        }

        if (programId) query.programId = programId;
        if (organizationId) query.organizationId = organizationId;
        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [standards, total] = await Promise.all([
            Standard.find(query)
                .populate('academicYearId', 'name code')
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('assignedReporters', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Standard.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                standards,
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
        console.error('Get standards error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách tiêu chuẩn'
        });
    }
};

const getStandardsByProgramAndOrg = async (req, res) => {
    try {
        const { programId, organizationId } = req.query;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        if (!programId || !organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu programId hoặc organizationId'
            });
        }

        let query = {
            academicYearId,
            programId,
            organizationId,
            status: 'active'
        };

        if (req.user.role === 'reporter') {
            const accessibleStandardIds = await permissionService.getAccessibleStandardIds(userId, academicYearId);
            if (accessibleStandardIds.length > 0) {
                query._id = { $in: accessibleStandardIds };
            }
        }

        const standards = await Standard.find(query)
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('assignedReporters', 'fullName email')
            .sort({ order: 1, code: 1 });

        res.json({
            success: true,
            data: standards
        });

    } catch (error) {
        console.error('Get standards by program and org error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách tiêu chuẩn'
        });
    }
};

const getStandardById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const standard = await Standard.findOne({ _id: id, academicYearId })
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email')
            .populate('assignedReporters', 'fullName email');

        if (!standard) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chuẩn trong năm học này'
            });
        }

        res.json({
            success: true,
            data: standard
        });

    } catch (error) {
        console.error('Get standard by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin tiêu chuẩn'
        });
    }
};

const createStandard = async (req, res) => {
    try {
        const {
            name,
            code,
            programId,
            organizationId,
            order,
            objectives,
            evaluationCriteria
        } = req.body;

        const academicYearId = req.academicYearId;

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ quản lý mới có thể tạo tiêu chuẩn'
            });
        }

        const [program, organization] = await Promise.all([
            Program.findOne({ _id: programId, academicYearId }),
            Organization.findOne({ _id: organizationId, academicYearId })
        ]);

        if (!program) {
            return res.status(400).json({
                success: false,
                message: 'Chương trình không tồn tại trong năm học này'
            });
        }

        if (!organization) {
            return res.status(400).json({
                success: false,
                message: 'Tổ chức không tồn tại trong năm học này'
            });
        }

        const existingStandard = await Standard.findOne({
            academicYearId,
            programId,
            organizationId,
            code: code.toString().padStart(2, '0')
        });

        if (existingStandard) {
            return res.status(400).json({
                success: false,
                message: `Mã tiêu chuẩn ${code} đã tồn tại trong chương trình này`
            });
        }

        const standard = new Standard({
            academicYearId,
            name: name.trim(),
            code: code.toString().padStart(2, '0'),
            programId,
            organizationId,
            order: order || 1,
            objectives: objectives?.trim(),
            evaluationCriteria: evaluationCriteria || [],
            createdBy: req.user.id,
            updatedBy: req.user.id,
            assignedReporters: []
        });

        await standard.save();

        await standard.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo tiêu chuẩn thành công',
            data: standard
        });

    } catch (error) {
        console.error('Create standard error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo tiêu chuẩn'
        });
    }
};

const updateStandard = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const standard = await Standard.findOne({ _id: id, academicYearId });
        if (!standard) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chuẩn trong năm học này'
            });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            const canEdit = await permissionService.canEditStandard(userId, id, academicYearId);
            if (!canEdit) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền chỉnh sửa tiêu chuẩn này'
                });
            }
        }

        if (updateData.code && updateData.code !== standard.code) {
            const existingStandard = await Standard.findOne({
                academicYearId,
                programId: standard.programId,
                organizationId: standard.organizationId,
                code: updateData.code.toString().padStart(2, '0'),
                _id: { $ne: id }
            });
            if (existingStandard) {
                return res.status(400).json({
                    success: false,
                    message: `Mã tiêu chuẩn ${updateData.code} đã tồn tại`
                });
            }
        }

        const isInUse = await standard.isInUse();
        if (isInUse && (updateData.code || updateData.programId || updateData.organizationId)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể thay đổi mã hoặc chương trình/tổ chức của tiêu chuẩn đang được sử dụng'
            });
        }

        const allowedFields = [
            'name', 'order', 'objectives',
            'evaluationCriteria', 'status'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                standard[field] = updateData[field];
            }
        });

        if (updateData.code) {
            standard.code = updateData.code.toString().padStart(2, '0');
        }

        standard.updatedBy = userId;
        await standard.save();

        await standard.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'updatedBy', select: 'fullName email' },
            { path: 'assignedReporters', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật tiêu chuẩn thành công',
            data: standard
        });

    } catch (error) {
        console.error('Update standard error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật tiêu chuẩn'
        });
    }
};

const deleteStandard = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const standard = await Standard.findOne({ _id: id, academicYearId });
        if (!standard) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chuẩn trong năm học này'
            });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ quản lý mới có thể xóa tiêu chuẩn'
            });
        }

        const isInUse = await standard.isInUse();
        if (isInUse) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tiêu chuẩn đang được sử dụng'
            });
        }

        await Standard.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa tiêu chuẩn thành công'
        });

    } catch (error) {
        console.error('Delete standard error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa tiêu chuẩn'
        });
    }
};

const assignReporters = async (req, res) => {
    try {
        const { id } = req.params;
        const { reporterIds } = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const standard = await Standard.findOne({ _id: id, academicYearId });

        if (!standard) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chuẩn'
            });
        }

        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            const canAssign = await permissionService.canAssignReporters(userId, id, null, academicYearId);
            if (!canAssign) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền phân công reporter cho tiêu chuẩn này'
                });
            }
        }

        if (!Array.isArray(reporterIds) || reporterIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách reporter không hợp lệ'
            });
        }

        standard.assignedReporters = reporterIds;
        standard.updatedBy = userId;

        await standard.save();

        await standard.populate('assignedReporters', 'fullName email');

        res.json({
            success: true,
            message: 'Phân công reporter thành công',
            data: standard
        });

    } catch (error) {
        console.error('Assign reporters error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi phân công reporter'
        });
    }
};

const getStandardStatistics = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const stats = await Standard.aggregate([
            { $match: { academicYearId: mongoose.Types.ObjectId(academicYearId) } },
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

        res.json({
            success: true,
            data: {
                statusStats,
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Get standard statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê tiêu chuẩn'
        });
    }
};

module.exports = {
    getStandards,
    getStandardsByProgramAndOrg,
    getStandardById,
    createStandard,
    updateStandard,
    deleteStandard,
    assignReporters,
    getStandardStatistics
};