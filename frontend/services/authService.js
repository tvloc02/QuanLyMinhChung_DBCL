import { apiMethods } from './api'
import { getLocalStorage, setLocalStorage, removeLocalStorage } from '../utils/helpers'

class AuthService {
    constructor() {
        this.token = null
        this.user = null
        this.refreshTokenTimer = null
    }

    init() {
        const token = getLocalStorage('token')
        const user = getLocalStorage('user')

        if (token) {
            this.token = token
            this.user = user
            this.startRefreshTokenTimer()
        }
    }

    async login(email, password, rememberMe = false) {
        try {
            const response = await apiMethods.login({ email, password })

            if (response.data.success) {
                const { token, user, refreshToken } = response.data.data

                this.token = token
                this.user = user

                if (rememberMe) {
                    setLocalStorage('token', token)
                    setLocalStorage('user', user)
                    if (refreshToken) {
                        setLocalStorage('refreshToken', refreshToken)
                    }
                } else {
                    sessionStorage.setItem('token', token)
                    sessionStorage.setItem('user', JSON.stringify(user))
                    if (refreshToken) {
                        sessionStorage.setItem('refreshToken', refreshToken)
                    }
                }

                this.startRefreshTokenTimer()

                return {
                    success: true,
                    user,
                    token
                }
            }

            return {
                success: false,
                message: response.data.message || 'Đăng nhập thất bại'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi kết nối'
            }
        }
    }

    async logout() {
        try {
            await apiMethods.logout()
        } catch (error) {
            console.error('Logout API error:', error)
        } finally {
            this.clearAuth()
        }
    }

    clearAuth() {
        this.token = null
        this.user = null

        removeLocalStorage('token')
        removeLocalStorage('user')
        removeLocalStorage('refreshToken')

        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('refreshToken')

        this.stopRefreshTokenTimer()
    }

    async refreshToken() {
        try {
            const refreshToken = getLocalStorage('refreshToken') ||
                sessionStorage.getItem('refreshToken')

            if (!refreshToken) {
                throw new Error('No refresh token available')
            }

            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken })
            })

            const data = await response.json()

            if (data.success) {
                const { token, user } = data.data

                this.token = token
                this.user = user

                const isRemembered = getLocalStorage('token')
                if (isRemembered) {
                    setLocalStorage('token', token)
                    setLocalStorage('user', user)
                } else {
                    sessionStorage.setItem('token', token)
                    sessionStorage.setItem('user', JSON.stringify(user))
                }

                this.startRefreshTokenTimer()

                return {
                    success: true,
                    token,
                    user
                }
            }

            throw new Error(data.message || 'Refresh token failed')
        } catch (error) {
            this.clearAuth()
            return {
                success: false,
                message: error.message
            }
        }
    }

    startRefreshTokenTimer() {
        if (!this.token) return

        try {
            const tokenPayload = JSON.parse(atob(this.token.split('.')[1]))
            const expiryTime = tokenPayload.exp * 1000 // Convert to milliseconds
            const currentTime = Date.now()
            const timeUntilRefresh = expiryTime - currentTime - (5 * 60 * 1000) // Refresh 5 minutes before expiry

            if (timeUntilRefresh > 0) {
                this.refreshTokenTimer = setTimeout(async () => {
                    const result = await this.refreshToken()
                    if (!result.success) {
                        // Redirect to login if refresh fails
                        window.location.href = '/login'
                    }
                }, timeUntilRefresh)
            }
        } catch (error) {
            console.error('Error parsing token:', error)
        }
    }

    stopRefreshTokenTimer() {
        if (this.refreshTokenTimer) {
            clearTimeout(this.refreshTokenTimer)
            this.refreshTokenTimer = null
        }
    }

    getUser() {
        return this.user || getLocalStorage('user') ||
            JSON.parse(sessionStorage.getItem('user') || 'null')
    }

    hasRole(role) {
        const user = this.getUser()
        return user && user.role === role
    }

    hasAnyRole(roles) {
        const user = this.getUser()
        return user && roles.includes(user.role)
    }

    hasPermission(permission) {
        const user = this.getUser()
        return user && user.permissions && user.permissions.includes(permission)
    }

    hasAllPermissions(permissions) {
        const user = this.getUser()
        if (!user || !user.permissions) return false

        return permissions.every(permission => user.permissions.includes(permission))
    }

    hasAnyPermission(permissions) {
        const user = this.getUser()
        if (!user || !user.permissions) return false

        return permissions.some(permission => user.permissions.includes(permission))
    }

}

const authService = new AuthService()

if (typeof window !== 'undefined') {
    authService.init()
}

export default authService