const mongoose = require('mongoose');
const ReportRequest = require('../../models/report/ReportRequest');
const User = require('../../models/User/User');
const Report = require('../../models/report/Report');

const getReportRequests = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            status,
            priority,
            createdBy,
            assignedTo,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const academicYearId = req.academicYearId;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

        // Manager xem yêu cầu mà họ tạo hoặc được phân công
        if (req.user.role === 'manager' && !createdBy && !assignedTo) {
            query.$or = [
                { createdBy: req.user.id },
                { assignedTo: req.user.id }
            ];
        }
        // TDG xem yêu cầu được phân công cho họ
        else if (req.user.role === 'tdg' && !assignedTo) {
            query.assignedTo = req.user.id;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (createdBy) query.createdBy = createdBy;
        if (assignedTo) query.assignedTo = assignedTo;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [requests, total] = await Promise.all([
            ReportRequest.find(query)
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('assignedTo', 'fullName email')
                .populate('reportId', '_id code title')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            ReportRequest.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                requests,
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
        console.error('Get report requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách yêu cầu'
        });
    }
};

const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const request = await ReportRequest.findOne({ _id: id, academicYearId })
            .populate('programId')
            .populate('organizationId')
            .populate('standardId')
            .populate('criteriaId')
            .populate('createdBy', 'fullName email')
            .populate('assignedTo', 'fullName email')
            .populate('reportId');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu'
            });
        }

        // Kiểm tra quyền
        if (req.user.role !== 'admin' &&
            request.createdBy._id.toString() !== req.user.id.toString() &&
            request.assignedTo._id.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem yêu cầu này'
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Get request by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin yêu cầu'
        });
    }
};

const createReportRequest = async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            programId,
            organizationId,
            standardId,
            criteriaId,
            deadline,
            priority,
            assignedTo
        } = req.body;

        const academicYearId = req.academicYearId;
        // Chỉ manager tạo request
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo yêu cầu'
            });
        }

        if (!assignedTo) {
            return res.status(400).json({
                success: false,
                message: 'Người nhận yêu cầu là bắt buộc'
            });
        }

        // Kiểm tra người nhận có role tdg không
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser || assignedUser.role !== 'tdg') {
            return res.status(400).json({
                success: false,
                message: 'Người nhận phải có role TDG (Tác Động Giáo Dục)'
            });
        }

        const requestData = new ReportRequest({
            academicYearId,
            title: title.trim(),
            description: description.trim(),
            type,
            programId,
            organizationId,
            deadline: new Date(deadline),
            priority: priority || 'normal',
            createdBy: req.user.id,
            assignedTo
        });

        if (type !== 'comprehensive_report' && standardId) {
            requestData.standardId = standardId;
        }

        if (type === 'criteria_analysis' && criteriaId) {
            requestData.criteriaId = criteriaId;
        }

        await requestData.save();

        await requestData.populate([
            { path: 'programId', select: 'name code' },
            { path: 'organizationId', select: 'name code' },
            { path: 'standardId', select: 'name code' },
            { path: 'criteriaId', select: 'name code' },
            { path: 'createdBy', select: 'fullName email' },
            { path: 'assignedTo', select: 'fullName email' }
        ]);

        // Gửi notification
        const Notification = mongoose.model('Notification');
        await Notification.create({
            recipientId: assignedTo,
            senderId: req.user.id,
            type: 'report_request_new',
            title: 'Yêu cầu viết báo cáo mới',
            message: `Bạn được giao yêu cầu viết báo cáo: ${title}`,
            data: {
                requestId: requestData._id,
                url: `/reports/my-requests/${requestData._id}`
            },
            priority: priority === 'urgent' ? 'high' : 'normal'
        });

        res.status(201).json({
            success: true,
            message: 'Tạo yêu cầu thành công',
            data: requestData
        });
    } catch (error) {
        console.error('Create report request error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi tạo yêu cầu'
        });
    }
};

const acceptRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const request = await ReportRequest.findOne({ _id: id, academicYearId });
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu'
            });
        }

        if (request.assignedTo.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền phản hồi yêu cầu này'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu đã được phản hồi'
            });
        }

        await request.accept();

        res.json({
            success: true,
            message: 'Chấp nhận yêu cầu thành công',
            data: request
        });
    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi chấp nhận yêu cầu'
        });
    }
};

const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { responseNote } = req.body;
        const academicYearId = req.academicYearId;

        const request = await ReportRequest.findOne({ _id: id, academicYearId });
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy yêu cầu'
            });
        }

        if (request.assignedTo.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền phản hồi yêu cầu này'
            });
        }

        if (request.status !== 'pending' && request.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Yêu cầu không thể từ chối lúc này'
            });
        }

        await request.reject(responseNote);

        res.json({
            success: true,
            message: 'Từ chối yêu cầu thành công',
            data: request
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi từ chối yêu cầu'
        });
    }
};

module.exports = {
    getReportRequests,
    getRequestById,
    createReportRequest,
    acceptRequest,
    rejectRequest
};