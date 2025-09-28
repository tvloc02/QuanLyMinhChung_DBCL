const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Người nhận thông báo
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người nhận là bắt buộc']
    },

    // Người gửi (có thể là hệ thống)
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Loại thông báo
    type: {
        type: String,
        enum: [
            'assignment_new',         // Phân công mới
            'assignment_reminder',    // Nhắc nhở phân công
            'assignment_overdue',     // Phân công quá hạn
            'assignment_cancelled',   // Hủy phân công
            'evaluation_submitted',   // Đánh giá đã nộp
            'evaluation_reviewed',    // Đánh giá đã xem xét
            'report_published',       // Báo cáo được xuất bản
            'report_updated',         // Báo cáo được cập nhật
            'system_maintenance',     // Bảo trì hệ thống
            'deadline_approaching',   // Gần hạn chót
            'user_mentioned',         // Được nhắc đến
            'general'                 // Thông báo chung
        ],
        required: [true, 'Loại thông báo là bắt buộc']
    },

    // Tiêu đề thông báo
    title: {
        type: String,
        required: [true, 'Tiêu đề thông báo là bắt buộc'],
        maxlength: [200, 'Tiêu đề không được quá 200 ký tự']
    },

    // Nội dung thông báo
    message: {
        type: String,
        required: [true, 'Nội dung thông báo là bắt buộc'],
        maxlength: [1000, 'Nội dung không được quá 1000 ký tự']
    },

    // Dữ liệu bổ sung
    data: {
        reportId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Report'
        },
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assignment'
        },
        evaluationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Evaluation'
        },
        evidenceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Evidence'
        },
        url: String,        // URL để chuyển hướng
        action: String,     // Hành động có thể thực hiện
        metadata: mongoose.Schema.Types.Mixed
    },

    // Mức độ ưu tiên
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Trạng thái
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'clicked', 'dismissed'],
        default: 'sent'
    },

    // Thời gian đọc
    readAt: Date,

    // Thời gian click
    clickedAt: Date,

    // Thời gian dismiss
    dismissedAt: Date,

    // Cấu hình gửi
    channels: {
        inApp: {
            type: Boolean,
            default: true
        },
        email: {
            type: Boolean,
            default: false
        },
        sms: {
            type: Boolean,
            default: false
        }
    },

    // Email tracking
    emailStatus: {
        sent: Boolean,
        sentAt: Date,
        opened: Boolean,
        openedAt: Date,
        clicked: Boolean,
        clickedAt: Date,
        bounced: Boolean,
        bouncedAt: Date,
        error: String
    },

    // SMS tracking
    smsStatus: {
        sent: Boolean,
        sentAt: Date,
        delivered: Boolean,
        deliveredAt: Date,
        error: String
    },

    // Thời gian hết hạn
    expiresAt: Date,

    // Nhóm thông báo (để gom nhóm)
    groupKey: String,

    // Template thông báo (nếu có)
    templateId: String,
    templateVars: mongoose.Schema.Types.Mixed,

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
notificationSchema.index({ recipientId: 1, status: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ groupKey: 1 });
notificationSchema.index({ 'data.assignmentId': 1 });
notificationSchema.index({ 'data.reportId': 1 });

// Pre-save middleware
notificationSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }

    // Auto-set expiry if not set
    if (!this.expiresAt) {
        const expiryDays = this.priority === 'urgent' ? 7 : 30;
        this.expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    }

    next();
});

// Virtual fields
notificationSchema.virtual('isExpired').get(function() {
    return this.expiresAt && this.expiresAt < new Date();
});

notificationSchema.virtual('isUnread').get(function() {
    return this.status === 'sent' || this.status === 'delivered';
});

notificationSchema.virtual('priorityText').get(function() {
    const priorityMap = {
        'low': 'Thấp',
        'normal': 'Bình thường',
        'high': 'Cao',
        'urgent': 'Khẩn cấp'
    };
    return priorityMap[this.priority] || this.priority;
});

