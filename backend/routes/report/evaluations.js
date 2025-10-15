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
    getEvaluatorStats,
    getSystemStats, // Cần thêm vào import
    autoSaveEvaluation // Cần thêm vào import
} = require('../../controllers/report/evaluationController');

const createEvaluationValidation = [
    body('assignmentId')
        .notEmpty()
        .withMessage('Phân công là bắt buộc')
        .isMongoId()
        .withMessage('ID phân công không hợp lệ'),
    // Bỏ validation reportId vì nó sẽ được lấy từ assignment trong controller
    // body('reportId')
    //     .notEmpty()
    //     .withMessage('Báo cáo là bắt buộc')
    //     .isMongoId()
    //     .withMessage('ID báo cáo không hợp lệ')
];

const updateEvaluationValidation = [
    param('id').isMongoId().withMessage('ID đánh giá không hợp lệ'),
    body('criteriaScores').optional().isArray(),
    body('rating').optional().isIn(['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor']),
    body('overallComment').optional().isLength({ max: 5000 }),
    body('evidenceAssessment').optional().isObject()
];

// Sửa: Cho phép query evaluatorId hoặc không (sẽ dùng req.user.id)
router.get('/evaluator-stats', auth, [
    query('evaluatorId').optional().isMongoId().withMessage('ID đánh giá viên không hợp lệ')
], validation, getEvaluatorStats);

// Thêm route cho System Stats (đã có trong file api.js)
router.get('/system-stats', auth, getSystemStats);

// Thêm route cho Auto Save (đã có trong file api.js)
router.put('/:id/auto-save', auth, [
    param('id').isMongoId().withMessage('ID đánh giá không hợp lệ')
], validation, autoSaveEvaluation);

router.get('/', auth, [ // Thêm auth cho tất cả
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('evaluatorId').optional().isMongoId(),
    query('reportId').optional().isMongoId(),
    query('status').optional().isIn(['draft', 'submitted', 'reviewed', 'final']),
    query('rating').optional().isIn(['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'])
], validation, getEvaluations);

router.get('/:id', auth, [
    param('id').isMongoId().withMessage('ID đánh giá không hợp lệ')
], validation, getEvaluationById);

router.post('/', auth, createEvaluationValidation, validation, createEvaluation); // Thêm auth

router.put('/:id', auth, updateEvaluationValidation, validation, updateEvaluation); // Thêm auth

router.post('/:id/submit', auth, [
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