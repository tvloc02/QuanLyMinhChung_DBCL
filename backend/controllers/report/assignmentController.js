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
            evaluatorId,
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

        if (req.user.role === 'evaluator') {
            query.evaluatorId = req.user.id;
        } else if (req.user.role === 'manager' && !evaluatorId && !assignedBy) {
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
        if (evaluatorId) {
            if (req.user.role === 'evaluator' && req.user.id !== evaluatorId) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền xem phân quyền của người khác'
                });
            }
            query.evaluatorId = evaluatorId;
        }
        if (assignedBy) {
            if (req.user.role === 'manager' && req.user.id !== assignedBy) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền xem phân quyền của người khác'
                });
            }
            query.assignedBy = assignedBy;
        }
        if (reportId) query.reportId = reportId;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [assignments, total] = await Promise.all([
            Assignment.find(query)
                .populate('reportId', 'title type code')
                .populate('evaluatorId', 'fullName email')
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
            .populate('evaluatorId', 'fullName email')
            .populate('assignedBy', 'fullName email')
            .populate('evaluationId');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân quyền trong năm học này'
            });
        }

        if (req.user.role !== 'admin' &&
            assignment.evaluatorId._id.toString() !== req.user.id.toString() &&
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
            evaluatorId,
            assignmentNote,
            deadline,
            priority,
            evaluationCriteria
        } = req.body;

        const academicYearId = req.academicYearId;

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo phân quyền đánh giá'
            });
        }

        if (!reportId) {
            return res.status(400).json({
                success: false,
                message: 'ID báo cáo (reportId) là bắt buộc.'
            });
        }

        if (!evaluatorId) {
            return res.status(400).json({
                success: false,
                message: 'ID người đánh giá (evaluatorId) là bắt buộc.'
            });
        }


        const [report, evaluator] = await Promise.all([
            Report.findOne({ _id: reportId, academicYearId }),
            User.findById(evaluatorId)
        ]);

        if (!report) {
            return res.status(400).json({
                success: false,
                message: 'Báo cáo không tồn tại trong năm học này'
            });
        }

        if (report.type !== 'overall_tdg') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể phân công đánh giá cho Báo cáo Tổng hợp TĐG (overall_tdg).'
            });
        }

        if (report.status !== 'approved' && report.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể phân công đánh giá báo cáo đã được chấp thuận hoặc đã phát hành'
            });
        }

        if (!evaluator || evaluator.role !== 'evaluator') {
            return res.status(400).json({
                success: false,
                message: 'Người đánh giá không tồn tại hoặc không có vai trò evaluator'
            });
        }

        if (!deadline) {
            return res.status(400).json({
                success: false,
                message: 'Hạn chót (deadline) là bắt buộc.'
            });
        }

        const existingAssignment = await Assignment.findOne({
            reportId,
            evaluatorId,
            academicYearId,
            status: { $in: ['accepted', 'in_progress'] }
        });

        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                message: 'Người đánh giá này đã được phân quyền đánh giá báo cáo này và đang trong quá trình thực hiện.'
            });
        }

        const assignmentData = {
            academicYearId,
            reportId,
            evaluatorId,
            assignedBy: req.user.id,
            deadline: new Date(deadline),
            priority: priority || 'normal',
            status: 'accepted',
            respondedAt: new Date()
        };

        if (assignmentNote && assignmentNote.trim()) {
            assignmentData.assignmentNote = assignmentNote.trim();
        }

        if (evaluationCriteria && Array.isArray(evaluationCriteria) && evaluationCriteria.length > 0) {
            const validCriteria = evaluationCriteria.filter(c => c.name && c.name.trim());
            if (validCriteria.length > 0) {
                assignmentData.evaluationCriteria = validCriteria;
            }
        }

        const assignment = new Assignment(assignmentData);

        await assignment.save();

        await assignment.populate([
            { path: 'reportId', select: 'title type code' },
            { path: 'evaluatorId', select: 'fullName email' },
            { path: 'assignedBy', select: 'fullName email' }
        ]);

        try {
            const Notification = mongoose.model('Notification');
            await Notification.create({
                recipientId: evaluatorId,
                senderId: req.user.id,
                type: 'assignment_new',
                title: 'Phân công đánh giá mới',
                message: `Bạn được phân công đánh giá báo cáo: ${report.title}. Hạn chót: ${new Date(deadline).toLocaleDateString()}`,
                data: {
                    assignmentId: assignment._id,
                    reportId: report._id,
                    url: `/reports/assignments/${assignment._id}`
                },
                priority: priority === 'urgent' ? 'high' : 'normal'
            });
        } catch (notifError) {
            console.error('Failed to create notification:', notifError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Tạo phân quyền đánh giá thành công',
            data: assignment
        });

    } catch (error) {
        console.error('=== CREATE ASSIGNMENT ERROR ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
                errors: Object.values(error.errors).map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }

        if (error.code === 121) {
            return res.status(400).json({
                success: false,
                message: 'Lỗi validation MongoDB. Vui lòng kiểm tra dữ liệu đầu vào.',
                details: error.errInfo
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

        if(['in_progress', 'completed'].includes(assignment.status) && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Không thể cập nhật phân quyền đang hoặc đã hoàn thành'
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
            { path: 'evaluatorId', select: 'fullName email' },
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

        if (['in_progress', 'completed'].includes(assignment.status) && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa phân quyền đang hoặc đã hoàn thành'
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

        if (['in_progress', 'completed'].includes(assignment.status) && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy phân quyền đang hoặc đã hoàn thành'
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
        const { evaluatorId } = req.query;
        const academicYearId = req.academicYearId;

        if (!evaluatorId) {
            return res.status(400).json({
                success: false,
                message: 'evaluatorId là bắt buộc'
            });
        }

        const workload = await Assignment.getExpertWorkload(evaluatorId, academicYearId);

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
        const { evaluatorId } = req.query;

        const filters = {};
        if (evaluatorId) {
            filters.evaluatorId = evaluatorId;
        }

        const stats = await Assignment.getAssignmentStats(academicYearId, filters);

        const defaultStats = {
            total: 0, accepted: 0, inProgress: 0,
            completed: 0, overdue: 0, cancelled: 0
        };

        res.json({
            success: true,
            data: stats || defaultStats
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

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo phân công đánh giá'
            });
        }

        const validatedAssignments = [];
        const errors = [];

        for (let i = 0; i < assignments.length; i++) {
            const { reportId, evaluatorId, deadline, priority, assignmentNote, evaluationCriteria } = assignments[i];

            if (!reportId) {
                errors.push(`Phân công ${i + 1}: ID báo cáo là bắt buộc`);
                continue;
            }

            if (!evaluatorId) {
                errors.push(`Phân công ${i + 1}: ID người đánh giá là bắt buộc`);
                continue;
            }

            if (!deadline) {
                errors.push(`Phân công ${i + 1}: Hạn chót là bắt buộc`);
                continue;
            }

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
                    evaluatorId,
                    assignedBy: req.user.id,
                    assignmentNote: assignmentNote?.trim() || '',
                    deadline: new Date(deadline),
                    priority: priority || 'normal',
                    evaluationCriteria: evaluationCriteria || [],
                    status: 'accepted',
                    respondedAt: new Date()
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

        const reportIds = [...new Set(validatedAssignments.map(a => a.data.reportId))];
        const evaluatorIds = [...new Set(validatedAssignments.map(a => a.data.evaluatorId))];

        const reports = await Report.find({
            _id: { $in: reportIds },
            academicYearId,
            status: { $in: ['approved', 'published'] },
            type: 'overall_tdg'
        });

        const evaluators = await User.find({
            _id: { $in: evaluatorIds },
            role: 'evaluator'
        });

        const reportMap = new Map(reports.map(r => [r._id.toString(), r]));
        const evaluatorMap = new Map(evaluators.map(e => [e._id.toString(), e]));

        const validationErrors = [];
        for (const assignment of validatedAssignments) {
            const report = reportMap.get(assignment.data.reportId.toString());
            if (!report) {
                validationErrors.push(`Báo cáo ${assignment.data.reportId} không tồn tại, chưa được chấp thuận/phát hành, hoặc không phải là Báo cáo Tổng hợp TĐG`);
            }
            if (report && report.type !== 'overall_tdg') {
                validationErrors.push(`Báo cáo ${report.code} không phải là Báo cáo Tổng hợp TĐG, không thể phân công đánh giá`);
            }
            if (!evaluatorMap.has(assignment.data.evaluatorId.toString())) {
                validationErrors.push(`Người đánh giá ${assignment.data.evaluatorId} không tồn tại hoặc không có vai trò evaluator`);
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Lỗi xác thực dữ liệu',
                errors: validationErrors
            });
        }

        const existingAssignments = await Assignment.find({
            academicYearId,
            reportId: { $in: reportIds },
            evaluatorId: { $in: evaluatorIds },
            status: { $in: ['accepted', 'in_progress'] }
        });

        const existingMap = new Map();
        for (const existing of existingAssignments) {
            const key = `${existing.reportId.toString()}-${existing.evaluatorId.toString()}`;
            existingMap.set(key, existing);
        }

        const newAssignments = [];
        const skipped = [];

        for (const assignment of validatedAssignments) {
            const key = `${assignment.data.reportId.toString()}-${assignment.data.evaluatorId.toString()}`;

            if (existingMap.has(key) || newAssignments.some(a => {
                const aKey = `${a.reportId.toString()}-${a.evaluatorId.toString()}`;
                return aKey === key;
            })) {
                skipped.push({
                    report: reportMap.get(assignment.data.reportId.toString())?.code,
                    evaluator: evaluatorMap.get(assignment.data.evaluatorId.toString())?.fullName,
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

        const createdAssignments = await Assignment.insertMany(newAssignments);

        const populatedAssignments = await Assignment.find({
            _id: { $in: createdAssignments.map(a => a._id) }
        })
            .populate('reportId', 'title type code')
            .populate('evaluatorId', 'fullName email')
            .populate('assignedBy', 'fullName email');

        const Notification = mongoose.model('Notification');
        const notifications = [];

        for (const assignment of populatedAssignments) {
            const report = await Report.findById(assignment.reportId);
            notifications.push(
                Notification.create({
                    recipientId: assignment.evaluatorId._id,
                    senderId: req.user.id,
                    type: 'assignment_new',
                    title: 'Phân công đánh giá mới',
                    message: `Bạn được phân công đánh giá báo cáo: ${report.title}. Hạn chót: ${new Date(assignment.deadline).toLocaleDateString()}`,
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

        const ActivityLog = mongoose.model('ActivityLog');
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
                    evaluators: evaluatorIds.length
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
    cancelAssignment,
    getExpertWorkload,
    getAssignmentStats,
    getUpcomingDeadlines,
    bulkCreateAssignments
};