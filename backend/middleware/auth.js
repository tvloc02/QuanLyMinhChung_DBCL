const jwt = require('jsonwebtoken');
const User = require('../models/User/User');

const auth = async (req, res, next) => {
    try {
        let token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không có token, truy cập bị từ chối'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId)
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
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Cần đăng nhập' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ quản trị viên mới có quyền'
        });
    }
    next();
};

const requireManager = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Cần đăng nhập' });
    }
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Cần quyền manager trở lên để thực hiện thao tác này'
        });
    }
    next();
};

const requireReporter = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Cần đăng nhập' });
    }
    if (req.user.role !== 'reporter') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ báo cáo viên mới có quyền'
        });
    }
    next();
};

const requireEvaluator = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Cần đăng nhập' });
    }
    if (req.user.role !== 'evaluator') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ chuyên gia đánh giá mới có quyền'
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

const checkTaskAssignment = async (req, res, next) => {
    try {
        const Task = require('../models/Task/Task');
        const { id } = req.params;
        const userId = req.user.id;

        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhiệm vụ'
            });
        }

        const isAssigned = task.assignedTo.some(uid => uid.toString() === userId);

        if (!isAssigned && req.user.role === 'reporter') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không được giao nhiệm vụ này'
            });
        }

        req.task = task;
        next();
    } catch (error) {
        console.error('Task Assignment Check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền hạn nhiệm vụ'
        });
    }
};

const checkTaskStatus = (allowedStatuses = []) => {
    return (req, res, next) => {
        if (req.task && !allowedStatuses.includes(req.task.status)) {
            return res.status(400).json({
                success: false,
                message: `Không thể thực hiện action này ở trạng thái ${req.task.status}`
            });
        }
        next();
    };
};


module.exports = {
    auth,
    requirePermission,
    requireAllPermissions,
    requireAnyPermission,
    requireModulePermission,
    requireAdmin,
    requireManager,
    requireReporter,
    requireEvaluator,
    checkStandardAccess,
    checkCriteriaAccess,
    attachPermissions,
    checkTaskAssignment,
    checkTaskStatus
};