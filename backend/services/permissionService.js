const mongoose = require('mongoose');

const REPORT_TYPES = {
    OVERALL_TDG: 'overall_tdg',
    STANDARD: 'standard',
    CRITERIA: 'criteria'
};

// YÊU CẦU CÁC MODEL MỘT LẦN (tránh lazy require liên tục)
const User = require('../models/User/User');
const Task = require('../models/Task/Task');
const Criteria = require('../models/Evidence/Criteria');
const Standard = require('../models/Evidence/Standard');

const getUserRole = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user ? user.role : null;
    } catch (e) {
        console.error("Error loading User Model in permissionService:", e.message);
        return null;
    }
};

const getTasksForUser = (userId, academicYearId) => {
    // ⭐️ SỬ DỤNG academicYearId TRONG QUERY
    return Task.find({
        academicYearId,
        assignedTo: userId,
        status: { $in: ['pending', 'in_progress', 'submitted'] }
    });
};

const getAccessibleReportTypes = async (userId, academicYearId) => {
    const userRole = await getUserRole(userId);
    if (userRole === 'admin' || userRole === 'manager') {
        return [REPORT_TYPES.OVERALL_TDG, REPORT_TYPES.STANDARD, REPORT_TYPES.CRITERIA];
    }
    const tasks = await getTasksForUser(userId, academicYearId);
    return tasks.map(t => t.reportType) || [];
};

const getPermissionsByUserId = async (userId, academicYearId) => {
    const accessibleReportTypes = await getAccessibleReportTypes(userId, academicYearId);

    const permissions = [
        { code: 'USER_VIEW', name: 'Xem người dùng', module: 'USER' },
        { code: 'CRITERIA_VIEW', name: 'Xem tiêu chí', module: 'CRITERIA' },
        { code: 'STANDARD_VIEW', name: 'Xem tiêu chuẩn', module: 'STANDARD' }
    ];

    if (accessibleReportTypes.includes(REPORT_TYPES.OVERALL_TDG)) {
        permissions.push({ code: 'REPORT_TDG_WRITE', name: 'Viết báo cáo TĐG', module: 'REPORT' });
        permissions.push({ code: 'STANDARD_EDIT', name: 'Sửa tiêu chuẩn', module: 'STANDARD' });
        permissions.push({ code: 'CRITERIA_EDIT', name: 'Sửa tiêu chí', module: 'CRITERIA' });
        permissions.push({ code: 'EVIDENCE_UPLOAD', name: 'Upload minh chứng', module: 'EVIDENCE' });
    }

    if (accessibleReportTypes.includes(REPORT_TYPES.STANDARD)) {
        permissions.push({ code: 'REPORT_STANDARD_WRITE', name: 'Viết báo cáo Tiêu chuẩn', module: 'REPORT' });
        permissions.push({ code: 'CRITERIA_EDIT', name: 'Sửa tiêu chí', module: 'CRITERIA' });
        permissions.push({ code: 'EVIDENCE_UPLOAD', name: 'Upload minh chứng', module: 'EVIDENCE' });
    }

    if (accessibleReportTypes.includes(REPORT_TYPES.CRITERIA)) {
        permissions.push({ code: 'REPORT_CRITERIA_WRITE', name: 'Viết báo cáo Tiêu chí', module: 'REPORT' });
        permissions.push({ code: 'EVIDENCE_UPLOAD', name: 'Upload minh chứng', module: 'EVIDENCE' });
    }

    return permissions;
};


const canWriteReport = async (userId, reportType, academicYearId) => {
    const userRole = await getUserRole(userId);
    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }
    const tasks = await getTasksForUser(userId, academicYearId);
    return tasks.some(t => t.reportType === reportType);
};

const canEditStandard = async (userId, standardId, academicYearId) => {
    const userRole = await getUserRole(userId);
    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const tasks = await getTasksForUser(userId, academicYearId);

    const hasOverallTask = tasks.some(t => t.reportType === REPORT_TYPES.OVERALL_TDG);
    if (hasOverallTask) {
        return true;
    }

    const hasStandardTask = tasks.some(t =>
        t.reportType === REPORT_TYPES.STANDARD && t.standardId.toString() === standardId.toString()
    );

    return hasStandardTask;
};

const canEditCriteria = async (userId, criteriaId, academicYearId) => {
    const userRole = await getUserRole(userId);
    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const criteria = await Criteria.findById(criteriaId);
    if (!criteria) return false;

    const tasks = await getTasksForUser(userId, academicYearId);
    const criteriaStandardId = criteria.standardId.toString();

    const hasOverallTask = tasks.some(t => t.reportType === REPORT_TYPES.OVERALL_TDG);

    const hasStandardTask = tasks.some(t =>
        t.reportType === REPORT_TYPES.STANDARD && t.standardId.toString() === criteriaStandardId
    );

    const hasCriteriaTask = tasks.some(t =>
        t.reportType === REPORT_TYPES.CRITERIA && t.criteriaId && t.criteriaId.toString() === criteriaId.toString()
    );

    return hasOverallTask || hasStandardTask || hasCriteriaTask;
};

const canAssignReporters = async (userId, standardId, criteriaId, academicYearId) => {
    const userRole = await getUserRole(userId);
    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const tasks = await getTasksForUser(userId, academicYearId);

    if (criteriaId) {
        const criteria = await Criteria.findById(criteriaId);
        if (!criteria) return false;
        const criteriaStandardId = criteria.standardId.toString();

        const canAssign = tasks.some(t =>
            t.reportType === REPORT_TYPES.OVERALL_TDG ||
            (t.reportType === REPORT_TYPES.STANDARD && t.standardId.toString() === criteriaStandardId)
        );
        return canAssign;
    }

    if (standardId) {
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

    const tasks = await getTasksForUser(userId, academicYearId);
    const criteriaStandardId = criteria.standardId.toString();

    const hasOverallOrStandardTask = tasks.some(t =>
        t.reportType === REPORT_TYPES.OVERALL_TDG ||
        (t.reportType === REPORT_TYPES.STANDARD && t.standardId.toString() === criteriaStandardId)
    );

    const hasCriteriaTask = tasks.some(t =>
        t.reportType === REPORT_TYPES.CRITERIA && t.criteriaId && t.criteriaId.toString() === criteriaId.toString()
    );

    return hasOverallOrStandardTask || hasCriteriaTask;
};

const canManageFiles = async (userId, criteriaId, academicYearId) => {
    return await canUploadEvidence(userId, criteriaId, academicYearId);
};

const getAccessibleStandardIds = async (userId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole !== 'reporter') {
        const standards = await Standard.find({ academicYearId }).select('_id');
        return standards.map(s => s._id);
    }

    const tasks = await getTasksForUser(userId, academicYearId);

    if (tasks.length === 0) {
        const standards = await Standard.find({ academicYearId }).select('_id');
        return standards.map(s => s._id);
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

    const tasks = await getTasksForUser(userId, academicYearId);

    if (tasks.length === 0) {
        const criteria = await Criteria.find({ academicYearId }).select('_id');
        return criteria.map(c => c._id);
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