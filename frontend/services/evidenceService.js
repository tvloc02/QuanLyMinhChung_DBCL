import { apiMethods } from './api'

export const evidenceService = {
    getEvidences: async (filters = {}) => {
        try {
            const response = await apiMethods.evidences.getAll(filters)
            return response.data
        } catch (error) {
            throw error
        }
    },
    getEvidenceById: async (id) => {
        try {
            const response = await apiMethods.evidences.getById(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    createEvidence: async (evidenceData) => {
        try {
            const response = await apiMethods.evidences.create(evidenceData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    updateEvidence: async (id, evidenceData) => {
        try {
            const response = await apiMethods.evidences.update(id, evidenceData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    deleteEvidence: async (id) => {
        try {
            const response = await apiMethods.evidences.delete(id)
            return response.data
        } catch (error) {
            throw error
        }
    },
    searchEvidences: async (searchQuery, filters = {}) => {
        try {
            const params = { search: searchQuery, ...filters }
            const response = await apiMethods.evidences.search(params)
            return response.data
        } catch (error) {
            throw error
        }
    }
}

export default evidenceService