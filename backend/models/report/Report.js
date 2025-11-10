const mongoose = require('mongoose');

const versionSubSchema = new mongoose.Schema({
    content: { type: String, required: true },
    changeNote: String,
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    changedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const linkedEvidenceSubSchema = new mongoose.Schema({
    evidenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence',
        required: true
    },
    contextText: {
        type: String,
        maxlength: 500
    },
    linkedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const reviewerCommentSubSchema = new mongoose.Schema({
    comment: String,
    section: String,
    commentedAt: {
        type: Date,
        default: Date.now
    },
    reviewerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewerType: {
        type: String,
        enum: ['manager', 'evaluator', 'admin', 'reporter']
    },
    isResolved: {
        type: Boolean,
        default: false
    }
});

const rejectionHistorySubSchema = new mongoose.Schema({
    reason: String,
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedAt: {
        type: Date,
        default: Date.now
    },
    submittedAgainAt: Date
}, { _id: false });

// New Sub Schema for Edit Requests
const editRequestSubSchema = new mongoose.Schema({
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    respondedAt: Date,
    rejectReason: String
}, { _id: false });

const reportSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },

    title: {
        type: String,
        required: [true, 'Tiêu đề báo cáo là bắt buộc'],
        trim: true,
        maxlength: [500, 'Tiêu đề không được quá 500 ký tự']
    },

    code: {
        type: String,
        required: [true, 'Mã báo cáo là bắt buộc'],
        uppercase: true,
        unique: true
    },

    type: {
        type: String,
        enum: ['criteria', 'standard', 'overall_tdg'],
        required: [true, 'Loại báo cáo là bắt buộc']
    },

    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: [true, 'Chương trình đánh giá là bắt buộc']
    },

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Tổ chức là bắt buộc']
    },

    standardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Standard',
        required: function() {
            return ['standard', 'criteria'].includes(this.type);
        }
    },

    criteriaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria',
        required: function() {
            return this.type === 'criteria';
        }
    },

    content: {
        type: String,
        default: '',
        required: false
    },

    contentMethod: {
        type: String,
        enum: ['online_editor', 'file_upload'],
        default: 'online_editor'
    },

    attachedFile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    },

    status: {
        type: String,
        enum: ['draft', 'public', 'approved', 'rejected', 'published', 'in_progress', 'submitted'],
        default: 'draft'
    },

    summary: {
        type: String,
        maxlength: [1000, 'Tóm tắt không được quá 1000 ký tự']
    },

    keywords: [String],

    wordCount: {
        type: Number,
        default: 0
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người tạo là bắt buộc']
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    assignedReporters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // New field for edit requests
    editRequests: [editRequestSubSchema],

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    approvedAt: Date,

    approvalFeedback: String,

    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    rejectedAt: Date,

    rejectionFeedback: String,

    rejectionHistory: [rejectionHistorySubSchema],

    versions: [versionSubSchema],
    linkedEvidences: [linkedEvidenceSubSchema],
    reviewerComments: [reviewerCommentSubSchema],

    evaluations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evaluation'
    }],

    metadata: {
        viewCount: {
            type: Number,
            default: 0
        },
        downloadCount: {
            type: Number,
            default: 0
        },
        evaluationCount: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 10
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

reportSchema.index({ academicYearId: 1, type: 1 });
reportSchema.index({ academicYearId: 1, programId: 1, organizationId: 1 });
reportSchema.index({ academicYearId: 1, standardId: 1 });
reportSchema.index({ academicYearId: 1, criteriaId: 1 });
reportSchema.index({ createdBy: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ taskId: 1 });
reportSchema.index({ title: 'text', content: 'text', summary: 'text' });
reportSchema.index({ code: 1 }, { unique: true });

reportSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();

        if (this.isModified('content')) {
            this.wordCount = this.content ? this.content.split(/\s+/).length : 0;

            if (this.versions) {
                this.versions.push({
                    content: this.content,
                    changeNote: 'Cập nhật nội dung tự động',
                    changedBy: this.updatedBy
                });
            }
        }
    } else if (this.isNew && this.content) {
        this.wordCount = this.content.split(/\s+/).length;
    }
    next();
});

reportSchema.virtual('typeText').get(function() {
    const typeMap = {
        'criteria': 'Báo cáo tiêu chí',
        'standard': 'Báo cáo tiêu chuẩn',
        'overall_tdg': 'Báo cáo tổng hợp TĐG'
    };
    return typeMap[this.type] || this.type;
});

reportSchema.virtual('statusText').get(function() {
    const statusMap = {
        'draft': 'Bản nháp',
        'public': 'Công khai',
        'approved': 'Chấp thuận',
        'rejected': 'Từ chối',
        'published': 'Phát hành',
        'in_progress': 'Đang thực hiện',
        'submitted': 'Đã nộp chờ duyệt'
    };
    return statusMap[this.status] || this.status;
});

reportSchema.virtual('url').get(function() {
    return `/reports/${this._id}`;
});

reportSchema.methods.addActivityLog = async function(action, userId, description, additionalData = {}) {
    const ActivityLog = require('../system/ActivityLog');
    return ActivityLog.log({
        userId,
        academicYearId: this.academicYearId,
        action,
        description,
        targetType: 'Report',
        targetId: this._id,
        targetName: this.title,
        ...additionalData
    });
};

