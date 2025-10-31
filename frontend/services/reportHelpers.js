import { apiMethods } from './api'

export const reportHelpers = {
    async getPrograms(params = {}) {
        try {
            const response = await apiMethods.programs.getAll(params)

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

            console.log('Programs loaded:', programs.length)
            return programs
        } catch (error) {
            console.error('Get programs failed:', error)
            return []
        }
    }
}