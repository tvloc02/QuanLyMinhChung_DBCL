const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
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
    convertFileToContent
} = require('../../controllers/report/reportController');

// Statistics route (before :id routes)
router.get('/stats', auth, [
    query('type').optional().isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    query('status').optional().isIn(['draft', 'published', 'archived']),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId()
], validation, getReportStats);

// List and create
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
    body('keywords').optional().isArray()
], validation, createReport);

// Get by ID
router.get('/:id', auth, [
    param('id').isMongoId()
], validation, getReportById);

// Update
router.put('/:id', auth, requireManager, [
    param('id').isMongoId(),
    body('title').optional().isLength({ max: 500 }),
    body('content').optional(),
    body('summary').optional().isLength({ max: 1000 }),
    body('keywords').optional().isArray(),
    body('contentMethod').optional().isIn(['online_editor', 'file_upload'])
], validation, updateReport);

// Delete
router.delete('/:id', auth, requireManager, [
    param('id').isMongoId()
], validation, deleteReport);

// Publish/Unpublish
router.post('/:id/publish', auth, requireManager, [
    param('id').isMongoId()
], validation, publishReport);

router.post('/:id/unpublish', auth, requireManager, [
    param('id').isMongoId()
], validation, unpublishReport);

// Download
router.get('/:id/download', auth, [
    param('id').isMongoId(),
    query('format').optional().isIn(['html', 'pdf'])
], validation, downloadReport);

router.post('/:id/upload', auth, requireManager, [
    param('id').isMongoId()
], upload.single('file'), uploadReportFile);

router.get('/:id/download-file', auth, [
    param('id').isMongoId()
], validation, downloadReportFile);

router.post('/:id/convert', auth, requireManager, [
    param('id').isMongoId()
], validation, convertFileToContent);

module.exports = router;