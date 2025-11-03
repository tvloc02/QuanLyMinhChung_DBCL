const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { auth } = require('../../middleware/auth');
const { setAcademicYearContext } = require('../../middleware/academicYear');
const { upload } = require('../../middleware/upload');
const validation = require('../../middleware/validation');
const {
    checkCanEditStandard,
    checkCanEditCriteria,
    checkCanAssignReporters,
    checkCanUploadEvidence,
    checkCanManageFiles
} = require('../../services/permissionService');
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
    importEvidencesFromTaskFile,
    exportEvidenceTreeFile,
    getFullEvidenceTree,
    moveEvidence,
    approveFile
} = require('../../controllers/evidence/evidenceController');

router.use(auth, setAcademicYearContext);

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

router.get('/statistics', [
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('criteriaId').optional().isMongoId()
], validation, getStatistics);

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
        .withMessage('ID tổ chức không hợp lệ')
], validation, getFullEvidenceTree);

router.get('/tree', [
    query('programId').notEmpty().isMongoId().withMessage('ID chương trình là bắt buộc'),
    query('organizationId').notEmpty().isMongoId().withMessage('ID tổ chức là bắt buộc')
], validation, getEvidenceTree);

router.get('/tree/export', [
    query('programId')
        .notEmpty()
        .withMessage('ID chương trình là bắt buộc')
        .isMongoId()
        .withMessage('ID chương trình không hợp lệ'),
    query('organizationId')
        .notEmpty()
        .withMessage('ID tổ chức là bắt buộc')
        .isMongoId()
        .withMessage('ID tổ chức không hợp lệ')
], validation, exportEvidenceTreeFile);

router.post('/advanced-search', [
    body('status').optional().isIn(['active', 'inactive', 'new', 'in_progress', 'completed', 'approved', 'rejected']),
    body('keyword').optional().trim().escape(),
    body('programId').optional().isMongoId(),
    body('organizationId').optional().isMongoId(),
    body('standardId').optional().isMongoId(),
    body('criteriaId').optional().isMongoId(),
    body('dateFrom').optional().isISO8601(),
    body('dateTo').optional().isISO8601(),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 })
], validation, advancedSearch);

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

router.get('/export', [
    query('programId').optional().isMongoId(),
    query('organizationId').optional().isMongoId(),
    query('standardId').optional().isMongoId(),
    query('criteriaId').optional().isMongoId(),
    query('format').optional().isIn(['xlsx', 'csv']).withMessage('Format phải là xlsx hoặc csv')
], validation, exportEvidences);

router.post('/import', upload.single('file'), [
    body('programId').notEmpty().isMongoId().withMessage('ID chương trình là bắt buộc'),
    body('organizationId').notEmpty().isMongoId().withMessage('ID tổ chức là bắt buộc'),
    body('mode').optional().isIn(['create', 'update']).withMessage('Mode phải là "create" hoặc "update"')
], validation, importEvidences);

router.post('/import-from-task', upload.single('file'), [
    body('taskId')
        .notEmpty()
        .withMessage('taskId là bắt buộc')
        .isMongoId()
        .withMessage('taskId không hợp lệ'),
    body('reportType')
        .notEmpty()
        .withMessage('reportType là bắt buộc')
        .isIn(['overall_tdg', 'standard', 'criteria'])
        .withMessage('reportType không hợp lệ')
], validation, importEvidencesFromTaskFile);

router.get('/', [
    query('status').optional().isIn(['active', 'inactive', 'new', 'in_progress', 'completed', 'approved', 'rejected']),
    query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    query('search').optional().trim().escape(),
    query('programId').optional().isMongoId().withMessage('ID chương trình không hợp lệ'),
    query('organizationId').optional().isMongoId().withMessage('ID tổ chức không hợp lệ'),
    query('standardId').optional().isMongoId().withMessage('ID tiêu chuẩn không hợp lệ'),
    query('criteriaId').optional().isMongoId().withMessage('ID tiêu chí không hợp lệ'),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'code']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], validation, getEvidences);

router.get('/:id', [
    param('id').isMongoId().withMessage('ID minh chứng không hợp lệ')
], validation, getEvidenceById);

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

router.put('/:id', [
    param('id').isMongoId().withMessage('ID minh chứng không hợp lệ')
], validation, updateEvidence);

router.delete('/:id', [
    param('id').isMongoId().withMessage('ID minh chứng không hợp lệ')
], validation, deleteEvidence);

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
    body('newCode')
        .notEmpty()
        .withMessage('Mã minh chứng mới là bắt buộc')
        .matches(/^[A-Y]\d+\.\d{2}\.\d{2}\.\d{2}$/)
        .withMessage('Mã minh chứng mới không đúng format')
], validation, copyEvidenceToAnotherYear);

module.exports = router;