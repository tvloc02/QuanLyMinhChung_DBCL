const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const getUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            status,
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

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [users, total] = await Promise.all([
            User.find(query)
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

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .populate('academicYearAccess', 'name code')
            .populate('programAccess', 'name code')
            .populate('organizationAccess', 'name code')
            .populate('standardAccess', 'name code')
            .populate('criteriaAccess', 'name code')
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        await ActivityLog.logUserAction(req.user?.id, 'user_view',
            `Xem thông tin người dùng: ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName
            });

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        await ActivityLog.logError(req.user?.id, 'user_view', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin người dùng'
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

        await user.populate([
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

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        if (updateData.role) {
            const validRoles = ['admin', 'manager', 'expert', 'advisor'];
            if (!validRoles.includes(updateData.role)) {
                return res.status(400).json({
                    success: false,
                    message: `Vai trò không hợp lệ. Chỉ chấp nhận: ${validRoles.join(', ')}`
                });
            }
        }

        const oldData = {
            fullName: user.fullName,
            role: user.role,
            department: user.department,
            position: user.position,
            phoneNumber: user.phoneNumber
        };

        const allowedFields = [
            'fullName', 'phoneNumber', 'role', 'department', 'position', 'expertise',
            'academicYearAccess', 'programAccess', 'organizationAccess',
            'standardAccess', 'criteriaAccess', 'notificationSettings'
        ];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                user[field] = updateData[field];
            }
        });

        user.updatedBy = req.user.id;
        await user.save();

        await user.populate([
            { path: 'academicYearAccess', select: 'name code' },
            { path: 'programAccess', select: 'name code' },
            { path: 'organizationAccess', select: 'name code' },
            { path: 'standardAccess', select: 'name code' },
            { path: 'criteriaAccess', select: 'name code' }
        ]);

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.resetPasswordToken;
        delete userResponse.resetPasswordExpires;

        await ActivityLog.logUserAction(req.user.id, 'user_update',
            `Cập nhật người dùng: ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                oldData,
                newData: {
                    fullName: user.fullName,
                    role: user.role,
                    department: user.department,
                    position: user.position,
                    phoneNumber: user.phoneNumber
                }
            });

        res.json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            data: userResponse
        });

    } catch (error) {
        console.error('Update user error:', error);
        await ActivityLog.logError(req.user?.id, 'user_update', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật người dùng'
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tài khoản của chính mình'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        await User.findByIdAndDelete(id);

        await ActivityLog.logCriticalAction(req.user.id, 'user_delete',
            `Xóa người dùng: ${user.fullName} (${user.email})`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                metadata: {
                    deletedRole: user.role,
                    deletedDepartment: user.department
                }
            });

        res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        await ActivityLog.logError(req.user?.id, 'user_delete', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa người dùng'
        });
    }
};

const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const newPassword = User.generateDefaultPassword(user.email);
        user.password = newPassword;
        user.mustChangePassword = true;
        user.updatedBy = req.user.id;
        await user.save();

        await ActivityLog.logCriticalAction(req.user.id, 'user_password_reset',
            `Reset mật khẩu cho người dùng: ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName
            });

        res.json({
            success: true,
            message: 'Reset mật khẩu thành công',
            data: {
                newPassword
            }
        });

    } catch (error) {
        console.error('Reset user password error:', error);
        await ActivityLog.logError(req.user?.id, 'user_password_reset', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi reset mật khẩu'
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`
            });
        }

        if (id === req.user.id && status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Không thể thay đổi trạng thái tài khoản của chính mình'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const oldStatus = user.status;
        user.status = status;
        user.updatedBy = req.user.id;
        await user.save();

        await ActivityLog.logUserAction(req.user.id, 'user_status_change',
            `Thay đổi trạng thái người dùng ${user.fullName}: ${oldStatus} → ${status}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                oldData: { status: oldStatus },
                newData: { status },
                severity: status === 'suspended' ? 'high' : 'medium'
            });

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thành công',
            data: { status }
        });

    } catch (error) {
        console.error('Update user status error:', error);
        await ActivityLog.logError(req.user?.id, 'user_status_change', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật trạng thái'
        });
    }
};

const updateUserPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            academicYearAccess,
            programAccess,
            organizationAccess,
            standardAccess,
            criteriaAccess
        } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const oldPermissions = {
            academicYearAccess: user.academicYearAccess?.length || 0,
            programAccess: user.programAccess?.length || 0,
            organizationAccess: user.organizationAccess?.length || 0,
            standardAccess: user.standardAccess?.length || 0,
            criteriaAccess: user.criteriaAccess?.length || 0
        };

        if (academicYearAccess !== undefined) user.academicYearAccess = academicYearAccess;
        if (programAccess !== undefined) user.programAccess = programAccess;
        if (organizationAccess !== undefined) user.organizationAccess = organizationAccess;
        if (standardAccess !== undefined) user.standardAccess = standardAccess;
        if (criteriaAccess !== undefined) user.criteriaAccess = criteriaAccess;

        user.updatedBy = req.user.id;
        await user.save();

        await user.populate([
            { path: 'academicYearAccess', select: 'name code' },
            { path: 'programAccess', select: 'name code' },
            { path: 'organizationAccess', select: 'name code' },
            { path: 'standardAccess', select: 'name code' },
            { path: 'criteriaAccess', select: 'name code' }
        ]);

        const newPermissions = {
            academicYearAccess: user.academicYearAccess?.length || 0,
            programAccess: user.programAccess?.length || 0,
            organizationAccess: user.organizationAccess?.length || 0,
            standardAccess: user.standardAccess?.length || 0,
            criteriaAccess: user.criteriaAccess?.length || 0
        };

        await ActivityLog.logUserAction(req.user.id, 'user_permissions_update',
            `Cập nhật quyền truy cập cho người dùng: ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                oldData: oldPermissions,
                newData: newPermissions,
                severity: 'high'
            });

        res.json({
            success: true,
            message: 'Cập nhật quyền truy cập thành công',
            data: {
                academicYearAccess: user.academicYearAccess,
                programAccess: user.programAccess,
                organizationAccess: user.organizationAccess,
                standardAccess: user.standardAccess,
                criteriaAccess: user.criteriaAccess
            }
        });

    } catch (error) {
        console.error('Update user permissions error:', error);
        await ActivityLog.logError(req.user?.id, 'user_permissions_update', error, {
            targetId: req.params.id
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật quyền truy cập'
        });
    }
};

const getUserStatistics = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    adminUsers: {
                        $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
                    },
                    managerUsers: {
                        $sum: { $cond: [{ $eq: ['$role', 'manager'] }, 1, 0] }
                    },
                    expertUsers: {
                        $sum: { $cond: [{ $eq: ['$role', 'expert'] }, 1, 0] }
                    },
                    advisorUsers: {
                        $sum: { $cond: [{ $eq: ['$role', 'advisor'] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalUsers: 0,
            activeUsers: 0,
            adminUsers: 0,
            managerUsers: 0,
            expertUsers: 0,
            advisorUsers: 0
        };

        await ActivityLog.logUserAction(req.user?.id, 'user_statistics',
            `Xem thống kê người dùng`, {
                metadata: result
            });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get user statistics error:', error);
        await ActivityLog.logError(req.user?.id, 'user_statistics', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê người dùng'
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    updateUserStatus,
    updateUserPermissions,
    getUserStatistics
};