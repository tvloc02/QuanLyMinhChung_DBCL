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
    Check,
    AlertCircle,
    Loader2,
    Plus
} from 'lucide-react'

export default function Header({ onMenuClick, sidebarOpen }) {
    const { user, logout } = useAuth()
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)
    const [academicYearDropdownOpen, setAcademicYearDropdownOpen] = useState(false)
    const [currentAcademicYear, setCurrentAcademicYear] = useState(null)
    const [academicYears, setAcademicYears] = useState([])
    const [loading, setLoading] = useState(true)
    const [changing, setChanging] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchAcademicYears()
    }, [])

    const fetchAcademicYears = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch all academic years
            const response = await fetch('/api/academic-years/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setAcademicYears(result.data || [])

                    // Find current academic year
                    const current = result.data?.find(year => year.isCurrent)
                    if (current) {
                        setCurrentAcademicYear(current)
                    }
                } else {
                    throw new Error(result.message || 'Không thể tải danh sách năm học')
                }
            } else {
                throw new Error('Lỗi khi tải dữ liệu năm học')
            }
        } catch (error) {
            console.error('Error fetching academic years:', error)
            setError(error.message)

            // Fallback to get current year only
            try {
                const currentResponse = await fetch('/api/academic-years/current', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (currentResponse.ok) {
                    const currentResult = await currentResponse.json()
                    if (currentResult.success) {
                        setCurrentAcademicYear(currentResult.data)
                        setAcademicYears([currentResult.data])
                    }
                }
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleAcademicYearChange = async (selectedYear) => {
        if (selectedYear._id === currentAcademicYear?._id) {
            setAcademicYearDropdownOpen(false)
            return
        }

        try {
            setChanging(true)
            setError(null)

            // Use correct API endpoint from backend
            const response = await fetch(`/api/academic-years/${selectedYear._id}/set-current`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            const result = await response.json()

            if (response.ok && result.success) {
                // Update local state
                setCurrentAcademicYear(selectedYear)
                setAcademicYears(years =>
                    years.map(year => ({
                        ...year,
                        isCurrent: year._id === selectedYear._id
                    }))
                )

                setAcademicYearDropdownOpen(false)

                // Show success message
                const successDiv = document.createElement('div')
                successDiv.innerHTML = `
                    <div class="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                            <div>
                                <h3 class="text-green-800 font-medium">Đã chuyển năm học</h3>
                                <p class="text-green-700 text-sm">Đang tải lại dữ liệu...</p>
                            </div>
                        </div>
                    </div>
                `
                document.body.appendChild(successDiv)

                // Reload after short delay to show success message
                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else {
                throw new Error(result.message || 'Có lỗi xảy ra khi chuyển năm học')
            }
        } catch (error) {
            console.error('Error changing academic year:', error)
            setError(error.message)

            // Show error message
            const errorDiv = document.createElement('div')
            errorDiv.innerHTML = `
                <div class="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        <div>
                            <h3 class="text-red-800 font-medium">Lỗi chuyển năm học</h3>
                            <p class="text-red-700 text-sm">{error.message}</p>
                        </div>
                    </div>
                </div>
            `
            document.body.appendChild(errorDiv)

            setTimeout(() => {
                document.body.removeChild(errorDiv)
            }, 5000)
        } finally {
            setChanging(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        setUserDropdownOpen(false)
    }

    const getStatusConfig = (status) => {
        const configs = {
            active: {
                label: 'Đang hoạt động',
                color: 'text-green-600 bg-green-100',
                dot: 'bg-green-500'
            },
            completed: {
                label: 'Đã hoàn thành',
                color: 'text-blue-600 bg-blue-100',
                dot: 'bg-blue-500'
            },
            draft: {
                label: 'Nháp',
                color: 'text-yellow-600 bg-yellow-100',
                dot: 'bg-yellow-500'
            },
            archived: {
                label: 'Đã lưu trữ',
                color: 'text-gray-600 bg-gray-100',
                dot: 'bg-gray-500'
            }
        }
        return configs[status] || configs.draft
    }

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setUserDropdownOpen(false)
                setAcademicYearDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

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
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">TĐG</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-semibold text-gray-900">CMC University</h1>
                            <p className="text-sm text-gray-500">Hệ thống đánh giá chất lượng</p>
                        </div>
                    </div>
                </div>

                {/* Center - Search */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm minh chứng, báo cáo..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-3">
                    {/* Academic Year Selector */}
                    <div className="relative dropdown-container">
                        <button
                            onClick={() => !changing && setAcademicYearDropdownOpen(!academicYearDropdownOpen)}
                            disabled={changing}
                            className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors ${
                                changing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Chọn năm học"
                        >
                            {changing ? (
                                <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                            ) : (
                                <Calendar className="h-4 w-4 text-gray-500" />
                            )}

                            <div className="hidden lg:block text-left min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {loading ? 'Đang tải...' : currentAcademicYear?.name || 'Chọn năm học'}
                                </p>
                                {currentAcademicYear && !loading && (
                                    <p className="text-xs text-gray-500 truncate">
                                        {getStatusConfig(currentAcademicYear.status).label}
                                    </p>
                                )}
                                {error && (
                                    <p className="text-xs text-red-500 truncate">Lỗi tải dữ liệu</p>
                                )}
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${
                                academicYearDropdownOpen ? 'rotate-180' : ''
                            }`} />
                        </button>

                        {academicYearDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Chọn năm học</p>
                                            <p className="text-xs text-gray-500">Dữ liệu sẽ được cập nhật theo năm học đã chọn</p>
                                        </div>
                                        <a
                                            href="/academic-years/create"
                                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                            title="Tạo năm học mới"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="max-h-64 overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                            <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
                                        </div>
                                    ) : error ? (
                                        <div className="px-4 py-6 text-center">
                                            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                                            <p className="text-sm text-red-600 mb-2">Không thể tải danh sách năm học</p>
                                            <button
                                                onClick={fetchAcademicYears}
                                                className="text-xs text-blue-600 hover:text-blue-700"
                                            >
                                                Thử lại
                                            </button>
                                        </div>
                                    ) : academicYears.length === 0 ? (
                                        <div className="px-4 py-8 text-center">
                                            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 mb-2">Chưa có năm học nào</p>
                                            <a
                                                href="/academic-years/create"
                                                className="text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                Tạo năm học đầu tiên
                                            </a>
                                        </div>
                                    ) : (
                                        academicYears.map((year) => {
                                            const statusConfig = getStatusConfig(year.status)
                                            return (
                                                <button
                                                    key={year._id}
                                                    onClick={() => handleAcademicYearChange(year)}
                                                    disabled={changing}
                                                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                                        currentAcademicYear?._id === year._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                                                    } ${changing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {year.name}
                                                            </p>
                                                            {currentAcademicYear?._id === year._id && (
                                                                <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                                                <div className={`w-2 h-2 rounded-full mr-1 ${statusConfig.dot}`}></div>
                                                                {statusConfig.label}
                                                            </span>
                                                            <span className="text-xs text-gray-500 truncate">
                                                                {year.code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })
                                    )}
                                </div>

                                {/* Footer */}
                                {academicYears.length > 0 && (
                                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{academicYears.length} năm học</span>
                                            <a
                                                href="/academic-years"
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                Quản lý →
                                            </a>
                                        </div>
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
                    <div className="relative dropdown-container">
                        <button
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                        >
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
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
                                        user?.role === 'manager' ? 'Cán bộ quản lý' :
                                            user?.role === 'expert' ? 'Chuyên gia đánh giá' :
                                                user?.role === 'advisor' ? 'Tư vấn/Giám sát' : 'Người dùng'}
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
                <div className="relative dropdown-container">
                    <button
                        onClick={() => !changing && setAcademicYearDropdownOpen(!academicYearDropdownOpen)}
                        disabled={changing}
                        className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors ${
                            changing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        <div className="flex items-center space-x-2">
                            {changing ? (
                                <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                            ) : (
                                <Calendar className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                                {loading ? 'Đang tải...' : currentAcademicYear?.name || 'Chọn năm học'}
                            </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${
                            academicYearDropdownOpen ? 'rotate-180' : ''
                        }`} />
                    </button>

                    {academicYearDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-64 overflow-hidden">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-900">Chọn năm học</p>
                            </div>

                            <div className="max-h-48 overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                        <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
                                    </div>
                                ) : academicYears.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        Không có dữ liệu năm học
                                    </div>
                                ) : (
                                    academicYears.map((year) => {
                                        const statusConfig = getStatusConfig(year.status)
                                        return (
                                            <button
                                                key={year._id}
                                                onClick={() => handleAcademicYearChange(year)}
                                                disabled={changing}
                                                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                                    currentAcademicYear?._id === year._id ? 'bg-blue-50' : ''
                                                } ${changing ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${statusConfig.color}`}>
                                                        <div className={`w-2 h-2 rounded-full mr-1 ${statusConfig.dot}`}></div>
                                                        {statusConfig.label}
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}