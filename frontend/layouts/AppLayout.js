import { useState, useEffect } from 'react'
import Sidebar from '../components/common/Sidebar'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'

export default function AppLayout({ children }) {
    const router = useRouter()
    const { user, loading } = useAuth() // ✅ Lấy từ AuthContext

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    // ✅ DEBUG: In ra user info
    useEffect(() => {
        if (user) {
            console.log('=== APPLAYOUT ===')
            console.log('User:', user)
            console.log('UserRole:', user?.role)
            console.log('=================')
        }
    }, [user])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100">
                        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Đang tải ứng dụng...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* ✅ QUAN TRỌNG: Truyền userRole vào Sidebar */}
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                userRole={user?.role} // ✅ ĐÚNG - Truyền role của user
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    user={user}
                />

                <main className={`flex-1 overflow-auto transition-all duration-300 ${
                    sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
                }`}>
                    <div className="min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}