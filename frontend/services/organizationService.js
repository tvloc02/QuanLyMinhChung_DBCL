import { apiMethods } from './api'

const organizationService = {
    getOrganizations: async (params = {}) => {
        try {
            const response = await apiMethods.organizations.getAll(params)
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Get organizations error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải danh sách tổ chức'
            }
        }
    },

    getOrganizationById: async (id) => {
        try {
            const response = await apiMethods.organizations.getById(id)
            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            console.error('Get organization error:', error)
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi khi tải thông tin tổ chức'
            }
        }
    }
}

export default organizationService