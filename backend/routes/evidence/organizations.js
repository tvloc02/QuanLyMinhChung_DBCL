const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const { attachCurrentAcademicYear } = require('../../middleware/academicYear');
const validation = require('../../middleware/validation');
const {
    getOrganizations,
    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationStatistics,
    addDepartment,
    updateDepartment,
    deleteDepartment
} = require('../../controllers/evidence/organizationController');

router.use(auth, attachCurrentAcademicYear);

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
    body('contactEmail')
        .optional()
        .isEmail()
        .withMessage('Email liên hệ không hợp lệ'),
    body('contactPhone')
        .optional()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Số điện thoại không hợp lệ')
];

const updateOrganizationValidation = [
    param('id').isMongoId().withMessage('ID tổ chức không hợp lệ'),
    ...createOrganizationValidation.filter(rule =>
        !rule.builder.fields.includes('code')
    )
];

const departmentValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên phòng ban là bắt buộc')
        .isLength({ max: 150 })
        .withMessage('Tên phòng ban không được quá 150 ký tự'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email phòng ban không hợp lệ'),
    body('phone')
        .optional()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Số điện thoại phòng ban không hợp lệ')
];

router.get('/statistics',
    requireManager,
    getOrganizationStatistics
);

router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('status').optional().isIn(['active', 'inactive', 'suspended']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'code']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getOrganizations);

router.get('/all', getAllOrganizations);

router.get('/:id', [
    param('id').isMongoId().withMessage('ID tổ chức không hợp lệ')
], validation, getOrganizationById);

router.post('/',
    requireAdmin,
    createOrganizationValidation,
    validation,
    createOrganization
);

router.put('/:id',
    requireAdmin,
    updateOrganizationValidation,
    validation,
    updateOrganization
);

router.post('/:id/departments',
    [
        param('id').isMongoId().withMessage('ID tổ chức không hợp lệ'),
        ...departmentValidation
    ],
    validation,
    addDepartment
);

router.put('/:id/departments/:deptId',
    [
        param('id').isMongoId().withMessage('ID tổ chức không hợp lệ'),
        param('deptId').isMongoId().withMessage('ID phòng ban không hợp lệ'),
        ...departmentValidation
    ],
    validation,
    updateDepartment
);

router.delete('/:id/departments/:deptId',
    [
        param('id').isMongoId().withMessage('ID tổ chức không hợp lệ'),
        param('deptId').isMongoId().withMessage('ID phòng ban không hợp lệ')
    ],
    validation,
    deleteDepartment
);

router.delete('/:id',
    requireAdmin,
    [
        param('id').isMongoId().withMessage('ID tổ chức không hợp lệ')
    ],
    validation,
    deleteOrganization
);

module.exports = router;