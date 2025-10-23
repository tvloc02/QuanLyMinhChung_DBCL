const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
// Đảm bảo auth.js đã được sửa để requireManager bao gồm advisor/supervisor
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { upload } = require('../../middleware/upload');

const {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    publishReport,
    unpublishReport,
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

router.get('/stats', auth, [
    query('type').optional().isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    query('status').optional().isIn(['draft', 'published', 'archived']),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId()
], validation, getReportStats);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('type').optional().isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    query('status').optional().isIn(['draft', 'published', 'archived']),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('criteriaId').optional().isMongoId()
], validation, getReports);

router.post('/', auth, requireManager, [
    body('title').notEmpty().isLength({ max: 500 }),
    body('type').isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    body('programId').isMongoId(),
    body('organizationId').isMongoId(),
    body('standardId').optional().isMongoId(),
    body('criteriaId').optional().isMongoId(),
    body('content').optional(),
    body('contentMethod').optional().isIn(['online_editor', 'file_upload']),
    body('summary').optional().isLength({ max: 1000 }),
    body('keywords').optional().isArray(),
    body('requestId').optional().isMongoId()
], validation, createReport);

router.get('/:id', auth, [
    param('id').isMongoId()
], validation, getReportById);

// ✅ Yêu cầu quyền Manager+
router.post('/:id/unpublish', auth, requireManager, [
    param('id').isMongoId()
], validation, unpublishReport);

// ✅ Yêu cầu quyền Manager+
router.put('/:id', auth, requireManager, [
    param('id').isMongoId(),
    body('title').optional().isLength({ max: 500 }),
    body('content').optional(),
    body('summary').optional().isLength({ max: 1000 }),
    body('keywords').optional().isArray(),
    body('contentMethod').optional().isIn(['online_editor', 'file_upload'])
], validation, updateReport);

// ✅ Yêu cầu quyền Manager+
router.delete('/:id', auth, requireManager, [
    param('id').isMongoId()
], validation, deleteReport);

// ✅ Yêu cầu quyền Manager+
router.post('/:id/publish', auth, requireManager, [
    param('id').isMongoId()
], validation, publishReport);

router.get('/:id/evidences', auth, [
    param('id').isMongoId()
], validation, getReportEvidences);

router.get('/:id/versions', auth, [
    param('id').isMongoId()
], validation, getReportVersions);

// ✅ Yêu cầu quyền Manager+
router.post('/:id/versions', auth, requireManager, [
    param('id').isMongoId(),
    body('content').notEmpty(),
    body('changeNote').optional().isLength({ max: 500 })
], validation, addReportVersion);

router.get('/:id/comments', auth, [
    param('id').isMongoId()
], validation, getReportComments);

router.post('/:id/comments', auth, [
    param('id').isMongoId(),
    body('comment').notEmpty().withMessage('Nội dung nhận xét là bắt buộc'),
    body('section').optional()
], validation, addReportComment);

// ✅ Yêu cầu quyền Manager+
router.put('/:id/comments/:commentId/resolve', auth, requireManager, [
    param('id').isMongoId(),
    param('commentId').isMongoId()
], validation, resolveReportComment);

router.get('/:id/download', auth, [
    param('id').isMongoId(),
    query('format').optional().isIn(['html', 'pdf'])
], validation, downloadReport);

// ✅ Yêu cầu quyền Manager+
router.post('/:id/upload', auth, requireManager, [
    param('id').isMongoId()
], upload.single('file'), uploadReportFile);

router.get('/:id/download-file', auth, [
    param('id').isMongoId()
], validation, downloadReportFile);

// ✅ Yêu cầu quyền Manager+
router.post('/:id/convert', auth, requireManager, [
    param('id').isMongoId()
], validation, convertFileToContent);

module.exports = router;