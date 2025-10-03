const UserGroup = require('../../models/User/UserGroup');
const User = require('../../models/User/User');
const Permission = require('../../models/User/Permission');
const ActivityLog = require('../../models/system/ActivityLog');

// Lấy danh sách nhóm người dùng
const getUserGroups = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            status,
            search
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (type) query.type = type;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const [groups, total] = await Promise.all([
            UserGroup.find(query)
                .populate('permissions', 'code name module action')
                .sort({ priority: -1, name: 1 })
                .skip(skip)
                .limit(limitNum),
            UserGroup.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                groups,
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
        console.error('Get user groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách nhóm người dùng'
        });
    }
};

// Lấy chi tiết nhóm
const getUserGroupById = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await UserGroup.findById(id)
            .populate('permissions', 'code name module action description level')
            .populate('members', 'fullName email role department position');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm'
            });
        }

        res.json({
            success: true,
            data: group
        });

    } catch (error) {
        console.error('Get user group by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin nhóm'
        });
    }
};

// Tạo nhóm mới
const createUserGroup = async (req, res) => {
    try {
        const {
            code,
            name,
            description,
            permissions,
            priority,
            metadata
        } = req.body;

        // Kiểm tra code đã tồn tại chưa
        const existing = await UserGroup.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Mã nhóm đã tồn tại'
            });
        }

        const group = new UserGroup({
            code: code.toUpperCase(),
            name,
            description,
            permissions: permissions || [],
            type: 'custom',
            priority: priority || 50,
            metadata: metadata || {},
            status: 'active',
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await group.save();

        await group.populate('permissions', 'code name module action');

        await ActivityLog.logCriticalAction(req.user.id, 'usergroup_create',
            `Tạo nhóm người dùng mới: ${group.name} (${group.code})`, {
                targetType: 'UserGroup',
                targetId: group._id,
                targetName: group.name,
                metadata: {
                    permissionsCount: group.permissions?.length || 0
                }
            });

        res.status(201).json({
            success: true,
            message: 'Tạo nhóm thành công',
            data: group
        });

    } catch (error) {
        console.error('Create user group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo nhóm'
        });
    }
};

// Cập nhật nhóm
const updateUserGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const group = await UserGroup.findById(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm'
            });
        }

        // Không cho phép sửa nhóm hệ thống
        if (group.type === 'system' && updateData.type !== 'system') {
            return res.status(400).json({
                success: false,
                message: 'Không thể thay đổi loại nhóm hệ thống'
            });
        }

        const oldData = {
            name: group.name,
            permissions: group.permissions?.length || 0,
            status: group.status
        };

        // Cập nhật các trường
        const allowedFields = ['name', 'description', 'priority', 'status', 'metadata'];
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                group[field] = updateData[field];
            }
        });

        group.updatedBy = req.user.id;
        await group.save();

        await ActivityLog.logUserAction(req.user.id, 'usergroup_update',
            `Cập nhật nhóm: ${group.name}`, {
                targetType: 'UserGroup',
                targetId: id,
                targetName: group.name,
                oldData,
                newData: {
                    name: group.name,
                    permissions: group.permissions?.length || 0,
                    status: group.status
                }
            });

        res.json({
            success: true,
            message: 'Cập nhật nhóm thành công',
            data: group
        });

    } catch (error) {
        console.error('Update user group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật nhóm'
        });
    }
};

// Xóa nhóm
const deleteUserGroup = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await UserGroup.findById(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm'
            });
        }

        // Không cho xóa nhóm hệ thống
        if (group.type === 'system') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa nhóm hệ thống'
            });
        }

        // Xóa nhóm khỏi tất cả users
        await User.updateMany(
            { userGroups: id },
            { $pull: { userGroups: id } }
        );

        await UserGroup.findByIdAndDelete(id);

        await ActivityLog.logCriticalAction(req.user.id, 'usergroup_delete',
            `Xóa nhóm: ${group.name} (${group.code})`, {
                targetType: 'UserGroup',
                targetId: id,
                targetName: group.name,
                metadata: {
                    memberCount: group.members?.length || 0
                }
            });

        res.json({
            success: true,
            message: 'Xóa nhóm thành công'
        });

    } catch (error) {
        console.error('Delete user group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa nhóm'
        });
    }
};

// Thêm quyền vào nhóm
const addPermissionsToGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissionIds } = req.body;

        if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách quyền không hợp lệ'
            });
        }

        const group = await UserGroup.findById(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm'
            });
        }

        // Thêm các quyền mới (không trùng)
        for (const permId of permissionIds) {
            if (!group.permissions.includes(permId)) {
                group.permissions.push(permId);
            }
        }

        group.updatedBy = req.user.id;
        await group.save();

        await group.populate('permissions', 'code name module action');

        await ActivityLog.logUserAction(req.user.id, 'usergroup_permissions_add',
            `Thêm ${permissionIds.length} quyền vào nhóm: ${group.name}`, {
                targetType: 'UserGroup',
                targetId: id,
                targetName: group.name,
                metadata: {
                    addedCount: permissionIds.length,
                    totalPermissions: group.permissions.length
                }
            });

        res.json({
            success: true,
            message: 'Thêm quyền thành công',
            data: group
        });

    } catch (error) {
        console.error('Add permissions to group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm quyền'
        });
    }
};

