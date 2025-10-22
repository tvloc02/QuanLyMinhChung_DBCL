const mongoose = require('mongoose');

const standardSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    name: {
        type: String,
        required: [true, 'Tên tiêu chuẩn là bắt buộc'],
        trim: true,
        maxlength: [500, 'Tên tiêu chuẩn không được quá 500 ký tự'],
        index: 'text'
    },

    code: {
        type: String,
        required: [true, 'Mã tiêu chuẩn là bắt buộc'],
        trim: true,
        validate: {
            validator: function(code) {
                return /^\d{1,2}$/.test(code);
            },
            message: 'Mã tiêu chuẩn phải là 1-2 chữ số (VD: 1, 01, 12)'
        }
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

    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Phòng ban là bắt buộc']
    },

    objectives: {
        type: String,
        trim: true,
        maxlength: [2000, 'Mục tiêu không được quá 2000 ký tự']
    },

    evaluationCriteria: [{
        name: String,
        weight: Number
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
        totalCriteria: {
            type: Number,
            default: 0
        },
        totalEvidences: {
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

standardSchema.index({ academicYearId: 1, programId: 1, organizationId: 1, departmentId: 1, code: 1 }, { unique: true });
standardSchema.index({ academicYearId: 1, programId: 1, organizationId: 1, departmentId: 1 });
standardSchema.index({ academicYearId: 1, programId: 1, organizationId: 1, order: 1 });
standardSchema.index({ academicYearId: 1, status: 1 });

standardSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

standardSchema.virtual('fullName').get(function() {
    return `Tiêu chuẩn ${this.code}: ${this.name}`;
});

standardSchema.virtual('url').get(function() {
    return `/standards/${this._id}`;
});

standardSchema.methods.addActivityLog = async function(action, userId, additionalData = {}) {
    const ActivityLog = require('../system/ActivityLog');
    return ActivityLog.log({
        userId,
        academicYearId: this.academicYearId,
        action,
        targetType: 'Standard',
        targetId: this._id,
        targetName: this.fullName,
        ...additionalData
    });
};

standardSchema.methods.isInUse = async function() {
    const Criteria = require('./Criteria');
    const Evidence = require('./Evidence');

    const [criteriaCount, evidenceCount] = await Promise.all([
        Criteria.countDocuments({
            standardId: this._id,
            academicYearId: this.academicYearId
        }),
        Evidence.countDocuments({
            standardId: this._id,
            academicYearId: this.academicYearId
        })
    ]);

    return criteriaCount > 0 || evidenceCount > 0;
};

standardSchema.statics.findByProgramAndOrganization = function(programId, organizationId, academicYearId) {
    return this.find({
        academicYearId,
        programId,
        organizationId,
        status: 'active'
    })
        .sort({ order: 1, code: 1 });
};

standardSchema.statics.findByAcademicYear = function(academicYearId, query = {}) {
    return this.find({
        academicYearId,
        ...query
    });
};

standardSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            await this.addActivityLog('standard_create', this.createdBy,
                `Tạo mới tiêu chuẩn: ${this.fullName}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

standardSchema.post('findOneAndUpdate', async function(result, next) {
    if (result && result.updatedBy) {
        try {
            await result.addActivityLog('standard_update', result.updatedBy,
                `Cập nhật tiêu chuẩn: ${result.fullName}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

standardSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.updatedBy) {
        try {
            await doc.addActivityLog('standard_delete', doc.updatedBy,
                `Xóa tiêu chuẩn: ${doc.fullName}`, {
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

standardSchema.set('toJSON', { virtuals: true });
standardSchema.set('toObject', { virtuals: true });

const Standard = mongoose.model('Standard', standardSchema);

module.exports = Standard;