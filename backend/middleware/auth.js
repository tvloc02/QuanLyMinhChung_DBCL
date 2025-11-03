const jwt = require('jsonwebtoken');
const User = require('../models/User/User');

// Middleware xác thực token và đính kèm thông tin người dùng (Auth)
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
            // Đã xóa khối .populate({ path: 'userGroups', ... }) gây lỗi MissingSchemaError
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


// Kiểm tra quyền cụ thể (Single Permission)
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

// Yêu cầu tất cả các quyền trong danh sách (All Permissions)
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

// Yêu cầu bất kỳ quyền nào trong danh sách (Any Permission)
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

// Kiểm tra quyền Module (module.action)
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


// Yêu cầu quyền Admin (chỉ dùng cho mục đích backward compatibility, nên dùng requireModulePermission)
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

// Yêu cầu quyền Manager hoặc Admin (chỉ dùng cho mục đích backward compatibility)
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

// Yêu cầu quyền Reporter
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

// Yêu cầu quyền Evaluator
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

// Kiểm tra quyền truy cập tiêu chuẩn
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

// Kiểm tra quyền truy cập tiêu chí
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

// Đính kèm tất cả permissions vào req.userPermissions
const attachPermissions = async (req, res, next) => {
    try {
        if (req.user) {
            // Đảm bảo req.user đã tồn tại từ middleware 'auth'
            req.userPermissions = await req.user.getAllPermissions();
        }
        next();
    } catch (error) {
        console.error('Attach permissions error:', error);
        next();
    }
};

// Kiểm tra xem user có trong danh sách được giao nhiệm vụ không
const checkTaskAssignment = async (req, res, next) => {
    try {
        const Task = require('../models/Task/Task');
        // Giả định Task ID được truyền qua params
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

        // Reporter chỉ được xem task nếu được giao
        if (!isAssigned && req.user.role === 'reporter') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không được giao nhiệm vụ này'
            });
        }

        req.task = task;
        next();
    } catch (error) {
        // Thêm log chi tiết hơn để debug
        console.error('Task Assignment Check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền hạn nhiệm vụ'
        });
    }
};

// Kiểm tra trạng thái nhiệm vụ cho phép thực hiện action
const checkTaskStatus = (allowedStatuses = []) => {
    return (req, res, next) => {
        // req.task được đính kèm bởi checkTaskAssignment
        if (req.task && !allowedStatuses.includes(req.task.status)) {
            return res.status(400).json({
                success: false,
                message: `Không thể thực hiện action này ở trạng thái ${req.task.status}`
            });
        }
        next();
    };
};


// Hợp nhất và export tất cả các middleware
module.exports = {
    auth,
    requirePermission,
    requireAllPermissions,
    requireAnyPermission,
    requireModulePermission,
    requireAdmin,
    requireManager,
    requireReporter, // Đã thêm
    requireEvaluator, // Đã thêm
    checkStandardAccess,
    checkCriteriaAccess,
    attachPermissions,
    checkTaskAssignment, // Đã thêm
    checkTaskStatus // Đã thêm
};