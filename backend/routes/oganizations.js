const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getOrganizations,
    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationStatistics
} = require('../controllers/organizationController');

// Validation rules
const createOrganizationValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên tổ chức là bắt buộc')
        .isLength({ max: 300 })
        .withMessage('Tên tổ chức không được quá 300 ký tự'),
    body('code')
        .notEmpty()
        .withMessage('Mã tổ chức là bắt buộc')
        .isLength({ max: 20 })
        .withMessage('Mã tổ chức không được quá 20 ký tự')
        .matches(/^[A-Z0-9\-_]+$/)
        .withMessage('Mã tổ chức chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới'),
    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được quá 2000 ký tự'),
    body('level')
        .isIn(['national', 'international', 'regional', 'institutional'])
        .withMessage('Cấp độ không hợp lệ'),
    body('type')
        .isIn(['government', 'education', 'professional', 'international', 'other'])
        .withMessage('Loại tổ chức không hợp lệ'),
    body('website')
        .optional()
        .isURL()
        .withMessage('Website không hợp lệ'),
    body('contactEmail')
        .optional()
        .isEmail()
        .withMessage('Email liên hệ không hợp lệ'),
    body('contactPhone')
        .optional()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Số điện thoại không hợp lệ'),
    body('address')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Địa chỉ không được quá 500 ký tự'),
    body('country')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Tên quốc gia không được quá 100 ký tự')
];

const updateOrganizationValidation = [
    param('id').isMongoId().withMessage('ID tổ chức không hợp lệ'),
    ...createOrganizationValidation.filter(rule =>
        !rule.builder.fields.includes('code') // Không cho phép thay đổi mã
    )
];

// Routes
router.get('/statistics',
    auth,
    requireManager,
    getOrganizationStatistics
);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('level').optional().isIn(['national', 'international', 'regional', 'institutional']),
    query('type').optional().isIn(['government', 'education', 'professional', 'international', 'other']),
    query('status').optional().isIn(['active', 'inactive', 'suspended']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'code']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getOrganizations);

router.get('/all', auth, getAllOrganizations);

router.get('/:id', auth, [
    param('id').isMongoId().withMessage('ID tổ chức không hợp lệ')
], validation, getOrganizationById);

router.post('/',
    auth,
    requireAdmin,
    createOrganizationValidation,
    validation,
    createOrganization
);

router.put('/:id',
    auth,
    requireAdmin,
    updateOrganizationValidation,
    validation,
    updateOrganization
);

router.delete('/:id',
    auth,
    requireAdmin,
    [
        param('id').isMongoId().withMessage('ID tổ chức không hợp lệ')
    ],
    validation,
    deleteOrganization
);

module.exports = router;