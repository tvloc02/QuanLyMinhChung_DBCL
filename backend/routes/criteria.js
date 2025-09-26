const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getCriteria,
    getCriteriaByStandard,
    getCriteriaById,
    createCriteria,
    updateCriteria,
    deleteCriteria,
    getCriteriaStatistics
} = require('../controllers/criteriaController');

// Validation rules
const createCriteriaValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên tiêu chí là bắt buộc')
        .isLength({ max: 500 })
        .withMessage('Tên tiêu chí không được quá 500 ký tự'),
    body('code')
        .notEmpty()
        .withMessage('Mã tiêu chí là bắt buộc')
        .matches(/^\d{1,2}$/)
        .withMessage('Mã tiêu chí phải là 1-2 chữ số'),
    body('description')
        .optional()
        .isLength({ max: 3000 })
        .withMessage('Mô tả không được quá 3000 ký tự'),
    body('standardId')
        .notEmpty()
        .withMessage('Tiêu chuẩn là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chuẩn không hợp lệ'),
    body('order')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Thứ tự phải lớn hơn 0'),
    body('weight')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Trọng số phải từ 0-100'),
    body('type')
        .optional()
        .isIn(['mandatory', 'optional', 'conditional'])
        .withMessage('Loại tiêu chí không hợp lệ'),
    body('requirements')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Yêu cầu không được quá 2000 ký tự'),
    body('guidelines')
        .optional()
        .isLength({ max: 3000 })
        .withMessage('Hướng dẫn không được quá 3000 ký tự'),
    body('indicators')
        .optional()
        .isArray()
        .withMessage('Chỉ số phải là mảng')
];

const updateCriteriaValidation = [
    param('id').isMongoId().withMessage('ID tiêu chí không hợp lệ'),
    ...createCriteriaValidation.filter(rule =>
        !rule.builder.fields.includes('standardId')
    )
];

// Routes
router.get('/statistics',
    auth,
    requireManager,
    [
        query('programId').optional().isMongoId().withMessage('ID chương trình không hợp lệ'),
        query('organizationId').optional().isMongoId().withMessage('ID tổ chức không hợp lệ'),
        query('standardId').optional().isMongoId().withMessage('ID tiêu chuẩn không hợp lệ')
    ],
    validation,
    getCriteriaStatistics
);

router.get('/by-standard', auth, [
    query('standardId')
        .notEmpty()
        .withMessage('ID tiêu chuẩn là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chuẩn không hợp lệ')
], validation, getCriteriaByStandard);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('standardId').optional().isMongoId().withMessage('ID tiêu chuẩn không hợp lệ'),
    query('programId').optional().isMongoId().withMessage('ID chương trình không hợp lệ'),
    query('organizationId').optional().isMongoId().withMessage('ID tổ chức không hợp lệ'),
    query('status').optional().isIn(['draft', 'active', 'inactive', 'archived']),
    query('type').optional().isIn(['mandatory', 'optional', 'conditional']),
    query('sortBy').optional().isIn(['order', 'code', 'name', 'createdAt', 'updatedAt']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getCriteria);

router.get('/:id', auth, [
    param('id').isMongoId().withMessage('ID tiêu chí không hợp lệ')
], validation, getCriteriaById);

router.post('/',
    auth,
    requireManager,
    createCriteriaValidation,
    validation,
    createCriteria
);

router.put('/:id',
    auth,
    requireManager,
    updateCriteriaValidation,
    validation,
    updateCriteria
);

router.delete('/:id',
    auth,
    requireAdmin,
    [
        param('id').isMongoId().withMessage('ID tiêu chí không hợp lệ')
    ],
    validation,
    deleteCriteria
);

module.exports = router;