// Xóa quyền khỏi nhóm
const removePermissionsFromGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissionIds } = req.body;

        if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách quyền không hợp lệ'
            });
        }

        const group = await UserGroup.findById(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm'
            });
        }

        // Xóa các quyền
        group.permissions = group.permissions.filter(
            p => !permissionIds.includes(p.toString())
        );

        group.updatedBy = req.user.id;
        await group.save();

        await group.populate('permissions', 'code name module action');

        await ActivityLog.logUserAction(req.user.id, 'usergroup_permissions_remove',
            `Xóa ${permissionIds.length} quyền khỏi nhóm: ${group.name}`, {
                targetType: 'UserGroup',
                targetId: id,
                targetName: group.name,
                metadata: {
                    removedCount: permissionIds.length,
                    remainingPermissions: group.permissions.length
                }
            });

        res.json({
            success: true,
            message: 'Xóa quyền thành công',
            data: group
        });

    } catch (error) {
        console.error('Remove permissions from group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa quyền'
        });
    }
};

// Thêm thành viên vào nhóm
const addMembersToGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách người dùng không hợp lệ'
            });
        }

        const group = await UserGroup.findById(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm'
            });
        }

        // Thêm members vào nhóm và cập nhật users
        const addedUsers = [];
        for (const userId of userIds) {
            const user = await User.findById(userId);
            if (user) {
                // Thêm vào group
                if (!group.members.includes(userId)) {
                    group.members.push(userId);
                }
                // Thêm group vào user
                if (!user.userGroups.includes(id)) {
                    user.userGroups.push(id);
                    await user.save();
                    addedUsers.push(user.fullName);
                }
            }
        }

        group.updatedBy = req.user.id;
        await group.save();

        await ActivityLog.logUserAction(req.user.id, 'usergroup_members_add',
            `Thêm ${addedUsers.length} thành viên vào nhóm: ${group.name}`, {
                targetType: 'UserGroup',
                targetId: id,
                targetName: group.name,
                metadata: {
                    addedMembers: addedUsers,
                    totalMembers: group.members.length
                }
            });

        res.json({
            success: true,
            message: `Đã thêm ${addedUsers.length} thành viên vào nhóm`,
            data: { addedCount: addedUsers.length }
        });

    } catch (error) {
        console.error('Add members to group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm thành viên'
        });
    }
};

// Xóa thành viên khỏi nhóm
const removeMembersFromGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách người dùng không hợp lệ'
            });
        }

        const group = await UserGroup.findById(id);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhóm'
            });
        }

        // Xóa members khỏi nhóm và cập nhật users
        const removedUsers = [];
        for (const userId of userIds) {
            const user = await User.findById(userId);
            if (user) {
                // Xóa khỏi user
                user.userGroups = user.userGroups.filter(
                    gId => gId.toString() !== id
                );
                await user.save();
                removedUsers.push(user.fullName);
            }
        }

        // Xóa khỏi group
        group.members = group.members.filter(
            uId => !userIds.includes(uId.toString())
        );

        group.updatedBy = req.user.id;
        await group.save();

        await ActivityLog.logUserAction(req.user.id, 'usergroup_members_remove',
            `Xóa ${removedUsers.length} thành viên khỏi nhóm: ${group.name}`, {
                targetType: 'UserGroup',
                targetId: id,
                targetName: group.name,
                metadata: {
                    removedMembers: removedUsers,
                    remainingMembers: group.members.length
                }
            });

        res.json({
            success: true,
            message: `Đã xóa ${removedUsers.length} thành viên khỏi nhóm`,
            data: { removedCount: removedUsers.length }
        });

    } catch (error) {
        console.error('Remove members from group error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa thành viên'
        });
    }
};

// Seed default groups
const seedUserGroups = async (req, res) => {
    try {
        const groups = await UserGroup.seedDefaultGroups();

        await ActivityLog.logCriticalAction(req.user.id, 'usergroups_seed',
            `Khởi tạo nhóm người dùng mặc định: ${groups.length} nhóm`, {
                metadata: { count: groups.length }
            });

        res.json({
            success: true,
            message: `Đã khởi tạo ${groups.length} nhóm mặc định`,
            data: groups
        });

    } catch (error) {
        console.error('Seed user groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi khởi tạo nhóm mặc định'
        });
    }
};

module.exports = {
    getUserGroups,
    getUserGroupById,
    createUserGroup,
    updateUserGroup,
    deleteUserGroup,
    addPermissionsToGroup,
    removePermissionsFromGroup,
    addMembersToGroup,
    removeMembersFromGroup,
    seedUserGroups
};