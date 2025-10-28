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
        required: [true, 'Phân công là bắt buộc']
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

    // excellent: xuất sắc
    // good: tốt
    // satisfactory: đạt yêu cầu
    // needs_improvement: cần cải thiện
    // poor: kém
    rating: {
        type: String,
        enum: ['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor', ''],
        default: ''
    },

    // Bình luận tổng thể
    overallComment: {
        type: String,
        default: '',
        maxlength: [5000, 'Bình luận tổng thể không được quá 5000 ký tự']
    },

    // Điểm mạnh
    strengths: [{
        point: {
            type: String,
            required: true,
            maxlength: [500, 'Điểm mạnh không được quá 500 ký tự']
        },
        evidenceReference: String
    }],

    // Điểm cần cải thiện
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

    // Khuyến nghị
    recommendations: [{
        recommendation: {
            type: String,
            required: true,
            maxlength: [1000, 'Khuyến nghị không được quá 1000 ký tự']
        },
        // immediate: ngay lập tức, short_term: ngắn hạn, long_term: dài hạn
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

    // Đánh giá minh chứng
    evidenceAssessment: {
        // insufficient, adequate, comprehensive
        adequacy: {
            type: String,
            enum: ['insufficient', 'adequate', 'comprehensive', ''],
            default: ''
        },
        // poor, fair, good, excellent
        relevance: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent', ''],
            default: ''
        },
        quality: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent', ''],
            default: ''
        }
    },

    // Hướng dẫn từ quản lý
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

    // draft: bản nháp
    // submitted: đã nộp
    // supervised: đã giám sát
    // final: hoàn tất
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
        timeSpent: Number, // milliseconds
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

    // Lịch sử thay đổi
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
evaluationSchema.index({ submittedAt: -1 });

// Pre-save: cập nhật metadata
evaluationSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
        this.metadata.lastSaved = Date.now();
    }

    // Tính số từ từ bình luận
    if (this.isModified('overallComment')) {
        this.metadata.wordCount = this.overallComment ? this.overallComment.split(/\s+/).length : 0;
    }

    // Cập nhật thời gian dựa trên trạng thái
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

// Virtual: đánh giá văn bản
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

// Virtual: trạng thái văn bản
evaluationSchema.virtual('statusText').get(function() {
    const statusMap = {
        'draft': 'Bản nháp',
        'submitted': 'Đã nộp',
        'supervised': 'Đã giám sát',
        'final': 'Hoàn tất'
    };
    return statusMap[this.status] || this.status;
});

// Virtual: thời gian (giờ)
evaluationSchema.virtual('timeSpentHours').get(function() {
    if (!this.metadata.timeSpent) return 0;
    return Math.round(this.metadata.timeSpent / 60 * 100) / 100;
});

// Virtual: hoàn thành
evaluationSchema.virtual('isComplete').get(function() {
    return this.getProgress() === 100;
});

// Method: ghi log hoạt động
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

// Method: nộp đánh giá
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
            newData: { status: 'submitted' }
        });

    return this;
};

// Method: giám sát đánh giá
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

// Method: hoàn tất đánh giá
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

// Method: thêm vào lịch sử
evaluationSchema.methods.addHistory = function(action, userId, changes = {}, note = '') {
    this.history.push({
        action,
        userId,
        changes,
        note,
        timestamp: new Date()
    });
};

// Method: kiểm tra có thể chỉnh sửa không
evaluationSchema.methods.canEdit = function(userId, userRole) {
    if (userRole === 'admin') return true;

    // Chuyên gia chỉ có thể sửa nếu status là draft
    return userRole === 'evaluator' && this.status === 'draft' && this.evaluatorId.toString() === userId.toString();
};

// Method: kiểm tra có thể xem không
evaluationSchema.methods.canView = function(userId, userRole) {
    const userIdStr = String(userId);
    const evaluatorIdStr = String(this.evaluatorId._id || this.evaluatorId);

    if (userRole === 'admin') return true;
    if (userRole === 'manager') return true;

    // Chuyên gia xem đánh giá của mình
    if (userRole === 'evaluator' && userIdStr === evaluatorIdStr) {
        return true;
    }

    return false;
};

// Method: tự động lưu
evaluationSchema.methods.autoSave = function() {
    this.metadata.autoSaveCount += 1;
    this.metadata.lastSaved = new Date();
    return this.save();
};

// Method: tính tiến độ
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

// Static method: lấy thống kê chuyên gia
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
        totalTimeSpent: 0
    };

    evaluations.forEach(evaluation => {
        stats[evaluation.status]++;
        stats.totalTimeSpent += evaluation.metadata.timeSpent || 0;
    });

    stats.totalTimeSpentHours = Math.round(stats.totalTimeSpent / 60 * 100) / 100;

    return stats;
};

// Static method: lấy thống kê hệ thống
evaluationSchema.statics.getSystemStats = async function(academicYearId) {
    const evaluations = await this.find({ academicYearId });

    const stats = {
        total: evaluations.length,
        byStatus: {},
        byRating: {},
        totalTimeSpent: 0
    };

    evaluations.forEach(evaluation => {
        stats.byStatus[evaluation.status] = (stats.byStatus[evaluation.status] || 0) + 1;

        if (evaluation.rating) {
            stats.byRating[evaluation.rating] = (stats.byRating[evaluation.rating] || 0) + 1;
        }

        stats.totalTimeSpent += evaluation.metadata.timeSpent || 0;
    });

    return stats;
};

// Post-save: ghi log tạo mới
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

// Post-delete: ghi log xóa
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

// Virtuals và transform JSON
evaluationSchema.set('toJSON', { virtuals: true });
evaluationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);