const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: true
    },

    taskCode: {
        type: String,
        required: true,
        unique: true
    },

    description: {
        type: String,
        required: true,
        maxlength: [3000, 'Mô tả không được quá 3000 ký tự']
    },

    standardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Standard',
        required: true
    },

    criteriaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria',
        required: true
    },

    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: true
    },

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },

    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    },

    // Trường reportType để phân loại nhiệm vụ viết báo cáo
    reportType: {
        type: String,
        enum: ['tdg', 'standard', 'criteria'], // Tự đánh giá, Tiêu chuẩn, Tiêu chí
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },

    reviewStatus: {
        type: String,
        enum: ['not_reviewed', 'approved', 'rejected'],
        default: 'not_reviewed'
    },

    rejectionReason: {
        type: String,
        maxlength: [2000, 'Lý do từ chối không được quá 2000 ký tự']
    },

    dueDate: Date,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    reviewedAt: Date,

    submittedAt: Date,

    metadata: {
        totalEvidences: {
            type: Number,
            default: 0
        },
        approvedEvidences: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
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

taskSchema.index({ academicYearId: 1, taskCode: 1 }, { unique: true });
taskSchema.index({ academicYearId: 1, criteriaId: 1 });
taskSchema.index({ assignedTo: 1, academicYearId: 1 });
taskSchema.index({ status: 1, academicYearId: 1 });

taskSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

taskSchema.virtual('fullName').get(function() {
    return `${this.taskCode}: ${this.description.substring(0, 50)}`;
});

taskSchema.methods.canEdit = function(userId, userRole) {
    return userRole === 'admin' || userRole === 'manager' || this.createdBy.toString() === userId.toString();
};

taskSchema.methods.canDelete = function(userId, userRole) {
    return userRole === 'admin' || (userRole === 'manager' && this.createdBy.toString() === userId.toString());
};

taskSchema.methods.canReview = function(userRole) {
    return userRole === 'admin' || userRole === 'manager';
};

// Logic canSubmitReport: Chỉ Reporter được giao nhiệm vụ mới có quyền nộp báo cáo
taskSchema.methods.canSubmitReport = function(userId, userRole) {
    return userRole === 'reporter' && this.assignedTo.some(id => id.toString() === userId.toString());
};

taskSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            const ActivityLog = require('../system/ActivityLog');
            await ActivityLog.log({
                userId: this.createdBy,
                academicYearId: this.academicYearId,
                action: 'task_create',
                description: `Tạo nhiệm vụ: ${this.fullName}`,
                targetType: 'Task',
                targetId: this._id,
                targetName: this.fullName,
                severity: 'medium',
                result: 'success'
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;