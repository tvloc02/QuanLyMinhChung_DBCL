const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { auth } = require('../../middleware/auth');
const { setAcademicYearContext } = require('../../middleware/academicYear');
const validation = require('../../middleware/validation');
const {
    getAssessmentReports,
    getAssessmentReportById,
    getAssessmentStats
} = require('../../controllers/report/assessmentController');

// Thống kê
router.get('/statistics', auth, setAcademicYearContext, getAssessmentStats);

// Danh sách báo cáo đánh giá
router.get('/', auth, setAcademicYearContext, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('type').optional().isIn(['criteria_analysis', 'standard_analysis', 'comprehensive_report']),
    query('standardId').optional().isMongoId(),
    query('criteriaId').optional().isMongoId()
], validation, getAssessmentReports);

// Chi tiết báo cáo đánh giá
router.get('/:id', auth, setAcademicYearContext, [
    param('id').isMongoId().withMessage('ID báo cáo không hợp lệ')
], validation, getAssessmentReportById);

module.exports = router;