// backend/models/User/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(email) {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) ||
                    /^[a-zA-Z0-9]+$/.test(email);
            },
            message: 'Email không hợp lệ'
        }
    },

    fullName: {
        type: String,
        required: [true, 'Họ và tên là bắt buộc'],
        maxlength: [100, 'Họ và tên không được quá 100 ký tự'],
        trim: true,
        index: 'text'
    },

    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
    },

    phoneNumber: {
        type: String,
        validate: {
            validator: function(phone) {
                return !phone || /^[0-9]{10,11}$/.test(phone);
            },
            message: 'Số điện thoại không hợp lệ'
        }
    },

    // Nhiều vai trò
    roles: [{
        type: String,
        enum: ['admin', 'manager', 'expert', 'advisor'],
        required: true
    }],

    // Giữ lại để backward compatibility
    role: {
        type: String,
        enum: ['admin', 'manager', 'expert', 'advisor'],
        default: 'expert'
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'active'
    },

    // Phòng ban
    department: {
        type: String,
        maxlength: [100, 'Phòng ban không được quá 100 ký tự']
    },

    // Chức vụ
    position: {
        type: String,
        maxlength: [100, 'Chức vụ không được quá 100 ký tự']
    },

    // Hệ thống nhóm
    userGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserGroup'
    }],

    individualPermissions: [{
        permission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Permission'
        },
        type: {
            type: String,
            enum: ['granted', 'denied'],
            default: 'granted'
        },
        grantedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        grantedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Quyền truy cập
    academicYearAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    }],
    programAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program'
    }],
    organizationAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    }],
    standardAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Standard'
    }],
    criteriaAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria'
    }],

    expertise: [{
        type: String,
        maxlength: [100, 'Lĩnh vực chuyên môn không được quá 100 ký tự']
    }],

    notificationSettings: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
        assignment: { type: Boolean, default: true },
        evaluation: { type: Boolean, default: true },
        deadline: { type: Boolean, default: true }
    },

    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    // THÊM: Khóa tài khoản bởi Admin
    isLockedByAdmin: { type: Boolean, default: false },
    lockedByAdmin: {
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        lockedAt: Date,
        reason: String
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    mustChangePassword: { type: Boolean, default: false },

    metadata: {
        totalReports: { type: Number, default: 0 },
        totalEvaluations: { type: Number, default: 0 },
        averageEvaluationScore: { type: Number, default: 0 },
        totalAssignments: { type: Number, default: 0 }
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ roles: 1, status: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ userGroups: 1 });
userSchema.index({ status: 1 });

// Virtual: Kiểm tra tài khoản có bị khóa không
userSchema.virtual('isLocked').get(function() {
    // Khóa bởi admin
    if (this.isLockedByAdmin) {
        return true;
    }
    // Khóa tạm thời do đăng nhập sai nhiều lần
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
    // Sync roles và role
    if (this.isModified('roles') && this.roles.length > 0) {
        this.role = this.roles[0];
    }

    if (!this.isModified('password')) {
        if (this.isModified() && !this.isNew) {
            this.updatedAt = Date.now();
        }
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        this.failedLoginAttempts = 0;
        this.lockUntil = undefined;
        next();
    } catch (error) {
        next(error);
    }
});

// Methods cho roles
userSchema.methods.hasRole = function(role) {
    return this.roles.includes(role);
};

userSchema.methods.hasAnyRole = function(roles) {
    return roles.some(role => this.roles.includes(role));
};

userSchema.methods.hasAllRoles = function(roles) {
    return roles.every(role => this.roles.includes(role));
};

userSchema.methods.addRole = function(role) {
    if (!this.roles.includes(role)) {
        this.roles.push(role);
    }
};

userSchema.methods.removeRole = function(role) {
    this.roles = this.roles.filter(r => r !== role);
};

// Methods cho permissions
userSchema.methods.getAllPermissions = async function() {
    const UserGroup = mongoose.model('UserGroup');

    await this.populate({
        path: 'userGroups',
        match: { status: 'active' },
        populate: {
            path: 'permissions',
            match: { status: 'active' }
        }
    });

    const groupPermissions = new Map();
    if (this.userGroups) {
        for (const group of this.userGroups) {
            if (group.permissions) {
                for (const perm of group.permissions) {
                    if (perm && perm.code) {
                        groupPermissions.set(perm.code, perm);
                    }
                }
            }
        }
    }

    await this.populate({
        path: 'individualPermissions.permission',
        match: { status: 'active' }
    });

    if (this.individualPermissions) {
        for (const item of this.individualPermissions) {
            if (item.permission && item.permission.code) {
                if (item.type === 'granted') {
                    groupPermissions.set(item.permission.code, item.permission);
                } else if (item.type === 'denied') {
                    groupPermissions.delete(item.permission.code);
                }
            }
        }
    }

    return Array.from(groupPermissions.values());
};

userSchema.methods.hasPermission = async function(permissionCode) {
    const permissions = await this.getAllPermissions();
    return permissions.some(p => p.code === permissionCode.toUpperCase());
};

// Methods cho authentication
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        if (!this.password) return false;
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (err) {
        return false;
    }
};

userSchema.methods.recordLogin = function() {
    this.lastLogin = new Date();
    this.loginCount += 1;
    this.failedLoginAttempts = 0;
    this.lockUntil = undefined;
    return this.save();
};

userSchema.methods.incFailedLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { failedLoginAttempts: 1 }
        });
    }

    const updates = { $inc: { failedLoginAttempts: 1 } };

    if (this.failedLoginAttempts + 1 >= 10 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 300000 }; // 5 phút
    }

    return this.updateOne(updates);
};

// Static methods
userSchema.statics.generateDefaultPassword = function(email) {
    const username = email.split('@')[0];
    const firstChar = username.charAt(0).toUpperCase();
    const restChars = username.slice(1).toLowerCase();
    return `${firstChar}${restChars}@123`;
};

userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.password;
        delete ret.resetPasswordToken;
        return ret;
    }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);