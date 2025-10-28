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

    // Vai trò chính của người dùng (một hoặc nhiều)
    // admin: Quản trị toàn bộ hệ thống
    // manager: Quản lý báo cáo tự đánh giá
    // reporter: Báo cáo viên - nhập minh chứng, viết báo cáo
    // evaluator: Chuyên gia đánh giá
    roles: [{
        type: String,
        enum: ['admin', 'manager', 'reporter', 'evaluator']
    }],

    role: {
        type: String,
        enum: ['admin', 'manager', 'reporter', 'evaluator'],
        default: 'reporter'
    },

    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'active'
    },

    departmentName: {
        type: String,
        maxlength: [100, 'Tên phòng/ban không được quá 100 ký tự'],
        trim: true
    },

    position: {
        type: String,
        maxlength: [100, 'Chức vụ không được quá 100 ký tự'],
        trim: true
    },

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
        totalAssignments: { type: Number, default: 0 },
        completedAssignments: { type: Number, default: 0 }
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.index({ email: 1 });
userSchema.index({ roles: 1, status: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ status: 1 });

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
            this.roles = ['reporter'];
            this.role = 'reporter';
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
        this.role = 'reporter';
        this.roles = ['reporter'];
    }
};

userSchema.methods.hasAccessToAcademicYear = function(academicYearId) {
    if (this.hasRole('admin')) return true;
    return this.academicYearAccess.some(id => id.toString() === academicYearId.toString());
};

userSchema.methods.hasAccessToProgram = function(programId) {
    if (this.hasRole('admin')) return true;
    if (this.programAccess.length === 0) return true; // Nếu không có hạn chế
    return this.programAccess.some(id => id.toString() === programId.toString());
};

userSchema.methods.hasAccessToOrganization = function(organizationId) {
    if (this.hasRole('admin')) return true;
    if (this.organizationAccess.length === 0) return true;
    return this.organizationAccess.some(id => id.toString() === organizationId.toString());
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

userSchema.statics.generateDefaultPassword = function(email) {
    const username = email.split('@')[0];
    const firstChar = username.charAt(0).toUpperCase();
    const restChars = username.slice(1).toLowerCase();
    return `${firstChar}${restChars}@123`;
};

userSchema.post('save', async function(doc, next) {
    if (this.isNew && this.createdBy) {
        try {
            const ActivityLog = require('../system/ActivityLog');
            await ActivityLog.log({
                userId: this.createdBy,
                action: 'user_create',
                description: `Tạo mới người dùng: ${this.fullName} (${this.email})`,
                targetType: 'User',
                targetId: this._id,
                targetName: this.fullName,
                severity: 'medium',
                result: 'success'
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
    next();
});

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