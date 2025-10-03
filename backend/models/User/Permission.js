const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    // Mã quyền duy nhất (VD: reports.create, reports.view, users.manage)
    code: {
        type: String,
        required: [true, 'Mã quyền là bắt buộc'],
        unique: true,
        uppercase: true,
        index: true
    },

    // Tên hiển thị
    name: {
        type: String,
        required: [true, 'Tên quyền là bắt buộc'],
        maxlength: [200, 'Tên quyền không được quá 200 ký tự']
    },

    // Mô tả chi tiết
    description: {
        type: String,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },

    // Module/Chức năng (VD: reports, users, evaluations, standards)
    module: {
        type: String,
        required: [true, 'Module là bắt buộc'],
        enum: [
            'reports',          // Quản lý báo cáo
            'evaluations',      // Đánh giá
            'users',           // Quản lý người dùng
            'standards',       // Quản lý tiêu chuẩn
            'criteria',        // Quản lý tiêu chí
            'programs',        // Quản lý chương trình
            'organizations',   // Quản lý tổ chức
            'academic_years',  // Quản lý năm học
            'system',          // Quản trị hệ thống
            'settings'         // Cài đặt
        ],
        index: true
    },

    // Hành động (VD: create, read, update, delete, approve, export)
    action: {
        type: String,
        required: [true, 'Hành động là bắt buộc'],
        enum: [
            'create',   // Tạo mới
            'read',     // Xem/Đọc
            'update',   // Cập nhật
            'delete',   // Xóa
            'approve',  // Phê duyệt
            'reject',   // Từ chối
            'assign',   // Phân công
            'export',   // Xuất dữ liệu
            'import',   // Nhập dữ liệu
            'manage'    // Quản lý toàn bộ
        ]
    },

    // Cấp độ quyền (để phân loại)
    level: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced', 'critical'],
        default: 'basic'
    },

    // Trạng thái
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },

    // Metadata
    metadata: {
        requiresTwoFactor: {
            type: Boolean,
            default: false
        },
        requiresApproval: {
            type: Boolean,
            default: false
        },
        auditLog: {
            type: Boolean,
            default: true
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
permissionSchema.index({ module: 1, action: 1 });
permissionSchema.index({ status: 1 });
permissionSchema.index({ level: 1 });

// Tự động tạo code từ module và action nếu chưa có
permissionSchema.pre('validate', function(next) {
    if (!this.code && this.module && this.action) {
        this.code = `${this.module}.${this.action}`.toUpperCase();
    }
    next();
});

// Static method: Seed default permissions
permissionSchema.statics.seedDefaultPermissions = async function() {
    const defaultPermissions = [
        // Reports
        { module: 'reports', action: 'create', name: 'Tạo báo cáo TĐG', level: 'intermediate' },
        { module: 'reports', action: 'read', name: 'Xem báo cáo TĐG', level: 'basic' },
        { module: 'reports', action: 'update', name: 'Cập nhật báo cáo TĐG', level: 'intermediate' },
        { module: 'reports', action: 'delete', name: 'Xóa báo cáo TĐG', level: 'advanced' },
        { module: 'reports', action: 'approve', name: 'Phê duyệt báo cáo', level: 'advanced' },
        { module: 'reports', action: 'export', name: 'Xuất báo cáo', level: 'basic' },

        // Evaluations
        { module: 'evaluations', action: 'create', name: 'Tạo đánh giá', level: 'intermediate' },
        { module: 'evaluations', action: 'read', name: 'Xem đánh giá', level: 'basic' },
        { module: 'evaluations', action: 'update', name: 'Cập nhật đánh giá', level: 'intermediate' },
        { module: 'evaluations', action: 'delete', name: 'Xóa đánh giá', level: 'advanced' },
        { module: 'evaluations', action: 'approve', name: 'Phê duyệt đánh giá', level: 'advanced' },

        // Users
        { module: 'users', action: 'create', name: 'Tạo người dùng', level: 'advanced' },
        { module: 'users', action: 'read', name: 'Xem người dùng', level: 'basic' },
        { module: 'users', action: 'update', name: 'Cập nhật người dùng', level: 'advanced' },
        { module: 'users', action: 'delete', name: 'Xóa người dùng', level: 'critical' },
        { module: 'users', action: 'manage', name: 'Quản lý toàn bộ người dùng', level: 'critical' },

        // Standards
        { module: 'standards', action: 'create', name: 'Tạo tiêu chuẩn', level: 'advanced' },
        { module: 'standards', action: 'read', name: 'Xem tiêu chuẩn', level: 'basic' },
        { module: 'standards', action: 'update', name: 'Cập nhật tiêu chuẩn', level: 'advanced' },
        { module: 'standards', action: 'delete', name: 'Xóa tiêu chuẩn', level: 'critical' },

        // Criteria
        { module: 'criteria', action: 'create', name: 'Tạo tiêu chí', level: 'advanced' },
        { module: 'criteria', action: 'read', name: 'Xem tiêu chí', level: 'basic' },
        { module: 'criteria', action: 'update', name: 'Cập nhật tiêu chí', level: 'advanced' },
        { module: 'criteria', action: 'delete', name: 'Xóa tiêu chí', level: 'critical' },

        // Programs
        { module: 'programs', action: 'create', name: 'Tạo chương trình', level: 'advanced' },
        { module: 'programs', action: 'read', name: 'Xem chương trình', level: 'basic' },
        { module: 'programs', action: 'update', name: 'Cập nhật chương trình', level: 'advanced' },
        { module: 'programs', action: 'delete', name: 'Xóa chương trình', level: 'critical' },

        // System
        { module: 'system', action: 'manage', name: 'Quản trị hệ thống', level: 'critical' },
        { module: 'settings', action: 'update', name: 'Cập nhật cài đặt', level: 'advanced' }
    ];

    for (const perm of defaultPermissions) {
        await this.findOneAndUpdate(
            { module: perm.module, action: perm.action },
            { ...perm, status: 'active' },
            { upsert: true, new: true }
        );
    }

    return this.find();
};

module.exports = mongoose.model('Permission', permissionSchema);