const mongoose = require('mongoose');
const Assignment = require('../../models/report/Assignment');
const Report = require('../../models/report/Report');
const User = require('../../models/User/User');

const getAssignments = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            status,
            priority,
            expertId,
            assignedBy,
            reportId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const academicYearId = req.academicYearId;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

        // Experts chỉ thấy phân quyền của mình
        if (req.user.role === 'expert') {
            query.expertId = req.user.id;
        } else if (req.user.role === 'manager' && !expertId && !assignedBy) {
            // Managers thấy phân quyền mà họ tạo
            query.assignedBy = req.user.id;
        }

        if (search) {
            const reports = await Report.find({
                academicYearId,
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            if (reports.length > 0) {
                const reportIds = reports.map(r => r._id);
                query.reportId = { $in: reportIds };
            } else {
                return res.json({
                    success: true,
                    data: {
                        assignments: [],
                        pagination: {
                            current: pageNum,
                            pages: 0,
                            total: 0,
                            hasNext: false,
                            hasPrev: false
                        }
                    }
                });
            }
        }

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (expertId) query.expertId = expertId;
        if (assignedBy) query.assignedBy = assignedBy;
        if (reportId) query.reportId = reportId;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [assignments, total] = await Promise.all([
            Assignment.find(query)
                .populate('reportId', 'title type code')
                .populate('expertId', 'fullName email')
                .populate('assignedBy', 'fullName email')
                .populate('evaluationId', 'averageScore status')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Assignment.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                assignments,
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
        console.error('Get assignments error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách phân quyền'
        });
    }
};

const getAssignmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const assignment = await Assignment.findOne({ _id: id, academicYearId })
            .populate('reportId')
            .populate('expertId', 'fullName email')
            .populate('assignedBy', 'fullName email')
            .populate('evaluationId');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân quyền trong năm học này'
            });
        }

        // Kiểm tra quyền xem
        if (req.user.role !== 'admin' &&
            assignment.expertId._id.toString() !== req.user.id.toString() &&
            assignment.assignedBy._id.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem phân quyền này'
            });
        }

        res.json({
            success: true,
            data: assignment
        });

    } catch (error) {
        console.error('Get assignment by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin phân quyền'
        });
    }
};

const createAssignment = async (req, res) => {
    try {
        const {
            reportId,
            expertId,
            assignmentNote,
            deadline,
            priority,
            evaluationCriteria
        } = req.body;

        const academicYearId = req.academicYearId;

        // Chỉ manager hoặc admin mới tạo được phân quyền
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo phân quyền đánh giá'
            });
        }

        // ✅ Thêm kiểm tra bắt buộc cho các trường ID
        if (!reportId) {
            return res.status(400).json({
                success: false,
                message: 'ID báo cáo (reportId) là bắt buộc.'
            });
        }

        if (!expertId) {
            return res.status(400).json({
                success: false,
                message: 'ID chuyên gia (expertId) là bắt buộc.'
            });
        }


        const [report, expert] = await Promise.all([
            Report.findOne({ _id: reportId, academicYearId }),
            User.findById(expertId)
        ]);

        if (!report) {
            return res.status(400).json({
                success: false,
                message: 'Báo cáo không tồn tại trong năm học này'
            });
        }

        // Báo cáo phải đã xuất bản mới phân quyền được
        if (report.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể phân quyền đánh giá báo cáo đã xuất bản'
            });
        }

        if (!expert || expert.role !== 'expert') {
            return res.status(400).json({
                success: false,
                message: 'Chuyên gia không tồn tại hoặc không có quyền đánh giá'
            });
        }

        // Kiểm tra xem chuyên gia này đã được phân quyền chưa
        const existingAssignment = await Assignment.findOne({
            reportId,
            expertId,
            academicYearId,
            status: { $in: ['pending', 'accepted', 'in_progress'] }
        });

        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                message: 'Chuyên gia này đã được phân quyền đánh giá báo cáo này'
            });
        }

        // Kiểm tra trường deadline bắt buộc
        if (!deadline) {
            return res.status(400).json({
                success: false,
                message: 'Hạn chót (deadline) là bắt buộc.'
            });
        }

        const assignment = new Assignment({
            academicYearId,
            reportId,
            expertId,
            assignedBy: req.user.id,
            assignmentNote: assignmentNote?.trim(),
            deadline: new Date(deadline),
            priority: priority || 'normal',
            evaluationCriteria: evaluationCriteria || []
        });

        await assignment.save();

        await assignment.populate([
            { path: 'reportId', select: 'title type code' },
            { path: 'expertId', select: 'fullName email' },
            { path: 'assignedBy', select: 'fullName email' }
        ]);

        // Gửi notification
        const Notification = mongoose.model('Notification');
        await Notification.create({
            recipientId: expertId,
            senderId: req.user.id,
            type: 'assignment_new',
            title: 'Phân quyền đánh giá mới',
            message: `Bạn được phân quyền đánh giá báo cáo: ${report.title}`,
            data: {
                assignmentId: assignment._id,
                reportId: report._id,
                url: `/reports/assignments/${assignment._id}`
            },
            priority: priority === 'urgent' ? 'high' : 'normal'
        });

        res.status(201).json({
            success: true,
            message: 'Tạo phân quyền đánh giá thành công',
            data: assignment
        });

    } catch (error) {
        console.error('Create assignment error:', error);

        // Xử lý lỗi validation của Mongoose (thường là lỗi 400)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi tạo phân quyền'
        });
    }
};

