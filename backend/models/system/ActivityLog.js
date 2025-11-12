const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    // Người thực hiện hoạt động
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người thực hiện là bắt buộc']
    },

    // Năm học (để filter logs theo năm học)
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    },

    // Loại hoạt động
    action: {
        type: String,
        enum: [
            // User actions
            'user_login', 'user_logout', 'user_create', 'user_update', 'user_delete',
            'user_password_reset', 'user_password_change', 'user_status_change',

            // Academic Year actions
            'academic_year_create', 'academic_year_update', 'academic_year_delete',
            'academic_year_activate', 'academic_year_copy',

            // Program actions
            'program_create', 'program_update', 'program_delete',

            // Organization actions
            'organization_create', 'organization_update', 'organization_delete',

            // Standard actions
            'standard_create', 'standard_update', 'standard_delete',

            // Criteria actions
            'criteria_create', 'criteria_update', 'criteria_delete',

            // Evidence actions
            'evidence_create', 'evidence_update', 'evidence_delete',
            'evidence_move', 'evidence_copy', 'evidence_view',

            // File actions
            'file_upload', 'file_download', 'file_delete', 'file_view',

            // Report actions
            'report_create', 'report_update', 'report_delete', 
            'report_make_public', 'report_approve', 'report_reject', 'report_publish',
            'report_view', 'report_download', 'report_copy',

            // Assignment actions
            'assignment_create', 'assignment_update', 'assignment_delete',
            'assignment_accept', 'assignment_reject', 'assignment_cancel',

            // Evaluation actions
            'evaluation_create', 'evaluation_update', 'evaluation_submit',
            'evaluation_review', 'evaluation_finalize', 'evaluation_view',

            // Notification actions
            'notification_send', 'notification_read', 'notification_delete',

            // System actions
            'system_backup', 'system_restore', 'system_maintenance',
            'bulk_import', 'bulk_export', 'data_migration'
        ],
        required: [true, 'Loại hoạt động là bắt buộc']
    },

    // Mô tả chi tiết hoạt động
    description: {
        type: String,
        required: [true, 'Mô tả hoạt động là bắt buộc'],
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },

    // Đối tượng bị tác động
    targetType: {
        type: String,
        enum: [
            'User', 'AcademicYear', 'Program', 'Organization', 'Standard',
            'Criteria', 'Evidence', 'File', 'Report', 'Assignment',
            'Evaluation', 'Notification', 'System'
        ]
    },

    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'targetType'
    },

    targetName: {
        type: String,
        maxlength: [200, 'Tên đối tượng không được quá 200 ký tự']
    },

    // Dữ liệu trước khi thay đổi (cho update actions)
    oldData: {
        type: mongoose.Schema.Types.Mixed
    },

    // Dữ liệu sau khi thay đổi (cho update actions)
    newData: {
        type: mongoose.Schema.Types.Mixed
    },

    // Thông tin request
    requestInfo: {
        ipAddress: {
            type: String,
            validate: {
                validator: function(ip) {
                    if (!ip) return true;
                    // Basic IP validation
                    return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip) ||
                        /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip);
                },
                message: 'Địa chỉ IP không hợp lệ'
            }
        },
        userAgent: {
            type: String,
            maxlength: [500, 'User agent không được quá 500 ký tự']
        },
        method: {
            type: String,
            enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            default: 'POST'
        },
        endpoint: {
            type: String,
            maxlength: [200, 'Endpoint không được quá 200 ký tự']
        },
        responseStatus: {
            type: Number,
            min: 100,
            max: 599
        }
    },

    // Mức độ quan trọng
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },

    // Kết quả hoạt động
    result: {
        type: String,
        enum: ['success', 'failure', 'warning', 'info'],
        default: 'success'
    },

    // Thông tin lỗi (nếu có)
    error: {
        message: String,
        code: String,
        stack: String
    },

    // Thời gian thực hiện (milliseconds)
    duration: {
        type: Number,
        min: 0
    },

    // Tags để phân loại
    tags: [{
        type: String,
        maxlength: [50, 'Tag không được quá 50 ký tự']
    }],

    // Thông tin bổ sung
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },

    // Đánh dấu hoạt động quan trọng cần audit
    isAuditRequired: {
        type: Boolean,
        default: false
    },

    // Hoạt động có thể hoàn tác
    isReversible: {
        type: Boolean,
        default: false
    },

    // ID của hoạt động reverse (nếu có)
    reversedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ActivityLog'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ academicYearId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ severity: 1, result: 1 });
