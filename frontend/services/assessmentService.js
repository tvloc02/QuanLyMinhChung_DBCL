import api from './api'

const assessmentService = {
    getAll: (params) => api.get('/api/reports/assessments', { params }),
    getById: (id) => api.get(`/api/reports/assessments/${id}`),
    getStatistics: (params) => api.get('/api/reports/assessments/statistics', { params }),
    addReviewer: (reportId, reviewerId, reviewerType) =>
        api.post(`/api/reports/${reportId}/reviewers`, { reviewerId, reviewerType }),
    removeReviewer: (reportId, reviewerId, reviewerType) =>
        api.delete(`/api/reports/${reportId}/reviewers`, {
            data: { reviewerId, reviewerType }
        }),
    updateReviewer: (reportId, reviewerId, reviewerType, permissions) =>
        api.put(`/api/reports/${reportId}/reviewers/${reviewerId}`, {
            reviewerType,
            permissions
        }),
    bulkAddReviewers: (data) =>
        api.post('/api/reports/assessments/bulk/reviewers', data),
    bulkRemoveReviewers: (data) =>
        api.delete('/api/reports/assessments/bulk/reviewers', { data }),
    getAvailableExperts: (params) =>
        api.get('/api/reports/assessments/available-experts', { params }),
    getAvailableAdvisors: (params) =>
        api.get('/api/reports/assessments/available-advisors', { params }),
    getByExpert: (expertId, params) =>
        api.get(`/api/reports/assessments/expert/${expertId}`, { params }),
    getByAdvisor: (advisorId, params) =>
        api.get(`/api/reports/assessments/advisor/${advisorId}`, { params }),
    checkAssignPermission: (reportId) =>
        api.get(`/api/reports/${reportId}/can-assign`),
    getAssignmentHistory: (reportId) =>
        api.get(`/api/reports/${reportId}/assignment-history`),
    notifyReviewers: (reportId, reviewerIds, message) =>
        api.post(`/api/reports/${reportId}/notify-reviewers`, {
            reviewerIds,
            message
        }),
    exportAssessments: (params, format = 'excel') =>
        api.get('/api/reports/assessments/export', {
            params: { ...params, format },
            responseType: 'blob'
        }),
    getByProgram: (programId, params) =>
        api.get(`/api/reports/assessments/program/${programId}`, { params }),
    getByOrganization: (organizationId, params) =>
        api.get(`/api/reports/assessments/organization/${organizationId}`, { params }),
    getByStandard: (standardId, params) =>
        api.get(`/api/reports/assessments/standard/${standardId}`, { params }),
    getByCriteria: (criteriaId, params) =>
        api.get(`/api/reports/assessments/criteria/${criteriaId}`, { params }),
    getExpertWorkload: (expertId) =>
        api.get(`/api/reports/assessments/expert/${expertId}/workload`),
    getAdvisorWorkload: (advisorId) =>
        api.get(`/api/reports/assessments/advisor/${advisorId}/workload`),
    suggestExperts: (reportId, limit = 5) =>
        api.get(`/api/reports/${reportId}/suggest-experts`, {
            params: { limit }
        }),

    suggestAdvisors: (reportId, limit = 5) =>
        api.get(`/api/reports/${reportId}/suggest-advisors`, {
            params: { limit }
        }),
    autoAssign: (reportId, options) =>
        api.post(`/api/reports/${reportId}/auto-assign`, options),
    rebalanceWorkload: (options) =>
        api.post('/api/reports/assessments/rebalance-workload', options),
    getTimeSeriesStats: (params) =>
        api.get('/api/reports/assessments/stats/timeseries', { params }),
    getStatsByType: (params) =>
        api.get('/api/reports/assessments/stats/by-type', { params }),
    getStatsByExpert: (params) =>
        api.get('/api/reports/assessments/stats/by-expert', { params }),
    getStatsByOrganization: (params) =>
        api.get('/api/reports/assessments/stats/by-organization', { params }),
    getDashboardData: (params) =>
        api.get('/api/reports/assessments/dashboard', { params }),
    sendReminder: (reportId, reviewerId, message) =>
        api.post(`/api/reports/${reportId}/send-reminder`, {
            reviewerId,
            message
        }),

    sendBatchReminders: (data) =>
        api.post('/api/reports/assessments/batch-reminders', data),
    getUpcomingDeadlines: (days = 7) =>
        api.get('/api/reports/assessments/upcoming-deadlines', {
            params: { days }
        }),
    getOverdueReports: (params) =>
        api.get('/api/reports/assessments/overdue', { params }),
    extendDeadline: (reportId, reviewerId, newDeadline, reason) =>
        api.post(`/api/reports/${reportId}/extend-deadline`, {
            reviewerId,
            newDeadline,
            reason
        }),

    requestExtension: (reportId, reviewerId, requestedDeadline, reason) =>
        api.post(`/api/reports/${reportId}/request-extension`, {
            reviewerId,
            requestedDeadline,
            reason
        }),

    approveExtension: (reportId, requestId) =>
        api.post(`/api/reports/${reportId}/approve-extension`, { requestId }),

    rejectExtension: (reportId, requestId, reason) =>
        api.post(`/api/reports/${reportId}/reject-extension`, {
            requestId,
            reason
        }),

    cloneAssignment: (sourceReportId, targetReportId) =>
        api.post('/api/reports/assessments/clone-assignment', {
            sourceReportId,
            targetReportId
        }),

    saveAsTemplate: (reportId, templateName, templateDescription) =>
        api.post('/api/reports/assessments/save-template', {
            reportId,
            templateName,
            templateDescription
        }),

    applyTemplate: (templateId, reportIds) =>
        api.post('/api/reports/assessments/apply-template', {
            templateId,
            reportIds
        }),
    getTemplates: (params) =>
        api.get('/api/reports/assessments/templates', { params }),
    deleteTemplate: (templateId) =>
        api.delete(`/api/reports/assessments/templates/${templateId}`),
}

export default assessmentService