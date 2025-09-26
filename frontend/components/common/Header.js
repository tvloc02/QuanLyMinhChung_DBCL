import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
    Bell,
    User,
    Settings,
    LogOut,
    ChevronDown,
    Menu,
    X,
    Search,
    Calendar,
    Check
} from 'lucide-react'

export default function Header({ onMenuClick, sidebarOpen }) {
    const { user, logout } = useAuth()
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)
    const [academicYearDropdownOpen, setAcademicYearDropdownOpen] = useState(false)
    const [currentAcademicYear, setCurrentAcademicYear] = useState(null)
    const [academicYears, setAcademicYears] = useState([])

    useEffect(() => {
        fetchAcademicYears()
    }, [])

    const fetchAcademicYears = async () => {
        try {
            const response = await fetch('/api/academic-years', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setAcademicYears(data.academicYears || [])

                // Tìm năm học hiện tại
                const current = data.academicYears?.find(year => year.isCurrent)
                if (current) {
                    setCurrentAcademicYear(current)
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách năm học:', error)
            const sampleYears = [
                {
                    _id: '507f1f77bcf86cd799439021',
                    name: 'Năm học 2023-2024',
                    code: '2023-2024',
                    status: 'completed',
                    isCurrent: false
                },
                {
                    _id: '507f1f77bcf86cd799439022',
                    name: 'Năm học 2024-2025',
                    code: '2024-2025',
                    status: 'active',
                    isCurrent: true
                },
                {
                    _id: '507f1f77bcf86cd799439023',
                    name: 'Năm học 2025-2026',
                    code: '2025-2026',
                    status: 'draft',
                    isCurrent: false
                }
            ]
            setAcademicYears(sampleYears)
            setCurrentAcademicYear(sampleYears.find(year => year.isCurrent))
        }
    }

    const handleAcademicYearChange = async (selectedYear) => {
        try {
            // Call API để chuyển năm học
            const response = await fetch(`/api/academic-years/${selectedYear._id}/activate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                setCurrentAcademicYear(selectedYear)
                setAcademicYearDropdownOpen(false)

                // Reload trang để cập nhật dữ liệu theo năm học mới
                window.location.reload()
            } else {
                console.error('Lỗi khi chuyển năm học')
            }
        } catch (error) {
            console.error('Lỗi khi chuyển năm học:', error)
            // Fallback: chỉ cập nhật UI
            setCurrentAcademicYear(selectedYear)
            setAcademicYearDropdownOpen(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        setUserDropdownOpen(false)
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'text-green-600 bg-green-100'
            case 'completed':
                return 'text-blue-600 bg-blue-100'
            case 'draft':
                return 'text-yellow-600 bg-yellow-100'
            case 'archived':
                return 'text-gray-600 bg-gray-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'active':
                return 'Đang hoạt động'
            case 'completed':
                return 'Đã hoàn thành'
            case 'draft':
                return 'Nháp'
            case 'archived':
                return 'Đã lưu trữ'
            default:
                return status
        }
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
                    {/* Academic Year Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setAcademicYearDropdownOpen(!academicYearDropdownOpen)}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
                            title="Chọn năm học"
                        >
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div className="hidden lg:block text-left">
                                <p className="text-sm font-medium text-gray-900">
                                    {currentAcademicYear?.name || 'Chọn năm học'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {currentAcademicYear ? getStatusText(currentAcademicYear.status) : ''}
                                </p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button>

                        {academicYearDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">Chọn năm học</p>
                                    <p className="text-xs text-gray-500">Dữ liệu sẽ được cập nhật theo năm học đã chọn</p>
                                </div>

                                <div className="max-h-64 overflow-y-auto">
                                    {academicYears.map((year) => (
                                        <button
                                            key={year._id}
                                            onClick={() => handleAcademicYearChange(year)}
                                            className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 ${
                                                currentAcademicYear?._id === year._id ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {year.name}
                                                    </p>
                                                    {currentAcademicYear?._id === year._id && (
                                                        <Check className="h-4 w-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(year.status)}`}>
                                                        {getStatusText(year.status)}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {year.code}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {academicYears.length === 0 && (
                                    <div className="px-4 py-3 text-center text-gray-500 text-sm">
                                        Không có dữ liệu năm học
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notification Bell */}
                    <button className="p-2 text-gray-500 hover:text-gray-600 relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
                    </button>

                    {/* User Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                        >
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() :
                                        user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-medium text-gray-900">
                                    {user?.fullName || user?.name || user?.email || 'User'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {user?.role === 'admin' ? 'Quản trị viên' :
                                        user?.role === 'manager' ? 'Quản lý' :
                                            user?.role === 'staff' ? 'Nhân viên' : 'Người dùng'}
                                </p>
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

            {/* Mobile Academic Year Selector */}
            <div className="lg:hidden px-4 pb-3">
                <div className="relative">
                    <button
                        onClick={() => setAcademicYearDropdownOpen(!academicYearDropdownOpen)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
                    >
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                                {currentAcademicYear?.name || 'Chọn năm học'}
                            </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>

                    {academicYearDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900">Chọn năm học</p>
                            </div>

                            <div className="max-h-48 overflow-y-auto">
                                {academicYears.map((year) => (
                                    <button
                                        key={year._id}
                                        onClick={() => handleAcademicYearChange(year)}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 ${
                                            currentAcademicYear?._id === year._id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {year.name}
                                                </p>
                                                {currentAcademicYear?._id === year._id && (
                                                    <Check className="h-4 w-4 text-blue-600" />
                                                )}
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(year.status)}`}>
                                                {getStatusText(year.status)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}