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

    // Đường dẫn phân cấp
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

    // Nội dung báo cáo
    content: {
        type: String,
        required: [true, 'Nội dung báo cáo là bắt buộc']
    },

    // Phương thức tạo nội dung
    contentMethod: {
        type: String,
        enum: ['online_editor', 'file_upload'],
        default: 'online_editor'
    },

    // File đính kèm (nếu upload file)
    attachedFile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    },

    // Minh chứng được tham chiếu trong báo cáo
    referencedEvidences: [{
        evidenceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Evidence'
        },
        contextText: String, // Đoạn văn bản chứa tham chiếu
        linkedText: String   // Văn bản được link
    }],

    // Trạng thái
    status: {
        type: String,
        enum: ['draft', 'under_review', 'published', 'archived'],
        default: 'draft'
    },

    // Metadata
    summary: {
        type: String,
        maxlength: [1000, 'Tóm tắt không được quá 1000 ký tự']
    },

    keywords: [String],

    wordCount: {
        type: Number,
        default: 0
    },

    // Thông tin người tạo
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người tạo là bắt buộc']
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Lịch sử thay đổi
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

    // Đánh giá
    evaluations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evaluation'
    }],

    // Thống kê
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
            default: 0
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
reportSchema.index({ academicYearId: 1, type: 1 });
reportSchema.index({ academicYearId: 1, programId: 1, organizationId: 1 });
reportSchema.index({ academicYearId: 1, standardId: 1 });
reportSchema.index({ academicYearId: 1, criteriaId: 1 });
reportSchema.index({ createdBy: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ title: 'text', content: 'text', summary: 'text' });
reportSchema.index({ code: 1 }, { unique: true });

// Pre-save middleware
reportSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();

        // Auto-generate word count
        if (this.isModified('content')) {
            this.wordCount = this.content ? this.content.split(/\s+/).length : 0;
        }
    }
    next();
});

// Generate unique code
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

    // Find next sequence number
    const pattern = new RegExp(`^${baseCode}-\\d+$`);
    const lastReport = await this.findOne({ code: pattern }).sort({ code: -1 });

    let sequence = 1;
    if (lastReport) {
        const lastSequence = parseInt(lastReport.code.split('-').pop());
        sequence = lastSequence + 1;
    }

    return `${baseCode}-${sequence.toString().padStart(3, '0')}`;
};

// Instance methods
reportSchema.methods.addVersion = function(newContent, userId, changeNote = '') {
    this.versions.push({
        version: this.versions.length + 1,
        content: this.content, // Save current content as version
        changedBy: userId,
        changeNote
    });

    this.content = newContent;
    this.updatedBy = userId;
};

reportSchema.methods.canEdit = function(userId, userRole) {
    if (userRole === 'admin') return true;
    if (this.createdBy.toString() === userId.toString()) return true;
    return false;
};

reportSchema.methods.canView = function(userId, userRole, userStandardAccess = [], userCriteriaAccess = []) {
    if (userRole === 'admin') return true;
    if (this.createdBy.toString() === userId.toString()) return true;
    if (this.status === 'published') return true;

    // Check access based on standard/criteria
    if (this.standardId && userStandardAccess.includes(this.standardId.toString())) return true;
    if (this.criteriaId && userCriteriaAccess.includes(this.criteriaId.toString())) return true;

    return false;
};

reportSchema.methods.incrementView = function() {
    this.metadata.viewCount += 1;
    return this.save();
};

reportSchema.methods.incrementDownload = function() {
    this.metadata.downloadCount += 1;
    return this.save();
};

// Auto-linking functionality
reportSchema.methods.extractEvidenceReferences = function() {
    if (!this.content) return [];

    // Pattern để tìm mã minh chứng: H1.01.02.04
    const evidencePattern = /H\d+\.\d{2}\.\d{2}\.\d{2}/g;
    const matches = this.content.match(evidencePattern) || [];

    return [...new Set(matches)]; // Remove duplicates
};

reportSchema.methods.linkEvidences = async function() {
    const evidenceCodes = this.extractEvidenceReferences();
    const Evidence = mongoose.model('Evidence');

    const evidences = await Evidence.find({
        code: { $in: evidenceCodes },
        academicYearId: this.academicYearId
    });

    this.referencedEvidences = evidences.map(evidence => ({
        evidenceId: evidence._id,
        contextText: this.getContextForCode(evidence.code),
        linkedText: evidence.code
    }));
};

reportSchema.methods.getContextForCode = function(code, contextLength = 100) {
    if (!this.content) return '';

    const index = this.content.indexOf(code);
    if (index === -1) return '';

    const start = Math.max(0, index - contextLength);
    const end = Math.min(this.content.length, index + code.length + contextLength);

    return this.content.substring(start, end);
};

// Virtual fields
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

reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Report', reportSchema);