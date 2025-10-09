import api from './api';

export const dashboardService = {
    // Admin Dashboard
    getAdminStats: async () => {
        const response = await api.get('/api/dashboard/admin/stats');
        return response.data;
    },

    getSystemActivities: async (limit = 10) => {
        const response = await api.get(`/api/activity-logs?limit=${limit}&sortOrder=desc`);
        return response.data;
    },

    getUserStatsByRole: async () => {
        const response = await api.get('/api/users/statistics');
        return response.data;
    },

    // Manager Dashboard
    getManagerStats: async () => {
        const response = await api.get('/api/dashboard/manager/stats');
        return response.data;
    },

    getPendingReports: async () => {
        const response = await api.get('/api/reports?status=pending');
        return response.data;
    },

    getMyAssignments: async () => {
        const response = await api.get('/api/assignments/my-assignments');
        return response.data;
    },

    // Expert Dashboard
    getExpertStats: async () => {
        const response = await api.get('/api/dashboard/expert/stats');
        return response.data;
    },

    getMyEvaluations: async () => {
        const response = await api.get('/api/evaluations?evaluatorId=me');
        return response.data;
    },

    getUpcomingDeadlines: async () => {
        const response = await api.get('/api/assignments/upcoming-deadlines');
        return response.data;
    },

    // Advisor Dashboard
    getAdvisorStats: async () => {
        const response = await api.get('/api/dashboard/advisor/stats');
        return response.data;
    },

    getRecentEvidences: async (limit = 10) => {
        const response = await api.get(`/api/evidences?limit=${limit}&sortOrder=desc`);
        return response.data;
    },

    getEvidencesByStandard: async () => {
        const response = await api.get('/api/evidences/statistics');
        return response.data;
    }
};