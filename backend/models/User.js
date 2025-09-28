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
                    /^[a-zA-Z0-9]+$/.test(email); // Allow username only
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

    // Sửa lại role theo tài liệu: 4 vai trò chính
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

    // Quyền truy cập theo năm học
    academicYearAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear'
    }],

    // Quyền truy cập theo chương trình
    programAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program'
    }],

    // Quyền truy cập theo tổ chức
    organizationAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    }],

    // Quyền truy cập theo tiêu chuẩn
    standardAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Standard'
    }],

    // Quyền truy cập theo tiêu chí
    criteriaAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Criteria'
    }],

    // Thông tin bổ sung
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

    // Cấu hình thông báo
    notificationSettings: {
        email: {
            type: Boolean,
            default: true
        },
        inApp: {
            type: Boolean,
            default: true
        },
        assignment: {
            type: Boolean,
            default: true
        },
        evaluation: {
            type: Boolean,
            default: true
        },
        deadline: {
            type: Boolean,
            default: true
        }
    },

    // Thông tin đăng nhập
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,

    // Reset password
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo
    mustChangePassword: {
        type: Boolean,
        default: false
    },

    // Metadata
    metadata: {
        totalReports: {
            type: Number,
            default: 0
        },
        totalEvaluations: {
            type: Number,
            default: 0
        },
        averageEvaluationScore: {
            type: Number,
            default: 0
        },
        totalAssignments: {
            type: Number,
            default: 0
        }
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ fullName: 'text' });
userSchema.index({ department: 1 });
userSchema.index({ status: 1 });

// Virtual để kiểm tra bị khóa
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
        const salt = await bcrypt.genSalt(12); // Tăng salt rounds cho bảo mật
        this.password = await bcrypt.hash(this.password, salt);

        // Reset failed login attempts khi đổi mật khẩu
        this.failedLoginAttempts = 0;
        this.lockUntil = undefined;

        next();
    } catch (error) {
        next(error);
    }
});

userSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        if (!this.password) return false;
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (err) {
        return false;
    }
};

userSchema.methods.getFullEmail = function(domain = 'cmc.edu.vn') {
    if (this.email.includes('@')) {
        return this.email;
    }
    return `${this.email}@${domain}`;
};

userSchema.methods.recordLogin = function() {
    this.lastLogin = new Date();
    this.loginCount += 1;
    this.failedLoginAttempts = 0;
    this.lockUntil = undefined;
    return this.save();
};

userSchema.methods.incFailedLoginAttempts = function() {
    // Nếu có thời gian khóa và đã hết thì reset
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { failedLoginAttempts: 1 }
        });
    }

    const updates = { $inc: { failedLoginAttempts: 1 } };

    // Khóa tài khoản sau 5 lần thử sai
    if (this.failedLoginAttempts + 1 >= 10 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 300 }; // Khóa 5 phút
    }

    return this.updateOne(updates);
};

userSchema.methods.hasAccess = function(resource, resourceId) {
    if (this.role === 'admin') return true;

    const accessField = `${resource}Access`;
    if (!this[accessField]) return false;

    return this[accessField].some(id => id.toString() === resourceId.toString());
};

userSchema.methods.hasAcademicYearAccess = function(academicYearId) {
    if (this.role === 'admin') return true;
    if (!this.academicYearAccess || this.academicYearAccess.length === 0) return true; // Nếu không giới hạn thì cho phép tất cả
    return this.academicYearAccess.some(id => id.toString() === academicYearId.toString());
};

userSchema.methods.hasProgramAccess = function(programId) {
    if (this.role === 'admin') return true;
    if (!this.programAccess || this.programAccess.length === 0) return true;
    return this.programAccess.some(id => id.toString() === programId.toString());
};

userSchema.methods.hasOrganizationAccess = function(organizationId) {
    if (this.role === 'admin') return true;
    if (!this.organizationAccess || this.organizationAccess.length === 0) return true;
    return this.organizationAccess.some(id => id.toString() === organizationId.toString());
};

userSchema.methods.hasStandardAccess = function(standardId) {
    if (this.role === 'admin') return true;
    if (!this.standardAccess || this.standardAccess.length === 0) return true;
    return this.standardAccess.some(id => id.toString() === standardId.toString());
};

userSchema.methods.hasCriteriaAccess = function(criteriaId) {
    if (this.role === 'admin') return true;
    if (!this.criteriaAccess || this.criteriaAccess.length === 0) return true;
    return this.criteriaAccess.some(id => id.toString() === criteriaId.toString());
};

userSchema.methods.canCreateReport = function() {
    return ['admin', 'manager'].includes(this.role);
};

userSchema.methods.canEvaluate = function() {
    return ['admin', 'expert'].includes(this.role);
};

userSchema.methods.canAdvise = function() {
    return ['admin', 'advisor'].includes(this.role);
};

userSchema.methods.getRoleText = function() {
    const roleMap = {
        'admin': 'Quản trị viên',
        'manager': 'Cán bộ quản lý báo cáo TĐG',
        'expert': 'Chuyên gia đánh giá',
        'advisor': 'Tư vấn/Giám sát'
    };
    return roleMap[this.role] || this.role;
};

// Static methods
userSchema.statics.generateDefaultPassword = function(email) {
    const username = email.split('@')[0];
    const firstChar = username.charAt(0).toUpperCase();
    const restChars = username.slice(1).toLowerCase();
    return `${firstChar}${restChars}@123`;
};

userSchema.statics.findByEmail = function(emailInput) {
    const username = emailInput.split('@')[0].toLowerCase();
    return this.findOne({
        $or: [
            { email: emailInput.toLowerCase() },
            { email: username }
        ]
    });
};

userSchema.statics.createUser = async function(userData, createdById) {
    // Auto-generate password if not provided
    if (!userData.password) {
        userData.password = this.generateDefaultPassword(userData.email);
        userData.mustChangePassword = true;
    }

    const user = new this({
        ...userData,
        createdBy: createdById,
        updatedBy: createdById
    });

    return user.save();
};

userSchema.statics.getUserStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
            }
        }
    ]);

    return stats.reduce((acc, item) => {
        acc[item._id] = {
            total: item.count,
            active: item.active,
            inactive: item.inactive
        };
        return acc;
    }, {});
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