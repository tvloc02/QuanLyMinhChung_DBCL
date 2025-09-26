const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getStandards,
    getStandardsByProgramAndOrg,
    getStandardById,
    createStandard,
    updateStandard,
    deleteStandard,
    getStandardStatistics
} = require('../controllers/standardController');

// Validation rules
const createStandardValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên tiêu chuẩn là bắt buộc')
        .isLength({ max: 500 })
        .withMessage('Tên tiêu chuẩn không được quá 500 ký tự'),
    body('code')
        .notEmpty()
        .withMessage('Mã tiêu chuẩn là bắt buộc')
        .matches(/^\d{1,2}$/)
        .withMessage('Mã tiêu chuẩn phải là 1-2 chữ số'),
    body('description')
        .optional()
        .isLength({ max: 3000 })
        .withMessage('Mô tả không được quá 3000 ký tự'),
    body('programId')
        .notEmpty()
        .withMessage('Chương trình đánh giá là bắt buộc')
        .isMongoId()
        .withMessage('ID chương trình không hợp lệ'),
    body('organizationId')
        .notEmpty()
        .withMessage('Tổ chức - Cấp đánh giá là bắt buộc')
        .isMongoId()
        .withMessage('ID tổ chức không hợp lệ'),
    body('order')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Thứ tự phải lớn hơn 0'),
    body('weight')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Trọng số phải từ 0-100'),
    body('objectives')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Mục tiêu không được quá 2000 ký tự'),
    body('guidelines')
        .optional()
        .isLength({ max: 3000 })
        .withMessage('Hướng dẫn không được quá 3000 ký tự'),
    body('evaluationCriteria')
        .optional()
        .isArray()
        .withMessage('Tiêu chí đánh giá phải là mảng')
];

const updateStandardValidation = [
    param('id').isMongoId().withMessage('ID tiêu chuẩn không hợp lệ'),
    ...createStandardValidation.filter(rule =>
        !rule.builder.fields.includes('programId') &&
        !rule.builder.fields.includes('organizationId')
    )
];

// Routes
router.get('/statistics',
    auth,
    requireManager,
    [
        query('programId').optional().isMongoId().withMessage('ID chương trình không hợp lệ'),
        query('organizationId').optional().isMongoId().withMessage('ID tổ chức không hợp lệ')
    ],
    validation,
    getStandardStatistics
);

router.get('/by-program-org', auth, [
    query('programId')
        .notEmpty()
        .withMessage('ID chương trình là bắt buộc')
        .isMongoId()
        .withMessage('ID chương trình không hợp lệ'),
    query('organizationId')
        .notEmpty()
        .withMessage('ID tổ chức là bắt buộc')
        .isMongoId()
        .withMessage('ID tổ chức không hợp lệ')
], validation, getStandardsByProgramAndOrg);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('programId').optional().isMongoId().withMessage('ID chương trình không hợp lệ'),
    query('organizationId').optional().isMongoId().withMessage('ID tổ chức không hợp lệ'),
    query('status').optional().isIn(['draft', 'active', 'inactive', 'archived']),
    query('sortBy').optional().isIn(['order', 'code', 'name', 'createdAt', 'updatedAt']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getStandards);

router.get('/:id', auth, [
    param('id').isMongoId().withMessage('ID tiêu chuẩn không hợp lệ')
], validation, getStandardById);

router.post('/',
    auth,
    requireManager,
    createStandardValidation,
    validation,
    createStandard
);

router.put('/:id',
    auth,
    requireManager,
    updateStandardValidation,
    validation,
    updateStandard
);

router.delete('/:id',
    auth,
    requireAdmin,
    [
        param('id').isMongoId().withMessage('ID tiêu chuẩn không hợp lệ')
    ],
    validation,
    deleteStandard
);

module.exports = router;