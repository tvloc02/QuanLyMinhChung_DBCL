const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { auth, requirePermission } = require('../middleware/auth');
const validation = require('../middleware/validation');
const permissionController = require('../controllers/permissionController');

router.get('/permissions',
    auth,
    requirePermission('SYSTEM.MANAGE'),
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('module').optional().trim(),
        query('action').optional().trim(),
        query('level').optional().isIn(['basic', 'intermediate', 'advanced', 'critical']),
        query('status').optional().isIn(['active', 'inactive'])
    ],
    validation,
    permissionController.getPermissions
);

router.get('/permissions/by-module',
    auth,
    requirePermission('SYSTEM.MANAGE'),
    permissionController.getPermissionsByModule
);

router.post('/permissions/seed',
    auth,
    requirePermission('SYSTEM.MANAGE'),
    permissionController.seedPermissions
);

router.get('/permissions/:id',
    auth,
    requirePermission('SYSTEM.MANAGE'),
    [param('id').isMongoId()],
    validation,
    permissionController.getPermissionById
);

router.post('/permissions',
    auth,
    requirePermission('SYSTEM.MANAGE'),
    [
        body('code').notEmpty().trim().toUpperCase(),
        body('name').notEmpty().trim().isLength({ min: 2, max: 200 }),
        body('description').optional().trim().isLength({ max: 500 }),
        body('module').notEmpty().isIn([
            'reports', 'evaluations', 'users', 'standards', 'criteria',
            'programs', 'organizations', 'academic_years', 'system', 'settings'
        ]),
        body('action').notEmpty().isIn([
            'create', 'read', 'update', 'delete', 'approve', 'reject',
            'assign', 'export', 'import', 'manage'
        ]),
        body('level').optional().isIn(['basic', 'intermediate', 'advanced', 'critical'])
    ],
    validation,
    permissionController.createPermission
);

router.put('/permissions/:id',
    auth,
    requirePermission('SYSTEM.MANAGE'),
    [
        param('id').isMongoId(),
        body('name').optional().trim().isLength({ min: 2, max: 200 }),
        body('description').optional().trim().isLength({ max: 500 }),
        body('level').optional().isIn(['basic', 'intermediate', 'advanced', 'critical']),
        body('status').optional().isIn(['active', 'inactive'])
    ],
    validation,
    permissionController.updatePermission
);

router.delete('/permissions/:id',
    auth,
    requirePermission('SYSTEM.MANAGE'),
    [param('id').isMongoId()],
    validation,
    permissionController.deletePermission
);

module.exports = router;