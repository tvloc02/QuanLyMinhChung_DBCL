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
    RefreshCw,
    Loader2,
    ChevronDown,
    ChevronRight,
    CheckCircle,
    Clock,
    AlertCircle,
    Briefcase,
    Calendar,
    Flag,
    Mail,
    PenTool,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function MyAssignments() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Phân quyền của tôi' }
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
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    })

    const [showFilters, setShowFilters] = useState(false)
    const [expandedRows, setExpandedRows] = useState({})

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'expert') {
            fetchMyAssignments()
        }
    }, [filters, user])

    const fetchMyAssignments = async () => {
        try {
            setLoading(true)
            const params = {
                page: filters.page,
                limit: filters.limit,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                expertId: user.id
            }

            if (filters.search) params.search = filters.search
            if (filters.status) params.status = filters.status

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

    const handleAcceptAssignment = async (id) => {
        try {
            await apiMethods.assignments.accept(id, { responseNote: 'Tôi chấp nhận phân quyền này' })
            toast.success('Chấp nhận phân quyền thành công')
            fetchMyAssignments()
        } catch (error) {
            console.error('Accept error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi chấp nhận phân quyền')
        }
    }

    const handleRejectAssignment = async (id) => {
        const reason = prompt('Vui lòng nhập lý do từ chối:')
        if (!reason) return

        try {
            await apiMethods.assignments.reject(id, { responseNote: reason })
            toast.success('Từ chối phân quyền thành công')
            fetchMyAssignments()
        } catch (error) {
            console.error('Reject error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi từ chối phân quyền')
        }
    }

    const handleStartEvaluation = (assignmentId, reportId) => {
        router.push(`/reports/evaluations/create?assignmentId=${assignmentId}&reportId=${reportId}`)
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
            in_progress: PenTool,
            completed: CheckCircle,
            overdue: AlertCircle,
            cancelled: AlertCircle
        }
        return icons[status] || Clock
    }

    const hasActiveFilters = filters.search || filters.status

    const stats = {
        total: pagination.total,
        pending: assignments.filter(a => a.status === 'pending').length,
        inProgress: assignments.filter(a => a.status === 'in_progress').length,
        completed: assignments.filter(a => a.status === 'completed').length,
        overdue: assignments.filter(a => a.status === 'overdue').length
    }

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

    if (!user || user.role !== 'expert') {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <h3 className="text-red-800 font-bold">Lỗi truy cập</h3>
                    <p className="text-red-600">Chỉ chuyên gia đánh giá có thể xem trang này</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <Briefcase className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Phân quyền của tôi</h1>
                            <p className="text-purple-100">Các báo cáo được giao cho tôi để đánh giá</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                        <p className="text-blue-600 text-sm font-semibold mb-2">Tổng cộng</p>
                        <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200">
                        <p className="text-yellow-600 text-sm font-semibold mb-2">Chờ phản hồi</p>
                        <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-6 border-2 border-cyan-200">
                        <p className="text-cyan-600 text-sm font-semibold mb-2">Đang đánh giá</p>
                        <p className="text-3xl font-bold text-cyan-900">{stats.inProgress}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                        <p className="text-green-600 text-sm font-semibold mb-2">Đã hoàn thành</p>
                        <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
                        <p className="text-red-600 text-sm font-semibold mb-2">Quá hạn</p>
                        <p className="text-3xl font-bold text-red-900">{stats.overdue}</p>
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
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                />
                            </form>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-4 py-3 rounded-xl transition-all font-semibold ${
                                    showFilters || hasActiveFilters
                                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Filter className="h-5 w-5 mr-2" />
                                Bộ lọc
                                {hasActiveFilters && (
                                    <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold">
                                        {[filters.status].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={fetchMyAssignments}
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
                                        className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
                                    >
                                        Xóa tất cả bộ lọc
                                    </button>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="pending">Chờ phản hồi</option>
                                    <option value="accepted">Đã chấp nhận</option>
                                    <option value="in_progress">Đang đánh giá</option>
                                    <option value="completed">Đã hoàn thành</option>
                                    <option value="overdue">Quá hạn</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                        <h2 className="text-lg font-bold text-gray-900">
                            Danh sách báo cáo cần đánh giá
                            <span className="ml-2 text-sm font-semibold text-purple-600">
                                ({pagination.total} kết quả)
                            </span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-16">
                            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="h-10 w-10 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có phân quyền nào'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {hasActiveFilters
                                    ? 'Thử thay đổi bộ lọc'
                                    : 'Bạn sẽ nhận được thông báo khi được phân quyền báo cáo'
                                }
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-purple-200">
                                            Báo cáo
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-purple-200">
                                            Người phân quyền
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-purple-200">
                                            Hạn chót
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-purple-200">
                                            Ưu tiên
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-purple-200">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-purple-200">
                                            Thao tác
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                    {assignments.map((assignment) => {
                                        const StatusIcon = getStatusIcon(assignment.status)
                                        const isPending = assignment.status === 'pending'
                                        const isAccepted = assignment.status === 'accepted'
                                        const isInProgress = assignment.status === 'in_progress'

                                        return (
                                            <tr key={assignment._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                                <td className="px-6 py-4 border-r border-gray-200">
                                                    <button
                                                        onClick={() => toggleExpandRow(assignment._id)}
                                                        className="flex items-start space-x-3 hover:text-purple-600 transition-colors w-full"
                                                    >
                                                        {expandedRows[assignment._id] ? (
                                                            <ChevronDown className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
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
                                                    {expandedRows[assignment._id] && assignment.assignmentNote && (
                                                        <div className="mt-3 ml-8 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
                                                            <p className="font-semibold text-gray-700 mb-1">Ghi chú:</p>
                                                            <p>{assignment.assignmentNote}</p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-r border-gray-200">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {assignment.assignedBy?.fullName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 flex items-center mt-1">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            {assignment.assignedBy?.email}
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
                                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => router.push(`/reports/${assignment.reportId?._id}`)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Xem báo cáo"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>

                                                        {isPending && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAcceptAssignment(assignment._id)}
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Chấp nhận phân quyền"
                                                                >
                                                                    <ThumbsUp className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectAssignment(assignment._id)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Từ chối phân quyền"
                                                                >
                                                                    <ThumbsDown className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}

                                                        {(isAccepted || isInProgress) && (
                                                            <button
                                                                onClick={() => handleStartEvaluation(assignment._id, assignment.reportId?._id)}
                                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                title="Bắt đầu đánh giá"
                                                            >
                                                                <PenTool className="h-4 w-4" />
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
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-t-2 border-purple-200">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-700">
                                            Hiển thị <strong className="text-purple-600">{((pagination.current - 1) * filters.limit) + 1}</strong> đến{' '}
                                            <strong className="text-purple-600">{Math.min(pagination.current * filters.limit, pagination.total)}</strong> trong tổng số{' '}
                                            <strong className="text-purple-600">{pagination.total}</strong> kết quả
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(pagination.current - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="px-4 py-2 text-sm border-2 border-purple-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
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
                                                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                                                                : 'border-2 border-purple-200 hover:bg-white text-gray-700'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                )
                                            })}
                                            <button
                                                onClick={() => handlePageChange(pagination.current + 1)}
                                                disabled={!pagination.hasNext}
                                                className="px-4 py-2 text-sm border-2 border-purple-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
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