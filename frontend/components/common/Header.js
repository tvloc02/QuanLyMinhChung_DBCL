import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
    Bell,
    User,
    Settings,
    LogOut,
    ChevronDown,
    Menu,
    X,
    Search
} from 'lucide-react'

export default function Header({ onMenuClick, sidebarOpen }) {
    const { user, logout } = useAuth()
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        setUserDropdownOpen(false)
    }

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-50">
            <div className="flex items-center justify-between px-4 py-3">
                {/* Left side */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-md text-gray-500 hover:text-gray-600 lg:hidden"
                    >
                        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>

                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">V</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-semibold text-gray-900">CMC University</h1>
                            <p className="text-sm text-gray-500">Hệ thống quản lý minh chứng</p>
                        </div>
                    </div>
                </div>

                {/* Center - Search */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm minh chứng..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-500 hover:text-gray-600 relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-medium text-gray-900">
                                    {user?.name || user?.email || 'User'}
                                </p>
                                <p className="text-xs text-gray-500">{user?.role || 'Người dùng'}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button>

                        {userDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                <a href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <User className="h-4 w-4 mr-3" />
                                    Thông tin tài khoản
                                </a>
                                <a href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <Settings className="h-4 w-4 mr-3" />
                                    Cài đặt
                                </a>
                                <hr className="my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <LogOut className="h-4 w-4 mr-3" />
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}