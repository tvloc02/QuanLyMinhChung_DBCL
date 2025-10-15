const mongoose = require('mongoose');

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

    // Loại bỏ trường referencedEvidences
    // referencedEvidences: [{
    //     evidenceId: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Evidence'
    //     },
    //     contextText: String,
    //     linkedText: String
    // }],

    // Loại bỏ trường accessControl
    // accessControl: {
    //     assignedExperts: [{
    //         expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //         assignedAt: Date,
    //         assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //         canComment: { type: Boolean, default: true },
    //         canEvaluate: { type: Boolean, default: true }
    //     }],
    //     advisors: [{
    //         advisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //         assignedAt: Date,
    //         assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //         canComment: { type: Boolean, default: true },
    //         canEvaluate: { type: Boolean, default: false }
    //     }],
    //     isPublic: { type: Boolean, default: false },
    //     publicSince: Date
    // },

    // Loại bỏ trường reviewerComments
    // reviewerComments: [{
    //     commentId: mongoose.Schema.Types.ObjectId,
    //     reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //     reviewerType: {
    //         type: String,
    //         enum: ['expert', 'advisor', 'manager'],
    //         required: true
    //     },
    //     comment: {
    //         type: String,
    //         required: true,
    //         maxlength: [2000, 'Comment không được quá 2000 ký tự']
    //     },
    //     commentedAt: { type: Date, default: Date.now },
    //     section: String,
    //     isResolved: { type: Boolean, default: false },
    //     resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //     resolvedAt: Date
    // }],

    status: {
        type: String,
        enum: ['draft', 'under_review', 'published', 'archived'],
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

    versions: [{
        version: Number,
        content: String,
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        changeNote: String
    }],

    // Loại bỏ trường evaluations
    // evaluations: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Evaluation'
    // }],

    metadata: {
        viewCount: {
            type: Number,
            default: 0
        },
        downloadCount: {
            type: Number,
            default: 0
        },
        // Loại bỏ evaluationCount và averageScore
        // evaluationCount: {
        //     type: Number,
        //     default: 0
        // },
        // averageScore: {
        //     type: Number,
        //     default: 0
        // }
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
// Loại bỏ index liên quan đến accessControl
// reportSchema.index({ 'accessControl.assignedExperts.expertId': 1 });
// reportSchema.index({ 'accessControl.advisors.advisorId': 1 });

reportSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();

        if (this.isModified('content')) {
            this.wordCount = this.content ? this.content.split(/\s+/).length : 0;
        }
    }
    next();
});

reportSchema.virtual('typeText').get(function() {
    const typeMap = {
        'criteria_analysis': 'Phiếu phân tích tiêu chí',
        'standard_analysis': 'Phiếu phân tích tiêu chuẩn',
        'comprehensive_report': 'Báo cáo tổng hợp'
    };
    return typeMap[this.type] || this.type;
});