// Logic canEdit củng cố so sánh ID
reportSchema.methods.canEdit = function(userId, userRole) {
    if (userRole === 'admin' || userRole === 'manager') return true;

    // So sánh chuỗi ID để đảm bảo tính nhất quán (userId có thể là String hoặc ObjectId)
    const currentUserIdStr = String(userId);

    const isCreator = String(this.createdBy) === currentUserIdStr;
    const isAssigned = this.assignedReporters.some(r => String(r) === currentUserIdStr);

    return isCreator || isAssigned;
};

reportSchema.methods.canView = function(userId, userRole, userStandardAccess = [], userCriteriaAccess = []) {
    if (userRole === 'admin') return true;

    if (String(this.createdBy) === String(userId)) return true;

    if (['public', 'published'].includes(this.status)) return true;

    if (userRole === 'manager') return true;

    if (this.standardId && userStandardAccess.includes(this.standardId.toString())) return true;

    return this.criteriaId && userCriteriaAccess.includes(this.criteriaId.toString());
};

reportSchema.methods.incrementView = async function(userId) {
    this.metadata.viewCount += 1;
    await this.save();

    await this.addActivityLog('report_view', userId,
        `Xem báo cáo: ${this.title}`, {
            severity: 'low'
        });

    return this;
};

reportSchema.methods.incrementDownload = async function(userId) {
    this.metadata.downloadCount += 1;
    await this.save();

    await this.addActivityLog('report_download', userId,
        `Tải xuống báo cáo: ${this.title}`, {
            severity: 'low'
        });

    return this;
};

reportSchema.methods.publish = async function(userId) {
    const oldStatus = this.status;
    this.status = 'published';
    this.updatedBy = userId;

    await this.save();

    await this.addActivityLog('report_publish', userId,
        `Xuất bản báo cáo: ${this.title}`, {
            severity: 'high',
            oldData: { status: oldStatus },
            newData: { status: 'published' },
            isAuditRequired: true
        });

    return this;
};

reportSchema.methods.unpublish = async function(userId) {
    const oldStatus = this.status;
    this.status = 'draft';
    this.updatedBy = userId;

    await this.save();

    await this.addActivityLog('report_unpublish', userId,
        `Thu hồi xuất bản báo cáo: ${this.title}`, {
            severity: 'high',
            oldData: { status: oldStatus },
            newData: { status: 'draft' },
            isAuditRequired: true
        });

    return this;
};

reportSchema.methods.addVersion = async function(versionData) {
    this.versions.push(versionData);
    return this.save();
};

reportSchema.methods.addComment = async function(commentData) {
    this.reviewerComments.push(commentData);
    return this.save();
};

reportSchema.methods.resolveComment = async function(commentId) {
    const comment = this.reviewerComments.id(commentId);
    if (comment) {
        comment.isResolved = true;
    }
    return this.save();
};

reportSchema.methods.recordRejection = async function(userId, reason) {
    this.rejectionHistory.push({
        reason,
        rejectedBy: userId,
        rejectedAt: new Date()
    });
    this.status = 'rejected';
    this.rejectedBy = userId;
    this.rejectedAt = new Date();
    this.rejectionFeedback = reason;
    return this.save();
};

reportSchema.methods.resubmitAfterRejection = async function(userId) {
    if (this.rejectionHistory.length > 0) {
        this.rejectionHistory[this.rejectionHistory.length - 1].submittedAgainAt = new Date();
    }
    this.status = 'draft';
    this.updatedBy = userId;
    return this.save();
};

reportSchema.statics.generateCode = async function(type, academicYearId, standardCode = '', criteriaCode = '') {
    const typePrefix = {
        'criteria': 'CA',
        'standard': 'SA',
        'overall_tdg': 'CR'
    };

    const AcademicYear = mongoose.model('AcademicYear');
    const academicYear = await AcademicYear.findById(academicYearId);
    const yearCode = academicYear ? academicYear.code.replace('-', '') : 'XXXX';

    let baseCode = `${typePrefix[type]}-${yearCode}`;

    if (standardCode) {
        baseCode += `-${standardCode.padStart(2, '0')}`;
    }

    if (criteriaCode) {
        baseCode += `-${criteriaCode.padStart(2, '0')}`;
    }

    const pattern = new RegExp(`^${baseCode}-\\d+$`);
    const lastReport = await this.findOne({ code: pattern }).sort({ code: -1 });

    let sequence = 1;
    if (lastReport) {
        const lastSequence = parseInt(lastReport.code.split('-').pop());
        sequence = lastSequence + 1;
    }

    return `${baseCode}-${sequence.toString().padStart(3, '0')}`;
};

reportSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            const ActivityLog = require('../system/ActivityLog');
            await ActivityLog.log('report_create', this.createdBy,
                `Tạo mới báo cáo: ${this.title}`, {
                    severity: 'medium',
                    result: 'success',
                    metadata: {
                        type: this.type,
                        wordCount: this.wordCount
                    }
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

reportSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.updatedBy) {
        try {
            await doc.addActivityLog('report_delete', doc.updatedBy,
                `Xóa báo cáo: ${doc.title}`, {
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

reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

module.exports = Report;