const AcademicYear = require('../../models/system/AcademicYear');
const ActivityLog = require('../../models/system/ActivityLog');
const Program = require('../../models/Evidence/Program');
const Organization = require('../../models/Evidence/Organization');
const Standard = require('../../models/Evidence/Standard');
const Criteria = require('../../models/Evidence/Criteria');
const Evidence = require('../../models/Evidence/Evidence');
const mongoose = require('mongoose');

const getAcademicYears = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [academicYears, total] = await Promise.all([
            AcademicYear.find(query)
                .populate('createdBy', 'fullName email')
                .populate('updatedBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            AcademicYear.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                academicYears,
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
        console.error('Get academic years error:', error);
        await ActivityLog.logError(req.user?.id, 'academic_year_list', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách năm học'
        });
    }
};

const getAllAcademicYears = async (req, res) => {
    try {
        const academicYears = await AcademicYear.find({
            status: { $in: ['active', 'completed'] }
        })
            .select('name code startYear endYear isCurrent status')
            .sort({ startYear: -1 });

        res.json({
            success: true,
            data: academicYears
        });

    } catch (error) {
        console.error('Get all academic years error:', error);
        await ActivityLog.logError(req.user?.id, 'academic_year_list_all', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách năm học'
        });
    }
};

const getAcademicYearById = async (req, res) => {
    try {
        const { id } = req.params;

        const academicYear = await AcademicYear.findById(id)
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        await ActivityLog.logUserAction(req.user?.id, 'academic_year_view',
            `Xem thông tin năm học: ${academicYear.displayName}`, {
                targetType: 'AcademicYear',
                targetId: id,
                targetName: academicYear.displayName
            });

        res.json({
            success: true,
            data: academicYear
        });

    } catch (error) {
        console.error('Get academic year by ID error:', error);
        await ActivityLog.logError(req.user?.id, 'academic_year_view', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin năm học'
        });
    }
};

const getCurrentAcademicYear = async (req, res) => {
    try {
        const currentYear = await AcademicYear.getCurrentYear();

        if (!currentYear) {
            return res.status(404).json({
                success: false,
                message: 'Chưa có năm học hiện tại được thiết lập'
            });
        }

        res.json({
            success: true,
            data: currentYear
        });

    } catch (error) {
        console.error('Get current academic year error:', error);
        await ActivityLog.logError(req.user?.id, 'academic_year_current', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy năm học hiện tại'
        });
    }
};

const createAcademicYear = async (req, res) => {
    try {
        const {
            name,
            startYear,
            endYear,
            startDate,
            endDate,
            isCurrent
        } = req.body;

        const code = `${startYear}-${endYear}`;
        const existingYear = await AcademicYear.findOne({ code });

        if (existingYear) {
            return res.status(400).json({
                success: false,
                message: `Năm học ${code} đã tồn tại`
            });
        }

        const academicYear = new AcademicYear({
            name: name || `Năm học ${startYear}-${endYear}`,
            code,
            startYear,
            endYear,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isCurrent: isCurrent || false,
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await academicYear.save();

        await academicYear.populate([
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo năm học thành công',
            data: academicYear
        });

    } catch (error) {
        console.error('Create academic year error:', error);
        await ActivityLog.logError(req.user?.id, 'academic_year_create', error, {
            metadata: req.body
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo năm học'
        });
    }
};

const updateAcademicYear = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const academicYear = await AcademicYear.findById(id);
        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        if (updateData.code && updateData.code !== academicYear.code) {
            const existingYear = await AcademicYear.findOne({
                code: updateData.code,
                _id: { $ne: id }
            });
            if (existingYear) {
                return res.status(400).json({
                    success: false,
                    message: `Mã năm học ${updateData.code} đã tồn tại`
                });
            }
        }

        const oldData = {
            name: academicYear.name,
            code: academicYear.code,
            status: academicYear.status
        };

        Object.assign(academicYear, updateData);
        academicYear.updatedBy = req.user.id;

        await academicYear.save();

        await academicYear.populate([
            { path: 'createdBy', select: 'fullName email' },
            { path: 'updatedBy', select: 'fullName email' }
        ]);

        await ActivityLog.logUserAction(req.user.id, 'academic_year_update',
            `Cập nhật năm học: ${academicYear.displayName}`, {
                targetType: 'AcademicYear',
                targetId: id,
                targetName: academicYear.displayName,
                oldData,
                newData: {
                    name: academicYear.name,
                    code: academicYear.code,
                    status: academicYear.status
                }
            });

        res.json({
            success: true,
            message: 'Cập nhật năm học thành công',
            data: academicYear
        });

    } catch (error) {
        console.error('Update academic year error:', error);
        await ActivityLog.logError(req.user?.id, 'academic_year_update', error, {
            targetId: req.params.id,
            metadata: req.body
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật năm học'
        });
    }
};

