import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api' // Đảm bảo apiMethods có assignments.getAll
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
    Loader2
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

// Helper function (Giả định nằm trong utils/helpers)
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

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'expert') { // Chỉ chạy cho Expert
            fetchAssignments()
            fetchStatistics()
        }
    }, [user, filters])

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports/reports' },
        { name: 'Phân công đánh giá của tôi', icon: UserCheck }
    ]

    const fetchAssignments = async () => {
        try {
            setLoading(true)

            // Expert chỉ xem assignments của mình. Backend Assignments API đã có filter
            const response = await apiMethods.assignments.getAll({
                ...filters,
                expertId: user.id // Gửi ID của mình
            })

            const data = response.data?.data || response.data;

            setAssignments(data?.assignments || [])
            setPagination(data?.pagination)

        } catch (error) {
            console.error('Error fetching assignments:', error)
            toast.error(error.response?.data?.message || 'Lỗi tải danh sách phân công')
        } finally {
            setLoading(false)
        }
    }

    const fetchStatistics = async () => {
        try {
            // Lấy thống kê workload của Expert hiện tại
            const response = await apiMethods.assignments.getWorkload(user.id)
            setStatistics(response.data?.data)
        } catch (error) {
            console.error('Error fetching statistics:', error)
        }
    }

    const handleStartEvaluation = (assignment) => {
        // Chỉ cho phép nếu đã 'accepted' hoặc 'in_progress'
        if (!['accepted', 'in_progress', 'overdue'].includes(assignment.status)) {
            toast.error('Phân công chưa được chấp nhận hoặc đã hoàn thành/hủy.')
            return;
        }

        const evaluationId = assignment.evaluationId;

        if (evaluationId) {
            router.push(`/reports/evaluations/${evaluationId}`); // Chỉnh sửa Evaluation
        } else {
            // Expert tạo Evaluation mới, cần AssignmentId
            router.push(`/reports/evaluations/new?assignmentId=${assignment._id}`);
        }
    }

    const handleAccept = async (assignmentId) => {
        if (!confirm('Bạn có chắc chắn muốn chấp nhận phân công này?')) return;

        try {
            await apiMethods.assignments.accept(assignmentId);
            toast.success('Đã chấp nhận phân công');
            fetchAssignments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi chấp nhận phân công');
        }
    }

    const handleReject = async (assignmentId) => {
        const responseNote = prompt('Vui lòng nhập lý do từ chối (bắt buộc):');
        if (!responseNote || responseNote.trim() === '') {
            toast.error('Lý do từ chối là bắt buộc.');
            return;
        }

        try {
            await apiMethods.assignments.reject(assignmentId, responseNote);
            toast.success('Đã từ chối và hủy phân công');
            fetchAssignments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi từ chối phân công');
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setFilters({ ...filters, page: 1 })
    }

    // ... (getTypeColor)

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header/Stats */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <UserCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Phân công đánh giá của tôi</h1>
                            <p className="text-indigo-100">
                                Quản lý các nhiệm vụ đánh giá được giao
                            </p>
                        </div>
                    </div>
                    {statistics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-indigo-100 text-sm mb-1">Tổng phân công</p>
                                <p className="text-3xl font-bold">{statistics.total}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-indigo-100 text-sm mb-1">Chờ phản hồi</p>
                                <p className="text-3xl font-bold">{statistics.pending}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-indigo-100 text-sm mb-1">Đang tiến hành</p>
                                <p className="text-3xl font-bold">{statistics.inProgress + statistics.accepted}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-indigo-100 text-sm mb-1">Quá hạn</p>
                                <p className="text-3xl font-bold">{statistics.overdue}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo mã báo cáo..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
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
                            <option value="cancelled">Đã hủy</option>
                        </select>

                        {/* Priority Filter */}
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
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>

                {/* Assignments List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">Không có phân công nào được giao</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Báo cáo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người phân công
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
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {assignments.map((assignment) => (
                                    <tr key={assignment._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">
                                                    {assignment.reportId?.title || 'Báo cáo không xác định'}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {assignment.reportId?.code}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {assignment.assignedBy?.fullName || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {formatDate(assignment.deadline)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                assignment.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {assignment.priorityText}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(assignment.status)}`}>
                                                {assignment.statusText}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">

                                                {/* Actions cho trạng thái PENDING */}
                                                {assignment.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAccept(assignment._id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Chấp nhận phân công"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(assignment._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Từ chối phân công"
                                                        >
                                                            <AlertCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}

                                                {/* Actions cho trạng thái ACCEPTED/IN_PROGRESS/OVERDUE */}
                                                {['accepted', 'in_progress', 'overdue'].includes(assignment.status) && (
                                                    <button
                                                        onClick={() => handleStartEvaluation(assignment)}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title={assignment.evaluationId ? "Tiếp tục đánh giá" : "Bắt đầu đánh giá"}
                                                    >
                                                        <BookOpen className="h-4 w-4" />
                                                    </button>
                                                )}

                                                {/* Nút Xem báo cáo */}
                                                <button
                                                    onClick={() => router.push(`/reports/${assignment.reportId._id}`)}
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
                    )}

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            {/* ... Pagination control (có thể tái sử dụng từ code gốc) */}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}