const User = require('../models/User');
const UserGroup = require('../models/UserGroup');
const ActivityLog = require('../models/ActivityLog');

const getUserPermissions = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .populate({
                path: 'userGroups',
                match: { status: 'active' },
                populate: {
                    path: 'permissions',
                    match: { status: 'active' }
                }
            })
            .populate('individualPermissions.permission');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const allPermissions = await user.getAllPermissions();

        res.json({
            success: true,
            data: {
                userId: user._id,
                userGroups: user.userGroups,
                individualPermissions: user.individualPermissions,
                allPermissions
            }
        });

    } catch (error) {
        console.error('Get user permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy quyền người dùng'
        });
    }
};

const addUserToGroups = async (req, res) => {
    try {
        const { id } = req.params;
        const { groupIds } = req.body;

        if (!Array.isArray(groupIds) || groupIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách nhóm không hợp lệ'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const addedGroups = [];
        for (const groupId of groupIds) {
            const group = await UserGroup.findById(groupId);
            if (group && group.status === 'active') {
                await user.addToGroup(groupId);
                addedGroups.push(group.name);
            }
        }

        await ActivityLog.logUserAction(req.user.id, 'user_groups_add',
            `Thêm người dùng ${user.fullName} vào ${addedGroups.length} nhóm`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                metadata: {
                    addedGroups,
                    totalGroups: user.userGroups.length
                }
            });

        res.json({
            success: true,
            message: `Đã thêm người dùng vào ${addedGroups.length} nhóm`,
            data: { addedCount: addedGroups.length }
        });

    } catch (error) {
        console.error('Add user to groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm người dùng vào nhóm'
        });
    }
};

const removeUserFromGroups = async (req, res) => {
    try {
        const { id } = req.params;
        const { groupIds } = req.body;

        if (!Array.isArray(groupIds) || groupIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách nhóm không hợp lệ'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const removedGroups = [];
        for (const groupId of groupIds) {
            const group = await UserGroup.findById(groupId);
            if (group) {
                await user.removeFromGroup(groupId);
                removedGroups.push(group.name);
            }
        }

        await ActivityLog.logUserAction(req.user.id, 'user_groups_remove',
            `Xóa người dùng ${user.fullName} khỏi ${removedGroups.length} nhóm`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                metadata: {
                    removedGroups,
                    remainingGroups: user.userGroups.length
                }
            });

        res.json({
            success: true,
            message: `Đã xóa người dùng khỏi ${removedGroups.length} nhóm`,
            data: { removedCount: removedGroups.length }
        });

    } catch (error) {
        console.error('Remove user from groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa người dùng khỏi nhóm'
        });
    }
};

const grantUserPermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissionId } = req.body;

        if (!permissionId) {
            return res.status(400).json({
                success: false,
                message: 'Quyền không hợp lệ'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const Permission = require('../models/Permission');
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy quyền'
            });
        }

        await user.grantPermission(permissionId, req.user.id);

        await ActivityLog.logCriticalAction(req.user.id, 'user_permission_grant',
            `Cấp quyền ${permission.name} cho ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                metadata: {
                    permission: permission.code
                }
            });

        res.json({
            success: true,
            message: 'Cấp quyền thành công',
            data: { permissionCode: permission.code }
        });

    } catch (error) {
        console.error('Grant user permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cấp quyền'
        });
    }
};

const denyUserPermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissionId } = req.body;

        if (!permissionId) {
            return res.status(400).json({
                success: false,
                message: 'Quyền không hợp lệ'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const Permission = require('../models/Permission');
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy quyền'
            });
        }

        await user.denyPermission(permissionId, req.user.id);

        await ActivityLog.logCriticalAction(req.user.id, 'user_permission_deny',
            `Từ chối quyền ${permission.name} của ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                metadata: {
                    permission: permission.code
                }
            });

        res.json({
            success: true,
            message: 'Từ chối quyền thành công',
            data: { permissionCode: permission.code }
        });

    } catch (error) {
        console.error('Deny user permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối quyền'
        });
    }
};

const removeUserPermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { permissionId } = req.body;

        if (!permissionId) {
            return res.status(400).json({
                success: false,
                message: 'Quyền không hợp lệ'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        await user.removeIndividualPermission(permissionId);

        await ActivityLog.logUserAction(req.user.id, 'user_permission_remove',
            `Xóa quyền cá nhân của ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName
            });

        res.json({
            success: true,
            message: 'Xóa quyền cá nhân thành công'
        });

    } catch (error) {
        console.error('Remove user permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa quyền cá nhân'
        });
    }
};

const getUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            status,
            groupId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = {};

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) query.role = role;
        if (status) query.status = status;
        if (groupId) query.userGroups = groupId;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [users, total] = await Promise.all([
            User.find(query)
                .populate('userGroups', 'code name type priority')
                .populate('academicYearAccess', 'name code')
                .populate('programAccess', 'name code')
                .populate('organizationAccess', 'name code')
                .populate('standardAccess', 'name code')
                .populate('criteriaAccess', 'name code')
                .select('-password -resetPasswordToken -resetPasswordExpires')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            User.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                users,
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
        console.error('Get users error:', error);
        await ActivityLog.logError(req.user?.id, 'user_list', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách người dùng'
        });
    }
};

const createUser = async (req, res) => {
    try {
        const {
            email,
            fullName,
            phoneNumber,
            role,
            department,
            position,
            expertise,
            userGroups,
            academicYearAccess,
            programAccess,
            organizationAccess,
            standardAccess,
            criteriaAccess,
            notificationSettings
        } = req.body;

        const validRoles = ['admin', 'manager', 'expert', 'advisor'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Vai trò không hợp lệ. Chỉ chấp nhận: ${validRoles.join(', ')}`
            });
        }

        const cleanEmail = email.replace('@cmcu.edu.vn', '').toLowerCase();

        const existingUser = await User.findOne({
            email: new RegExp(`^${cleanEmail}`, 'i')
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại trong hệ thống'
            });
        }

        const defaultPassword = User.generateDefaultPassword(cleanEmail);

        const user = new User({
            email: cleanEmail,
            fullName: fullName.trim(),
            password: defaultPassword,
            phoneNumber: phoneNumber?.trim(),
            role: role || 'expert',
            department: department?.trim(),
            position: position?.trim(),
            expertise: expertise || [],
            userGroups: userGroups || [],
            academicYearAccess: academicYearAccess || [],
            programAccess: programAccess || [],
            organizationAccess: organizationAccess || [],
            standardAccess: standardAccess || [],
            criteriaAccess: criteriaAccess || [],
            notificationSettings: notificationSettings || {
                email: true,
                inApp: true,
                assignment: true,
                evaluation: true,
                deadline: true
            },
            status: 'active',
            mustChangePassword: true,
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await user.save();

        if (userGroups && userGroups.length > 0) {
            await UserGroup.updateMany(
                { _id: { $in: userGroups } },
                { $addToSet: { members: user._id } }
            );
        }

        await user.populate([
            { path: 'userGroups', select: 'code name' },
            { path: 'academicYearAccess', select: 'name code' },
            { path: 'programAccess', select: 'name code' },
            { path: 'organizationAccess', select: 'name code' },
            { path: 'standardAccess', select: 'name code' },
            { path: 'criteriaAccess', select: 'name code' }
        ]);

        const userResponse = user.toObject();
        delete userResponse.password;

        await ActivityLog.logCriticalAction(req.user.id, 'user_create',
            `Tạo người dùng mới: ${user.fullName} (${user.email})`, {
                targetType: 'User',
                targetId: user._id,
                targetName: user.fullName,
                metadata: {
                    role: user.role,
                    department: user.department,
                    groupsCount: user.userGroups?.length || 0,
                    hasDefaultPassword: true
                }
            });

        res.status(201).json({
            success: true,
            message: 'Tạo người dùng thành công',
            data: {
                user: userResponse,
                defaultPassword
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        await ActivityLog.logError(req.user?.id, 'user_create', error, {
            metadata: { email: req.body?.email, fullName: req.body?.fullName }
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo người dùng'
        });
    }
};

module.exports = {
    getUsers,
    createUser,
    getUserPermissions,
    addUserToGroups,
    removeUserFromGroups,
    grantUserPermission,
    denyUserPermission,
    removeUserPermission
};