const deleteAcademicYear = async (req, res) => {
    try {
        const { id } = req.params;

        const academicYear = await AcademicYear.findById(id);
        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        const canDelete = await academicYear.canDelete();
        if (!canDelete) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa năm học đang có dữ liệu'
            });
        }

        if (academicYear.isCurrent) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa năm học hiện tại'
            });
        }

        academicYear.updatedBy = req.user.id;
        await academicYear.save();

        await AcademicYear.findByIdAndDelete(id);

        await ActivityLog.logCriticalAction(req.user.id, 'academic_year_delete',
            `Xóa năm học: ${academicYear.displayName}`, {
                targetType: 'AcademicYear',
                targetId: id,
                targetName: academicYear.displayName
            });

        res.json({
            success: true,
            message: 'Xóa năm học thành công'
        });

    } catch (error) {
        console.error('Delete academic year error:', error);
        await ActivityLog.logError(req.user?.id, 'academic_year_delete', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa năm học'
        });
    }
};

const setCurrentAcademicYear = async (req, res) => {
    try {
        const { id } = req.params;

        const academicYear = await AcademicYear.findById(id);
        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        await academicYear.activate(req.user.id);

        res.json({
            success: true,
            message: 'Đặt làm năm học hiện tại thành công',
            data: academicYear
        });

    } catch (error) {
        console.error('Set current academic year error:', error);
        await ActivityLog.logError(req.user?.id, 'academic_year_activate', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đặt năm học hiện tại'
        });
    }
};

const getAcademicYearStatistics = async (req, res) => {
    try {
        const { id } = req.params;

        const academicYear = await AcademicYear.findById(id);
        if (!academicYear) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy năm học'
            });
        }

        const [programs, standards, criteria, evidences] = await Promise.all([
            Program.countDocuments({ academicYearId: id }),
            Standard.countDocuments({ academicYearId: id }),
            Criteria.countDocuments({ academicYearId: id }),
            Evidence.countDocuments({ academicYearId: id })
        ]);

        const stats = {
            programs,
            standards,
            criteria,
            evidences,
            programsByStatus: await Program.aggregate([
                { $match: { academicYearId: mongoose.Types.ObjectId(id) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            evidencesByStatus: await Evidence.aggregate([
                { $match: { academicYearId: mongoose.Types.ObjectId(id) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        };

        academicYear.metadata = {
            ...academicYear.metadata,
            totalPrograms: programs,
            totalStandards: standards,
            totalCriteria: criteria,
            totalEvidences: evidences
        };

        await academicYear.save();

        await ActivityLog.logUserAction(req.user?.id, 'academic_year_statistics',
            `Xem thống kê năm học: ${academicYear.displayName}`, {
                targetType: 'AcademicYear',
                targetId: id,
                targetName: academicYear.displayName
            });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get academic year statistics error:', error);
        await ActivityLog.logError(req.user?.id, 'academic_year_statistics', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê năm học'
        });
    }
};

module.exports = {
    getAcademicYears,
    getAllAcademicYears,
    getAcademicYearById,
    getCurrentAcademicYear,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setCurrentAcademicYear,
    getAcademicYearStatistics
};