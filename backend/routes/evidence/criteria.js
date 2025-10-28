const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const { attachCurrentAcademicYear } = require('../../middleware/academicYear');
const validation = require('../../middleware/validation');
const {
    getCriteria,
    getCriteriaByStandard,
    getCriteriaById,
    createCriteria,
    updateCriteria,
    deleteCriteria,
    getCriteriaStatistics
} = require('../../controllers/evidence/criteriaController');

router.use(auth, attachCurrentAcademicYear);

// Validation rules
const createCriteriaValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên tiêu chí là bắt buộc')
        .isLength({ max: 500 })
        .withMessage('Tên tiêu chí không được quá 500 ký tự'),
    body('code')
        .optional()
        .matches(/^\d{1,2}$/)
        .withMessage('Mã tiêu chí phải là số từ 1-99'),
    body('autoGenerateCode')
        .optional()
        .isBoolean()
        .withMessage('autoGenerateCode phải là boolean'),
    body('standardId')
        .notEmpty()
        .withMessage('Tiêu chuẩn là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chuẩn không hợp lệ'),
    body('requirements')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Yêu cầu không được quá 2000 ký tự'),
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
    requireManager,
    [
        query('programId').optional().isMongoId().withMessage('ID chương trình không hợp lệ'),
        query('organizationId').optional().isMongoId().withMessage('ID tổ chức không hợp lệ'),
        query('standardId').optional().isMongoId().withMessage('ID tiêu chuẩn không hợp lệ')
    ],
    validation,
    getCriteriaStatistics
);

router.get('/by-standard', [
    query('standardId')
        .notEmpty()
        .withMessage('ID tiêu chuẩn là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chuẩn không hợp lệ')
], validation, getCriteriaByStandard);

router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('standardId').optional().isMongoId().withMessage('ID tiêu chuẩn không hợp lệ'),
    query('programId').optional().isMongoId().withMessage('ID chương trình không hợp lệ'),
    query('organizationId').optional().isMongoId().withMessage('ID tổ chức không hợp lệ'),
    query('status').optional().isIn(['draft', 'active', 'inactive', 'archived']),
    query('sortBy').optional().isIn(['code', 'name', 'createdAt', 'updatedAt']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getCriteria);

router.get('/:id', [
    param('id').isMongoId().withMessage('ID tiêu chí không hợp lệ')
], validation, getCriteriaById);

router.post('/',
    requireManager,
    createCriteriaValidation,
    validation,
    createCriteria
);

router.put('/:id',
    requireManager,
    updateCriteriaValidation,
    validation,
    updateCriteria
);

router.delete('/:id',
    requireAdmin,
    [
        param('id').isMongoId().withMessage('ID tiêu chí không hợp lệ')
    ],
    validation,
    deleteCriteria
);

module.exports = router;