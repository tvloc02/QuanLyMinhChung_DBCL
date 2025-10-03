const mongoose = require('mongoose');
const Notification = require('../../models/system/Notification');

const getNotifications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            unreadOnly = false,
            types = [],
            priority = null
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true',
            types: types ? (Array.isArray(types) ? types : [types]) : [],
            priority
        };

        const result = await Notification.getUserNotifications(req.user.id, options);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách thông báo'
        });
    }
};

const getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findById(id)
            .populate('senderId', 'fullName email');

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        if (!notification.canView(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem thông báo này'
            });
        }

        res.json({
            success: true,
            data: notification
        });

    } catch (error) {
        console.error('Get notification by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin thông báo'
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        if (!notification.canView(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền thao tác với thông báo này'
            });
        }

        await notification.markAsRead();

        res.json({
            success: true,
            message: 'Đánh dấu đã đọc thành công',
            data: notification
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đánh dấu đã đọc'
        });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.markAllAsRead(req.user.id);

        res.json({
            success: true,
            message: `Đã đánh dấu ${result.modifiedCount} thông báo là đã đọc`,
            data: { modifiedCount: result.modifiedCount }
        });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đánh dấu tất cả đã đọc'
        });
    }
};

const clickNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        if (!notification.canView(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền thao tác với thông báo này'
            });
        }

        await notification.markAsClicked();

        const actionUrl = notification.getActionUrl();

        res.json({
            success: true,
            message: 'Click thông báo thành công',
            data: {
                notification,
                actionUrl
            }
        });

    } catch (error) {
        console.error('Click notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi click thông báo'
        });
    }
};

const dismissNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        if (!notification.canView(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền thao tác với thông báo này'
            });
        }

        await notification.dismiss();

        res.json({
            success: true,
            message: 'Dismiss thông báo thành công',
            data: notification
        });

    } catch (error) {
        console.error('Dismiss notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi dismiss thông báo'
        });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }

        if (!notification.canView(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xóa thông báo này'
            });
        }

        await Notification.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa thông báo thành công'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa thông báo'
        });
    }
};

const createSystemNotification = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền tạo thông báo hệ thống'
            });
        }

        const { title, message, recipientIds, data = {} } = req.body;

        if (!title || !message || !recipientIds || recipientIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        const notifications = await Notification.createSystemNotification(
            title,
            message,
            recipientIds,
            data
        );

        res.status(201).json({
            success: true,
            message: `Tạo thành công ${notifications.length} thông báo`,
            data: { count: notifications.length }
        });

    } catch (error) {
        console.error('Create system notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo thông báo'
        });
    }
};

const getNotificationStats = async (req, res) => {
    try {
        const { userId = null } = req.query;

        let targetUserId = userId;
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            targetUserId = req.user.id;
        }

        const stats = await Notification.getNotificationStats(targetUserId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê thông báo'
        });
    }
};

const cleanupExpiredNotifications = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền dọn dẹp thông báo hết hạn'
            });
        }

        const result = await Notification.cleanupExpired();

        res.json({
            success: true,
            message: `Đã xóa ${result.deletedCount} thông báo hết hạn`,
            data: { deletedCount: result.deletedCount }
        });

    } catch (error) {
        console.error('Cleanup expired notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi dọn dẹp thông báo hết hạn'
        });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            recipientId: req.user.id,
            status: { $in: ['sent', 'delivered'] },
            expiresAt: { $gt: new Date() }
        });

        res.json({
            success: true,
            data: { unreadCount }
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy số thông báo chưa đọc'
        });
    }
};

const sendAssignmentNotification = async (req, res) => {
    try {
        const { assignmentId, type } = req.body;

        if (!['assignment_new', 'assignment_reminder', 'assignment_overdue'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Loại thông báo không hợp lệ'
            });
        }

        const Assignment = require('../../models/report/Assignment');
        const assignment = await Assignment.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân công'
            });
        }

        const notification = await Notification.createAssignmentNotification(
            assignmentId,
            type,
            assignment.expertId,
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: 'Gửi thông báo thành công',
            data: notification
        });

    } catch (error) {
        console.error('Send assignment notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi gửi thông báo phân công'
        });
    }
};

const sendEvaluationNotification = async (req, res) => {
    try {
        const { evaluationId, type, recipientId } = req.body;

        if (!['evaluation_submitted', 'evaluation_reviewed'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Loại thông báo không hợp lệ'
            });
        }

        const notification = await Notification.createEvaluationNotification(
            evaluationId,
            type,
            recipientId,
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: 'Gửi thông báo thành công',
            data: notification
        });

    } catch (error) {
        console.error('Send evaluation notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi gửi thông báo đánh giá'
        });
    }
};

module.exports = {
    getNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    clickNotification,
    dismissNotification,
    deleteNotification,
    createSystemNotification,
    getNotificationStats,
    cleanupExpiredNotifications,
    getUnreadCount,
    sendAssignmentNotification,
    sendEvaluationNotification
};