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
    Play
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
    const [activeTab, setActiveTab] = useState('assignments')

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
        { name: 'Báo cáo', path: '/reports/reports' },
        { name: 'Phân quyền đánh giá của tôi', icon: UserCheck }
    ]

    const cleanParams = (obj) => {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        );
    };

    const fetchAssignments = async () => {
        try {
            setLoading(true)

            const params = cleanParams({
                ...filters,
                expertId: user.id
            });

            const response = await apiMethods.assignments.getAll(params);
            const data = response.data?.data || response.data;

            setAssignments(data?.assignments || [])
            setPagination(data?.pagination)

        } catch (error) {
            console.error('Error fetching assignments:', error)
            const message = error.response?.data?.message || 'Lỗi tải danh sách phân quyền';
            toast.error(message);
        } finally {
            setLoading(false)
        }
    }

    const fetchStatistics = async () => {
        try {
            const statsRes = await apiMethods.assignments.getWorkload(user.id);
            setStatistics(statsRes.data?.data)
        } catch (error) {
            console.error('Error fetching statistics:', error)
        }
    }

    const handleAccept = async (assignmentId) => {
        if (!confirm('Bạn có chắc chắn muốn chấp nhận phân quyền này?')) return;

        try {
            await apiMethods.assignments.accept(assignmentId, {});
            toast.success('Đã chấp nhận phân quyền');
            fetchAssignments();
            fetchStatistics();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi chấp nhận phân quyền');
        }
    }

    const handleReject = async (assignmentId) => {
        const responseNote = prompt('Vui lòng nhập lý do từ chối (bắt buộc):');
        if (!responseNote || responseNote.trim() === '') {
            toast.error('Lý do từ chối là bắt buộc.');
            return;
        }

        try {
            await apiMethods.assignments.reject(assignmentId, { responseNote });
            toast.success('Đã từ chối phân quyền');
            fetchAssignments();
            fetchStatistics();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi từ chối phân quyền');
        }
    }

    const handleStartEvaluation = (assignment) => {
        if (!['accepted', 'in_progress', 'overdue'].includes(assignment.status)) {
            toast.error('Phân quyền chưa được chấp nhận.')
            return;
        }

        const evaluationId = assignment.evaluationId?._id;

        if (evaluationId) {
            router.push(`/reports/evaluations/${evaluationId}`);
        } else {
            router.push(`/reports/evaluations/new?assignmentId=${assignment._id}`);
        }
    }

    const handleDownloadReport = async (reportId, reportCode) => {
        try {
            const response = await apiMethods.reports.download(reportId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${reportCode}.html`);
            document.body.appendChild(link);
            link.click();
            link.parentChild.removeChild(link);
            toast.success('Tải báo cáo thành công');
        } catch (error) {
            toast.error('Lỗi khi tải báo cáo');
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setFilters({ ...filters, page: 1 })
    }

    const handlePageChange = (page) => {
        setFilters({ ...filters, page })
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
        <Layout
            title="Phân quyền đánh giá"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Phân quyền đánh giá của tôi</h1>
                            <p className="text-indigo-100">
                                Quản lý các báo cáo được giao để đánh giá
                            </p>
                        </div>
                    </div>

                    {/* Statistics */}
                    {statistics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                <p className="text-3xl font-bold">{statistics.inProgress + statistics.accepted}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-indigo-100 text-sm mb-1">Quá hạn</p>
                                <p className="text-3xl font-bold text-red-200">{statistics.overdue}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filter */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
                            <p className="text-gray-500">Không có phân quyền nào được giao</p>
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
                                    <tr key={assignment._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 max-w-xs truncate">
                                                        {assignment.reportId?.title || 'N/A'}
                                                    </span>
                                                <span className="text-sm text-gray-500">
                                                        {assignment.reportId?.code}
                                                    </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="flex items-center space-x-1">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span>{assignment.assignedBy?.fullName || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {formatDate(assignment.deadline)}
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
                                                        <span className="font-semibold text-gray-900">
                                                            {assignment.evaluationId.averageScore}/10
                                                        </span>
                                                    <span className="text-xs text-gray-500">
                                                            {assignment.evaluationId.status}
                                                        </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {/* Accept/Reject */}
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
                                                            onClick={() => handleReject(assignment._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Từ chối"
                                                        >
                                                            <AlertCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}

                                                {/* Start Evaluation */}
                                                {['accepted', 'in_progress', 'overdue'].includes(assignment.status) && (
                                                    <button
                                                        onClick={() => handleStartEvaluation(assignment)}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title={assignment.evaluationId ? "Tiếp tục đánh giá" : "Bắt đầu đánh giá"}
                                                    >
                                                        {assignment.evaluationId ? (
                                                            <BookOpen className="h-4 w-4" />
                                                        ) : (
                                                            <Play className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                )}

                                                {/* View Report */}
                                                <button
                                                    onClick={() => router.push(`/reports/${assignment.reportId._id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Xem báo cáo"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                {/* Download Report */}
                                                <button
                                                    onClick={() => handleDownloadReport(assignment.reportId._id, assignment.reportId.code)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Tải báo cáo"
                                                >
                                                    <Download className="h-4 w-4" />
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
                </div>
            </div>
        </Layout>
    )
}