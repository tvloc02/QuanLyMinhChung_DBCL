const Permission = require('../../models/User/Permission');
const ActivityLog = require('../../models/system/ActivityLog');

// Lấy danh sách permissions
const getPermissions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            module,
            action,
            level,
            status,
            search
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (module) query.module = module;
        if (action) query.action = action;
        if (level) query.level = level;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const [permissions, total] = await Promise.all([
            Permission.find(query)
                .sort({ module: 1, action: 1 })
                .skip(skip)
                .limit(limitNum),
            Permission.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                permissions,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                }
            }
        });

    } catch (error) {
        console.error('Get permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách quyền'
        });
    }
};

// Lấy permissions theo module
const getPermissionsByModule = async (req, res) => {
    try {
        const permissions = await Permission.find({ status: 'active' })
            .sort({ module: 1, action: 1 });

        // Nhóm theo module
        const grouped = permissions.reduce((acc, perm) => {
            if (!acc[perm.module]) {
                acc[perm.module] = [];
            }
            acc[perm.module].push(perm);
            return acc;
        }, {});

        res.json({
            success: true,
            data: grouped
        });

    } catch (error) {
        console.error('Get permissions by module error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách quyền theo module'
        });
    }
};

// Lấy chi tiết một permission
const getPermissionById = async (req, res) => {
    try {
        const { id } = req.params;

        const permission = await Permission.findById(id);

        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy quyền'
            });
        }

        res.json({
            success: true,
            data: permission
        });

    } catch (error) {
        console.error('Get permission by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin quyền'
        });
    }
};

// Tạo permission mới
const createPermission = async (req, res) => {
    try {
        const {
            code,
            name,
            description,
            module,
            action,
            level,
            metadata
        } = req.body;

        // Kiểm tra code đã tồn tại chưa
        const existing = await Permission.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Mã quyền đã tồn tại'
            });
        }

        const permission = new Permission({
            code: code.toUpperCase(),
            name,
            description,
            module,
            action,
            level: level || 'basic',
            metadata: metadata || {},
            status: 'active',
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await permission.save();

        await ActivityLog.logCriticalAction(req.user.id, 'permission_create',
            `Tạo quyền mới: ${permission.name} (${permission.code})`, {
                targetType: 'Permission',
                targetId: permission._id,
                targetName: permission.name
            });

        res.status(201).json({
            success: true,
            message: 'Tạo quyền thành công',
            data: permission
        });

    } catch (error) {
        console.error('Create permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo quyền'
        });
    }
};

// Cập nhật permission
const updatePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const permission = await Permission.findById(id);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy quyền'
            });
        }

        const oldData = permission.toObject();

        // Cập nhật các trường được phép
        const allowedFields = ['name', 'description', 'level', 'status', 'metadata'];
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                permission[field] = updateData[field];
            }
        });

        permission.updatedBy = req.user.id;
        await permission.save();

        await ActivityLog.logUserAction(req.user.id, 'permission_update',
            `Cập nhật quyền: ${permission.name}`, {
                targetType: 'Permission',
                targetId: id,
                targetName: permission.name,
                oldData: { name: oldData.name, status: oldData.status },
                newData: { name: permission.name, status: permission.status }
            });

        res.json({
            success: true,
            message: 'Cập nhật quyền thành công',
            data: permission
        });

    } catch (error) {
        console.error('Update permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật quyền'
        });
    }
};

// Xóa permission
const deletePermission = async (req, res) => {
    try {
        const { id } = req.params;

        const permission = await Permission.findById(id);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy quyền'
            });
        }

        // Kiểm tra xem quyền có đang được sử dụng không
        const UserGroup = require('../../models/User/UserGroup');
        const groupsUsingPermission = await UserGroup.countDocuments({
            permissions: id
        });

        if (groupsUsingPermission > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa quyền này vì đang được sử dụng bởi ${groupsUsingPermission} nhóm`
            });
        }

        await Permission.findByIdAndDelete(id);

        await ActivityLog.logCriticalAction(req.user.id, 'permission_delete',
            `Xóa quyền: ${permission.name} (${permission.code})`, {
                targetType: 'Permission',
                targetId: id,
                targetName: permission.name
            });

        res.json({
            success: true,
            message: 'Xóa quyền thành công'
        });

    } catch (error) {
        console.error('Delete permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa quyền'
        });
    }
};

// Seed default permissions
const seedPermissions = async (req, res) => {
    try {
        const permissions = await Permission.seedDefaultPermissions();

        await ActivityLog.logCriticalAction(req.user.id, 'permissions_seed',
            `Khởi tạo quyền mặc định: ${permissions.length} quyền`, {
                metadata: { count: permissions.length }
            });

        res.json({
            success: true,
            message: `Đã khởi tạo ${permissions.length} quyền mặc định`,
            data: permissions
        });

    } catch (error) {
        console.error('Seed permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi khởi tạo quyền mặc định'
        });
    }
};

module.exports = {
    getPermissions,
    getPermissionsByModule,
    getPermissionById,
    createPermission,
    updatePermission,
    deletePermission,
    seedPermissions
};