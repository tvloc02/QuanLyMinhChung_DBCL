import { apiMethods } from './api'
import toast from 'react-hot-toast'

const reportService = {
    getReports: async (params = {}) => {
        try {
            const response = await apiMethods.reports.getAll(params)
            return {
                success: true,
                data: response.data.data,
                pagination: response.data.data.pagination
            }
        } catch (error) {
            console.error('Get reports error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải danh sách báo cáo'
            }
        }
    },

    getReportById: async (id) => {
        try {
            const response = await apiMethods.reports.getById(id)
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Get report error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải thông tin báo cáo'
            }
        }
    },

    create: async (data) => {
        try {
            const response = await apiMethods.reports.create(data)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Create report error:', error)
            throw error
        }
    },

    updateReport: async (id, data) => {
        try {
            const response = await apiMethods.reports.update(id, data)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Update report error:', error)
            throw error
        }
    },

    deleteReport: async (id) => {
        try {
            const response = await apiMethods.reports.delete(id)
            return {
                success: true,
                message: response.data.message
            }
        } catch (error) {
            console.error('Delete report error:', error)
            throw error
        }
    },

    publishReport: async (id) => {
        try {
            const response = await apiMethods.reports.publish(id)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Publish report error:', error)
            throw error
        }
    },

    addSelfEvaluation: async (id, evaluationData) => {
        try {
            const response = await apiMethods.reports.addSelfEvaluation(id, evaluationData)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Add self evaluation error:', error)
            throw error
        }
    },

    submit: async (id) => {
        try {
            const response = await apiMethods.reports.submit(id)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Submit report error:', error)
            throw error
        }
    },

    uploadFile: async (id, file, onProgress) => {
        try {
            const response = await apiMethods.reports.uploadFile(id, file, onProgress)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Upload file error:', error)
            throw error
        }
    },

    downloadFile: async (id, filename) => {
        try {
            const response = await apiMethods.reports.downloadFile(id)

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename || 'report-file')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            return { success: true }
        } catch (error) {
            console.error('Download file error:', error)
            toast.error('Lỗi khi tải file')
            return { success: false }
        }
    },

    convertFileToContent: async (id) => {
        try {
            const response = await apiMethods.reports.convertFileToContent(id)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Convert file error:', error)
            throw error
        }
    },

    downloadReport: async (id, format = 'html', filename) => {
        try {
            const response = await apiMethods.reports.download(id, format)

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename || `report.${format}`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            return { success: true }
        } catch (error) {
            console.error('Download report error:', error)
            toast.error('Lỗi khi tải báo cáo')
            return { success: false }
        }
    },

    addVersion: async (id, content, changeNote) => {
        try {
            const response = await apiMethods.reports.addVersion(id, content, changeNote)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Add version error:', error)
            throw error
        }
    },

    getVersions: async (id) => {
        try {
            const response = await apiMethods.reports.getVersions(id)
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Get versions error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải danh sách phiên bản'
            }
        }
    },

    getReportEvidences: async (id) => {
        try {
            const response = await apiMethods.reports.getEvidences(id)
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Get report evidences error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải danh sách minh chứng'
            }
        }
    },

    validateEvidenceLinks: async (id) => {
        try {
            const response = await apiMethods.reports.validateEvidenceLinks(id)
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Validate evidence links error:', error)
            throw error
        }
    },

    addReviewer: async (id, reviewerId, reviewerType) => {
        try {
            const response = await apiMethods.reports.addReviewer(id, reviewerId, reviewerType)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Add reviewer error:', error)
            throw error
        }
    },

    removeReviewer: async (id, reviewerId, reviewerType) => {
        try {
            const response = await apiMethods.reports.removeReviewer(id, reviewerId, reviewerType)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Remove reviewer error:', error)
            throw error
        }
    },

    addComment: async (id, comment, section) => {
        try {
            const response = await apiMethods.reports.addComment(id, comment, section)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Add comment error:', error)
            throw error
        }
    },

    resolveComment: async (id, commentId) => {
        try {
            const response = await apiMethods.reports.resolveComment(id, commentId)
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            console.error('Resolve comment error:', error)
            throw error
        }
    },

    getStats: async (params = {}) => {
        try {
            const response = await apiMethods.reports.getStats(params)
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Get report stats error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải thống kê'
            }
        }
    },

    generateCode: async (type, standardCode, criteriaCode) => {
        try {
            const response = await apiMethods.reports.generateCode(type, standardCode, criteriaCode)
            return {
                success: true,
                data: response.data.code
            }
        } catch (error) {
            console.error('Generate code error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tạo mã báo cáo'
            }
        }
    }
}

export default reportService