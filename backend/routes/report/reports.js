const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager, requireReporter } = require('../../middleware/auth');
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
    approveReport,
    rejectReport,
    assignReporter,
    makePublic,
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
    query('status').optional().isIn(['draft', 'public', 'approved', 'rejected', 'published']),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId()
], validation, getReportStats);

router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('type').optional().isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    query('status').optional().isIn(['draft', 'public', 'approved', 'rejected', 'published']),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('criteriaId').optional().isMongoId()
], validation, getReports);

router.post('/', auth, requireReporter, [
    body('title').notEmpty().isLength({ max: 500 }),
    body('type').isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    body('programId').isMongoId(),
    body('organizationId').isMongoId(),
    body('standardId').optional().isMongoId(),
    body('criteriaId').optional().isMongoId(),
    body('content').optional(),
    body('contentMethod').optional().isIn(['online_editor', 'file_upload']),
    body('summary').optional().isLength({ max: 1000 }),
    body('keywords').optional().isArray()
], validation, createReport);

router.get('/:id', auth, [
    param('id').isMongoId()
], validation, getReportById);

router.put('/:id', auth, requireReporter, [
    param('id').isMongoId(),
    body('title').optional().isLength({ max: 500 }),
    body('content').optional(),
    body('summary').optional().isLength({ max: 1000 }),
    body('keywords').optional().isArray(),
    body('contentMethod').optional().isIn(['online_editor', 'file_upload'])
], validation, updateReport);

router.delete('/:id', auth, requireReporter, [
    param('id').isMongoId()
], validation, deleteReport);

router.post('/:id/publish', auth, requireReporter, [
    param('id').isMongoId()
], validation, publishReport);

router.post('/:id/unpublish', auth, requireReporter, [
    param('id').isMongoId()
], validation, unpublishReport);

router.post('/:id/approve', auth, requireManager, [
    param('id').isMongoId(),
    body('feedback').optional().isLength({ max: 2000 })
], validation, approveReport);

router.post('/:id/reject', auth, requireManager, [
    param('id').isMongoId(),
    body('feedback').optional().isLength({ max: 2000 })
], validation, rejectReport);

router.post('/:id/assign-reporters', auth, requireManager, [
    param('id').isMongoId(),
    body('reporterIds').isArray({ min: 1 }).withMessage('Danh sách reporter phải có ít nhất 1 phần tử')
], validation, assignReporter);

router.post('/:id/make-public', auth, requireReporter, [
    param('id').isMongoId()
], validation, makePublic);

router.get('/:id/evidences', auth, [
    param('id').isMongoId()
], validation, getReportEvidences);

router.get('/:id/versions', auth, [
    param('id').isMongoId()
], validation, getReportVersions);

router.post('/:id/versions', auth, requireReporter, [
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

router.put('/:id/comments/:commentId/resolve', auth, requireReporter, [
    param('id').isMongoId(),
    param('commentId').isMongoId()
], validation, resolveReportComment);

router.get('/:id/download', auth, [
    param('id').isMongoId(),
    query('format').optional().isIn(['html', 'pdf'])
], validation, downloadReport);

router.post('/:id/upload', auth, requireReporter, [
    param('id').isMongoId()
], upload.single('file'), uploadReportFile);

router.get('/:id/download-file', auth, [
    param('id').isMongoId()
], validation, downloadReportFile);

router.post('/:id/convert', auth, requireReporter, [
    param('id').isMongoId()
], validation, convertFileToContent);

module.exports = router;