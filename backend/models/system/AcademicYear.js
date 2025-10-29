const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên năm học là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên năm học không được quá 100 ký tự'],
        unique: true,
        index: 'text'
    },

    code: {
        type: String,
        required: [true, 'Mã năm học là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [20, 'Mã năm học không được quá 20 ký tự'],
        validate: {
            validator: function(code) {
                return /^\d{4}-\d{4}$/.test(code);
            },
            message: 'Mã năm học phải có định dạng YYYY-YYYY (VD: 2024-2025)'
        }
    },

    startYear: {
        type: Number,
        required: [true, 'Năm bắt đầu là bắt buộc'],
        min: [2020, 'Năm bắt đầu không được nhỏ hơn 2020'],
        max: [2050, 'Năm bắt đầu không được lớn hơn 2050']
    },

    endYear: {
        type: Number,
        required: [true, 'Năm kết thúc là bắt buộc'],
        min: [2021, 'Năm kết thúc không được nhỏ hơn 2021'],
        max: [2051, 'Năm kết thúc không được lớn hơn 2051']
    },

    startDate: {
        type: Date,
        required: [true, 'Ngày bắt đầu là bắt buộc']
    },

    endDate: {
        type: Date,
        required: [true, 'Ngày kết thúc là bắt buộc']
    },

    status: {
        type: String,
        enum: ['draft', 'active', 'completed', 'archived'],
        default: 'draft'
    },

    isCurrent: {
        type: Boolean,
        default: false
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
        totalCriteria: {
            type: Number,
            default: 0
        },
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
        }
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

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

academicYearSchema.index({ code: 1 });
academicYearSchema.index({ startYear: 1, endYear: 1 });
academicYearSchema.index({ status: 1 });
academicYearSchema.index({ isCurrent: 1 });

academicYearSchema.pre('validate', function(next) {
    if (this.endYear <= this.startYear) {
        next(new Error('Năm kết thúc phải lớn hơn năm bắt đầu'));
    }

    if (this.endDate <= this.startDate) {
        next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
    }

    if (!this.code && this.startYear && this.endYear) {
        this.code = `${this.startYear}-${this.endYear}`;
    }

    next();
});

academicYearSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

academicYearSchema.pre('save', async function(next) {
    if (this.isCurrent && this.isModified('isCurrent')) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isCurrent: false }
        );
    }
    next();
});

academicYearSchema.virtual('displayName').get(function() {
    return `${this.name} (${this.code})`;
});

academicYearSchema.virtual('duration').get(function() {
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    return 0;
});

academicYearSchema.virtual('isActive').get(function() {
    const now = new Date();
    return this.startDate <= now && now <= this.endDate;
});

academicYearSchema.virtual('url').get(function() {
    return `/academic-years/${this._id}`;
});

academicYearSchema.methods.addActivityLog = async function(action, userId, additionalData = {}) {
    const ActivityLog = require('./ActivityLog');
    return ActivityLog.log({
        userId,
        academicYearId: this._id,
        action,
        targetType: 'AcademicYear',
        targetId: this._id,
        targetName: this.displayName,
        ...additionalData
    });
};

academicYearSchema.methods.activate = async function(userId) {
    const oldCurrent = await this.constructor.getCurrentYear();

    await this.constructor.updateMany(
        { _id: { $ne: this._id } },
        { isCurrent: false }
    );

    this.isCurrent = true;
    this.status = 'active';
    this.updatedBy = userId;

    await this.save();

    await this.addActivityLog('academic_year_activate', userId,
        `Kích hoạt năm học ${this.displayName}`, {
            severity: 'high',
            isAuditRequired: true,
            oldData: { currentYear: oldCurrent?.displayName },
            newData: { currentYear: this.displayName }
        });

    return this;
};

academicYearSchema.methods.canDelete = async function() {
    const Program = require('../Evidence/Program');
    const Evidence = require('../Evidence/Evidence');

    const [programCount, evidenceCount] = await Promise.all([
        Program.countDocuments({ academicYearId: this._id }),
        Evidence.countDocuments({ academicYearId: this._id })
    ]);

    return programCount === 0 && evidenceCount === 0;
};

academicYearSchema.statics.getCurrentYear = function() {
    return this.findOne({ isCurrent: true });
};

academicYearSchema.statics.getActiveYear = function() {
    const now = new Date();
    return this.findOne({
        startDate: { $lte: now },
        endDate: { $gte: now },
        status: 'active'
    });
};

academicYearSchema.statics.createYear = async function(yearData, userId) {
    if (!yearData.code && yearData.startYear && yearData.endYear) {
        yearData.code = `${yearData.startYear}-${yearData.endYear}`;
    }

    if (!yearData.name && yearData.startYear && yearData.endYear) {
        yearData.name = `Năm học ${yearData.startYear}-${yearData.endYear}`;
    }

    const academicYear = new this({
        ...yearData,
        createdBy: userId,
        updatedBy: userId
    });

    return academicYear.save();
};

academicYearSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            await this.addActivityLog('academic_year_create', this.createdBy,
                `Tạo mới năm học: ${this.displayName}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

academicYearSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.updatedBy) {
        try {
            await doc.addActivityLog('academic_year_delete', doc.updatedBy,
                `Xóa năm học: ${doc.displayName}`, {
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

academicYearSchema.set('toJSON', { virtuals: true });
academicYearSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);