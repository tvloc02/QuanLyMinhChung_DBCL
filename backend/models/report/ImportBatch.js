const mongoose = require('mongoose');

const importBatchSchema = new mongoose.Schema({
    academicYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: [true, 'Năm học là bắt buộc']
    },

    batchId: {
        type: String,
        required: [true, 'Batch ID là bắt buộc'],
        unique: true,
        index: true
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

    templateFile: {
        originalName: String,
        storedPath: String,
        uploadedAt: Date
    },

    statistics: {
        totalRows: { type: Number, default: 0 },
        successCount: { type: Number, default: 0 },
        failedCount: { type: Number, default: 0 },
        skippedCount: { type: Number, default: 0 }
    },

    importedEvidences: [{
        evidenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' },
        code: String,
        name: String,
        status: {
            type: String,
            enum: ['success', 'failed', 'skipped'],
            required: true
        },
        error: String
    }],

    errors: [{
        row: Number,
        code: String,
        field: String,
        message: String,
        data: mongoose.Schema.Types.Mixed
    }],

    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },

    importedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người import là bắt buộc']
    },

    startedAt: Date,
    completedAt: Date,

    metadata: {
        processingTime: Number,
        serverInfo: String,
        clientInfo: String
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

importBatchSchema.index({ academicYearId: 1, status: 1 });
importBatchSchema.index({ importedBy: 1, createdAt: -1 });
importBatchSchema.index({ programId: 1, organizationId: 1 });
importBatchSchema.index({ createdAt: -1 });

importBatchSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }

    if (this.isModified('status')) {
        const now = new Date();
        if (this.status === 'processing' && !this.startedAt) {
            this.startedAt = now;
        }
        if (['completed', 'failed', 'cancelled'].includes(this.status) && !this.completedAt) {
            this.completedAt = now;
            if (this.startedAt) {
                this.metadata.processingTime = Math.round((now - this.startedAt) / 1000);
            }
        }
    }

    next();
});

importBatchSchema.virtual('duration').get(function() {
    if (!this.startedAt || !this.completedAt) return null;
    return Math.round((this.completedAt - this.startedAt) / 1000);
});

importBatchSchema.virtual('successRate').get(function() {
    if (this.statistics.totalRows === 0) return 0;
    return Math.round((this.statistics.successCount / this.statistics.totalRows) * 100);
});

importBatchSchema.virtual('isComplete').get(function() {
    return ['completed', 'failed', 'cancelled'].includes(this.status);
});

importBatchSchema.statics.generateBatchId = function() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `BATCH-${timestamp}-${random}`.toUpperCase();
};

importBatchSchema.methods.addEvidence = function(evidenceId, code, name, status, error = null) {
    this.importedEvidences.push({
        evidenceId,
        code,
        name,
        status,
        error
    });

    if (status === 'success') {
        this.statistics.successCount += 1;
    } else if (status === 'failed') {
        this.statistics.failedCount += 1;
    } else if (status === 'skipped') {
        this.statistics.skippedCount += 1;
    }
};

importBatchSchema.methods.addError = function(row, code, field, message, data = null) {
    this.errors.push({
        row,
        code,
        field,
        message,
        data
    });
};

importBatchSchema.methods.markAsProcessing = async function() {
    this.status = 'processing';
    this.startedAt = new Date();
    return this.save();
};

importBatchSchema.methods.markAsCompleted = async function() {
    this.status = 'completed';
    this.completedAt = new Date();
    return this.save();
};

importBatchSchema.methods.markAsFailed = async function(reason = 'Unknown error') {
    this.status = 'failed';
    this.completedAt = new Date();
    this.addError(0, 'BATCH_FAILED', 'general', reason);
    return this.save();
};

importBatchSchema.methods.cancel = async function(userId, reason = '') {
    this.status = 'cancelled';
    this.completedAt = new Date();
    this.addError(0, 'BATCH_CANCELLED', 'general', reason || 'Cancelled by user');

    const ActivityLog = require('../system/ActivityLog');
    await ActivityLog.log({
        userId,
        academicYearId: this.academicYearId,
        action: 'bulk_import',
        description: `Hủy batch import: ${this.batchId}`,
        targetType: 'ImportBatch',
        targetId: this._id,
        targetName: this.batchId,
        severity: 'medium',
        result: 'warning',
        metadata: { reason }
    });

    return this.save();
};

importBatchSchema.statics.getStats = async function(academicYearId, userId = null) {
    const matchStage = { academicYearId: mongoose.Types.ObjectId(academicYearId) };
    if (userId) {
        matchStage.importedBy = mongoose.Types.ObjectId(userId);
    }

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalBatches: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                totalRows: { $sum: '$statistics.totalRows' },
                totalSuccess: { $sum: '$statistics.successCount' },
                totalFailed: { $sum: '$statistics.failedCount' },
                totalSkipped: { $sum: '$statistics.skippedCount' }
            }
        }
    ]);

    return stats[0] || {
        totalBatches: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        totalRows: 0,
        totalSuccess: 0,
        totalFailed: 0,
        totalSkipped: 0
    };
};

importBatchSchema.statics.getUserBatches = async function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        status = null,
        academicYearId = null
    } = options;

    let query = { importedBy: userId };

    if (status) {
        query.status = status;
    }

    if (academicYearId) {
        query.academicYearId = academicYearId;
    }

    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
        this.find(query)
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        this.countDocuments(query)
    ]);

    return {
        batches,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
    };
};

importBatchSchema.statics.cleanupOldBatches = async function(daysToKeep = 90) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    return this.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: { $in: ['completed', 'failed', 'cancelled'] }
    });
};

importBatchSchema.set('toJSON', { virtuals: true });
importBatchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ImportBatch', importBatchSchema);