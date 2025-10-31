const mongoose = require('mongoose');
const Task = require('../../models/Task/Task');
const Criteria = require('../../models/Evidence/Criteria');
const Standard = require('../../models/Evidence/Standard');
const Program = require('../../models/Evidence/Program');
const Organization = require('../../models/Evidence/Organization');
const User = require('../../models/User/User');
const Report = require('../../models/Report/Report');

const generateTaskCode = async (academicYearId) => {
    const count = await Task.countDocuments({ academicYearId });
    const year = new Date().getFullYear();
    return `T${year}-${String(count + 1).padStart(5, '0')}`;
};

const getTasks = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            standardId,
            criteriaId,
            status,
            assignedTo,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const academicYearId = req.academicYearId;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

        if (search) {
            query.$or = [
                { taskCode: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;
        if (status) query.status = status;

        if (assignedTo) {
            query.assignedTo = assignedTo;
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [tasks, total] = await Promise.all([
            Task.find(query)
                .populate('academicYearId', 'name code')
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('assignedTo', 'fullName email avatar')
                .populate('createdBy', 'fullName email')
                .populate('reviewedBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Task.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                tasks,
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
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhiệm vụ'
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;
        const userRole = req.user.role;

        const task = await Task.findOne({ _id: id, academicYearId })
            .populate('academicYearId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('assignedTo', 'fullName email avatar')
            .populate('createdBy', 'fullName email')
            .populate('reviewedBy', 'fullName email')
            .populate('reportId');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        const canView = userRole === 'admin' ||
            userRole === 'manager' ||
            userRole === 'evaluator' ||
            (userRole === 'reporter' && task.assignedTo.some(u => u._id.toString() === req.user.id));

        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem nhiệm vụ này'
            });
        }

        res.json({
            success: true,
            data: task
        });

    } catch (error) {
        console.error('Get task by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin nhiệm vụ'
        });
    }
};

const createTask = async (req, res) => {
    try {
        const {
            description,
            standardId,
            criteriaId,
            assignedTo,
            dueDate,
            reportType
        } = req.body;

        const academicYearId = req.academicYearId;
        const userRole = req.user.role;

        if (userRole !== 'admin' && userRole !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ quản lý mới có thể tạo nhiệm vụ'
            });
        }

        // ✅ SỬA: Cho phép báo cáo tiêu chuẩn không cần criteriaId
        if (!description || !standardId || !assignedTo || assignedTo.length === 0 || !reportType) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ các trường bắt buộc'
            });
        }

        // ✅ SỬA: Kiểm tra criteriaId chỉ khi reportType là 'criteria'
        let criteria = null;
        let programId = null;
        let organizationId = null;

        if (reportType === 'criteria') {
            if (!criteriaId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu chí là bắt buộc cho báo cáo tiêu chí'
                });
            }
            criteria = await Criteria.findOne({ _id: criteriaId, academicYearId });
            if (!criteria) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu chí không tồn tại'
                });
            }
            programId = criteria.programId;
            organizationId = criteria.organizationId;
        } else {
            // ✅ SỬA: Cho báo cáo tiêu chuẩn, lấy programId/organizationId từ tiêu chuẩn
            const standard = await Standard.findOne({ _id: standardId, academicYearId });
            if (!standard) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu chuẩn không tồn tại'
                });
            }
            programId = standard.programId;
            organizationId = standard.organizationId;
        }

        const taskCode = await generateTaskCode(academicYearId);

        const task = new Task({
            academicYearId,
            taskCode,
            description: description.trim(),
            standardId,
            criteriaId: criteriaId || null,  // ✅ Cho phép null cho báo cáo tiêu chuẩn
            programId,
            organizationId,
            assignedTo,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            reportType,
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await task.save();

        await task.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'criteriaId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'assignedTo', select: 'fullName email avatar' },
            { path: 'createdBy', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo nhiệm vụ thành công',
            data: task
        });

    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo nhiệm vụ'
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;
        const userRole = req.user.role;

        if (userRole !== 'admin' && userRole !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ quản lý mới có thể cập nhật nhiệm vụ'
            });
        }

        const task = await Task.findOne({ _id: id, academicYearId });
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        const allowedFields = ['description', 'assignedTo', 'dueDate', 'status'];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                task[field] = updateData[field];
            }
        });

        task.updatedBy = req.user.id;
        await task.save();

        await task.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'criteriaId', select: 'name code' },
            { path: 'assignedTo', select: 'fullName email avatar' },
            { path: 'updatedBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật nhiệm vụ thành công',
            data: task
        });

    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật nhiệm vụ'
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;
        const userRole = req.user.role;

        if (userRole !== 'admin' && userRole !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ quản lý mới có thể xóa nhiệm vụ'
            });
        }

        const task = await Task.findOne({ _id: id, academicYearId });
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        if (task.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể xóa nhiệm vụ ở trạng thái chờ xử lý'
            });
        }

        await Task.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa nhiệm vụ thành công'
        });

    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa nhiệm vụ'
        });
    }
};

const submitReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { reportId } = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole !== 'reporter') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ báo cáo viên mới có thể nộp báo cáo'
            });
        }

        const task = await Task.findOne({ _id: id, academicYearId });
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        const isAssigned = task.assignedTo.some(uid => uid.toString() === userId);
        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không được giao nhiệm vụ này'
            });
        }

        const report = await Report.findOne({ _id: reportId, academicYearId });
        if (!report) {
            return res.status(400).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        task.reportId = reportId;
        task.status = 'submitted';
        task.submittedAt = new Date();
        task.reviewStatus = 'not_reviewed';
        task.updatedBy = userId;

        await task.save();

        await task.populate([
            { path: 'reportId' },
            { path: 'assignedTo', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Nộp báo cáo thành công',
            data: task
        });

    } catch (error) {
        console.error('Submit report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi nộp báo cáo'
        });
    }
};

const reviewReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, rejectionReason } = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole !== 'admin' && userRole !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ quản lý mới có thể duyệt báo cáo'
            });
        }

        const task = await Task.findOne({ _id: id, academicYearId });
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        if (task.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể duyệt báo cáo ở trạng thái đã nộp'
            });
        }

        if (approved) {
            task.reviewStatus = 'approved';
            task.status = 'approved';
        } else {
            if (!rejectionReason) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp lý do từ chối'
                });
            }
            task.reviewStatus = 'rejected';
            task.status = 'rejected';
            task.rejectionReason = rejectionReason.trim();
        }

        task.reviewedBy = userId;
        task.reviewedAt = new Date();
        task.updatedBy = userId;

        await task.save();

        await task.populate([
            { path: 'reviewedBy', select: 'fullName email' },
            { path: 'assignedTo', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: approved ? 'Phê duyệt báo cáo thành công' : 'Từ chối báo cáo thành công',
            data: task
        });

    } catch (error) {
        console.error('Review report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi duyệt báo cáo'
        });
    }
};

const getTaskByCriteria = async (req, res) => {
    try {
        const { criteriaId } = req.query;
        const academicYearId = req.academicYearId;

        const tasks = await Task.find({
            academicYearId,
            criteriaId,
            status: { $in: ['pending', 'in_progress', 'submitted'] }
        })
            .populate('assignedTo', 'fullName email')
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: tasks
        });

    } catch (error) {
        console.error('Get task by criteria error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy nhiệm vụ'
        });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    submitReport,
    reviewReport,
    getTaskByCriteria
};