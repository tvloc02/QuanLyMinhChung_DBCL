const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const { setAcademicYearContext } = require('../../middleware/academicYear');
const validation = require('../../middleware/validation');
const { upload } = require('../../middleware/upload');

const {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    submitReport,
    publishReport,
    unpublishReport,
    addSelfEvaluation,
    downloadReport,
    getReportStats,
    uploadReportFile,
    downloadReportFile,
    convertFileToContent,
    getReportEvidences,
    getReportVersions,
    addReportVersion,
    getReportComments,
    addReportComment,
    resolveReportComment
} = require('../../controllers/report/reportController');

router.get('/stats', auth, setAcademicYearContext, [
    query('type').optional().isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    query('status').optional().isIn(['draft', 'submitted', 'published', 'archived']),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId()
], validation, getReportStats);

router.get('/', auth, setAcademicYearContext, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('type').optional().isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    query('status').optional().isIn(['draft', 'submitted', 'published', 'archived']),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('criteriaId').optional().isMongoId()
], validation, getReports);

router.post('/', auth, setAcademicYearContext, [
    body('title').notEmpty().isLength({ max: 500 }),
    body('type').isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    body('programId').isMongoId(),
    body('organizationId').isMongoId(),
    body('content').optional(),
    body('contentMethod').optional().isIn(['online_editor', 'file_upload']),
    body('summary').optional().isLength({ max: 1000 }),
    body('keywords').optional().isArray(),
    body('requestId').optional().isMongoId(),
    body('linkedEvidences').optional().isArray()
], validation, createReport);

router.get('/:id', auth, setAcademicYearContext, [
    param('id').isMongoId()
], validation, getReportById);

router.put('/:id', auth, setAcademicYearContext, [
    param('id').isMongoId(),
    body('title').optional().isLength({ max: 500 }),
    body('content').optional(),
    body('summary').optional().isLength({ max: 1000 }),
    body('keywords').optional().isArray(),
    body('contentMethod').optional().isIn(['online_editor', 'file_upload']),
    body('linkedEvidences').optional().isArray()
], validation, updateReport);

router.delete('/:id', auth, setAcademicYearContext, [
    param('id').isMongoId()
], validation, deleteReport);

router.post('/:id/submit', auth, setAcademicYearContext, [
    param('id').isMongoId()
], validation, submitReport);

router.post('/:id/self-evaluation', auth, setAcademicYearContext, [
    param('id').isMongoId(),
    body('content').notEmpty().withMessage('Nội dung đánh giá là bắt buộc'),
    body('score').isInt({ min: 1, max: 7 }).withMessage('Điểm đánh giá phải từ 1 đến 7')
], validation, addSelfEvaluation);

router.post('/:id/publish', auth, requireManager, setAcademicYearContext, [
    param('id').isMongoId()
], validation, publishReport);

router.post('/:id/unpublish', auth, requireManager, setAcademicYearContext, [
    param('id').isMongoId()
], validation, unpublishReport);

router.get('/:id/evidences', auth, setAcademicYearContext, [
    param('id').isMongoId()
], validation, getReportEvidences);

router.get('/:id/versions', auth, setAcademicYearContext, [
    param('id').isMongoId()
], validation, getReportVersions);

router.post('/:id/versions', auth, setAcademicYearContext, [
    param('id').isMongoId(),
    body('content').notEmpty(),
    body('changeNote').optional().isLength({ max: 500 })
], validation, addReportVersion);

router.get('/:id/comments', auth, setAcademicYearContext, [
    param('id').isMongoId()
], validation, getReportComments);

router.post('/:id/comments', auth, setAcademicYearContext, [
    param('id').isMongoId(),
    body('comment').notEmpty().withMessage('Nội dung nhận xét là bắt buộc'),
    body('section').optional()
], validation, addReportComment);

router.put('/:id/comments/:commentId/resolve', auth, setAcademicYearContext, [
    param('id').isMongoId(),
    param('commentId').isMongoId()
], validation, resolveReportComment);

router.get('/:id/download', auth, setAcademicYearContext, [
    param('id').isMongoId(),
    query('format').optional().isIn(['html', 'pdf'])
], validation, downloadReport);

router.post('/:id/upload', auth, setAcademicYearContext, [
    param('id').isMongoId()
], upload.single('file'), uploadReportFile);

router.get('/:id/download-file', auth, setAcademicYearContext, [
    param('id').isMongoId()
], validation, downloadReportFile);

router.post('/:id/convert', auth, setAcademicYearContext, [
    param('id').isMongoId()
], validation, convertFileToContent);

module.exports = router;