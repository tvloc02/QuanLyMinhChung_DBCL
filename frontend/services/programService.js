import { apiMethods } from './api'

const programService = {
    getPrograms: async (params = {}) => {
        try {
            const response = await apiMethods.programs.getAll(params)
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Get programs error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải danh sách chương trình'
            }
        }
    },

    getProgramById: async (id) => {
        try {
            const response = await apiMethods.programs.getById(id)
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Get program error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải thông tin chương trình'
            }
        }
    },

    getStandards: async (programId) => {
        try {
            const response = await apiMethods.standards.getAll({ programId })
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Get standards error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải danh sách tiêu chuẩn'
            }
        }
    },

    getCriteria: async (standardId) => {
        try {
            const response = await apiMethods.criteria.getAll({ standardId })
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Get criteria error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải danh sách tiêu chí'
            }
        }
    }
}

export default programService
