const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { auth, requireManager, requireAdmin } = require('../../middleware/auth');
const { setAcademicYearContextForAdmin } = require('../../middleware/academicYear');
const validation = require('../../middleware/validation');
const {
    getActivityLogs,
    getActivityLogById,
    getUserActivity,
    getActivityStats,
    getAuditTrail,
    getAuditLogs,
    getErrorLogs,
    getUserActivityStats,
    getActionStats,
    getTargetTypeStats,
    advancedSearch,
    cleanupOldLogs,
    exportActivityLogs
} = require('../../controllers/system/activityLogController');

router.get('/', auth, requireManager, setAcademicYearContextForAdmin, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit không hợp lệ'),
    query('userId').optional().isMongoId().withMessage('UserId không hợp lệ'),
    query('action').optional().trim(),
    query('targetType').optional().trim(),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('result').optional().isIn(['success', 'failure', 'warning']),
    query('sortBy').optional().isIn(['createdAt', 'severity', 'result']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getActivityLogs);

router.get('/audit-logs', auth, requireManager, setAcademicYearContextForAdmin, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit không hợp lệ')
], validation, getAuditLogs);

router.get('/error-logs', auth, requireManager, setAcademicYearContextForAdmin, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit không hợp lệ')
], validation, getErrorLogs);

router.get('/stats/user-activity', auth, requireManager, setAcademicYearContextForAdmin, [
    query('days').optional().isInt({ min: 1 }).withMessage('Days không hợp lệ')
], validation, getUserActivityStats);

router.get('/stats/action', auth, requireManager, setAcademicYearContextForAdmin, [
    query('days').optional().isInt({ min: 1 }).withMessage('Days không hợp lệ')
], validation, getActionStats);

router.get('/stats/target-type', auth, requireManager, setAcademicYearContextForAdmin, [
    query('days').optional().isInt({ min: 1 }).withMessage('Days không hợp lệ')
], validation, getTargetTypeStats);

router.get('/search/advanced', auth, requireManager, setAcademicYearContextForAdmin, [
    query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit không hợp lệ'),
    query('userId').optional().isMongoId(),
    query('action').optional().trim(),
    query('targetType').optional().trim(),
    query('targetId').optional().isMongoId(),
    query('result').optional().isIn(['success', 'failure', 'warning']),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('isAuditRequired').optional().isIn(['true', 'false'])
], validation, advancedSearch);

router.get('/export', auth, requireManager, setAcademicYearContextForAdmin, [
    query('format').optional().isIn(['json', 'csv']),
    query('userId').optional().isMongoId(),
    query('action').optional().trim(),
    query('targetType').optional().trim(),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('result').optional().isIn(['success', 'failure', 'warning'])
], validation, exportActivityLogs);

router.get('/user/:userId', auth, requireManager, [
    param('userId').isMongoId().withMessage('UserId không hợp lệ'),
    query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit không hợp lệ'),
    query('action').optional().trim()
], validation, getUserActivity);

router.get('/audit-trail/:targetType/:targetId', auth, requireManager, [
    param('targetType').trim(),
    param('targetId').isMongoId().withMessage('TargetId không hợp lệ')
], validation, getAuditTrail);

router.get('/stats/:academicYearId', auth, requireManager, setAcademicYearContextForAdmin, [
    query('days').optional().isInt({ min: 1 }).withMessage('Days không hợp lệ')
], validation, getActivityStats);

router.get('/:id', auth, requireManager, [
    param('id').isMongoId().withMessage('ID không hợp lệ')
], validation, getActivityLogById);

router.post('/cleanup', auth, requireAdmin, cleanupOldLogs);

module.exports = router;