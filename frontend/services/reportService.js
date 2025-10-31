import { apiMethods } from './api'
import toast from 'react-hot-toast'

const reportService = {

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