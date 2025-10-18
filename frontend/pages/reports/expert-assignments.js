import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import { ActionButton } from '../../components/ActionButtons'
import {
    FileText,
    Search,
    Filter,
    UserCheck,
    Eye,
    BookOpen,
    BarChart3,
    AlertCircle,
    Users,
    CheckCircle,
    Play,
    X,
    RefreshCw,
    Loader2,
    ChevronRight,
    Plus,
    Trash2
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const getStatusColor = (status) => {
    const colors = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        accepted: 'bg-blue-100 text-blue-800 border-blue-300',
        in_progress: 'bg-purple-100 text-purple-800 border-purple-300',
        completed: 'bg-green-100 text-green-800 border-green-300',
        overdue: 'bg-red-100 text-red-800 border-red-300',
        cancelled: 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
}

const getPriorityColor = (priority) => {
    const colors = {
        low: 'bg-gray-50 text-gray-700 border-gray-300',
        normal: 'bg-blue-50 text-blue-700 border-blue-300',
        high: 'bg-orange-50 text-orange-700 border-orange-300',
        urgent: 'bg-red-50 text-red-700 border-red-300'
    }
    return colors[priority] || 'bg-gray-50 text-gray-700 border-gray-300'
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

const getPriorityLabel = (priority) => {
    const labels = {
        low: 'Thấp',
        normal: 'Bình thường',
        high: 'Cao',
        urgent: 'Khẩn cấp'
    }
    return labels[priority] || priority
}

const getRatingText = (rating) => {
    const ratingMap = {
        excellent: 'Xuất sắc',
        good: 'Tốt',
        satisfactory: 'Đạt yêu cầu',
        needs_improvement: 'Cần cải thiện',
        poor: 'Kém'
    }
    return ratingMap[rating] || rating
}

export default function ExpertAssignmentsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [assignments, setAssignments] = useState([])
    const [pagination, setPagination] = useState(null)
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        search: '',
        status: '',
        priority: ''
    })
    const [statistics, setStatistics] = useState(null)
    const [selectedAssignment, setSelectedAssignment] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectingId, setRejectingId] = useState(null)
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'expert') {
            fetchAssignments()
            fetchStatistics()
        }
    }, [user, filters])

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Phân quyền đánh giá', icon: UserCheck }
    ]

    const cleanParams = (obj) => {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        )
    }

    const fetchAssignments = async () => {
        try {
            setLoading(true)
            const params = cleanParams(filters)
            const response = await apiMethods.assignments.getAll(params)
            const data = response.data?.data || response.data

            setAssignments(data?.assignments || [])
            setPagination(data?.pagination)
        } catch (error) {
            console.error('Error fetching assignments:', error)
            const message = error.response?.data?.message || 'Lỗi tải danh sách phân quyền'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const fetchStatistics = async () => {
        try {
            const statsRes = await apiMethods.assignments.getStats()
            setStatistics(statsRes.data?.data)
        } catch (error) {
            console.error('Error fetching statistics:', error)
            setStatistics({
                total: 0,
                pending: 0,
                accepted: 0,
                inProgress: 0,
                completed: 0,
                overdue: 0,
                cancelled: 0
            })
        }
    }

    const handleAccept = async (assignmentId) => {
        try {
            await apiMethods.assignments.accept(assignmentId, { responseNote: '' })
            toast.success('Đã chấp nhận phân quyền')
            fetchAssignments()
            fetchStatistics()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi chấp nhận phân quyền')
        }
    }

    const handleRejectSubmit = async () => {
        if (!rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        try {
            await apiMethods.assignments.reject(rejectingId, { responseNote: rejectReason })
            toast.success('Đã từ chối phân quyền')
            setShowRejectModal(false)
            setRejectReason('')
            setRejectingId(null)
            fetchAssignments()
            fetchStatistics()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi từ chối phân quyền')
        }
    }

    const handleStartEvaluation = (assignment) => {
        if (!['accepted', 'in_progress', 'overdue'].includes(assignment.status)) {
            toast.error('Phân quyền chưa được chấp nhận')
            return
        }

        const evaluationId = assignment.evaluationId?._id

        if (evaluationId) {
            router.push(`/reports/evaluations/${evaluationId}`)
        } else {
            router.push(`/reports/evaluations/new?assignmentId=${assignment._id}`)
        }
    }

    const handleViewReport = (reportId) => {
        router.push(`/reports/${reportId}`)
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setFilters({ ...filters, page: 1 })
    }

    const handlePageChange = (page) => {
        setFilters({ ...filters, page })
    }

    const handleShowDetail = (assignment) => {
        setSelectedAssignment(assignment)
        setShowDetailModal(true)
    }

    const daysUntilDeadline = (deadline) => {
        const now = new Date()
        const deadlineDate = new Date(deadline)
        const diffTime = deadlineDate - now
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const getDeadlineStatus = (deadline) => {
        const days = daysUntilDeadline(deadline)
        if (days < 0) return { class: 'text-red-600 font-semibold', text: 'Quá hạn' }
        if (days === 0) return { class: 'text-red-500 font-semibold', text: 'Hôm nay' }
        if (days <= 3) return { class: 'text-orange-600 font-semibold', text: `${days} ngày` }
        return { class: 'text-green-600', text: `${days} ngày` }
    }

    const clearFilters = () => {
        setFilters({
            page: 1,
            limit: 20,
            search: '',
            status: '',
            priority: ''
        })
    }

    const hasActiveFilters = filters.search || filters.status || filters.priority

    if (isLoading || !user) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (user.role !== 'expert') {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-red-800 font-semibold">Lỗi truy cập</h3>
                    <p className="text-red-600">Trang này chỉ dành cho chuyên gia đánh giá</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* ========== HEADER STATS SECTION - SEPARATED ========== */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Phân quyền đánh giá</h1>
                            <p className="text-blue-100">Quản lý các báo cáo được giao để đánh giá</p>
                        </div>
                    </div>

                    {statistics && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                                <p className="text-blue-100 text-sm mb-2 font-semibold">Tổng phân quyền</p>
                                <p className="text-4xl font-bold">{statistics.total || 0}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                                <p className="text-blue-100 text-sm mb-2 font-semibold">Chờ phản hồi</p>
                                <p className="text-4xl font-bold text-yellow-300">{statistics.pending || 0}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                                <p className="text-blue-100 text-sm mb-2 font-semibold">Đang đánh giá</p>
                                <p className="text-4xl font-bold text-purple-300">{(statistics.accepted || 0) + (statistics.inProgress || 0)}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                                <p className="text-blue-100 text-sm mb-2 font-semibold">Hoàn thành</p>
                                <p className="text-4xl font-bold text-green-300">{statistics.completed || 0}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
                                <p className="text-blue-100 text-sm mb-2 font-semibold">Quá hạn</p>
                                <p className="text-4xl font-bold text-orange-300">{statistics.overdue || 0}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========== SEARCH & FILTER SECTION ========== */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo mã/tên báo cáo..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </form>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-4 py-3 rounded-xl transition-all font-semibold ${
                                    showFilters || hasActiveFilters
                                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                        : 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <Filter className="h-5 w-5 mr-2" />
                                Bộ lọc
                                {hasActiveFilters && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                                        {[filters.status, filters.priority].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={fetchAssignments}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-all font-semibold"
                            >
                                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-gray-300">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-gray-900">Lọc nâng cao</h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold underline"
                                    >
                                        ✕ Xóa tất cả
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Trạng thái
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="pending">Chờ phản hồi</option>
                                        <option value="accepted">Đã chấp nhận</option>
                                        <option value="in_progress">Đang đánh giá</option>
                                        <option value="completed">Đã hoàn thành</option>
                                        <option value="overdue">Quá hạn</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ưu tiên
                                    </label>
                                    <select
                                        value={filters.priority}
                                        onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả ưu tiên</option>
                                        <option value="low">Thấp</option>
                                        <option value="normal">Bình thường</option>
                                        <option value="high">Cao</option>
                                        <option value="urgent">Khẩn cấp</option>
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={handleSearch}
                                        className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                                    >
                                        Tìm kiếm
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========== TABLE SECTION - SEPARATED ========== */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">
                                Danh sách phân quyền
                                <span className="ml-2 text-sm font-semibold text-blue-600">
                                    ({pagination?.total || 0} phân quyền)
                                </span>
                            </h2>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <div className="text-center">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-10 w-10 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có phân quyền nào'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {hasActiveFilters
                                    ? 'Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác'
                                    : 'Khi có báo cáo được giao, nó sẽ hiện tại đây'
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
                                    <thead>
                                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-12">STT</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-20">Mã BC</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 min-w-[240px]">Tiêu đề báo cáo</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 min-w-[150px]">Người giao</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 min-w-[120px]">Hạn chót</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-28">Ưu tiên</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-32">Trạng thái</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-24">Điểm</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                    {assignments.map((assignment, index) => (
                                        <tr
                                            key={assignment._id}
                                            className="hover:bg-blue-50 transition-colors border-b border-gray-300"
                                        >
                                            {/* STT - Số thứ tự */}
                                            <td className="px-4 py-3 text-center border-r border-gray-300 font-semibold text-gray-700">
                                                {((pagination.current - 1) * filters.limit) + index + 1}
                                            </td>

                                            {/* Mã BC */}
                                            <td className="px-4 py-3 text-center border-r border-gray-300">
                                                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-300">
                                                        {assignment.reportId?.code}
                                                    </span>
                                            </td>

                                            {/* Tiêu đề - Căn lề trái */}
                                            <td className="px-6 py-3 border-r border-gray-300 text-left">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={assignment.reportId?.title}>
                                                        {assignment.reportId?.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {assignment.reportId?.type === 'criteria_analysis' && '📋 Phân tích tiêu chí'}
                                                        {assignment.reportId?.type === 'standard_analysis' && '📊 Phân tích tiêu chuẩn'}
                                                        {assignment.reportId?.type === 'comprehensive_report' && '📑 Báo cáo tổng hợp'}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Người giao - Căn lề giữa */}
                                            <td className="px-4 py-3 text-center border-r border-gray-300">
                                                <div className="flex items-center justify-center space-x-1">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900 font-medium">{assignment.assignedBy?.fullName}</span>
                                                </div>
                                            </td>

                                            {/* Hạn chót - Căn lề giữa */}
                                            <td className="px-4 py-3 text-center border-r border-gray-300">
                                                <div>
                                                    <p className={`text-sm font-semibold ${getDeadlineStatus(assignment.deadline).class}`}>
                                                        {getDeadlineStatus(assignment.deadline).text}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {formatDate(assignment.deadline)}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Ưu tiên - Căn lề giữa */}
                                            <td className="px-4 py-3 text-center border-r border-gray-300">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(assignment.priority)}`}>
                                                        {getPriorityLabel(assignment.priority)}
                                                    </span>
                                            </td>

                                            {/* Trạng thái - Căn lề giữa */}
                                            <td className="px-4 py-3 text-center border-r border-gray-300">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(assignment.status)}`}>
                                                        {getStatusLabel(assignment.status)}
                                                    </span>
                                            </td>

                                            {/* Điểm - Căn lề giữa */}
                                            <td className="px-4 py-3 text-center border-r border-gray-300">
                                                {assignment.evaluationId?.averageScore ? (
                                                    <div>
                                                        <p className="font-bold text-blue-700 text-sm">
                                                            {assignment.evaluationId.averageScore}/10
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {getRatingText(assignment.evaluationId.rating)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">--</span>
                                                )}
                                            </td>

                                            {/* Thao tác - Căn lề giữa */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                                    {assignment.status === 'pending' && (
                                                        <>
                                                            <ActionButton
                                                                icon={CheckCircle}
                                                                onClick={() => handleAccept(assignment._id)}
                                                                variant="success"
                                                                size="sm"
                                                                title="Chấp nhận phân quyền"
                                                            />
                                                            <ActionButton
                                                                icon={X}
                                                                onClick={() => {
                                                                    setRejectingId(assignment._id)
                                                                    setShowRejectModal(true)
                                                                }}
                                                                variant="danger"
                                                                size="sm"
                                                                title="Từ chối phân quyền"
                                                            />
                                                        </>
                                                    )}

                                                    {['accepted', 'in_progress', 'overdue'].includes(assignment.status) && (
                                                        <ActionButton
                                                            icon={assignment.evaluationId ? BookOpen : Play}
                                                            onClick={() => handleStartEvaluation(assignment)}
                                                            variant="purple"
                                                            size="sm"
                                                            title={assignment.evaluationId ? 'Tiếp tục đánh giá' : 'Bắt đầu đánh giá'}
                                                        />
                                                    )}

                                                    <ActionButton
                                                        icon={Eye}
                                                        onClick={() => handleViewReport(assignment.reportId._id)}
                                                        variant="view"
                                                        size="sm"
                                                        title="Xem báo cáo"
                                                    />

                                                    <ActionButton
                                                        icon={ChevronRight}
                                                        onClick={() => handleShowDetail(assignment)}
                                                        variant="secondary"
                                                        size="sm"
                                                        title="Xem chi tiết"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.pages > 1 && (
                                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-t-2 border-gray-300">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="text-sm text-gray-700 font-semibold">
                                            Trang <span className="text-blue-600">{pagination.current}</span> / <span className="text-blue-600">{pagination.pages}</span>
                                            {' | '}
                                            Hiển thị <span className="text-blue-600">{((pagination.current - 1) * filters.limit) + 1}</span>
                                            {' - '}
                                            <span className="text-blue-600">{Math.min(pagination.current * filters.limit, pagination.total)}</span>
                                            {' / Tổng '}
                                            <span className="text-blue-600">{pagination.total}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(1)}
                                                disabled={!pagination.hasPrev}
                                                className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                                            >
                                                «
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(pagination.current - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                                            >
                                                ‹ Trước
                                            </button>
                                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                                                let pageNum;
                                                if (pagination.pages <= 7) {
                                                    pageNum = i + 1;
                                                } else if (pagination.current <= 4) {
                                                    pageNum = i + 1;
                                                } else if (pagination.current >= pagination.pages - 3) {
                                                    pageNum = pagination.pages - 6 + i;
                                                } else {
                                                    pageNum = pagination.current - 3 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-3 py-2 text-sm rounded-lg transition-all font-semibold ${
                                                            pagination.current === pageNum
                                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-600'
                                                                : 'border-2 border-gray-300 hover:bg-white text-gray-700'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => handlePageChange(pagination.current + 1)}
                                                disabled={!pagination.hasNext}
                                                className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                                            >
                                                Sau ›
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(pagination.pages)}
                                                disabled={!pagination.hasNext}
                                                className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                                            >
                                                »
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ========== DETAIL MODAL ========== */}
            {showDetailModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">{selectedAssignment.reportId?.title}</h2>
                                <p className="text-blue-100 text-sm">{selectedAssignment.reportId?.code}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Người giao</p>
                                    <p className="text-gray-900 font-medium">{selectedAssignment.assignedBy?.fullName}</p>
                                    <p className="text-xs text-gray-500">{selectedAssignment.assignedBy?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Hạn chót</p>
                                    <p className="text-gray-900 font-medium">{formatDate(selectedAssignment.deadline)}</p>
                                    <p className={`text-xs font-medium ${getDeadlineStatus(selectedAssignment.deadline).class}`}>
                                        {getDeadlineStatus(selectedAssignment.deadline).text}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Ưu tiên</p>
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(selectedAssignment.priority)}`}>
                                        {getPriorityLabel(selectedAssignment.priority)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Trạng thái</p>
                                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedAssignment.status)}`}>
                                        {getStatusLabel(selectedAssignment.status)}
                                    </span>
                                </div>
                            </div>

                            {selectedAssignment.assignmentNote && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Ghi chú phân công</p>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm border border-gray-300">
                                        {selectedAssignment.assignmentNote}
                                    </p>
                                </div>
                            )}

                            {selectedAssignment.evaluationId?.averageScore && (
                                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                                    <p className="text-xs text-blue-600 uppercase font-semibold mb-3">Kết quả đánh giá</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-blue-600">
                                                {selectedAssignment.evaluationId.averageScore}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">Điểm trung bình</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-gray-700 mb-1">Xếp loại</p>
                                            <p className="text-xs font-bold text-gray-900">
                                                {getRatingText(selectedAssignment.evaluationId.rating)}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-gray-700 mb-1">Tình trạng</p>
                                            <p className="text-xs font-bold text-gray-900">
                                                {getStatusLabel(selectedAssignment.evaluationId.status)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                            >
                                Đóng
                            </button>
                            {['accepted', 'in_progress', 'overdue'].includes(selectedAssignment.status) && (
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false)
                                        handleStartEvaluation(selectedAssignment)
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                >
                                    {selectedAssignment.evaluationId ? 'Tiếp tục đánh giá' : 'Bắt đầu đánh giá'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========== REJECT MODAL ========== */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-red-50 px-6 py-4 border-b-2 border-red-300">
                            <h2 className="text-lg font-bold text-red-900">Từ chối phân quyền</h2>
                            <p className="text-sm text-red-700 mt-1">Vui lòng nhập lý do từ chối</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Nhập lý do từ chối..."
                                maxLength={500}
                                rows={4}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            />
                            <p className="text-xs text-gray-500 text-right">
                                {rejectReason.length}/500 ký tự
                            </p>
                        </div>

                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false)
                                    setRejectReason('')
                                    setRejectingId(null)
                                }}
                                className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={!rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}