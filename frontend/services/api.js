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
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),

    // Evidence endpoints
    getEvidences: (params) => api.get('/evidences', { params }),
    getEvidence: (id) => api.get(`/evidences/${id}`),
    createEvidence: (data) => api.post('/evidences', data),
    updateEvidence: (id, data) => api.put(`/evidences/${id}`, data),
    deleteEvidence: (id) => api.delete(`/evidences/${id}`),
    deleteMultipleEvidences: (ids) => api.delete('/evidences/bulk', { data: { ids } }),
    copyEvidence: (id, targetData) => api.post(`/evidences/${id}/copy`, targetData),
    moveEvidence: (id, targetData) => api.post(`/evidences/${id}/move`, targetData),
    importEvidences: (data) => api.post('/evidences/import', data),
    exportEvidences: (params) => api.get('/evidences/export', { params }),
    downloadMultipleEvidences: (ids) => api.post('/evidences/download', { ids }),
    generateEvidenceCode: (data) => api.post('/evidences/generate-code', data),
    getEvidenceTree: (programId) => api.get(`/evidences/tree/${programId}`),

    // Structure endpoints
    getPrograms: (params) => api.get('/programs', { params }),
    getProgram: (id) => api.get(`/programs/${id}`),
    createProgram: (data) => api.post('/programs', data),
    updateProgram: (id, data) => api.put(`/programs/${id}`, data),
    deleteProgram: (id) => api.delete(`/programs/${id}`),

    getOrganizations: (params) => api.get('/organizations', { params }),
    getOrganization: (id) => api.get(`/organizations/${id}`),
    createOrganization: (data) => api.post('/organizations', data),
    updateOrganization: (id, data) => api.put(`/organizations/${id}`, data),
    deleteOrganization: (id) => api.delete(`/organizations/${id}`),

    getStandards: (params) => api.get('/standards', { params }),
    getStandard: (id) => api.get(`/standards/${id}`),
    createStandard: (data) => api.post('/standards', data),
    updateStandard: (id, data) => api.put(`/standards/${id}`, data),
    deleteStandard: (id) => api.delete(`/standards/${id}`),

    getCriteria: (params) => api.get('/criteria', { params }),
    getCriterion: (id) => api.get(`/criteria/${id}`),
    createCriterion: (data) => api.post('/criteria', data),
    updateCriterion: (id, data) => api.put(`/criteria/${id}`, data),
    deleteCriterion: (id) => api.delete(`/criteria/${id}`),

    // User management endpoints
    getUsers: (params) => api.get('/users', { params }),
    getUser: (id) => api.get(`/users/${id}`),
    createUser: (data) => api.post('/users', data),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    deleteUser: (id) => api.delete(`/users/${id}`),
    updateUserStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),

    // File endpoints
    uploadFile: (formData) => api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    uploadMultipleFiles: (formData) => api.post('/files/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    downloadFile: (id) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
    deleteFile: (id) => api.delete(`/files/${id}`),
    getFileInfo: (id) => api.get(`/files/${id}`),

    // Report endpoints
    getStatistics: (params) => api.get('/reports/statistics', { params }),
    getEvidenceReport: (params) => api.get('/reports/evidence', { params }),
    exportReport: (type, params) => api.get(`/reports/export/${type}`, {
        params,
        responseType: 'blob'
    }),

    // Dashboard endpoints
    getDashboardStats: () => api.get('/dashboard/stats'),
    getRecentActivities: (limit = 10) => api.get(`/dashboard/activities?limit=${limit}`),
    getProgressReport: () => api.get('/dashboard/progress')
}

export default api