activityLogSchema.index({ isAuditRequired: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ 'requestInfo.ipAddress': 1 });
activityLogSchema.index({ tags: 1 });

// TTL index để tự động xóa logs cũ sau 2 năm
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Virtual fields
activityLogSchema.virtual('actionText').get(function() {
    const actionMap = {
        // User actions
        'user_login': 'Đăng nhập',
        'user_logout': 'Đăng xuất',
        'user_create': 'Tạo người dùng',
        'user_update': 'Cập nhật người dùng',
        'user_delete': 'Xóa người dùng',
        'user_password_reset': 'Đặt lại mật khẩu',
        'user_password_change': 'Đổi mật khẩu',
        'user_status_change': 'Thay đổi trạng thái người dùng',

        // Academic Year actions
        'academic_year_create': 'Tạo năm học',
        'academic_year_update': 'Cập nhật năm học',
        'academic_year_delete': 'Xóa năm học',
        'academic_year_activate': 'Kích hoạt năm học',
        'academic_year_copy': 'Sao chép năm học',

        // Program actions
        'program_create': 'Tạo chương trình',
        'program_update': 'Cập nhật chương trình',
        'program_delete': 'Xóa chương trình',

        // Organization actions
        'organization_create': 'Tạo tổ chức',
        'organization_update': 'Cập nhật tổ chức',
        'organization_delete': 'Xóa tổ chức',

        // Standard actions
        'standard_create': 'Tạo tiêu chuẩn',
        'standard_update': 'Cập nhật tiêu chuẩn',
        'standard_delete': 'Xóa tiêu chuẩn',

        // Criteria actions
        'criteria_create': 'Tạo tiêu chí',
        'criteria_update': 'Cập nhật tiêu chí',
        'criteria_delete': 'Xóa tiêu chí',

        // Evidence actions
        'evidence_create': 'Tạo minh chứng',
        'evidence_update': 'Cập nhật minh chứng',
        'evidence_delete': 'Xóa minh chứng',
        'evidence_move': 'Di chuyển minh chứng',
        'evidence_copy': 'Sao chép minh chứng',
        'evidence_view': 'Xem minh chứng',

        // File actions
        'file_upload': 'Tải lên file',
        'file_download': 'Tải xuống file',
        'file_delete': 'Xóa file',
        'file_view': 'Xem file',

        // Report actions
        'report_create': 'Tạo báo cáo',
        'report_update': 'Cập nhật báo cáo',
        'report_delete': 'Xóa báo cáo',
        'report_make_public': 'Công khai báo cáo',
        'report_approve': 'Chấp thuận báo cáo',
        'report_reject': 'Từ chối báo cáo',
        'report_publish': 'Phát hành báo cáo',
        'report_view': 'Xem báo cáo',
        'report_download': 'Tải xuống báo cáo',
        'report_copy': 'Sao chép báo cáo',

        // Assignment actions
        'assignment_create': 'Tạo phân công',
        'assignment_update': 'Cập nhật phân công',
        'assignment_delete': 'Xóa phân công',
        'assignment_accept': 'Chấp nhận phân công',
        'assignment_reject': 'Từ chối phân công',
        'assignment_cancel': 'Hủy phân công',

        // Evaluation actions
        'evaluation_create': 'Tạo đánh giá',
        'evaluation_update': 'Cập nhật đánh giá',
        'evaluation_submit': 'Nộp đánh giá',
        'evaluation_review': 'Xem xét đánh giá',
        'evaluation_finalize': 'Hoàn tất đánh giá',
        'evaluation_view': 'Xem đánh giá',

        // Notification actions
        'notification_send': 'Gửi thông báo',
        'notification_read': 'Đọc thông báo',
        'notification_delete': 'Xóa thông báo',

        // System actions
        'system_backup': 'Sao lưu hệ thống',
        'system_restore': 'Phục hồi hệ thống',
        'system_maintenance': 'Bảo trì hệ thống',
        'bulk_import': 'Nhập dữ liệu hàng loạt',
        'bulk_export': 'Xuất dữ liệu hàng loạt',
        'data_migration': 'Chuyển đổi dữ liệu'
    };

    return actionMap[this.action] || this.action;
});

