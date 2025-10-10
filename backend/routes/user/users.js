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
    addUserToGroups,
    removeUserFromGroups,
    grantUserPermission,
    denyUserPermission,
    removeUserPermission,
    lockUser,
    unlockUser
} = require('../../controllers/user/userController');

router.get('/statistics', auth, requireManager, getUserStatistics);

router.get('/', auth, requireManager, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('role').optional().isIn(['admin', 'manager', 'expert', 'advisor']),
    query('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']),
    query('groupId').optional().isMongoId(),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'fullName', 'lastLogin']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getUsers);

router.get('/:id', auth, requireManager, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ')
], validation, getUserById);

router.post('/',
    auth,
    requireAdmin,
    [
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
        body('userGroups')
            .optional()
            .isArray()
            .withMessage('Nhóm người dùng phải là mảng'),
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
        body('userGroups')
            .optional()
            .isArray()
            .withMessage('Nhóm người dùng phải là mảng'),
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

router.post('/:id/groups', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ'),
    body('groupIds')
        .isArray()
        .withMessage('groupIds phải là mảng')
        .notEmpty()
        .withMessage('groupIds không được rỗng')
], validation, addUserToGroups);

router.delete('/:id/groups', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID người dùng không hợp lệ'),
    body('groupIds')
        .isArray()
        .withMessage('groupIds phải là mảng')
        .notEmpty()
        .withMessage('groupIds không được rỗng')
], validation, removeUserFromGroups);

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