// backend/routes/public/publicEvidenceRoutes.js - FULL CODE

const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const validation = require('../../middleware/validation');
const {
    getEvidenceByCode,
    getEvidenceById,
    getPublicHierarchy,
    getEvidencesByHierarchy
} = require('../../controllers/public/publicEvidenceController');

// ✅ GET /api/public/evidences/hierarchy - Lấy toàn bộ cấu trúc phân cấp
router.get('/hierarchy', getPublicHierarchy);

// ✅ GET /api/public/evidences/hierarchy/search - Lấy minh chứng theo lọc
router.get('/hierarchy/search', [
    query('academicYearId').optional().isMongoId(),
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('criteriaId').optional().isMongoId()
], validation, getEvidencesByHierarchy);

// ✅ GET /api/public/evidences/id/:id - Lấy minh chứng theo ID (phải đặt TRƯỚC /:code)
router.get('/id/:id', [
    param('id').isMongoId().withMessage('ID không hợp lệ')
], validation, getEvidenceById);

// ✅ GET /api/public/evidences/:code - Lấy minh chứng theo code (đặt CUỐI CÙNG)
router.get('/:code', [
    param('code').notEmpty().trim().toUpperCase()
], validation, getEvidenceByCode);

module.exports = router;