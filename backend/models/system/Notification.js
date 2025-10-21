const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người nhận là bắt buộc']
    },

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    type: {
        type: String,
        enum: [
            'assignment_new',
            'assignment_reminder',
            'assignment_overdue',
            'assignment_cancelled',
            'evaluation_submitted',
            'evaluation_supervised',
            'evaluation_reevaluated',
            'evaluation_finalized',
            'evaluation_reviewed',
            'report_published',
            'report_updated',
            'report_access_granted',
            'report_comment_added',
            'report_review_requested',
            'system_maintenance',
            'deadline_approaching',
            'user_mentioned',
            'general',
            // Bổ sung loại thông báo mới
            'evidence_request',
            'evidence_request_completed'
        ],
        required: [true, 'Loại thông báo là bắt buộc']
    },

    title: {
        type: String,
        required: [true, 'Tiêu đề thông báo là bắt buộc'],
        maxlength: [200, 'Tiêu đề không được quá 200 ký tự']
    },

    message: {
        type: String,
        required: [true, 'Nội dung thông báo là bắt buộc'],
        maxlength: [1000, 'Nội dung không được quá 1000 ký tự']
    },

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
        standardId: { // Thêm
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Standard'
        },
        criteriaId: { // Thêm
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Criteria'
        },
        departmentId: { // Thêm
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department'
        },
        url: String,
        action: String,
        metadata: mongoose.Schema.Types.Mixed
    },

    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'clicked', 'dismissed'],
        default: 'sent'
    },

    readAt: Date,
    clickedAt: Date,
    dismissedAt: Date,

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

    smsStatus: {
        sent: Boolean,
        sentAt: Date,
        delivered: Boolean,
        deliveredAt: Date,
        error: String
    },

    expiresAt: Date,
    groupKey: String,
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

notificationSchema.index({ recipientId: 1, status: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ groupKey: 1 });
notificationSchema.index({ 'data.assignmentId': 1 });
notificationSchema.index({ 'data.reportId': 1 });

notificationSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }

    if (!this.expiresAt) {
        const expiryDays = this.priority === 'urgent' ? 7 : 30;
        this.expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    }

    next();
});

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
        'evaluation_supervised': 'Đánh giá được chấp thuận',
        'evaluation_reevaluated': 'Yêu cầu đánh giá lại',
        'evaluation_finalized': 'Đánh giá đã Hoàn tất',
        'evaluation_reviewed': 'Đánh giá đã xem xét',
        'report_published': 'Báo cáo được xuất bản',
        'report_updated': 'Báo cáo được cập nhật',
        'report_access_granted': 'Cấp quyền xem báo cáo',
        'report_comment_added': 'Nhận xét mới',
        'report_review_requested': 'Yêu cầu xem xét báo cáo',
        'system_maintenance': 'Bảo trì hệ thống',
        'deadline_approaching': 'Gần hạn chót',
        'user_mentioned': 'Được nhắc đến',
        'general': 'Thông báo chung',
        'evidence_request': 'Yêu cầu minh chứng',
        'evidence_request_completed': 'Xác nhận yêu cầu MC'
    };
    return typeMap[this.type] || this.type;
});

notificationSchema.methods.addActivityLog = async function(action, userId, description, additionalData = {}) {
    const ActivityLog = require('./ActivityLog');
    return ActivityLog.log({
        userId,
        action,
        description,
        targetType: 'Notification',
        targetId: this._id,
        targetName: this.title,
        ...additionalData
    });
};

notificationSchema.methods.markAsRead = async function() {
    if (this.status === 'sent' || this.status === 'delivered') {
        const oldStatus = this.status;
        this.status = 'read';
        this.readAt = new Date();

        await this.save();

        await this.addActivityLog('notification_read', this.recipientId,
            `Đọc thông báo: ${this.title}`, {
                severity: 'low',
                oldData: { status: oldStatus },
                newData: { status: 'read' }
            });
    }
    return this;
};

