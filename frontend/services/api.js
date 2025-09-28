import axios from 'axios'
import { getLocalStorage, removeLocalStorage } from '../utils/helpers'

// Create axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = getLocalStorage('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if (error.response?.status === 401) {
            removeLocalStorage('token')
            removeLocalStorage('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// API Methods
export const apiMethods = {
    // Auth endpoints
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.post('/auth/change-password', data),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { newPassword: password }),
    updateProfile: (data) => api.put('/auth/profile', data),

    // Academic Year endpoints
    getAcademicYears: (params) => api.get('/academic-years', { params }),
    getAllAcademicYears: () => api.get('/academic-years/all'),
    getAcademicYear: (id) => api.get(`/academic-years/${id}`),
    getCurrentAcademicYear: () => api.get('/academic-years/current'),
    createAcademicYear: (data) => api.post('/academic-years', data),
    updateAcademicYear: (id, data) => api.put(`/academic-years/${id}`, data),
    deleteAcademicYear: (id) => api.delete(`/academic-years/${id}`),
    setCurrentAcademicYear: (id) => api.post(`/academic-years/${id}/set-current`),
    copyDataFromYear: (id, data) => api.post(`/academic-years/${id}/copy-data`, data),
    getAcademicYearStatistics: (id) => api.get(`/academic-years/statistics/${id}`),
    getAvailableYearsForCopy: (id) => api.get(`/academic-years/${id}/available-for-copy`),

    // Evidence endpoints
    getEvidences: (params) => api.get('/evidences', { params }),
    getEvidence: (id) => api.get(`/evidences/${id}`),
    createEvidence: (data) => api.post('/evidences', data),
    updateEvidence: (id, data) => api.put(`/evidences/${id}`, data),
    deleteEvidence: (id) => api.delete(`/evidences/${id}`),
    copyEvidenceToYear: (id, data) => api.post(`/evidences/${id}/copy-to-year`, data),
    generateEvidenceCode: (data) => api.post('/evidences/generate-code', data),
    getEvidenceTree: (params) => api.get('/evidences/tree', { params }),
    advancedSearchEvidences: (data) => api.post('/evidences/advanced-search', data),
    getEvidenceStatistics: (params) => api.get('/evidences/statistics', { params }),
    exportEvidences: (params) => api.get('/evidences/export', { params, responseType: 'blob' }),
    importEvidences: (formData) => api.post('/evidences/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Programs endpoints
    getPrograms: (params) => api.get('/programs', { params }),
    getAllPrograms: () => api.get('/programs/all'),
    getProgram: (id) => api.get(`/programs/${id}`),
    createProgram: (data) => api.post('/programs', data),
    updateProgram: (id, data) => api.put(`/programs/${id}`, data),
    deleteProgram: (id) => api.delete(`/programs/${id}`),
    copyProgramToYear: (id, data) => api.post(`/programs/${id}/copy-to-year`, data),
    getProgramStatistics: (params) => api.get('/programs/statistics', { params }),

    // Organizations endpoints
    getOrganizations: (params) => api.get('/organizations', { params }),
    getAllOrganizations: () => api.get('/organizations/all'),
    getOrganization: (id) => api.get(`/organizations/${id}`),
    createOrganization: (data) => api.post('/organizations', data),
    updateOrganization: (id, data) => api.put(`/organizations/${id}`, data),
    deleteOrganization: (id) => api.delete(`/organizations/${id}`),
    getOrganizationStatistics: (params) => api.get('/organizations/statistics', { params }),

    // Standards endpoints
    getStandards: (params) => api.get('/standards', { params }),
    getStandardsByProgramAndOrg: (params) => api.get('/standards/by-program-org', { params }),
    getStandard: (id) => api.get(`/standards/${id}`),
    createStandard: (data) => api.post('/standards', data),
    updateStandard: (id, data) => api.put(`/standards/${id}`, data),
    deleteStandard: (id) => api.delete(`/standards/${id}`),
    getStandardStatistics: (params) => api.get('/standards/statistics', { params }),

    // Criteria endpoints
    getCriteria: (params) => api.get('/criteria', { params }),
    getCriteriaByStandard: (params) => api.get('/criteria/by-standard', { params }),
    getCriterion: (id) => api.get(`/criteria/${id}`),
    createCriterion: (data) => api.post('/criteria', data),
    updateCriterion: (id, data) => api.put(`/criteria/${id}`, data),
    deleteCriterion: (id) => api.delete(`/criteria/${id}`),
    getCriteriaStatistics: (params) => api.get('/criteria/statistics', { params }),

    // Assignments endpoints
    getAssignments: (params) => api.get('/assignments', { params }),
    getAssignment: (id) => api.get(`/assignments/${id}`),
    createAssignment: (data) => api.post('/assignments', data),
    updateAssignment: (id, data) => api.put(`/assignments/${id}`, data),
    deleteAssignment: (id) => api.delete(`/assignments/${id}`),
    acceptAssignment: (id, data) => api.post(`/assignments/${id}/accept`, data),
    rejectAssignment: (id, data) => api.post(`/assignments/${id}/reject`, data),
    getExpertWorkload: (expertId) => api.get(`/assignments/expert-workload/${expertId}`),
    getAssignmentStatistics: (params) => api.get('/assignments/statistics', { params }),

    // Evaluations endpoints
    getEvaluations: (params) => api.get('/evaluations', { params }),
    getEvaluation: (id) => api.get(`/evaluations/${id}`),
    createEvaluation: (data) => api.post('/evaluations', data),
    updateEvaluation: (id, data) => api.put(`/evaluations/${id}`, data),
    submitEvaluation: (id) => api.post(`/evaluations/${id}/submit`),
    reviewEvaluation: (id, data) => api.post(`/evaluations/${id}/review`, data),
    finalizeEvaluation: (id) => api.post(`/evaluations/${id}/finalize`),
    getEvaluatorStats: (evaluatorId) => api.get(`/evaluations/evaluator-stats/${evaluatorId}`),

    // Reports endpoints
    getReports: (params) => api.get('/reports', { params }),
    getReport: (id) => api.get(`/reports/${id}`),
    createReport: (data) => api.post('/reports', data),
    updateReport: (id, data) => api.put(`/reports/${id}`, data),
    deleteReport: (id) => api.delete(`/reports/${id}`),
    publishReport: (id) => api.post(`/reports/${id}/publish`),
    linkEvidences: (id) => api.post(`/reports/${id}/link-evidences`),
    generateReportCode: (data) => api.post('/reports/generate-code', data),

    // Notifications endpoints
    getNotifications: (params) => api.get('/notifications', { params }),
    markNotificationAsRead: (id) => api.post(`/notifications/${id}/read`),
    markAllNotificationsAsRead: () => api.post('/notifications/mark-all-read'),
    deleteNotification: (id) => api.delete(`/notifications/${id}`),
    getNotificationStats: () => api.get('/notifications/stats'),

    // User management endpoints
    getUsers: (params) => api.get('/users', { params }),
    getUser: (id) => api.get(`/users/${id}`),
    createUser: (data) => api.post('/users', data),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    deleteUser: (id) => api.delete(`/users/${id}`),
    updateUserStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
    resetUserPassword: (id) => api.post(`/users/${id}/reset-password`),
    updateUserPermissions: (id, data) => api.put(`/users/${id}/permissions`, data),
    getUserStatistics: () => api.get('/users/statistics'),

    // File endpoints
    uploadFiles: (evidenceId, formData) => api.post(`/files/upload/${evidenceId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    downloadFile: (id) => api.get(`/files/download/${id}`, { responseType: 'blob' }),
    deleteFile: (id) => api.delete(`/files/${id}`),
    getFileInfo: (id) => api.get(`/files/${id}/info`),
    getFilesByEvidence: (evidenceId, params) => api.get(`/files/evidence/${evidenceId}`, { params }),
    streamFile: (id) => api.get(`/files/stream/${id}`, { responseType: 'blob' }),

    // Dashboard endpoints
    getDashboardStats: () => api.get('/dashboard/stats'),
    getRecentActivities: (limit = 10) => api.get(`/dashboard/activities?limit=${limit}`),
    getProgressReport: () => api.get('/dashboard/progress')
}

export default api