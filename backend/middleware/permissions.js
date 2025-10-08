const jwt = require('jsonwebtoken');
const User = require('../models/User/User');

// Middleware xác thực user (giữ nguyên từ code cũ)
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không có token, truy cập bị từ chối'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId)
            .populate({
                path: 'userGroups',
                match: { status: 'active' },
                populate: {
                    path: 'permissions',
                    match: { status: 'active' }
                }
            })
            .populate('individualPermissions.permission')
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ, người dùng không tồn tại'
            });
        }

        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi xác thực'
        });
    }
};

// Middleware kiểm tra quyền cụ thể
const requirePermission = (permissionCode) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Chưa xác thực'
                });
            }

            const hasPermission = await req.user.hasPermission(permissionCode);

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Không có quyền: ${permissionCode}`,
                    requiredPermission: permissionCode
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi kiểm tra quyền'
            });
        }
    };
};

// Middleware kiểm tra nhiều quyền (AND logic - cần có tất cả)
const requireAllPermissions = (permissionCodes) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Chưa xác thực'
                });
            }

            const hasAll = await req.user.hasAllPermissions(permissionCodes);

            if (!hasAll) {
                return res.status(403).json({
                    success: false,
                    message: 'Không đủ quyền truy cập',
                    requiredPermissions: permissionCodes
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi kiểm tra quyền'
            });
        }
    };
};

// Middleware kiểm tra ít nhất một quyền (OR logic - chỉ cần một trong các quyền)
const requireAnyPermission = (permissionCodes) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Chưa xác thực'
                });
            }

            const hasAny = await req.user.hasAnyPermission(permissionCodes);

            if (!hasAny) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền truy cập',
                    requiredAnyOf: permissionCodes
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi kiểm tra quyền'
            });
        }
    };
};

// Middleware kiểm tra quyền trên module
const requireModulePermission = (module, action = null) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Chưa xác thực'
                });
            }

            const hasPermission = await req.user.hasModulePermission(module, action);

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Không có quyền truy cập module: ${module}${action ? '.' + action : ''}`,
                    requiredModule: module,
                    requiredAction: action
                });
            }

            next();
        } catch (error) {
            console.error('Module permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi kiểm tra quyền module'
            });
        }
    };
};

// GIỮ LẠI các middleware cũ để tương thích ngược
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin mới có quyền thực hiện thao tác này'
        });
    }
    next();
};

const requireManager = (req, res, next) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Cần quyền manager trở lên để thực hiện thao tác này'
        });
    }
    next();
};

// Middleware để gán permissions vào req để sử dụng trong controller
const attachPermissions = async (req, res, next) => {
    try {
        if (req.user) {
            req.userPermissions = await req.user.getAllPermissions();
        }
        next();
    } catch (error) {
        console.error('Attach permissions error:', error);
        next(); // Vẫn tiếp tục, không block request
    }
};

module.exports = {
    auth,
    requirePermission,
    requireAllPermissions,
    requireAnyPermission,
    requireModulePermission,
    requireAdmin,
    requireManager,
    attachPermissions
};