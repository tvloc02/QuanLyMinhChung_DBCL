const mongoose = require('mongoose');
const Criteria = require('../models/Program');
const Standard = require('../models/Program');
const Program = require('../models/Program');
const Organization = require('../models/Program');

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
            sortBy = 'order',
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

        if (!standardId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu standardId'
            });
        }

        const criteria = await Criteria.find({
            academicYearId,
            standardId,
            status: 'active'
        })
            .populate('standardId', 'name code')
            .sort({ order: 1, code: 1 });

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
            .populate('updatedBy', 'fullName email');

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
            order,
            weight,
            type,
            requirements,
            guidelines,
            indicators
        } = req.body;

        const academicYearId = req.academicYearId;

        const standard = await Standard.findOne({ _id: standardId, academicYearId })
            .populate('programId organizationId');

        if (!standard) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu chuẩn không tồn tại trong năm học này'
            });
        }

        const existingCriteria = await Criteria.findOne({
            academicYearId,
            standardId,
            code: code.toString().padStart(2, '0')
        });

        if (existingCriteria) {
            return res.status(400).json({
                success: false,
                message: `Mã tiêu chí ${code} đã tồn tại trong tiêu chuẩn này`
            });
        }

        const criteria = new Criteria({
            academicYearId,
            name: name.trim(),
            code: code.toString().padStart(2, '0'),
            description: description?.trim(),
            standardId,
            programId: standard.programId._id,
            organizationId: standard.organizationId._id,
            order: order || 1,
            weight,
            type: type || 'mandatory',
            requirements: requirements?.trim(),
            guidelines: guidelines?.trim(),
            indicators: indicators || [],
            createdBy: req.user.id,
            updatedBy: req.user.id
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

        const criteria = await Criteria.findOne({ _id: id, academicYearId });
        if (!criteria) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tiêu chí trong năm học này'
            });
        }

        if (updateData.code && updateData.code !== criteria.code) {
            const existingCriteria = await Criteria.findOne({
                academicYearId,
                standardId: criteria.standardId,
                code: updateData.code.toString().padStart(2, '0'),
                _id: { $ne: id }
            });
            if (existingCriteria) {
                return res.status(400).json({
                    success: false,
                    message: `Mã tiêu chí ${updateData.code} đã tồn tại trong tiêu chuẩn này`
                });
            }
        }

        const isInUse = await criteria.isInUse();
        if (isInUse && (updateData.code || updateData.standardId)) {
            return res.status(400).json({
                success: false,
                message: 'Không thể thay đổi mã hoặc tiêu chuẩn của tiêu chí đang được sử dụng'
            });
        }

        const allowedFields = [
            'name', 'description', 'order', 'weight', 'type',
            'requirements', 'guidelines', 'indicators', 'status'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                criteria[field] = updateData[field];
            }
        });

        if (updateData.code) {
            criteria.code = updateData.code.toString().padStart(2, '0');
        }

        criteria.updatedBy = req.user.id;
        await criteria.save();

        await criteria.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'updatedBy', select: 'fullName email' }
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

const getCriteriaStatistics = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const stats = await Criteria.aggregate([
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

        const typeStats = await Criteria.aggregate([
            { $match: { academicYearId: mongoose.Types.ObjectId(academicYearId) } },
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
    getCriteriaStatistics
};