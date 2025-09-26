import { apiMethods } from './api'

export const evidenceService = {
    getEvidences: async (filters = {}) => {
        try {
            const response = await apiMethods.getEvidences(filters)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getEvidence: async (id) => {
        try {
            const response = await apiMethods.getEvidence(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    createEvidence: async (evidenceData) => {
        try {
            const response = await apiMethods.createEvidence(evidenceData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    updateEvidence: async (id, evidenceData) => {
        try {
            const response = await apiMethods.updateEvidence(id, evidenceData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    deleteEvidence: async (id) => {
        try {
            const response = await apiMethods.deleteEvidence(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    deleteMultipleEvidences: async (ids) => {
        try {
            const response = await apiMethods.deleteMultipleEvidences(ids)
            return response.data
        } catch (error) {
            throw error
        }
    },

    copyEvidence: async (id, targetData) => {
        try {
            const response = await apiMethods.copyEvidence(id, targetData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    moveEvidence: async (id, targetData) => {
        try {
            const response = await apiMethods.moveEvidence(id, targetData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    searchEvidences: async (searchQuery, filters = {}) => {
        try {
            const params = { search: searchQuery, ...filters }
            const response = await apiMethods.getEvidences(params)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getEvidenceTree: async (programId) => {
        try {
            const response = await apiMethods.getEvidenceTree(programId)
            return response.data
        } catch (error) {
            throw error
        }
    },

    importEvidences: async (importData) => {
        try {
            const response = await apiMethods.importEvidences(importData)
            return response.data
        } catch (error) {
            throw error
        }
    },

    downloadMultipleEvidences: async (ids) => {
        try {
            const response = await apiMethods.downloadMultipleEvidences(ids)
            return response.data
        } catch (error) {
            throw error
        }
    },

    generateEvidenceCode: async (programId, standardId, criteriaId) => {
        try {
            const response = await apiMethods.generateEvidenceCode({
                programId,
                standardId,
                criteriaId
            })
            return response.data
        } catch (error) {
            throw error
        }
    }
}

export default evidenceService