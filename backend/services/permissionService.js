const Task = require('../models/Task/Task');
const Standard = require('../models/Evidence/Standard');
const Criteria = require('../models/Evidence/Criteria');
const User = require('../models/User/User');
const Evidence = require('../models/Evidence/Evidence');
const mongoose = require('mongoose');

const REPORT_TYPES = {
    OVERALL_TDG: 'overall_tdg',
    STANDARD: 'standard',
    CRITERIA: 'criteria'
};

const getUserRole = async (userId) => {
    try {
        const User = require('../models/User/User');
        const user = await User.findById(userId);
        return user ? user.role : null;
    } catch (e) {
        console.error("Error loading User Model in permissionService:", e.message);
        return null;
    }
};

const getTasksForUser = (userId, academicYearId) => {
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
    if (hasOverallTask) return true;

    const hasStandardTask = tasks.some(t =>
        t.reportType === REPORT_TYPES.STANDARD && t.standardId.toString() === criteriaStandardId
    );
    if (hasStandardTask) return true;

    const hasCriteriaTask = tasks.some(t =>
        t.reportType === REPORT_TYPES.CRITERIA && t.criteriaId && t.criteriaId.toString() === criteriaId.toString()
    );

    return hasStandardTask || hasCriteriaTask;
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

        return tasks.some(t =>
            t.reportType === REPORT_TYPES.OVERALL_TDG ||
            (t.reportType === REPORT_TYPES.STANDARD && t.standardId.toString() === criteriaStandardId)
        );
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