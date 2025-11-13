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

    evaluatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Chuyên gia/Người đánh giá là bắt buộc']
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

    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

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

    status: {
        type: String,
        enum: ['accepted', 'in_progress', 'completed', 'overdue', 'cancelled'],
        default: 'accepted'
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

assignmentSchema.index({ academicYearId: 1, reportId: 1 });
assignmentSchema.index({ academicYearId: 1, evaluatorId: 1 });
assignmentSchema.index({ assignedBy: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ deadline: 1 });
assignmentSchema.index({ createdAt: -1 });
assignmentSchema.index({ reportId: 1, evaluatorId: 1 }, { unique: true });

assignmentSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }

    if (this.isModified('status')) {
        if (this.status === 'completed' && !this.completedAt) {
            this.completedAt = new Date();
        }
        if (this.status === 'in_progress' && !this.startedAt) {
            this.startedAt = new Date();
        }
    }

    next();
});

assignmentSchema.virtual('isOverdue').get(function() {
    return this.deadline < new Date() && !['completed', 'cancelled'].includes(this.status);
});

assignmentSchema.virtual('daysUntilDeadline').get(function() {
    const diffTime = this.deadline - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

assignmentSchema.virtual('statusText').get(function() {
    const statusMap = {
        'accepted': 'Đã phân công',
        'in_progress': 'Đang đánh giá',
        'completed': 'Đã hoàn thành',
        'overdue': 'Quá hạn',
        'cancelled': 'Đã hủy'
    };
    return statusMap[this.status] || this.status;
});

assignmentSchema.virtual('priorityText').get(function() {
    const priorityMap = {
        'low': 'Thấp',
        'normal': 'Bình thường',
        'high': 'Cao',
        'urgent': 'Khẩn cấp'
    };
    return priorityMap[this.priority] || this.priority;
});

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

assignmentSchema.methods.start = function() {
    this.status = 'in_progress';
    this.startedAt = new Date();
    return this.save();
};

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

    await this.addActivityLog('assignment_complete', this.evaluatorId,
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

assignmentSchema.methods.markOverdue = function() {
    if (this.deadline < new Date() && !['completed', 'cancelled'].includes(this.status)) {
        this.status = 'overdue';
        return this.save();
    }
    return Promise.resolve(this);
};

assignmentSchema.methods.addReminder = function(type = 'reminder', message = '') {
    this.reminders.push({
        type,
        message,
        sentAt: new Date()
    });
    return this.save();
};

assignmentSchema.methods.canModify = function(userId, userRole) {
    if (userRole === 'admin') return true;

    if (this.assignedBy.toString() === userId.toString() && !['in_progress', 'completed'].includes(this.status)) {
        return true;
    }

    return false;
};

assignmentSchema.methods.canEvaluate = function(userId) {
    return this.evaluatorId.toString() === userId.toString() &&
        ['accepted', 'in_progress'].includes(this.status);
};

assignmentSchema.statics.getExpertWorkload = async function(evaluatorId, academicYearId) {
    const assignments = await this.find({
        evaluatorId,
        academicYearId,
        status: { $in: ['accepted', 'in_progress'] }
    });

    return {
        total: assignments.length,
        inProgress: assignments.filter(a => a.status === 'in_progress').length,
        accepted: assignments.filter(a => a.status === 'accepted').length,
        overdue: assignments.filter(a => a.isOverdue).length
    };
};

assignmentSchema.statics.getAssignmentStats = async function(academicYearId, filters = {}) {
    let matchStage = { academicYearId: new mongoose.Types.ObjectId(academicYearId) };

    // An toàn chuyển đổi ID cho aggregation
    if (filters.assignedBy) matchStage.assignedBy = new mongoose.Types.ObjectId(filters.assignedBy);
    if (filters.evaluatorId) matchStage.evaluatorId = new mongoose.Types.ObjectId(filters.evaluatorId);

    if (filters.status) matchStage.status = filters.status;

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
                inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                overdue: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
            }
        }
    ]);

    return stats[0] || {
        total: 0, accepted: 0, inProgress: 0,
        completed: 0, overdue: 0, cancelled: 0
    };
};

assignmentSchema.statics.getUpcomingDeadlines = async function(academicYearId, days = 7) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    return this.find({
        academicYearId,
        deadline: { $lte: deadline },
        status: { $in: ['accepted', 'in_progress'] }
    })
        .populate('reportId', 'title type')
        .populate('evaluatorId', 'fullName email')
        .sort({ deadline: 1 });
};

assignmentSchema.statics.markOverdueAssignments = async function() {
    const overdueAssignments = await this.find({
        deadline: { $lt: new Date() },
        status: { $in: ['accepted', 'in_progress'] }
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

            if (this.reportId) {
                const Report = mongoose.model('Report');
                const report = await Report.findById(this.reportId);

                if (report && report.status === 'approved') {
                    report.status = 'in_evaluation';
                    report.updatedBy = this.assignedBy;
                    await report.save();

                    console.log(`Report ${report._id} chuyển sang trạng thái in_evaluation`);
                }
            }
        } catch (error) {
            console.error('Failed to log activity or update report status:', error);
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