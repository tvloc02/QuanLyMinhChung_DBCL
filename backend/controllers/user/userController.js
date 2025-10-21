const User = require('../../models/User/User');
const Department = require('../../models/User/Department');
const UserGroup = require('../../models/User/UserGroup');
const Permission = require('../../models/User/Permission');
const ActivityLog = require('../../models/system/ActivityLog');
const emailService = require('../../services/emailService');

const getUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            status,
            departmentId,
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
        if (departmentId) query.department = departmentId;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [users, total] = await Promise.all([
            User.find(query)
                .populate('department', 'name code')
                .populate('userGroups', 'code name type priority')
                .populate('selectedPermissions', 'name code')
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
            .populate('department', 'name code')
            .populate('userGroups', 'code name type priority')
            .populate('selectedPermissions', 'name code')
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
            roles,
            department,
            departmentRole,
            position
        } = req.body;

        let userRoles = roles || ['expert'];
        if (!Array.isArray(userRoles)) {
            userRoles = [userRoles];
        }

        // CHỈ 4 vai trò hợp lệ: admin, manager, tdg, expert
        const validRoles = ['admin', 'manager', 'tdg', 'expert'];
        const invalidRoles = userRoles.filter(r => !validRoles.includes(r));

        if (invalidRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Vai trò không hợp lệ: ${invalidRoles.join(', ')}. Chỉ chấp nhận: admin, manager, tdg, expert`
            });
        }

        if (userRoles.length === 0) {
            userRoles = ['expert'];
        }

        const cleanEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại trong hệ thống'
            });
        }

        // Kiểm tra phòng ban (bắt buộc)
        let departmentId = null;
        if (department) {
            const dept = await Department.findById(department);
            if (!dept) {
                return res.status(404).json({
                    success: false,
                    message: 'Phòng ban không tồn tại'
                });
            }
            departmentId = department;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Phòng ban là bắt buộc'
            });
        }

        const defaultPassword = User.generateDefaultPassword(cleanEmail);

        const user = new User({
            email: cleanEmail,
            fullName: fullName.trim(),
            password: defaultPassword,
            phoneNumber: phoneNumber?.trim(),
            roles: userRoles,
            role: userRoles[0],
            status: 'active',
            department: departmentId,
            departmentRole: departmentRole || 'expert',
            position: position?.trim(),
            mustChangePassword: true,
            createdBy: req.user.id,
            updatedBy: req.user.id
        });

        await user.save();

        // Thêm user vào phòng ban
        await Department.findByIdAndUpdate(
            departmentId,
            {
                $push: {
                    members: {
                        user: user._id,
                        role: departmentRole || 'expert'
                    }
                }
            },
            { new: true }
        );

        const userResponse = user.toObject();
        delete userResponse.password;

        await ActivityLog.logCriticalAction(req.user.id, 'user_create',
            `Tạo người dùng mới: ${user.fullName} (${user.email})`, {
                targetType: 'User',
                targetId: user._id,
                targetName: user.fullName,
                metadata: {
                    roles: user.roles,
                    department: departmentId
                }
            });

        try {
            let emailToSend = cleanEmail;
            if (!emailToSend.includes('@')) {
                emailToSend = `${emailToSend}@cmc.edu.vn`;
            }

            const loginUrl = process.env.CLIENT_URL || 'http://localhost:3000';

            console.log(`📧 Sending welcome email to: ${emailToSend}`);

            await emailService.sendWelcomeEmail(
                emailToSend,
                user.fullName,
                defaultPassword,
                loginUrl
            );

            console.log(`✅ Welcome email sent successfully to: ${emailToSend}`);
        } catch (emailError) {
            console.error('⚠️ Failed to send welcome email:', emailError.message);
            console.error('Stack:', emailError.stack);

            await ActivityLog.logError(req.user.id, 'email_send', emailError, {
                targetType: 'User',
                targetId: user._id,
                metadata: {
                    emailType: 'welcome',
                    recipientEmail: cleanEmail
                }
            });
        }

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
        await ActivityLog.logError(req.user?.id, 'user_create', error);
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

        if (updateData.roles) {
            let userRoles = updateData.roles;
            if (!Array.isArray(userRoles)) {
                userRoles = [userRoles];
            }

            // CHỈ 4 vai trò hợp lệ
            const validRoles = ['admin', 'manager', 'tdg', 'expert'];
            const invalidRoles = userRoles.filter(r => !validRoles.includes(r));

            if (invalidRoles.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Vai trò không hợp lệ: ${invalidRoles.join(', ')}. Chỉ chấp nhận: admin, manager, tdg, expert`
                });
            }

            if (userRoles.length === 0) {
                userRoles = ['expert'];
            }

            updateData.roles = userRoles;
            updateData.role = userRoles[0];
        }

        // Kiểm tra thay đổi phòng ban
        if (updateData.department !== undefined) {
            if (updateData.department && updateData.department !== user.department?.toString()) {
                const dept = await Department.findById(updateData.department);
                if (!dept) {
                    return res.status(404).json({
                        success: false,
                        message: 'Phòng ban không tồn tại'
                    });
                }

                // Xóa khỏi phòng ban cũ
                if (user.department) {
                    await Department.findByIdAndUpdate(
                        user.department,
                        { $pull: { members: { user: user._id } } }
                    );
                }

                // Thêm vào phòng ban mới
                await Department.findByIdAndUpdate(
                    updateData.department,
                    {
                        $push: {
                            members: {
                                user: user._id,
                                role: updateData.departmentRole || user.departmentRole
                            }
                        }
                    }
                );
            }
        }

        const oldData = {
            fullName: user.fullName,
            roles: user.roles,
            department: user.department,
            departmentRole: user.departmentRole,
            position: user.position,
            phoneNumber: user.phoneNumber
        };

        const allowedFields = ['fullName', 'phoneNumber', 'roles', 'role', 'position', 'department', 'departmentRole'];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                user[field] = updateData[field];
            }
        });

        user.updatedBy = req.user.id;
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        await ActivityLog.logUserAction(req.user.id, 'user_update',
            `Cập nhật người dùng: ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                oldData,
                newData: {
                    fullName: user.fullName,
                    roles: user.roles,
                    department: user.department,
                    departmentRole: user.departmentRole,
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
        await ActivityLog.logError(req.user?.id, 'user_update', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật người dùng'
        });
    }
};

const lockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Không thể khóa tài khoản của chính mình'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        if (user.isLockedByAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản đã bị khóa rồi'
            });
        }

        user.isLockedByAdmin = true;
        user.lockedByAdmin = {
            adminId: req.user.id,
            lockedAt: new Date(),
            reason: reason || 'Không có lý do cụ thể'
        };
        user.status = 'suspended';
        user.updatedBy = req.user.id;

        await user.save();

        await ActivityLog.logCriticalAction(req.user.id, 'user_lock',
            `Khóa tài khoản người dùng: ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                metadata: {
                    reason: reason || 'Không có lý do cụ thể'
                },
                severity: 'high'
            });

        res.json({
            success: true,
            message: 'Khóa tài khoản thành công',
            data: {
                userId: user._id,
                fullName: user.fullName,
                isLocked: true
            }
        });

    } catch (error) {
        console.error('Lock user error:', error);
        await ActivityLog.logError(req.user?.id, 'user_lock', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi khóa tài khoản'
        });
    }
};

const unlockUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        if (!user.isLockedByAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản không bị khóa'
            });
        }

        user.isLockedByAdmin = false;
        user.lockedByAdmin = undefined;
        user.status = 'active';
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        user.updatedBy = req.user.id;

        await user.save();

        await ActivityLog.logCriticalAction(req.user.id, 'user_unlock',
            `Mở khóa tài khoản người dùng: ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                severity: 'medium'
            });

        res.json({
            success: true,
            message: 'Mở khóa tài khoản thành công',
            data: {
                userId: user._id,
                fullName: user.fullName,
                isLocked: false
            }
        });

    } catch (error) {
        console.error('Unlock user error:', error);
        await ActivityLog.logError(req.user?.id, 'user_unlock', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi mở khóa tài khoản'
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

        // Xóa khỏi phòng ban
        if (user.department) {
            await Department.findByIdAndUpdate(
                user.department,
                { $pull: { members: { user: user._id } } }
            );
        }

        await UserGroup.updateMany(
            { members: user._id },
            { $pull: { members: user._id } }
        );

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

        try {
            let emailToSend = user.email;
            if (!emailToSend.includes('@')) {
                emailToSend = `${emailToSend}@cmc.edu.vn`;
            }

            console.log(`📧 Sending password reset notification to: ${emailToSend}`);

            await emailService.sendPasswordChangeNotification(
                emailToSend,
                user.fullName
            );

            console.log(`✅ Password reset notification sent successfully`);
        } catch (emailError) {
            console.error('⚠️ Failed to send password reset notification:', emailError.message);
        }

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
                    tdgUsers: {
                        $sum: { $cond: [{ $eq: ['$role', 'tdg'] }, 1, 0] }
                    },
                    expertUsers: {
                        $sum: { $cond: [{ $eq: ['$role', 'expert'] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalUsers: 0,
            activeUsers: 0,
            adminUsers: 0,
            managerUsers: 0,
            tdgUsers: 0,
            expertUsers: 0
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
                fullName: user.fullName,
                email: user.email,
                userGroups: user.userGroups,
                individualPermissions: user.individualPermissions,
                allPermissions
            }
        });

    } catch (error) {
        console.error('Get user permissions error:', error);
        await ActivityLog.logError(req.user?.id, 'user_permissions_view', error);
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
                if (!user.userGroups.includes(groupId)) {
                    user.userGroups.push(groupId);
                }

                if (!group.members.includes(user._id)) {
                    group.members.push(user._id);
                    await group.save();
                }

                addedGroups.push(group.name);
            }
        }

        await user.save();

        await ActivityLog.logUserAction(req.user.id, 'user_groups_add',
            `Thêm người dùng ${user.fullName} vào ${addedGroups.length} nhóm`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                metadata: { addedGroups, totalGroups: user.userGroups.length }
            });

        res.json({
            success: true,
            message: `Đã thêm người dùng vào ${addedGroups.length} nhóm`,
            data: { addedCount: addedGroups.length, addedGroups }
        });

    } catch (error) {
        console.error('Add user to groups error:', error);
        await ActivityLog.logError(req.user?.id, 'user_groups_add', error);
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
                user.userGroups = user.userGroups.filter(
                    gId => gId.toString() !== groupId.toString()
                );

                group.members = group.members.filter(
                    uId => uId.toString() !== user._id.toString()
                );
                await group.save();

                removedGroups.push(group.name);
            }
        }

        await user.save();

        await ActivityLog.logUserAction(req.user.id, 'user_groups_remove',
            `Xóa người dùng ${user.fullName} khỏi ${removedGroups.length} nhóm`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                metadata: { removedGroups, remainingGroups: user.userGroups.length }
            });

        res.json({
            success: true,
            message: `Đã xóa người dùng khỏi ${removedGroups.length} nhóm`,
            data: { removedCount: removedGroups.length, removedGroups }
        });

    } catch (error) {
        console.error('Remove user from groups error:', error);
        await ActivityLog.logError(req.user?.id, 'user_groups_remove', error);
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

        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy quyền'
            });
        }

        user.individualPermissions = user.individualPermissions.filter(
            ip => ip.permission.toString() !== permissionId.toString()
        );

        user.individualPermissions.push({
            permission: permissionId,
            type: 'granted',
            grantedBy: req.user.id,
            grantedAt: new Date()
        });

        await user.save();

        await ActivityLog.logCriticalAction(req.user.id, 'user_permission_grant',
            `Cấp quyền ${permission.name} cho ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                metadata: { permission: permission.code, permissionName: permission.name }
            });

        res.json({
            success: true,
            message: 'Cấp quyền thành công',
            data: { permissionCode: permission.code, permissionName: permission.name }
        });

    } catch (error) {
        console.error('Grant user permission error:', error);
        await ActivityLog.logError(req.user?.id, 'user_permission_grant', error);
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

        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy quyền'
            });
        }

        user.individualPermissions = user.individualPermissions.filter(
            ip => ip.permission.toString() !== permissionId.toString()
        );

        user.individualPermissions.push({
            permission: permissionId,
            type: 'denied',
            grantedBy: req.user.id,
            grantedAt: new Date()
        });

        await user.save();

        await ActivityLog.logCriticalAction(req.user.id, 'user_permission_deny',
            `Từ chối quyền ${permission.name} của ${user.fullName}`, {
                targetType: 'User',
                targetId: id,
                targetName: user.fullName,
                metadata: { permission: permission.code, permissionName: permission.name }
            });

        res.json({
            success: true,
            message: 'Từ chối quyền thành công',
            data: { permissionCode: permission.code, permissionName: permission.name }
        });

    } catch (error) {
        console.error('Deny user permission error:', error);
        await ActivityLog.logError(req.user?.id, 'user_permission_deny', error);
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

        user.individualPermissions = user.individualPermissions.filter(
            ip => ip.permission.toString() !== permissionId.toString()
        );

        await user.save();

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
        await ActivityLog.logError(req.user?.id, 'user_permission_remove', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa quyền cá nhân'
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
    getUserStatistics,
    getUserPermissions,
    addUserToGroups,
    removeUserFromGroups,
    grantUserPermission,
    denyUserPermission,
    removeUserPermission,
    unlockUser,
    lockUser
};