reportSchema.virtual('statusText').get(function() {
    const statusMap = {
        'draft': 'Bản nháp',
        'under_review': 'Đang xem xét',
        'published': 'Đã xuất bản',
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

// Loại bỏ phương thức canAccess
// reportSchema.methods.canAccess = function(userId, userRole) { ... };

// Loại bỏ phương thức addReviewer
// reportSchema.methods.addReviewer = async function(reviewerId, reviewerType, addedBy) { ... };

// Loại bỏ phương thức removeReviewer
// reportSchema.methods.removeReviewer = async function(reviewerId, reviewerType) { ... };

// Loại bỏ phương thức addComment
// reportSchema.methods.addComment = async function(reviewerId, reviewerType, comment, section = null) { ... };

// Loại bỏ phương thức resolveComment
// reportSchema.methods.resolveComment = async function(commentId, resolvedBy) { ... };

// Loại bỏ phương thức validateEvidenceLinks
// reportSchema.methods.validateEvidenceLinks = async function() { ... };

reportSchema.statics.generateCode = async function(type, academicYearId, standardCode = '', criteriaCode = '') {
    const typePrefix = {
        'criteria_analysis': 'CA',
        'standard_analysis': 'SA',
        'comprehensive_report': 'CR'
    };

    const academicYear = await mongoose.model('AcademicYear').findById(academicYearId);
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

reportSchema.methods.addVersion = async function(newContent, userId, changeNote = '') {
    const oldContent = this.content;

    this.versions.push({
        version: this.versions.length + 1,
        content: this.content,
        changedBy: userId,
        changeNote
    });

    this.content = newContent;
    this.updatedBy = userId;

    await this.addActivityLog('report_update', userId,
        `Cập nhật báo cáo: ${changeNote || 'Không có ghi chú'}`, {
            severity: 'medium',
            oldData: { wordCount: oldContent ? oldContent.split(/\s+/).length : 0 },
            newData: { wordCount: newContent ? newContent.split(/\s+/).length : 0 }
        });

    return this.save();
};

reportSchema.methods.canEdit = function(userId, userRole) {
    if (userRole === 'admin') return true;
    return this.createdBy.toString() === userId.toString();
};

reportSchema.methods.canView = function(userId, userRole, userStandardAccess = [], userCriteriaAccess = []) {
    if (userRole === 'admin') return true;
    if (this.createdBy.toString() === userId.toString()) return true;
    // Bỏ kiểm tra accessControl.isPublic và chỉ giữ lại status published
    if (this.status === 'published') return true;

    // Kiểm tra quyền truy cập theo tiêu chuẩn/tiêu chí
    if (this.standardId && userStandardAccess.includes(this.standardId.toString())) return true;
    if (this.criteriaId && userCriteriaAccess.includes(this.criteriaId.toString())) return true;

    // Loại bỏ kiểm tra expert/advisor access
    // const hasExpertAccess = this.accessControl.assignedExperts.some(
    //     e => e.expertId.toString() === userId.toString()
    // );
    // if (hasExpertAccess) return true;

    // const hasAdvisorAccess = this.accessControl.advisors.find(
    //     a => a.advisorId.toString() === userId.toString()
    // );
    // if (advisor) return true;

    return false;
};

reportSchema.methods.incrementView = async function() {
    this.metadata.viewCount += 1;

    await this.save();

    await this.addActivityLog('report_view', null,
        `Xem báo cáo: ${this.title}`, {
            severity: 'low'
        });

    return this;
};

reportSchema.methods.incrementDownload = async function() {
    this.metadata.downloadCount += 1;

    await this.save();

    await this.addActivityLog('report_download', null,
        `Tải xuống báo cáo: ${this.title}`, {
            severity: 'low'
        });

    return this;
};

// Loại bỏ phương thức extractEvidenceReferences
// reportSchema.methods.extractEvidenceReferences = function() { ... };

// Loại bỏ phương thức linkEvidences
// reportSchema.methods.linkEvidences = async function() { ... };

// Loại bỏ phương thức getContextForCode
// reportSchema.methods.getContextForCode = function(code, contextLength = 100) { ... };

reportSchema.methods.publish = async function(userId) {
    const oldStatus = this.status;
    this.status = 'published';
    this.updatedBy = userId;
    // Loại bỏ logic isPublic/publicSince
    // this.accessControl.isPublic = true;
    // this.accessControl.publicSince = new Date();

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

// Giữ lại và đơn giản hóa canView (bỏ logic expert/advisor)
reportSchema.methods.canView = function(userId, userRole, userStandardAccess = [], userCriteriaAccess = []) {
    if (userRole === 'admin') return true;
    if (this.createdBy.toString() === userId.toString()) return true;
    // Bỏ isPublic
    if (this.status === 'published') return true;

    // Bỏ logic accessControl
    // const hasExpertAccess = this.accessControl.assignedExperts.some(
    //     e => e.expertId.toString() === userId.toString()
    // );
    // if (hasExpertAccess) return true;
    // const hasAdvisorAccess = this.accessControl.advisors.some(
    //     a => a.advisorId.toString() === userId.toString()
    // );
    // if (hasAdvisorAccess) return true;

    if (this.standardId && userStandardAccess.includes(this.standardId.toString())) {
        return true;
    }
    if (this.criteriaId && userCriteriaAccess.includes(this.criteriaId.toString())) {
        return true;
    }
    return false;
};

// Giữ lại canEdit
reportSchema.methods.canEdit = function(userId, userRole) {
    if (userRole === 'admin') return true;
    return this.createdBy.toString() === userId.toString();
};

// Loại bỏ canComment
// reportSchema.methods.canComment = function(userId, userRole) { ... };

// Loại bỏ canEvaluate
// reportSchema.methods.canEvaluate = function(userId, userRole) { ... };

reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Report', reportSchema);