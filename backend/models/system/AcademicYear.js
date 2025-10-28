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

    // Cài đặt sao chép dữ liệu từ năm học khác
    copySettings: {
        programs: {
            type: Boolean,
            default: true
        },
        organizations: {
            type: Boolean,
            default: true
        },
        standards: {
            type: Boolean,
            default: true
        },
        criteria: {
            type: Boolean,
            default: true
        },
        evidenceTemplates: {
            type: Boolean,
            default: false
        }
    },

    // Metadata về dữ liệu
    metadata: {
        totalPrograms: {
            type: Number,
            default: 0
        },
        totalOrganizations: {
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

// Indexes
academicYearSchema.index({ code: 1 });
academicYearSchema.index({ startYear: 1, endYear: 1 });
academicYearSchema.index({ status: 1 });
academicYearSchema.index({ isCurrent: 1 });

// Pre-validate: kiểm tra năm và ngày
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

// Pre-save: cập nhật updatedAt
academicYearSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Pre-save: nếu là năm học hiện tại, gỡ bỏ isCurrent ở các năm khác
academicYearSchema.pre('save', async function(next) {
    if (this.isCurrent && this.isModified('isCurrent')) {
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isCurrent: false }
        );
    }
    next();
});

// Virtual: tên hiển thị
academicYearSchema.virtual('displayName').get(function() {
    return `${this.name} (${this.code})`;
});

// Virtual: thời lượng (ngày)
academicYearSchema.virtual('duration').get(function() {
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    return 0;
});

// Virtual: kiểm tra năm học có đang chạy không
academicYearSchema.virtual('isActive').get(function() {
    const now = new Date();
    return this.startDate <= now && now <= this.endDate;
});

// Virtual: URL
academicYearSchema.virtual('url').get(function() {
    return `/academic-years/${this._id}`;
});

// Method: ghi log hoạt động
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

// Method: kích hoạt năm học
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

    await this.addActivityLog('academic_year_activate', userId, {
        severity: 'high',
        isAuditRequired: true,
        oldData: { currentYear: oldCurrent?.displayName },
        newData: { currentYear: this.displayName }
    });

    return this;
};

// Method: kiểm tra có thể xóa không
academicYearSchema.methods.canDelete = async function() {
    const Program = require('../Evidence/Program');
    const Evidence = require('../Evidence/Evidence');

    const [programCount, evidenceCount] = await Promise.all([
        Program.countDocuments({ academicYearId: this._id }),
        Evidence.countDocuments({ academicYearId: this._id })
    ]);

    return programCount === 0 && evidenceCount === 0;
};

// Method: sao chép dữ liệu từ năm học khác
academicYearSchema.methods.copyDataFrom = async function(sourceYearId, settings = {}, userId) {
    const Program = require('../Evidence/Program');
    const Organization = require('../Evidence/Organization');
    const Standard = require('../Evidence/Standard');
    const Criteria = require('../Evidence/Criteria');
    const Evidence = require('../Evidence/Evidence');

    const copySettings = { ...this.copySettings, ...settings };
    const results = {
        programs: 0,
        organizations: 0,
        standards: 0,
        criteria: 0,
        evidences: 0,
        errors: []
    };

    try {
        if (copySettings.programs) {
            const programs = await Program.find({ academicYearId: sourceYearId });
            for (const program of programs) {
                const newProgram = new Program({
                    ...program.toObject(),
                    _id: undefined,
                    academicYearId: this._id,
                    status: 'draft',
                    createdBy: userId,
                    updatedBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newProgram.save();
                results.programs++;
            }
        }

        if (copySettings.organizations) {
            const organizations = await Organization.find({ academicYearId: sourceYearId });
            for (const org of organizations) {
                const newOrg = new Organization({
                    ...org.toObject(),
                    _id: undefined,
                    academicYearId: this._id,
                    createdBy: userId,
                    updatedBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newOrg.save();
                results.organizations++;
            }
        }

        if (copySettings.standards) {
            const standards = await Standard.find({ academicYearId: sourceYearId });
            for (const standard of standards) {
                const newStandard = new Standard({
                    ...standard.toObject(),
                    _id: undefined,
                    academicYearId: this._id,
                    status: 'draft',
                    createdBy: userId,
                    updatedBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newStandard.save();
                results.standards++;
            }
        }

        if (copySettings.criteria) {
            const criterias = await Criteria.find({ academicYearId: sourceYearId });
            for (const criteria of criterias) {
                const newCriteria = new Criteria({
                    ...criteria.toObject(),
                    _id: undefined,
                    academicYearId: this._id,
                    status: 'draft',
                    createdBy: userId,
                    updatedBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newCriteria.save();
                results.criteria++;
            }
        }

        if (copySettings.evidenceTemplates) {
            const evidences = await Evidence.find({
                academicYearId: sourceYearId,
                status: 'active'
            });

            for (const evidence of evidences) {
                const newEvidence = new Evidence({
                    ...evidence.toObject(),
                    _id: undefined,
                    academicYearId: this._id,
                    files: [],
                    status: 'draft',
                    createdBy: userId,
                    updatedBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newEvidence.save();
                results.evidences++;
            }
        }

        await this.addActivityLog('academic_year_copy', userId, {
            severity: 'high',
            isAuditRequired: true,
            metadata: { sourceYearId, results }
        });

        return results;

    } catch (error) {
        results.errors.push(error.message);

        await this.addActivityLog('academic_year_copy', userId, {
            severity: 'critical',
            result: 'failure',
            isAuditRequired: true,
            error: { message: error.message }
        });

        return results;
    }
};

// Static method: lấy năm học hiện tại
academicYearSchema.statics.getCurrentYear = function() {
    return this.findOne({ isCurrent: true });
};

// Static method: lấy năm học đang chạy
academicYearSchema.statics.getActiveYear = function() {
    const now = new Date();
    return this.findOne({
        startDate: { $lte: now },
        endDate: { $gte: now },
        status: 'active'
    });
};

// Static method: tạo năm học mới
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

// Post-save: ghi log tạo mới
academicYearSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            await this.addActivityLog('academic_year_create', this.createdBy, {
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
academicYearSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.updatedBy) {
        try {
            await doc.addActivityLog('academic_year_delete', doc.updatedBy, {
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
academicYearSchema.set('toJSON', { virtuals: true });
academicYearSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);