const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;

        const assignment = await Assignment.findOne({ _id: id, academicYearId });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân quyền trong năm học này'
            });
        }

        if (req.user.role !== 'admin' && assignment.assignedBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền cập nhật phân quyền này'
            });
        }

        const allowedFields = ['assignmentNote', 'deadline', 'priority', 'evaluationCriteria'];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                assignment[field] = updateData[field];
            }
        });

        await assignment.save();

        await assignment.populate([
            { path: 'reportId', select: 'title type code' },
            { path: 'expertId', select: 'fullName email' },
            { path: 'assignedBy', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Cập nhật phân quyền thành công',
            data: assignment
        });

    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật phân quyền'
        });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const assignment = await Assignment.findOne({ _id: id, academicYearId });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân quyền trong năm học này'
            });
        }

        if (req.user.role !== 'admin' && assignment.assignedBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xóa phân quyền này'
            });
        }

        if (assignment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa phân quyền đã hoàn thành'
            });
        }

        await Assignment.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa phân quyền thành công'
        });

    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa phân quyền'
        });
    }
};

const acceptAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { responseNote } = req.body;
        const academicYearId = req.academicYearId;

        const assignment = await Assignment.findOne({ _id: id, academicYearId });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân quyền'
            });
        }

        if (assignment.expertId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền phản hồi phân quyền này'
            });
        }

        if (assignment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Phân quyền đã được phản hồi trước đó'
            });
        }

        await assignment.accept(responseNote);

        res.json({
            success: true,
            message: 'Chấp nhận phân quyền thành công',
            data: assignment
        });

    } catch (error) {
        console.error('Accept assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi chấp nhận phân quyền'
        });
    }
};

const rejectAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { responseNote } = req.body;
        const academicYearId = req.academicYearId;

        const assignment = await Assignment.findOne({ _id: id, academicYearId });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân quyền'
            });
        }

        if (assignment.expertId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền phản hồi phân quyền này'
            });
        }

        if (assignment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Phân quyền đã được phản hồi trước đó'
            });
        }

        await assignment.reject(responseNote);

        res.json({
            success: true,
            message: 'Từ chối phân quyền thành công',
            data: assignment
        });

    } catch (error) {
        console.error('Reject assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi từ chối phân quyền'
        });
    }
};

const cancelAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const academicYearId = req.academicYearId;

        const assignment = await Assignment.findOne({ _id: id, academicYearId });
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân quyền'
            });
        }

        if (req.user.role !== 'admin' && assignment.assignedBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền hủy phân quyền này'
            });
        }

        await assignment.cancel(reason, req.user.id);

        res.json({
            success: true,
            message: 'Hủy phân quyền thành công',
            data: assignment
        });

    } catch (error) {
        console.error('Cancel assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi hủy phân quyền'
        });
    }
};

