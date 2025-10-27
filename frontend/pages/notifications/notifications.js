import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import {
    Bell,
    BellOff,
    CheckCheck,
    Trash2,
    Eye,
    Filter,
    RefreshCw,
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Sparkles,
    X
} from 'lucide-react'

export default function NotificationsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState([])
    const [stats, setStats] = useState({
        total: 0,
        unread: 0,
        read: 0,
        clicked: 0,
        dismissed: 0
    })
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    })
    const [unreadCount, setUnreadCount] = useState(0)

    const [filters, setFilters] = useState({
        unreadOnly: false,
        types: [],
        priority: null
    })

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchData()
            fetchStats()
        }
    }, [user, pagination.page, filters])

    const breadcrumbItems = [
        { name: 'Thông báo', icon: Bell }
    ]

    const fetchData = async () => {
        try {
            setLoading(true)

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                unreadOnly: filters.unreadOnly,
                types: filters.types,
                priority: filters.priority
            }

            const response = await apiMethods.notifications.getAll(params)

            if (response.data.success) {
                setNotifications(response.data.data.notifications)
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total,
                    totalPages: response.data.data.totalPages
                }))
                setUnreadCount(response.data.data.unreadCount)
            }
        } catch (error) {
            console.error('Fetch notifications error:', error)
            toast.error('Lỗi khi tải thông báo')
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await apiMethods.notifications.getStats()
            if (response.data.success) {
                setStats(response.data.data)
            }
        } catch (error) {
            console.error('Fetch stats error:', error)
        }
    }

    const handleMarkAsRead = async (id) => {
        try {
            const response = await apiMethods.notifications.markAsRead(id)
            if (response.data.success) {
                toast.success(response.data.message)
                fetchData()
                fetchStats()
            }
        } catch (error) {
            console.error('Mark as read error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi đánh dấu đã đọc')
        }
    }

    const handleMarkAllAsRead = async () => {
        if (!confirm('Đánh dấu tất cả thông báo là đã đọc?')) {
            return
        }

        try {
            const response = await apiMethods.notifications.markAllAsRead()
            if (response.data.success) {
                toast.success(response.data.message)
                fetchData()
                fetchStats()
            }
        } catch (error) {
            console.error('Mark all as read error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi đánh dấu tất cả đã đọc')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
            return
        }

        try {
            const response = await apiMethods.notifications.delete(id)
            if (response.data.success) {
                toast.success(response.data.message)
                fetchData()
                fetchStats()
            }
        } catch (error) {
            console.error('Delete notification error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xóa thông báo')
        }
    }

    const handleNotificationClick = async (notification) => {
        if (notification.isUnread) {
            await handleMarkAsRead(notification._id)
        }

        const actionUrl = getActionUrl(notification)
        if (actionUrl) {
            router.push(actionUrl)
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
                    ? `/assignments/my-assignments`
                    : null

            case 'evaluation_submitted':
            case 'evaluation_reviewed':
                return notification.data?.evaluationId
                    ? `/evaluations/evaluations/${notification.data.evaluationId}`
                    : null

            case 'report_published':
            case 'report_updated':
                return notification.data?.reportId
                    ? `/assignments/my-assignments`
                    : null

            case 'completion_request':
            case 'completion_notification':
                return notification.data?.departmentId
                    ? `/evidence-management/tree?departmentId=${notification.data.departmentId}`
                    : '/evidence-management/tree'

            default:
                return null
        }
    }

    const getPriorityColor = (priority) => {
        const colors = {
            'urgent': 'text-red-600 bg-gradient-to-br from-red-50 to-pink-100 border-red-200',
            'high': 'text-orange-600 bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200',
            'normal': 'text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200',
            'low': 'text-gray-600 bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200'
        }
        return colors[priority] || colors['normal']
    }

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgent':
                return <AlertCircle className="h-5 w-5" />
            case 'high':
                return <AlertTriangle className="h-5 w-5" />
            case 'normal':
                return <Info className="h-5 w-5" />
            case 'low':
                return <CheckCircle className="h-5 w-5" />
            default:
                return <Info className="h-5 w-5" />
        }
    }

    const getTypeColor = (type) => {
        if (type?.includes('assignment')) {
            return 'bg-purple-100 text-purple-800 border-purple-200'
        } else if (type?.includes('evaluation')) {
            return 'bg-green-100 text-green-800 border-green-200'
        } else if (type?.includes('report')) {
            return 'bg-blue-100 text-blue-800 border-blue-200'
        } else if (type?.includes('deadline')) {
            return 'bg-red-100 text-red-800 border-red-200'
        }
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }))
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
        setPagination(prev => ({ ...prev, page: 1 }))
    }

    const hasActiveFilters = filters.unreadOnly || filters.priority

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Bell className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Thông báo của tôi</h1>
                                <p className="text-indigo-100">Quản lý và theo dõi các thông báo hệ thống</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 disabled:opacity-50 transition-all font-medium"
                            >
                                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>

                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-medium shadow-lg"
                                >
                                    <CheckCheck className="h-5 w-5 mr-2" />
                                    Đánh dấu tất cả đã đọc
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl shadow-sm border-2 border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Tổng số</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Bell className="h-7 w-7 text-gray-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-xl shadow-sm border-2 border-indigo-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-indigo-700 mb-1">Chưa đọc</p>
                                <p className="text-3xl font-bold text-indigo-900">{stats.unread}</p>
                            </div>
                            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <BellOff className="h-7 w-7 text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-sm border-2 border-green-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-700 mb-1">Đã đọc</p>
                                <p className="text-3xl font-bold text-green-900">{stats.read}</p>
                            </div>
                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                                <Eye className="h-7 w-7 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl shadow-sm border-2 border-purple-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-700 mb-1">Đã click</p>
                                <p className="text-3xl font-bold text-purple-900">{stats.clicked}</p>
                            </div>
                            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                                <CheckCircle className="h-7 w-7 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl shadow-sm border-2 border-red-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-red-700 mb-1">Đã dismiss</p>
                                <p className="text-3xl font-bold text-red-900">{stats.dismissed}</p>
                            </div>
                            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                                <Trash2 className="h-7 w-7 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                <Filter className="h-5 w-5 text-indigo-600" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">Bộ lọc</span>
                        </div>

                        <label className="flex items-center px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.unreadOnly}
                                onChange={(e) => handleFilterChange('unreadOnly', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700 font-medium">Chỉ chưa đọc</span>
                        </label>

                        <select
                            value={filters.priority || ''}
                            onChange={(e) => handleFilterChange('priority', e.target.value || null)}
                            className="px-4 py-2 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                        >
                            <option value="">Tất cả mức độ</option>
                            <option value="urgent">🔴 Khẩn cấp</option>
                            <option value="high">🟠 Cao</option>
                            <option value="normal">🔵 Bình thường</option>
                            <option value="low">⚪ Thấp</option>
                        </select>

                        {hasActiveFilters && (
                            <button
                                onClick={() => setFilters({ unreadOnly: false, types: [], priority: null })}
                                className="inline-flex items-center px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:bg-indigo-50 rounded-xl transition-all"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Sparkles className="h-5 w-5 mr-2 text-indigo-600" />
                            Danh sách thông báo ({pagination.total})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-16">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-200">
                                {notifications.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Bell className="h-10 w-10 text-indigo-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thông báo nào</h3>
                                        <p className="text-gray-500">
                                            {filters.unreadOnly
                                                ? 'Bạn đã đọc hết tất cả thông báo'
                                                : 'Các thông báo mới sẽ hiển thị ở đây'}
                                        </p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            className={`p-6 hover:bg-gray-50 transition-all cursor-pointer group ${
                                                notification.isUnread ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : ''
                                            }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border-2 ${getPriorityColor(notification.priority)}`}>
                                                        {getPriorityIcon(notification.priority)}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h4 className={`text-base font-semibold ${
                                                                notification.isUnread ? 'text-gray-900' : 'text-gray-700'
                                                            }`}>
                                                                {notification.title}
                                                            </h4>
                                                            {notification.isUnread && (
                                                                <span className="relative flex h-3 w-3">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                            {notification.message}
                                                        </p>

                                                        <div className="flex items-center flex-wrap gap-2">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(notification.type)}`}>
                                                                {notification.typeText}
                                                            </span>

                                                            <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {formatDate(notification.createdAt)}
                                                            </span>

                                                            {/* SỬA LỖI RENDER: Sử dụng Optional Chaining khi truy cập fullName */}
                                                            {notification.senderId?.fullName && (
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                                                    Từ: {notification.senderId.fullName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {notification.isUnread && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleMarkAsRead(notification._id)
                                                            }}
                                                            className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                            title="Đánh dấu đã đọc"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDelete(notification._id)
                                                        }}
                                                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Hiển thị <strong>{((pagination.page - 1) * pagination.limit) + 1}</strong> -
                                            <strong> {Math.min(pagination.page * pagination.limit, pagination.total)}</strong> trong
                                            <strong> {pagination.total}</strong> kết quả
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handlePageChange(pagination.page - 1)}
                                                disabled={pagination.page === 1}
                                                className="inline-flex items-center px-4 py-2 border-2 border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>

                                            <div className="flex items-center space-x-1">
                                                {[...Array(pagination.totalPages)].map((_, index) => {
                                                    const pageNum = index + 1
                                                    if (
                                                        pageNum === 1 ||
                                                        pageNum === pagination.totalPages ||
                                                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                                                    ) {
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => handlePageChange(pageNum)}
                                                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                                                                    pageNum === pagination.page
                                                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                                                        : 'text-gray-700 hover:bg-white border-2 border-gray-200'
                                                                }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        )
                                                    } else if (
                                                        pageNum === pagination.page - 2 ||
                                                        pageNum === pagination.page + 2
                                                    ) {
                                                        return <span key={pageNum} className="px-2 text-gray-500 font-bold">...</span>
                                                    }
                                                    return null
                                                })}
                                            </div>

                                            <button
                                                onClick={() => handlePageChange(pagination.page + 1)}
                                                disabled={pagination.page === pagination.totalPages}
                                                className="inline-flex items-center px-4 py-2 border-2 border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Info Box */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center">
                        <Info className="h-5 w-5 mr-2" />
                        Thông tin thông báo
                    </h4>
                    <ul className="text-sm text-indigo-800 space-y-2">
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Click vào thông báo để xem chi tiết và đi đến nội dung liên quan</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Thông báo chưa đọc sẽ được highlight với màu nền gradient</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Thông báo sẽ tự động hết hạn sau 30 ngày (hoặc 7 ngày với thông báo khẩn cấp)</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Bạn có thể lọc thông báo theo mức độ ưu tiên và trạng thái đã đọc</span>
                        </li>
                    </ul>
                </div>
            </div>
        </Layout>
    )
}