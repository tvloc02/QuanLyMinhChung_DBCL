// frontend/services/reportHelpers.js
import { apiMethods } from './api'

export const reportHelpers = {
    // Safe wrapper for programs
    async getPrograms(params = {}) {
        try {
            const response = await apiMethods.programs.getAll(params)

            // Handle multiple response structures
            let programs = []
            if (response.data?.data?.programs) {
                programs = response.data.data.programs
            } else if (response.data?.programs) {
                programs = response.data.programs
            } else if (Array.isArray(response.data?.data)) {
                programs = response.data.data
            } else if (Array.isArray(response.data)) {
                programs = response.data
            }

            console.log('📊 Programs loaded:', programs.length)
            return programs
        } catch (error) {
            console.error('❌ Get programs failed:', error)
            return []
        }
    },

    // Safe wrapper for organizations
    async getOrganizations(params = {}) {
        try {
            const response = await apiMethods.organizations.getAll(params)

            // Handle multiple response structures
            let organizations = []
            if (response.data?.data?.organizations) {
                organizations = response.data.data.organizations
            } else if (response.data?.organizations) {
                organizations = response.data.organizations
            } else if (Array.isArray(response.data?.data)) {
                organizations = response.data.data
            } else if (Array.isArray(response.data)) {
                organizations = response.data
            }

            console.log('📊 Organizations loaded:', organizations.length)
            return organizations
        } catch (error) {
            console.error('❌ Get organizations failed:', error)
            return []
        }
    },

    // Safe wrapper for standards
    async getStandards(programId, organizationId, params = {}) {
        try {
            const response = await apiMethods.standards.getAll({
                programId,
                organizationId,
                status: 'active',
                ...params
            })

            let standards = []
            if (response.data?.data?.standards) {
                standards = response.data.data.standards
            } else if (response.data?.standards) {
                standards = response.data.standards
            } else if (Array.isArray(response.data?.data)) {
                standards = response.data.data
            } else if (Array.isArray(response.data)) {
                standards = response.data
            }

            console.log('📊 Standards loaded:', standards.length)
            return standards
        } catch (error) {
            console.error('❌ Get standards failed:', error)
            return []
        }
    },

    // Safe wrapper for criteria
    async getCriteria(standardId, params = {}) {
        try {
            const response = await apiMethods.criteria.getAll({
                standardId,
                status: 'active',
                ...params
            })

            let criteria = []
            if (response.data?.data?.criterias) {
                criteria = response.data.data.criterias
            } else if (response.data?.data?.criteria) {
                criteria = response.data.data.criteria
            } else if (response.data?.criterias) {
                criteria = response.data.criterias
            } else if (response.data?.criteria) {
                criteria = response.data.criteria
            } else if (Array.isArray(response.data?.data)) {
                criteria = response.data.data
            } else if (Array.isArray(response.data)) {
                criteria = response.data
            }

            console.log('📊 Criteria loaded:', criteria.length)
            return criteria
        } catch (error) {
            console.error('❌ Get criteria failed:', error)
            return []
        }
    }
}