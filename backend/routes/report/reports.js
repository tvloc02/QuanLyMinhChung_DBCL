const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const { setAcademicYearContext } = require('../../middleware/academicYear');
const validation = require('../../middleware/validation');
const {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    publishReport, addReviewer, removeReviewer, addComment, resolveComment
} = require('../../controllers/report/reportController');

const createReportValidation = [
    body('title')
        .notEmpty()
        .withMessage('Tiêu đề báo cáo là bắt buộc')
        .isLength({ max: 500 })
        .withMessage('Tiêu đề không được quá 500 ký tự'),
    body('type')
        .notEmpty()
        .withMessage('Loại báo cáo là bắt buộc')
        .isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report'])
        .withMessage('Loại báo cáo không hợp lệ'),
    body('content')
        .notEmpty()
        .withMessage('Nội dung báo cáo là bắt buộc'),
    body('programId')
        .notEmpty()
        .withMessage('Chương trình là bắt buộc')
        .isMongoId()
        .withMessage('ID chương trình không hợp lệ'),
    body('organizationId')
        .notEmpty()
        .withMessage('Tổ chức là bắt buộc')
        .isMongoId()
        .withMessage('ID tổ chức không hợp lệ'),
    body('standardId')
        .optional()
        .isMongoId()
        .withMessage('ID tiêu chuẩn không hợp lệ'),
    body('criteriaId')
        .optional()
        .isMongoId()
        .withMessage('ID tiêu chí không hợp lệ')
];



/*
router.post('/generate-code', [
    body('type').notEmpty().isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    body('standardCode').optional(),
    body('criteriaCode').optional()
], validation, generateReportCode);
*/

router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().escape(),
    query('type').optional().isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    query('status').optional().isIn(['draft', 'under_review', 'published', 'archived']),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('criteriaId').optional().isMongoId()
], validation, getReports);

router.get('/:id', [
    param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')
], validation, getReportById);

router.post('/', requireManager, createReportValidation, validation, createReport);

router.put('/:id', requireManager, [
    param('id').isMongoId().withMessage('ID báo cáo không hợp lệ'),
    body('title').optional().isLength({ max: 500 }),
    body('content').optional(),
    body('summary').optional().isLength({ max: 1000 }),
    body('keywords').optional().isArray()
], validation, updateReport);

router.delete('/:id', requireAdmin, [
    param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')
], validation, deleteReport);

router.post('/:id/publish', requireManager, [
    param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')
], validation, publishReport);

router.post('/:id/reviewers', auth, addReviewer);
router.delete('/:id/reviewers', auth, removeReviewer);

router.post('/:id/comments', auth, addComment);
router.put('/:id/comments/:commentId/resolve', auth, resolveComment);

module.exports = router;