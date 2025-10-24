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

    getEvidence: async (id) => {
        try {
            const response = await apiMethods.evidences.getById(id)
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

    deleteMultipleEvidences: async (ids) => {
        try {
            const response = await apiMethods.evidences.bulkDelete(ids)
            return response.data
        } catch (error) {
            throw error
        }
    },

    copyEvidence: async (id, targetData) => {
        try {
            const response = await apiMethods.evidences.copy(
                id,
                targetData.targetAcademicYearId,
                targetData.targetStandardId,
                targetData.targetCriteriaId
            )
            return response.data
        } catch (error) {
            throw error
        }
    },

    moveEvidence: async (id, targetData) => {
        try {
            const response = await apiMethods.evidences.move(
                id,
                targetData.targetStandardId,
                targetData.targetCriteriaId
            )
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
    },

    getEvidenceTree: async (programId, organizationId) => {
        try {
            const response = await apiMethods.evidences.getTree(programId, organizationId)
            return response.data
        } catch (error) {
            throw error
        }
    },

    importEvidences: async (file, options) => {
        try {
            const response = await apiMethods.evidences.import(file, options)
            return response.data
        } catch (error) {
            throw error
        }
    },

    downloadMultipleEvidences: async (params) => {
        try {
            const response = await apiMethods.evidences.export(params)
            return response.data
        } catch (error) {
            throw error
        }
    },

    generateEvidenceCode: async (standardCode, criteriaCode) => {
        try {
            const response = await apiMethods.evidences.generateCode(standardCode, criteriaCode)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getStatistics: async () => {
        try {
            const response = await apiMethods.evidences.getStatistics()
            return response.data
        } catch (error) {
            throw error
        }
    },

    getByAcademicYear: async (academicYearId) => {
        try {
            const response = await apiMethods.evidences.getByAcademicYear(academicYearId)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getStandards: async (params) => {
        try {
            const response = await apiMethods.standards.getAll(params)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getCriteria: async (params) => {
        try {
            const response = await apiMethods.criteria.getAll(params)
            return response.data
        } catch (error) {
            throw error
        }
    }
}

export default evidenceService