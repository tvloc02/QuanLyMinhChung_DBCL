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
    CheckCircle,
    Play,
    X,
    RefreshCw,
    Loader2,
    ChevronRight,
    Plus,
    Trash2,
    Check,
    XCircle
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

const getDeadlineStatus = (deadline) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
        return { class: 'text-red-600', text: 'Đã quá hạn' }
    } else if (diffDays === 0) {
        return { class: 'text-orange-600', text: 'Hôm nay' }
    } else if (diffDays === 1) {
        return { class: 'text-orange-600', text: 'Ngày mai' }
    } else if (diffDays <= 3) {
        return { class: 'text-orange-500', text: `${diffDays} ngày` }
    } else {
        return { class: 'text-green-600', text: `${diffDays} ngày` }
    }
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
        priority: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    })
    const [statistics, setStatistics] = useState(null)
    const [selectedAssignment, setSelectedAssignment] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectingIds, setRejectingIds] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    const [selectedItems, setSelectedItems] = useState([])
    const [isProcessingBulk, setIsProcessingBulk] = useState(false)

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/', icon: FileText },
        { name: 'Phân quyền đánh giá' }
    ]

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

    const cleanParams = (obj) => {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        )
    }

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

            const response = await apiMethods.assignments.getAll(params)
            const data = response.data?.data || response.data

            setAssignments(data?.assignments || [])
            setPagination(data?.pagination || { current: 1, pages: 1, total: 0 })
            setSelectedItems([])
        } catch (error) {
            console.error('Error fetching assignments:', error)
            const message = error.response?.data?.message || 'Lỗi tải danh sách phân quyền'
            toast.error(message)
            setAssignments([])
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
            console.error('Error accepting assignment:', error)
            const message = error.response?.data?.message || 'Lỗi khi chấp nhận phân quyền'
            toast.error(message)
        }
    }

    const handleBulkAccept = async () => {
        if (selectedItems.length === 0) {
            toast.error('Vui lòng chọn ít nhất một phân quyền')
            return
        }

        try {
            setIsProcessingBulk(true)
            let successCount = 0
            let failCount = 0

            for (const id of selectedItems) {
                try {
                    await apiMethods.assignments.accept(id, { responseNote: '' })
                    successCount++
                } catch (error) {
                    failCount++
                }
            }

            if (successCount > 0) {
                toast.success(`Đã chấp nhận ${successCount} phân quyền`)
            }
            if (failCount > 0) {
                toast.error(`Có ${failCount} phân quyền lỗi`)
            }

            fetchAssignments()
            fetchStatistics()
        } catch (error) {
            console.error('Error bulk accepting:', error)
            toast.error('Lỗi khi chấp nhận hàng loạt')
        } finally {
            setIsProcessingBulk(false)
        }
    }

    const handleBulkReject = () => {
        if (selectedItems.length === 0) {
            toast.error('Vui lòng chọn ít nhất một phân quyền')
            return
        }
        setRejectingIds(selectedItems)
        setShowRejectModal(true)
    }

    const handleStartEvaluation = async (assignment) => {
        try {
            router.push(`/evaluations/create?assignmentId=${assignment._id}`)
        } catch (error) {
            console.error('Error starting evaluation:', error)
            toast.error('Lỗi khi bắt đầu đánh giá')
        }
    }

    const handleRejectSubmit = async () => {
        try {
            if (!rejectReason.trim()) {
                toast.error('Vui lòng nhập lý do từ chối')
                return
            }

            setIsProcessingBulk(true)
            let successCount = 0
            let failCount = 0

            for (const id of rejectingIds) {
                try {
                    await apiMethods.assignments.reject(id, { rejectionReason: rejectReason })
                    successCount++
                } catch (error) {
                    failCount++
                }
            }

            if (successCount > 0) {
                toast.success(`Đã từ chối ${successCount} phân quyền`)
            }
            if (failCount > 0) {
                toast.error(`Có ${failCount} phân quyền lỗi`)
            }

            setShowRejectModal(false)
            setRejectReason('')
            setRejectingIds([])

            fetchAssignments()
            fetchStatistics()
        } catch (error) {
            console.error('Error rejecting assignments:', error)
            toast.error('Lỗi khi từ chối phân quyền')
        } finally {
            setIsProcessingBulk(false)
        }
    }

    const handleViewDetail = (assignment) => {
        setSelectedAssignment(assignment)
        setShowDetailModal(true)
    }

    const handleDelete = async (assignmentId) => {
        if (!confirm('Bạn chắc chắn muốn xóa phân quyền này?')) return

        try {
            await apiMethods.assignments.delete(assignmentId)
            toast.success('Đã xóa phân quyền')
            fetchAssignments()
            fetchStatistics()
        } catch (error) {
            console.error('Error deleting assignment:', error)
            const message = error.response?.data?.message || 'Lỗi khi xóa phân quyền'
            toast.error(message)
        }
    }

    const handlePageChange = (pageNum) => {
        setFilters(prev => ({ ...prev, page: pageNum }))
    }

    const handleSearchChange = (value) => {
        setFilters(prev => ({ ...prev, search: value, page: 1 }))
    }

    const handleStatusFilter = (status) => {
        setFilters(prev => ({ ...prev, status, page: 1 }))
    }

    const handlePriorityFilter = (priority) => {
        setFilters(prev => ({ ...prev, priority, page: 1 }))
    }

    const handleRefresh = () => {
        fetchAssignments()
        fetchStatistics()
    }

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(assignments.map(a => a._id))
        } else {
            setSelectedItems([])
        }
    }

    const handleSelectItem = (id, e) => {
        e.stopPropagation()
        if (e.target.checked) {
            setSelectedItems(prev => [...prev, id])
        } else {
            setSelectedItems(prev => prev.filter(item => item !== id))
        }
    }

    if (!user) return null

    return (
        <Layout breadcrumbItems={breadcrumbItems}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* ========== HEADER ========== */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                                <UserCheck className="w-10 h-10 text-blue-600" />
                                Phân quyền đánh giá
                            </h1>
                            <p className="text-gray-600 mt-2">Quản lý và theo dõi các phân quyền đánh giá báo cáo</p>
                        </div>
                        <div className="flex gap-2">
                            <ActionButton
                                icon={RefreshCw}
                                variant="primary"
                                size="md"
                                onClick={handleRefresh}
                                title="Tải lại dữ liệu"
                            />
                        </div>
                    </div>

                    {/* ========== STATISTICS ========== */}
                    {statistics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Tổng phân quyền</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total || 0}</p>
                                    </div>
                                    <BarChart3 className="w-10 h-10 text-blue-500 opacity-20" />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Chờ phản hồi</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.pending || 0}</p>
                                    </div>
                                    <AlertCircle className="w-10 h-10 text-yellow-500 opacity-20" />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Đang đánh giá</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.inProgress || 0}</p>
                                    </div>
                                    <Play className="w-10 h-10 text-purple-500 opacity-20" />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-semibold">Hoàn thành</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.completed || 0}</p>
                                    </div>
                                    <CheckCircle className="w-10 h-10 text-green-500 opacity-20" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========== FILTERS ========== */}
                    <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-blue-400">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-blue-600" />
                                Bộ lọc
                            </h2>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                {showFilters ? 'Ẩn' : 'Hiện'}
                            </button>
                        </div>

                        {showFilters && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Tìm kiếm</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm theo tên báo cáo, mã..."
                                            value={filters.search}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Trạng thái</label>
                                        <select
                                            value={filters.status}
                                            onChange={(e) => handleStatusFilter(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">Ưu tiên</label>
                                        <select
                                            value={filters.priority}
                                            onChange={(e) => handlePriorityFilter(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Tất cả ưu tiên</option>
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

                    {/* ========== BULK ACTIONS ========== */}
                    {selectedItems.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 flex items-center justify-between">
                            <p className="text-sm font-bold text-gray-900">
                                Đã chọn <span className="text-blue-600">{selectedItems.length}</span> phân quyền
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleBulkAccept}
                                    disabled={isProcessingBulk}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Chấp nhận {selectedItems.length}
                                </button>
                                <button
                                    onClick={handleBulkReject}
                                    disabled={isProcessingBulk}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Từ chối {selectedItems.length}
                                </button>
                                <button
                                    onClick={() => setSelectedItems([])}
                                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                                >
                                    Hủy chọn
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ========== TABLE ========== */}
                    <div className="bg-white rounded-xl shadow-md border-t-4 border-blue-400 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-3">
                                <BookOpen className="w-12 h-12 text-gray-300" />
                                <p className="text-gray-500 font-medium">Không có phân quyền đánh giá nào</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                        <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.length === assignments.length && assignments.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="rounded-md w-4 h-4 cursor-pointer"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-200">STT</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Tiêu đề báo cáo</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Loại</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Tiêu chuẩn</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Người giao</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Hạn chót</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Ưu tiên</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase border-r border-gray-200">Trạng thái</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Thao tác</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {assignments.map((assignment, index) => (
                                            <tr key={assignment._id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(assignment._id)}
                                                        onChange={(e) => handleSelectItem(assignment._id, e)}
                                                        className="rounded-md w-4 h-4 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200 font-bold text-gray-900">
                                                    {((pagination?.current - 1) * filters.limit) + index + 1}
                                                </td>
                                                <td className="px-4 py-3 border-r border-gray-200 text-sm">
                                                    <div>
                                                        <p className="font-bold text-blue-700">{assignment.reportId?.title || 'N/A'}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{assignment.reportId?.code || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200 text-xs font-medium text-gray-700">
                                                    {assignment.reportId?.type || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200 text-xs font-medium text-gray-700">
                                                    N/A
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200 text-xs font-medium text-gray-700">
                                                    {assignment.assignedBy?.fullName || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <p className="text-xs font-medium text-gray-900">{formatDate(assignment.deadline)}</p>
                                                        <p className={`text-xs font-semibold ${getDeadlineStatus(assignment.deadline).class}`}>
                                                            {getDeadlineStatus(assignment.deadline).text}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(assignment.priority)}`}>
                                                            {getPriorityLabel(assignment.priority)}
                                                        </span>
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(assignment.status)}`}>
                                                            {getStatusLabel(assignment.status)}
                                                        </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                                        {/* XEM CHI TIẾT */}
                                                        <ActionButton
                                                            icon={Eye}
                                                            variant="view"
                                                            size="sm"
                                                            onClick={() => handleViewDetail(assignment)}
                                                            title="Xem chi tiết"
                                                        />

                                                        {/* CHẤP NHẬN - Chỉ hiển thị khi pending */}
                                                        {assignment.status === 'pending' && (
                                                            <ActionButton
                                                                icon={Check}
                                                                variant="success"
                                                                size="sm"
                                                                onClick={() => handleAccept(assignment._id)}
                                                                title="Chấp nhận phân quyền"
                                                            />
                                                        )}

                                                        {/* TỪ CHỐI - Chỉ hiển thị khi pending */}
                                                        {assignment.status === 'pending' && (
                                                            <ActionButton
                                                                icon={XCircle}
                                                                variant="delete"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setRejectingIds([assignment._id])
                                                                    setShowRejectModal(true)
                                                                }}
                                                                title="Từ chối phân quyền"
                                                            />
                                                        )}

                                                        {/* BẮT ĐẦU ĐÁNH GIÁ - Chỉ hiển thị khi accepted, in_progress, overdue */}
                                                        {['accepted', 'in_progress', 'overdue'].includes(assignment.status) && (
                                                            <ActionButton
                                                                icon={Play}
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => handleStartEvaluation(assignment)}
                                                                title={assignment.evaluationId ? 'Tiếp tục đánh giá' : 'Bắt đầu đánh giá'}
                                                            />
                                                        )}

                                                        {/* XÓA - Hiển thị với tất cả trạng thái */}
                                                        <ActionButton
                                                            icon={Trash2}
                                                            variant="delete"
                                                            size="sm"
                                                            onClick={() => handleDelete(assignment._id)}
                                                            title="Xóa phân quyền"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* ========== PAGINATION ========== */}
                                {pagination && pagination.pages > 1 && (
                                    <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-t-2 border-blue-200">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-700">
                                                Hiển thị <strong className="text-blue-600">{((pagination.current - 1) * filters.limit) + 1}</strong> đến{' '}
                                                <strong className="text-blue-600">{Math.min(pagination.current * filters.limit, pagination.total)}</strong> trong tổng số{' '}
                                                <strong className="text-blue-600">{pagination.total}</strong> kết quả
                                            </p>
                                            <div className="flex items-center gap-1">
                                                {/* Nút Trước */}
                                                <button
                                                    onClick={() => handlePageChange(pagination.current - 1)}
                                                    disabled={!pagination.hasPrev}
                                                    className="px-3 py-2 text-sm border-2 border-blue-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
                                                >
                                                    Trước
                                                </button>

                                                {/* Số trang */}
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
                                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                                                    : 'border-2 border-blue-200 hover:bg-white text-gray-700'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}

                                                {/* Nút Sau */}
                                                <button
                                                    onClick={() => handlePageChange(pagination.current + 1)}
                                                    disabled={!pagination.hasNext}
                                                    className="px-3 py-2 text-sm border-2 border-blue-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
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
                            <h2 className="text-lg font-bold text-red-900">
                                Từ chối phân quyền {rejectingIds.length > 1 ? `(${rejectingIds.length})` : ''}
                            </h2>
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
                                    setRejectingIds([])
                                }}
                                className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={!rejectReason.trim() || isProcessingBulk}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                {isProcessingBulk ? 'Đang xử lý...' : 'Từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}