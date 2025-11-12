const mongoose = require('mongoose');
const Task = mongoose.model('Task');
const Criteria = mongoose.model('Criteria');
const Standard = mongoose.model('Standard');
const Program = mongoose.model('Program');
const Organization = mongoose.model('Organization');
const Report = require('../../models/report/Report');
const permissionService = require('../../services/permissionService');

const getNotificationModel = () => {
    if (mongoose.models.Notification) {
        return mongoose.models.Notification;
    }
    throw new Error("Notification Model not registered.");
}

const generateTaskCode = async (academicYearId) => {
    const year = new Date().getFullYear();
    let count = 1;
    let taskCode;
    let exists = true;

    while (exists) {
        taskCode = `T${year}-${String(count).padStart(5, '0')}`;
        const doc = await Task.findOne({ taskCode, academicYearId });
        exists = !!doc;
        if (exists) count++;
    }

    return taskCode;
};

const getTasksByFilter = async (req, res, customQuery = {}) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            standardId,
            criteriaId,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId, ...customQuery };

        if (search) {
            query.$or = [
                { taskCode: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;
        if (status) query.status = status;

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
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Task.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: tasks,
            total,
            page: pageNum,
            limit: limitNum
        });

    } catch (error) {
        console.error(`Get tasks error (Filter: ${JSON.stringify(customQuery)}):`, error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhiệm vụ'
        });
    }
};

const getAssignedTasks = async (req, res) => {
    const userId = req.user.id;
    return getTasksByFilter(req, res, { assignedTo: userId });
};

const getCreatedTasks = async (req, res) => {
    const userId = req.user.id;
    return getTasksByFilter(req, res, { createdBy: userId });
};

const getTasks = async (req, res) => {
    if (req.user.role === 'admin' || req.user.role === 'manager') {
        return getCreatedTasks(req, res);
    }
    return getAssignedTasks(req, res);
};

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const task = await Task.findOne({ _id: id, academicYearId })
            .populate('academicYearId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('assignedTo', 'fullName email avatar')
            .populate('createdBy', 'fullName email');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        res.json({
            success: true,
            data: task
        });

    } catch (error) {
        console.error('Get task by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy nhiệm vụ'
        });
    }
};

