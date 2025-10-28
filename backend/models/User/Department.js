const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên phòng ban là bắt buộc'],
        unique: true,
        maxlength: [100, 'Tên phòng ban không được quá 100 ký tự'],
        trim: true,
        index: 'text'
    },

    code: {
        type: String,
        required: [true, 'Mã phòng ban là bắt buộc'],
        unique: true,
        uppercase: true,
        maxlength: [20, 'Mã phòng ban không được quá 20 ký tự'],
        trim: true
    },

    description: {
        type: String,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },

    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['manager', 'tdg', 'expert'],
            default: 'expert'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

departmentSchema.index({ code: 1 });
departmentSchema.index({ status: 1 });
departmentSchema.index({ manager: 1 });

departmentSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('Department', departmentSchema);