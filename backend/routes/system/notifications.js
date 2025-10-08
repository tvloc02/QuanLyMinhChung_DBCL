const express = require('express');
const router = express.Router();
const { query, param, body } = require('express-validator');
const { auth } = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationStats
} = require('../../controllers/system/notificationController');

router.use(auth);

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