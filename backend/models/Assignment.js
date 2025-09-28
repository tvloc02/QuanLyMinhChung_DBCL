const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    // Báo cáo được phân công đánh giá
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: [true, 'Báo cáo là bắt buộc']
    },

    // Chuyên gia được phân công
    expertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Chuyên gia là bắt buộc']
    },

    // Người phân công
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người phân công là bắt buộc']
    },

    // Thông tin phân công
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

    // Tiêu chí đánh giá tùy chỉnh
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

    // Trạng thái phân công
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in_progress', 'completed', 'overdue', 'cancelled'],
        default: 'pending'
    },

    // Thời gian chuyên gia chấp nhận/từ chối
    respondedAt: Date,

    // Ghi chú phản hồi của chuyên gia
    responseNote: {
        type: String,
        maxlength: [500, 'Ghi chú phản hồi không được quá 500 ký tự']
    },

    // Thời gian bắt đầu đánh giá
    startedAt: Date,

    // Thời gian hoàn thành đánh giá
    completedAt: Date,

    // Đánh giá (reference đến Evaluation)
    evaluationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evaluation'
    },

    // Nhắc nhở
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

    // Metadata
    metadata: {
        estimatedDuration: Number, // Thời gian ước tính (giờ)
        actualDuration: Number,    // Thời gian thực tế (giờ)
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
assignmentSchema.index({ reportId: 1, expertId: 1 }, { unique: true }); // Một chuyên gia chỉ được phân công một lần cho một báo cáo

// Pre-save middleware
assignmentSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }

    // Auto-update completion time
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

// Virtual fields
assignmentSchema.virtual('isOverdue').get(function() {
    return this.deadline < new Date() && !['completed', 'cancelled'].includes(this.status);
});

assignmentSchema.virtual('daysUntilDeadline').get(function() {
    const diffTime = this.deadline - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

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

assignmentSchema.virtual('priorityText').get(function() {
    const priorityMap = {
        'low': 'Thấp',
        'normal': 'Bình thường',
        'high': 'Cao',
        'urgent': 'Khẩn cấp'
    };
    return priorityMap[this.priority] || this.priority;
});

// Instance methods
assignmentSchema.methods.accept = function(responseNote = '') {
    this.status = 'accepted';
    this.responseNote = responseNote;
    this.respondedAt = new Date();
    return this.save();
};

assignmentSchema.methods.reject = function(responseNote = '') {
    this.status = 'cancelled';
    this.responseNote = responseNote;
    this.respondedAt = new Date();
    return this.save();
};

assignmentSchema.methods.start = function() {
    this.status = 'in_progress';
    this.startedAt = new Date();
    return this.save();
};

assignmentSchema.methods.complete = function(evaluationId) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.evaluationId = evaluationId;

    // Calculate actual duration
    if (this.startedAt) {
        const duration = (this.completedAt - this.startedAt) / (1000 * 60 * 60); // in hours
        this.metadata.actualDuration = Math.round(duration * 100) / 100;
    }

    return this.save();
};

assignmentSchema.methods.cancel = function(reason = '') {
    this.status = 'cancelled';
    this.responseNote = reason;
    return this.save();
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
    // Admin có thể modify tất cả
    if (userRole === 'admin') return true;

    // Người phân công có thể modify (nếu chưa được chấp nhận)
    if (this.assignedBy.toString() === userId.toString() && this.status === 'pending') {
        return true;
    }

    // Chuyên gia có thể accept/reject
    if (this.expertId.toString() === userId.toString() && this.status === 'pending') {
        return true;
    }

    return false;
};

assignmentSchema.methods.canEvaluate = function(userId) {
    return this.expertId.toString() === userId.toString() &&
        ['accepted', 'in_progress'].includes(this.status);
};

// Static methods
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
    let matchStage = { academicYearId: mongoose.Types.ObjectId(academicYearId) };

    if (filters.assignedBy) matchStage.assignedBy = mongoose.Types.ObjectId(filters.assignedBy);
    if (filters.expertId) matchStage.expertId = mongoose.Types.ObjectId(filters.expertId);
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
        .populate('reportId', 'title type')
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

assignmentSchema.set('toJSON', { virtuals: true });
assignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Assignment', assignmentSchema);