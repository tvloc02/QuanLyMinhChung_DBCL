const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const validation = require('../../middleware/validation');
const {
    getEvaluations,
    getEvaluationById,
    createEvaluation,
    updateEvaluation,
    submitEvaluation,
    superviseEvaluation,
    finalizeEvaluation,
    autoSaveEvaluation,
    getEvaluatorStats,
    getSystemStats,
    getAverageScoreByReport
} = require('../../controllers/report/evaluationController');

// Statistics routes (before :id routes)
router.get('/stats/system', auth, getSystemStats);
router.get('/stats/evaluator/:evaluatorId', auth, [
    param('evaluatorId').isMongoId()
], validation, getEvaluatorStats);
router.get('/stats/report/:reportId', auth, [
    param('reportId').isMongoId()
], validation, getAverageScoreByReport);

// CRUD routes
router.get('/', auth, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('evaluatorId').optional().isMongoId(),
    query('reportId').optional().isMongoId(),
    query('status').optional().isIn(['draft', 'submitted', 'supervised', 'final']),
    query('rating').optional().isIn(['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'])
], validation, getEvaluations);

router.get('/:id', auth, [
    param('id').isMongoId()
], validation, getEvaluationById);

router.post('/', auth, [
    body('assignmentId').isMongoId().withMessage('ID phân quyền không hợp lệ')
], validation, createEvaluation);

router.put('/:id', auth, [
    param('id').isMongoId(),
    body('criteriaScores').optional().isArray(),
    body('rating').optional().isIn(['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor']),
    body('overallComment').optional().isLength({ max: 5000 }),
    body('strengths').optional().isArray(),
    body('improvementAreas').optional().isArray(),
    body('recommendations').optional().isArray(),
    body('evidenceAssessment').optional().isObject()
], validation, updateEvaluation);

// Action routes
router.put('/:id/auto-save', auth, [
    param('id').isMongoId()
], validation, autoSaveEvaluation);

router.post('/:id/submit', auth, [
    param('id').isMongoId()
], validation, submitEvaluation);

router.post('/:id/supervise', auth, [
    param('id').isMongoId(),
    body('comments').optional().isLength({ max: 3000 })
], validation, superviseEvaluation);

router.post('/:id/finalize', auth, requireAdmin, [
    param('id').isMongoId()
], validation, finalizeEvaluation);

module.exports = router;
