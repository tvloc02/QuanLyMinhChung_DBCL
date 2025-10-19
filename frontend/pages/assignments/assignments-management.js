import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import api, { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    FileText,
    Search,
    Filter,
    Eye,
    Trash2,
    RefreshCw,
    Loader2,
    ChevronDown,
    ChevronRight,
    CheckCircle,
    Clock,
    AlertCircle,
    Users,
    Calendar,
    Flag,
    Mail,
    X,
    Briefcase
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function AssignmentsManagement() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Phân quyền đánh giá' }
    ]

    const [assignments, setAssignments] = useState([])
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
        expertId: '',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    })

    const [experts, setExperts] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    const [expandedRows, setExpandedRows] = useState({})

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && (user.role === 'manager' || user.role === 'admin')) {
            fetchAssignments()
            fetchExperts()
        }
    }, [filters, user])

    const fetchAssignments = async () => {
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
            if (filters.expertId) params.expertId = filters.expertId

            const response = await apiMethods.assignments.getAll(params)
            const data = response.data?.data || response.data

            setAssignments(data?.assignments || [])
            setPagination(data?.pagination || { current: 1, pages: 1, total: 0 })
        } catch (error) {
            console.error('Fetch assignments error:', error)
            toast.error('Lỗi khi tải danh sách phân quyền')
            setAssignments([])
        } finally {
            setLoading(false)
        }
    }

    const fetchExperts = async () => {
        try {
            const response = await api.get('/api/users', {
                params: {
                    role: 'expert',
                    status: 'active',
                    limit: 100
                }
            })
            setExperts(response.data?.data?.users || [])
        } catch (error) {
            console.error('Fetch experts error:', error)
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

    const handleDeleteAssignment = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa phân quyền này?')) return

        try {
            await apiMethods.assignments.delete(id)
            toast.success('Xóa phân quyền thành công')
            fetchAssignments()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xóa phân quyền')
        }
    }

    const toggleExpandRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            priority: '',
            expertId: '',
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        })
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            accepted: 'bg-blue-100 text-blue-800 border-blue-200',
            in_progress: 'bg-cyan-100 text-cyan-800 border-cyan-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            overdue: 'bg-red-100 text-red-800 border-red-200',
            cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Chờ phản hồi',
            accepted: 'Đã chấp nhận',
            in_progress: 'Đang đánh giá',
            completed: 'Đã hoàn thành',
            overdue: 'Quá hạn',
            cancelled: 'Đã hủy'
        }
        return labels[status] || status
    }

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'text-gray-600 bg-gray-100 border-gray-300',
            normal: 'text-blue-600 bg-blue-100 border-blue-300',
            high: 'text-orange-600 bg-orange-100 border-orange-300',
            urgent: 'text-red-600 bg-red-100 border-red-300'
        }
        return colors[priority] || 'text-gray-600 bg-gray-100 border-gray-300'
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

    const getStatusIcon = (status) => {
        const icons = {
            pending: Clock,
            accepted: CheckCircle,
            in_progress: Loader2,
            completed: CheckCircle,
            overdue: AlertCircle,
            cancelled: X
        }
        return icons[status] || Clock
    }

    const hasActiveFilters = filters.search || filters.status || filters.priority || filters.expertId

    if (isLoading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <h3 className="text-red-800 font-bold">Lỗi truy cập</h3>
                    <p className="text-red-600">Chỉ quản lý viên hoặc admin có thể quản lý phân quyền</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Quản lý phân quyền đánh giá</h1>
                            <p className="text-blue-100">Theo dõi và quản lý các phân quyền đánh giá báo cáo</p>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <form className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo mã báo cáo, tiêu đề..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </form>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-4 py-3 rounded-xl transition-all font-semibold ${
                                    showFilters || hasActiveFilters
                                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Filter className="h-5 w-5 mr-2" />
                                Bộ lọc
                                {hasActiveFilters && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                                        {[filters.status, filters.priority, filters.expertId].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={fetchAssignments}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-semibold"
                            >
                                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-gray-900">Lọc nâng cao</h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                                    >
                                        Xóa tất cả bộ lọc
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Trạng thái
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="pending">Chờ phản hồi</option>
                                        <option value="accepted">Đã chấp nhận</option>
                                        <option value="in_progress">Đang đánh giá</option>
                                        <option value="completed">Đã hoàn thành</option>
                                        <option value="overdue">Quá hạn</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ưu tiên
                                    </label>
                                    <select
                                        value={filters.priority}
                                        onChange={(e) => handleFilterChange('priority', e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Tất cả ưu tiên</option>
                                        <option value="low">Thấp</option>
                                        <option value="normal">Bình thường</option>
                                        <option value="high">Cao</option>
                                        <option value="urgent">Khẩn cấp</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Chuyên gia
                                    </label>
                                    <select
                                        value={filters.expertId}
                                        onChange={(e) => handleFilterChange('expertId', e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Tất cả chuyên gia</option>
                                        {experts.map(expert => (
                                            <option key={expert._id} value={expert._id}>
                                                {expert.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50">
                        <h2 className="text-lg font-bold text-gray-900">
                            Danh sách phân quyền
                            <span className="ml-2 text-sm font-semibold text-blue-600">
                                ({pagination.total} kết quả)
                            </span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-16">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-10 w-10 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có phân quyền nào'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {hasActiveFilters
                                    ? 'Thử thay đổi bộ lọc'
                                    : 'Bắt đầu bằng cách phân quyền báo cáo cho chuyên gia'
                                }
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gradient-to-r from-blue-50 to-sky-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                            Báo cáo
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                            Chuyên gia
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                            Hạn chót
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                            Ưu tiên
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-blue-200">
                                            Thao tác
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                    {assignments.map((assignment) => {
                                        const StatusIcon = getStatusIcon(assignment.status)
                                        return (
                                            <tr key={assignment._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                                <td className="px-6 py-4 border-r border-gray-200">
                                                    <button
                                                        onClick={() => toggleExpandRow(assignment._id)}
                                                        className="flex items-start space-x-3 hover:text-blue-600 transition-colors w-full"
                                                    >
                                                        {expandedRows[assignment._id] ? (
                                                            <ChevronDown className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                                                {assignment.reportId?.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 font-mono">
                                                                {assignment.reportId?.code}
                                                            </p>
                                                        </div>
                                                    </button>
                                                    {expandedRows[assignment._id] && (
                                                        <div className="mt-3 ml-8 space-y-1 text-xs text-gray-600">
                                                            {assignment.assignmentNote && (
                                                                <div>
                                                                    <p className="font-semibold text-gray-700">Ghi chú:</p>
                                                                    <p>{assignment.assignmentNote}</p>
                                                                </div>
                                                            )}
                                                            {assignment.evaluationId && (
                                                                <div>
                                                                    <p className="font-semibold text-green-700 flex items-center">
                                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                                        Đánh giá: {assignment.evaluationId?.averageScore || 'N/A'}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-r border-gray-200">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {assignment.expertId?.fullName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 flex items-center mt-1">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            {assignment.expertId?.email}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center border-r border-gray-200">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm font-semibold text-gray-900">
                                                                {formatDate(assignment.deadline)}
                                                            </span>
                                                    </div>
                                                    {assignment.daysUntilDeadline !== undefined && (
                                                        <p className={`text-xs font-semibold mt-1 ${
                                                            assignment.daysUntilDeadline < 0
                                                                ? 'text-red-600'
                                                                : assignment.daysUntilDeadline < 3
                                                                    ? 'text-orange-600'
                                                                    : 'text-green-600'
                                                        }`}>
                                                            {assignment.daysUntilDeadline < 0
                                                                ? `Quá hạn ${Math.abs(assignment.daysUntilDeadline)} ngày`
                                                                : `Còn ${assignment.daysUntilDeadline} ngày`
                                                            }
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center border-r border-gray-200">
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getPriorityColor(assignment.priority)}`}>
                                                            <Flag className="h-3 w-3 mr-1" />
                                                            {getPriorityLabel(assignment.priority)}
                                                        </span>
                                                </td>
                                                <td className="px-6 py-4 text-center border-r border-gray-200">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <StatusIcon className="h-4 w-4" />
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(assignment.status)}`}>
                                                                {getStatusLabel(assignment.status)}
                                                            </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => router.push(`/reports/${assignment.reportId?._id}`)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Xem báo cáo"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        {assignment.status !== 'completed' && (
                                                            <button
                                                                onClick={() => handleDeleteAssignment(assignment._id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Xóa phân quyền"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.pages > 1 && (
                                <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-t-2 border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-700">
                                            Hiển thị <strong className="text-blue-600">{((pagination.current - 1) * filters.limit) + 1}</strong> đến{' '}
                                            <strong className="text-blue-600">{Math.min(pagination.current * filters.limit, pagination.total)}</strong> trong tổng số{' '}
                                            <strong className="text-blue-600">{pagination.total}</strong> kết quả
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(pagination.current - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="px-4 py-2 text-sm border-2 border-blue-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
                                            >
                                                Trước
                                            </button>
                                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                                                let pageNum;
                                                if (pagination.pages <= 7) {
                                                    pageNum = i + 1
                                                } else if (pagination.current <= 4) {
                                                    pageNum = i + 1
                                                } else if (pagination.current >= pagination.pages - 3) {
                                                    pageNum = pagination.pages - 6 + i
                                                } else {
                                                    pageNum = pagination.current - 3 + i
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-4 py-2 text-sm rounded-xl transition-all font-semibold ${
                                                            pagination.current === pageNum
                                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                                                : 'border-2 border-blue-200 hover:bg-white text-gray-700'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                )
                                            })}
                                            <button
                                                onClick={() => handlePageChange(pagination.current + 1)}
                                                disabled={!pagination.hasNext}
                                                className="px-4 py-2 text-sm border-2 border-blue-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
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