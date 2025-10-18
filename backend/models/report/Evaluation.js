const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: [true, 'Phân quyền là bắt buộc']
    },

    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: [true, 'Báo cáo là bắt buộc']
    },

    evaluatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Chuyên gia đánh giá là bắt buộc']
    },

    criteriaScores: [{
        criteriaName: {
            type: String,
            required: true
        },
        maxScore: {
            type: Number,
            required: true
        },
        score: {
            type: Number,
            required: true,
            min: 0
        },
        weight: {
            type: Number,
            default: 1,
            min: 0,
            max: 1
        },
        comment: {
            type: String,
            maxlength: [2000, 'Bình luận tiêu chí không được quá 2000 ký tự']
        }
    }],

    totalScore: {
        type: Number,
        min: 0
    },

    maxTotalScore: {
        type: Number,
        min: 0
    },

    averageScore: {
        type: Number,
        min: 0,
        max: 10
    },

    rating: {
        type: String,
        enum: ['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'],
        required: [true, 'Phân loại đánh giá là bắt buộc']
    },

    overallComment: {
        type: String,
        default: '',
        maxlength: [5000, 'Bình luận tổng thể không được quá 5000 ký tự']
    },

    strengths: [{
        point: {
            type: String,
            required: true,
            maxlength: [500, 'Điểm mạnh không được quá 500 ký tự']
        },
        evidenceReference: String
    }],

    improvementAreas: [{
        area: {
            type: String,
            required: true,
            maxlength: [500, 'Điểm cần cải thiện không được quá 500 ký tự']
        },
        recommendation: {
            type: String,
            maxlength: [1000, 'Khuyến nghị không được quá 1000 ký tự']
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        }
    }],

    recommendations: [{
        recommendation: {
            type: String,
            required: true,
            maxlength: [1000, 'Khuyến nghị không được quá 1000 ký tự']
        },
        type: {
            type: String,
            enum: ['immediate', 'short_term', 'long_term'],
            default: 'short_term'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        }
    }],

    evidenceAssessment: {
        adequacy: {
            type: String,
            enum: ['insufficient', 'adequate', 'comprehensive'],
            required: [true, 'Đánh giá tính đầy đủ minh chứng là bắt buộc']
        },
        relevance: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent'],
            required: [true, 'Đánh giá tính liên quan minh chứng là bắt buộc']
        },
        quality: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent'],
            required: [true, 'Đánh giá chất lượng minh chứng là bắt buộc']
        }
    },

    supervisorGuidance: {
        comments: {
            type: String,
            maxlength: [3000, 'Hướng dẫn không được quá 3000 ký tự']
        },
        guidedAt: Date,
        guidedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },

    status: {
        type: String,
        enum: ['draft', 'submitted', 'supervised', 'final'],
        default: 'draft'
    },

    startedAt: {
        type: Date,
        default: Date.now
    },

    submittedAt: Date,

    supervisedAt: Date,

    finalizedAt: Date,

    metadata: {
        timeSpent: Number,
        wordCount: {
            type: Number,
            default: 0
        },
        lastSaved: {
            type: Date,
            default: Date.now
        },
        autoSaveCount: {
            type: Number,
            default: 0
        }
    },

    history: [{
        action: {
            type: String,
            enum: ['created', 'updated', 'submitted', 'supervised', 'finalized'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changes: mongoose.Schema.Types.Mixed,
        note: String
    }],

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
evaluationSchema.index({ academicYearId: 1, reportId: 1 });
evaluationSchema.index({ academicYearId: 1, evaluatorId: 1 });
evaluationSchema.index({ assignmentId: 1 }, { unique: true });
evaluationSchema.index({ status: 1 });
evaluationSchema.index({ averageScore: 1 });
evaluationSchema.index({ submittedAt: -1 });

// Pre hooks
evaluationSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
        this.metadata.lastSaved = Date.now();
    }

    if (this.isModified('criteriaScores')) {
        this.calculateScores();
    }

    if (this.isModified('overallComment')) {
        this.metadata.wordCount = this.overallComment ? this.overallComment.split(/\s+/).length : 0;
    }

    if (this.isModified('status')) {
        const now = new Date();
        switch (this.status) {
            case 'submitted':
                if (!this.submittedAt) this.submittedAt = now;
                break;
            case 'supervised':
                if (!this.supervisedAt) this.supervisedAt = now;
                break;
            case 'final':
                if (!this.finalizedAt) this.finalizedAt = now;
                break;
        }
    }

    next();
});

