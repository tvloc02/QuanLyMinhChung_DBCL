const jwt = require('jsonwebtoken');
const User = require('../models/User/User');

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

        // 🔍 DEBUG: In decoded token
        console.log('🔍 [AUTH] Decoded token:', {
            userId: decoded.userId,
            role: decoded.role,
            email: decoded.email
        });

        const user = await User.findById(decoded.userId)
            .populate({
                match: { status: 'active' },
                populate: {
                    match: { status: 'active' }
                }
            })
            .populate('individualPermissions.permission')
            .populate('standardAccess', 'name code')
            .populate('criteriaAccess', 'name code')
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

        // ✅ FIX: Đảm bảo req.user có đầy đủ thông tin từ token
        req.user = user;

        // 🔍 DEBUG: In user info sau khi set
        console.log('✅ [AUTH] User info set:', {
            userId: req.user._id,
            role: req.user.role,
            email: req.user.email,
            fullName: req.user.fullName
        });

        next();

    } catch (error) {
        console.error('❌ Auth middleware error:', error);

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


// Kiểm tra quyền cụ thể
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


const requireAdmin = (req, res, next) => {
    console.log('🔍 [REQUIRE ADMIN] User role:', req.user?.role);

    if (!['admin', 'supervisor', 'advisor'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Chỉ admin, supervisor hoặc advisor mới có quyền thực hiện thao tác này'
        });
    }
    next();
};

const requireManager = (req, res, next) => {
    console.log('🔍 [REQUIRE MANAGER] User role:', req.user?.role);

    if (!['admin', 'manager', 'supervisor', 'advisor'].includes(req.user.role)) { // Dòng này đã đúng
        return res.status(403).json({
            success: false,
            message: 'Cần quyền quản lý cấp cao (admin, manager, supervisor, advisor) để thực hiện thao tác này'
        });
    }
    next();
};


const checkStandardAccess = (standardId) => {
    return (req, res, next) => {
        if (req.user.role === 'admin') {
            return next();
        }

        if (!req.user.hasStandardAccess(standardId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập tiêu chuẩn này'
            });
        }

        next();
    };
};

const checkCriteriaAccess = (criteriaId) => {
    return (req, res, next) => {
        if (req.user.role === 'admin') {
            return next();
        }

        if (!req.user.hasCriteriaAccess(criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập tiêu chí này'
            });
        }

        next();
    };
};

const attachPermissions = async (req, res, next) => {
    try {
        if (req.user) {
            req.userPermissions = await req.user.getAllPermissions();
        }
        next();
    } catch (error) {
        console.error('Attach permissions error:', error);
        next();
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
    checkStandardAccess,
    checkCriteriaAccess,
    attachPermissions
};