const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: [true, 'Báo cáo là bắt buộc']
    },

    expertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Chuyên gia là bắt buộc']
    },

    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người phân công là bắt buộc']
    },

    assignmentNote: {
        type: String,
        maxlength: [1000, 'Ghi chú phân công không được quá 1000 ký tự']
    },

    deadline: {
        type: Date,
        required: [true, 'Hạn chót đánh giá là bắt buộc']
    },

    // low, normal, high, urgent
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    // Tiêu chí đánh giá
    evaluationCriteria: [{
        name: {
            type: String,
            required: true
        },
        description: String,
        maxScore: {
            type: Number,
            default: 10
        },
        weight: {
            type: Number,
            default: 1,
            min: 0,
            max: 1
        }
    }],

    // pending: chờ phản hồi
    // accepted: đã chấp nhận
    // in_progress: đang đánh giá
    // completed: đã hoàn thành
    // overdue: quá hạn
    // cancelled: đã hủy
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in_progress', 'completed', 'overdue', 'cancelled'],
        default: 'pending'
    },

    respondedAt: Date,

    responseNote: {
        type: String,
        maxlength: [500, 'Ghi chú phản hồi không được quá 500 ký tự']
    },

    startedAt: Date,

    completedAt: Date,

    evaluationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evaluation'
    },

    // Danh sách nhắc nhở
    reminders: [{
        sentAt: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['initial', 'reminder', 'urgent'],
            default: 'reminder'
        },
        message: String
    }],

    metadata: {
        estimatedDuration: Number,
        actualDuration: Number,
        complexity: {
            type: String,
            enum: ['simple', 'medium', 'complex'],
            default: 'medium'
        }
    },

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
assignmentSchema.index({ academicYearId: 1, reportId: 1 });
assignmentSchema.index({ academicYearId: 1, expertId: 1 });
assignmentSchema.index({ assignedBy: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ deadline: 1 });
assignmentSchema.index({ createdAt: -1 });
assignmentSchema.index({ reportId: 1, expertId: 1 }, { unique: true });

// Pre-save: cập nhật updatedAt
assignmentSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }

    // Cập nhật thời gian dựa trên status
    if (this.isModified('status')) {
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        }
        if (this.status === 'in_progress' && !this.startedAt) {
            this.startedAt = new Date();
        }
        if (['accepted', 'in_progress', 'completed'].includes(this.status) && !this.respondedAt) {
            this.respondedAt = new Date();
        }
    }

    next();
});

// Virtual: kiểm tra quá hạn
assignmentSchema.virtual('isOverdue').get(function() {
    return this.deadline < new Date() && !['completed', 'cancelled'].includes(this.status);
});

