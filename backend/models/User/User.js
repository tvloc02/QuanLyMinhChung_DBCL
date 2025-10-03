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

    // GIỮ LẠI role cũ để tương thích ngược
    role: {
        type: String,
        enum: ['admin', 'manager', 'expert', 'advisor'],
        default: 'expert',
        required: [true, 'Vai trò là bắt buộc']
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'active'
    },

    // ============ HỆ THỐNG NHÓM MỚI ============
    // Danh sách nhóm người dùng thuộc về
    userGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserGroup'
    }],

    // Quyền riêng cá nhân (ngoài quyền từ nhóm)
    individualPermissions: [{
        permission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Permission'
        },
        // granted: cấp quyền, denied: từ chối quyền
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
    // ==========================================

    // Quyền truy cập theo resource (GIỮ LẠI để tương thích)
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

    department: {
        type: String,
        maxlength: [100, 'Phòng ban không được quá 100 ký tự']
    },

    position: {
        type: String,
        maxlength: [100, 'Chức vụ không được quá 100 ký tự']
    },

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
userSchema.index({ role: 1, status: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ userGroups: 1 });
userSchema.index({ status: 1 });

userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
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

// ============ METHODS MỚI CHO HỆ THỐNG PHÂN QUYỀN ============

// Lấy tất cả quyền của user (từ nhóm + quyền cá nhân)
userSchema.methods.getAllPermissions = async function() {
    const UserGroup = mongoose.model('UserGroup');
    const Permission = mongoose.model('Permission');

    // Populate user groups với permissions
    await this.populate({
        path: 'userGroups',
        match: { status: 'active' },
        populate: {
            path: 'permissions',
            match: { status: 'active' }
        }
    });

    // Tập hợp tất cả permissions từ các nhóm
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

    // Xử lý quyền cá nhân
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
                    // Quyền bị denied sẽ ghi đè quyền từ nhóm
                    groupPermissions.delete(item.permission.code);
                }
            }
        }
    }

    return Array.from(groupPermissions.values());
};

// Kiểm tra user có quyền cụ thể không
userSchema.methods.hasPermission = async function(permissionCode) {
    const permissions = await this.getAllPermissions();
    return permissions.some(p => p.code === permissionCode.toUpperCase());
};

// Kiểm tra user có quyền trên module
userSchema.methods.hasModulePermission = async function(module, action = null) {
    const permissions = await this.getAllPermissions();

    if (action) {
        const code = `${module}.${action}`.toUpperCase();
        return permissions.some(p => p.code === code);
    }

    // Kiểm tra có bất kỳ quyền nào trong module
    return permissions.some(p => p.module === module);
};

// Kiểm tra user có nhiều quyền (AND logic)
userSchema.methods.hasAllPermissions = async function(permissionCodes) {
    const permissions = await this.getAllPermissions();
    const codes = permissions.map(p => p.code);

    return permissionCodes.every(code =>
        codes.includes(code.toUpperCase())
    );
};

// Kiểm tra user có ít nhất một trong các quyền (OR logic)
userSchema.methods.hasAnyPermission = async function(permissionCodes) {
    const permissions = await this.getAllPermissions();
    const codes = permissions.map(p => p.code);

    return permissionCodes.some(code =>
        codes.includes(code.toUpperCase())
    );
};

// Thêm user vào nhóm
userSchema.methods.addToGroup = async function(groupId) {
    if (!this.userGroups.includes(groupId)) {
        this.userGroups.push(groupId);
        await this.save();

        // Cập nhật danh sách members trong group
        const UserGroup = mongoose.model('UserGroup');
        await UserGroup.findByIdAndUpdate(groupId, {
            $addToSet: { members: this._id }
        });
    }
    return this;
};

// Xóa user khỏi nhóm
userSchema.methods.removeFromGroup = async function(groupId) {
    this.userGroups = this.userGroups.filter(id =>
        id.toString() !== groupId.toString()
    );
    await this.save();

    // Cập nhật danh sách members trong group
    const UserGroup = mongoose.model('UserGroup');
    await UserGroup.findByIdAndUpdate(groupId, {
        $pull: { members: this._id }
    });

    return this;
};

// Cấp quyền cá nhân
userSchema.methods.grantPermission = async function(permissionId, grantedBy) {
    // Xóa quyền cũ nếu có
    this.individualPermissions = this.individualPermissions.filter(
        ip => ip.permission.toString() !== permissionId.toString()
    );

    // Thêm quyền mới
    this.individualPermissions.push({
        permission: permissionId,
        type: 'granted',
        grantedBy,
        grantedAt: new Date()
    });

    await this.save();
    return this;
};

// Từ chối quyền (deny)
userSchema.methods.denyPermission = async function(permissionId, grantedBy) {
    // Xóa quyền cũ nếu có
    this.individualPermissions = this.individualPermissions.filter(
        ip => ip.permission.toString() !== permissionId.toString()
    );

    // Thêm deny
    this.individualPermissions.push({
        permission: permissionId,
        type: 'denied',
        grantedBy,
        grantedAt: new Date()
    });

    await this.save();
    return this;
};

// Xóa quyền cá nhân
userSchema.methods.removeIndividualPermission = async function(permissionId) {
    this.individualPermissions = this.individualPermissions.filter(
        ip => ip.permission.toString() !== permissionId.toString()
    );
    await this.save();
    return this;
};

// ============ GIỮ LẠI CÁC METHODS CŨ ============
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