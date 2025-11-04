const mongoose = require('mongoose');

const REPORT_TYPES = {
    OVERALL_TDG: 'overall_tdg',
    STANDARD: 'standard',
    CRITERIA: 'criteria'
};

const User = require('../models/User/User');
const Task = require('../models/Task/Task');
const Criteria = require('../models/Evidence/Criteria');
const Standard = require('../models/Evidence/Standard');

const getUserRole = async (userId) => {
// ... (Hàm getUserRole giữ nguyên)
    try {
        const user = await User.findById(userId);
        return user ? user.role : null;
    } catch (e) {
        console.error("Error loading User Model in permissionService:", e.message);
        return null;
    }
};

const getTasksForUser = (userId, academicYearId, includeAllStatuses = false) => {
// ... (Hàm getTasksForUser giữ nguyên)
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

const getAccessibleReportTypes = async (userId, academicYearId) => {
// ... (Hàm getAccessibleReportTypes giữ nguyên)
    const userRole = await getUserRole(userId);
    if (userRole === 'admin' || userRole === 'manager') {
        return [REPORT_TYPES.OVERALL_TDG, REPORT_TYPES.STANDARD, REPORT_TYPES.CRITERIA];
    }
    const tasks = await getTasksForUser(userId, academicYearId, true);
    const uniqueReportTypes = Array.from(new Set(tasks.map(t => t.reportType)));
    return uniqueReportTypes || [];
};

const getPermissionsByUserId = async (userId, academicYearId) => {
// ... (Hàm getPermissionsByUserId giữ nguyên)
    const accessibleReportTypes = await getAccessibleReportTypes(userId, academicYearId);
    const permissions = [ /* ... */ ];
    // ...
    return permissions;
};

// ⭐️ ĐÃ SỬA: canWriteReport cần biết Standard/Criteria ID và đồng bộ với quyền Sửa
const canWriteReport = async (userId, reportType, academicYearId, standardId, criteriaId = null) => {
    const userRole = await getUserRole(userId);
    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    // Nếu Reporter có quyền Sửa Tiêu chuẩn/Tiêu chí này, họ PHẢI có quyền Viết báo cáo.
    if (criteriaId) {
        const canEdit = await canEditCriteria(userId, criteriaId, academicYearId);
        if (canEdit) return true;
    } else if (standardId) {
        const canEdit = await canEditStandard(userId, standardId, academicYearId);
        if (canEdit) return true;
    }

    // Logic dự phòng (Kiểm tra lại Task cụ thể)
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
            (t.reportType === REPORT_TYPES.CRITERIA && t.criteriaId && t.criteriaId.toString() === criteriaId)
        );
    }

    return false;
};

// ... (Các hàm canEditStandard, canEditCriteria, canAssignReporters, canUploadEvidence giữ nguyên)
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
            t.reportType === REPORT_TYPES.OVERALL_TDG
        );
    }

    return false;
};

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
// ... (Các hàm getAccessible... giữ nguyên)


const canManageFiles = async (userId, criteriaId, academicYearId) => {
    return await canUploadEvidence(userId, criteriaId, academicYearId);
};

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
    tasks.forEach(t => {
        if (t.standardId) {
            standardIds.add(t.standardId.toString());
        }
    });

    const criteriaTasks = tasks.filter(t => t.reportType === REPORT_TYPES.CRITERIA && t.criteriaId);
    const criteriaIds = criteriaTasks.map(t => t.criteriaId);
    if (criteriaIds.length > 0) {
        const criteria = await Criteria.find({ _id: { $in: criteriaIds }, academicYearId }).select('standardId');
        criteria.forEach(c => standardIds.add(c.standardId.toString()));
    }

    return Array.from(standardIds).map(id => new mongoose.Types.ObjectId(id));
};

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
    tasks.forEach(t => {
        if (t.criteriaId) {
            criteriaIds.add(t.criteriaId.toString());
        }
    });

    const standardIds = tasks.filter(t => t.standardId && !t.criteriaId).map(t => t.standardId);
    if (standardIds.length > 0) {
        const criteriaByStandard = await Criteria.find({ standardId: { $in: standardIds }, academicYearId }).select('_id');
        criteriaByStandard.forEach(c => criteriaIds.add(c._id.toString()));
    }

    return Array.from(criteriaIds).map(id => new mongoose.Types.ObjectId(id));
};


module.exports = {
    REPORT_TYPES,
    getUserRole,
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