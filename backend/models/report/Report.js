const mongoose = require('mongoose');

// Sub-schema cho phiên bản báo cáo
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

// Sub-schema cho minh chứng được liên kết
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
        enum: ['manager', 'evaluator', 'admin']
    },
    isResolved: {
        type: Boolean,
        default: false
    }
});

const reportSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
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
        enum: ['criteria_analysis', 'standard_analysis', 'comprehensive_report'],
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
            return this.type !== 'comprehensive_report';
        }
    },

    criteriaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria',
        required: function() {
            return this.type === 'criteria_analysis';
        }
    },

    content: {
        type: String,
        default: '',
        required: false,
        maxlength: [100000, 'Nội dung không được quá 100000 ký tự']
    },

    contentMethod: {
        type: String,
        enum: ['online_editor'],
        default: 'online_editor'
    },

    attachedFile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    },

    // draft: bản nháp
    // in_review: đang được duyệt
    // approved: đã duyệt
    // published: đã công khai
    // archived: lưu trữ
    status: {
        type: String,
        enum: ['draft', 'in_review', 'approved', 'published', 'archived'],
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
        },
        lastReviewedAt: Date,
        lastReviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
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
reportSchema.index({ title: 'text', content: 'text', summary: 'text' });
reportSchema.index({ code: 1 }, { unique: true });

reportSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();

        if (this.isModified('content')) {
            this.wordCount = this.content ? this.content.split(/\s+/).length : 0;

            // Tự động thêm phiên bản
            if (this.versions) {
                this.versions.push({
                    content: this.content,
                    changeNote: 'Cập nhật nội dung',
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
        'criteria_analysis': 'Báo cáo tiêu chí',
        'standard_analysis': 'Báo cáo tiêu chuẩn',
        'comprehensive_report': 'Báo cáo tổng hợp'
    };
    return typeMap[this.type] || this.type;
});

reportSchema.virtual('statusText').get(function() {
    const statusMap = {
        'draft': 'Bản nháp',
        'in_review': 'Đang duyệt',
        'approved': 'Đã duyệt',
        'published': 'Đã công khai',
        'archived': 'Lưu trữ'
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

reportSchema.methods.canEdit = function(userId, userRole) {
    if (userRole === 'admin') return true;
    return this.createdBy.toString() === userId.toString() && this.status === 'draft';
};

reportSchema.methods.canView = function(userId, userRole, userStandardAccess = [], userCriteriaAccess = []) {
    if (userRole === 'admin') return true;
    if (this.createdBy.toString() === userId.toString()) return true;
    if (this.status === 'published') return true;
    if (userRole === 'manager') return true;

    if (this.standardId && userStandardAccess.includes(this.standardId.toString())) return true;
    if (this.criteriaId && userCriteriaAccess.includes(this.criteriaId.toString())) return true;

    return false;
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

reportSchema.methods.submitForReview = async function(userId) {
    const oldStatus = this.status;
    this.status = 'in_review';
    this.updatedBy = userId;

    await this.save();

    await this.addActivityLog('report_submit', userId,
        `Gửi duyệt báo cáo: ${this.title}`, {
            severity: 'medium',
            oldData: { status: oldStatus },
            newData: { status: 'in_review' }
        });

    return this;
};

reportSchema.methods.approve = async function(userId) {
    const oldStatus = this.status;
    this.status = 'approved';
    this.updatedBy = userId;
    this.metadata.lastReviewedAt = new Date();
    this.metadata.lastReviewedBy = userId;

    await this.save();

    await this.addActivityLog('report_approve', userId,
        `Phê duyệt báo cáo: ${this.title}`, {
            severity: 'high',
            oldData: { status: oldStatus },
            newData: { status: 'approved' },
            isAuditRequired: true
        });

    return this;
};

reportSchema.methods.reject = async function(userId, reason = '') {
    const oldStatus = this.status;
    this.status = 'draft';
    this.updatedBy = userId;

    await this.save();

    await this.addActivityLog('report_reject', userId,
        `Từ chối báo cáo: ${this.title} - ${reason}`, {
            severity: 'high',
            oldData: { status: oldStatus },
            newData: { status: 'draft' },
            metadata: { reason }
        });

    return this;
};

reportSchema.methods.publish = async function(userId) {
    const oldStatus = this.status;
    this.status = 'published';
    this.updatedBy = userId;

    await this.save();

    await this.addActivityLog('report_publish', userId,
        `Công khai báo cáo: ${this.title}`, {
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
        `Thu hồi công khai báo cáo: ${this.title}`, {
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

reportSchema.statics.generateCode = async function(type, academicYearId, standardCode = '', criteriaCode = '') {
    const typePrefix = {
        'criteria_analysis': 'CA',
        'standard_analysis': 'SA',
        'comprehensive_report': 'CR'
    };

    const AcademicYear = require('../system/AcademicYear');
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
            await this.addActivityLog('report_create', this.createdBy,
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

module.exports = mongoose.model('Report', reportSchema);