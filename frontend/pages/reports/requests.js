import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    Plus,
    Search,
    Filter,
    Eye,
    Trash2,
    RefreshCw,
    FileText,
    Loader2,
    CheckCircle,
    X,
    Clock,
    AlertCircle
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ReportRequestsPage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports/reports', icon: FileText },
        { name: 'Quản lý yêu cầu viết báo cáo' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0
    })

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        priority: '',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    })

    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        if (user) {
            fetchRequests()
        }
    }, [filters, user])

    const fetchRequests = async () => {
        try {
            setLoading(true)
            const params = {
                page: filters.page,
                limit: filters.limit,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder
            }

            if (filters.search) params.search = filters.search
            if (filters.status) params.status = filters.status
            if (filters.priority) params.priority = filters.priority

            const response = await apiMethods.reportRequests.getAll(params)
            const data = response.data?.data || response.data

            setRequests(data?.requests || [])
            setPagination(data?.pagination || { current: 1, pages: 1, total: 0 })
        } catch (error) {
            console.error('Fetch requests error:', error)
            toast.error('Lỗi khi tải danh sách yêu cầu')
            setRequests([])
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1
        }))
    }

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }))
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            accepted: 'bg-blue-100 text-blue-800 border-blue-200',
            in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Chờ xử lý',
            accepted: 'Đã chấp nhận',
            in_progress: 'Đang thực hiện',
            completed: 'Hoàn thành',
            rejected: 'Từ chối'
        }
        return labels[status] || status
    }

    const getPriorityLabel = (priority) => {
        const labels = {
            low: 'Thấp',
            normal: 'Bình thường',
            high: 'Cao',
            urgent: 'Khẩn cấp'
        }
        return labels[priority] || priority
    }

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'text-gray-600 bg-gray-100',
            normal: 'text-blue-600 bg-blue-100',
            high: 'text-orange-600 bg-orange-100',
            urgent: 'text-red-600 bg-red-100'
        }
        return colors[priority] || 'text-gray-600 bg-gray-100'
    }

    if (isLoading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </Layout>
        )
    }

    if (!user) return null

    const showCreateButton = user.role === 'manager'

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Quản lý yêu cầu viết báo cáo</h1>
                                <p className="text-blue-100">
                                    {user.role === 'manager'
                                        ? 'Tạo và quản lý yêu cầu viết báo cáo'
                                        : 'Danh sách yêu cầu của bạn'
                                    }
                                </p>
                            </div>
                        </div>
                        {showCreateButton && (
                            <button
                                onClick={() => router.push('/reports/create-request')}
                                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-xl font-semibold"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Tạo yêu cầu mới
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm yêu cầu..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-4 py-3 rounded-xl font-semibold transition-all ${
                                    showFilters
                                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                        : 'bg-white border-2 border-gray-200'
                                }`}
                            >
                                <Filter className="h-5 w-5 mr-2" />
                                Bộ lọc
                            </button>
                            <button
                                onClick={fetchRequests}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-semibold"
                            >
                                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Trạng thái
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="pending">Chờ xử lý</option>
                                        <option value="accepted">Đã chấp nhận</option>
                                        <option value="in_progress">Đang thực hiện</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="rejected">Từ chối</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Độ ưu tiên
                                    </label>
                                    <select
                                        value={filters.priority}
                                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl"
                                    >
                                        <option value="">Tất cả độ ưu tiên</option>
                                        <option value="low">Thấp</option>
                                        <option value="normal">Bình thường</option>
                                        <option value="high">Cao</option>
                                        <option value="urgent">Khẩn cấp</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-10 w-10 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Không có yêu cầu nào</h3>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-blue-50 to-sky-50 border-b-2 border-blue-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700">Tiêu đề</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700">Trạng thái</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700">Độ ưu tiên</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700">Hạn chót</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700">Giao cho</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {requests.map((req) => (
                                        <tr key={req._id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-gray-900">{req.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">{req.description.substring(0, 60)}...</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(req.status)}`}>
                                                        {getStatusLabel(req.status)}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(req.priority)}`}>
                                                        {getPriorityLabel(req.priority)}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-600">
                                                {formatDate(req.deadline)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {req.assignedTo?.fullName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => router.push(`/reports/my-requests/${req._id}`)}
                                                    className="inline-flex items-center px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 font-semibold text-sm"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Xem
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.pages > 1 && (
                                <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-700">
                                            Hiển thị <strong>{((pagination.current - 1) * filters.limit) + 1}</strong> đến{' '}
                                            <strong>{Math.min(pagination.current * filters.limit, pagination.total)}</strong> trong tổng số{' '}
                                            <strong>{pagination.total}</strong>
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(pagination.current - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="px-4 py-2 border-2 border-blue-300 rounded-xl disabled:opacity-50 font-semibold"
                                            >
                                                Trước
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(pagination.current + 1)}
                                                disabled={!pagination.hasNext}
                                                className="px-4 py-2 border-2 border-blue-300 rounded-xl disabled:opacity-50 font-semibold"
                                            >
                                                Sau
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    )
}