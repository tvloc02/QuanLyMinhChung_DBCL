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

const createAssignmentValidation = [
    // ... (Giữ nguyên)
    body('reportId')
        .notEmpty()
        .withMessage('Báo cáo là bắt buộc')
        .isMongoId()
        .withMessage('ID báo cáo không hợp lệ'),
    body('expertId')
        .notEmpty()
        .withMessage('Chuyên gia là bắt buộc')
        .isMongoId()
        .withMessage('ID chuyên gia không hợp lệ'),
    body('deadline')
        .notEmpty()
        .withMessage('Hạn chót là bắt buộc')
        .isISO8601()
        .withMessage('Ngày hạn chót không hợp lệ'),
    body('assignmentNote')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Ghi chú không được quá 1000 ký tự'),
    body('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Mức độ ưu tiên không hợp lệ')
];

// SỬA LỖI 404: Chuẩn hóa route Stats và Workload
router.get('/stats', auth, getAssignmentStats); // Route: /api/assignments/stats

router.get('/upcoming-deadlines', auth, getUpcomingDeadlines);

// Route: /api/assignments/expert-workload
router.get('/expert-workload', auth, [
    query('expertId').optional().isMongoId() // Cho phép Admin query ID khác
], validation, getExpertWorkload);

router.get('/', auth, [ // Route: /api/assignments/
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('expertId').optional().isMongoId(),
    query('reportId').optional().isMongoId(),
    query('status').optional().isIn(['pending', 'accepted', 'in_progress', 'completed', 'overdue', 'cancelled']),
    query('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
], validation, getAssignments);

router.get('/:id', auth, [
    param('id').isMongoId().withMessage('ID phân công không hợp lệ')
], validation, getAssignmentById);

router.post('/', requireManager, createAssignmentValidation, validation, createAssignment);

router.put('/:id', requireManager, [
    param('id').isMongoId().withMessage('ID phân công không hợp lệ'),
    body('deadline').optional().isISO8601(),
    body('assignmentNote').optional().isLength({ max: 1000 }),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
], validation, updateAssignment);

router.delete('/:id', requireManager, [
    param('id').isMongoId().withMessage('ID phân công không hợp lệ')
], validation, deleteAssignment);

router.post('/:id/accept', auth, [
    param('id').isMongoId().withMessage('ID phân công không hợp lệ'),
    body('responseNote').optional().isLength({ max: 500 })
], validation, acceptAssignment);

router.post('/:id/reject', auth, [
    param('id').isMongoId().withMessage('ID phân công không hợp lệ'),
    body('responseNote').notEmpty().withMessage('Lý do từ chối là bắt buộc'),
    body('responseNote').isLength({ max: 500 })
], validation, rejectAssignment);

router.post('/:id/cancel', requireManager, [
    param('id').isMongoId().withMessage('ID phân công không hợp lệ'),
    body('reason').optional().isLength({ max: 500 })
], validation, cancelAssignment);

module.exports = router;