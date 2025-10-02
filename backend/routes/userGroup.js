const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { auth, requirePermission } = require('../middleware/auth');
const validation = require('../middleware/validation');
const userGroupController = require('../controllers/userGroupController');

router.get('/user-groups',
    auth,
    requirePermission('USERS.MANAGE'),
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('type').optional().isIn(['system', 'custom']),
        query('status').optional().isIn(['active', 'inactive'])
    ],
    validation,
    userGroupController.getUserGroups
);

router.post('/user-groups/seed',
    auth,
    requirePermission('SYSTEM.MANAGE'),
    userGroupController.seedUserGroups
);

router.get('/user-groups/:id',
    auth,
    requirePermission('USERS.MANAGE'),
    [param('id').isMongoId()],
    validation,
    userGroupController.getUserGroupById
);

router.post('/user-groups',
    auth,
    requirePermission('USERS.MANAGE'),
    [
        body('code').notEmpty().trim().toUpperCase(),
        body('name').notEmpty().trim().isLength({ min: 2, max: 200 }),
        body('description').optional().trim().isLength({ max: 500 }),
        body('permissions').optional().isArray(),
        body('priority').optional().isInt({ min: 0, max: 100 })
    ],
    validation,
    userGroupController.createUserGroup
);

router.put('/user-groups/:id',
    auth,
    requirePermission('USERS.MANAGE'),
    [
        param('id').isMongoId(),
        body('name').optional().trim().isLength({ min: 2, max: 200 }),
        body('description').optional().trim().isLength({ max: 500 }),
        body('priority').optional().isInt({ min: 0, max: 100 }),
        body('status').optional().isIn(['active', 'inactive'])
    ],
    validation,
    userGroupController.updateUserGroup
);

router.delete('/user-groups/:id',
    auth,
    requirePermission('USERS.MANAGE'),
    [param('id').isMongoId()],
    validation,
    userGroupController.deleteUserGroup
);

router.post('/user-groups/:id/permissions',
    auth,
    requirePermission('USERS.MANAGE'),
    [
        param('id').isMongoId(),
        body('permissionIds').isArray().notEmpty()
    ],
    validation,
    userGroupController.addPermissionsToGroup
);

router.delete('/user-groups/:id/permissions',
    auth,
    requirePermission('USERS.MANAGE'),
    [
        param('id').isMongoId(),
        body('permissionIds').isArray().notEmpty()
    ],
    validation,
    userGroupController.removePermissionsFromGroup
);

router.post('/user-groups/:id/members',
    auth,
    requirePermission('USERS.MANAGE'),
    [
        param('id').isMongoId(),
        body('userIds').isArray().notEmpty()
    ],
    validation,
    userGroupController.addMembersToGroup
);

router.delete('/user-groups/:id/members',
    auth,
    requirePermission('USERS.MANAGE'),
    [
        param('id').isMongoId(),
        body('userIds').isArray().notEmpty()
    ],
    validation,
    userGroupController.removeMembersFromGroup
);

module.exports = router;