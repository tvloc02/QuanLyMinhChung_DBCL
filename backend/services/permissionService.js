const mongoose = require('mongoose');

const REPORT_TYPES = {
    OVERALL_TDG: 'overall_tdg',
    STANDARD: 'standard',
    CRITERIA: 'criteria'
};

// Import models
const User = require('../models/User/User');
const Task = require('../models/Task/Task');
const Criteria = require('../models/Evidence/Criteria');
const Standard = require('../models/Evidence/Standard');

// ⭐️ LẤY ROLE CỦA USER
const getUserRole = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user ? user.role : null;
    } catch (e) {
        console.error("Error loading User Model in permissionService:", e.message);
        return null;
    }
};

// ⭐️ LẤY DANH SÁCH TASK CỦA USER (EXPORT - QUAN TRỌNG)
const getTasksForUser = (userId, academicYearId, includeAllStatuses = false) => {
    let query = {
        assignedTo: userId,
    };

    if (!includeAllStatuses) {
        query.status = { $in: ['pending', 'in_progress', 'submitted'] };
    }

    if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
        query.academicYearId = new mongoose.Types.ObjectId(academicYearId);
    } else {
        query.academicYearId = null;
    }

    return Task.find(query);
};

// ⭐️ LẤY LOẠI BÁO CÁO MÀ USER CÓ QUYỀN VIẾT
const getAccessibleReportTypes = async (userId, academicYearId) => {
    const userRole = await getUserRole(userId);
    if (userRole === 'admin' || userRole === 'manager') {
        return [REPORT_TYPES.OVERALL_TDG, REPORT_TYPES.STANDARD, REPORT_TYPES.CRITERIA];
    }

    const tasks = await getTasksForUser(userId, academicYearId, true);
    const uniqueReportTypes = Array.from(new Set(tasks.map(t => t.reportType)));
    return uniqueReportTypes || [];
};

// ⭐️ LẤY QUYỀN CỦA USER
const getPermissionsByUserId = async (userId, academicYearId) => {
    const accessibleReportTypes = await getAccessibleReportTypes(userId, academicYearId);
    const permissions = [];

    if (accessibleReportTypes.includes(REPORT_TYPES.OVERALL_TDG)) {
        permissions.push('write_overall_report');
    }
    if (accessibleReportTypes.includes(REPORT_TYPES.STANDARD)) {
        permissions.push('write_standard_report');
    }
    if (accessibleReportTypes.includes(REPORT_TYPES.CRITERIA)) {
        permissions.push('write_criteria_report');
    }

    return permissions;
};

// ⭐️ KIỂM TRA CÓ QUYỀN VIẾT BÁO CÁO KHÔNG
const canWriteReport = async (userId, reportType, academicYearId, standardId = null, criteriaId = null) => {
    const userRole = await getUserRole(userId);

    // Admin/Manager luôn có quyền
    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    // Nếu Reporter có quyền Sửa Tiêu chuẩn/Tiêu chí này, họ có quyền Viết báo cáo
    if (criteriaId) {
        const canEdit = await canEditCriteria(userId, criteriaId, academicYearId);
        if (canEdit) return true;
    } else if (standardId) {
        const canEdit = await canEditStandard(userId, standardId, academicYearId);
        if (canEdit) return true;
    }

    // Logic kiểm tra Task
    const tasks = await getTasksForUser(userId, academicYearId, true);

    if (reportType === REPORT_TYPES.OVERALL_TDG) {
        return tasks.some(t => t.reportType === REPORT_TYPES.OVERALL_TDG);
    }

    if (reportType === REPORT_TYPES.STANDARD && standardId) {
        const standardIdStr = standardId.toString();
        return tasks.some(t =>
            t.reportType === REPORT_TYPES.OVERALL_TDG ||
            (t.reportType === REPORT_TYPES.STANDARD && t.standardId && t.standardId.toString() === standardIdStr)
        );
    }

    if (reportType === REPORT_TYPES.CRITERIA && criteriaId) {
        const criteria = await Criteria.findById(criteriaId);
        if (!criteria) return false;
        const standardIdStr = criteria.standardId.toString();

        return tasks.some(t =>
            t.reportType === REPORT_TYPES.OVERALL_TDG ||
            (t.reportType === REPORT_TYPES.STANDARD && t.standardId && t.standardId.toString() === standardIdStr) ||
            (t.reportType === REPORT_TYPES.CRITERIA && t.criteriaId && t.criteriaId.toString() === criteriaId.toString())
        );
    }

    return false;
};

// ⭐️ KIỂM TRA CÓ QUYỀN SỬA TIÊU CHUẨN KHÔNG
const canEditStandard = async (userId, standardId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const tasks = await getTasksForUser(userId, academicYearId, true);
    const standardIdStr = standardId.toString();

    return tasks.some(t =>
        t.reportType === REPORT_TYPES.OVERALL_TDG ||
        (t.reportType === REPORT_TYPES.STANDARD && t.standardId && t.standardId.toString() === standardIdStr)
    );
};

