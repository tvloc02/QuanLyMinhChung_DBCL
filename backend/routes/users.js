const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    updateUserStatus,
    updateUserPermissions,
    getUserStatistics
} = require('../controllers/userController');

const createUserValidation = [
    body('email')
        .notEmpty()
        .withMessage('Email là bắt buộc')
        .trim()
        .custom((value) => {
            const cleanEmail = value.replace('@cmcu.edu.vn', '').replace('@cmc.edu.vn', '');
            if (!/^[a-zA-Z0-9]+$/.test(cleanEmail)) {
                throw new Error('Email không hợp lệ');
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
        .isIn(['admin', 'manager', 'expert', 'advisor'])
        .withMessage('Vai trò không hợp lệ'),
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
];

const updateUserValidation = [
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
        .isIn(['admin', 'manager', 'expert', 'advisor'])
        .withMessage('Vai trò không hợp lệ'),
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
];

router.get('/statistics', auth, requireManager, getUserStatistics);

router.get('/', auth, requireManager, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('role').optional().isIn(['admin', 'manager', 'expert', 'advisor']),
    query('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'fullName', 'lastLogin']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getUsers);

router.get('/:id', auth, requireManager, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ')
], validation, getUserById);

router.post('/',
    auth,
    requireAdmin,
    createUserValidation,
    validation,
    createUser
);

router.put('/:id',
    auth,
    requireAdmin,
    updateUserValidation,
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

module.exports = router;