const createTask = async (req, res) => {
    try {
        const Notification = getNotificationModel();
        const {
            description,
            standardId,
            criteriaId,
            assignedTo,
            dueDate,
            reportType
        } = req.body;

        const academicYearId = req.academicYearId;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole !== 'admin' && userRole !== 'manager') {
            const canAssign = await permissionService.canAssignReporters(
                userId,
                reportType !== 'overall_tdg' ? standardId : null,
                reportType === 'criteria' ? criteriaId : null,
                academicYearId
            );

            if (!canAssign) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền thực hiện hành động này'
                });
            }
        }

        if (!description || !assignedTo || assignedTo.length === 0 || !reportType) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ các trường bắt buộc'
            });
        }

        if (reportType !== 'overall_tdg' && !standardId) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu chuẩn là bắt buộc'
            });
        }

        if (reportType === 'criteria' && !criteriaId) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu chí là bắt buộc cho báo cáo tiêu chí'
            });
        }

        let programId = null;
        let organizationId = null;
        let standard = null;

        if (reportType !== 'overall_tdg') {
            const StandardModel = mongoose.model('Standard');
            standard = await StandardModel.findOne({ _id: standardId, academicYearId });
            if (!standard) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu chuẩn không tồn tại'
                });
            }
            programId = standard.programId;
            organizationId = standard.organizationId;

            if (reportType === 'criteria') {
                const CriteriaModel = mongoose.model('Criteria');
                const criteria = await CriteriaModel.findOne({ _id: criteriaId, academicYearId });
                if (!criteria || criteria.standardId.toString() !== standardId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Tiêu chí không hợp lệ hoặc không thuộc tiêu chuẩn này'
                    });
                }
            }
        }

        const taskCode = await generateTaskCode(academicYearId);

        const task = new Task({
            academicYearId,
            taskCode,
            description: description.trim(),
            standardId: reportType !== 'overall_tdg' ? standardId : null,
            criteriaId: reportType === 'criteria' ? criteriaId : null,
            programId: programId,
            organizationId: organizationId,
            assignedTo,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            reportType,
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await task.save();

        const deadlineText = dueDate ? `Hạn chót: ${new Date(dueDate).toLocaleDateString('vi-VN')}` : 'Không có hạn chót.';
        const taskTitle = `Nhiệm vụ TĐG mới: ${task.taskCode}`;
        const taskMessage = `Bạn được giao Task "${task.description.substring(0, 100)}...". ${deadlineText}`;

        await Notification.createSystemNotification(
            taskTitle,
            taskMessage,
            assignedTo,
            {
                type: 'assignment_new',
                url: `/tasks/${task._id}`,
                priority: 'high',
                metadata: {
                    taskCode: task.taskCode,
                    standardId: standardId,
                    criteriaId: criteriaId
                }
            }
        );

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

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mã nhiệm vụ đã tồn tại'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo nhiệm vụ'
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const Notification = getNotificationModel();
        const { id } = req.params;
        const {
            description,
            assignedTo,
            dueDate,
            status,
            reportType
        } = req.body;

        const academicYearId = req.academicYearId;

        const task = await Task.findOne({ _id: id, academicYearId });
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager' && !task.assignedTo.map(id => id.toString()).includes(req.user.id.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa nhiệm vụ này'
            });
        }

        const oldAssignedTo = task.assignedTo.map(id => id.toString());
        const newAssignedTo = assignedTo ? assignedTo.map(id => id.toString()) : oldAssignedTo;
        const addedAssignees = newAssignedTo.filter(id => !oldAssignedTo.includes(id));
        const removedAssignees = oldAssignedTo.filter(id => !newAssignedTo.includes(id));

        if (description) task.description = description.trim();
        if (assignedTo && assignedTo.length > 0) task.assignedTo = assignedTo;
        if (dueDate) task.dueDate = new Date(dueDate);

        if (task.status === 'pending' && reportType) {
            task.reportType = reportType;
        }

        if (status && status !== task.status) {
            const allowedStatusChanges = {
                'pending': ['in_progress', 'cancelled'],
                'in_progress': ['submitted', 'cancelled'],
                'submitted': ['in_progress', 'completed', 'rejected'],
                'rejected': ['in_progress', 'cancelled'],
                'completed': ['in_progress'],
                'cancelled': [],
            };

            const isAllowed = allowedStatusChanges[task.status] && allowedStatusChanges[task.status].includes(status);

            if (isAllowed) {
                task.status = status;
            } else if (req.user.role === 'admin' || req.user.role === 'manager') {
                task.status = status;
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Không thể chuyển từ trạng thái ${task.status} sang ${status}`
                });
            }
        }

        task.updatedBy = req.user.id;
        task.updatedAt = new Date();

        await task.save();

        if (addedAssignees.length > 0) {
            const deadlineText = dueDate ? `Hạn chót: ${new Date(dueDate).toLocaleDateString('vi-VN')}` : 'Không có hạn chót.';
            await Notification.createSystemNotification(
                `Bạn được giao Task mới: ${task.taskCode}`,
                `Bạn vừa được thêm vào Task "${task.description.substring(0, 100)}...". ${deadlineText}`,
                addedAssignees,
                {
                    type: 'assignment_new',
                    url: `/tasks/${task._id}`,
                    priority: 'high',
                }
            );
        }

        if (removedAssignees.length > 0) {
            await Notification.createSystemNotification(
                `Task đã bị gỡ: ${task.taskCode}`,
                `Bạn đã bị gỡ khỏi Task "${task.description.substring(0, 100)}...".`,
                removedAssignees,
                {
                    type: 'assignment_cancelled',
                    url: `/tasks`,
                    priority: 'normal',
                }
            );
        }

        await task.populate([
            { path: 'academicYearId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'criteriaId', select: 'name code' },
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'assignedTo', select: 'fullName email avatar' },
            { path: 'createdBy', select: 'fullName email' }
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
        const Notification = getNotificationModel();
        const { id } = req.params;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;
        const ReportModel = mongoose.model('Report');

        const task = await Task.findOne({ _id: id, academicYearId });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager' && !task.assignedTo.map(id => id.toString()).includes(req.user.id.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa nhiệm vụ này'
            });
        }

        if (task.assignedTo.length > 0) {
            await Notification.createSystemNotification(
                `Task đã bị hủy/xóa: ${task.taskCode}`,
                `Task "${task.description.substring(0, 100)}..." đã bị người giao hủy/xóa khỏi hệ thống.`,
                task.assignedTo,
                {
                    type: 'assignment_cancelled',
                    url: `/tasks`,
                    priority: 'normal',
                }
            );
        }

        if (task.reportId) {
            await ReportModel.updateOne(
                { _id: task.reportId },
                { taskId: null, updatedBy: userId, updatedAt: new Date() }
            );
        }

        await ReportModel.updateMany(
            { taskId: id },
            { taskId: null, updatedBy: userId, updatedAt: new Date() }
        );

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

const reviewReport = async (req, res) => {
    try {
        const Notification = getNotificationModel();
        const { taskId } = req.params;
        const { status, rejectionReason } = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const task = await Task.findOne({ _id: taskId, academicYearId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager' && String(task.createdBy) !== String(userId)) {
            return res.status(403).json({ success: false, message: 'Cần quyền Manager/Admin hoặc là người tạo Task để duyệt báo cáo' });
        }

        if (status !== 'completed' && status !== 'rejected') {
            return res.status(400).json({ success: false, message: 'Trạng thái duyệt không hợp lệ' });
        }

        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do từ chối' });
        }

        let report = null;
        if (task.reportId) {
            report = await Report.findById(task.reportId);
        }

        const canReview = task.status === 'submitted' || (report && report.status === 'public' && String(task.reportId) === String(report._id));

        if (!canReview) {
            return res.status(400).json({ success: false, message: `Chỉ có thể duyệt Task khi trạng thái là 'submitted' hoặc Report liên kết là 'public'. Trạng thái Task hiện tại: ${task.status}` });
        }

        if (report) {
            if (status === 'completed') {
                report.status = 'approved';
                report.rejectionFeedback = undefined;
                await report.save();
                task.status = 'completed';
            } else if (status === 'rejected') {
                await report.reject(userId, rejectionReason);
                task.status = 'rejected';
            }
        } else {
            if (status === 'completed') {
                task.status = 'completed';
            } else if (status === 'rejected') {
                task.status = 'rejected';
            }
        }

        task.reviewedBy = userId;
        task.reviewedAt = new Date();
        task.rejectionReason = status === 'rejected' ? rejectionReason.trim() : undefined;
        task.updatedBy = userId;
        task.updatedAt = new Date();
        await task.save();

        const notifTitle = status === 'completed' ? `Task ${task.taskCode} đã HOÀN THÀNH` : `Task ${task.taskCode} đã bị TỪ CHỐI`;
        const notifMessage = status === 'completed' ?
            `Báo cáo liên kết với Task ${task.taskCode} đã được duyệt và Task đã hoàn thành.` :
            `Báo cáo liên kết với Task ${task.taskCode} đã bị từ chối. Lý do: ${task.rejectionReason}. Vui lòng chỉnh sửa và nộp lại.`;

        await Notification.createSystemNotification(
            notifTitle,
            notifMessage,
            task.assignedTo,
            {
                type: status === 'completed' ? 'report_approved' : 'report_rejected',
                url: `/tasks/${task._id}`,
                priority: 'high'
            }
        );

        res.json({
            success: true,
            message: `Duyệt báo cáo thành công. Trạng thái: ${status}`,
            data: task
        });

    } catch (error) {
        console.error('Review report error:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi duyệt báo cáo' });
    }
};

const getTaskByCriteria = async (req, res) => {
    try {
        const { criteriaId } = req.query;
        const academicYearId = req.academicYearId;

        if (!criteriaId) {
            return res.status(400).json({
                success: false,
                message: 'criteriaId là bắt buộc'
            });
        }

        const CriteriaModel = mongoose.model('Criteria');
        const criteria = await CriteriaModel.findById(criteriaId).select('standardId');
        if (!criteria) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Tiêu chí'
            });
        }
        const standardId = criteria.standardId;

        const tasks = await Task.find({
            academicYearId,
            assignedTo: req.user.id,
            status: { $in: ['pending', 'in_progress', 'rejected'] },
            $or: [
                { criteriaId: criteriaId, reportType: 'criteria' },
                { standardId: standardId, criteriaId: null, reportType: 'standard' }
            ]
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
    getAssignedTasks,
    getCreatedTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    reviewReport,
    getTaskByCriteria
};