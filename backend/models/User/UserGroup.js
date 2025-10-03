const mongoose = require('mongoose');

const userGroupSchema = new mongoose.Schema({
    // Mã nhóm (VD: ADMIN_GROUP, EXPERT_GROUP)
    code: {
        type: String,
        required: [true, 'Mã nhóm là bắt buộc'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },

    // Tên nhóm
    name: {
        type: String,
        required: [true, 'Tên nhóm là bắt buộc'],
        maxlength: [200, 'Tên nhóm không được quá 200 ký tự'],
        trim: true
    },

    // Mô tả
    description: {
        type: String,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },

    // Danh sách quyền của nhóm
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],

    // Danh sách người dùng trong nhóm
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Trạng thái
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },

    // Loại nhóm
    type: {
        type: String,
        enum: ['system', 'custom'],
        default: 'custom',
        // system: nhóm hệ thống không thể xóa
        // custom: nhóm do người dùng tạo
    },

    // Quyền ưu tiên (cao hơn = ưu tiên hơn khi xử lý conflict)
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    // Metadata
    metadata: {
        color: {
            type: String,
            default: '#3B82F6' // Màu để hiển thị trên UI
        },
        icon: {
            type: String,
            default: 'users' // Icon để hiển thị
        },
        maxMembers: {
            type: Number,
            default: null // Giới hạn số thành viên (null = không giới hạn)
        },
        autoAssign: {
            type: Boolean,
            default: false // Tự động thêm user mới vào nhóm này
        }
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
userGroupSchema.index({ status: 1 });
userGroupSchema.index({ type: 1 });
userGroupSchema.index({ members: 1 });

// Virtual: Số lượng thành viên
userGroupSchema.virtual('memberCount').get(function() {
    return this.members?.length || 0;
});

// Virtual: Số lượng quyền
userGroupSchema.virtual('permissionCount').get(function() {
    return this.permissions?.length || 0;
});

// Instance methods
userGroupSchema.methods.addMember = async function(userId) {
    if (!this.members.includes(userId)) {
        this.members.push(userId);
        await this.save();
    }
    return this;
};

userGroupSchema.methods.removeMember = async function(userId) {
    this.members = this.members.filter(id => id.toString() !== userId.toString());
    await this.save();
    return this;
};

userGroupSchema.methods.addPermission = async function(permissionId) {
    if (!this.permissions.includes(permissionId)) {
        this.permissions.push(permissionId);
        await this.save();
    }
    return this;
};

userGroupSchema.methods.removePermission = async function(permissionId) {
    this.permissions = this.permissions.filter(id => id.toString() !== permissionId.toString());
    await this.save();
    return this;
};

userGroupSchema.methods.hasPermission = function(permissionCode) {
    if (!this.populated('permissions')) return false;
    return this.permissions.some(p => p.code === permissionCode);
};

// Static methods
userGroupSchema.statics.findByCode = function(code) {
    return this.findOne({ code: code.toUpperCase() });
};

userGroupSchema.statics.getActiveGroups = function() {
    return this.find({ status: 'active' })
        .populate('permissions', 'code name module action')
        .sort({ priority: -1, name: 1 });
};

userGroupSchema.statics.getUserGroups = function(userId) {
    return this.find({ members: userId, status: 'active' })
        .populate('permissions', 'code name module action description');
};

// Seed default groups
userGroupSchema.statics.seedDefaultGroups = async function() {
    const Permission = mongoose.model('Permission');

    // Lấy tất cả permissions
    const allPermissions = await Permission.find({ status: 'active' });

    const readPermissions = allPermissions.filter(p => p.action === 'read');
    const basicPermissions = allPermissions.filter(p =>
        ['read', 'create', 'update'].includes(p.action) &&
        !['users', 'system', 'settings'].includes(p.module)
    );
    const managerPermissions = allPermissions.filter(p =>
        p.level !== 'critical' || p.module === 'reports'
    );

    const defaultGroups = [
        {
            code: 'SUPER_ADMIN',
            name: 'Quản trị viên hệ thống',
            description: 'Toàn quyền quản trị hệ thống',
            type: 'system',
            priority: 100,
            permissions: allPermissions.map(p => p._id),
            metadata: { color: '#DC2626', icon: 'shield' }
        },
        {
            code: 'REPORT_MANAGER',
            name: 'Cán bộ quản lý báo cáo TĐG',
            description: 'Quản lý và phê duyệt báo cáo tự đánh giá',
            type: 'system',
            priority: 80,
            permissions: managerPermissions.map(p => p._id),
            metadata: { color: '#2563EB', icon: 'file-text' }
        },
        {
            code: 'EVALUATION_EXPERT',
            name: 'Chuyên gia đánh giá',
            description: 'Thực hiện đánh giá các tiêu chí',
            type: 'system',
            priority: 60,
            permissions: basicPermissions.map(p => p._id),
            metadata: { color: '#10B981', icon: 'clipboard-check' }
        },
        {
            code: 'ADVISOR',
            name: 'Tư vấn/Giám sát',
            description: 'Tư vấn và giám sát quá trình đánh giá',
            type: 'system',
            priority: 40,
            permissions: readPermissions.map(p => p._id),
            metadata: { color: '#8B5CF6', icon: 'eye' }
        },
        {
            code: 'VIEWER',
            name: 'Người xem',
            description: 'Chỉ có quyền xem thông tin',
            type: 'system',
            priority: 20,
            permissions: readPermissions.map(p => p._id),
            metadata: { color: '#6B7280', icon: 'eye' }
        }
    ];

    for (const group of defaultGroups) {
        await this.findOneAndUpdate(
            { code: group.code },
            { ...group, status: 'active' },
            { upsert: true, new: true }
        );
    }

    return this.find({ type: 'system' });
};

// Prevent deletion of system groups
userGroupSchema.pre('remove', function(next) {
    if (this.type === 'system') {
        next(new Error('Không thể xóa nhóm hệ thống'));
    } else {
        next();
    }
});

userGroupSchema.set('toJSON', { virtuals: true });
userGroupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserGroup', userGroupSchema);