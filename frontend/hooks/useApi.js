import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '../utils/helpers'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Initialize auth state
    useEffect(() => {
        const initAuth = () => {
            try {
                const savedToken = getLocalStorage('token')
                const savedUser = getLocalStorage('user')

                if (savedToken && savedUser) {
                    setToken(savedToken)
                    setUser(savedUser)
                    // Set default header for future requests
                    api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
                }
            } catch (error) {
                console.error('Error initializing auth:', error)
                // Clear corrupted data
                removeLocalStorage('token')
                removeLocalStorage('user')
            } finally {
                setLoading(false)
            }
        }

        initAuth()
    }, [])

    const login = async (credentials) => {
        try {
            setLoading(true)
            setError(null)

            const response = await api.post('/auth/login', credentials)

            if (response.data.success) {
                const { token: authToken, user: userData } = response.data.data

                // Save to state
                setToken(authToken)
                setUser(userData)

                // Save to localStorage
                setLocalStorage('token', authToken)
                setLocalStorage('user', userData)

                // Set default header
                api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

                return { success: true, data: response.data.data }
            } else {
                throw new Error(response.data.message || 'Đăng nhập thất bại')
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi đăng nhập'
            setError(errorMessage)
            return { success: false, message: errorMessage }
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        try {
            // Clear state
            setUser(null)
            setToken(null)
            setError(null)

            // Clear localStorage
            removeLocalStorage('token')
            removeLocalStorage('user')
            removeLocalStorage('current_academic_year')
            removeLocalStorage('selected_academic_year')

            // Remove default header
            delete api.defaults.headers.common['Authorization']
            delete api.defaults.headers.common['switchToYearId']

            // Redirect to login
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
        } catch (error) {
            console.error('Error during logout:', error)
        }
    }

    const refreshUser = async () => {
        if (!token) return

        try {
            const response = await api.get('/auth/me')
            if (response.data.success) {
                setUser(response.data.data)
                setLocalStorage('user', response.data.data)
            }
        } catch (error) {
            console.error('Error refreshing user:', error)
            if (error.response?.status === 401) {
                logout()
            }
        }
    }

    const value = {
        user,
        token,
        loading,
        error,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager' || user?.role === 'admin',
        isStaff: user?.role === 'staff'
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}