// Virtual: số ngày còn lại
assignmentSchema.virtual('daysUntilDeadline').get(function() {
    const diffTime = this.deadline - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual: trạng thái văn bản
assignmentSchema.virtual('statusText').get(function() {
    const statusMap = {
        'pending': 'Chờ phản hồi',
        'accepted': 'Đã chấp nhận',
        'in_progress': 'Đang đánh giá',
        'completed': 'Đã hoàn thành',
        'overdue': 'Quá hạn',
        'cancelled': 'Đã hủy'
    };
    return statusMap[this.status] || this.status;
});

// Virtual: ưu tiên văn bản
assignmentSchema.virtual('priorityText').get(function() {
    const priorityMap = {
        'low': 'Thấp',
        'normal': 'Bình thường',
        'high': 'Cao',
        'urgent': 'Khẩn cấp'
    };
    return priorityMap[this.priority] || this.priority;
});

// Method: ghi log hoạt động
assignmentSchema.methods.addActivityLog = async function(action, userId, description, additionalData = {}) {
    const ActivityLog = require('../system/ActivityLog');
    return ActivityLog.log({
        userId,
        academicYearId: this.academicYearId,
        action,
        description,
        targetType: 'Assignment',
        targetId: this._id,
        targetName: `Phân công đánh giá`,
        ...additionalData
    });
};

// Method: chấp nhận phân công
assignmentSchema.methods.accept = async function(responseNote = '') {
    const oldStatus = this.status;
    this.status = 'accepted';
    this.responseNote = responseNote;
    this.respondedAt = new Date();

    await this.save();

    await this.addActivityLog('assignment_accept', this.expertId,
        `Chấp nhận phân công đánh giá`, {
            oldData: { status: oldStatus },
            newData: { status: 'accepted' },
            metadata: { responseNote }
        });

    return this;
};

// Method: từ chối phân công
assignmentSchema.methods.reject = async function(responseNote = '') {
    const oldStatus = this.status;
    this.status = 'cancelled';
    this.responseNote = responseNote;
    this.respondedAt = new Date();

    await this.save();

    await this.addActivityLog('assignment_reject', this.expertId,
        `Từ chối phân công đánh giá: ${responseNote}`, {
            oldData: { status: oldStatus },
            newData: { status: 'cancelled' },
            metadata: { responseNote }
        });

    return this;
};

// Method: bắt đầu đánh giá
assignmentSchema.methods.start = function() {
    this.status = 'in_progress';
    this.startedAt = new Date();
    return this.save();
};

// Method: hoàn thành đánh giá
assignmentSchema.methods.complete = async function(evaluationId) {
    const oldStatus = this.status;
    this.status = 'completed';
    this.completedAt = new Date();
    this.evaluationId = evaluationId;

    if (this.startedAt) {
        const duration = (this.completedAt - this.startedAt) / (1000 * 60 * 60);
        this.metadata.actualDuration = Math.round(duration * 100) / 100;
    }

    await this.save();

    await this.addActivityLog('assignment_complete', this.expertId,
        `Hoàn thành phân công đánh giá`, {
            oldData: { status: oldStatus },
            newData: { status: 'completed' },
            metadata: {
                evaluationId,
                actualDuration: this.metadata.actualDuration
            }
        });

    return this;
};

// Method: hủy phân công
assignmentSchema.methods.cancel = async function(reason = '', userId) {
    const oldStatus = this.status;
    this.status = 'cancelled';
    this.responseNote = reason;

    await this.save();

    await this.addActivityLog('assignment_cancel', userId,
        `Hủy phân công đánh giá: ${reason}`, {
            oldData: { status: oldStatus },
            newData: { status: 'cancelled' },
            metadata: { reason }
        });

    return this;
};

// Method: đánh dấu quá hạn
assignmentSchema.methods.markOverdue = function() {
    if (this.deadline < new Date() && !['completed', 'cancelled'].includes(this.status)) {
        this.status = 'overdue';
        return this.save();
    }
    return Promise.resolve(this);
};

// Method: thêm nhắc nhở
assignmentSchema.methods.addReminder = function(type = 'reminder', message = '') {
    this.reminders.push({
        type,
        message,
        sentAt: new Date()
    });
    return this.save();
};

// Method: kiểm tra có thể chỉnh sửa không
assignmentSchema.methods.canModify = function(userId, userRole) {
    if (userRole === 'admin') return true;

    if (this.assignedBy.toString() === userId.toString() && this.status === 'pending') {
        return true;
    }

    if (this.expertId.toString() === userId.toString() && this.status === 'pending') {
        return true;
    }

    return false;
};

// Method: kiểm tra có thể đánh giá không
assignmentSchema.methods.canEvaluate = function(userId) {
    return this.expertId.toString() === userId.toString() &&
        ['accepted', 'in_progress'].includes(this.status);
};

assignmentSchema.statics.getExpertWorkload = async function(expertId, academicYearId) {
    const assignments = await this.find({
        expertId,
        academicYearId,
        status: { $in: ['pending', 'accepted', 'in_progress'] }
    });

    return {
        total: assignments.length,
        pending: assignments.filter(a => a.status === 'pending').length,
        accepted: assignments.filter(a => a.status === 'accepted').length,
        inProgress: assignments.filter(a => a.status === 'in_progress').length,
        overdue: assignments.filter(a => a.isOverdue).length
    };
};

assignmentSchema.statics.getAssignmentStats = async function(academicYearId, filters = {}) {
    if (!academicYearId) {
        return {
            total: 0, pending: 0, accepted: 0, inProgress: 0,
            completed: 0, overdue: 0, cancelled: 0
        };
    }

    let matchStage = {};

    try {
        matchStage.academicYearId = mongoose.Types.ObjectId(academicYearId);
    } catch (e) {
        return {
            total: 0, pending: 0, accepted: 0, inProgress: 0,
            completed: 0, overdue: 0, cancelled: 0
        };
    }

    if (filters.assignedBy) {
        try {
            matchStage.assignedBy = mongoose.Types.ObjectId(filters.assignedBy);
        } catch (e) { }
    }

    if (filters.expertId) {
        try {
            matchStage.expertId = mongoose.Types.ObjectId(filters.expertId);
        } catch (e) { }
    }

    if (filters.status) matchStage.status = filters.status;

    const stats = await this.aggregate([
        { $match: matchStage },
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

    return stats[0] || {
        total: 0, pending: 0, accepted: 0, inProgress: 0,
        completed: 0, overdue: 0, cancelled: 0
    };
};

assignmentSchema.statics.getUpcomingDeadlines = async function(academicYearId, days = 7) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    return this.find({
        academicYearId,
        deadline: { $lte: deadline },
        status: { $in: ['pending', 'accepted', 'in_progress'] }
    })
        .populate('reportId', 'title type code')
        .populate('expertId', 'fullName email')
        .sort({ deadline: 1 });
};

assignmentSchema.statics.markOverdueAssignments = async function() {
    const overdueAssignments = await this.find({
        deadline: { $lt: new Date() },
        status: { $in: ['pending', 'accepted', 'in_progress'] }
    });

    const promises = overdueAssignments.map(assignment => assignment.markOverdue());
    return Promise.all(promises);
};

assignmentSchema.post('save', async function(doc, next) {
    if (this.isNew && this.assignedBy) {
        try {
            await this.addActivityLog('assignment_create', this.assignedBy,
                `Tạo phân công đánh giá mới`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

assignmentSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.assignedBy) {
        try {
            await doc.addActivityLog('assignment_delete', doc.assignedBy,
                `Xóa phân công đánh giá`, {
                    severity: 'high',
                    result: 'success',
                    isAuditRequired: true
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

assignmentSchema.set('toJSON', { virtuals: true });
assignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Assignment', assignmentSchema);