const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    code: {
        type: String,
        required: [true, 'Mã minh chứng là bắt buộc'],
        uppercase: true,
        validate: {
            validator: function(code) {
                return /^[A-Y]\d+\.\d{2}\.\d{2}\.\d{2}$/.test(code);
            },
            message: 'Mã minh chứng không đúng yêu cầu (ký tự đầu tiên phải là A-Y, VD: A1.01.02.04)'
        }
    },

    name: {
        type: String,
        required: [true, 'Tên minh chứng là bắt buộc'],
        trim: true,
        maxlength: [500, 'Tên minh chứng không được quá 500 ký tự']
    },

    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Mô tả không được quá 2000 ký tự']
    },

    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: [true, 'Chương trình đánh giá là bắt buộc']
    },

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Tổ chức - Cấp đánh giá là bắt buộc']
    },

    standardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Standard',
        required: [true, 'Tiêu chuẩn là bắt buộc']
    },

    criteriaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria',
        required: [true, 'Tiêu chí là bắt buộc']
    },

    documentNumber: {
        type: String,
        trim: true,
        maxlength: [100, 'Số tài liệu không được quá 100 ký tự']
    },

    issueDate: {
        type: Date
    },

    effectiveDate: {
        type: Date
    },

    issuingAgency: {
        type: String,
        trim: true,
        maxlength: [300, 'Cơ quan ban hành không được quá 300 ký tự']
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    files: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }],

    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
    },

    tags: [String],

    // Trạng thái minh chứng
    // new: mới tạo
    // in_progress: đang nhập dữ liệu
    // completed: đã hoàn thành
    // approved: đã được duyệt
    // rejected: bị từ chối
    status: {
        type: String,
        enum: ['new', 'in_progress', 'completed', 'approved', 'rejected'],
        default: 'new'
    },

    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Lý do từ chối không được quá 500 ký tự']
    },

    downloadStats: {
        totalDownloads: { type: Number, default: 0 },
        lastDownloadedAt: Date,
        lastDownloadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },

    changeHistory: [{
        action: {
            type: String,
            enum: ['created', 'updated', 'deleted', 'moved', 'copied', 'approved', 'rejected']
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        changes: mongoose.Schema.Types.Mixed,
        description: String
    }],

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

evidenceSchema.index({ academicYearId: 1, code: 1 }, { unique: true });
evidenceSchema.index({ academicYearId: 1, programId: 1, organizationId: 1 });
evidenceSchema.index({ academicYearId: 1, standardId: 1 });
evidenceSchema.index({ academicYearId: 1, criteriaId: 1 });
evidenceSchema.index({ academicYearId: 1, name: 'text' });
evidenceSchema.index({ academicYearId: 1, createdAt: -1 });
evidenceSchema.index({ status: 1 });
evidenceSchema.index({ createdBy: 1 });

evidenceSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

evidenceSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.changeHistory.push({
            action: 'updated',
            changedBy: this.updatedBy,
            changes: this.modifiedPaths()
        });
    }
    next();
});

evidenceSchema.virtual('parsedCode').get(function() {
    const parts = this.code.split('.');
    return {
        boxNumber: parseInt(parts[0].substring(1)),
        standardCode: parts[1],
        criteriaCode: parts[2],
        sequenceNumber: parts[3],
        prefix: parts[0]
    };
});

evidenceSchema.virtual('fileName').get(function() {
    return `${this.code}-${this.name}`;
});

evidenceSchema.methods.updateStatus = async function() {
    const File = require('./File');
    const files = await File.find({ evidenceId: this._id });

    if (files.length === 0) {
        this.status = this.status === 'new' ? 'new' : 'in_progress';
    } else {
        const rejectedFiles = files.filter(f => f.approvalStatus === 'rejected');
        const approvedFiles = files.filter(f => f.approvalStatus === 'approved');

        if (rejectedFiles.length > 0) {
            this.status = 'rejected';
        } else if (approvedFiles.length === files.length) {
            this.status = 'approved';
        } else {
            this.status = 'completed';
        }
    }

    await this.save();
    return this.status;
};

evidenceSchema.methods.addActivityLog = async function(action, userId, description, additionalData = {}) {
    const ActivityLog = require('../system/ActivityLog');
    return ActivityLog.log({
        userId,
        academicYearId: this.academicYearId,
        action,
        description,
        targetType: 'Evidence',
        targetId: this._id,
        targetName: `${this.code} - ${this.name}`,
        ...additionalData
    });
};

evidenceSchema.methods.incrementDownload = async function(userId) {
    this.downloadStats.totalDownloads += 1;
    this.downloadStats.lastDownloadedAt = new Date();
    this.downloadStats.lastDownloadedBy = userId;

    await this.save();

    await this.addActivityLog('evidence_download', userId,
        `Tải xuống minh chứng ${this.code}`, {
            severity: 'low',
            metadata: { totalDownloads: this.downloadStats.totalDownloads }
        });

    return this;
};

evidenceSchema.methods.approve = async function(userId, note = '') {
    const oldStatus = this.status;
    this.status = 'approved';
    this.updatedBy = userId;

    this.changeHistory.push({
        action: 'approved',
        changedBy: userId,
        description: note || 'Duyệt minh chứng',
        changes: { oldStatus, newStatus: 'approved' }
    });

    await this.save();

    await this.addActivityLog('evidence_approve', userId,
        `Duyệt minh chứng: ${this.code}`, {
            severity: 'medium',
            metadata: { note }
        });

    return this;
};

