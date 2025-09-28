import { apiMethods } from './api'

export const reportService = {
    getReports: async (filters = {}) => {
        try {
            const response = await apiMethods.getReports(filters)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getReport: async (id) => {
        try {
            const response = await apiMethods.getReport(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    createReport: async (reportData) => {
        try {
            const response = await apiMethods.createReport(reportData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    updateReport: async (id, reportData) => {
        try {
            const response = await apiMethods.updateReport(id, reportData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    deleteReport: async (id) => {
        try {
            const response = await apiMethods.deleteReport(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    publishReport: async (id) => {
        try {
            const response = await apiMethods.publishReport(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    linkEvidences: async (id) => {
        try {
            const response = await apiMethods.linkEvidences(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    generateReportCode: async (type, standardCode = '', criteriaCode = '') => {
        try {
            const response = await apiMethods.generateReportCode({
                type,
                standardCode,
                criteriaCode
            })
            return response.data
        } catch (error) {
            throw error
        }
    }
}

export default reportService