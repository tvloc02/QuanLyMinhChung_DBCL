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
                // Format: 2024-2025, 2025-2026
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

    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
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

    // Cấu hình sao chép từ năm học khác
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

    // Thống kê
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

// Indexes
academicYearSchema.index({ code: 1 });
academicYearSchema.index({ startYear: 1, endYear: 1 });
academicYearSchema.index({ status: 1 });
academicYearSchema.index({ isCurrent: 1 });
academicYearSchema.index({ name: 'text', description: 'text' });

// Validation
academicYearSchema.pre('validate', function(next) {
    if (this.endYear <= this.startYear) {
        next(new Error('Năm kết thúc phải lớn hơn năm bắt đầu'));
    }

    if (this.endDate <= this.startDate) {
        next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
    }

    // Tự động tạo code nếu chưa có
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

// Ensure only one current academic year
academicYearSchema.pre('save', async function(next) {
    if (this.isCurrent && this.isModified('isCurrent')) {
        // Remove current flag from other years
        await this.constructor.updateMany(
            { _id: { $ne: this._id } },
            { isCurrent: false }
        );
    }
    next();
});

// Virtual fields
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

// Methods
academicYearSchema.methods.activate = async function() {
    // Deactivate all other academic years
    await this.constructor.updateMany(
        { _id: { $ne: this._id } },
        { isCurrent: false }
    );

    this.isCurrent = true;
    this.status = 'active';
    return this.save();
};

academicYearSchema.methods.canDelete = async function() {
    const Program = require('./Program');
    const Evidence = require('./Evidence');

    const [programCount, evidenceCount] = await Promise.all([
        Program.countDocuments({ academicYearId: this._id }),
        Evidence.countDocuments({ academicYearId: this._id })
    ]);

    return programCount === 0 && evidenceCount === 0;
};

academicYearSchema.methods.copyDataFrom = async function(sourceYearId, settings = {}) {
    const Program = require('./Program');
    const { Organization, Standard, Criteria } = require('./Program');
    const Evidence = require('./Evidence');

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
        // Copy Programs
        if (copySettings.programs) {
            const programs = await Program.find({ academicYearId: sourceYearId });
            for (const program of programs) {
                const newProgram = new Program({
                    ...program.toObject(),
                    _id: undefined,
                    academicYearId: this._id,
                    status: 'draft',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newProgram.save();
                results.programs++;
            }
        }

        // Copy Organizations
        if (copySettings.organizations) {
            const organizations = await Organization.find({ academicYearId: sourceYearId });
            for (const org of organizations) {
                const newOrg = new Organization({
                    ...org.toObject(),
                    _id: undefined,
                    academicYearId: this._id,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newOrg.save();
                results.organizations++;
            }
        }

        // Copy Standards
        if (copySettings.standards) {
            const standards = await Standard.find({ academicYearId: sourceYearId });
            for (const standard of standards) {
                const newStandard = new Standard({
                    ...standard.toObject(),
                    _id: undefined,
                    academicYearId: this._id,
                    status: 'draft',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newStandard.save();
                results.standards++;
            }
        }

        // Copy Criteria
        if (copySettings.criteria) {
            const criterias = await Criteria.find({ academicYearId: sourceYearId });
            for (const criteria of criterias) {
                const newCriteria = new Criteria({
                    ...criteria.toObject(),
                    _id: undefined,
                    academicYearId: this._id,
                    status: 'draft',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newCriteria.save();
                results.criteria++;
            }
        }

        // Copy Evidence Templates (without files)
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
                    files: [], // Don't copy files
                    status: 'draft',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await newEvidence.save();
                results.evidences++;
            }
        }

        return results;

    } catch (error) {
        results.errors.push(error.message);
        return results;
    }
};

// Static methods
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
    // Auto-generate code if not provided
    if (!yearData.code && yearData.startYear && yearData.endYear) {
        yearData.code = `${yearData.startYear}-${yearData.endYear}`;
    }

    // Auto-generate name if not provided
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

academicYearSchema.set('toJSON', { virtuals: true });
academicYearSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);