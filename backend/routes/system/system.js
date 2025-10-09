const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const systemController = require('../../controllers/system/systemController');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập chức năng này'
        });
    }
    next();
};

// All routes require authentication and admin role
router.use(auth);
router.use(requireAdmin);

// System info
router.get('/info', systemController.getSystemInfo);

// Mail configuration
router.get('/mail-config', systemController.getMailConfig);
router.post('/mail-config', systemController.updateMailConfig);
router.post('/test-email', systemController.testEmail);

// Backup management
router.get('/backups', systemController.getBackups);
router.post('/backups', systemController.createBackup);
router.get('/backups/:id/download', systemController.downloadBackup);
router.post('/backups/:id/restore', systemController.restoreBackup);
router.delete('/backups/:id', systemController.deleteBackup);

// Deleted items
router.get('/deleted-items', systemController.getDeletedItems);
router.post('/deleted-items/:type/:id/restore', systemController.restoreItem);
router.delete('/deleted-items/:type/:id', systemController.permanentDeleteItem);

module.exports = router;