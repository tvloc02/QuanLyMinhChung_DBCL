import { apiMethods } from './api'
import toast from 'react-hot-toast'

const reportService = {
    // Get all reports
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

    // Get report by ID
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

    // Create report
    createReport: async (data) => {
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

    // Update report
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

    // Delete report
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

    // Publish report
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

    // Upload file
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

    // Download file
    downloadFile: async (id, filename) => {
        try {
            const response = await apiMethods.reports.downloadFile(id)

            // Create blob URL and trigger download
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

    // Convert file to content
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

    // Download report as HTML/PDF
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

    // Add version
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

    // Get versions
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

    // Get report evidences
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

    // Validate evidence links
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

    // Add reviewer
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

    // Remove reviewer
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

    // Add comment
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

    // Resolve comment
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

    // Get statistics
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

    // Generate code
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