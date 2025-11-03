const mongoose = require('mongoose');
const Task = mongoose.model('Task');
const Criteria = mongoose.model('Criteria');
const Standard = mongoose.model('Standard');
const Program = mongoose.model('Program');
const Organization = mongoose.model('Organization');

const permissionService = require('../../services/permissionService');

const generateTaskCode = async (academicYearId) => {
    const count = await Task.countDocuments({ academicYearId });
    const year = new Date().getFullYear();
    return `T${year}-${String(count + 1).padStart(5, '0')}`;
};

// Hàm chung để lấy Task với bộ lọc cơ bản
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

// 1. Endpoint: Nhiệm vụ được giao cho bản thân (Assigned To Me)
const getAssignedTasks = async (req, res) => {
    const userId = req.user.id;
    return getTasksByFilter(req, res, { assignedTo: userId });
};

// 2. Endpoint: Nhiệm vụ đã giao (Created By Me)
const getCreatedTasks = async (req, res) => {
    const userId = req.user.id;
    return getTasksByFilter(req, res, { createdBy: userId });
};

const getTasks = async (req, res) => {
    // ⭐️ ADMIN/MANAGER: Mặc định trả về Tasks đã tạo
    if (req.user.role === 'admin' || req.user.role === 'manager') {
        return getCreatedTasks(req, res);
    }
    // REPORTER/EVALUATOR: Mặc định trả về Tasks được giao
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
                standardId,
                criteriaId,
                academicYearId
            );

            if (!canAssign) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền thực hiện hành động này'
                });
            }
        }

        if (!description || !standardId || !assignedTo || assignedTo.length === 0 || !reportType) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ các trường bắt buộc'
            });
        }

        let programId = null;
        let organizationId = null;
        let standard = null;

        standard = await Standard.findOne({ _id: standardId, academicYearId });
        if (!standard) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu chuẩn không tồn tại'
            });
        }
        programId = standard.programId;
        organizationId = standard.organizationId;

        if (reportType === 'criteria') {
            if (!criteriaId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu chí là bắt buộc cho báo cáo tiêu chí'
                });
            }
            const criteria = await Criteria.findOne({ _id: criteriaId, academicYearId });
            if (!criteria || criteria.standardId.toString() !== standardId) {
                return res.status(400).json({
                    success: false,
                    message: 'Tiêu chí không hợp lệ hoặc không thuộc tiêu chuẩn này'
                });
            }
        }

        const taskCode = await generateTaskCode(academicYearId);

        const task = new Task({
            academicYearId,
            taskCode,
            description: description.trim(),
            standardId,
            criteriaId: criteriaId || null,
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
        console.error('Create task error (CRASH):', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
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
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const task = await Task.findOneAndDelete({ _id: id, academicYearId });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        await Report.deleteMany({ taskId: id });

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
        const { taskId } = req.params;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        const task = await Task.findOne({ _id: taskId, academicYearId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });
        }

        if (!task.assignedTo.map(id => id.toString()).includes(userId.toString())) {
            return res.status(403).json({ success: false, message: 'Bạn không được giao nhiệm vụ này' });
        }

        if (task.status !== 'pending' && task.status !== 'in_progress' && task.status !== 'rejected') {
            return res.status(400).json({ success: false, message: `Không thể nộp báo cáo ở trạng thái ${task.status}` });
        }

        task.status = 'submitted';
        task.updatedBy = userId;
        task.updatedAt = new Date();
        await task.save();

        res.json({
            success: true,
            message: 'Báo cáo đã được nộp thành công và đang chờ duyệt',
            data: task
        });

    } catch (error) {
        console.error('Submit report error:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi nộp báo cáo' });
    }
};


const reviewReport = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, rejectionReason } = req.body;
        const academicYearId = req.academicYearId;
        const userId = req.user.id;

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({ success: false, message: 'Cần quyền manager trở lên để duyệt báo cáo' });
        }

        const task = await Task.findOne({ _id: taskId, academicYearId });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhiệm vụ' });
        }

        if (task.status !== 'submitted') {
            return res.status(400).json({ success: false, message: `Chỉ có thể duyệt báo cáo ở trạng thái submitted. Trạng thái hiện tại: ${task.status}` });
        }

        if (status !== 'completed' && status !== 'rejected') {
            return res.status(400).json({ success: false, message: 'Trạng thái duyệt không hợp lệ' });
        }

        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp lý do từ chối' });
        }

        task.status = status;
        task.reviewdBy = userId;
        task.reviewdAt = new Date();
        task.rejectionReason = status === 'rejected' ? rejectionReason.trim() : undefined;
        task.updatedBy = userId;
        task.updatedAt = new Date();
        await task.save();

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
        const { criteriaId } = req.params;
        const academicYearId = req.academicYearId;

        if (!criteriaId) {
            return res.status(400).json({
                success: false,
                message: 'criteriaId là bắt buộc'
            });
        }

        const criteria = await Criteria.findById(criteriaId).select('standardId');
        if (!criteria) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy Tiêu chí'
            });
        }
        const standardId = criteria.standardId;

        const tasks = await Task.find({
            academicYearId,
            status: { $in: ['pending', 'in_progress', 'submitted'] },
            $or: [
                { criteriaId: criteriaId },
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
    submitReport,
    reviewReport,
    getTaskByCriteria
};