activityLogSchema.virtual('severityText').get(function() {
    const severityMap = {
        'low': 'Thấp',
        'medium': 'Trung bình',
        'high': 'Cao',
        'critical': 'Nghiêm trọng'
    };
    return severityMap[this.severity] || this.severity;
});

activityLogSchema.virtual('resultText').get(function() {
    const resultMap = {
        'success': 'Thành công',
        'failure': 'Thất bại',
        'warning': 'Cảnh báo',
        'info': 'Thông tin'
    };
    return resultMap[this.result] || this.result;
});

// Static methods
activityLogSchema.statics.log = async function(logData) {
    try {
        const log = new this(logData);
        return await log.save();
    } catch (error) {
        console.error('Failed to create activity log:', error);
        // Don't throw error to avoid breaking main functionality
        return null;
    }
};

activityLogSchema.statics.logUserAction = async function(userId, action, description, additionalData = {}) {
    return this.log({
        userId,
        action,
        description,
        severity: 'low',
        result: 'success',
        ...additionalData
    });
};

activityLogSchema.statics.logSystemAction = async function(action, description, additionalData = {}) {
    return this.log({
        action,
        description,
        targetType: 'System',
        severity: 'medium',
        result: 'success',
        isAuditRequired: true,
        ...additionalData
    });
};

activityLogSchema.statics.logCriticalAction = async function(userId, action, description, additionalData = {}) {
    return this.log({
        userId,
        action,
        description,
        severity: 'critical',
        result: 'success',
        isAuditRequired: true,
        ...additionalData
    });
};

activityLogSchema.statics.logError = async function(userId, action, error, additionalData = {}) {
    return this.log({
        userId,
        action,
        description: `Lỗi: ${error.message || 'Unknown error'}`,
        severity: 'high',
        result: 'failure',
        isAuditRequired: true,
        error: {
            message: error.message,
            code: error.code,
            stack: error.stack
        },
        ...additionalData
    });
};

activityLogSchema.statics.getActivityStats = async function(filters = {}) {
    const matchStage = {};

    if (filters.userId) matchStage.userId = mongoose.Types.ObjectId(filters.userId);
    if (filters.academicYearId) matchStage.academicYearId = mongoose.Types.ObjectId(filters.academicYearId);
    if (filters.action) matchStage.action = filters.action;
    if (filters.startDate || filters.endDate) {
        matchStage.createdAt = {};
        if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) matchStage.createdAt.$lte = new Date(filters.endDate);
    }

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                byResult: {
                    $push: {
                        result: '$result',
                        count: 1
                    }
                },
                bySeverity: {
                    $push: {
                        severity: '$severity',
                        count: 1
                    }
                },
                byAction: {
                    $push: {
                        action: '$action',
                        count: 1
                    }
                }
            }
        }
    ]);

    return stats[0] || { total: 0, byResult: [], bySeverity: [], byAction: [] };
};

activityLogSchema.statics.getUserActivity = async function(userId, options = {}) {
    const {
        page = 1,
        limit = 50,
        action = null,
        startDate = null,
        endDate = null
    } = options;

    let query = { userId };

    if (action) query.action = action;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        this.find(query)
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        this.countDocuments(query)
    ]);

    return {
        logs,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
    };
};

activityLogSchema.statics.getAuditTrail = async function(targetType, targetId) {
    return this.find({
        targetType,
        targetId,
        isAuditRequired: true
    })
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 });
};

activityLogSchema.statics.cleanupOldLogs = async function(daysToKeep = 730) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    return this.deleteMany({
        createdAt: { $lt: cutoffDate },
        isAuditRequired: false // Keep audit logs longer
    });
};

activityLogSchema.set('toJSON', { virtuals: true });
activityLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);