evidenceSchema.methods.reject = async function(userId, reason = '') {
    const oldStatus = this.status;
    this.status = 'rejected';
    this.rejectionReason = reason;
    this.updatedBy = userId;

    this.changeHistory.push({
        action: 'rejected',
        changedBy: userId,
        description: reason || 'Từ chối minh chứng',
        changes: { oldStatus, newStatus: 'rejected', reason }
    });

    await this.save();

    await this.addActivityLog('evidence_reject', userId,
        `Từ chối minh chứng: ${this.code}`, {
            severity: 'high',
            metadata: { reason }
        });

    return this;
};

evidenceSchema.statics.generateCode = async function(academicYearId, standardCode, criteriaCode, boxNumber = 1) {
    try {
        const formattedStandardCode = String(standardCode).padStart(2, '0');
        const formattedCriteriaCode = String(criteriaCode).padStart(2, '0');

        const codePrefix = `H${boxNumber}.${formattedStandardCode}.${formattedCriteriaCode}`;

        const existingEvidences = await this.find({
            academicYearId,
            code: new RegExp(`^${codePrefix}\\.\\d{2}$`)
        }).sort({ code: -1 }).limit(1).lean();

        let nextNumber = 1;

        if (existingEvidences.length > 0) {
            const lastCode = existingEvidences[0].code;
            const parts = lastCode.split('.');
            const lastNumber = parseInt(parts[3], 10);

            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }

        const newCode = `${codePrefix}.${nextNumber.toString().padStart(2, '0')}`;

        return newCode;
    } catch (error) {
        throw new Error('Lỗi khi tạo mã minh chứng');
    }
};

evidenceSchema.statics.isValidCodeFormat = function(code) {
    return /^[A-Y]\d+\.\d{2}\.\d{2}\.\d{2}$/.test(code);
};

evidenceSchema.statics.parseCode = function(code) {
    if (!this.isValidCodeFormat(code)) {
        return null;
    }

    const parts = code.split('.');
    return {
        boxNumber: parseInt(parts[0].substring(1)),
        standardCode: parts[1],
        criteriaCode: parts[2],
        sequenceNumber: parts[3]
    };
};

evidenceSchema.statics.advancedSearch = function(searchParams) {
    const {
        keyword,
        academicYearId,
        programId,
        organizationId,
        standardId,
        criteriaId,
        dateFrom,
        dateTo,
        status,
        createdBy
    } = searchParams;

    let query = {};

    if (academicYearId) {
        query.academicYearId = academicYearId;
    }

    if (keyword) {
        query.$or = [
            { name: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { documentNumber: { $regex: keyword, $options: 'i' } },
            { code: { $regex: keyword, $options: 'i' } }
        ];
    }

    if (programId) query.programId = programId;
    if (organizationId) query.organizationId = organizationId;
    if (standardId) query.standardId = standardId;
    if (criteriaId) query.criteriaId = criteriaId;
    if (status) query.status = status;
    if (createdBy) query.createdBy = createdBy;

    if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    return this.find(query);
};

evidenceSchema.statics.getTreeByAcademicYear = async function(academicYearId, programId, organizationId) {
    const evidences = await this.find({
        academicYearId,
        programId,
        organizationId,
    })
        .populate('standardId', 'name code')
        .populate('criteriaId', 'name code')
        .sort({ 'standardId.code': 1, 'criteriaId.code': 1, code: 1 });

    const tree = {};
    evidences.forEach(evidence => {
        const standardKey = `${evidence.standardId.code} - ${evidence.standardId.name}`;
        const criteriaKey = `${evidence.criteriaId.code} - ${evidence.criteriaId.name}`;

        if (!tree[standardKey]) {
            tree[standardKey] = {
                standard: evidence.standardId,
                criteria: {}
            };
        }

        if (!tree[standardKey].criteria[criteriaKey]) {
            tree[standardKey].criteria[criteriaKey] = {
                criteria: evidence.criteriaId,
                evidences: []
            };
        }

        tree[standardKey].criteria[criteriaKey].evidences.push({
            _id: evidence._id,
            code: evidence.code,
            name: evidence.name,
            fileCount: evidence.files.length,
            status: evidence.status
        });
    });

    return tree;
};

evidenceSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            await this.addActivityLog('evidence_create', this.createdBy,
                `Tạo mới minh chứng: ${this.code} - ${this.name}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

evidenceSchema.post('findOneAndUpdate', async function(result, next) {
    if (result && result.updatedBy) {
        try {
            await result.addActivityLog('evidence_update', result.updatedBy,
                `Cập nhật minh chứng: ${result.code} - ${result.name}`, {
                    severity: 'medium',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

evidenceSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.updatedBy) {
        try {
            await doc.addActivityLog('evidence_delete', doc.updatedBy,
                `Xóa minh chứng: ${doc.code} - ${doc.name}`, {
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

evidenceSchema.set('toJSON', { virtuals: true });
evidenceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Evidence', evidenceSchema);