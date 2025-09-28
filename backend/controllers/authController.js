const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const emailService = require('../services/emailService');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login attempt:', { email, passwordLength: password?.length });

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu'
            });
        }

        const username = email.split('@')[0].toLowerCase().trim();
        console.log('🔍 Searching for username:', username);

        const user = await User.findOne({ email: username });

        if (!user) {
            console.log('❌ User not found');

            await ActivityLog.logUserAction(null, 'user_login_failed',
                `Đăng nhập thất bại: Tài khoản ${username} không tồn tại`, {
                    requestInfo: {
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        method: 'POST',
                        endpoint: '/auth/login',
                        responseStatus: 401
                    },
                    metadata: { username }
                });

            const availableUsers = await User.find({}, 'email fullName').lean();
            console.log('📋 Available users:', availableUsers);

            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập không tồn tại'
            });
        }

        console.log('✅ User found:', { email: user.email, fullName: user.fullName });

        if (user.status !== 'active') {
            console.log('❌ User status:', user.status);

            await ActivityLog.logUserAction(user._id, 'user_login_failed',
                `Đăng nhập thất bại: Tài khoản bị ${user.status}`, {
                    requestInfo: {
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        method: 'POST',
                        endpoint: '/auth/login',
                        responseStatus: 401
                    },
                    metadata: { status: user.status }
                });

            return res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
            });
        }

        if (user.isLocked) {
            await ActivityLog.logUserAction(user._id, 'user_login_failed',
                `Đăng nhập thất bại: Tài khoản bị khóa`, {
                    requestInfo: {
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        method: 'POST',
                        endpoint: '/auth/login',
                        responseStatus: 401
                    },
                    metadata: { lockUntil: user.lockUntil }
                });

            return res.status(401).json({
                success: false,
                message: 'Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần'
            });
        }

        console.log('🔑 Checking password...');
        console.log('🔑 Stored password starts with:', user.password?.substring(0, 10) + '...');

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            console.log('❌ Invalid password');

            await user.incFailedLoginAttempts();

            await ActivityLog.logUserAction(user._id, 'user_login_failed',
                `Đăng nhập thất bại: Mật khẩu không chính xác`, {
                    requestInfo: {
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        method: 'POST',
                        endpoint: '/auth/login',
                        responseStatus: 401
                    },
                    metadata: {
                        failedAttempts: user.failedLoginAttempts + 1,
                        username
                    }
                });

            return res.status(401).json({
                success: false,
                message: 'Mật khẩu không chính xác'
            });
        }

        console.log('✅ Login successful');

        await user.recordLogin();

        await ActivityLog.logUserAction(user._id, 'user_login',
            `Đăng nhập thành công`, {
                requestInfo: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    method: 'POST',
                    endpoint: '/auth/login',
                    responseStatus: 200
                },
                metadata: {
                    role: user.role,
                    department: user.department
                }
            });

        const token = generateToken(user._id);

        const userResponse = {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            status: user.status,
            department: user.department,
            position: user.position,
            phoneNumber: user.phoneNumber,
            academicYearAccess: user.academicYearAccess,
            programAccess: user.programAccess,
            organizationAccess: user.organizationAccess,
            standardAccess: user.standardAccess,
            criteriaAccess: user.criteriaAccess,
            notificationSettings: user.notificationSettings,
            lastLogin: new Date(),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: userResponse
            }
        });

    } catch (error) {
        console.error('💥 Login error:', error);
        await ActivityLog.logError(null, 'user_login', error, {
            requestInfo: {
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                method: 'POST',
                endpoint: '/auth/login'
            },
            metadata: { email: req.body?.email }
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đăng nhập'
        });
    }
};

