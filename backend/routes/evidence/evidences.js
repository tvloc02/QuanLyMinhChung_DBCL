const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth } = require('../../middleware/auth');
const { setAcademicYearContext } = require('../../middleware/academicYear');
const { upload } = require('../../middleware/upload');
const validation = require('../../middleware/validation');
const {
    getEvidences,
    getEvidenceById,
    createEvidence,
    updateEvidence,
    deleteEvidence,
    generateCode,
    getEvidenceTree,
    advancedSearch,
    getStatistics,
    copyEvidenceToAnotherYear,
    exportEvidences,
    importEvidences,
    getFullEvidenceTree,
    moveEvidence,
    approveFile
} = require('../../controllers/evidence/evidenceController');

const {
    sendCompletionRequest,
    submitCompletionNotification
} = require('../../controllers/evidence/evidenceController');

router.use(auth, setAcademicYearContext);

// ========== REQUEST ROUTES ==========
router.post('/requests/send-completion-request', [
    body('departmentId')
        .notEmpty()
        .withMessage('Phòng ban là bắt buộc')
        .isMongoId()
        .withMessage('ID phòng ban không hợp lệ')
], validation, sendCompletionRequest);

router.post('/requests/submit-completion-notification', [
    body('departmentId')
        .notEmpty()
        .withMessage('Phòng ban là bắt buộc')
        .isMongoId()
        .withMessage('ID phòng ban không hợp lệ'),
    body('message')
        .optional()
        .isString()
        .withMessage('Tin nhắn phải là chuỗi')
], validation, submitCompletionNotification);

// ========== FILE APPROVAL ==========
router.post('/files/:fileId/approve', [
    param('fileId').isMongoId().withMessage('ID file không hợp lệ'),
    body('status')
        .notEmpty()
        .withMessage('Trạng thái là bắt buộc')
        .isIn(['approved', 'rejected'])
        .withMessage('Trạng thái phải là approved hoặc rejected'),
    body('rejectionReason')
        .optional()
        .isString()
        .withMessage('Lý do từ chối phải là chuỗi')
], validation, approveFile);

// ========== MOVE EVIDENCE ==========
router.post('/:id/move', [
    param('id').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('targetStandardId')
        .notEmpty()
        .withMessage('Tiêu chuẩn đích là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chuẩn đích không hợp lệ'),
    body('targetCriteriaId')
        .notEmpty()
        .withMessage('Tiêu chí đích là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chí đích không hợp lệ'),
    body('newCode')
        .notEmpty()
        .withMessage('Mã minh chứng mới là bắt buộc')
        .matches(/^[A-Y]\d+\.\d{2}\.\d{2}\.\d{2}$/)
        .withMessage('Mã minh chứng mới không đúng format')
], validation, moveEvidence);

// ========== STATISTICS ==========
router.get('/statistics', [
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('departmentId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('criteriaId').optional().isMongoId()
], validation, getStatistics);

// ========== FULL TREE ==========
router.get('/full-tree', [
    query('programId')
        .notEmpty()
        .withMessage('ID chương trình là bắt buộc')
        .isMongoId()
        .withMessage('ID chương trình không hợp lệ'),
    query('organizationId')
        .notEmpty()
        .withMessage('ID tổ chức là bắt buộc')
        .isMongoId()
        .withMessage('ID tổ chức không hợp lệ'),
    query('departmentId')
        .optional()
        .isMongoId()
        .withMessage('ID phòng ban không hợp lệ')
], validation, getFullEvidenceTree);

// ========== TREE ==========
router.get('/tree', [
    query('programId').notEmpty().isMongoId().withMessage('ID chương trình là bắt buộc'),
    query('organizationId').notEmpty().isMongoId().withMessage('ID tổ chức là bắt buộc'),
    query('departmentId').optional().isMongoId().withMessage('ID phòng ban không hợp lệ')
], validation, getEvidenceTree);

// ========== ADVANCED SEARCH ==========
router.post('/advanced-search', [
    body('status').optional().isIn(['active', 'inactive', 'new', 'assigned', 'in_progress', 'pending_approval', 'approved', 'rejected']),
    body('keyword').optional().trim().escape(),
    body('programId').optional().isMongoId(),
    body('organizationId').optional().isMongoId(),
    body('departmentId').optional().isMongoId(),
    body('standardId').optional().isMongoId(),
    body('criteriaId').optional().isMongoId(),
    body('dateFrom').optional().isISO8601(),
    body('dateTo').optional().isISO8601(),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 })
], validation, advancedSearch);

// ========== GENERATE CODE ==========
router.post('/generate-code', [
    body('standardCode')
        .notEmpty()
        .withMessage('Mã tiêu chuẩn là bắt buộc')
        .matches(/^\d{1,2}$/)
        .withMessage('Mã tiêu chuẩn phải là 1-2 chữ số'),
    body('criteriaCode')
        .notEmpty()
        .withMessage('Mã tiêu chí là bắt buộc')
        .matches(/^\d{1,2}$/)
        .withMessage('Mã tiêu chí phải là 1-2 chữ số'),
    body('boxNumber')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số hộp phải là số nguyên dương')
], validation, generateCode);