const getExpertWorkload = async (req, res) => {
    try {
        const { expertId } = req.query;
        const academicYearId = req.academicYearId;

        if (!expertId) {
            return res.status(400).json({
                success: false,
                message: 'expertId là bắt buộc'
            });
        }

        const workload = await Assignment.getExpertWorkload(expertId, academicYearId);

        res.json({
            success: true,
            data: workload
        });

    } catch (error) {
        console.error('Get expert workload error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy khối lượng công việc'
        });
    }
};

const getAssignmentStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;
        const { expertId } = req.query;

        let matchQuery = {
            academicYearId: mongoose.Types.ObjectId(academicYearId)
        };

        if (expertId) {
            matchQuery.expertId = mongoose.Types.ObjectId(expertId);
        }

        const stats = await Assignment.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    overdue: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
                }
            }
        ]);

        const defaultStats = {
            total: 0, pending: 0, accepted: 0, inProgress: 0,
            completed: 0, overdue: 0, cancelled: 0
        };

        res.json({
            success: true,
            data: stats[0] || defaultStats
        });

    } catch (error) {
        console.error('Get assignment stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê phân quyền'
        });
    }
};

const getUpcomingDeadlines = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const academicYearId = req.academicYearId;

        const assignments = await Assignment.getUpcomingDeadlines(academicYearId, parseInt(days));

        res.json({
            success: true,
            data: assignments
        });

    } catch (error) {
        console.error('Get upcoming deadlines error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy hạn chót sắp tới'
        });
    }
};

