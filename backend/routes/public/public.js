const express = require('express');
const router = express.Router();
const publicSearchController = require('../../controllers/public/publicSearchController');

router.get('/academic-years', publicSearchController.getPublicAcademicYears);

router.get('/evidences/search', publicSearchController.searchPublicEvidences);

router.get('/files/:id/download', publicSearchController.downloadPublicFile);

module.exports = router;