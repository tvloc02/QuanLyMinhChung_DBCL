const express = require('express');
const router = express.Router();
const { query, param, body } = require('express-validator');
const { auth } = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const { getUnreadCount, requestEvidence, completeEvidenceRequest } = require('../../controllers/system/notificationController');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats
} = require('../../controllers/system/notificationController');

router.use(auth);

// Route mới: Admin yêu cầu minh chứng
router.post('/request-evidence', [
    body('departmentId').isMongoId().withMessage('ID phòng ban không hợp lệ'),
    body('standardId').isMongoId().withMessage('ID tiêu chuẩn không hợp lệ'),
    body('criteriaId').isMongoId().withMessage('ID tiêu chí không hợp lệ')
], validation, requestEvidence);

// Route mới: Manager xác nhận hoàn thành yêu cầu
router.post('/request-evidence/:id/complete', [
    param('id').isMongoId().withMessage('ID thông báo yêu cầu không hợp lệ')
], validation, completeEvidenceRequest);

router.get('/unread-count', auth, getUnreadCount);

router.get('/stats', getNotificationStats);

router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('unreadOnly').optional().isBoolean(),
    query('types').optional(),
    query('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
], validation, getNotifications);

router.post('/mark-all-read', markAllAsRead);

router.post('/:id/read', [
    param('id').isMongoId().withMessage('ID thông báo không hợp lệ')
], validation, markAsRead);

router.delete('/:id', [
    param('id').isMongoId().withMessage('ID thông báo không hợp lệ')
], validation, deleteNotification);

module.exports = router;