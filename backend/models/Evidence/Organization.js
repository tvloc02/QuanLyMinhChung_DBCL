const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    name: {
        type: String,
        required: [true, 'Tên tổ chức - cấp đánh giá là bắt buộc'],
        trim: true,
        maxlength: [300, 'Tên tổ chức không được quá 300 ký tự'],
        index: 'text'
    },

    code: {
        type: String,
        required: [true, 'Mã tổ chức là bắt buộc'],
        uppercase: true,
        trim: true,
        maxlength: [20, 'Mã tổ chức không được quá 20 ký tự'],
        validate: {
            validator: function(code) {
                return /^[A-Z0-9\-_]+$/.test(code);
            },
            message: 'Mã tổ chức chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới'
        }
    },

    contactEmail: {
        type: String,
        validate: {
            validator: function(email) {
                if (!email) return true;
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
            },
            message: 'Email liên hệ không hợp lệ'
        }
    },

    contactPhone: {
        type: String,
        validate: {
            validator: function(phone) {
                if (!phone) return true;
                return /^[\d\s\-\+\(\)]+$/.test(phone);
            },
            message: 'Số điện thoại không hợp lệ'
        }
    },

    departments: [{
        _id: mongoose.Schema.Types.ObjectId,
        name: {
            type: String,
            required: [true, 'Tên phòng ban là bắt buộc'],
            trim: true,
            maxlength: [150, 'Tên phòng ban không được quá 150 ký tự']
        },
        email: {
            type: String,
            validate: {
                validator: function(email) {
                    if (!email) return true;
                    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
                },
                message: 'Email phòng ban không hợp lệ'
            }
        },
        phone: {
            type: String,
            validate: {
                validator: function(phone) {
                    if (!phone) return true;
                    return /^[\d\s\-\+\(\)]+$/.test(phone);
                },
                message: 'Số điện thoại phòng ban không hợp lệ'
            }
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
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
        totalPrograms: {
            type: Number,
            default: 0
        },
        totalStandards: {
            type: Number,
            default: 0
        },
        totalEvidences: {
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

organizationSchema.index({ academicYearId: 1, code: 1 }, { unique: true });
organizationSchema.index({ academicYearId: 1, level: 1 });
organizationSchema.index({ academicYearId: 1, type: 1 });
organizationSchema.index({ academicYearId: 1, status: 1 });

organizationSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    // Tạo ID cho departments nếu chưa có
    if (this.departments) {
        this.departments.forEach(dept => {
            if (!dept._id) {
                dept._id = new mongoose.Types.ObjectId();
            }
        });
    }
    next();
});

organizationSchema.virtual('url').get(function() {
    return `/organizations/${this._id}`;
});

organizationSchema.methods.addActivityLog = async function(action, userId, additionalData = {}) {
    const ActivityLog = require('../system/ActivityLog');
    return ActivityLog.log({
        userId,
        academicYearId: this.academicYearId,
        action,
        targetType: 'Organization',
        targetId: this._id,
        targetName: this.name,
        ...additionalData
    });
};

organizationSchema.methods.isInUse = async function() {
    const Standard = require('./Standard');
    const Evidence = require('./Evidence');

    const [standardCount, evidenceCount] = await Promise.all([
        Standard.countDocuments({
            organizationId: this._id,
            academicYearId: this.academicYearId
        }),
        Evidence.countDocuments({
            organizationId: this._id,
            academicYearId: this.academicYearId
        })
    ]);

    return standardCount > 0 || evidenceCount > 0;
};

organizationSchema.statics.findByAcademicYear = function(academicYearId, query = {}) {
    return this.find({
        academicYearId,
        ...query
    });
};

organizationSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            await this.addActivityLog('organization_create', this.createdBy,
                `Tạo mới tổ chức: ${this.name}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

organizationSchema.post('findOneAndUpdate', async function(result, next) {
    if (result && result.updatedBy) {
        try {
            await result.addActivityLog('organization_update', result.updatedBy,
                `Cập nhật tổ chức: ${result.name}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

organizationSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.updatedBy) {
        try {
            await doc.addActivityLog('organization_delete', doc.updatedBy,
                `Xóa tổ chức: ${doc.name}`, {
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

organizationSchema.set('toJSON', { virtuals: true });
organizationSchema.set('toObject', { virtuals: true });

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;