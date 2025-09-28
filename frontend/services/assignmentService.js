import { apiMethods } from './api'

export const assignmentService = {
    getAssignments: async (filters = {}) => {
        try {
            const response = await apiMethods.getAssignments(filters)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getAssignment: async (id) => {
        try {
            const response = await apiMethods.getAssignment(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    createAssignment: async (assignmentData) => {
        try {
            const response = await apiMethods.createAssignment(assignmentData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    updateAssignment: async (id, assignmentData) => {
        try {
            const response = await apiMethods.updateAssignment(id, assignmentData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    deleteAssignment: async (id) => {
        try {
            const response = await apiMethods.deleteAssignment(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    acceptAssignment: async (id, responseNote = '') => {
        try {
            const response = await apiMethods.acceptAssignment(id, { responseNote })
            return response.data
        } catch (error) {
            throw error
        }
    },

    rejectAssignment: async (id, responseNote = '') => {
        try {
            const response = await apiMethods.rejectAssignment(id, { responseNote })
            return response.data
        } catch (error) {
            throw error
        }
    },

    getExpertWorkload: async (expertId) => {
        try {
            const response = await apiMethods.getExpertWorkload(expertId)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getStatistics: async (filters = {}) => {
        try {
            const response = await apiMethods.getAssignmentStatistics(filters)
            return response.data
        } catch (error) {
            throw error
        }
    }
}

export default assignmentService