import { apiMethods } from './api'

export const notificationService = {
    getNotifications: async (filters = {}) => {
        try {
            const response = await apiMethods.getNotifications(filters)
            return response.data
        } catch (error) {
            throw error
        }
    },

    markAsRead: async (id) => {
        try {
            const response = await apiMethods.markNotificationAsRead(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    markAllAsRead: async () => {
        try {
            const response = await apiMethods.markAllNotificationsAsRead()
            return response.data
        } catch (error) {
            throw error
        }
    },

    deleteNotification: async (id) => {
        try {
            const response = await apiMethods.deleteNotification(id)
            return response.data
        } catch (error) {
            throw error
        }
    },

    getStats: async () => {
        try {
            const response = await apiMethods.getNotificationStats()
            return response.data
        } catch (error) {
            throw error
        }
    }
}

export default notificationService