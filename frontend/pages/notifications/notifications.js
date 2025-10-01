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
    ChevronRight
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

    // Filters
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
        // Mark as read
        if (notification.isUnread) {
            await handleMarkAsRead(notification._id)
        }

        // Navigate to action URL
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

    const getPriorityColor = (priority) => {
        const colors = {
            'urgent': 'text-red-600 bg-red-50 border-red-200',
            'high': 'text-orange-600 bg-orange-50 border-orange-200',
            'normal': 'text-blue-600 bg-blue-50 border-blue-200',
            'low': 'text-gray-600 bg-gray-50 border-gray-200'
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
            return 'bg-purple-100 text-purple-800'
        } else if (type?.includes('evaluation')) {
            return 'bg-green-100 text-green-800'
        } else if (type?.includes('report')) {
            return 'bg-blue-100 text-blue-800'
        } else if (type?.includes('deadline')) {
            return 'bg-red-100 text-red-800'
        }
        return 'bg-gray-100 text-gray-800'
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout
            title="Thông báo"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Thông báo của tôi</h1>
                        <p className="text-gray-600 mt-1">
                            Quản lý và theo dõi các thông báo hệ thống
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                            >
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Đánh dấu tất cả đã đọc
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Tổng số</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Bell className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Chưa đọc</p>
                                <p className="text-2xl font-bold text-blue-900">{stats.unread}</p>
                            </div>
                            <BellOff className="h-8 w-8 text-blue-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Đã đọc</p>
                                <p className="text-2xl font-bold text-green-900">{stats.read}</p>
                            </div>
                            <Eye className="h-8 w-8 text-green-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Đã click</p>
                                <p className="text-2xl font-bold text-purple-900">{stats.clicked}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-purple-400" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Đã dismiss</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.dismissed}</p>
                            </div>
                            <Trash2 className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center">
                            <Filter className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Bộ lọc:</span>
                        </div>

                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={filters.unreadOnly}
                                onChange={(e) => handleFilterChange('unreadOnly', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Chỉ chưa đọc</span>
                        </label>

                        <select
                            value={filters.priority || ''}
                            onChange={(e) => handleFilterChange('priority', e.target.value || null)}
                            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Tất cả mức độ</option>
                            <option value="urgent">Khẩn cấp</option>
                            <option value="high">Cao</option>
                            <option value="normal">Bình thường</option>
                            <option value="low">Thấp</option>
                        </select>

                        {(filters.unreadOnly || filters.priority) && (
                            <button
                                onClick={() => setFilters({ unreadOnly: false, types: [], priority: null })}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Danh sách thông báo ({pagination.total})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-gray-200">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-2">Không có thông báo nào</p>
                                        <p className="text-sm text-gray-400">
                                            {filters.unreadOnly
                                                ? 'Bạn đã đọc hết tất cả thông báo'
                                                : 'Các thông báo mới sẽ hiển thị ở đây'}
                                        </p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                                                notification.isUnread ? 'bg-blue-50' : ''
                                            }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className={`flex-shrink-0 p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                                                        {getPriorityIcon(notification.priority)}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <h4 className={`text-base font-semibold ${
                                                                notification.isUnread ? 'text-gray-900' : 'text-gray-700'
                                                            }`}>
                                                                {notification.title}
                                                            </h4>
                                                            {notification.isUnread && (
                                                                <span className="flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="text-sm text-gray-600 mb-2">
                                                            {notification.message}
                                                        </p>

                                                        <div className="flex items-center flex-wrap gap-2">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                                                                {notification.typeText}
                                                            </span>

                                                            <span className="text-xs text-gray-500 flex items-center">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {formatDate(notification.createdAt)}
                                                            </span>

                                                            {notification.senderId && (
                                                                <span className="text-xs text-gray-500">
                                                                    Từ: {notification.senderId.fullName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 ml-4">
                                                    {notification.isUnread && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleMarkAsRead(notification._id)
                                                            }}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                                            title="Đánh dấu đã đọc"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDelete(notification._id)
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Hiển thị <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> -
                                        <span className="font-medium"> {Math.min(pagination.page * pagination.limit, pagination.total)}</span> trong
                                        <span className="font-medium"> {pagination.total}</span> kết quả
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                                                                pageNum === pagination.page
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    )
                                                } else if (
                                                    pageNum === pagination.page - 2 ||
                                                    pageNum === pagination.page + 2
                                                ) {
                                                    return <span key={pageNum} className="px-2 text-gray-500">...</span>
                                                }
                                                return null
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.totalPages}
                                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Thông tin thông báo</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Click vào thông báo để xem chi tiết và đi đến nội dung liên quan</li>
                        <li>Thông báo chưa đọc sẽ được highlight màu xanh</li>
                        <li>Thông báo sẽ tự động hết hạn sau 30 ngày (hoặc 7 ngày với thông báo khẩn cấp)</li>
                        <li>Bạn có thể lọc thông báo theo mức độ ưu tiên và trạng thái đã đọc</li>
                    </ul>
                </div>
            </div>
        </Layout>
    )
}