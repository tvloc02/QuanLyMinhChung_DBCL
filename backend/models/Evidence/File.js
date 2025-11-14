const mongoose = require('mongoose');
const path = require('path');

const fileSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: [true, 'Tên file gốc là bắt buộc'],
        trim: true
    },

    gridfsId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'ID GridFS là bắt buộc']
    },

    size: {
        type: Number,
        required: [true, 'Kích thước file là bắt buộc']
    },

    mimeType: {
        type: String,
        required: [true, 'Loại file là bắt buộc']
    },

    extension: {
        type: String,
        required: [true, 'Phần mở rộng file là bắt buộc'],
        lowercase: true
    },

    type: {
        type: String,
        enum: ['file', 'folder'],
        default: 'file'
    },

    evidenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence',
        required: [true, 'ID minh chứng là bắt buộc']
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người upload là bắt buộc']
    },

    publicId: String,

    parentFolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    },

    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }],

    folderMetadata: {
        fileCount: { type: Number, default: 0 },
        totalSize: { type: Number, default: 0 },
        lastModified: Date
    },

    metadata: {
        pageCount: Number,
        wordCount: Number,
        author: String,
        title: String,
        subject: String,
        dimensions: {
            width: Number,
            height: Number
        },
        hash: String
    },

    extractedContent: {
        type: String,
        index: 'text'
    },

    summary: {
        type: String,
        maxlength: 1000
    },

    vectorId: {
        type: String,
        index: true
    },

    processStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },

    virusScanResult: {
        scanned: { type: Boolean, default: false },
        clean: { type: Boolean, default: true },
        scanDate: Date,
        details: String
    },

    downloadCount: {
        type: Number,
        default: 0
    },

    lastDownloaded: Date,

    uploadedAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    },
});

fileSchema.index({ evidenceId: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ originalName: 'text', extractedContent: 'text' });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ type: 1 });
fileSchema.index({ vectorId: 1 });
fileSchema.index({ processStatus: 1 });

fileSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

fileSchema.pre('validate', function(next) {
    next();
});

fileSchema.virtual('isImage').get(function() {
    return this.mimeType.startsWith('image/');
});

fileSchema.virtual('isPdf').get(function() {
    return this.mimeType === 'application/pdf';
});

fileSchema.virtual('isOfficeDoc').get(function() {
    const officeMimes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    return officeMimes.includes(this.mimeType);
});

fileSchema.methods.addActivityLog = async function(action, userId, description, additionalData = {}) {
    const ActivityLog = require('../system/ActivityLog');
    return ActivityLog.log({
        userId,
        action,
        description,
        targetType: 'File',
        targetId: this._id,
        targetName: this.originalName,
        ...additionalData
    });
};

fileSchema.methods.incrementDownloadCount = async function() {
    this.downloadCount += 1;
    this.lastDownloaded = new Date();
    await this.save();
    await this.addActivityLog('file_download', this.uploadedBy,
        `Tải xuống file ${this.originalName}`, {
            severity: 'low',
            metadata: { downloadCount: this.downloadCount }
        });
    return this;
};

fileSchema.methods.getFormattedSize = function() {
    const bytes = this.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

fileSchema.post('save', async function(doc, next) {
    if (this.isNew && this.uploadedBy) {
        try {
            await this.addActivityLog('file_upload', this.uploadedBy,
                `Tải lên file: ${this.originalName}`, {
                    severity: 'low',
                    result: 'success',
                    metadata: {
                        fileSize: this.size,
                        mimeType: this.mimeType
                    }
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

// ĐÃ XÓA HOOK 'findOneAndDelete' GÂY LỖI Ở ĐÂY

fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

const File = mongoose.models.File || mongoose.model('File', fileSchema);

module.exports = File;