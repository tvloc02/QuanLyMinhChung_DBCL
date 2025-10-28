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

    contactName: {
        type: String,
        maxlength: [100, 'Tên người liên hệ không được quá 100 ký tự'],
        trim: true
    },

    address: {
        type: String,
        maxlength: [300, 'Địa chỉ không được quá 300 ký tự'],
        trim: true
    },

    description: {
        type: String,
        maxlength: [1000, 'Mô tả không được quá 1000 ký tự'],
        trim: true
    },

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

    // Metadata về dữ liệu
    metadata: {
        totalPrograms: {
            type: Number,
            default: 0
        },
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

// Indexes
organizationSchema.index({ academicYearId: 1, code: 1 }, { unique: true });
organizationSchema.index({ academicYearId: 1, status: 1 });
organizationSchema.index({ academicYearId: 1, name: 'text' });

// Pre-save: cập nhật updatedAt
organizationSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Virtual: URL
organizationSchema.virtual('url').get(function() {
    return `/organizations/${this._id}`;
});

// Virtual: tên đầy đủ
organizationSchema.virtual('fullName').get(function() {
    return `${this.code} - ${this.name}`;
});

// Method: ghi log hoạt động
organizationSchema.methods.addActivityLog = async function(action, userId, description, additionalData = {}) {
    const ActivityLog = require('../system/ActivityLog');
    return ActivityLog.log({
        userId,
        academicYearId: this.academicYearId,
        action,
        description,
        targetType: 'Organization',
        targetId: this._id,
        targetName: this.fullName,
        ...additionalData
    });
};

// Method: kiểm tra tổ chức có đang được sử dụng
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

// Static method: tìm theo năm học
organizationSchema.statics.findByAcademicYear = function(academicYearId, query = {}) {
    return this.find({
        academicYearId,
        ...query
    });
};

// Post-save: ghi log tạo mới
organizationSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            await this.addActivityLog('organization_create', this.createdBy,
                `Tạo mới tổ chức: ${this.fullName}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

// Post-update: ghi log cập nhật
organizationSchema.post('findOneAndUpdate', async function(result, next) {
    if (result && result.updatedBy) {
        try {
            await result.addActivityLog('organization_update', result.updatedBy,
                `Cập nhật tổ chức: ${result.fullName}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

// Post-delete: ghi log xóa
organizationSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.updatedBy) {
        try {
            await doc.addActivityLog('organization_delete', doc.updatedBy,
                `Xóa tổ chức: ${doc.fullName}`, {
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

// Virtuals và transform JSON
organizationSchema.set('toJSON', { virtuals: true });
organizationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Organization', organizationSchema);