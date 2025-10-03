const express = require('express');
const router = express.Router();
const importBatchController = require('../../controllers/report/ImportBatchController');
const auth = require('../../middleware/auth');

router.post('/', auth, importBatchController.createBatch);

router.get('/', auth, importBatchController.getUserBatches);

router.get('/:id', auth, importBatchController.getBatchById);

router.get('/:id/errors', auth, importBatchController.getBatchErrors);

router.get('/stats/summary', auth, importBatchController.getBatchStats);

router.put('/:id/start', auth, importBatchController.startBatch);

router.put('/:id/complete', auth, importBatchController.completeBatch);

router.put('/:id/fail', auth, importBatchController.failBatch);

router.put('/:id/cancel', auth, importBatchController.cancelBatch);

router.delete('/cleanup/old', auth, importBatchController.cleanupBatches);

module.exports = router;
