const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
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

        // Tìm user theo email (username)
        const username = email.split('@')[0].toLowerCase().trim();
        console.log('🔍 Searching for username:', username);

        const user = await User.findOne({ email: username });

        if (!user) {
            console.log('❌ User not found');
            // Debug: Show available users
            const availableUsers = await User.find({}, 'email fullName').lean();
            console.log('📋 Available users:', availableUsers);

            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập không tồn tại'
            });
        }

        console.log('✅ User found:', { email: user.email, fullName: user.fullName });

        // Kiểm tra status
        if (user.status !== 'active') {
            console.log('❌ User status:', user.status);
            return res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
            });
        }

        // Kiểm tra password
        console.log('🔑 Checking password...');
        console.log('🔑 Stored password starts with:', user.password?.substring(0, 10) + '...');

        let isPasswordValid = false;

        try {
            // Kiểm tra xem có phải bcrypt hash không
            const isBcryptHash = user.password && user.password.startsWith('$2');
            console.log('🔑 Is bcrypt hash:', isBcryptHash);

            if (isBcryptHash) {
                // Sử dụng bcrypt compare
                isPasswordValid = await bcrypt.compare(password, user.password);
                console.log('🔑 Bcrypt comparison result:', isPasswordValid);
            } else {
                // Fallback: plaintext comparison
                isPasswordValid = (password === user.password);
                console.log('🔑 Plaintext comparison result:', isPasswordValid);

                // Nếu match và là plaintext, upgrade sang bcrypt
                if (isPasswordValid) {
                    console.log('🔄 Upgrading plaintext password to bcrypt...');
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);

                    await User.updateOne(
                        { _id: user._id },
                        { password: hashedPassword }
                    );
                    console.log('✅ Password upgraded successfully');
                }
            }
        } catch (passwordError) {
            console.error('❌ Password check error:', passwordError);
            isPasswordValid = false;
        }

        if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu không chính xác'
            });
        }

        console.log('✅ Login successful');

        // Cập nhật lastLogin
        await User.updateOne(
            { _id: user._id },
            { lastLogin: new Date() }
        );

        // Tạo token
        const token = generateToken(user._id);

        // Tạo response (loại bỏ sensitive data)
        const userResponse = {
            _id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            status: user.status,
            department: user.department,
            position: user.position,
            phoneNumber: user.phoneNumber,
            standardAccess: user.standardAccess,
            criteriaAccess: user.criteriaAccess,
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
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đăng nhập'
        });
    }
};

const logout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    } catch (error) {
        console.error('Logout error:', error);
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
            return res.status(404).json({
                success: false,
                message: 'Email không tồn tại trong hệ thống'
            });
        }

        // Tạo reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Cập nhật user với reset token
        await User.updateOne(
            { _id: user._id },
            {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: Date.now() + 10 * 60 * 1000 // 10 phút
            }
        );

        // Gửi email reset
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const fullEmail = `${user.email}@cmc.edu.vn`;

        await emailService.sendPasswordResetEmail(fullEmail, user.fullName, resetUrl);

        res.json({
            success: true,
            message: 'Hướng dẫn thay đổi mật khẩu đã được gửi về email của bạn'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
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

        // Hash token để so sánh
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Tìm user với token hợp lệ và chưa hết hạn
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

        // Hash password mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật password và xóa reset token
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

        res.json({
            success: true,
            message: 'Mật khẩu đã được thay đổi thành công'
        });

    } catch (error) {
        console.error('Reset password error:', error);
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

        // Kiểm tra mật khẩu hiện tại
        let isCurrentPasswordValid = false;
        const isBcryptHash = user.password && user.password.startsWith('$2');

        if (isBcryptHash) {
            isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        } else {
            isCurrentPasswordValid = (currentPassword === user.password);
        }

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updateOne(
            { _id: user._id },
            { password: hashedPassword }
        );

        res.json({
            success: true,
            message: 'Mật khẩu đã được thay đổi thành công'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thay đổi mật khẩu'
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
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
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin người dùng'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, phoneNumber, department, position } = req.body;

        const updateData = {};
        if (fullName) updateData.fullName = fullName.trim();
        if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();
        if (department) updateData.department = department.trim();
        if (position) updateData.position = position.trim();

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: user
        });

    } catch (error) {
        console.error('Update profile error:', error);
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