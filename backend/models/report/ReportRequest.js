const mongoose = require('mongoose');

const reportRequestSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    title: {
        type: String,
        required: [true, 'Tiêu đề yêu cầu là bắt buộc'],
        trim: true,
        maxlength: [500, 'Tiêu đề không được quá 500 ký tự']
    },

    description: {
        type: String,
        required: [true, 'Mô tả yêu cầu là bắt buộc'],
        maxlength: [2000, 'Mô tả không được quá 2000 ký tự']
    },

    type: {
        type: String,
        enum: ['criteria_analysis', 'standard_analysis', 'comprehensive_report'],
        required: [true, 'Loại báo cáo là bắt buộc']
    },

    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: [true, 'Chương trình là bắt buộc']
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

    deadline: {
        type: Date,
        required: [true, 'Hạn chót là bắt buộc']
    },

    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người tạo là bắt buộc']
    },

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người nhận yêu cầu là bắt buộc']
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'in_progress', 'completed', 'rejected'],
        default: 'pending'
    },

    responseNote: {
        type: String,
        maxlength: [500, 'Ghi chú phản hồi không được quá 500 ký tự']
    },

    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report'
    },

    acceptedAt: Date,
    rejectedAt: Date,
    completedAt: Date,

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

reportRequestSchema.index({ academicYearId: 1 });
reportRequestSchema.index({ createdBy: 1 });
reportRequestSchema.index({ assignedTo: 1 });
reportRequestSchema.index({ status: 1 });
reportRequestSchema.index({ deadline: 1 });

reportRequestSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

reportRequestSchema.methods.accept = async function() {
    this.status = 'accepted';
    this.acceptedAt = new Date();
    return this.save();
};

reportRequestSchema.methods.reject = async function(responseNote = '') {
    this.status = 'rejected';
    this.responseNote = responseNote;
    this.rejectedAt = new Date();
    return this.save();
};

reportRequestSchema.methods.markInProgress = async function() {
    this.status = 'in_progress';
    return this.save();
};

reportRequestSchema.methods.complete = async function(reportId) {
    this.status = 'completed';
    this.reportId = reportId;
    this.completedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('ReportRequest', reportRequestSchema);