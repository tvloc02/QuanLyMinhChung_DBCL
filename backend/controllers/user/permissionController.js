const permissionService = require('../../services/permissionService');

const getAcademicYearId = (req) => {
    // 1. Ưu tiên lấy từ Middleware (đã được thiết lập qua attachCurrentAcademicYear)
    if (req.academicYearId) {
        return req.academicYearId;
    }
    // 2. Nếu không có, lấy từ Query Parameter (phòng trường hợp Middleware bị bỏ qua)
    return req.query.academicYearId;
};


const canEditStandard = async (req, res) => {
    try {
        const { standardId } = req.params;
        const userId = req.user.id;
        const academicYearId = getAcademicYearId(req);

        if (!academicYearId) {
            return res.status(400).json({ success: false, message: 'Thiếu ID năm học (academicYearId)' });
        }

        const result = await permissionService.canEditStandard(userId, standardId, academicYearId);

        res.json({
            success: true,
            data: { canEdit: result }
        });
    } catch (error) {
        console.error('Check can edit standard error:', error);
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra quyền' });
    }
};

const canEditCriteria = async (req, res) => {
    try {
        const { criteriaId } = req.params;
        const userId = req.user.id;
        const academicYearId = getAcademicYearId(req);

        if (!academicYearId) {
            return res.status(400).json({ success: false, message: 'Thiếu ID năm học (academicYearId)' });
        }

        const result = await permissionService.canEditCriteria(userId, criteriaId, academicYearId);

        res.json({
            success: true,
            data: { canEdit: result }
        });
    } catch (error) {
        console.error('Check can edit criteria error:', error);
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra quyền' });
    }
};

const canUploadEvidence = async (req, res) => {
    try {
        const { criteriaId } = req.params;
        const userId = req.user.id;
        const academicYearId = getAcademicYearId(req);

        if (!academicYearId) {
            return res.status(400).json({ success: false, message: 'Thiếu ID năm học (academicYearId)' });
        }

        const result = await permissionService.canUploadEvidence(userId, criteriaId, academicYearId);

        res.json({
            success: true,
            data: { canUpload: result }
        });
    } catch (error) {
        console.error('Check can upload evidence error:', error);
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra quyền' });
    }
};

const canAssignReporters = async (req, res) => {
    try {
        const { standardId, criteriaId } = req.params;
        const userId = req.user.id;
        const academicYearId = getAcademicYearId(req);

        if (!academicYearId) {
            return res.status(400).json({ success: false, message: 'Thiếu ID năm học (academicYearId)' });
        }

        const criteriaIdValue = criteriaId === 'null' ? null : criteriaId;

        const result = await permissionService.canAssignReporters(
            userId,
            standardId,
            criteriaIdValue,
            academicYearId
        );

        res.json({
            success: true,
            data: { canAssign: result }
        });
    } catch (error) {
        console.error('Check can assign reporters error:', error);
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra quyền' });
    }
};

module.exports = {
    canEditStandard,
    canEditCriteria,
    canUploadEvidence,
    canAssignReporters
};