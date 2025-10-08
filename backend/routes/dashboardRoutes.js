const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getAdminStats,
    getManagerStats,
    getExpertStats,
    getAdvisorStats
} = require('../controllers/dashboard/dashboardController');

router.get('/admin/stats', protect, authorize('admin'), getAdminStats);
router.get('/manager/stats', protect, authorize('admin', 'manager'), getManagerStats);
router.get('/expert/stats', protect, authorize('admin', 'expert'), getExpertStats);
router.get('/advisor/stats', protect, authorize('admin', 'advisor'), getAdvisorStats);

module.exports = router;