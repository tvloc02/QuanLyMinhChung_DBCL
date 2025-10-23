const mongoose = require('mongoose');
const path = require('path');

const fileSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: [true, 'Tên file gốc là bắt buộc'],
        trim: true
    },

    storedName: {
        type: String,
        required: [true, 'Tên file lưu trữ là bắt buộc']
    },

    filePath: {
        type: String,
        required: [true, 'Đường dẫn file là bắt buộc']
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
        required: false,
        lowercase: true,
        default: ''
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

    url: String,
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

    status: {
        type: String,
        enum: ['active', 'deleted', 'processing', 'failed'],
        default: 'active'
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

    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    approvalDate: {
        type: Date
    },

    rejectionReason: {
        type: String,
        trim: true
    },

    isSubmitted: {
        type: Boolean,
        default: false
    },

    submittedAt: {
        type: Date
    },

    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

fileSchema.index({ evidenceId: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ originalName: 'text', extractedContent: 'text' });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ status: 1 });
fileSchema.index({ type: 1 });
fileSchema.index({ approvalStatus: 1 });
fileSchema.index({ isSubmitted: 1 });
fileSchema.index({ evidenceId: 1, uploadedBy: 1 });

fileSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

fileSchema.pre('validate', function(next) {
    if (this.type === 'folder') {
        this.extension = '';
    }

    const fullPath = `${this.filePath}/${this.storedName}`;
    if (fullPath.length > 255) {
        return next(new Error('Đường dẫn đầy đủ (path + name) không được quá 255 ký tự'));
    }
    next();
});

fileSchema.virtual('fullName').get(function() {
    return this.storedName || this.originalName;
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

fileSchema.statics.sanitizeFileName = function(evidenceCode, evidenceName, originalName) {
    const ext = path.extname(originalName);

    const cleanName = evidenceName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');

    let fileName = `${evidenceCode}-${cleanName}${ext}`;

    fileName = fileName
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const maxNameLength = 200;
    if (fileName.length > maxNameLength) {
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxNameLength - ext.length);
        fileName = truncatedName + ext;
    }

    return fileName;
};

fileSchema.statics.generateStoredName = function(evidenceCode, evidenceName, originalName) {
    return this.sanitizeFileName(evidenceCode, evidenceName, originalName);
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

fileSchema.post('findOneAndUpdate', async function(result, next) {
    if (result && result.uploadedBy) {
        try {
            let action = 'file_update';
            let description = `Cập nhật file: ${result.originalName}`;

            if (result.isSubmitted) {
                action = 'file_submit';
                description = `Nộp file: ${result.originalName}`;
            }

            await result.addActivityLog(action, result.uploadedBy, description, {
                severity: 'low',
                result: 'success'
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

fileSchema.post('findOneAndDelete', async function(doc, next) {
    if (doc && doc.uploadedBy) {
        try {
            await doc.addActivityLog('file_delete', doc.uploadedBy,
                `Xóa file: ${doc.originalName}`, {
                    severity: 'medium',
                    result: 'success',
                    isAuditRequired: true
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('File', fileSchema);