// Methods
evaluationSchema.methods.addActivityLog = async function(action, userId, description, additionalData = {}) {
    const ActivityLog = require('../system/ActivityLog');
    return ActivityLog.log({
        userId,
        academicYearId: this.academicYearId,
        action,
        description,
        targetType: 'Evaluation',
        targetId: this._id,
        targetName: `Đánh giá báo cáo`,
        ...additionalData
    });
};

evaluationSchema.methods.calculateScores = function() {
    if (!this.criteriaScores || this.criteriaScores.length === 0) {
        this.totalScore = 0;
        this.maxTotalScore = 0;
        this.averageScore = 0;
        return;
    }

    let totalWeightedScore = 0;
    let totalMaxWeightedScore = 0;
    let totalWeight = 0;

    this.criteriaScores.forEach(criteria => {
        const weight = criteria.weight || 1;
        totalWeightedScore += criteria.score * weight;
        totalMaxWeightedScore += criteria.maxScore * weight;
        totalWeight += weight;
    });

    this.totalScore = Math.round(totalWeightedScore * 100) / 100;
    this.maxTotalScore = Math.round(totalMaxWeightedScore * 100) / 100;

    if (totalMaxWeightedScore > 0) {
        this.averageScore = Math.round((totalWeightedScore / totalMaxWeightedScore) * 10 * 100) / 100;
    } else {
        this.averageScore = 0;
    }

    // Tự động xác định rating dựa trên averageScore
    if (this.averageScore >= 9) {
        this.rating = 'excellent';
    } else if (this.averageScore >= 7) {
        this.rating = 'good';
    } else if (this.averageScore >= 5) {
        this.rating = 'satisfactory';
    } else if (this.averageScore >= 3) {
        this.rating = 'needs_improvement';
    } else {
        this.rating = 'poor';
    }
};

evaluationSchema.methods.submit = async function() {
    const oldStatus = this.status;
    this.status = 'submitted';
    this.submittedAt = new Date();
    this.addHistory('submitted', this.evaluatorId);

    await this.save();

    await this.addActivityLog('evaluation_submit', this.evaluatorId,
        'Nộp đánh giá báo cáo', {
            severity: 'medium',
            oldData: { status: oldStatus },
            newData: { status: 'submitted', averageScore: this.averageScore }
        });

    return this;
};

evaluationSchema.methods.supervise = async function(supervisorId, comments = '') {
    const oldStatus = this.status;
    this.status = 'supervised';
    this.supervisedAt = new Date();
    this.supervisorGuidance.guidedAt = new Date();
    this.supervisorGuidance.guidedBy = supervisorId;
    this.supervisorGuidance.comments = comments;
    this.addHistory('supervised', supervisorId);

    await this.save();

    await this.addActivityLog('evaluation_supervise', supervisorId,
        'Giám sát đánh giá báo cáo', {
            severity: 'medium',
            oldData: { status: oldStatus },
            newData: { status: 'supervised' },
            metadata: { comments }
        });

    return this;
};

evaluationSchema.methods.finalize = async function(userId) {
    const oldStatus = this.status;
    this.status = 'final';
    this.finalizedAt = new Date();
    this.addHistory('finalized', userId);

    await this.save();

    await this.addActivityLog('evaluation_finalize', userId,
        'Hoàn tất đánh giá báo cáo', {
            severity: 'high',
            oldData: { status: oldStatus },
            newData: { status: 'final' },
            isAuditRequired: true
        });

    return this;
};

evaluationSchema.methods.addHistory = function(action, userId, changes = {}, note = '') {
    this.history.push({
        action,
        userId,
        changes,
        note,
        timestamp: new Date()
    });
};

evaluationSchema.methods.canEdit = function(userId, userRole) {
    if (userRole === 'admin') return true;
    return userRole === 'expert' && this.status === 'draft' && this.evaluatorId.toString() === userId.toString();

};

evaluationSchema.methods.canView = function(userId, userRole) {
    if (userRole === 'admin') return true;
    if (this.evaluatorId.toString() === userId.toString()) return true;
    if (userRole === 'supervisor') return true;
    return userRole === 'manager' && this.status !== 'draft';

};

