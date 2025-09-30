const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { protect, restrictTo } = require('../middleware/auth');

// Protect all routes - only admin can access
router.use(protect);
router.use(restrictTo('admin'));

// System info
router.get('/info', systemController.getSystemInfo);

// Mail configuration
router.get('/mail-config', systemController.getMailConfig);
router.post('/mail-config', systemController.updateMailConfig);
router.post('/test-email', systemController.testEmail);

// Backups
router.get('/backups', systemController.getBackups);
router.post('/backups', systemController.createBackup);
router.get('/backups/:id/download', systemController.downloadBackup);
router.post('/backups/:id/restore', systemController.restoreBackup);
router.delete('/backups/:id', systemController.deleteBackup);

// Deleted items
router.get('/deleted-items', systemController.getDeletedItems);
router.post('/restore/:type/:id', systemController.restoreItem);
router.delete('/permanent-delete/:type/:id', systemController.permanentDeleteItem);

module.exports = router;