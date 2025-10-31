const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireManager, requireAdmin } = require('../../middleware/auth');
const { attachCurrentAcademicYear } = require('../../middleware/academicYear');
const validation = require('../../middleware/validation');
const {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    submitReport,
    reviewReport,
    getTaskByCriteria
} = require('../../controllers/Task/taskController');

router.use(auth, attachCurrentAcademicYear);

const createTaskValidation = [
    body('description')
        .notEmpty()
        .withMessage('Mô tả là bắt buộc')
        .isLength({ max: 3000 })
        .withMessage('Mô tả không được quá 3000 ký tự'),
    body('standardId')
        .notEmpty()
        .withMessage('Tiêu chuẩn là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chuẩn không hợp lệ'),
    body('criteriaId')
        .optional({ checkFalsy: true })
        .isMongoId()
        .withMessage('ID tiêu chí không hợp lệ'),
    body('assignedTo')
        .isArray({ min: 1 })
        .withMessage('Phải chọn ít nhất một người được giao'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày hết hạn không hợp lệ'),
    body('reportType')
        .notEmpty()
        .withMessage('Loại báo cáo là bắt buộc')
        .isIn(['overall_tdg', 'standard', 'criteria'])
        .withMessage('Loại báo cáo không hợp lệ (overall_tdg, standard, hoặc criteria)')
];

const updateTaskValidation = [
    param('id').isMongoId().withMessage('ID nhiệm vụ không hợp lệ'),
    body('description')
        .optional()
        .isLength({ max: 3000 })
        .withMessage('Mô tả không được quá 3000 ký tự'),
    body('assignedTo')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Phải chọn ít nhất một người được giao'),
    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày hết hạn không hợp lệ')
];

router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('standardId').optional().isMongoId().withMessage('ID tiêu chuẩn không hợp lệ'),
    query('criteriaId').optional().isMongoId().withMessage('ID tiêu chí không hợp lệ'),
    query('status').optional().isIn(['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'completed']),
    query('assignedTo').optional().isMongoId().withMessage('ID người được giao không hợp lệ'),
    query('sortBy').optional().isIn(['taskCode', 'createdAt', 'dueDate']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getTasks);

router.get('/by-criteria', [
    query('criteriaId')
        .notEmpty()
        .withMessage('ID tiêu chí là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chí không hợp lệ')
], validation, getTaskByCriteria);

router.get('/:id', [
    param('id').isMongoId().withMessage('ID nhiệm vụ không hợp lệ')
], validation, getTaskById);

router.post('/',
    requireManager,
    createTaskValidation,
    validation,
    createTask
);

router.put('/:id',
    requireManager,
    updateTaskValidation,
    validation,
    updateTask
);

router.delete('/:id',
    requireManager,
    [param('id').isMongoId().withMessage('ID nhiệm vụ không hợp lệ')],
    validation,
    deleteTask
);

router.post('/:id/submit-report', [
    param('id').isMongoId().withMessage('ID nhiệm vụ không hợp lệ'),
    body('reportId')
        .notEmpty()
        .withMessage('ID báo cáo là bắt buộc')
        .isMongoId()
        .withMessage('ID báo cáo không hợp lệ')
], validation, submitReport);

router.post('/:id/review-report',
    requireManager,
    [
        param('id').isMongoId().withMessage('ID nhiệm vụ không hợp lệ'),
        body('approved')
            .isBoolean()
            .withMessage('approved phải là boolean'),
        body('rejectionReason')
            .if(body('approved').equals('false'))
            .notEmpty()
            .withMessage('Lý do từ chối là bắt buộc khi từ chối'),
        body('rejectionReason')
            .optional()
            .isLength({ max: 2000 })
            .withMessage('Lý do từ chối không được quá 2000 ký tự')
    ],
    validation,
    reviewReport
);

module.exports = router;