evaluationSchema.methods.autoSave = function() {
    this.metadata.autoSaveCount += 1;
    this.metadata.lastSaved = new Date();
    return this.save();
};

evaluationSchema.methods.getProgress = function() {
    const totalFields = 5;
    let completedFields = 0;

    if (this.overallComment) completedFields++;
    if (this.rating) completedFields++;
    if (this.evidenceAssessment?.adequacy) completedFields++;
    if (this.evidenceAssessment?.relevance) completedFields++;
    if (this.evidenceAssessment?.quality) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
};

// Virtuals
evaluationSchema.virtual('ratingText').get(function() {
    const ratingMap = {
        'excellent': 'Xuất sắc',
        'good': 'Tốt',
        'satisfactory': 'Đạt yêu cầu',
        'needs_improvement': 'Cần cải thiện',
        'poor': 'Kém'
    };
    return ratingMap[this.rating] || this.rating;
});

evaluationSchema.virtual('statusText').get(function() {
    const statusMap = {
        'draft': 'Bản nháp',
        'submitted': 'Đã nộp',
        'supervised': 'Đã giám sát',
        'final': 'Hoàn tất'
    };
    return statusMap[this.status] || this.status;
});

evaluationSchema.virtual('timeSpentHours').get(function() {
    if (!this.metadata.timeSpent) return 0;
    return Math.round(this.metadata.timeSpent / 60 * 100) / 100;
});

evaluationSchema.virtual('isComplete').get(function() {
    return this.getProgress() === 100;
});

// Static methods
evaluationSchema.statics.getAverageScoreByReport = async function(reportId) {
    const evaluations = await this.find({
        reportId,
        status: { $in: ['submitted', 'supervised', 'final'] }
    });

    if (evaluations.length === 0) return 0;

    const totalScore = evaluations.reduce((sum, evaluation) => sum + evaluation.averageScore, 0);
    return Math.round((totalScore / evaluations.length) * 100) / 100;
};

evaluationSchema.statics.getEvaluatorStats = async function(evaluatorId, academicYearId) {
    const evaluations = await this.find({
        evaluatorId,
        academicYearId
    });

    const stats = {
        total: evaluations.length,
        draft: 0,
        submitted: 0,
        supervised: 0,
        final: 0,
        averageScore: 0,
        totalTimeSpent: 0
    };

    evaluations.forEach(evaluation => {
        stats[evaluation.status]++;
        stats.averageScore += evaluation.averageScore || 0;
        stats.totalTimeSpent += evaluation.metadata.timeSpent || 0;
    });

    if (stats.total > 0) {
        stats.averageScore = Math.round((stats.averageScore / stats.total) * 100) / 100;
    }

    stats.totalTimeSpentHours = Math.round(stats.totalTimeSpent / 60 * 100) / 100;

    return stats;
};

evaluationSchema.statics.getSystemStats = async function(academicYearId) {
    const evaluations = await this.find({ academicYearId });

    const stats = {
        total: evaluations.length,
        byStatus: {},
        byRating: {},
        averageScore: 0,
        totalTimeSpent: 0
    };

    evaluations.forEach(evaluation => {
        stats.byStatus[evaluation.status] = (stats.byStatus[evaluation.status] || 0) + 1;

        if (evaluation.rating) {
            stats.byRating[evaluation.rating] = (stats.byRating[evaluation.rating] || 0) + 1;
        }

        stats.averageScore += evaluation.averageScore || 0;
        stats.totalTimeSpent += evaluation.metadata.timeSpent || 0;
    });

    if (stats.total > 0) {
        stats.averageScore = Math.round((stats.averageScore / stats.total) * 100) / 100;
    }

    return stats;
};

// Post hooks
evaluationSchema.post('save', async function(doc, next) {
    if (this.isNew && this.evaluatorId) {
        try {
            await this.addActivityLog('evaluation_create', this.evaluatorId,
                `Tạo mới đánh giá báo cáo`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

evaluationSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.evaluatorId) {
        try {
            await doc.addActivityLog('evaluation_delete', doc.evaluatorId,
                `Xóa đánh giá báo cáo`, {
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

evaluationSchema.set('toJSON', { virtuals: true });
evaluationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);