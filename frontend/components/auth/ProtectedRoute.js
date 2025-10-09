import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({
                                           children,
                                           requiredRole = null,
                                           requiredPermissions = [],
                                           fallback = null
                                       }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            // If no user and not loading, redirect to login
            if (!user) {
                router.replace('/login')
                return
            }

            // Check role requirement
            if (requiredRole && user.role !== requiredRole) {
                // If user doesn't have required role, redirect to dashboard or show 403
                router.replace('/dashboard')
                return
            }

            // Check permissions (if your system has permissions)
            if (requiredPermissions.length > 0) {
                const userPermissions = user.permissions || []
                const hasAllPermissions = requiredPermissions.every(permission =>
                    userPermissions.includes(permission)
                )

                if (!hasAllPermissions) {
                    router.replace('/dashboard')
                    return
                }
            }
        }
    }, [user, isLoading, requiredRole, requiredPermissions, router])

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        )
    }

    // If no user, don't render anything (will redirect)
    if (!user) {
        return fallback || null
    }

    // Check role requirement
    if (requiredRole && user.role !== requiredRole) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Không có quyền truy cập
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Bạn không có quyền truy cập vào trang này.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Quay về trang chủ
                    </button>
                </div>
            </div>
        )
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
        const userPermissions = user.permissions || []
        const hasAllPermissions = requiredPermissions.every(permission =>
            userPermissions.includes(permission)
        )

        if (!hasAllPermissions) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m8-6V9a4 4 0 00-8 0v2m8 0a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2V9a4 4 0 118 0v2" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Không đủ quyền hạn
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Bạn cần có quyền hạn cao hơn để truy cập chức năng này.
                        </p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Quay về trang chủ
                        </button>
                    </div>
                </div>
            )
        }
    }

    // All checks passed, render children
    return children
}

// Higher-order component version
export const withProtectedRoute = (WrappedComponent, options = {}) => {
    return function ProtectedComponent(props) {
        return (
            <ProtectedRoute {...options}>
                <WrappedComponent {...props} />
            </ProtectedRoute>
        )
    }
}

// Role-specific components
export const AdminOnly = ({ children, fallback }) => (
    <ProtectedRoute requiredRole="admin" fallback={fallback}>
        {children}
    </ProtectedRoute>
)

export const ManagerOnly = ({ children, fallback }) => (
    <ProtectedRoute requiredRole="manager" fallback={fallback}>
        {children}
    </ProtectedRoute>
)

export const StaffOnly = ({ children, fallback }) => (
    <ProtectedRoute requiredRole="staff" fallback={fallback}>
        {children}
    </ProtectedRoute>
)