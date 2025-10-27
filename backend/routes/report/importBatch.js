const express = require('express');
const router = express.Router();
const importBatchController = require('../../controllers/report/ImportBatchController');

router.post('/', importBatchController.createBatch);
router.get('/', importBatchController.getUserBatches);
router.get('/:id', importBatchController.getBatchById);
router.get('/:id/errors', importBatchController.getBatchErrors);
router.get('/stats/summary', importBatchController.getBatchStats);
router.put('/:id/start', importBatchController.startBatch);
router.put('/:id/complete', importBatchController.completeBatch);
router.put('/:id/fail', importBatchController.failBatch);
router.put('/:id/cancel', importBatchController.cancelBatch);
router.delete('/cleanup/old', importBatchController.cleanupBatches);

module.exports = router;
