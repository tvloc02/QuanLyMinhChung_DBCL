const mongoose = require('mongoose');
const Standard = require('../models/Standard');
const Program = require('../models/Program');
const Organization = require('../models/Organization');

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

const createStandard = async (req, res) => {
    try {
        const {
            name,
            code,
            description,
            programId,
            organizationId,
            order,
            objectives,
            guidelines,
            evaluationCriteria
        } = req.body;

        const academicYearId = req.academicYearId;

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
            description: description?.trim(),
            programId,
            organizationId,
            order: order || 1,
            objectives: objectives?.trim(),
            guidelines: guidelines?.trim(),
            evaluationCriteria: evaluationCriteria || [],
            createdBy: req.user.id,
            updatedBy: req.user.id
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

// ==================== criteriaController.js ====================
const Criteria = require('../models/Criteria');

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

const createCriteria = async (req, res) => {
    try {
        const {
            name,
            code,
            description,
            standardId,
            order,
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