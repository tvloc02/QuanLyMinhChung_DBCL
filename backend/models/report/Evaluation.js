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
    score: {
        type: Number,
        min: [1, 'Điểm thấp nhất là 1'],
        max: [7, 'Điểm cao nhất là 7'],
        required: function() { return this.status !== 'draft'; },
        default: null
    },
    overallComment: {
        type: String,
        maxlength: [5000, 'Bình luận tổng thể không được quá 5000 ký tự'],
        required: function() { return this.status !== 'draft'; }
    },
    strengths: [{
        point: { type: String, required: true },
        evidenceReference: String
    }],
    improvementAreas: [{
        area: { type: String, required: true },
        recommendation: { type: String },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    }],
    recommendations: [{
        recommendation: { type: String, required: true },
        type: { type: String, enum: ['immediate', 'short_term', 'long_term'], default: 'short_term' },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    }],
    evidenceAssessment: {
        adequacy: {
            type: String,
            enum: ['insufficient', 'adequate', 'comprehensive'],
            required: function() { return this.status !== 'draft'; }
        },
        relevance: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent'],
            required: function() { return this.status !== 'draft'; }
        },
        quality: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent'],
            required: function() { return this.status !== 'draft'; }
        }
    },
    supervisorGuidance: {
        comments: { type: String, maxlength: 3000 },
        guidedAt: Date,
        guidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'supervised', 'final'],
        default: 'draft'
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    supervisedAt: Date,
    finalizedAt: Date,
    metadata: {
        timeSpent: Number,
        wordCount: { type: Number, default: 0 },
        lastSaved: { type: Date, default: Date.now },
        autoSaveCount: { type: Number, default: 0 }
    },
    history: [{
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changes: mongoose.Schema.Types.Mixed,
        note: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

evaluationSchema.index({ academicYearId: 1, reportId: 1 });
evaluationSchema.index({ academicYearId: 1, evaluatorId: 1 });
evaluationSchema.index({ assignmentId: 1 }, { unique: true });
evaluationSchema.index({ status: 1 });
evaluationSchema.index({ score: 1 });

evaluationSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
        this.metadata.lastSaved = Date.now();
    }
    if (this.isModified('overallComment')) {
        this.metadata.wordCount = this.overallComment ? this.overallComment.split(/\s+/).length : 0;
    }
    if (this.isModified('status')) {
        const now = new Date();
        if (this.status === 'submitted' && !this.submittedAt) this.submittedAt = now;
        if (this.status === 'supervised' && !this.supervisedAt) this.supervisedAt = now;
        if (this.status === 'final' && !this.finalizedAt) this.finalizedAt = now;
    }
    next();
});

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
            newData: { status: 'submitted', score: this.score }
        });
    return this;
};

evaluationSchema.methods.supervise = async function(supervisorId, comments = '') {
    const oldStatus = this.status;
    this.status = 'supervised';
    this.supervisedAt = new Date();
    this.supervisorGuidance = { guidedBy: supervisorId, comments, guidedAt: new Date() };
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
    return this.evaluatorId.toString() === userId.toString() && this.status === 'draft';
};

evaluationSchema.methods.canView = function(userId, userRole) {
    if (userRole === 'admin') return true;
    if (this.evaluatorId.toString() === userId.toString()) return true;
    if (userRole === 'supervisor') return true;
    return (userRole === 'manager' || userRole === 'expert') && this.status !== 'draft';
};

evaluationSchema.methods.autoSave = function() {
    this.metadata.autoSaveCount += 1;
    this.metadata.lastSaved = new Date();
    return this.save({ validateBeforeSave: false });
};

evaluationSchema.methods.getProgress = function() {
    const totalFields = 5;
    let completedFields = 0;
    if (this.overallComment) completedFields++;
    if (this.score) completedFields++;
    if (this.evidenceAssessment?.adequacy) completedFields++;
    if (this.evidenceAssessment?.relevance) completedFields++;
    if (this.evidenceAssessment?.quality) completedFields++;
    return Math.round((completedFields / totalFields) * 100);
};

evaluationSchema.virtual('isComplete').get(function() {
    return !!(
        this.overallComment &&
        this.score &&
        this.evidenceAssessment?.adequacy &&
        this.evidenceAssessment?.relevance &&
        this.evidenceAssessment?.quality
    );
});

evaluationSchema.virtual('scoreText').get(function() {
    if (!this.score) return 'Chưa đánh giá';
    const map = { 1: 'Kém', 2: 'Yếu', 3: 'Trung bình yếu', 4: 'Trung bình', 5: 'Khá', 6: 'Tốt', 7: 'Xuất sắc' };
    return map[this.score] || `${this.score} điểm`;
});

evaluationSchema.virtual('statusText').get(function() {
    const statusMap = { 'draft': 'Bản nháp', 'submitted': 'Đã nộp', 'supervised': 'Đã giám sát', 'final': 'Hoàn tất' };
    return statusMap[this.status] || this.status;
});

evaluationSchema.virtual('timeSpentHours').get(function() {
    if (!this.metadata.timeSpent) return 0;
    return Math.round(this.metadata.timeSpent / 60 * 100) / 100;
});

evaluationSchema.statics.getAverageScoreByReport = async function(reportId) {
    const evaluations = await this.find({ reportId, status: { $in: ['submitted', 'supervised', 'final'] } });
    if (evaluations.length === 0) return 0;
    const sum = evaluations.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return Math.round((sum / evaluations.length) * 100) / 100;
};

evaluationSchema.statics.getEvaluatorStats = async function(evaluatorId, academicYearId) {
    const evaluations = await this.find({ evaluatorId, academicYearId });
    const stats = { total: evaluations.length, draft: 0, submitted: 0, supervised: 0, final: 0, averageScore: 0, totalTimeSpent: 0 };
    let totalScore = 0; let ratedCount = 0;
    evaluations.forEach(e => {
        stats[e.status]++;
        stats.totalTimeSpent += e.metadata.timeSpent || 0;
        if (e.score) { totalScore += e.score; ratedCount++; }
    });
    if (ratedCount > 0) stats.averageScore = Math.round((totalScore / ratedCount) * 100) / 100;
    stats.totalTimeSpentHours = Math.round(stats.totalTimeSpent / 60 * 100) / 100;
    return stats;
};

evaluationSchema.statics.getSystemStats = async function(academicYearId) {
    const evaluations = await this.find({ academicYearId });
    const stats = { total: evaluations.length, byStatus: {}, byScore: {}, averageScore: 0, totalTimeSpent: 0 };
    let totalScore = 0; let ratedCount = 0;
    evaluations.forEach(e => {
        stats.byStatus[e.status] = (stats.byStatus[e.status] || 0) + 1;
        if (e.score) {
            stats.byScore[e.score] = (stats.byScore[e.score] || 0) + 1;
            totalScore += e.score; ratedCount++;
        }
        stats.totalTimeSpent += e.metadata.timeSpent || 0;
    });
    if (ratedCount > 0) stats.averageScore = Math.round((totalScore / ratedCount) * 100) / 100;
    return stats;
};

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