// ⭐️ KIỂM TRA CÓ QUYỀN SỬA TIÊU CHÍ KHÔNG
const canEditCriteria = async (userId, criteriaId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const criteria = await Criteria.findById(criteriaId);
    if (!criteria) return false;

    const tasks = await getTasksForUser(userId, academicYearId, true);
    const standardIdStr = criteria.standardId.toString();
    const criteriaIdStr = criteriaId.toString();

    return tasks.some(t =>
        t.reportType === REPORT_TYPES.OVERALL_TDG ||
        (t.reportType === REPORT_TYPES.STANDARD && t.standardId && t.standardId.toString() === standardIdStr) ||
        (t.reportType === REPORT_TYPES.CRITERIA && t.criteriaId && t.criteriaId.toString() === criteriaIdStr)
    );
};

// ⭐️ KIỂM TRA CÓ QUYỀN PHÂN CÔNG REPORTER KHÔNG
const canAssignReporters = async (userId, standardId, criteriaId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const tasks = await getTasksForUser(userId, academicYearId, true);

    if (criteriaId) {
        const criteria = await Criteria.findById(criteriaId);
        if (!criteria) return false;
        const criteriaStandardId = criteria.standardId.toString();

        return tasks.some(t =>
            t.reportType === REPORT_TYPES.OVERALL_TDG ||
            (t.reportType === REPORT_TYPES.STANDARD && t.standardId && t.standardId.toString() === criteriaStandardId)
        );
    }

    if (standardId) {
        const standardIdStr = standardId.toString();

        return tasks.some(t =>
            t.reportType === REPORT_TYPES.OVERALL_TDG ||
            (t.reportType === REPORT_TYPES.STANDARD && t.standardId && t.standardId.toString() === standardIdStr)
        );
    }

    return false;
};

// ⭐️ KIỂM TRA CÓ QUYỀN UPLOAD MINH CHỨNG KHÔNG
const canUploadEvidence = async (userId, criteriaId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const criteria = await Criteria.findById(criteriaId);
    if (!criteria) return false;

    const tasks = await getTasksForUser(userId, academicYearId, true);
    const standardIdStr = criteria.standardId.toString();
    const criteriaIdStr = criteriaId.toString();

    return tasks.some(t =>
        t.reportType === REPORT_TYPES.OVERALL_TDG ||
        (t.reportType === REPORT_TYPES.STANDARD && t.standardId && t.standardId.toString() === standardIdStr) ||
        (t.reportType === REPORT_TYPES.CRITERIA && t.criteriaId && t.criteriaId.toString() === criteriaIdStr)
    );
};

// ⭐️ KIỂM TRA CÓ QUYỀN QUẢN LÝ FILE KHÔNG
const canManageFiles = async (userId, criteriaId, academicYearId) => {
    return await canUploadEvidence(userId, criteriaId, academicYearId);
};

// ⭐️ LẤY DANH SÁCH ID TIÊU CHUẨN MÀ USER CÓ QUYỀN TRUY CẬP
const getAccessibleStandardIds = async (userId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole !== 'reporter') {
        const standards = await Standard.find({ academicYearId }).select('_id');
        return standards.map(s => s._id);
    }

    const tasks = await getTasksForUser(userId, academicYearId, true);

    if (tasks.length === 0) {
        return [];
    }

    const standardIds = new Set();

    // Thêm các tiêu chuẩn từ task trực tiếp
    tasks.forEach(t => {
        if (t.standardId) {
            standardIds.add(t.standardId.toString());
        }
    });

    // Thêm các tiêu chuẩn từ tiêu chí được giao
    const criteriaTasks = tasks.filter(t => t.reportType === REPORT_TYPES.CRITERIA && t.criteriaId);
    const criteriaIds = criteriaTasks.map(t => t.criteriaId);

    if (criteriaIds.length > 0) {
        const criteria = await Criteria.find({ _id: { $in: criteriaIds }, academicYearId }).select('standardId');
        criteria.forEach(c => standardIds.add(c.standardId.toString()));
    }

    return Array.from(standardIds).map(id => new mongoose.Types.ObjectId(id));
};

// ⭐️ LẤY DANH SÁCH ID TIÊU CHÍ MÀ USER CÓ QUYỀN TRUY CẬP
const getAccessibleCriteriaIds = async (userId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole !== 'reporter') {
        const criteria = await Criteria.find({ academicYearId }).select('_id');
        return criteria.map(c => c._id);
    }

    const tasks = await getTasksForUser(userId, academicYearId, true);

    if (tasks.length === 0) {
        return [];
    }

    const criteriaIds = new Set();

    // Thêm các tiêu chí từ task trực tiếp
    tasks.forEach(t => {
        if (t.criteriaId) {
            criteriaIds.add(t.criteriaId.toString());
        }
    });

    // Thêm các tiêu chí từ các tiêu chuẩn được giao
    const standardIds = tasks
        .filter(t => t.standardId && !t.criteriaId)
        .map(t => t.standardId);

    if (standardIds.length > 0) {
        const criteriaByStandard = await Criteria.find({
            standardId: { $in: standardIds },
            academicYearId
        }).select('_id');

        criteriaByStandard.forEach(c => criteriaIds.add(c._id.toString()));
    }

    return Array.from(criteriaIds).map(id => new mongoose.Types.ObjectId(id));
};

// ⭐️ EXPORT TẤT CẢ FUNCTION
module.exports = {
    REPORT_TYPES,
    getUserRole,
    getTasksForUser,
    getPermissionsByUserId,
    canEditStandard,
    canEditCriteria,
    canWriteReport,
    canAssignReporters,
    canUploadEvidence,
    canManageFiles,
    getAccessibleReportTypes,
    getAccessibleStandardIds,
    getAccessibleCriteriaIds
};