const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { auth, requirePermission } = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const userGroupController = require('../../controllers/user/userGroupController');

router.get('/',
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

router.post('/seed',
    auth,
    requirePermission('SYSTEM.MANAGE'),
    userGroupController.seedUserGroups
);

router.get('/:id',
    auth,
    requirePermission('USERS.MANAGE'),
    [param('id').isMongoId()],
    validation,
    userGroupController.getUserGroupById
);

router.post('/',
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

router.put('/:id',
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

router.delete('/:id',
    auth,
    requirePermission('USERS.MANAGE'),
    [param('id').isMongoId()],
    validation,
    userGroupController.deleteUserGroup
);

router.post('/:id/permissions',
    auth,
    requirePermission('USERS.MANAGE'),
    [
        param('id').isMongoId(),
        body('permissionIds').isArray().notEmpty()
    ],
    validation,
    userGroupController.addPermissionsToGroup
);

router.delete('/:id/permissions',
    auth,
    requirePermission('USERS.MANAGE'),
    [
        param('id').isMongoId(),
        body('permissionIds').isArray().notEmpty()
    ],
    validation,
    userGroupController.removePermissionsFromGroup
);

router.post('/:id/members',
    auth,
    requirePermission('USERS.MANAGE'),
    [
        param('id').isMongoId(),
        body('userIds').isArray().notEmpty()
    ],
    validation,
    userGroupController.addMembersToGroup
);

router.delete('/:id/members',
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