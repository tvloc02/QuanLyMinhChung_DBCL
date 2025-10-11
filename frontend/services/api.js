import axios from 'axios'
import { getLocalStorage, removeLocalStorage } from '../utils/helpers'
import toast from 'react-hot-toast'

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
})

api.interceptors.request.use(
    (config) => {
        const token = getLocalStorage('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        const selectedYear = getLocalStorage('selected_academic_year')
        if (selectedYear?.id) {
            config.headers['switchToYearId'] = selectedYear.id
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if (error.response?.status === 401) {
            removeLocalStorage('token')
            removeLocalStorage('user')
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login'
            }
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            toast.error('Bạn không có quyền thực hiện hành động này')
        }

        // Handle 500 Internal Server Error
        if (error.response?.status >= 500) {
            toast.error('Có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau.')
        }

        return Promise.reject(error)
    }
)

// API Methods
export const apiMethods = {
    // Auth
    auth: {
        login: (credentials) => api.post('/auth/login', credentials),
        logout: () => api.post('/auth/logout'),
        me: () => api.get('/auth/me'),
        updateProfile: (data) => api.put('/auth/profile', data),
        changePassword: (data) => api.post('/auth/change-password', data),
        forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
        resetPassword: (token, password) => api.post('/auth/reset-password', { token, password })
    },

    // Academic Years
    academicYears: {
        getAll: (params) => api.get('/academic-years', { params }),
        getCurrent: () => api.get('/academic-years/current'),
        getById: (id) => api.get(`/academic-years/${id}`),
        create: (data) => api.post('/academic-years', data),
        update: (id, data) => api.put(`/academic-years/${id}`, data),
        delete: (id) => api.delete(`/academic-years/${id}`),
        setCurrent: (id) => api.post(`/academic-years/${id}/set-current`),
        copyData: (id, sourceYearId, copySettings) =>
            api.post(`/academic-years/${id}/copy-data`, { sourceYearId, copySettings }),
        getStatistics: (id) => api.get(`/academic-years/${id}/statistics`)
    },

    // Users
    users: {
        getAll: (params) => api.get('/users', { params }),
        getById: (id) => api.get(`/users/${id}`),
        create: (data) => api.post('/users', data),
        update: (id, data) => api.put(`/users/${id}`, data),
        delete: (id) => api.delete(`/users/${id}`),
        changeStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
        resetPassword: (id) => api.post(`/users/${id}/reset-password`),
        getStats: () => api.get('/users/statistics'),
        bulkImport: (file) => {
            const formData = new FormData()
            formData.append('file', file)
            return api.post('/users/bulk-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        // User permissions management
        getPermissions: (id) => api.get(`/users/${id}/permissions`),
        addToGroups: (id, groupIds) => api.post(`/users/${id}/groups`, { groupIds }),
        removeFromGroups: (id, groupIds) => api.delete(`/users/${id}/groups`, { data: { groupIds } }),
        grantPermission: (id, permissionId) => api.post(`/users/${id}/permissions/grant`, { permissionId }),
        denyPermission: (id, permissionId) => api.post(`/users/${id}/permissions/deny`, { permissionId }),
        removePermission: (id, permissionId) => api.delete(`/users/${id}/permissions`, { data: { permissionId } })
    },


    // Programs
    programs: {
        getAll: (params) => axios.get('http://localhost:5000/api/programs', { params }),
        getById: (id) => axios.get(`http://localhost:5000/api/programs/${id}`),
        create: (data) => axios.post('http://localhost:5000/api/programs', data),
        update: (id, data) => axios.put(`http://localhost:5000/api/programs/${id}`, data),
        delete: (id) => axios.delete(`http://localhost:5000/api/programs/${id}`),
        getByAcademicYear: (academicYearId) => axios.get(`http://localhost:5000/api/programs/academic-year/${academicYearId}`)
    },

    organizations: {
        getAll: (params) => api.get('/api/organizations', { params }),
        getById: (id) => api.get(`/api/organizations/${id}`),
        create: (data) => api.post('/api/organizations', data),
        update: (id, data) => api.put(`/api/organizations/${id}`, data),
        delete: (id) => api.delete(`/api/organizations/${id}`),
        getByAcademicYear: (academicYearId) => api.get(`/api/organizations/academic-year/${academicYearId}`)
    },

    standards: {
        getAll: (params) => api.get('/api/standards', { params }),
        getById: (id) => api.get(`/api/standards/${id}`),
        create: (data) => api.post('/api/standards', data),
        update: (id, data) => api.put(`/api/standards/${id}`, data),
        delete: (id) => api.delete(`/api/standards/${id}`),
        getByProgram: (programId, organizationId) =>
            api.get(`/api/standards/program/${programId}/organization/${organizationId}`),
        getByAcademicYear: (academicYearId) => api.get(`/api/standards/academic-year/${academicYearId}`)
    },

    criteria: {
        getAll: (params) => api.get('/api/criteria', { params }),
        getById: (id) => api.get(`/api/criteria/${id}`),
        create: (data) => api.post('/api/criteria', data),
        update: (id, data) => api.put(`/api/criteria/${id}`, data),
        delete: (id) => api.delete(`/api/criteria/${id}`),
        getByStandard: (standardId) => api.get(`/api/criteria/standard/${standardId}`),
        getByProgram: (programId, organizationId) =>
            api.get(`/api/criteria/program/${programId}/organization/${organizationId}`),
        getByAcademicYear: (academicYearId) => api.get(`/api/criteria/academic-year/${academicYearId}`),
        import: (formData) => api.post('/api/criteria/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        bulkImport: (formData) => api.post('/api/criteria/bulk-import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    // Evidences
    evidences: {
        getAll: (params) => api.get('/api/evidences', { params }),
        getById: (id) => api.get(`/api/evidences/${id}`),
        create: (data) => api.post('/api/evidences', data),
        update: (id, data) => api.put(`/api/evidences/${id}`, data),
        delete: (id) => api.delete(`/api/evidences/${id}`),
        bulkDelete: (ids) => api.post('/api/evidences/bulk-delete', { ids }),
        search: (params) => api.get('/api/evidences/search', { params }),

        getTree: (programId, organizationId) =>
            api.get('/api/evidences/tree', {
                params: { programId, organizationId }
            }),

        getFullTree: (programId, organizationId) =>
            api.get('/api/evidences/full-tree', {
                params: { programId, organizationId }
            }),

        getStatistics: () => api.get('/api/evidences/statistics'),
        generateCode: (standardCode, criteriaCode) =>
            api.post('/api/evidences/generate-code', { standardCode, criteriaCode }),
        copy: (id, targetAcademicYearId, targetStandardId, targetCriteriaId) =>
            api.post(`/api/evidences/${id}/copy`, {
                targetAcademicYearId,
                targetStandardId,
                targetCriteriaId
            }),
        move: (id, targetStandardId, targetCriteriaId) =>
            api.post(`/api/evidences/${id}/move`, { targetStandardId, targetCriteriaId }),
        getByAcademicYear: (academicYearId) => api.get(`/api/evidences/academic-year/${academicYearId}`),

        // SỬA LỖI: Đổi tên importWithMode thành import và chỉ nhận formData
        import: (formData) => {
            return api.post('/api/evidences/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },

        // Hàm importWithMode cũ (và import cũ) đã được hợp nhất vào hàm import phía trên.

        export: (params) => api.get('/api/evidences/export', {
            params,
            responseType: 'blob'
        }),

        exportData: (params) => api.get('/api/evidences/export', {
            params,
            responseType: 'blob'
        })
    },

    // Files
    files: {
        upload: (file, evidenceId, config = {}) => {
            const formData = new FormData()
            formData.append('files', file)
            return api.post(`/api/files/upload/${evidenceId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                ...config
            })
        },
        uploadMultiple: (files, evidenceId, config = {}) => {
            const formData = new FormData()
            files.forEach(file => {
                formData.append('files', file)
            })
            return api.post(`/api/files/upload/${evidenceId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                ...config
            })
        },
        getById: (id) => api.get(`/api/files/${id}`),
        download: (id) => api.get(`/api/files/download/${id}`, {
            responseType: 'blob'
        }),
        delete: (id) => api.delete(`/api/files/${id}`),
        getByEvidence: (evidenceId) => api.get(`/api/files/evidence/${evidenceId}`)
    },

    // Reports
    reports: {
        getAll: (params) => api.get('/api/reports', { params }),
        getById: (id) => api.get(`/api/reports/${id}`),
        create: (data) => api.post('/api/reports', data),
        update: (id, data) => api.put(`/api/reports/${id}`, data),
        delete: (id) => api.delete(`/api/reports/${id}`),
        publish: (id) => api.post(`/api/reports/${id}/publish`),

        addVersion: (id, content, changeNote) =>
            api.post(`/api/reports/${id}/versions`, { content, changeNote }),
        getVersions: (id) => api.get(`/api/reports/${id}/versions`),

        linkEvidences: (id) => api.post(`/api/reports/${id}/link-evidences`),
        getEvidences: (id) => api.get(`/api/reports/${id}/evidences`),
        validateEvidenceLinks: (id) => api.post(`/api/reports/${id}/validate-evidence-links`),

        uploadFile: (id, file, onProgress) => {
            const formData = new FormData()
            formData.append('file', file)
            return api.post(`/api/reports/${id}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        )
                        onProgress(progress)
                    }
                }
            })
        },
        downloadFile: (id) => api.get(`/api/reports/${id}/download-file`, {
            responseType: 'blob'
        }),
        convertFileToContent: (id) => api.post(`/api/reports/${id}/convert`),
        download: (id, format = 'html') => api.get(`/api/reports/${id}/download`, {
            params: { format },
            responseType: 'blob'
        }),

        addReviewer: (id, reviewerId, reviewerType) =>
            api.post(`/api/reports/${id}/reviewers`, { reviewerId, reviewerType }),
        removeReviewer: (id, reviewerId, reviewerType) =>
            api.delete(`/api/reports/${id}/reviewers`, { data: { reviewerId, reviewerType } }),

        addComment: (id, comment, section) =>
            api.post(`/api/reports/${id}/comments`, { comment, section }),
        resolveComment: (id, commentId) =>
            api.put(`/api/reports/${id}/comments/${commentId}/resolve`),

        getStats: (params) => api.get('/api/reports/stats', { params }),
        generateCode: (type, standardCode, criteriaCode) =>
            api.post('/api/reports/generate-code', { type, standardCode, criteriaCode }),

        bulkAddReviewers: (data) =>
            api.post('/api/reports/bulk/reviewers', data),
        bulkRemoveReviewers: (data) =>
            api.delete('/api/reports/bulk/reviewers', { data }),

        bulkDelete: (reportIds) =>
            api.post('/api/reports/bulk/delete', { reportIds }),
        bulkPublish: (reportIds) =>
            api.post('/api/reports/bulk/publish', { reportIds }),
        bulkArchive: (reportIds) =>
            api.post('/api/reports/bulk/archive', { reportIds }),
    },

    // Assignments
    assignments: {
        getAll: (params) => api.get('/assignments', { params }),
        getById: (id) => api.get(`/assignments/${id}`),
        create: (data) => api.post('/assignments', data),
        update: (id, data) => api.put(`/assignments/${id}`, data),
        delete: (id) => api.delete(`/assignments/${id}`),
        accept: (id, responseNote) => api.post(`/assignments/${id}/accept`, { responseNote }),
        reject: (id, responseNote) => api.post(`/assignments/${id}/reject`, { responseNote }),
        cancel: (id, reason) => api.post(`/assignments/${id}/cancel`, { reason }),
        getByExpert: (expertId, params) => api.get(`/assignments/expert/${expertId}`, { params }),
        getWorkload: (expertId, academicYearId) =>
            api.get(`/assignments/expert/${expertId}/workload/${academicYearId}`),
        getStats: (academicYearId, params) =>
            api.get(`/assignments/stats/${academicYearId}`, { params }),
        getUpcomingDeadlines: (academicYearId, days) =>
            api.get(`/assignments/upcoming-deadlines/${academicYearId}`, { params: { days } })
    },

    // Evaluations
    evaluations: {
        getAll: (params) => api.get('/evaluations', { params }),
        getById: (id) => api.get(`/evaluations/${id}`),
        create: (data) => api.post('/evaluations', data),
        update: (id, data) => api.put(`/evaluations/${id}`, data),
        delete: (id) => api.delete(`/evaluations/${id}`),
        submit: (id) => api.post(`/evaluations/${id}/submit`),
        review: (id, comments) => api.post(`/evaluations/${id}/review`, { comments }),
        finalize: (id) => api.post(`/evaluations/${id}/finalize`),
        autoSave: (id, data) => api.post(`/evaluations/${id}/auto-save`, data),
        getByAssignment: (assignmentId) => api.get(`/evaluations/assignment/${assignmentId}`),
        getByEvaluator: (evaluatorId, params) => api.get(`/evaluations/evaluator/${evaluatorId}`, { params }),
        getStats: (evaluatorId, academicYearId) =>
            api.get(`/evaluations/stats/${evaluatorId}/${academicYearId}`),
        getEvaluatorStats: (evaluatorId) =>
            api.get(`/api/reports/evaluations/evaluator-stats/${evaluatorId}`),
        getSystemStats: () =>
            api.get('/api/reports/evaluations/system-stats'),
        getAverageScoreByReport: (reportId) =>
            api.get(`/api/reports/evaluations/average-score/${reportId}`)
    },

    // Notifications
    notifications: {
        getAll: (params) => api.get('/api/notifications', { params }),
        getById: (id) => api.get(`/api/notifications/${id}`),
        markAsRead: (id) => api.post(`/api/notifications/${id}/read`),
        markAllAsRead: () => api.post('/api/notifications/mark-all-read'),
        delete: (id) => api.delete(`/api/notifications/${id}`),
        getUnreadCount: () => api.get('/api/notifications/stats'),
        getStats: () => api.get('/api/notifications/stats')
    },

    // Activity Logs
    activityLogs: {
        getAll: (params) => api.get('/activity-logs', { params }),
        getUserActivity: (userId, params) => api.get(`/activity-logs/user/${userId}`, { params }),
        getAuditTrail: (targetType, targetId) =>
            api.get(`/activity-logs/audit/${targetType}/${targetId}`),
        getStats: (params) => api.get('/activity-logs/stats', { params })
    },

    // System
    system: {
        getStats: () => api.get('/system/stats'),
        getDashboard: () => api.get('/system/dashboard'),
        backup: () => api.post('/system/backup'),
        getHealth: () => api.get('/system/health')
    },

    // Permissions
    permissions: {
        getAll: (params) => api.get('/api/permissions', { params }),
        getByModule: () => api.get('/api/permissions/by-module'),
        getById: (id) => api.get(`/api/permissions/${id}`),
        create: (data) => api.post('/api/permissions', data),
        update: (id, data) => api.put(`/api/permissions/${id}`, data),
        delete: (id) => api.delete(`/api/permissions/${id}`),
        seed: () => api.post('/api/permissions/seed')
    },

    // User Groups - FIXED: Removed /api prefix
    userGroups: {
        getAll: (params) => api.get('/api/user-groups', { params }),
        getById: (id) => api.get(`/api/user-groups/${id}`),
        create: (data) => api.post('/api/user-groups', data),
        update: (id, data) => api.put(`/api/user-groups/${id}`, data),
        delete: (id) => api.delete(`/api/user-groups/${id}`),
        seed: () => api.post('/api/user-groups/seed'),

        addPermissions: (id, permissionIds) => api.post(`/api/user-groups/${id}/permissions`, { permissionIds }),
        removePermissions: (id, permissionIds) => api.delete(`/api/user-groups/${id}/permissions`, { data: { permissionIds } }),

        addMembers: (id, userIds) => api.post(`/api/user-groups/${id}/members`, { userIds }),
        removeMembers: (id, userIds) => api.delete(`/api/user-groups/${id}/members`, { data: { userIds } })
    },
}

// Utility functions
export const uploadFile = (file, evidenceId, onProgress) => {
    return apiMethods.files.upload(file, evidenceId, {
        onUploadProgress: (progressEvent) => {
            const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
            )
            if (onProgress) onProgress(progress)
        }
    })
}

export const downloadFile = async (fileId, filename) => {
    try {
        const response = await apiMethods.files.download(fileId)

        // Create blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename || 'file')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        return true
    } catch (error) {
        console.error('Download failed:', error)
        toast.error('Tải file thất bại')
        return false
    }
}

export default api