// ========== EXPORT ==========
router.get('/export', [
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('departmentId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('criteriaId').optional().isMongoId(),
    query('format').optional().isIn(['xlsx', 'csv']).withMessage('Format phải là xlsx hoặc csv')
], validation, exportEvidences);

// ========== IMPORT ==========
router.post('/import', upload.single('file'), [
    body('programId').notEmpty().isMongoId().withMessage('ID chương trình là bắt buộc'),
    body('organizationId').notEmpty().isMongoId().withMessage('ID tổ chức là bắt buộc'),
    body('departmentId').notEmpty().isMongoId().withMessage('ID phòng ban là bắt buộc'),
    body('mode').optional().isIn(['create', 'update']).withMessage('Mode phải là "create" hoặc "update"')
], validation, importEvidences);

// ========== GET ALL ==========
router.get('/', [
    query('status').optional().isIn(['active', 'inactive', 'new', 'assigned', 'in_progress', 'pending_approval', 'approved', 'rejected']),
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('programId').optional().isMongoId().withMessage('ID chương trình không hợp lệ'),
    query('organizationId').optional().isMongoId().withMessage('ID tổ chức không hợp lệ'),

    // THAY ĐỔI: Custom validator để hỗ trợ truyền một hoặc nhiều ID phòng ban
    query('departmentId').optional().custom(value => {
        if (!value) return true;
        const ids = Array.isArray(value) ? value : value.split(',');
        const mongoose = require('mongoose');
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            throw new Error('ID phòng ban không hợp lệ');
        }
        return true;
    }),

    query('standardId').optional().isMongoId().withMessage('ID tiêu chuẩn không hợp lệ'),
    query('criteriaId').optional().isMongoId().withMessage('ID tiêu chí không hợp lệ'),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'code']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getEvidences);

// ========== GET BY ID ==========
router.get('/:id', [
    param('id').isMongoId().withMessage('ID minh chứng không hợp lệ')
], validation, getEvidenceById);

// ========== CREATE ==========
router.post('/', [
    body('name')
        .notEmpty()
        .withMessage('Tên minh chứng là bắt buộc')
        .isLength({ max: 500 })
        .withMessage('Tên không được quá 500 ký tự'),
    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được quá 2000 ký tự'),
    body('programId')
        .notEmpty()
        .withMessage('Chương trình đánh giá là bắt buộc')
        .isMongoId()
        .withMessage('ID chương trình không hợp lệ'),
    body('organizationId')
        .notEmpty()
        .withMessage('Tổ chức - Cấp đánh giá là bắt buộc')
        .isMongoId()
        .withMessage('ID tổ chức không hợp lệ'),
    body('departmentId')
        .notEmpty()
        .withMessage('Phòng ban là bắt buộc')
        .isMongoId()
        .withMessage('ID phòng ban không hợp lệ'),
    body('standardId')
        .notEmpty()
        .withMessage('Tiêu chuẩn là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chuẩn không hợp lệ'),
    body('criteriaId')
        .notEmpty()
        .withMessage('Tiêu chí là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chí không hợp lệ'),
    body('code')
        .optional()
        .matches(/^[A-Y]\d+\.\d{2}\.\d{2}\.\d{2}$/)
        .withMessage('Mã minh chứng không đúng format (VD: A1.01.02.04)'),
    body('documentNumber')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Số hiệu không được quá 100 ký tự'),
    body('documentType')
        .optional()
        .isIn(['Quyết định', 'Thông tư', 'Nghị định', 'Luật', 'Báo cáo', 'Kế hoạch', 'Khác'])
        .withMessage('Loại văn bản không hợp lệ'),
    body('issuingAgency')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Cơ quan ban hành không được quá 200 ký tự'),
    body('notes')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Ghi chú không được quá 1000 ký tự')
], validation, createEvidence);

// ========== UPDATE ==========
router.put('/:id', [
    param('id').isMongoId().withMessage('ID minh chứng không hợp lệ')
], validation, updateEvidence);

// ========== DELETE ==========
router.delete('/:id', [
    param('id').isMongoId().withMessage('ID minh chứng không hợp lệ')
], validation, deleteEvidence);

// ========== COPY TO YEAR ==========
router.post('/:id/copy-to-year', [
    param('id').isMongoId().withMessage('ID minh chứng không hợp lệ'),
    body('targetAcademicYearId')
        .notEmpty()
        .withMessage('Năm học đích là bắt buộc')
        .isMongoId()
        .withMessage('ID năm học đích không hợp lệ'),
    body('targetStandardId')
        .notEmpty()
        .withMessage('Tiêu chuẩn đích là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chuẩn đích không hợp lệ'),
    body('targetCriteriaId')
        .notEmpty()
        .withMessage('Tiêu chí đích là bắt buộc')
        .isMongoId()
        .withMessage('ID tiêu chí đích không hợp lệ'),
    body('targetDepartmentId')
        .notEmpty()
        .withMessage('Phòng ban đích là bắt buộc')
        .isMongoId()
        .withMessage('ID phòng ban đích không hợp lệ'),
    body('newCode')
        .notEmpty()
        .withMessage('Mã minh chứng mới là bắt buộc')
        .matches(/^[A-Y]\d+\.\d{2}\.\d{2}\.\d{2}$/)
        .withMessage('Mã minh chứng mới không đúng format')
], validation, copyEvidenceToAnotherYear);

module.exports = router;