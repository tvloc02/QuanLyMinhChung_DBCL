const mongoose = require('mongoose');
const Standard = require('../../models/Evidence/Standard');
const Program = require('../../models/Evidence/Program');
const Organization = require('../../models/Evidence/Organization');
const Department = require('../../models/User/Department');

const getStandards = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            programId,
            organizationId,
            departmentId,
            status,
            sortBy = 'code',
            sortOrder = 'asc'
        } = req.query;

        const academicYearId = req.academicYearId;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
            ];
        }

        if (programId) query.programId = programId;
        if (organizationId) query.organizationId = organizationId;
        if (departmentId) query.departmentId = departmentId;
        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [standards, total] = await Promise.all([
            Standard.find(query)
                .populate('academicYearId', 'name code')
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('departmentId', 'name code')
                .populate('createdBy', 'fullName email')
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
        const { programId, organizationId, departmentId } = req.query;
        const academicYearId = req.academicYearId;

        if (!programId || !organizationId || !departmentId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu programId, organizationId hoặc departmentId'
            });
        }

        const standards = await Standard.find({
            academicYearId,
            programId,
            organizationId,
            departmentId,
            status: 'active'
        })
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('departmentId', 'name code')
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
            .populate('departmentId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

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
            departmentId,
            order,
            objectives,
            evaluationCriteria
        } = req.body;

        const academicYearId = req.academicYearId;

        const [program, organization, department] = await Promise.all([
            Program.findOne({ _id: programId, academicYearId }),
            Organization.findOne({ _id: organizationId, academicYearId }),
            Department.findById(departmentId)
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

        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Phòng ban không tồn tại'
            });
        }

        const standardCode = code.toString().padStart(2, '0');

        const existingStandard = await Standard.findOne({
            academicYearId,
            programId,
            organizationId,
            departmentId,
            code: standardCode
        });

        if (existingStandard) {
            return res.status(400).json({
                success: false,
                message: `Mã tiêu chuẩn ${code} đã tồn tại cho phòng ban này`
            });
        }

        const standard = new Standard({
            academicYearId,
            name: name.trim(),
            code: standardCode,
            programId,
            organizationId,
            departmentId,
            order: order || 1,
            objectives: objectives?.trim(),
            evaluationCriteria: evaluationCriteria || [],
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await standard.save();

        await standard.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'departmentId', select: 'name code' },
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

        const standard = await Standard.findOne({ _id: id, academicYearId });
        if (!standard) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chuẩn trong năm học này'
            });
        }

        let newCode = updateData.code ? updateData.code.toString().padStart(2, '0') : standard.code;
        const newDepartmentId = updateData.departmentId || standard.departmentId;

        if (updateData.code && newCode !== standard.code) {
            const existingStandard = await Standard.findOne({
                academicYearId,
                programId: standard.programId,
                organizationId: standard.organizationId,
                departmentId: newDepartmentId,
                code: newCode,
                _id: { $ne: id }
            });
            if (existingStandard) {
                return res.status(400).json({
                    success: false,
                    message: `Mã tiêu chuẩn ${updateData.code} đã tồn tại cho phòng ban này`
                });
            }
        }

        const isInUse = await standard.isInUse();
        if (isInUse && (updateData.code || updateData.programId || updateData.organizationId || updateData.departmentId)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể thay đổi mã, chương trình, tổ chức hoặc phòng ban của tiêu chuẩn đang được sử dụng'
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
            standard.code = newCode;
        }

        if (updateData.departmentId) {
            standard.departmentId = updateData.departmentId;
        }

        standard.updatedBy = req.user.id;
        await standard.save();

        await standard.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'departmentId', select: 'name code' },
            { path: 'updatedBy', select: 'fullName email' }
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

const getStandardStatistics = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;
        const { programId, organizationId, departmentId } = req.query;

        let matchQuery = { academicYearId: mongoose.Types.ObjectId(academicYearId) };
        if (programId) matchQuery.programId = mongoose.Types.ObjectId(programId);
        if (organizationId) matchQuery.organizationId = mongoose.Types.ObjectId(organizationId);
        if (departmentId) matchQuery.departmentId = mongoose.Types.ObjectId(departmentId);


        const stats = await Standard.aggregate([
            { $match: matchQuery },
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
    getStandardStatistics
};