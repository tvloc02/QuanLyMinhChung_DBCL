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

    roles: [{
        type: String,
        enum: ['admin', 'manager', 'tdg', 'expert']
    }],

    role: {
        type: String,
        enum: ['admin', 'manager', 'tdg', 'expert'],
        default: 'expert'
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'active'
    },

    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },

    departmentRole: {
        type: String,
        enum: ['manager', 'tdg', 'expert'],
        default: 'expert'
    },

    position: {
        type: String,
        maxlength: [100, 'Chức vụ không được quá 100 ký tự']
    },

    userGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserGroup'
    }],

    // ✨ THÊM: Hỗ trợ chọn NHIỀU quyền
    selectedPermissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
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

userSchema.index({ email: 1 });
userSchema.index({ roles: 1, status: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ userGroups: 1 });
userSchema.index({ status: 1 });
userSchema.index({ department: 1 });

userSchema.virtual('isLocked').get(function() {
    if (this.isLockedByAdmin) {
        return true;
    }
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('validate', function(next) {
    if (!this.roles || this.roles.length === 0) {
        if (this.role) {
            this.roles = [this.role];
        } else {
            this.roles = ['expert'];
            this.role = 'expert';
        }
    }

    if (this.roles && this.roles.length > 0 && !this.role) {
        this.role = this.roles[0];
    }

    next();
});

userSchema.pre('save', async function(next) {
    if (this.isModified('roles') && this.roles.length > 0) {
        this.role = this.roles[0];
    } else if (this.isModified('role') && this.role && this.roles.length === 0) {
        this.roles = [this.role];
    }

    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }

    if (!this.isModified('password')) {
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
        if (this.roles.length === 1) {
            this.role = role;
        }
    }
};

userSchema.methods.removeRole = function(role) {
    this.roles = this.roles.filter(r => r !== role);
    if (this.roles.length > 0) {
        this.role = this.roles[0];
    } else {
        this.role = 'expert';
        this.roles = ['expert'];
    }
};

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

    // ✨ THÊM: Lấy selectedPermissions (nhiều quyền)
    await this.populate({
        path: 'selectedPermissions',
        match: { status: 'active' }
    });

    if (this.selectedPermissions) {
        for (const perm of this.selectedPermissions) {
            if (perm && perm.code) {
                groupPermissions.set(perm.code, perm);
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
        updates.$set = { lockUntil: Date.now() + 300000 };
    }

    return this.updateOne(updates);
};

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