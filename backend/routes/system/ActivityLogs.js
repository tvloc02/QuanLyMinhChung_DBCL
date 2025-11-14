const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const activityLogController = require('../../controllers/system/activityLogController');

// Bắt buộc đăng nhập cho tất cả các route này
router.use(auth);

// --- CÁC ROUTE MÀ FRONTEND ĐANG GỌI (FIX LỖI 404) ---

// 1. Lấy danh sách logs (GET /api/activity-logs)
router.get('/', activityLogController.getActivityLogs);

// 2. Lấy thống kê logs (GET /api/activity-logs/stats)
router.get('/stats', activityLogController.getActivityStats);

// 3. Xuất dữ liệu (GET /api/activity-logs/export)
router.get('/export', activityLogController.exportActivityLogs);

// 4. Lấy hoạt động của user cụ thể (GET /api/activity-logs/user/:userId)
router.get('/user/:userId', activityLogController.getUserActivity);

// 5. Lấy lịch sử audit (GET /api/activity-logs/audit/:targetType/:targetId)
router.get('/audit/:targetType/:targetId', activityLogController.getAuditTrail);

// 6. Dọn dẹp logs cũ (DELETE /api/activity-logs/cleanup) - Chỉ admin
router.delete('/cleanup', async (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
}, activityLogController.cleanupOldLogs);

// 7. Lấy chi tiết 1 log (GET /api/activity-logs/:id) - Để cuối cùng để tránh trùng route
router.get('/:id', activityLogController.getActivityLogById);

module.exports = router;