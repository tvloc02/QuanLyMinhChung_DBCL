const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const validation = require('../../middleware/validation');
const { getEvidenceByCode, getEvidenceById } = require('../../controllers/public/publicEvidenceController');

router.get('/evidences/:code', [
    param('code').notEmpty().trim()
], validation, getEvidenceByCode);

router.get('/evidences/id/:id', [
    param('id').isMongoId()
], validation, getEvidenceById);

module.exports = router;