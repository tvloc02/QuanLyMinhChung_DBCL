const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const {
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
    grantUserPermission,
    denyUserPermission,
    removeUserPermission,
    lockUser,
    unlockUser
} = require('../../controllers/user/userController');

// Thống kê người dùng
router.get('/statistics', auth, requireManager, getUserStatistics);

// SỬA LỖI 403: Xóa requireManager để cho phép các vai trò khác (như Reporter) lấy danh sách
router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('role').optional().isIn(['admin', 'manager', 'reporter', 'evaluator']),
    query('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'fullName', 'lastLogin']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getUsers);

router.get('/experts', auth, requireManager, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('sortBy').optional().isIn(['createdAt', 'fullName']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getUsers);

router.get('/:id', auth, requireManager, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ')
], validation, getUserById);

// Các routes sau giữ nguyên requireAdmin/requireManager
router.post('/',
    auth,
    requireAdmin,
    [
        body('email')
            .notEmpty()
            .withMessage('Email là bắt buộc')
            .trim()
            .custom((value) => {
                const fullEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                const usernameRegex = /^[a-zA-Z0-9]+$/;

                if (!fullEmailRegex.test(value) && !usernameRegex.test(value)) {
                    throw new Error('Email không hợp lệ. Nhập email đầy đủ hoặc username');
                }
                return true;
            }),
        body('fullName')
            .notEmpty()
            .withMessage('Họ tên là bắt buộc')
            .isLength({ min: 2, max: 100 })
            .withMessage('Họ tên phải có từ 2-100 ký tự'),
        body('password')
            .optional()
            .isLength({ min: 6 })
            .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
        body('phoneNumber')
            .optional()
            .matches(/^[0-9]{10,11}$/)
            .withMessage('Số điện thoại không hợp lệ'),
        body('role')
            .optional()
            .isIn(['admin', 'manager', 'reporter', 'evaluator'])
            .withMessage('Vai trò không hợp lệ'),
        body('roles')
            .optional()
            .isArray()
            .withMessage('Roles phải là mảng'),
        body('status')
            .optional()
            .isIn(['active', 'inactive', 'suspended', 'pending'])
            .withMessage('Trạng thái không hợp lệ'),
        body('department')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Phòng ban không được quá 100 ký tự'),
        body('position')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Chức vụ không được quá 100 ký tự'),
        body('expertise')
            .optional()
            .isArray()
            .withMessage('Lĩnh vực chuyên môn phải là mảng'),
        body('mustChangePassword')
            .optional()
            .isBoolean()
            .withMessage('mustChangePassword phải là boolean'),
        body('academicYearAccess')
            .optional()
            .isArray()
            .withMessage('Quyền năm học phải là mảng'),
        body('programAccess')
            .optional()
            .isArray()
            .withMessage('Quyền chương trình phải là mảng'),
        body('organizationAccess')
            .optional()
            .isArray()
            .withMessage('Quyền tổ chức phải là mảng'),
        body('standardAccess')
            .optional()
            .isArray()
            .withMessage('Quyền tiêu chuẩn phải là mảng'),
        body('criteriaAccess')
            .optional()
            .isArray()
            .withMessage('Quyền tiêu chí phải là mảng'),
        body('notificationSettings')
            .optional()
            .isObject()
            .withMessage('Cài đặt thông báo phải là object')
    ],
    validation,
    createUser
);

router.put('/:id',
    auth,
    requireAdmin,
    [
        param('id').isMongoId().withMessage('ID người dùng không hợp lệ'),
        body('fullName')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Họ tên phải có từ 2-100 ký tự'),
        body('phoneNumber')
            .optional()
            .matches(/^[0-9]{10,11}$/)
            .withMessage('Số điện thoại không hợp lệ'),
        body('role')
            .optional()
            .isIn(['admin', 'manager', 'reporter', 'evaluator'])
            .withMessage('Vai trò không hợp lệ'),
        body('roles')
            .optional()
            .isArray()
            .withMessage('Roles phải là mảng'),
        body('department')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Phòng ban không được quá 100 ký tự'),
        body('position')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Chức vụ không được quá 100 ký tự'),
        body('expertise')
            .optional()
            .isArray()
            .withMessage('Lĩnh vực chuyên môn phải là mảng'),
        body('academicYearAccess')
            .optional()
            .isArray()
            .withMessage('Quyền năm học phải là mảng'),
        body('programAccess')
            .optional()
            .isArray()
            .withMessage('Quyền chương trình phải là mảng'),
        body('organizationAccess')
            .optional()
            .isArray()
            .withMessage('Quyền tổ chức phải là mảng'),
        body('standardAccess')
            .optional()
            .isArray()
            .withMessage('Quyền tiêu chuẩn phải là mảng'),
        body('criteriaAccess')
            .optional()
            .isArray()
            .withMessage('Quyền tiêu chí phải là mảng'),
        body('notificationSettings')
            .optional()
            .isObject()
            .withMessage('Cài đặt thông báo phải là object')
    ],
    validation,
    updateUser
);

router.delete('/:id', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ')
], validation, deleteUser);

router.post('/:id/reset-password', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ')
], validation, resetUserPassword);

router.patch('/:id/status', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ'),
    body('status')
        .isIn(['active', 'inactive', 'suspended', 'pending'])
        .withMessage('Trạng thái không hợp lệ')
], validation, updateUserStatus);

router.post('/:id/lock', auth, requireAdmin, [
    param('id').isMongoId(),
    body('reason').optional().trim()
], validation, lockUser);

router.post('/:id/unlock', auth, requireAdmin, [
    param('id').isMongoId()
], validation, unlockUser);

router.put('/:id/permissions', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ'),
    body('academicYearAccess')
        .optional()
        .isArray()
        .withMessage('Quyền năm học phải là mảng'),
    body('programAccess')
        .optional()
        .isArray()
        .withMessage('Quyền chương trình phải là mảng'),
    body('organizationAccess')
        .optional()
        .isArray()
        .withMessage('Quyền tổ chức phải là mảng'),
    body('standardAccess')
        .optional()
        .isArray()
        .withMessage('Quyền tiêu chuẩn phải là mảng'),
    body('criteriaAccess')
        .optional()
        .isArray()
        .withMessage('Quyền tiêu chí phải là mảng')
], validation, updateUserPermissions);

router.get('/:id/permissions', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ')
], validation, getUserPermissions);

router.post('/:id/permissions/grant', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ'),
    body('permissionId')
        .isMongoId()
        .withMessage('permissionId không hợp lệ')
], validation, grantUserPermission);

router.post('/:id/permissions/deny', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ'),
    body('permissionId')
        .isMongoId()
        .withMessage('permissionId không hợp lệ')
], validation, denyUserPermission);

router.delete('/:id/permissions', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ'),
    body('permissionId')
        .isMongoId()
        .withMessage('permissionId không hợp lệ')
], validation, removeUserPermission);


module.exports = router;