notificationSchema.methods.markAsClicked = async function() {
    this.status = 'clicked';
    this.clickedAt = new Date();
    if (!this.readAt) {
        this.readAt = new Date();
    }

    await this.save();

    await this.addActivityLog('notification_click', this.recipientId,
        `Click thông báo: ${this.title}`, {
            severity: 'low'
        });

    return this;
};

notificationSchema.methods.dismiss = async function() {
    this.status = 'dismissed';
    this.dismissedAt = new Date();

    await this.save();

    await this.addActivityLog('notification_dismiss', this.recipientId,
        `Dismiss thông báo: ${this.title}`, {
            severity: 'low'
        });

    return this;
};

notificationSchema.methods.canView = function(userId) {
    return this.recipientId.toString() === userId.toString();
};

notificationSchema.methods.getActionUrl = function() {
    if (this.data?.url) return this.data.url;

    switch (this.type) {
        case 'assignment_new':
        case 'assignment_reminder':
        case 'assignment_overdue':
        case 'assignment_cancelled':
            return this.data?.assignmentId ? `/assignments/${this.data.assignmentId}` : null;

        case 'evaluation_submitted':
        case 'evaluation_reviewed':
        case 'evaluation_supervised':
        case 'evaluation_reevaluated':
        case 'evaluation_finalized':
            return this.data?.evaluationId ? `/evaluations/${this.data.evaluationId}` : null;

        case 'report_published':
        case 'report_updated':
        case 'report_access_granted':
        case 'report_comment_added':
        case 'report_review_requested':
            return this.data?.reportId ? `/reports/${this.data.reportId}` : null;

        case 'evidence_request':
            // Chuyển đến trang xem Cây minh chứng với filter phòng ban đã chọn
            return this.data?.departmentId ? `/evidence-management/tree?departmentId=${this.data.departmentId}` : '/evidence-management/tree';

        default:
            return null;
    }
};

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

    let senderName = senderId ? (await mongoose.model('User').findById(senderId))?.fullName : 'Hệ thống';

    const titleMap = {
        'evaluation_submitted': `Đánh giá đã nộp: ${evaluation.reportId.title}`,
        'evaluation_reviewed': `Đánh giá đã xem xét: ${evaluation.reportId.title}`,
        'evaluation_supervised': `✅ Đánh giá được chấp thuận: ${evaluation.reportId.title}`,
        'evaluation_reevaluated': `⚠️ Yêu cầu đánh giá lại: ${evaluation.reportId.title}`,
        'evaluation_finalized': `⭐ Đánh giá đã Hoàn tất: ${evaluation.reportId.title}`
    };

    const messageMap = {
        'evaluation_submitted': `${evaluation.evaluatorId.fullName} đã nộp đánh giá cho báo cáo "${evaluation.reportId.title}".`,
        'evaluation_reviewed': `Đánh giá của bạn cho báo cáo "${evaluation.reportId.title}" đã được xem xét.`,
        'evaluation_supervised': `Đánh giá của bạn cho báo cáo "${evaluation.reportId.title}" đã được ${senderName} chấp thuận giám sát.`,
        'evaluation_reevaluated': `Đánh giá của bạn cho báo cáo "${evaluation.reportId.title}" đã bị ${senderName} yêu cầu đánh giá lại. Vui lòng kiểm tra nhận xét.`,
        'evaluation_finalized': `Đánh giá của bạn cho báo cáo "${evaluation.reportId.title}" đã được ${senderName} Hoàn tất (Finalized).`
    };

    const priorityMap = {
        'evaluation_submitted': 'high',
        'evaluation_reviewed': 'normal',
        'evaluation_supervised': 'normal',
        'evaluation_reevaluated': 'urgent',
        'evaluation_finalized': 'high'
    }

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
        priority: priorityMap[type] || 'normal',
        channels: {
            inApp: true,
            email: ['evaluation_submitted', 'evaluation_reevaluated', 'evaluation_finalized'].includes(type)
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

notificationSchema.statics.createEvidenceRequestNotification = async function(departmentId, standardId, criteriaId, senderId) {
    const Department = mongoose.model('Department');
    const Standard = mongoose.model('Standard');
    const Criteria = mongoose.model('Criteria');

    const [department, standard, criteria] = await Promise.all([
        Department.findById(departmentId).populate('manager', 'fullName'),
        Standard.findById(standardId),
        Criteria.findById(criteriaId)
    ]);

    if (!department) throw new Error('Department not found');
    if (!department.manager) throw new Error('Department has no manager');
    if (!standard || !criteria) throw new Error('Standard or Criteria not found');

    const recipientId = department.manager._id;
    const standardName = `${standard.code} - ${standard.name}`;
    const criteriaName = `${criteria.code} - ${criteria.name}`;
    const departmentName = department.name;

    const title = `Yêu cầu bổ sung minh chứng cho ${standard.code}.${criteria.code}`;
    const message = `Phòng ban ${departmentName} cần bổ sung minh chứng cho Tiêu chuẩn: ${standardName}, Tiêu chí: ${criteriaName}. Vui lòng kiểm tra và thực hiện.`;

    const notification = new this({
        recipientId,
        senderId,
        type: 'evidence_request',
        title,
        message,
        data: {
            departmentId,
            standardId,
            criteriaId,
            url: `/evidence-management/tree?departmentId=${departmentId}`
        },
        priority: 'high',
        channels: {
            inApp: true,
            email: true
        }
    });

    return notification.save();
};

notificationSchema.statics.createEvidenceRequestCompletedNotification = async function(requestNotificationId, senderId) {
    const Notification = mongoose.model('Notification');
    const requestNotification = await Notification.findById(requestNotificationId)
        .populate('data.departmentId', 'name')
        .populate('data.standardId', 'code name')
        .populate('data.criteriaId', 'code name');

    if (!requestNotification) throw new Error('Request notification not found');
    if (requestNotification.type !== 'evidence_request') throw new Error('Not an evidence request notification');

    // Người gửi thông báo ban đầu là người nhận thông báo hoàn thành
    const recipientId = requestNotification.senderId;
    const departmentName = requestNotification.data.departmentId.name;
    const standardCode = requestNotification.data.standardId.code;
    const criteriaCode = requestNotification.data.criteriaId.code;
    const senderName = (await mongoose.model('User').findById(senderId))?.fullName || 'Manager';

    const title = `Phòng ban ${departmentName} đã Hoàn thành yêu cầu MC`;
    const message = `${senderName} (Manager) đã đánh dấu Hoàn thành yêu cầu bổ sung minh chứng cho ${standardCode}.${criteriaCode}. Vui lòng kiểm tra.`;

    const notification = new this({
        recipientId,
        senderId,
        type: 'evidence_request_completed',
        title,
        message,
        data: {
            departmentId: requestNotification.data.departmentId._id,
            standardId: requestNotification.data.standardId._id,
            criteriaId: requestNotification.data.criteriaId._id,
            url: `/evidence-management/tree?departmentId=${requestNotification.data.departmentId._id}`
        },
        priority: 'normal',
        channels: {
            inApp: true
        }
    });

    // Cập nhật trạng thái của thông báo yêu cầu ban đầu (tùy chọn)
    // requestNotification.data.metadata.isCompleted = true;
    // await requestNotification.save();

    return notification.save();
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
        if (mongoose.Types.ObjectId.isValid(userId)) {
            matchStage.recipientId = new mongoose.Types.ObjectId(userId);
        } else {
            console.error(`Invalid userId passed to getNotificationStats: ${userId}`);
            if (userId === 'Invalid ID from req.user.id') {
                return { total: 0, unread: 0, read: 0, clicked: 0, dismissed: 0 };
            }
        }
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

notificationSchema.post('save', async function(doc, next) {
    if (this.isNew && this.senderId) {
        try {
            await this.addActivityLog('notification_send', this.senderId,
                `Gửi thông báo: ${this.title}`, {
                    severity: 'low',
                    result: 'success',
                    metadata: {
                        recipientId: this.recipientId,
                        type: this.type
                    }
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

notificationSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.recipientId) {
        try {
            await doc.addActivityLog('notification_delete', doc.recipientId,
                `Xóa thông báo: ${doc.title}`, {
                    severity: 'low',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);