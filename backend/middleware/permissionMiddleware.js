const Task = require('../models/Task/Task');
const Standard = require('../models/Evidence/Standard');
const Criteria = require('../models/Evidence/Criteria');

const REPORT_TYPES = {
    OVERALL_TDG: 'overall_tdg',
    STANDARD: 'standard',
    CRITERIA: 'criteria'
};

const getReportTypeForUser = async (userId, academicYearId) => {
    const task = await Task.findOne({
        academicYearId,
        assignedTo: userId,
        status: { $in: ['pending', 'in_progress', 'submitted'] }
    });

    return task ? task.reportType : null;
};

const canEditStandard = async (userId, standardId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const task = await Task.findOne({
        academicYearId,
        assignedTo: userId,
        reportType: REPORT_TYPES.OVERALL_TDG,
        status: { $in: ['pending', 'in_progress', 'submitted'] }
    });

    return !!task;
};

const canEditCriteria = async (userId, criteriaId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const task = await Task.findOne({
        academicYearId,
        assignedTo: userId,
        reportType: { $in: [REPORT_TYPES.OVERALL_TDG, REPORT_TYPES.STANDARD] },
        status: { $in: ['pending', 'in_progress', 'submitted'] }
    });

    return !!task;
};

const canWriteReport = async (userId, reportType, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const task = await Task.findOne({
        academicYearId,
        assignedTo: userId,
        reportType: reportType,
        status: { $in: ['pending', 'in_progress', 'submitted'] }
    });

    return !!task;
};

const canAssignReporters = async (userId, standardId, criteriaId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    if (criteriaId) {
        const task = await Task.findOne({
            academicYearId,
            assignedTo: userId,
            criteriaId: criteriaId,
            reportType: { $in: [REPORT_TYPES.OVERALL_TDG, REPORT_TYPES.STANDARD] },
            status: { $in: ['pending', 'in_progress', 'submitted'] }
        });
        return !!task;
    }

    if (standardId) {
        const task = await Task.findOne({
            academicYearId,
            assignedTo: userId,
            standardId: standardId,
            reportType: REPORT_TYPES.OVERALL_TDG,
            status: { $in: ['pending', 'in_progress', 'submitted'] }
        });
        return !!task;
    }

    return false;
};

const canUploadEvidence = async (userId, criteriaId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        return true;
    }

    const task = await Task.findOne({
        academicYearId,
        assignedTo: userId,
        criteriaId: criteriaId,
        reportType: { $in: [REPORT_TYPES.OVERALL_TDG, REPORT_TYPES.STANDARD, REPORT_TYPES.CRITERIA] },
        status: { $in: ['pending', 'in_progress', 'submitted'] }
    });

    return !!task;
};

const canManageFiles = async (userId, criteriaId, academicYearId) => {
    return await canUploadEvidence(userId, criteriaId, academicYearId);
};

const getUserRole = async (userId) => {
    const User = require('../../models/User/User');
    const user = await User.findById(userId);
    return user ? user.role : null;
};

const getAccessibleReportTypes = async (userId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        return [REPORT_TYPES.OVERALL_TDG, REPORT_TYPES.STANDARD, REPORT_TYPES.CRITERIA];
    }

    const tasks = await Task.find({
        academicYearId,
        assignedTo: userId,
        status: { $in: ['pending', 'in_progress', 'submitted'] }
    }).distinct('reportType');

    return tasks || [];
};

const getAccessibleStandardIds = async (userId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        const standards = await Standard.find({ academicYearId }).select('_id');
        return standards.map(s => s._id);
    }

    const tasks = await Task.find({
        academicYearId,
        assignedTo: userId,
        reportType: REPORT_TYPES.OVERALL_TDG,
        status: { $in: ['pending', 'in_progress', 'submitted'] }
    }).select('standardId').distinct('standardId');

    return tasks || [];
};

const getAccessibleCriteriaIds = async (userId, academicYearId) => {
    const userRole = await getUserRole(userId);

    if (userRole === 'admin' || userRole === 'manager') {
        const criteria = await Criteria.find({ academicYearId }).select('_id');
        return criteria.map(c => c._id);
    }

    const tasks = await Task.find({
        academicYearId,
        assignedTo: userId,
        reportType: { $in: [REPORT_TYPES.OVERALL_TDG, REPORT_TYPES.STANDARD, REPORT_TYPES.CRITERIA] },
        status: { $in: ['pending', 'in_progress', 'submitted'] }
    }).select('criteriaId').distinct('criteriaId');

    return tasks || [];
};

module.exports = {
    REPORT_TYPES,
    getReportTypeForUser,
    canEditStandard,
    canEditCriteria,
    canWriteReport,
    canAssignReporters,
    canUploadEvidence,
    canManageFiles,
    getUserRole,
    getAccessibleReportTypes,
    getAccessibleStandardIds,
    getAccessibleCriteriaIds
};