const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const {
    getAcademicYears,
    getAllAcademicYears,
    getAcademicYearById,
    getCurrentAcademicYear,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setCurrentAcademicYear,
    copyDataFromYear,
    getAcademicYearStatistics,
    getAvailableYearsForCopy
} = require('../../controllers/system/academicYearController');

// Validation rules
const createAcademicYearValidation = [
    body('name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Tên năm học không được quá 100 ký tự'),
    body('code')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Mã năm học phải có định dạng YYYY-YYYY (VD: 2024-2025)'),
    body('startYear')
        .notEmpty()
        .withMessage('Năm bắt đầu là bắt buộc')
        .isInt({ min: 2020, max: 2050 })
        .withMessage('Năm bắt đầu phải từ 2020-2050'),
    body('endYear')
        .notEmpty()
        .withMessage('Năm kết thúc là bắt buộc')
        .isInt({ min: 2021, max: 2051 })
        .withMessage('Năm kết thúc phải từ 2021-2051')
        .custom((value, { req }) => {
            if (value <= req.body.startYear) {
                throw new Error('Năm kết thúc phải lớn hơn năm bắt đầu');
            }
            return true;
        }),
    body('startDate')
        .notEmpty()
        .withMessage('Ngày bắt đầu là bắt buộc')
        .isISO8601()
        .withMessage('Ngày bắt đầu không hợp lệ'),
    body('endDate')
        .notEmpty()
        .withMessage('Ngày kết thúc là bắt buộc')
        .isISO8601()
        .withMessage('Ngày kết thúc không hợp lệ')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
            }
            return true;
        }),
    body('isCurrent')
        .optional()
        .isBoolean()
        .withMessage('isCurrent phải là boolean'),
    body('copySettings')
        .optional()
        .isObject()
        .withMessage('copySettings phải là object')
];

const updateAcademicYearValidation = [
    param('id').isMongoId().withMessage('ID năm học không hợp lệ'),
    body('name')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Tên năm học không được quá 100 ký tự'),
    body('code')
        .optional()
        .matches(/^\d{4}-\d{4}$/)
        .withMessage('Mã năm học phải có định dạng YYYY-YYYY'),
    body('startYear')
        .optional()
        .isInt({ min: 2020, max: 2050 })
        .withMessage('Năm bắt đầu phải từ 2020-2050'),
    body('endYear')
        .optional()
        .isInt({ min: 2021, max: 2051 })
        .withMessage('Năm kết thúc phải từ 2021-2051'),
    body('startDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày bắt đầu không hợp lệ'),
    body('endDate')
        .optional()
        .isISO8601()
        .withMessage('Ngày kết thúc không hợp lệ'),
    body('status')
        .optional()
        .isIn(['draft', 'active', 'completed', 'archived'])
        .withMessage('Trạng thái không hợp lệ'),
    body('isCurrent')
        .optional()
        .isBoolean()
        .withMessage('isCurrent phải là boolean')
];

const copyDataValidation = [
    param('id').isMongoId().withMessage('ID năm học không hợp lệ'),
    body('sourceYearId')
        .notEmpty()
        .withMessage('Năm học nguồn là bắt buộc')
        .isMongoId()
        .withMessage('ID năm học nguồn không hợp lệ'),
    body('copySettings')
        .optional()
        .isObject()
        .withMessage('Cài đặt sao chép phải là object')
];

router.get('/current', getCurrentAcademicYear);

router.get('/statistics/:id',
    auth,
    requireManager,
    [
        param('id').isMongoId().withMessage('ID năm học không hợp lệ')
    ],
    validation,
    getAcademicYearStatistics
);

router.get('/:id/available-for-copy',
    auth,
    requireManager,
    [
        param('id').isMongoId().withMessage('ID năm học không hợp lệ')
    ],
    validation,
    getAvailableYearsForCopy
);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('status').optional().isIn(['draft', 'active', 'completed', 'archived']),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'code', 'startYear']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getAcademicYears);

router.get('/all', getAllAcademicYears);

router.get('/:id', auth, [
    param('id').isMongoId().withMessage('ID năm học không hợp lệ')
], validation, getAcademicYearById);

router.post('/',
    auth,
    requireAdmin,
    createAcademicYearValidation,
    validation,
    createAcademicYear
);

router.put('/:id',
    auth,
    requireAdmin,
    updateAcademicYearValidation,
    validation,
    updateAcademicYear
);

router.delete('/:id',
    auth,
    requireAdmin,
    [
        param('id').isMongoId().withMessage('ID năm học không hợp lệ')
    ],
    validation,
    deleteAcademicYear
);

router.post('/:id/set-current',
    auth,
    requireAdmin,
    [
        param('id').isMongoId().withMessage('ID năm học không hợp lệ')
    ],
    validation,
    setCurrentAcademicYear
);

router.post('/:id/copy-data',
    auth,
    requireManager,
    copyDataValidation,
    validation,
    copyDataFromYear
);

module.exports = router;