import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { ActionButton } from '../../components/ActionButtons'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    FileText,
    Loader2,
    X,
    Users,
    CheckCircle,
    Send
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
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            accepted: 'bg-blue-100 text-blue-800 border-blue-300',
            in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
            completed: 'bg-green-100 text-green-800 border-green-300',
            rejected: 'bg-red-100 text-red-800 border-red-300'
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
            normal: 'Thường',
            high: 'Cao',
            urgent: 'Khẩn cấp'
        }
        return labels[priority] || priority
    }

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-gray-100 text-gray-700',
            normal: 'bg-blue-100 text-blue-700',
            high: 'bg-orange-100 text-orange-700',
            urgent: 'bg-red-100 text-red-700'
        }
        return colors[priority] || 'bg-gray-100 text-gray-700'
    }

    const renderActionButtons = (req) => {
        // Manager
        if (user.role === 'manager') {
            return (
                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <ActionButton
                        icon={Eye}
                        title="Xem chi tiết"
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/reports/requests/${req._id}`)}
                    />

                    <ActionButton
                        icon={Users}
                        title="Thêm người viết báo cáo"
                        variant="success"
                        size="sm"
                        onClick={() => router.push(`/reports/requests/${req._id}`)}
                    />

                    <ActionButton
                        icon={Edit}
                        title="Sửa yêu cầu"
                        variant="warning"
                        size="sm"
                        onClick={() => router.push(`/reports/requests/${req._id}/edit`)}
                    />

                    <ActionButton
                        icon={Send}
                        title={req.reportId ? 'Phân cho chuyên gia' : 'Tạo báo cáo trước'}
                        variant="purple"
                        size="sm"
                        disabled={!req.reportId}
                        onClick={() => router.push(`/reports/requests/${req._id}`)}
                    />
                </div>
            )
        }

        // TDG (Người viết báo cáo)
        if (user.role === 'tdg') {
            return (
                <div className="flex items-center gap-3 flex-wrap justify-center">
                    <ActionButton
                        icon={Eye}
                        title="Xem chi tiết"
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/reports/requests/${req._id}`)}
                    />

                    <ActionButton
                        icon={Plus}
                        title="Tạo báo cáo"
                        variant="success"
                        size="sm"
                        onClick={() => router.push(`/reports/create?requestId=${req._id}`)}
                    />
                </div>
            )
        }

        return null
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

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black mb-2">Quản lý yêu cầu viết báo cáo</h1>
                            <p className="text-blue-100 text-lg">
                                Tổng: <span className="font-bold text-white">{pagination.total}</span> yêu cầu
                            </p>
                        </div>
                        <FileText className="w-16 h-16 text-blue-100 opacity-50" />
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-xs relative">
                            <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm yêu cầu..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 font-bold border-2 border-blue-200 transition-colors gap-2"
                        >
                            <Filter className="w-5 h-5" />
                            Lọc
                        </button>
                        <button
                            onClick={fetchRequests}
                            className="inline-flex items-center px-6 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 font-bold border-2 border-green-200 transition-colors gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Làm mới
                        </button>
                    </div>

                    {showFilters && (
                        <div className="mt-6 pt-6 border-t-2 border-gray-300 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Trạng thái
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
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
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Độ ưu tiên
                                </label>
                                <select
                                    value={filters.priority}
                                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả độ ưu tiên</option>
                                    <option value="low">Thấp</option>
                                    <option value="normal">Bình thường</option>
                                    <option value="high">Cao</option>
                                    <option value="urgent">Khẩn cấp</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden">
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
                                    <thead>
                                    <tr className="bg-gradient-to-r from-blue-400 to-blue-300 text-blue-900 border-b-2 border-blue-400">
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-300 w-12">
                                            STT
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-300">
                                            Tiêu đề yêu cầu
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-300 w-28">
                                            Trạng thái
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-300 w-24">
                                            Độ ưu tiên
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-300 w-20">
                                            Nộp/Tổng
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-300 w-28">
                                            Ngày tạo
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-300 w-32">
                                            Hạn chót
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-300 w-32">
                                            Giao cho
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider w-48">
                                            Thao tác
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                    {requests.map((req, index) => (
                                        <tr key={req._id} className="border-b-2 border-gray-200 hover:bg-blue-50 transition-colors">
                                            <td className="px-4 py-4 text-center font-bold text-gray-700 border-r border-gray-200">
                                                {(pagination.current - 1) * filters.limit + index + 1}
                                            </td>

                                            <td className="px-6 py-4 border-r border-gray-200">
                                                <p className="text-sm font-bold text-gray-900 line-clamp-2">
                                                    {req.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {req.description?.substring(0, 60)}...
                                                </p>
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-gray-200">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(req.status)}`}>
                                                        {getStatusLabel(req.status)}
                                                    </span>
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-gray-200">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border-2 border-current ${getPriorityColor(req.priority)}`}>
                                                        {getPriorityLabel(req.priority)}
                                                    </span>
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-gray-200">
                                                    <span className="inline-flex items-center justify-center w-full px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs border-2 border-blue-300">
                                                        {req.submitCount || 0}/{req.totalAssigned || 1}
                                                    </span>
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-gray-200 text-xs font-semibold text-gray-700">
                                                {formatDate(req.createdAt)}
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-gray-200 text-sm font-semibold text-gray-700">
                                                {formatDate(req.deadline)}
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-gray-200 text-sm font-semibold text-gray-700">
                                                {req.assignedTo?.fullName || 'N/A'}
                                            </td>

                                            <td className="px-6 py-4">
                                                {renderActionButtons(req)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-t-2 border-blue-200 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-700">
                                        Hiển thị <span className="text-blue-600">{((pagination.current - 1) * filters.limit) + 1}</span> đến{' '}
                                        <span className="text-blue-600">{Math.min(pagination.current * filters.limit, pagination.total)}</span> trong tổng số{' '}
                                        <span className="text-blue-600">{pagination.total}</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.current - 1)}
                                            disabled={!pagination.hasPrev}
                                            className="px-4 py-2 border-2 border-blue-300 bg-white text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 font-bold"
                                        >
                                            ← Trước
                                        </button>
                                        <span className="px-4 py-2 font-bold text-blue-600">
                                            {pagination.current} / {pagination.pages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(pagination.current + 1)}
                                            disabled={!pagination.hasNext}
                                            className="px-4 py-2 border-2 border-blue-300 bg-white text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 font-bold"
                                        >
                                            Sau →
                                        </button>
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