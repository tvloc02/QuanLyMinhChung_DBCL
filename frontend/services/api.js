import axios from 'axios'
import { getLocalStorage, removeLocalStorage } from '../utils/helpers'
import toast from 'react-hot-toast'

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
})

export const publicApi = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
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

        if (error.response?.status === 403) {
            toast.error('Bạn không có quyền thực hiện hành động này')
        }

        if (error.response?.status >= 500) {
            toast.error('Có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau.')
        }

        return Promise.reject(error)
    }
)

publicApi.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        return Promise.reject(error)
    }
)

export const apiMethods = {
    auth: {
        login: (credentials) => api.post('/auth/login', credentials),
        logout: () => api.post('/auth/logout'),
        me: () => api.get('/auth/me'),
        updateProfile: (data) => api.put('/auth/profile', data),
        changePassword: (data) => api.post('/auth/change-password', data),
        forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
        resetPassword: (token, password) => api.post('/auth/reset-password', { token, password })
    },

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

    users: {
        getProfile: () => api.get('/api/auth/me'),
        getAll: (params) => api.get('/api/users', { params }),
        getById: (id) => api.get(`/api/users/${id}`),
        create: (data) => api.post('/api/users', data),
        update: (id, data) => api.put(`/api/users/${id}`, data),
        delete: (id) => api.delete(`/api/users/${id}`),
        changeStatus: (id, status) => api.patch(`/api/users/${id}/status`, { status }),
        resetPassword: (id) => api.post(`/api/users/${id}/reset-password`),// Đổi expert -> evaluator
        bulkImport: (file) => {
            const formData = new FormData()
            formData.append('file', file)
            return api.post('/users/bulk-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        removePermission: (id, permissionId) => api.delete(`/api/users/${id}/permissions`, { data: { permissionId } })
    },

    programs: {
        getAll: (params) => api.get('/api/programs', { params }),
        getById: (id) => api.get(`/api/programs/${id}`),
        create: (data) => api.post('/api/programs', data),
        update: (id, data) => api.put(`/api/programs/${id}`, data),
        delete: (id) => api.delete(`/api/programs/${id}`),
        getByAcademicYear: (academicYearId) => api.get(`/api/programs/academic-year/${academicYearId}`)
    },

    organizations: {
        getAll: (params) => api.get('/api/organizations', { params }),
        getById: (id) => api.get(`/api/organizations/${id}`),
        create: (data) => api.post('/api/organizations', data),
        update: (id, data) => api.put('/api/organizations/${id}', data),
        delete: (id) => api.delete('/api/organizations/${id}'),
        getByAcademicYear: (academicYearId) => api.get('/api/organizations/academic-year/${academicYearId}')
    },

    standards: {
        getAll: (params) => api.get('/api/standards', { params }),
        getById: (id) => api.get(`/api/standards/${id}`),
        create: (data) => api.post('/api/standards', data),
        update: (id, data) => api.put('/api/standards/${id}', data),
        delete: (id) => api.delete('/api/standards/${id}'),
        getByProgram: (programId, organizationId) =>
            api.get('/api/standards/program/${programId}/organization/${organizationId}'),
        getByAcademicYear: (academicYearId) => api.get('/api/standards/academic-year/${academicYearId}')
    },

    criteria: {
        getAll: (params) => api.get('/api/criteria', { params }),
        getById: (id) => api.get(`/api/criteria/${id}`),
        create: (data) => api.post('/api/criteria', data),
        update: (id, data) => api.put('/api/criteria/${id}', data),
        delete: (id) => api.delete('/api/criteria/${id}'),
        getByStandard: (standardId) => api.get('/api/criteria/standard/${standardId}'),
        getByProgram: (programId, organizationId) =>
            api.get('/api/criteria/program/${programId}/organization/${organizationId}'),
        getByAcademicYear: (academicYearId) => api.get('/api/criteria/academic-year/${academicYearId}'),
        import: (formData) => api.post('/api/criteria/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        bulkImport: (formData) => api.post('/api/criteria/bulk-import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    tasks: {
        getAll: (params) => api.get('/api/tasks', { params }),
        getById: (id) => api.get(`/api/tasks/${id}`),
        create: (data) => api.post('/api/tasks', data),
        update: (id, data) => api.put(`/api/tasks/${id}`, data),
        delete: (id) => api.delete(`/api/tasks/${id}`),
        getByCriteria: (criteriaId) => api.get('/api/tasks/by-criteria', { params: { criteriaId } }),
        submitReport: (id, reportId) => api.post(`/api/tasks/${id}/submit-report`, { reportId }),
        reviewReport: (id, data) => api.post(`/api/tasks/${id}/review-report`, data)
    },

// Cập nhật apiMethods.evidences - đảm bảo có getFullTree:

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
        move: (id, data) =>
            api.post(`/api/evidences/${id}/move`, data),
        getByAcademicYear: (academicYearId) => api.get(`/api/evidences/academic-year/${academicYearId}`),

        import: (formData) => {
            return api.post('/api/evidences/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        export: (params) => api.get('/api/evidences/export', {
            params,
            responseType: 'blob'
        }),

        exportData: (params) =>
            api.get('/api/evidences/export', {
                params,
                responseType: 'blob'
            }),
        getEvidences: (id) => api.get(`/api/reports/${id}/evidences`),
        download: (id, format = 'html') => api.get(`/api/reports/${id}/download`, {
            params: { format },
            responseType: 'arraybuffer'
        }),
    },

// Cập nhật apiMethods.files - đảm bảo có uploadMultiple:

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
        getByEvidence: (evidenceId) => api.get(`/api/files/evidence/${evidenceId}`),
        approve: (fileId, data) => {
            return api.post(`/api/evidences/files/${fileId}/approve`, data)
        }
    },

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

        download: (id, format = 'html') => api.get(`/api/reports/${id}/download`, {
            params: { format },
            responseType: 'blob'
        }),

        addComment: (id, comment, section) =>
            api.post(`/api/reports/${id}/comments`, { comment, section }),
        getComments: (id) => api.get(`/api/reports/${id}/comments`),
        resolveComment: (id, commentId) =>
            api.put(`/api/reports/${id}/comments/${commentId}/resolve`),

        getStats: (params) => api.get('/api/reports/stats', { params }),
        generateCode: (type, standardCode, criteriaCode) =>
            api.post('/api/reports/generate-code', { type, standardCode, criteriaCode }),

        bulkDelete: (reportIds) =>
            api.post('/api/reports/bulk/delete', { reportIds }),
        bulkPublish: (reportIds) =>
            api.post('/api/reports/bulk/publish', { reportIds }),
        bulkArchive: (reportIds) =>
            api.post('/api/reports/bulk/archive', { reportIds }),
        unpublish: (id) => api.post(`/api/reports/${id}/unpublish`),
    },

    assignments: {
        getAll: (params) => api.get('/api/assignments', { params }),
        getById: (id) => api.get(`/api/assignments/${id}`),
        create: (data) => api.post('/api/assignments', data),
        update: (id, data) => api.put(`/api/assignments/${id}`, data),
        delete: (id) => api.delete(`/api/assignments/${id}`),
        getExpertWorkload: (expertId) => api.get(`/api/assignments/evaluator-workload/${expertId}`),
        getStats: () => api.get('/api/assignments/stats'),
        accept: (id) => api.post(`/api/assignments/${id}/accept`),
        reject: (id, responseNote) => api.post(`/api/assignments/${id}/reject`, { responseNote }),
        cancel: (id, responseNote) => api.post(`/api/assignments/${id}/cancel`, { responseNote }),
        getWorkload: (expertId) =>
            api.get('/api/assignments/evaluator-workload', { params: { expertId } }),
        getUpcomingDeadlines: (academicYearId, days) =>
            api.get('/api/assignments/upcoming-deadlines', { params: { days } }),

        bulkCreate: (data) => api.post('/api/assignments/bulk-create', data)
    },

    evaluations: {
        getAll: (params) => api.get('/api/evaluations', { params }),
        getById: (id) => api.get(`/api/evaluations/${id}`),
        create: (data) => api.post('/api/evaluations', data),
        update: (id, data) => api.put('/api/evaluations/${id}', data),
        submit: (id) => api.post('/api/evaluations/${id}/submit'),
        review: (id, data) => api.post('/api/evaluations/${id}/review', data),
        finalize: (id, data) => api.post('/api/evaluations/${id}/finalize', data),
        autoSave: (id, data) => api.put('/api/evaluations/${id}/autosave', data),
        getEvaluatorStats: (evaluatorId) => api.get('/api/evaluations/evaluator-stats/${evaluatorId}'),
        getSystemStats: () => api.get('/api/evaluations/system-stats'),
        getAverageScoreByReport: (reportId) => api.get('/api/evaluations/average-score/${reportId}'),
    },

    notifications: {
        getAll: (params) => api.get('/api/notifications', { params }),
        getById: (id) => api.get('/api/notifications/${id}'),
        markAsRead: (id) => api.post('/api/notifications/${id}/read'),
        markAllAsRead: () => api.post('/api/notifications/mark-all-read'),
        delete: (id) => api.delete('/api/notifications/${id}'),
        getUnreadCount: () => api.get('/api/notifications/unread-count'),
        getStats: () => api.get('/api/notifications/stats')
    },

    activityLogs: {
        getAll: (params) => api.get('/activity-logs', { params }),
        getUserActivity: (userId, params) => api.get('/activity-logs/user/${userId}', { params }),
        getAuditTrail: (targetType, targetId) =>
            api.get('/activity-logs/audit/${targetType}/${targetId}'),
        getStats: (params) => api.get('/activity-logs/stats', { params })
    },

    system: {
        getStats: () => api.get('/system/stats'),
        getDashboard: () => api.get('/system/dashboard'),
        backup: () => api.post('/system/backup'),
        getHealth: () => api.get('/system/health')
    },

    permissions: {
        getAll: (params) => api.get('/api/permissions', { params }),
        getByModule: () => api.get('/api/permissions/by-module'),
        getById: (id) => api.get('/api/permissions/${id}'),
        create: (data) => api.post('/api/permissions', data),
        update: (id, data) => api.put('/api/permissions/${id}', data),
        delete: (id) => api.delete('/api/permissions/${id}'),
        seed: () => api.post('/api/permissions/seed')
    },

    userGroups: {
        getAll: (params) => api.get('/api/user-groups', { params }),
        getById: (id) => api.get('/api/user-groups/${id}'),
        create: (data) => api.post('/api/user-groups', data),
        update: (id, data) => api.put('/api/user-groups/${id}', data),
        delete: (id) => api.delete('/api/user-groups/${id}'),
        seed: () => api.post('/api/user-groups/seed'),

        addPermissions: (id, permissionIds) => api.post('/api/user-groups/${id}/permissions', { permissionIds }),
        removePermissions: (id, permissionIds) => api.delete('/api/user-groups/${id}/permissions', { data: { permissionIds } }),

        addMembers: (id, userIds) => api.post('/api/user-groups/${id}/members', { userIds }),
        removeMembers: (id, userIds) => api.delete('/api/user-groups/${id}/members', { data: { userIds } })
    },

    publicEvidence: {
        getByCode: (code) => publicApi.get(`/api/public/evidences/${code}`),
        getById: (id) => publicApi.get(`/api/public/evidences/id/${id}`)
    },

}

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