notificationSchema.virtual('typeText').get(function() {
    const typeMap = {
        'assignment_new': 'Phân công mới',
        'assignment_reminder': 'Nhắc nhở phân công',
        'assignment_overdue': 'Phân công quá hạn',
        'assignment_cancelled': 'Hủy phân công',
        'evaluation_submitted': 'Đánh giá đã nộp',
        'evaluation_reviewed': 'Đánh giá đã xem xét',
        'report_published': 'Báo cáo được xuất bản',
        'report_updated': 'Báo cáo được cập nhật',
        'system_maintenance': 'Bảo trì hệ thống',
        'deadline_approaching': 'Gần hạn chót',
        'user_mentioned': 'Được nhắc đến',
        'general': 'Thông báo chung'
    };
    return typeMap[this.type] || this.type;
});

// Instance methods
notificationSchema.methods.markAsRead = function() {
    if (this.status === 'sent' || this.status === 'delivered') {
        this.status = 'read';
        this.readAt = new Date();
        return this.save();
    }
    return Promise.resolve(this);
};

notificationSchema.methods.markAsClicked = function() {
    this.status = 'clicked';
    this.clickedAt = new Date();
    if (!this.readAt) {
        this.readAt = new Date();
    }
    return this.save();
};

notificationSchema.methods.dismiss = function() {
    this.status = 'dismissed';
    this.dismissedAt = new Date();
    return this.save();
};

notificationSchema.methods.canView = function(userId) {
    return this.recipientId.toString() === userId.toString();
};

notificationSchema.methods.getActionUrl = function() {
    if (this.data?.url) return this.data.url;

    // Generate URL based on type and data
    switch (this.type) {
        case 'assignment_new':
        case 'assignment_reminder':
        case 'assignment_overdue':
            return this.data?.assignmentId ? `/assignments/${this.data.assignmentId}` : null;

        case 'evaluation_submitted':
        case 'evaluation_reviewed':
            return this.data?.evaluationId ? `/evaluations/${this.data.evaluationId}` : null;

        case 'report_published':
        case 'report_updated':
            return this.data?.reportId ? `/reports/${this.data.reportId}` : null;

        default:
            return null;
    }
};

// Static methods
notificationSchema.statics.createAssignmentNotification = async function(assignmentId, type, recipientId, senderId = null) {
    const Assignment = mongoose.model('Assignment');
    const assignment = await Assignment.findById(assignmentId)
        .populate('reportId', 'title type')
        .populate('expertId', 'fullName')
        .populate('assignedBy', 'fullName');

    if (!assignment) throw new Error('Assignment not found');

    const titleMap = {
        'assignment_new': `Phân công đánh giá mới: ${assignment.reportId.title}`,
        'assignment_reminder': `Nhắc nhở: ${assignment.reportId.title}`,
        'assignment_overdue': `Quá hạn: ${assignment.reportId.title}`,
        'assignment_cancelled': `Hủy phân công: ${assignment.reportId.title}`
    };

    const messageMap = {
        'assignment_new': `Bạn được phân công đánh giá báo cáo "${assignment.reportId.title}". Hạn chót: ${assignment.deadline.toLocaleDateString('vi-VN')}.`,
        'assignment_reminder': `Nhắc nhở đánh giá báo cáo "${assignment.reportId.title}". Hạn chót: ${assignment.deadline.toLocaleDateString('vi-VN')}.`,
        'assignment_overdue': `Phân công đánh giá "${assignment.reportId.title}" đã quá hạn chót (${assignment.deadline.toLocaleDateString('vi-VN')}).`,
        'assignment_cancelled': `Phân công đánh giá "${assignment.reportId.title}" đã bị hủy.`
    };

    const notification = new this({
        recipientId,
        senderId,
        type,
        title: titleMap[type],
        message: messageMap[type],
        data: {
            assignmentId,
            reportId: assignment.reportId._id,
            url: `/assignments/${assignmentId}`
        },
        priority: type === 'assignment_overdue' ? 'urgent' : 'normal',
        channels: {
            inApp: true,
            email: ['assignment_new', 'assignment_overdue'].includes(type)
        }
    });

    return notification.save();
};

