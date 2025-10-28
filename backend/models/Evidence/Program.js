const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    name: {
        type: String,
        required: [true, 'Tên chương trình đánh giá là bắt buộc'],
        trim: true,
        maxlength: [300, 'Tên chương trình không được quá 300 ký tự'],
        index: 'text'
    },

    code: {
        type: String,
        required: [true, 'Mã chương trình là bắt buộc'],
        uppercase: true,
        trim: true,
        maxlength: [20, 'Mã chương trình không được quá 20 ký tự'],
        validate: {
            validator: function(code) {
                return /^[A-Z0-9\-_]+$/.test(code);
            },
            message: 'Mã chương trình chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới'
        }
    },

    applicableYear: {
        type: Number,
        default: function() {
            return new Date().getFullYear();
        },
        min: [2000, 'Năm áp dụng không được nhỏ hơn 2000'],
        max: [2100, 'Năm áp dụng không được lớn hơn 2100']
    },

    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'archived'],
        default: 'active'
    },

    effectiveDate: {
        type: Date
    },

    expiryDate: {
        type: Date
    },

    objectives: {
        type: String,
        trim: true,
        maxlength: [2000, 'Mục tiêu không được quá 2000 ký tự']
    },

    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Mô tả không được quá 2000 ký tự']
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
        totalStandards: {
            type: Number,
            default: 0
        },
        totalCriteria: {
            type: Number,
            default: 0
        },
        totalEvidences: {
            type: Number,
            default: 0
        },
        totalReports: {
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

programSchema.index({ academicYearId: 1, code: 1 }, { unique: true });
programSchema.index({ academicYearId: 1, status: 1 });
programSchema.index({ academicYearId: 1, applicableYear: 1 });
programSchema.index({ academicYearId: 1, name: 'text' });

programSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

programSchema.virtual('url').get(function() {
    return `/programs/${this._id}`;
});

programSchema.virtual('fullName').get(function() {
    return `${this.code} - ${this.name}`;
});

programSchema.methods.addActivityLog = async function(action, userId, description, additionalData = {}) {
    const ActivityLog = require('../system/ActivityLog');
    return ActivityLog.log({
        userId,
        academicYearId: this.academicYearId,
        action,
        description,
        targetType: 'Program',
        targetId: this._id,
        targetName: this.fullName,
        ...additionalData
    });
};

programSchema.methods.isInUse = async function() {
    const Standard = require('./Standard');
    const Evidence = require('./Evidence');

    const [standardCount, evidenceCount] = await Promise.all([
        Standard.countDocuments({
            programId: this._id,
            academicYearId: this.academicYearId
        }),
        Evidence.countDocuments({
            programId: this._id,
            academicYearId: this.academicYearId
        })
    ]);

    return standardCount > 0 || evidenceCount > 0;
};

programSchema.statics.getStatistics = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    return stats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});
};

programSchema.statics.findByAcademicYear = function(academicYearId, query = {}) {
    return this.find({
        academicYearId,
        ...query
    });
};

programSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            await this.addActivityLog('program_create', this.createdBy,
                `Tạo mới chương trình: ${this.fullName}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

programSchema.post('findOneAndUpdate', async function(result, next) {
    if (result && result.updatedBy) {
        try {
            await result.addActivityLog('program_update', result.updatedBy,
                `Cập nhật chương trình: ${result.fullName}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

programSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.updatedBy) {
        try {
            await doc.addActivityLog('program_delete', doc.updatedBy,
                `Xóa chương trình: ${doc.fullName}`, {
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

programSchema.set('toJSON', { virtuals: true });
programSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Program', programSchema);