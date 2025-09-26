const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../middleware/auth');
const validation = require('../middleware/validation');
const {
    getPrograms,
    getAllPrograms,
    getProgramById,
    createProgram,
    updateProgram,
    deleteProgram,
    getProgramStatistics
} = require('../controllers/programController');

// Validation rules
const createProgramValidation = [
    body('name')
        .notEmpty()
        .withMessage('Tên chương trình là bắt buộc')
        .isLength({ max: 300 })
        .withMessage('Tên chương trình không được quá 300 ký tự'),
    body('code')
        .notEmpty()
        .withMessage('Mã chương trình là bắt buộc')
        .isLength({ max: 20 })
        .withMessage('Mã chương trình không được quá 20 ký tự')
        .matches(/^[A-Z0-9\-_]+$/)
        .withMessage('Mã chương trình chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới'),
    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được quá 2000 ký tự'),
    body('type')
        .isIn(['undergraduate', 'graduate', 'institution', 'other'])
        .withMessage('Loại chương trình không hợp lệ'),
    body('version')
        .optional()
        .isLength({ max: 10 })
        .withMessage('Phiên bản không được quá 10 ký tự'),
    body('applicableYear')
        .optional()
        .isInt({ min: 2000, max: 2100 })
        .withMessage('Năm áp dụng phải từ 2000-2100'),
    body('effectiveDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày hiệu lực không hợp lệ'),
    body('expiryDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày hết hạn không hợp lệ')
        .custom((value, { req }) => {
            if (value && req.body.effectiveDate && new Date(value) <= new Date(req.body.effectiveDate)) {
                throw new Error('Ngày hết hạn phải sau ngày hiệu lực');
            }
            return true;
        }),
    body('objectives')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Mục tiêu không được quá 2000 ký tự'),
    body('guidelines')
        .optional()
        .isLength({ max: 3000 })
        .withMessage('Hướng dẫn không được quá 3000 ký tự')
];

const updateProgramValidation = [
    param('id').isMongoId().withMessage('ID chương trình không hợp lệ'),
    ...createProgramValidation
];

// Routes
router.get('/statistics',
    auth,
    requireManager,
    getProgramStatistics
);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('type').optional().isIn(['undergraduate', 'graduate', 'institution', 'other']),
    query('status').optional().isIn(['draft', 'active', 'inactive', 'archived']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'code', 'applicableYear']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getPrograms);

router.get('/all', auth, getAllPrograms);

router.get('/:id', auth, [
    param('id').isMongoId().withMessage('ID chương trình không hợp lệ')
], validation, getProgramById);

router.post('/',
    auth,
    requireAdmin,
    createProgramValidation,
    validation,
    createProgram
);

router.put('/:id',
    auth,
    requireAdmin,
    updateProgramValidation,
    validation,
    updateProgram
);

router.delete('/:id',
    auth,
    requireAdmin,
    [
        param('id').isMongoId().withMessage('ID chương trình không hợp lệ')
    ],
    validation,
    deleteProgram
);

module.exports = router;