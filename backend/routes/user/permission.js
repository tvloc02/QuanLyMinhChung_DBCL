const express = require('express');
const router = express.Router();
const { auth, requireManager, requireAdmin } = require('../../middleware/auth');
const { attachCurrentAcademicYear } = require('../../middleware/academicYear');
const permissionService = require('../../services/permissionService');
const { query, param } = require('express-validator');
const validation = require('../../middleware/validation');

router.use(auth, attachCurrentAcademicYear);

// ⭐️ CHECK QUỀ CẬP NHẬT MINH CHỨNG (UPLOAD/EDIT/DELETE)
router.get('/can-upload-evidence/:criteriaId', [
    param('criteriaId').isMongoId().withMessage('ID tiêu chí không hợp lệ')
], validation, async (req, res) => {
    try {
        const { criteriaId } = req.params;
        const userId = req.user.id;
        const academicYearId = req.academicYearId;

        const canUpload = await permissionService.canUploadEvidence(userId, criteriaId, academicYearId);

        res.json({
            success: true,
            data: { canUpload }
        });
    } catch (error) {
        console.error('Check can upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền upload'
        });
    }
});

// ⭐️ CHECK QUỀ CẬP NHẬT TIÊU CHUẨN
router.get('/can-edit-standard/:standardId', [
    param('standardId').isMongoId().withMessage('ID tiêu chuẩn không hợp lệ')
], validation, async (req, res) => {
    try {
        const { standardId } = req.params;
        const userId = req.user.id;
        const academicYearId = req.academicYearId;

        const canEdit = await permissionService.canEditStandard(userId, standardId, academicYearId);

        res.json({
            success: true,
            data: { canEdit }
        });
    } catch (error) {
        console.error('Check can edit standard error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền sửa tiêu chuẩn'
        });
    }
});

// ⭐️ CHECK QUỀ CẬP NHẬT TIÊU CHÍ
router.get('/can-edit-criteria/:criteriaId', [
    param('criteriaId').isMongoId().withMessage('ID tiêu chí không hợp lệ')
], validation, async (req, res) => {
    try {
        const { criteriaId } = req.params;
        const userId = req.user.id;
        const academicYearId = req.academicYearId;

        const canEdit = await permissionService.canEditCriteria(userId, criteriaId, academicYearId);

        res.json({
            success: true,
            data: { canEdit }
        });
    } catch (error) {
        console.error('Check can edit criteria error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền sửa tiêu chí'
        });
    }
});

// ⭐️ CHECK QUỀ VIẾT BÁO CÁO
router.get('/can-write-report', [
    query('reportType').notEmpty().withMessage('reportType là bắt buộc'),
    query('standardId').optional().isMongoId().withMessage('ID tiêu chuẩn không hợp lệ'),
    query('criteriaId').optional().isMongoId().withMessage('ID tiêu chí không hợp lệ')
], validation, async (req, res) => {
    try {
        const { reportType, standardId, criteriaId } = req.query;
        const userId = req.user.id;
        const academicYearId = req.academicYearId;

        // ⭐️ LOGIC: Kiểm tra quyền viết báo cáo
        const canWrite = await permissionService.canWriteReport(
            userId,
            reportType,
            academicYearId,
            standardId || null,
            criteriaId || null
        );

        res.json({
            success: true,
            data: { canWrite }
        });
    } catch (error) {
        console.error('Check can write report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền viết báo cáo'
        });
    }
});

// ⭐️ CHECK QUỀ PHÂN CÔNG BÁOQUN ĐỌC
router.get('/can-assign-reporters', [
    query('standardId').optional().isMongoId().withMessage('ID tiêu chuẩn không hợp lệ'),
    query('criteriaId').optional().isMongoId().withMessage('ID tiêu chí không hợp lệ')
], validation, async (req, res) => {
    try {
        const { standardId, criteriaId } = req.query;
        const userId = req.user.id;
        const academicYearId = req.academicYearId;

        const canAssign = await permissionService.canAssignReporters(
            userId,
            standardId || null,
            criteriaId || null,
            academicYearId
        );

        res.json({
            success: true,
            data: { canAssign }
        });
    } catch (error) {
        console.error('Check can assign reporters error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền phân công'
        });
    }
});

// ⭐️ CHECK CÓ QUYỀN VIẾT BÁO CÁO OVERALL_TDG KHÔNG (ĐỂ HIỆN NÚT IMPORT)
router.get('/has-write-permission', async (req, res) => {
    try {
        const userId = req.user.id;
        const academicYearId = req.academicYearId;

        // Kiểm tra 3 loại báo cáo: overall_tdg, standard, criteria
        const canWriteOverall = await permissionService.canWriteReport(
            userId,
            'overall_tdg',
            academicYearId,
            null,
            null
        );

        // Hoặc check xem có bất kỳ task nào không
        const tasks = await permissionService.getTasksForUser(userId, academicYearId, true);
        const hasAnyTask = tasks && tasks.length > 0;

        const hasWritePermission = canWriteOverall || hasAnyTask;

        res.json({
            success: true,
            data: { hasWritePermission }
        });
    } catch (error) {
        console.error('Check has write permission error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền'
        });
    }
});

module.exports = router;