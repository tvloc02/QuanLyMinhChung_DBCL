const express = require('express');
const router = express.Router();

const { auth } = require('../../middleware/auth');
const permissionController = require('../../controllers/user/permissionController');

router.get('/can-edit-standard/:standardId', auth, permissionController.canEditStandard);

router.get('/can-edit-criteria/:criteriaId', auth, permissionController.canEditCriteria);

router.get('/can-upload-evidence/:criteriaId', auth, permissionController.canUploadEvidence);

router.get('/can-assign-reporters/:standardId/:criteriaId?', auth, permissionController.canAssignReporters);

module.exports = router;