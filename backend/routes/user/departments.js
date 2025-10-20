const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    addMemberToDepartment,
    removeMemberFromDepartment,
    updateMemberRole,
    updateDepartmentStatus
} = require('../../controllers/user/departmentController');

// Get all departments
router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('status').optional().isIn(['active', 'inactive']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getDepartments);

// Get department by ID
router.get('/:id', auth, [
    param('id').isMongoId().withMessage('ID phòng ban không hợp lệ')
], validation, getDepartmentById);

// Create department
router.post('/', auth, requireAdmin, [
    body('name')
        .notEmpty()
        .withMessage('Tên phòng ban là bắt buộc')
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên phòng ban phải có từ 2-100 ký tự'),
    body('code')
        .notEmpty()
        .withMessage('Mã phòng ban là bắt buộc')
        .isLength({ min: 2, max: 20 })
        .withMessage('Mã phòng ban phải có từ 2-20 ký tự')
        .matches(/^[A-Z0-9_-]+$/)
        .withMessage('Mã phòng ban chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự'),
    body('manager')
        .optional()
        .isMongoId()
        .withMessage('Manager ID không hợp lệ')
], validation, createDepartment);

// Update department
router.put('/:id', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID phòng ban không hợp lệ'),
    body('name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên phòng ban phải có từ 2-100 ký tự'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự'),
    body('manager')
        .optional()
        .isMongoId()
        .withMessage('Manager ID không hợp lệ')
], validation, updateDepartment);

// Update department status
router.patch('/:id/status', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID phòng ban không hợp lệ'),
    body('status')
        .isIn(['active', 'inactive'])
        .withMessage('Trạng thái không hợp lệ')
], validation, updateDepartmentStatus);

// Delete department
router.delete('/:id', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID phòng ban không hợp lệ')
], validation, deleteDepartment);

// Add member to department
router.post('/:id/members', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID phòng ban không hợp lệ'),
    body('userId')
        .isMongoId()
        .withMessage('User ID không hợp lệ'),
    body('role')
        .isIn(['manager', 'tdg', 'expert'])
        .withMessage('Vai trò không hợp lệ')
], validation, addMemberToDepartment);

// Remove member from department
router.delete('/:id/members', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID phòng ban không hợp lệ'),
    body('userId')
        .isMongoId()
        .withMessage('User ID không hợp lệ')
], validation, removeMemberFromDepartment);

// Update member role
router.patch('/:id/members/role', auth, requireAdmin, [
    param('id').isMongoId().withMessage('ID phòng ban không hợp lệ'),
    body('userId')
        .isMongoId()
        .withMessage('User ID không hợp lệ'),
    body('role')
        .isIn(['manager', 'tdg', 'expert'])
        .withMessage('Vai trò không hợp lệ')
], validation, updateMemberRole);

module.exports = router;