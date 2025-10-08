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
            if (response.data.success) {
                setUnreadCount(response.data.data.unreadCount)
            }
        } catch (error) {
            console.error('Error fetching unread count:', error)
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
                return <Info className="h-4 w-4" style={{ color: '#5B52E1' }} />
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
                color: 'text-green-700 bg-green-50',
                dot: 'bg-green-500'
            },
            completed: {
                label: 'Đã hoàn thành',
                color: 'text-blue-700 bg-blue-50',
                dot: 'bg-blue-500'
            },
            draft: {
                label: 'Nháp',
                color: 'text-yellow-700 bg-yellow-50',
                dot: 'bg-yellow-500'
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
        <header className="bg-white shadow-sm border-b sticky top-0 z-50" style={{ borderColor: '#E2E8F0' }}>
            <div className="flex items-center justify-between px-6 py-4">
                {/* Left side */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 lg:hidden transition-colors"
                    >
                        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>

                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                             style={{ background: 'linear-gradient(135deg, #5B52E1 0%, #3B82F6 100%)' }}>
                            <span className="text-white font-bold text-base">TĐG</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold" style={{ color: '#0F172A' }}>CMC University</h1>
                            <p className="text-sm" style={{ color: '#64748B' }}>Hệ thống đánh giá chất lượng</p>
                        </div>
                    </div>
                </div>

                {/* Center - Search */}
                <div className="hidden md:flex flex-1 max-w-lg mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#94A3B8' }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm minh chứng, báo cáo..."
                            className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-all"
                            style={{
                                borderColor: '#E2E8F0',
                                color: '#1E293B',
                                background: '#F8FAFC'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#5B52E1'
                                e.target.style.boxShadow = '0 0 0 3px rgba(91, 82, 225, 0.1)'
                                e.target.style.background = 'white'
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#E2E8F0'
                                e.target.style.boxShadow = 'none'
                                e.target.style.background = '#F8FAFC'
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
                            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl hover:bg-gray-50 border transition-all ${
                                changing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            style={{ borderColor: '#E2E8F0' }}
                            title="Chọn năm học"
                        >
                            {changing ? (
                                <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#5B52E1' }} />
                            ) : (
                                <Calendar className="h-4 w-4" style={{ color: '#5B52E1' }} />
                            )}

                            <div className="hidden lg:block text-left min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>
                                    {loading ? 'Đang tải...' : currentAcademicYear?.name || 'Chọn năm học'}
                                </p>
                                {currentAcademicYear && !loading && (
                                    <p className="text-xs truncate" style={{ color: '#64748B' }}>
                                        {getStatusConfig(currentAcademicYear.status).label}
                                    </p>
                                )}
                                {error && (
                                    <p className="text-xs text-red-500 truncate">Lỗi tải dữ liệu</p>
                                )}
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${
                                academicYearDropdownOpen ? 'rotate-180' : ''
                            }`} style={{ color: '#64748B' }} />
                        </button>

                        {academicYearDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-hidden"
                                 style={{
                                     borderColor: '#E2E8F0',
                                     boxShadow: '0 10px 40px rgba(15, 23, 42, 0.1)'
                                 }}>
                                <div className="px-4 py-3 border-b" style={{
                                    borderColor: '#E2E8F0',
                                    background: '#F8FAFC'
                                }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Chọn năm học</p>
                                            <p className="text-xs" style={{ color: '#64748B' }}>Dữ liệu sẽ được cập nhật theo năm học đã chọn</p>
                                        </div>
                                        <a
                                            href="/academic-years/create"
                                            className="p-2 rounded-lg hover:bg-white transition-colors"
                                            title="Tạo năm học mới"
                                            style={{ color: '#5B52E1' }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>

                                <div className="max-h-64 overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5B52E1' }} />
                                            <span className="ml-2 text-sm" style={{ color: '#64748B' }}>Đang tải...</span>
                                        </div>
                                    ) : error ? (
                                        <div className="px-4 py-6 text-center">
                                            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                                            <p className="text-sm text-red-600 mb-2">Không thể tải danh sách năm học</p>
                                            <button
                                                onClick={fetchAcademicYears}
                                                className="text-xs font-medium"
                                                style={{ color: '#5B52E1' }}
                                            >
                                                Thử lại
                                            </button>
                                        </div>
                                    ) : academicYears.length === 0 ? (
                                        <div className="px-4 py-8 text-center">
                                            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm mb-2" style={{ color: '#64748B' }}>Chưa có năm học nào</p>
                                            <a
                                                href="/academic-years/create"
                                                className="text-sm font-medium"
                                                style={{ color: '#5B52E1' }}
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
                                                        currentAcademicYear?._id === year._id ? 'border-r-2' : ''
                                                    } ${changing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    style={currentAcademicYear?._id === year._id ? {
                                                        background: '#F0EFFE',
                                                        borderRightColor: '#5B52E1'
                                                    } : {}}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>
                                                                {year.name}
                                                            </p>
                                                            {currentAcademicYear?._id === year._id && (
                                                                <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#5B52E1' }} />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig.color}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dot}`}></div>
                                                                {statusConfig.label}
                                                            </span>
                                                            <span className="text-xs truncate" style={{ color: '#64748B' }}>
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
                                    <div className="px-4 py-2 border-t" style={{
                                        borderColor: '#E2E8F0',
                                        background: '#F8FAFC'
                                    }}>
                                        <div className="flex items-center justify-between text-xs" style={{ color: '#64748B' }}>
                                            <span>{academicYears.length} năm học</span>
                                            <a
                                                href="/academic-years"
                                                className="font-medium"
                                                style={{ color: '#5B52E1' }}
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
                    <div className="relative dropdown-container">
                        <button
                            onClick={() => {
                                setNotificationDropdownOpen(!notificationDropdownOpen)
                                if (!notificationDropdownOpen) {
                                    fetchNotifications()
                                }
                            }}
                            className="p-2.5 rounded-xl hover:bg-gray-50 relative transition-colors"
                            style={{ color: '#64748B' }}
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {notificationDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border z-50 max-h-[32rem] overflow-hidden"
                                 style={{
                                     borderColor: '#E2E8F0',
                                     boxShadow: '0 10px 40px rgba(15, 23, 42, 0.1)'
                                 }}>
                                <div className="px-4 py-3 border-b" style={{
                                    borderColor: '#E2E8F0',
                                    background: '#F8FAFC'
                                }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Thông báo</p>
                                            {unreadCount > 0 && (
                                                <p className="text-xs" style={{ color: '#64748B' }}>{unreadCount} thông báo chưa đọc</p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-xs font-medium p-1 rounded-lg hover:bg-white transition-colors"
                                                    title="Đánh dấu tất cả đã đọc"
                                                    style={{ color: '#5B52E1' }}
                                                >
                                                    <CheckCheck className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => router.push('/notifications/notifications')}
                                                className="text-xs"
                                                style={{ color: '#5B52E1' }}
                                            >
                                                Xem tất cả →
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="max-h-96 overflow-y-auto">
                                    {notificationsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#5B52E1' }} />
                                            <span className="ml-2 text-sm" style={{ color: '#64748B' }}>Đang tải...</span>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="px-4 py-12 text-center">
                                            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm mb-1" style={{ color: '#64748B' }}>Không có thông báo mới</p>
                                            <p className="text-xs" style={{ color: '#94A3B8' }}>Các thông báo của bạn sẽ xuất hiện ở đây</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification._id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b transition-colors ${
                                                    notification.isUnread ? 'bg-blue-50' : ''
                                                }`}
                                                style={{ borderColor: '#E2E8F0' }}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getPriorityIcon(notification.priority)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between mb-1">
                                                            <p className={`text-sm font-semibold ${
                                                                notification.isUnread ? 'text-gray-900' : 'text-gray-700'
                                                            }`} style={notification.isUnread ? { color: '#0F172A' } : { color: '#475569' }}>
                                                                {notification.title}
                                                            </p>
                                                            {notification.isUnread && (
                                                                <div className="flex-shrink-0 ml-2">
                                                                    <div className="h-2 w-2 rounded-full" style={{ background: '#5B52E1' }}></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs mb-2 line-clamp-2" style={{ color: '#64748B' }}>
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center text-xs" style={{ color: '#94A3B8' }}>
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {formatNotificationTime(notification.createdAt)}
                                                            </div>
                                                            {notification.isUnread && (
                                                                <button
                                                                    onClick={(e) => handleMarkAsRead(e, notification._id)}
                                                                    className="text-xs font-medium"
                                                                    title="Đánh dấu đã đọc"
                                                                    style={{ color: '#5B52E1' }}
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
                                    <div className="px-4 py-3 border-t" style={{
                                        borderColor: '#E2E8F0',
                                        background: '#F8FAFC'
                                    }}>
                                        <button
                                            onClick={() => {
                                                setNotificationDropdownOpen(false)
                                                router.push('/notifications')
                                            }}
                                            className="w-full text-center text-sm font-medium"
                                            style={{ color: '#5B52E1' }}
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
                            className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                 style={{ background: 'linear-gradient(135deg, #5B52E1 0%, #3B82F6 100%)' }}>
                                <span className="text-white text-sm font-semibold">
                                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() :
                                        user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                                    {user?.fullName || user?.name || user?.email || 'User'}
                                </p>
                                <p className="text-xs" style={{ color: '#64748B' }}>
                                    {user?.role === 'admin' ? 'Quản trị viên' :
                                        user?.role === 'manager' ? 'Cán bộ quản lý' :
                                            user?.role === 'expert' ? 'Chuyên gia đánh giá' :
                                                user?.role === 'advisor' ? 'Tư vấn/Giám sát' : 'Người dùng'}
                                </p>
                            </div>
                            <ChevronDown className="h-4 w-4" style={{ color: '#64748B' }} />
                        </button>

                        {userDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border"
                                 style={{
                                     borderColor: '#E2E8F0',
                                     boxShadow: '0 10px 40px rgba(15, 23, 42, 0.1)'
                                 }}>
                                <a href="/users/profile" className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors rounded-lg mx-2"
                                   style={{ color: '#0F172A' }}>
                                    <User className="h-4 w-4 mr-3" style={{ color: '#64748B' }} />
                                    Thông tin tài khoản
                                </a>
                                <a href="/settings" className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors rounded-lg mx-2"
                                   style={{ color: '#0F172A' }}>
                                    <Settings className="h-4 w-4 mr-3" style={{ color: '#64748B' }} />
                                    Cài đặt
                                </a>
                                <hr className="my-2" style={{ borderColor: '#E2E8F0' }} />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-50 transition-colors rounded-lg mx-2"
                                    style={{ color: '#EF4444' }}
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
                        className={`w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border transition-all ${
                            changing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={{ borderColor: '#E2E8F0' }}
                    >
                        <div className="flex items-center space-x-2">
                            {changing ? (
                                <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#5B52E1' }} />
                            ) : (
                                <Calendar className="h-4 w-4" style={{ color: '#5B52E1' }} />
                            )}
                            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                                {loading ? 'Đang tải...' : currentAcademicYear?.name || 'Chọn năm học'}
                            </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${
                            academicYearDropdownOpen ? 'rotate-180' : ''
                        }`} style={{ color: '#64748B' }} />
                    </button>

                    {academicYearDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border z-50 max-h-64 overflow-hidden"
                             style={{
                                 borderColor: '#E2E8F0',
                                 boxShadow: '0 10px 40px rgba(15, 23, 42, 0.1)'
                             }}>
                            <div className="px-4 py-2 border-b" style={{
                                borderColor: '#E2E8F0',
                                background: '#F8FAFC'
                            }}>
                                <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Chọn năm học</p>
                            </div>

                            <div className="max-h-48 overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#5B52E1' }} />
                                        <span className="ml-2 text-sm" style={{ color: '#64748B' }}>Đang tải...</span>
                                    </div>
                                ) : academicYears.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm" style={{ color: '#64748B' }}>
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
                                                        <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
                                                            {year.name}
                                                        </p>
                                                        {currentAcademicYear?._id === year._id && (
                                                            <Check className="h-4 w-4" style={{ color: '#5B52E1' }} />
                                                        )}
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium mt-1 ${statusConfig.color}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dot}`}></div>
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