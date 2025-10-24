const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireManager } = require('../../middleware/auth');
const { setAcademicYearContext } = require('../../middleware/academicYear');
const validation = require('../../middleware/validation');
const {
    getReportRequests,
    getRequestById,
    createReportRequest,
    acceptRequest,
    rejectRequest
} = require('../../controllers/report/reportRequestController');

// ← THÊM MIDDLEWARE NÀY VÀO TẤT CẢ ROUTES
router.get('/', auth, setAcademicYearContext, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'accepted', 'in_progress', 'completed', 'rejected']),
    query('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
], validation, getReportRequests);

router.get('/:id', auth, setAcademicYearContext, [
    param('id').isMongoId().withMessage('ID yêu cầu không hợp lệ')
], validation, getRequestById);

router.post('/', auth, requireManager, setAcademicYearContext, [
    body('title').notEmpty().isLength({ max: 500 }),
    body('description').notEmpty().isLength({ max: 2000 }),
    body('type').optional().isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    body('programId').isMongoId(),
    body('organizationId').isMongoId(),
    body('standardId').optional().isMongoId(),
    body('criteriaId').optional().isMongoId(),
    body('deadline').isISO8601(),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('assignedTo').isMongoId().withMessage('Người nhận là bắt buộc')
], validation, createReportRequest);

router.post('/:id/accept', auth, setAcademicYearContext, [
    param('id').isMongoId()
], validation, acceptRequest);

router.post('/:id/reject', auth, setAcademicYearContext, [
    param('id').isMongoId(),
    body('responseNote').optional().isLength({ max: 500 })
], validation, rejectRequest);

module.exports = router;