const bulkCreateAssignments = async (req, res) => {
    try {
        const { assignments } = req.body;
        const academicYearId = req.academicYearId;

        // Kiểm tra input
        if (!Array.isArray(assignments) || assignments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách phân công không hợp lệ'
            });
        }

        if (assignments.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Tối đa 100 phân công trong một lần. Vui lòng chia nhỏ yêu cầu'
            });
        }

        // Chỉ manager hoặc admin mới tạo được phân công
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo phân công đánh giá'
            });
        }

        // Validate tất cả assignments trước khi lưu
        const validatedAssignments = [];
        const errors = [];

        for (let i = 0; i < assignments.length; i++) {
            const { reportId, expertId, deadline, priority, assignmentNote, evaluationCriteria } = assignments[i];

            // Validate required fields
            if (!reportId) {
                errors.push(`Phân công ${i + 1}: ID báo cáo là bắt buộc`);
                continue;
            }

            if (!expertId) {
                errors.push(`Phân công ${i + 1}: ID chuyên gia là bắt buộc`);
                continue;
            }

            if (!deadline) {
                errors.push(`Phân công ${i + 1}: Hạn chót là bắt buộc`);
                continue;
            }

            // Validate deadline
            const deadlineDate = new Date(deadline);
            if (deadlineDate <= new Date()) {
                errors.push(`Phân công ${i + 1}: Hạn chót phải lớn hơn ngày hiện tại`);
                continue;
            }

            validatedAssignments.push({
                index: i + 1,
                data: {
                    academicYearId,
                    reportId,
                    expertId,
                    assignedBy: req.user.id,
                    assignmentNote: assignmentNote?.trim() || '',
                    deadline: new Date(deadline),
                    priority: priority || 'normal',
                    evaluationCriteria: evaluationCriteria || []
                }
            });
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Có lỗi trong dữ liệu',
                errors
            });
        }

        if (validatedAssignments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có phân công hợp lệ'
            });
        }

        // Fetch reports và experts để validate
        const reportIds = [...new Set(validatedAssignments.map(a => a.data.reportId))];
        const expertIds = [...new Set(validatedAssignments.map(a => a.data.expertId))];

        const reports = await Report.find({
            _id: { $in: reportIds },
            academicYearId,
            status: 'published'
        });

        const experts = await User.find({
            _id: { $in: expertIds },
            role: 'expert'
        });

        const reportMap = new Map(reports.map(r => [r._id.toString(), r]));
        const expertMap = new Map(experts.map(e => [e._id.toString(), e]));

        // Validate reports and experts existence
        const validationErrors = [];
        for (const assignment of validatedAssignments) {
            if (!reportMap.has(assignment.data.reportId.toString())) {
                validationErrors.push(`Báo cáo ${assignment.data.reportId} không tồn tại hoặc chưa xuất bản`);
            }
            if (!expertMap.has(assignment.data.expertId.toString())) {
                validationErrors.push(`Chuyên gia ${assignment.data.expertId} không tồn tại`);
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Lỗi xác thực dữ liệu',
                errors: validationErrors
            });
        }

        // Check for existing assignments
        const existingAssignments = await Assignment.find({
            academicYearId,
            reportId: { $in: reportIds },
            expertId: { $in: expertIds },
            status: { $in: ['pending', 'accepted', 'in_progress'] }
        });

        const existingMap = new Map();
        for (const existing of existingAssignments) {
            const key = `${existing.reportId.toString()}-${existing.expertId.toString()}`;
            existingMap.set(key, existing);
        }

        // Check for duplicates in new assignments
        const newAssignments = [];
        const skipped = [];

        for (const assignment of validatedAssignments) {
            const key = `${assignment.data.reportId.toString()}-${assignment.data.expertId.toString()}`;

            if (existingMap.has(key) || newAssignments.some(a => {
                const aKey = `${a.reportId.toString()}-${a.expertId.toString()}`;
                return aKey === key;
            })) {
                skipped.push({
                    report: reportMap.get(assignment.data.reportId.toString())?.code,
                    expert: expertMap.get(assignment.data.expertId.toString())?.fullName,
                    reason: 'Đã được phân công hoặc là bản sao trong danh sách'
                });
            } else {
                newAssignments.push(assignment.data);
            }
        }

        if (newAssignments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tất cả phân công đã tồn tại hoặc trùng lặp',
                skipped
            });
        }

        // Create assignments
        const createdAssignments = await Assignment.insertMany(newAssignments);

        // Populate the created assignments
        const populatedAssignments = await Assignment.find({
            _id: { $in: createdAssignments.map(a => a._id) }
        })
            .populate('reportId', 'title type code')
            .populate('expertId', 'fullName email')
            .populate('assignedBy', 'fullName email');

        // Send notifications
        const Notification = mongoose.model('Notification');
        const notifications = [];

        for (const assignment of populatedAssignments) {
            const report = await Report.findById(assignment.reportId);
            notifications.push(
                Notification.create({
                    recipientId: assignment.expertId._id,
                    senderId: req.user.id,
                    type: 'assignment_new',
                    title: 'Phân quyền đánh giá mới',
                    message: `Bạn được phân quyền đánh giá báo cáo: ${report.title}`,
                    data: {
                        assignmentId: assignment._id,
                        reportId: report._id,
                        url: `/reports/assignments/${assignment._id}`
                    },
                    priority: assignment.priority === 'urgent' ? 'high' : 'normal'
                })
            );
        }

        await Promise.all(notifications);

        // Log activity
        await ActivityLog.logCriticalAction(
            req.user.id,
            'assignment_bulk_create',
            `Tạo ${newAssignments.length} phân công đánh giá hàng loạt`,
            {
                severity: 'high',
                metadata: {
                    totalCreated: newAssignments.length,
                    totalSkipped: skipped.length,
                    reports: reportIds.length,
                    experts: expertIds.length
                }
            }
        );

        res.status(201).json({
            success: true,
            message: `Đã tạo ${newAssignments.length} phân công thành công`,
            data: {
                created: newAssignments.length,
                skipped: skipped.length,
                assignments: populatedAssignments,
                skippedDetails: skipped
            }
        });

    } catch (error) {
        console.error('Bulk create assignments error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi tạo phân công'
        });
    }
};

module.exports = {
    getAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    acceptAssignment,
    rejectAssignment,
    cancelAssignment,
    getExpertWorkload,
    getAssignmentStats,
    getUpcomingDeadlines,
    bulkCreateAssignments
};