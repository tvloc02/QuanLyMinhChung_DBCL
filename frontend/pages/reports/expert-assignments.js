import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import {
    FileText,
    Search,
    Filter,
    UserCheck,
    Eye,
    BookOpen,
    BarChart3,
    Calendar,
    AlertCircle,
    Users,
    Clock,
    CheckCircle,
    Download,
    Play,
    X
} from 'lucide-react'
import { formatDate, formatDatetime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const getStatusColor = (status) => {
    const colors = {
        pending: 'bg-gray-100 text-gray-800 border-gray-200',
        accepted: 'bg-blue-100 text-blue-800 border-blue-200',
        in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        completed: 'bg-green-100 text-green-800 border-green-200',
        overdue: 'bg-red-100 text-red-800 border-red-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

const getPriorityColor = (priority) => {
    const colors = {
        low: 'bg-gray-100 text-gray-800',
        normal: 'bg-blue-100 text-blue-800',
        high: 'bg-orange-100 text-orange-800',
        urgent: 'bg-red-100 text-red-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
}

const getRatingColor = (rating) => {
    const colors = {
        excellent: 'bg-green-100 text-green-800',
        good: 'bg-blue-100 text-blue-800',
        satisfactory: 'bg-yellow-100 text-yellow-800',
        needs_improvement: 'bg-orange-100 text-orange-800',
        poor: 'bg-red-100 text-red-800'
    }
    return colors[rating] || 'bg-gray-100 text-gray-800'
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
        limit: 10,
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
        }
    }

    const handleAccept = async (assignmentId) => {
        try {
            await apiMethods.assignments.accept(assignmentId, { responseNote: 'Tôi chấp nhận phân quyền này' })
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
        if (days < 0) return { class: 'text-red-600', text: 'Quá hạn' }
        if (days === 0) return { class: 'text-red-500', text: 'Hôm nay' }
        if (days <= 3) return { class: 'text-orange-600', text: `${days} ngày nữa` }
        return { class: 'text-green-600', text: `${days} ngày nữa` }
    }

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
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
        <Layout title="Phân quyền đánh giá" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Phân quyền đánh giá</h1>
                            <p className="text-indigo-100">Quản lý các báo cáo được giao để đánh giá</p>
                        </div>
                    </div>

                    {statistics && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-indigo-100 text-sm mb-1">Tổng phân quyền</p>
                                <p className="text-3xl font-bold">{statistics.total}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-indigo-100 text-sm mb-1">Chờ phản hồi</p>
                                <p className="text-3xl font-bold">{statistics.pending}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-indigo-100 text-sm mb-1">Đang đánh giá</p>
                                <p className="text-3xl font-bold">{statistics.accepted + statistics.inProgress}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-indigo-100 text-sm mb-1">Hoàn thành</p>
                                <p className="text-3xl font-bold">{statistics.completed}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-indigo-100 text-sm mb-1">Quá hạn</p>
                                <p className="text-3xl font-bold text-red-200">{statistics.overdue}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo mã/tên báo cáo..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending">Chờ phản hồi</option>
                            <option value="accepted">Đã chấp nhận</option>
                            <option value="in_progress">Đang đánh giá</option>
                            <option value="completed">Đã hoàn thành</option>
                            <option value="overdue">Quá hạn</option>
                        </select>

                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả ưu tiên</option>
                            <option value="low">Thấp</option>
                            <option value="normal">Bình thường</option>
                            <option value="high">Cao</option>
                            <option value="urgent">Khẩn cấp</option>
                        </select>

                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>

                {/* Assignments Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Không có phân quyền nào</p>
                            <p className="text-gray-400 text-sm mt-1">Khi có báo cáo được giao, nó sẽ hiện tại đây</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Báo cáo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Người giao
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hạn chót
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ưu tiên
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Điểm
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {assignments.map((assignment) => (
                                        <tr
                                            key={assignment._id}
                                            className="hover:bg-gray-50 transition-colors"
                                            onClick={() => handleShowDetail(assignment)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 max-w-xs truncate">
                                                            {assignment.reportId?.title}
                                                        </span>
                                                    <span className="text-sm text-gray-500">
                                                            {assignment.reportId?.code}
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <div className="flex items-center space-x-1">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <span>{assignment.assignedBy?.fullName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                        <span className={`text-sm font-medium ${getDeadlineStatus(assignment.deadline).class}`}>
                                                            {getDeadlineStatus(assignment.deadline).text}
                                                        </span>
                                                    <span className="text-xs text-gray-500">
                                                            {formatDate(assignment.deadline)}
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(assignment.priority)}`}>
                                                        {assignment.priorityText}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(assignment.status)}`}>
                                                        {assignment.statusText}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {assignment.evaluationId?.averageScore ? (
                                                    <div className="flex flex-col">
                                                            <span className={`font-semibold text-sm inline-flex px-2 py-1 rounded ${getRatingColor(assignment.evaluationId.rating)}`}>
                                                                {assignment.evaluationId.averageScore}/10
                                                            </span>
                                                        <span className="text-xs text-gray-500 mt-1">
                                                                {getRatingText(assignment.evaluationId.rating)}
                                                            </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">--</span>
                                                )}
                                            </td>
                                            <td
                                                className="px-6 py-4 text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end space-x-2">
                                                    {assignment.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAccept(assignment._id)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Chấp nhận"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setRejectingId(assignment._id)
                                                                    setShowRejectModal(true)
                                                                }}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Từ chối"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {['accepted', 'in_progress', 'overdue'].includes(assignment.status) && (
                                                        <button
                                                            onClick={() => handleStartEvaluation(assignment)}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title={assignment.evaluationId ? 'Tiếp tục đánh giá' : 'Bắt đầu đánh giá'}
                                                        >
                                                            {assignment.evaluationId ? (
                                                                <BookOpen className="h-4 w-4" />
                                                            ) : (
                                                                <Play className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleViewReport(assignment.reportId._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Xem báo cáo"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.pages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Trang {pagination.current} / {pagination.pages} | Tổng {pagination.total} phân quyền
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            disabled={!pagination.hasPrev}
                                            onClick={() => handlePageChange(pagination.current - 1)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                                        >
                                            Trước
                                        </button>
                                        <button
                                            disabled={!pagination.hasNext}
                                            onClick={() => handlePageChange(pagination.current + 1)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                                        >
                                            Tiếp
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">{selectedAssignment.reportId?.title}</h2>
                                <p className="text-indigo-100 text-sm">{selectedAssignment.reportId?.code}</p>
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
                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedAssignment.priority)}`}>
                                        {selectedAssignment.priorityText}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Trạng thái</p>
                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedAssignment.status)}`}>
                                        {selectedAssignment.statusText}
                                    </span>
                                </div>
                            </div>

                            {selectedAssignment.assignmentNote && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Ghi chú phân công</p>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                                        {selectedAssignment.assignmentNote}
                                    </p>
                                </div>
                            )}

                            {selectedAssignment.evaluationId?.averageScore && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-xs text-blue-600 uppercase font-semibold mb-2">Kết quả đánh giá</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {selectedAssignment.evaluationId.averageScore}
                                            </p>
                                            <p className="text-xs text-gray-600">Điểm trung bình</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-medium px-2 py-1 rounded inline-block ${getRatingColor(selectedAssignment.evaluationId.rating)}`}>
                                                {getRatingText(selectedAssignment.evaluationId.rating)}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">Xếp loại</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-medium px-2 py-1 rounded inline-block ${getStatusColor(selectedAssignment.evaluationId.status)}`}>
                                                {selectedAssignment.evaluationId.status}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">Tình trạng</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Đóng
                            </button>
                            {selectedAssignment.status !== 'pending' && (
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false)
                                        handleStartEvaluation(selectedAssignment)
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    {selectedAssignment.evaluationId ? 'Tiếp tục đánh giá' : 'Bắt đầu đánh giá'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-red-50 px-6 py-4 border-b border-red-200">
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            />
                            <p className="text-xs text-gray-500">
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
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={!rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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