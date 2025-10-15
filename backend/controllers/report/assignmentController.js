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

        if (req.user.role === 'expert') {
            query.expertId = req.user.id;
        } else if (req.user.role === 'manager' && !expertId && !assignedBy) {
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
            message: 'Lỗi hệ thống khi lấy danh sách phân công'
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
                message: 'Không tìm thấy phân công trong năm học này'
            });
        }

        if (req.user.role !== 'admin' &&
            assignment.expertId._id.toString() !== req.user.id.toString() &&
            assignment.assignedBy._id.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem phân công này'
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
            message: 'Lỗi hệ thống khi lấy thông tin phân công'
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

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo phân công đánh giá'
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

        if (!expert || expert.role !== 'expert') {
            return res.status(400).json({
                success: false,
                message: 'Chuyên gia không tồn tại hoặc không có quyền đánh giá'
            });
        }

        const existingAssignment = await Assignment.findOne({
            reportId,
            expertId,
            academicYearId,
            status: { $in: ['pending', 'accepted', 'in_progress'] }
        });

        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                message: 'Chuyên gia này đã được phân công đánh giá báo cáo này'
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

        // TỰ ĐỘNG PHÂN QUYỀN TRUY CẬP ĐÁNH GIÁ (ACCESS CONTROL) CHO REPORT
        await report.addReviewer(expertId, 'expert', req.user.id);

        await assignment.populate([
            { path: 'reportId', select: 'title type code' },
            { path: 'expertId', select: 'fullName email' },
            { path: 'assignedBy', select: 'fullName email' }
        ]);

        const Notification = mongoose.model('Notification');
        await Notification.create({
            recipientId: expertId,
            senderId: req.user.id,
            type: 'assignment_created',
            title: 'Phân công đánh giá mới',
            message: `Bạn được phân công đánh giá báo cáo: ${report.title}`,
            data: {
                assignmentId: assignment._id,
                reportId: report._id,
                url: `/reports/assignments/${assignment._id}`
            },
            priority: priority === 'urgent' ? 'high' : 'normal'
        });

        res.status(201).json({
            success: true,
            message: 'Tạo phân công đánh giá thành công',
            data: assignment
        });

    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi tạo phân công'
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
                message: 'Không tìm thấy phân công trong năm học này'
            });
        }

        if (req.user.role !== 'admin' && assignment.assignedBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền cập nhật phân công này'
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
            message: 'Cập nhật phân công thành công',
            data: assignment
        });

    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật phân công'
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
                message: 'Không tìm thấy phân công trong năm học này'
            });
        }

        if (req.user.role !== 'admin' && assignment.assignedBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xóa phân công này'
            });
        }

        if (assignment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa phân công đã hoàn thành'
            });
        }

        await Assignment.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa phân công thành công'
        });

    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa phân công'
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
                message: 'Không tìm thấy phân công'
            });
        }

        if (assignment.expertId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền phản hồi phân công này'
            });
        }

        if (assignment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Phân công đã được phản hồi trước đó'
            });
        }

        await assignment.accept(responseNote);

        res.json({
            success: true,
            message: 'Chấp nhận phân công thành công',
            data: assignment
        });

    } catch (error) {
        console.error('Accept assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi chấp nhận phân công'
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
                message: 'Không tìm thấy phân công'
            });
        }

        if (assignment.expertId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền phản hồi phân công này'
            });
        }

        if (assignment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Phân công đã được phản hồi trước đó'
            });
        }

        await assignment.reject(responseNote);

        res.json({
            success: true,
            message: 'Từ chối phân công thành công',
            data: assignment
        });

    } catch (error) {
        console.error('Reject assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi từ chối phân công'
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
                message: 'Không tìm thấy phân công'
            });
        }

        if (req.user.role !== 'admin' && assignment.assignedBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền hủy phân công này'
            });
        }

        await assignment.cancel(reason, req.user.id);

        res.json({
            success: true,
            message: 'Hủy phân công thành công',
            data: assignment
        });

    } catch (error) {
        console.error('Cancel assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi hủy phân công'
        });
    }
};

const getExpertWorkload = async (req, res) => {
    try {
        const { expertId } = req.params;
        const academicYearId = req.academicYearId;

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
            message: 'Lỗi hệ thống khi lấy thống kê phân công'
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
    getUpcomingDeadlines
};