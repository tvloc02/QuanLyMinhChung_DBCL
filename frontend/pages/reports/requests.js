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
    Send,
    ChevronLeft,
    ChevronRight,
    ArrowLeft
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ReportRequestsPage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    const isAdmin = user?.role === 'admin'
    const isManager = user?.role === 'manager'
    const canCreateRequest = isAdmin || isManager // Chỉ Admin và Manager có quyền tạo yêu cầu

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

    // Màu sắc trạng thái đã được chỉnh về tông xanh lam/teal
    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            accepted: 'bg-blue-100 text-blue-800 border-blue-200',
            in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
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

    // Màu sắc độ ưu tiên đã được chỉnh về tông xanh lam/cam
    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-gray-100 text-gray-700 border-gray-200',
            normal: 'bg-blue-100 text-blue-700 border-blue-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            urgent: 'bg-red-100 text-red-700 border-red-200'
        }
        return colors[priority] || 'bg-gray-100 text-gray-700 border-gray-200'
    }

    const renderActionButtons = (req) => {
        // Manager
        if (user.role === 'manager') {
            return (
                <div className="flex items-center gap-1 flex-wrap justify-center">
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
                <div className="flex items-center gap-1 flex-wrap justify-center">
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

        return (
            <ActionButton
                icon={Eye}
                title="Xem chi tiết"
                variant="primary"
                size="sm"
                onClick={() => router.push(`/reports/requests/${req._id}`)}
            />
        )
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
                {/* Header - Màu xanh lam đồng bộ */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        {/* Tiêu đề và Icon bên trái */}
                        <div className='flex items-center space-x-4'>
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Quản lý yêu cầu viết báo cáo</h1>
                                <p className="text-blue-100">
                                    Tổng: <span className="font-semibold text-white">{pagination.total}</span> yêu cầu
                                </p>
                            </div>
                        </div>

                        {/* Nút Thêm yêu cầu bên phải */}
                        {canCreateRequest && (
                            <button
                                onClick={() => router.push('/reports/create-request')}
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-lg transition-all font-semibold"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Thêm yêu cầu</span>
                            </button>
                        )}
                        {!canCreateRequest && (
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 transition-all font-semibold"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Quay lại</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-xs relative">
                            <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm yêu cầu..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center px-6 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 font-semibold border-2 border-blue-200 transition-colors gap-2"
                        >
                            <Filter className="w-5 h-5" />
                            Lọc
                        </button>
                        <button
                            onClick={fetchRequests}
                            className="inline-flex items-center px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-100 font-semibold border-2 border-gray-300 transition-colors gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Làm mới
                        </button>
                    </div>

                    {showFilters && (
                        <div className="mt-6 pt-6 border-t-2 border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Trạng thái
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200 overflow-hidden">
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
                                    {/* Sửa màu header bảng */}
                                    <tr className="bg-blue-100 text-gray-700 border-b-2 border-blue-300">
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-12">
                                            STT
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-200">
                                            Tiêu đề yêu cầu
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-36">
                                            Trạng thái
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-24">
                                            Độ ưu tiên
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-20">
                                            Nộp/Tổng
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-28">
                                            Ngày tạo
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-28">
                                            Hạn chót
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-32">
                                            Giao cho
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider w-48">
                                            Thao tác
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-blue-200">
                                    {requests.map((req, index) => (
                                        <tr key={req._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} border-b border-blue-200 hover:bg-blue-100 transition-colors`}>
                                            <td className="px-4 py-4 text-center font-bold text-gray-700 border-r border-blue-200">
                                                {(pagination.current - 1) * filters.limit + index + 1}
                                            </td>

                                            <td className="px-6 py-4 border-r border-blue-200">
                                                <p className="text-sm font-bold text-gray-900 line-clamp-2">
                                                    {req.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {req.description?.substring(0, 60)}...
                                                </p>
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-blue-200">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border-2 ${getStatusColor(req.status)}`}>
                                                        {getStatusLabel(req.status)}
                                                    </span>
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-blue-200">
                                                    <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border-2 border-current ${getPriorityColor(req.priority)}`}>
                                                        {getPriorityLabel(req.priority)}
                                                    </span>
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-blue-200">
                                                    <span className="inline-flex items-center justify-center w-full px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs border border-blue-200">
                                                        {req.submitCount || 0}/{req.totalAssigned || 1}
                                                    </span>
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-blue-200 text-xs font-semibold text-gray-700">
                                                {formatDate(req.createdAt)}
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-blue-200 text-sm font-semibold text-gray-700">
                                                {formatDate(req.deadline)}
                                            </td>

                                            <td className="px-4 py-4 text-center border-r border-blue-200 text-sm font-semibold text-gray-700">
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

                            {/* Pagination - Màu xanh lam đồng bộ */}
                            {pagination.pages > 1 && (
                                <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-t-2 border-blue-200 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-700">
                                        Hiển thị <span className="text-blue-600">{((pagination.current - 1) * filters.limit) + 1}</span> đến{' '}
                                        <span className="text-blue-600">{Math.min(pagination.current * filters.limit, pagination.total)}</span> trong tổng số{' '}
                                        <span className="text-blue-600">{pagination.total}</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.current - 1)}
                                            disabled={pagination.current === 1}
                                            className="px-4 py-2 border-2 border-blue-300 bg-white text-blue-600 rounded-xl hover:bg-blue-50 disabled:opacity-50 font-semibold transition-all"
                                        >
                                            <ChevronLeft className='h-4 w-4'/>
                                            Trước
                                        </button>
                                        <span className="px-4 py-2 font-semibold text-blue-600">
                                            {pagination.current} / {pagination.pages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(pagination.current + 1)}
                                            disabled={pagination.current === pagination.pages}
                                            className="px-4 py-2 border-2 border-blue-300 bg-white text-blue-600 rounded-xl hover:bg-blue-50 disabled:opacity-50 font-semibold transition-all"
                                        >
                                            Sau
                                            <ChevronRight className='h-4 w-4'/>
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