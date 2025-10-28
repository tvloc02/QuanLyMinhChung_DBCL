const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    },

    // Hành động thực hiện
    action: {
        type: String,
        required: true,
        index: true
    },

    // Mô tả chi tiết
    description: {
        type: String,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },

    // Loại đối tượng bị tác động
    targetType: {
        type: String,
        enum: [
            'User',
            'AcademicYear',
            'Program',
            'Organization',
            'Standard',
            'Criteria',
            'Evidence',
            'File',
            'Report',
            'Assignment',
            'Evaluation'
        ],
        required: true,
        index: true
    },

    // ID của đối tượng bị tác động
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    // Tên đối tượng bị tác động
    targetName: String,

    // Kết quả: success, failure, warning
    result: {
        type: String,
        enum: ['success', 'failure', 'warning'],
        default: 'success'
    },

    // Mức độ: low, medium, high, critical
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true
    },

    // Dữ liệu cũ (để theo dõi thay đổi)
    oldData: mongoose.Schema.Types.Mixed,

    // Dữ liệu mới
    newData: mongoose.Schema.Types.Mixed,

    // Metadata bổ sung
    metadata: mongoose.Schema.Types.Mixed,

    // Có cần kiểm toán không
    isAuditRequired: {
        type: Boolean,
        default: false
    },

    // IP address của người dùng
    ipAddress: String,

    // User agent (trình duyệt, thiết bị)
    userAgent: String,

    // Lỗi (nếu có)
    error: mongoose.Schema.Types.Mixed,

    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
        // Tự động xóa log sau 2 năm
        expires: 63072000
    }
});

// Indexes để tối ưu truy vấn
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ academicYearId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });
activityLogSchema.index({ isAuditRequired: 1, createdAt: -1 });

// Static method: ghi log
activityLogSchema.statics.log = async function(logData) {
    try {
        const log = new this(logData);
        await log.save();
        return log;
    } catch (error) {
        console.error('Error creating activity log:', error);
        return null;
    }
};

// Static method: tìm log của người dùng
activityLogSchema.statics.getUserLogs = function(userId, limit = 50, skip = 0) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'fullName email');
};

// Static method: tìm log của đối tượng
activityLogSchema.statics.getTargetLogs = function(targetType, targetId, limit = 50) {
    return this.find({ targetType, targetId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'fullName email');
};

// Static method: tìm log theo hành động
activityLogSchema.statics.getActionLogs = function(action, limit = 50, skip = 0) {
    return this.find({ action })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'fullName email');
};

// Static method: lấy log từ năm học
activityLogSchema.statics.getAcademicYearLogs = function(academicYearId, limit = 100, skip = 0) {
    return this.find({ academicYearId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'fullName email');
};

// Static method: lấy log cần kiểm toán
activityLogSchema.statics.getAuditLogs = function(limit = 100, skip = 0) {
    return this.find({ isAuditRequired: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'fullName email');
};

// Static method: lấy log lỗi
activityLogSchema.statics.getErrorLogs = function(limit = 50, skip = 0) {
    return this.find({ result: 'failure' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'fullName email');
};

// Static method: lấy log nghiêm trọng
activityLogSchema.statics.getCriticalLogs = function(limit = 50, skip = 0) {
    return this.find({ severity: 'critical' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'fullName email');
};

// Static method: thống kê hoạt động theo người dùng
activityLogSchema.statics.getUserActivityStats = async function(academicYearId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
        {
            $match: {
                academicYearId,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$userId',
                totalActions: { $sum: 1 },
                successCount: { $sum: { $cond: [{ $eq: ['$result', 'success'] }, 1, 0] } },
                failureCount: { $sum: { $cond: [{ $eq: ['$result', 'failure'] }, 1, 0] } }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $sort: { totalActions: -1 }
        }
    ]);
};

// Static method: thống kê hành động
activityLogSchema.statics.getActionStats = async function(academicYearId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
        {
            $match: {
                academicYearId,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Static method: thống kê theo loại đối tượng
activityLogSchema.statics.getTargetTypeStats = async function(academicYearId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
        {
            $match: {
                academicYearId,
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$targetType',
                count: { $sum: 1 },
                successCount: { $sum: { $cond: [{ $eq: ['$result', 'success'] }, 1, 0] } },
                failureCount: { $sum: { $cond: [{ $eq: ['$result', 'failure'] }, 1, 0] } }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

// Static method: tìm kiếm log nâng cao
activityLogSchema.statics.advancedSearch = function(filters) {
    const {
        userId,
        academicYearId,
        action,
        targetType,
        targetId,
        result,
        severity,
        dateFrom,
        dateTo,
        isAuditRequired,
        limit = 50,
        skip = 0
    } = filters;

    let query = {};

    if (userId) query.userId = userId;
    if (academicYearId) query.academicYearId = academicYearId;
    if (action) query.action = new RegExp(action, 'i');
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;
    if (result) query.result = result;
    if (severity) query.severity = severity;
    if (isAuditRequired !== undefined) query.isAuditRequired = isAuditRequired;

    if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'fullName email');
};

// Virtual: loại hành động
activityLogSchema.virtual('actionCategory').get(function() {
    const createActions = ['user_create', 'program_create', 'standard_create', 'criteria_create',
        'evidence_create', 'file_upload', 'report_create', 'assignment_create',
        'evaluation_create', 'academic_year_create', 'organization_create'];
    const updateActions = ['user_update', 'program_update', 'standard_update', 'criteria_update',
        'evidence_update', 'file_update', 'report_update', 'assignment_update',
        'evaluation_update', 'academic_year_update', 'organization_update'];
    const deleteActions = ['user_delete', 'program_delete', 'standard_delete', 'criteria_delete',
        'evidence_delete', 'file_delete', 'report_delete', 'assignment_delete',
        'evaluation_delete', 'academic_year_delete', 'organization_delete'];
    const approvalActions = ['file_approve', 'evidence_approve', 'report_approve'];
    const reviewActions = ['file_reject', 'evidence_reject', 'report_reject'];

    if (createActions.includes(this.action)) return 'CREATE';
    if (updateActions.includes(this.action)) return 'UPDATE';
    if (deleteActions.includes(this.action)) return 'DELETE';
    if (approvalActions.includes(this.action)) return 'APPROVE';
    if (reviewActions.includes(this.action)) return 'REJECT';

    return 'OTHER';
});

// Transform JSON
activityLogSchema.set('toJSON', { virtuals: true });
activityLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);