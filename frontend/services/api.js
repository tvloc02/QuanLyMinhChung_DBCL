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
    },

    academicYears: {
        getAll: (params) => api.get('/academic-years', { params }),
        getCurrent: () => api.get('/academic-years/current'),
        getById: (id) => api.get(`/academic-years/${id}`),
        create: (data) => api.post('/academic-years', data),
        update: (id, data) => api.put(`/academic-years/${id}`, data),
        delete: (id) => api.delete(`/academic-years/${id}`)
    },

    users: {
        getProfile: () => api.get('/api/auth/me'),
        getAll: (params) => api.get('/api/users', { params }),
        getById: (id) => api.get(`/api/users/${id}`),
        create: (data) => api.post('/api/users', data),
        update: (id, data) => api.put(`/api/users/${id}`, data),
        delete: (id) => api.delete(`/api/users/${id}`),
        bulkImport: (file) => {
            const formData = new FormData()
            formData.append('file', file)
            return api.post('/users/bulk-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        }
    },

    permissions: {
        canEditStandard: (standardId, academicYearId) =>
            api.get(`/api/permissions/can-edit-standard/${standardId}`, { params: { academicYearId } }),
        canEditCriteria: (criteriaId, academicYearId) =>
            api.get(`/api/permissions/can-edit-criteria/${criteriaId}`, { params: { academicYearId } }),
        canUploadEvidence: (criteriaId, academicYearId) =>
            api.get(`/api/permissions/can-upload-evidence/${criteriaId}`, { params: { academicYearId } }),
        canAssignReporters: (standardId, criteriaId, academicYearId) =>
            api.get('/api/permissions/can-assign-reporters', {
                params: {
                    standardId: standardId || null,
                    criteriaId: criteriaId || null,
                    academicYearId
                }
            }),
        canWriteReport: (reportType, academicYearId, standardId, criteriaId) =>
            api.get('/api/permissions/can-write-report', {
                params: {
                    reportType,
                    academicYearId,
                    standardId: standardId || null,
                    criteriaId: criteriaId || null
                }
            }),
        hasWritePermission: () =>
            api.get('/api/permissions/has-write-permission')
    },

    programs: {
        getAll: (params) => api.get('/api/programs', { params }),
        getById: (id) => api.get(`/api/programs/${id}`),
        create: (data) => api.post('/api/programs', data),
        update: (id, data) => api.put(`/api/programs/${id}`, data),
        delete: (id) => api.delete(`/api/programs/${id}`)
    },

    organizations: {
        getAll: (params) => api.get('/api/organizations', { params }),
        getById: (id) => api.get(`/api/organizations/${id}`),
        create: (data) => api.post('/api/organizations', data),
        update: (id, data) => api.put(`/api/organizations/${id}`, data),
        delete: (id) => api.delete(`/api/organizations/${id}`)
    },

    standards: {
        getAll: (params) => api.get('/api/standards', { params }),
        getById: (id) => api.get(`/api/standards/${id}`),
        create: (data) => api.post('/api/standards', data),
        update: (id, data) => api.put(`/api/standards/${id}`, data),
        delete: (id) => api.delete(`/api/standards/${id}`),
        getByProgram: (programId, organizationId) =>
            api.get(`/api/standards/program/${programId}/organization/${organizationId}`)
    },

    criteria: {
        getAll: (params) => api.get('/api/criteria', { params }),
        getById: (id) => api.get(`/api/criteria/${id}`),
        create: (data) => api.post('/api/criteria', data),
        update: (id, data) => api.put(`/api/criteria/${id}`, data),
        delete: (id) => api.delete(`/api/criteria/${id}`),
        getByStandard: (standardId) => api.get('/api/criteria/standard/${standardId}'),
        getByProgram: (programId, organizationId) =>
            api.get('/api/criteria/program/${programId}/organization/${organizationId}'),
        import: (formData) => api.post('/api/criteria/import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
        bulkImport: (formData) => api.post('/api/criteria/bulk-import', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    },

    tasks: {
        getAll: (params) => api.get('/api/tasks', { params }),
        getCreatedTasks: (params) => api.get('/api/tasks/created', { params }),
        getAssignedTasks: (params) => api.get('/api/tasks/assigned', { params }),
        getById: (id) => api.get(`/api/tasks/${id}`),
        create: (data) => api.post('/api/tasks', data),
        delete: (id) => api.delete(`/api/tasks/${id}`),
        update: (id, data) => api.put(`/api/tasks/${id}`, data),
        getByCriteria: (criteriaId) => api.get('/api/tasks/by-criteria', { params: { criteriaId } }),
        reviewReport: (id, data) => api.post(`/api/tasks/${id}/review-report`, data)
    },

    evidences: {
        getAll: (params) => api.get('/api/evidences', { params }),
        getById: (id) => api.get(`/api/evidences/${id}`),
        create: (data) => api.post('/api/evidences', data),
        update: (id, data) => api.put(`/api/evidences/${id}`, data),
        delete: (id) => api.delete(`/api/evidences/${id}`),
        bulkDelete: (ids) => api.post('/api/evidences/bulk-delete', { ids }),
        search: (params) => api.get('/api/evidences/search', { params }),
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
        exportTree: (params) =>
            api.get('/api/evidences/tree/export', {
                params,
                responseType: 'blob'
            }),
        download: (id, format = 'html') => api.get(`/api/reports/${id}/download`, {
            params: { format },
            responseType: 'arraybuffer'
        }),
    },

    files: {
        upload: (file, evidenceId, parentFolderId = null) => {
            const formData = new FormData()
            // Đảm bảo tên file được gửi đúng encoding UTF-8
            formData.append('files', file, file.name)
            if (parentFolderId) {
                formData.append('parentFolderId', parentFolderId)
            }
            return api.post(`/api/files/upload/${evidenceId}`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept-Charset': 'utf-8'
                }
            })
        },
        uploadMultiple: (files, evidenceId, parentFolderId = null) => {
            const formData = new FormData()
            files.forEach(file => {
                // Đảm bảo tên file được gửi đúng encoding UTF-8
                formData.append('files', file, file.name)
            })
            if (parentFolderId) {
                formData.append('parentFolderId', parentFolderId)
            }
            return api.post(`/api/files/upload/${evidenceId}`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept-Charset': 'utf-8'
                }
            })
        },
        download: (fileId) => api.get(`/api/files/download/${fileId}`, { responseType: 'blob' }),
        stream: (fileId) => api.get(`/api/files/stream/${fileId}`, { responseType: 'blob' }),
        extractContent: (fileId) => api.get(`/api/files/extract/${fileId}`),
        getInfo: (fileId) => api.get(`/api/files/${fileId}/info`),
        delete: (fileId) => api.delete(`/api/files/${fileId}`),
        move: (fileId, data) => api.post(`/api/files/${fileId}/move`, data),
        search: (params) => api.get('/api/files/search', { params }),
        getByEvidence: (evidenceId, params) => api.get(`/api/files/evidence/${evidenceId}`, { params }),
        getStatistics: (evidenceId) => api.get(`/api/files/${evidenceId}/statistics`),
        approve: (fileId, data) => api.post(`/api/files/${fileId}/approve`, data),
        incrementDownload: (fileId) => api.post(`/api/files/${fileId}/increment-download`)
    },

    reports: {
        getAll: (params) => api.get('/api/reports', { params }),
        getById: (id) => api.get(`/api/reports/${id}`),
        create: (data) => api.post('/api/reports', data),
        update: (id, data) => api.put(`/api/reports/${id}`, data),
        delete: (id) => api.delete(`/api/reports/${id}`),

        publish: (id) => api.post(`/api/reports/${id}/publish`),
        unpublish: (id) => api.post(`/api/reports/${id}/unpublish`),
        approve: (id) => api.post(`/api/reports/${id}/approve`),
        reject: (id, data = {}) => api.post(`/api/reports/${id}/reject`, data),
        makePublic: (id) => api.post(`/api/reports/${id}/make-public`),
        retractPublic: (id) => api.post(`/api/reports/${id}/retract-public`),

        submitReportToTask: (id, data) => api.post(`/api/reports/${id}/submit-to-task`, data),

        requestEditPermission: (id) => api.post(`/api/reports/${id}/request-edit-permission`),
        getEditRequests: (id) => api.get(`/api/reports/${id}/edit-requests`),
        approveEditRequest: (id, data) => api.post(`/api/reports/${id}/edit-requests/approve`, data),
        rejectEditRequest: (id, data) => api.post(`/api/reports/${id}/edit-requests/reject`, data),

        uploadFile: (id, file) => {
            const formData = new FormData()
            formData.append('file', file)
            return api.post(`/api/reports/${id}/upload-file`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        downloadFile: (id) => api.get(`/api/reports/${id}/download-file`),
        download: (id, format = 'html') => api.get(`/api/reports/${id}/download`, { params: { format } }),
        convertFileToContent: (id) => api.post(`/api/reports/${id}/convert-file-to-content`),

        assignReporter: (id, reporterIds) => api.post(`/api/reports/${id}/assign-reporter`, { reporterIds }),

        getVersions: (id) => api.get(`/api/reports/${id}/versions`),
        addVersion: (id, data) => api.post(`/api/reports/${id}/versions`, data),

        getComments: (id) => api.get(`/api/reports/${id}/comments`),
        addComment: (id, data) => api.post(`/api/reports/${id}/comments`, data),
        resolveComment: (id, commentId) => api.put(`/api/reports/${id}/comments/${commentId}/resolve`),

        getEvidences: (id) => api.get(`/api/reports/${id}/evidences`),

        getByTask: (params) => api.get('/api/reports/by-task', { params }),
        getByStandardCriteria: (params) => api.get('/api/reports/by-standard-criteria', { params }),
        getStats: (params) => api.get('/api/reports/stats', { params }),

        getInsertable: (params) => api.get('/api/reports/insertable', { params }),
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
        update: (id, data) => api.put(`/api/evaluations/${id}`, data),
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
            api.get('/activity-logs/audit/${targetType}/${targetId}')
    },

    system: {
        getStats: () => api.get('/system/stats'),
        backup: () => api.post('/system/backup'),
        getHealth: () => api.get('/system/health')
    },

    userGroups: {
        getAll: (params) => api.get('/api/user-groups', { params }),
        getById: (id) => api.get('/api/user-groups/${id}'),
        create: (data) => api.post('/api/user-groups', data),
        update: (id, data) => api.put('/api/user-groups/${id}', data),
        delete: (id) => api.delete('/api/user-groups/${id}'),
        seed: () => api.post('/api/user-groups/seed')
    },

    publicEvidence: {
        getByCode: (code) => publicApi.get(`/api/public/evidences/${code}`),
        getById: (id) => publicApi.get(`/api/public/evidences/id/${id}`)
    },
}

export default api