notificationSchema.statics.createEvaluationNotification = async function(evaluationId, type, recipientId, senderId = null) {
    const Evaluation = mongoose.model('Evaluation');
    const evaluation = await Evaluation.findById(evaluationId)
        .populate('reportId', 'title')
        .populate('evaluatorId', 'fullName');

    if (!evaluation) throw new Error('Evaluation not found');

    const titleMap = {
        'evaluation_submitted': `Đánh giá đã nộp: ${evaluation.reportId.title}`,
        'evaluation_reviewed': `Đánh giá đã xem xét: ${evaluation.reportId.title}`
    };

    const messageMap = {
        'evaluation_submitted': `${evaluation.evaluatorId.fullName} đã nộp đánh giá cho báo cáo "${evaluation.reportId.title}".`,
        'evaluation_reviewed': `Đánh giá của bạn cho báo cáo "${evaluation.reportId.title}" đã được xem xét.`
    };

    const notification = new this({
        recipientId,
        senderId,
        type,
        title: titleMap[type],
        message: messageMap[type],
        data: {
            evaluationId,
            reportId: evaluation.reportId._id,
            url: `/evaluations/${evaluationId}`
        },
        priority: 'normal',
        channels: {
            inApp: true,
            email: true
        }
    });

    return notification.save();
};

notificationSchema.statics.createReportNotification = async function(reportId, type, recipientIds, senderId = null) {
    const Report = mongoose.model('Report');
    const report = await Report.findById(reportId)
        .populate('createdBy', 'fullName');

    if (!report) throw new Error('Report not found');

    const titleMap = {
        'report_published': `Báo cáo mới: ${report.title}`,
        'report_updated': `Cập nhật báo cáo: ${report.title}`
    };

    const messageMap = {
        'report_published': `${report.createdBy.fullName} đã xuất bản báo cáo "${report.title}".`,
        'report_updated': `Báo cáo "${report.title}" đã được cập nhật bởi ${report.createdBy.fullName}.`
    };

    const notifications = recipientIds.map(recipientId => ({
        recipientId,
        senderId,
        type,
        title: titleMap[type],
        message: messageMap[type],
        data: {
            reportId,
            url: `/reports/${reportId}`
        },
        priority: type === 'report_published' ? 'high' : 'normal',
        channels: {
            inApp: true,
            email: type === 'report_published'
        }
    }));

    return this.insertMany(notifications);
};

notificationSchema.statics.createSystemNotification = async function(title, message, recipientIds, data = {}) {
    const notifications = recipientIds.map(recipientId => ({
        recipientId,
        type: 'general',
        title,
        message,
        data,
        priority: data.priority || 'normal',
        channels: {
            inApp: true,
            email: data.sendEmail || false
        }
    }));

    return this.insertMany(notifications);
};

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        types = [],
        priority = null
    } = options;

    let query = { recipientId: userId };

    if (unreadOnly) {
        query.status = { $in: ['sent', 'delivered'] };
    }

    if (types.length > 0) {
        query.type = { $in: types };
    }

    if (priority) {
        query.priority = priority;
    }

    // Filter out expired notifications
    query.expiresAt = { $gt: new Date() };

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        this.find(query)
            .populate('senderId', 'fullName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        this.countDocuments(query),
        this.countDocuments({
            recipientId: userId,
            status: { $in: ['sent', 'delivered'] },
            expiresAt: { $gt: new Date() }
        })
    ]);

    return {
        notifications,
        total,
        unreadCount,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
    };
};

notificationSchema.statics.markAllAsRead = async function(userId) {
    return this.updateMany(
        {
            recipientId: userId,
            status: { $in: ['sent', 'delivered'] }
        },
        {
            status: 'read',
            readAt: new Date()
        }
    );
};

notificationSchema.statics.cleanupExpired = async function() {
    return this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};

notificationSchema.statics.getNotificationStats = async function(userId = null) {
    let matchStage = {};
    if (userId) {
        matchStage.recipientId = mongoose.Types.ObjectId(userId);
    }

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                unread: { $sum: { $cond: [{ $in: ['$status', ['sent', 'delivered']] }, 1, 0] } },
                read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
                clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
                dismissed: { $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] } }
            }
        }
    ]);

    return stats[0] || { total: 0, unread: 0, read: 0, clicked: 0, dismissed: 0 };
};

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);