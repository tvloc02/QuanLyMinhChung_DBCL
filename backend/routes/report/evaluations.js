const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth, requireAdmin, requireManager } = require('../../middleware/auth');
const { setAcademicYearContext } = require('../../middleware/academicYear');
const validation = require('../../middleware/validation');
const {
    getEvaluations,
    getEvaluationById,
    createEvaluation,
    updateEvaluation,
    submitEvaluation,
    reviewEvaluation,
    finalizeEvaluation,
    getEvaluatorStats
} = require('../../controllers/report/evaluationController');

const createEvaluationValidation = [
    body('assignmentId')
        .notEmpty()
        .withMessage('Phân công là bắt buộc')
        .isMongoId()
        .withMessage('ID phân công không hợp lệ'),
    body('reportId')
        .notEmpty()
        .withMessage('Báo cáo là bắt buộc')
        .isMongoId()
        .withMessage('ID báo cáo không hợp lệ')
];

const updateEvaluationValidation = [
    param('id').isMongoId().withMessage('ID đánh giá không hợp lệ'),
    body('criteriaScores').optional().isArray(),
    body('rating').optional().isIn(['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor']),
    body('overallComment').optional().isLength({ max: 5000 }),
    body('evidenceAssessment').optional().isObject()
];

router.get('/evaluator-stats/:evaluatorId', [
    param('evaluatorId').isMongoId().withMessage('ID đánh giá viên không hợp lệ')
], validation, getEvaluatorStats);

router.get('/', [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('evaluatorId').optional().isMongoId(),
    query('reportId').optional().isMongoId(),
    query('status').optional().isIn(['draft', 'submitted', 'reviewed', 'final']),
    query('rating').optional().isIn(['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'])
], validation, getEvaluations);

router.get('/:id', [
    param('id').isMongoId().withMessage('ID đánh giá không hợp lệ')
], validation, getEvaluationById);

router.post('/', createEvaluationValidation, validation, createEvaluation);

router.put('/:id', updateEvaluationValidation, validation, updateEvaluation);

router.post('/:id/submit', [
    param('id').isMongoId().withMessage('ID đánh giá không hợp lệ')
], validation, submitEvaluation);

router.post('/:id/review', requireManager, [
    param('id').isMongoId().withMessage('ID đánh giá không hợp lệ'),
    body('comments').optional().isLength({ max: 2000 })
], validation, reviewEvaluation);

router.post('/:id/finalize', requireAdmin, [
    param('id').isMongoId().withMessage('ID đánh giá không hợp lệ')
], validation, finalizeEvaluation);

module.exports = router;