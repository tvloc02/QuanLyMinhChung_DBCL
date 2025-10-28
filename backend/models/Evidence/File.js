const mongoose = require('mongoose');
const path = require('path');

const fileSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: [true, 'Tên file gốc là bắt buộc'],
        trim: true,
        maxlength: [255, 'Tên file không được quá 255 ký tự']
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
        required: [true, 'Phần mở rộng file là bắt buộc'],
        lowercase: true
    },

    type: {
        type: String,
        enum: ['file'],
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


    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }],

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

    // Nội dung trích xuất (cho full-text search)
    extractedContent: {
        type: String,
        index: 'text',
        maxlength: [50000, 'Nội dung trích xuất không được quá 50000 ký tự']
    },

    status: {
        type: String,
        enum: ['active', 'deleted', 'processing', 'failed'],
        default: 'active'
    },

    // Quét virus
    virusScanResult: {
        scanned: { type: Boolean, default: false },
        clean: { type: Boolean, default: true },
        scanDate: Date,
        details: String
    },

    // Thống kê tải xuống
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

    // Thông tin phê duyệt file
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
        trim: true,
        maxlength: [500, 'Lý do từ chối không được quá 500 ký tự']
    }
});

// Indexes
fileSchema.index({ evidenceId: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ originalName: 'text', extractedContent: 'text' });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ status: 1 });
fileSchema.index({ type: 1 });
fileSchema.index({ approvalStatus: 1 });

// Pre-save: cập nhật updatedAt
fileSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Pre-validate: kiểm tra độ dài đường dẫn
fileSchema.pre('validate', function(next) {
    const fullPath = `${this.filePath}/${this.storedName}`;
    if (fullPath.length > 255) {
        return next(new Error('Đường dẫn đầy đủ (path + name) không được quá 255 ký tự'));
    }
    next();
});

// Virtual: tên đầy đủ
fileSchema.virtual('fullName').get(function() {
    return this.storedName || this.originalName;
});

// Virtual: kiểm tra có phải ảnh không
fileSchema.virtual('isImage').get(function() {
    return this.mimeType.startsWith('image/');
});

// Virtual: kiểm tra có phải PDF không
fileSchema.virtual('isPdf').get(function() {
    return this.mimeType === 'application/pdf';
});

// Virtual: kiểm tra có phải Office doc không
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

// Method: ghi log hoạt động
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

// Method: phê duyệt file
fileSchema.methods.approve = async function(userId, note = '') {
    this.approvalStatus = 'approved';
    this.approvedBy = userId;
    this.approvalDate = new Date();

    await this.save();

    await this.addActivityLog('file_approve', userId,
        `Phê duyệt file: ${this.originalName}`, {
            severity: 'medium',
            metadata: { note }
        });

    // Cập nhật trạng thái minh chứng
    const Evidence = require('./Evidence');
    const evidence = await Evidence.findById(this.evidenceId);
    if (evidence) {
        await evidence.updateStatus();
    }

    return this;
};

// Method: từ chối file
fileSchema.methods.reject = async function(userId, reason = '') {
    this.approvalStatus = 'rejected';
    this.rejectionReason = reason;
    this.approvalDate = new Date();

    await this.save();

    await this.addActivityLog('file_reject', userId,
        `Từ chối file: ${this.originalName}`, {
            severity: 'high',
            metadata: { reason }
        });

    // Cập nhật trạng thái minh chứng
    const Evidence = require('./Evidence');
    const evidence = await Evidence.findById(this.evidenceId);
    if (evidence) {
        await evidence.updateStatus();
    }

    return this;
};

// Method: tăng số lần tải xuống
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

// Method: định dạng kích thước file
fileSchema.methods.getFormattedSize = function() {
    const bytes = this.size;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Static method: vệ sinh tên file
fileSchema.statics.sanitizeFileName = function(evidenceCode, evidenceName, originalName) {
    const ext = path.extname(originalName);

    // Xóa dấu từ tên minh chứng
    const cleanName = evidenceName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');

    let fileName = `${evidenceCode}-${cleanName}${ext}`;

    // Xóa các ký tự không hợp lệ
    fileName = fileName
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Cắt tên file nếu quá dài
    const maxNameLength = 200;
    if (fileName.length > maxNameLength) {
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxNameLength - ext.length);
        fileName = truncatedName + ext;
    }

    return fileName;
};

// Static method: sinh tên file lưu trữ
fileSchema.statics.generateStoredName = function(evidenceCode, evidenceName, originalName) {
    return this.sanitizeFileName(evidenceCode, evidenceName, originalName);
};

// Post-save: ghi log tạo mới
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

// Post-update: ghi log cập nhật
fileSchema.post('findOneAndUpdate', async function(result, next) {
    if (result && result.uploadedBy) {
        try {
            await result.addActivityLog('file_update', result.uploadedBy,
                `Cập nhật file: ${result.originalName}`, {
                    severity: 'low',
                    result: 'success'
                });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

// Post-delete: ghi log xóa
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

// Virtuals và transform JSON
fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('File', fileSchema);