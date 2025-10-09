import { apiMethods } from './api'

export const evaluationService = {
    getEvaluations: async (filters = {}) => {
        try {
            const response = await apiMethods.getEvaluations(filters)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getEvaluation: async (id) => {
        try {
            const response = await apiMethods.getEvaluation(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    createEvaluation: async (evaluationData) => {
        try {
            const response = await apiMethods.createEvaluation(evaluationData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    updateEvaluation: async (id, evaluationData) => {
        try {
            const response = await apiMethods.updateEvaluation(id, evaluationData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    submitEvaluation: async (id) => {
        try {
            const response = await apiMethods.submitEvaluation(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    reviewEvaluation: async (id, comments = '') => {
        try {
            const response = await apiMethods.reviewEvaluation(id, { comments })
            return response.data
        } catch (error) {
            throw error
        }
    },

    finalizeEvaluation: async (id) => {
        try {
            const response = await apiMethods.finalizeEvaluation(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getEvaluatorStats: async (evaluatorId) => {
        try {
            const response = await apiMethods.getEvaluatorStats(evaluatorId)
            return response.data
        } catch (error) {
            throw error
        }
    }
}

export default evaluationService