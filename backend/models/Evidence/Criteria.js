const mongoose = require('mongoose');

const criteriaSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    name: {
        type: String,
        required: [true, 'Tên tiêu chí là bắt buộc'],
        trim: true,
        maxlength: [500, 'Tên tiêu chí không được quá 500 ký tự'],
        index: 'text'
    },

    code: {
        type: String,
        required: [true, 'Mã tiêu chí là bắt buộc'],
        trim: true,
        validate: {
            validator: function(code) {
                return /^\d{1,2}$/.test(code);
            },
            message: 'Mã tiêu chí phải là số từ 1-99 (VD: 1, 01, 12)'
        }
    },


    standardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Standard',
        required: [true, 'Tiêu chuẩn là bắt buộc']
    },

    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: [true, 'Chương trình đánh giá là bắt buộc']
    },

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Tổ chức - cấp đánh giá là bắt buộc']
    },
    indicators: [{
        name: {
            type: String,
            required: true,
            maxlength: [200, 'Tên chỉ số không được quá 200 ký tự']
        },
        description: {
            type: String,
            maxlength: [1000, 'Mô tả chỉ số không được quá 1000 ký tự']
        },
        measurementMethod: {
            type: String,
            maxlength: [500, 'Phương pháp đo không được quá 500 ký tự']
        },
        targetValue: String,
        unit: String
    }],

    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'archived'],
        default: 'active'
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

    metadata: {
        totalEvidences: {
            type: Number,
            default: 0
        },
        totalFiles: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        lastEvidenceDate: Date
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

criteriaSchema.index({ academicYearId: 1, standardId: 1, code: 1 }, { unique: true });
criteriaSchema.index({ academicYearId: 1, standardId: 1 });
criteriaSchema.index({ academicYearId: 1, programId: 1, organizationId: 1 });
criteriaSchema.index({ academicYearId: 1, status: 1 });
criteriaSchema.index({ academicYearId: 1, name: 'text', description: 'text' });

criteriaSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

criteriaSchema.virtual('fullName').get(function() {
    return `Tiêu chí ${this.code}: ${this.name}`;
});

criteriaSchema.virtual('url').get(function() {
    return `/criteria/${this._id}`;
});

criteriaSchema.methods.addActivityLog = async function(action, userId, description, additionalData = {}) {
    const ActivityLog = require('../system/ActivityLog');
    return ActivityLog.log({
        userId,
        academicYearId: this.academicYearId,
        action,
        description,
        targetType: 'Criteria',
        targetId: this._id,
        targetName: this.fullName,
        ...additionalData
    });
};

criteriaSchema.methods.isInUse = async function() {
    const Evidence = require('./Evidence');
    const evidenceCount = await Evidence.countDocuments({
        criteriaId: this._id,
        academicYearId: this.academicYearId
    });
    return evidenceCount > 0;
};

criteriaSchema.statics.findByStandard = function(standardId, academicYearId) {
    return this.find({
        academicYearId,
        standardId,
        status: 'active'
    })
        .sort({ code: 1 });
};

criteriaSchema.statics.findByProgramAndOrganization = function(programId, organizationId, academicYearId) {
    return this.find({
        academicYearId,
        programId,
        organizationId,
        status: 'active'
    })
        .populate('standardId', 'name code')
        .sort({ 'standardId.code': 1, code: 1 });
};

criteriaSchema.statics.findByAcademicYear = function(academicYearId, query = {}) {
    return this.find({
        academicYearId,
        ...query
    });
};

criteriaSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            await this.addActivityLog('criteria_create', this.createdBy,
                `Tạo mới tiêu chí: ${this.fullName}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

criteriaSchema.post('findOneAndUpdate', async function(result, next) {
    if (result && result.updatedBy) {
        try {
            await result.addActivityLog('criteria_update', result.updatedBy,
                `Cập nhật tiêu chí: ${result.fullName}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

criteriaSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.updatedBy) {
        try {
            await doc.addActivityLog('criteria_delete', doc.updatedBy,
                `Xóa tiêu chí: ${doc.fullName}`, {
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

criteriaSchema.set('toJSON', { virtuals: true });
criteriaSchema.set('toObject', { virtuals: true });

const Criteria = mongoose.model('Criteria', criteriaSchema);

module.exports = Criteria;