const logout = async (req, res) => {
    try {
        await ActivityLog.logUserAction(req.user?.id, 'user_logout',
            `Đăng xuất`, {
                requestInfo: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    method: 'POST',
                    endpoint: '/auth/logout'
                }
            });

        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        console.error('Logout error:', error);
        await ActivityLog.logError(req.user?.id, 'user_logout', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đăng xuất'
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email'
            });
        }

        const username = email.split('@')[0].toLowerCase().trim();
        const user = await User.findOne({ email: username });

        if (!user) {
            await ActivityLog.logUserAction(null, 'user_password_reset_request',
                `Yêu cầu reset password thất bại: Email ${username} không tồn tại`, {
                    requestInfo: {
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    },
                    metadata: { email: username }
                });

            return res.status(404).json({
                success: false,
                message: 'Email không tồn tại trong hệ thống'
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        await User.updateOne(
            { _id: user._id },
            {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: Date.now() + 10 * 60 * 1000
            }
        );

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const fullEmail = `${user.email}@cmc.edu.vn`;

        await emailService.sendPasswordResetEmail(fullEmail, user.fullName, resetUrl);

        await ActivityLog.logUserAction(user._id, 'user_password_reset_request',
            `Yêu cầu reset password thành công`, {
                requestInfo: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                },
                metadata: {
                    email: fullEmail,
                    tokenExpires: new Date(Date.now() + 10 * 60 * 1000)
                }
            });

        res.json({
            success: true,
            message: 'Hướng dẫn thay đổi mật khẩu đã được gửi về email của bạn'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        await ActivityLog.logError(null, 'user_password_reset_request', error, {
            metadata: { email: req.body?.email }
        });
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xử lý quên mật khẩu'
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mật khẩu mới'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            await ActivityLog.logUserAction(null, 'user_password_reset',
                `Reset password thất bại: Token không hợp lệ hoặc hết hạn`, {
                    requestInfo: {
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    },
                    metadata: { token: token.substring(0, 10) + '...' }
                });

            return res.status(400).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updateOne(
            { _id: user._id },
            {
                password: hashedPassword,
                $unset: {
                    resetPasswordToken: 1,
                    resetPasswordExpires: 1
                }
            }
        );

        await ActivityLog.logUserAction(user._id, 'user_password_reset',
            `Reset password thành công`, {
                requestInfo: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });

        res.json({
            success: true,
            message: 'Mật khẩu đã được thay đổi thành công'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        await ActivityLog.logError(null, 'user_password_reset', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi reset mật khẩu'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);

        if (!isCurrentPasswordValid) {
            await ActivityLog.logUserAction(userId, 'user_password_change',
                `Đổi mật khẩu thất bại: Mật khẩu cũ không chính xác`, {
                    result: 'failure',
                    requestInfo: {
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    }
                });

            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updateOne(
            { _id: user._id },
            { password: hashedPassword }
        );

        await ActivityLog.logUserAction(userId, 'user_password_change',
            `Đổi mật khẩu thành công`, {
                requestInfo: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });

        res.json({
            success: true,
            message: 'Mật khẩu đã được thay đổi thành công'
        });

    } catch (error) {
        console.error('Change password error:', error);
        await ActivityLog.logError(req.user?.id, 'user_password_change', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thay đổi mật khẩu'
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('academicYearAccess', 'name code')
            .populate('programAccess', 'name code')
            .populate('organizationAccess', 'name code')
            .populate('standardAccess', 'name code')
            .populate('criteriaAccess', 'name code')
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get current user error:', error);
        await ActivityLog.logError(req.user?.id, 'user_profile_view', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin người dùng'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, phoneNumber, department, position, notificationSettings } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const oldData = {
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            department: user.department,
            position: user.position
        };

        const updateData = {};
        if (fullName) updateData.fullName = fullName.trim();
        if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();
        if (department) updateData.department = department.trim();
        if (position) updateData.position = position.trim();
        if (notificationSettings) updateData.notificationSettings = notificationSettings;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        await ActivityLog.logUserAction(userId, 'user_profile_update',
            `Cập nhật thông tin cá nhân`, {
                oldData,
                newData: {
                    fullName: updatedUser.fullName,
                    phoneNumber: updatedUser.phoneNumber,
                    department: updatedUser.department,
                    position: updatedUser.position
                }
            });

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        await ActivityLog.logError(req.user?.id, 'user_profile_update', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật thông tin'
        });
    }
};

module.exports = {
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    getCurrentUser,
    updateProfile
};