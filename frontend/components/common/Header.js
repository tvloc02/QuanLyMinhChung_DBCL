import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { apiMethods } from '../../services/api'
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
    Plus,
    Eye,
    CheckCheck,
    Clock,
    AlertTriangle,
    Info
} from 'lucide-react'

export default function Header({ onMenuClick, sidebarOpen }) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)
    const [academicYearDropdownOpen, setAcademicYearDropdownOpen] = useState(false)
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)

    const [currentAcademicYear, setCurrentAcademicYear] = useState(null)
    const [academicYears, setAcademicYears] = useState([])
    const [loading, setLoading] = useState(true)
    const [changing, setChanging] = useState(false)
    const [error, setError] = useState(null)

    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [notificationsLoading, setNotificationsLoading] = useState(false)

    useEffect(() => {
        fetchAcademicYears()
        fetchNotifications()
        fetchUnreadCount()

        const interval = setInterval(() => {
            fetchUnreadCount()
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const fetchAcademicYears = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/academic-years/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setAcademicYears(result.data || [])
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

    const fetchNotifications = async () => {
        try {
            setNotificationsLoading(true)
            const response = await apiMethods.notifications.getAll({
                page: 1,
                limit: 5,
                unreadOnly: false
            })

            if (response.data.success) {
                setNotifications(response.data.data.notifications)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setNotificationsLoading(false)
        }
    }

    const fetchUnreadCount = async () => {
        try {
            const response = await apiMethods.notifications.getUnreadCount()
            if (response && response.data && response.data.success) {
                setUnreadCount(response.data.data.unreadCount)
            } else {
                console.warn('API getUnreadCount did not return success=true or lacked expected structure.', response);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error fetching unread count (Server 500 likely):', error)
            setUnreadCount(0)
        }
    }

    const handleNotificationClick = async (notification) => {
        if (notification.isUnread) {
            try {
                await apiMethods.notifications.markAsRead(notification._id)
                fetchUnreadCount()
                fetchNotifications()
            } catch (error) {
                console.error('Error marking as read:', error)
            }
        }

        setNotificationDropdownOpen(false)

        const actionUrl = getActionUrl(notification)
        if (actionUrl) {
            router.push(actionUrl)
        }
    }

    const handleMarkAsRead = async (e, notificationId) => {
        e.stopPropagation()
        try {
            await apiMethods.notifications.markAsRead(notificationId)
            fetchUnreadCount()
            fetchNotifications()
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await apiMethods.notifications.markAllAsRead()
            fetchUnreadCount()
            fetchNotifications()
            setNotificationDropdownOpen(false)
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const getActionUrl = (notification) => {
        if (notification.data?.url) return notification.data.url

        switch (notification.type) {
            case 'assignment_new':
            case 'assignment_reminder':
            case 'assignment_overdue':
            case 'assignment_cancelled':
                return notification.data?.assignmentId
                    ? `/assignments/${notification.data.assignmentId}`
                    : null

            case 'evaluation_submitted':
            case 'evaluation_reviewed':
                return notification.data?.evaluationId
                    ? `/evaluations/${notification.data.evaluationId}`
                    : null

            case 'report_published':
            case 'report_updated':
                return notification.data?.reportId
                    ? `/reports/${notification.data.reportId}`
                    : null

            default:
                return null
        }
    }

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgent':
                return <AlertCircle className="h-4 w-4 text-red-500" />
            case 'high':
                return <AlertTriangle className="h-4 w-4 text-orange-500" />
            default:
                return <Info className="h-4 w-4" style={{ color: '#6366F1' }} />
        }
    }

    const formatNotificationTime = (date) => {
        const now = new Date()
        const notifDate = new Date(date)
        const diffInMinutes = Math.floor((now - notifDate) / 60000)

        if (diffInMinutes < 1) return 'Vừa xong'
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`

        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours} giờ trước`

        const diffInDays = Math.floor(diffInHours / 24)
        if (diffInDays < 7) return `${diffInDays} ngày trước`

        return notifDate.toLocaleDateString('vi-VN')
    }

    const handleAcademicYearChange = async (selectedYear) => {
        if (selectedYear._id === currentAcademicYear?._id) {
            setAcademicYearDropdownOpen(false)
            return
        }

        try {
            setChanging(true)
            setError(null)

            const response = await fetch(`/api/academic-years/${selectedYear._id}/set-current`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setCurrentAcademicYear(selectedYear)
                setAcademicYears(years =>
                    years.map(year => ({
                        ...year,
                        isCurrent: year._id === selectedYear._id
                    }))
                )

                setAcademicYearDropdownOpen(false)

                const successDiv = document.createElement('div')
                successDiv.innerHTML = `
                    <div class="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg z-50 animate-slide-in-right">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                            <div>
                                <h3 class="text-green-800 font-semibold">Đã chuyển năm học</h3>
                                <p class="text-green-700 text-sm">Đang tải lại dữ liệu...</p>
                            </div>
                        </div>
                    </div>
                `
                document.body.appendChild(successDiv)

                setTimeout(() => {
                    window.location.reload()
                }, 1500)
            } else {
                throw new Error(result.message || 'Có lỗi xảy ra khi chuyển năm học')
            }
        } catch (error) {
            console.error('Error changing academic year:', error)
            setError(error.message)

            const errorDiv = document.createElement('div')
            errorDiv.innerHTML = `
                <div class="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg z-50 animate-slide-in-right">
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        <div>
                            <h3 class="text-red-800 font-semibold">Lỗi chuyển năm học</h3>
                            <p class="text-red-700 text-sm">${error.message}</p>
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
                color: 'text-emerald-700 bg-emerald-50',
                dot: 'bg-emerald-500'
            },
            completed: {
                label: 'Đã hoàn thành',
                color: 'text-blue-700 bg-blue-50',
                dot: 'bg-blue-500'
            },
            draft: {
                label: 'Nháp',
                color: 'text-amber-700 bg-amber-50',
                dot: 'bg-amber-500'
            },
            archived: {
                label: 'Đã lưu trữ',
                color: 'text-gray-700 bg-gray-50',
                dot: 'bg-gray-500'
            }
        }
        return configs[status] || configs.draft
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setUserDropdownOpen(false)
                setAcademicYearDropdownOpen(false)
                setNotificationDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="fixed top-0 left-0 right-0 bg-white shadow-md border-b z-50" style={{ borderColor: '#E5E7EB', height: '80px' }}>
            <div className="flex items-center justify-between px-6 h-full">
                {/* Left side */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-xl text-gray-500 hover:bg-indigo-50 lg:hidden transition-colors"
                    >
                        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>

                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                             style={{ background: 'linear-gradient(135deg, #496cef 0%, #486aee 100%)' }}>
                            <span className="text-white font-bold text-lg">TĐG</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold text-gray-900">CMC University</h1>
                            <p className="text-sm text-gray-500">Hệ thống đánh giá chất lượng</p>
                        </div>
                    </div>
                </div>

                {/* Center - Search */}
                <div className="hidden md:flex flex-1 max-w-2xl mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm minh chứng, báo cáo, tiêu chí..."
                            className="w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all text-gray-700 bg-gray-50"
                            style={{ borderColor: '#E5E7EB' }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#6366F1'
                                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                                e.target.style.background = 'white'
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#E5E7EB'
                                e.target.style.boxShadow = 'none'
                                e.target.style.background = '#F9FAFB'
                            }}
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
                            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl hover:bg-indigo-50 border-2 transition-all ${
                                changing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            style={{ borderColor: '#E5E7EB' }}
                            title="Chọn năm học"
                        >
                            {changing ? (
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                            ) : (
                                <Calendar className="h-5 w-5 text-indigo-600" />
                            )}

                            <div className="hidden lg:block text-left min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
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
                            <ChevronDown className={`h-4 w-4 transition-transform text-gray-500 ${
                                academicYearDropdownOpen ? 'rotate-180' : ''
                            }`} />
                        </button>

                        {academicYearDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border-2 z-50 max-h-96 overflow-hidden"
                                 style={{ borderColor: '#E5E7EB' }}>
                                <div className="px-4 py-3 border-b-2 bg-gradient-to-r from-indigo-50 to-purple-50"
                                     style={{ borderColor: '#E5E7EB' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Chọn năm học</p>
                                            <p className="text-xs text-gray-600">Dữ liệu sẽ được cập nhật theo năm học đã chọn</p>
                                        </div>
                                        <a
                                            href="/academic-years/create"
                                            className="p-2 rounded-lg hover:bg-white transition-colors text-indigo-600"
                                            title="Tạo năm học mới"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>

                                <div className="max-h-64 overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                            <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
                                        </div>
                                    ) : error ? (
                                        <div className="px-4 py-6 text-center">
                                            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                                            <p className="text-sm text-red-600 mb-2">Không thể tải danh sách năm học</p>
                                            <button
                                                onClick={fetchAcademicYears}
                                                className="text-xs font-medium text-indigo-600"
                                            >
                                                Thử lại
                                            </button>
                                        </div>
                                    ) : academicYears.length === 0 ? (
                                        <div className="px-4 py-8 text-center">
                                            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm mb-2 text-gray-600">Chưa có năm học nào</p>
                                            <a
                                                href="/academic-years/create"
                                                className="text-sm font-medium text-indigo-600"
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
                                                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-indigo-50 transition-colors ${
                                                        currentAcademicYear?._id === year._id ? 'border-r-4 bg-indigo-50' : ''
                                                    } ${changing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    style={currentAcademicYear?._id === year._id ? {
                                                        borderRightColor: '#6366F1'
                                                    } : {}}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                                {year.name}
                                                            </p>
                                                            {currentAcademicYear?._id === year._id && (
                                                                <Check className="h-4 w-4 flex-shrink-0 text-indigo-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dot}`}></div>
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

                                {academicYears.length > 0 && (
                                    <div className="px-4 py-2 border-t-2 bg-gray-50" style={{ borderColor: '#E5E7EB' }}>
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <span className="font-semibold">{academicYears.length} năm học</span>
                                            <a href="/academic-years" className="font-bold text-indigo-600">
                                                Quản lý →
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notification Bell with Backdrop */}
                    <div className="relative dropdown-container">
                        <div className="relative">
                            {unreadCount > 0 && (
                                <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-xl blur-md opacity-50 animate-pulse"></div>
                            )}
                            <button
                                onClick={() => {
                                    setNotificationDropdownOpen(!notificationDropdownOpen)
                                    if (!notificationDropdownOpen) {
                                        fetchNotifications()
                                    }
                                }}
                                className="relative p-3 rounded-xl hover:bg-indigo-50 transition-colors border-2"
                                style={{ borderColor: unreadCount > 0 ? '#EF4444' : '#E5E7EB' }}
                            >
                                <Bell className="h-5 w-5 text-gray-600" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {notificationDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border-2 z-50 max-h-[32rem] overflow-hidden"
                                 style={{ borderColor: '#E5E7EB' }}>
                                <div className="px-4 py-3 border-b-2 bg-gradient-to-r from-indigo-50 to-purple-50"
                                     style={{ borderColor: '#E5E7EB' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Thông báo</p>
                                            {unreadCount > 0 && (
                                                <p className="text-xs text-gray-600">{unreadCount} thông báo chưa đọc</p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-xs font-medium p-1 rounded-lg hover:bg-white transition-colors text-indigo-600"
                                                    title="Đánh dấu tất cả đã đọc"
                                                >
                                                    <CheckCheck className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => router.push('/notifications/notifications')}
                                                className="text-xs font-bold text-indigo-600"
                                            >
                                                Xem tất cả →
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {notificationsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                            <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="px-4 py-12 text-center">
                                            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm mb-1 text-gray-600 font-semibold">Không có thông báo mới</p>
                                            <p className="text-xs text-gray-500">Các thông báo của bạn sẽ xuất hiện ở đây</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification._id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b-2 transition-colors ${
                                                    notification.isUnread ? 'bg-blue-50' : ''
                                                }`}
                                                style={{ borderColor: '#E5E7EB' }}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getPriorityIcon(notification.priority)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <p className={`text-sm font-bold ${
                                                                notification.isUnread ? 'text-gray-900' : 'text-gray-700'
                                                            }`}>
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-xs mb-2 line-clamp-2 text-gray-600">
                                                                {notification.message}
                                                            </p>
                                                            {notification.isUnread && (
                                                                <div className="flex-shrink-0 ml-2">
                                                                    <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center text-xs text-gray-500">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {formatNotificationTime(notification.createdAt)}
                                                            </div>
                                                            {notification.isUnread && (
                                                                <button
                                                                    onClick={(e) => handleMarkAsRead(e, notification._id)}
                                                                    className="text-xs font-medium text-indigo-600"
                                                                    title="Đánh dấu đã đọc"
                                                                >
                                                                    <Eye className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="px-4 py-3 border-t-2 bg-gray-50" style={{ borderColor: '#E5E7EB' }}>
                                        <button
                                            onClick={() => {
                                                setNotificationDropdownOpen(false)
                                                router.push('/notifications/notifications')
                                            }}
                                            className="w-full text-center text-sm font-bold text-indigo-600"
                                        >
                                            Xem tất cả thông báo
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User Dropdown */}
                    <div className="relative dropdown-container">
                        <button
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center space-x-2 p-2 rounded-xl hover:bg-indigo-50 transition-colors border-2"
                            style={{ borderColor: '#E5E7EB' }}
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                                 style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                                <span className="text-white text-sm font-bold">
                                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() :
                                        user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-bold text-gray-900">
                                    {user?.fullName || user?.name || user?.email || 'User'}
                                </p>
                                <p className="text-xs text-gray-600">
                                    {user?.role === 'admin' ? 'Quản trị viên' :
                                        user?.role === 'manager' ? 'Cán bộ quản lý' :
                                            user?.role === 'expert' ? 'Chuyên gia đánh giá' :
                                                user?.role === 'advisor' ? 'Tư vấn/Giám sát' : 'Người dùng'}
                                </p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        </button>

                        {userDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-50 border-2"
                                 style={{ borderColor: '#E5E7EB' }}>
                                <a href="/users/profile" className="flex items-center px-4 py-3 text-sm hover:bg-indigo-50 transition-colors rounded-lg mx-2 text-gray-900 font-semibold">
                                    <User className="h-4 w-4 mr-3 text-gray-600" />
                                    Thông tin tài khoản
                                </a>
                                <a href="/settings" className="flex items-center px-4 py-3 text-sm hover:bg-indigo-50 transition-colors rounded-lg mx-2 text-gray-900 font-semibold">
                                    <Settings className="h-4 w-4 mr-3 text-gray-600" />
                                    Cài đặt
                                </a>
                                <hr className="my-2" style={{ borderColor: '#E5E7EB' }} />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-3 text-sm hover:bg-red-50 transition-colors rounded-lg mx-2 text-red-600 font-bold"
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