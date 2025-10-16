const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const {
    getAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    acceptAssignment,
    rejectAssignment,
    cancelAssignment,
    getExpertWorkload,
    getAssignmentStats,
    getUpcomingDeadlines
} = require('../../controllers/report/assignmentController');

// Statistics routes (place before :id routes to avoid conflicts)
router.get('/stats', auth, getAssignmentStats);
router.get('/upcoming-deadlines', auth, getUpcomingDeadlines);
router.get('/expert-workload', auth, getExpertWorkload);

// CRUD routes
router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('expertId').optional().isMongoId(),
    query('reportId').optional().isMongoId(),
    query('status').optional().isIn(['pending', 'accepted', 'in_progress', 'completed', 'overdue', 'cancelled']),
    query('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
], validation, getAssignments);

router.get('/:id', auth, [
    param('id').isMongoId().withMessage('ID phân quyền không hợp lệ')
], validation, getAssignmentById);

router.post('/', auth, requireManager, [
    body('reportId').isMongoId().withMessage('ID báo cáo không hợp lệ'),
    body('expertId').isMongoId().withMessage('ID chuyên gia không hợp lệ'),
    body('deadline').isISO8601().withMessage('Ngày hạn chót không hợp lệ'),
    body('assignmentNote').optional().isLength({ max: 1000 }),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('evaluationCriteria').optional().isArray()
], validation, createAssignment);

router.put('/:id', auth, requireManager, [
    param('id').isMongoId(),
    body('deadline').optional().isISO8601(),
    body('assignmentNote').optional().isLength({ max: 1000 }),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('evaluationCriteria').optional().isArray()
], validation, updateAssignment);

router.delete('/:id', auth, requireManager, [
    param('id').isMongoId()
], validation, deleteAssignment);

// Action routes
router.post('/:id/accept', auth, [
    param('id').isMongoId(),
    body('responseNote').optional().isLength({ max: 500 })
], validation, acceptAssignment);

router.post('/:id/reject', auth, [
    param('id').isMongoId(),
    body('responseNote').notEmpty().isLength({ max: 500 })
], validation, rejectAssignment);

router.post('/:id/cancel', auth, requireManager, [
    param('id').isMongoId(),
    body('reason').optional().isLength({ max: 500 })
], validation, cancelAssignment);

module.exports = router;