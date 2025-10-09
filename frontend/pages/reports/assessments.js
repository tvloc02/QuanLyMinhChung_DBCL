import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
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
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    User,
    FileText,
    Loader2
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function AssignmentsManagement() {
    const router = useRouter()

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
        limit: 20
    })

    const [experts, setExperts] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    const [stats, setStats] = useState({})

    const [columnWidths, setColumnWidths] = useState({
        checkbox: 60,
        report: 250,
        expert: 180,
        deadline: 120,
        priority: 120,
        status: 150,
        date: 120,
        actions: 180
    })
    const [resizing, setResizing] = useState(null)
    const [expandedRows, setExpandedRows] = useState({})

    useEffect(() => {
        fetchAssignments()
        fetchStats()
        fetchExperts()
    }, [filters.page, filters.status, filters.priority, filters.expertId])

    useEffect(() => {
        if (!resizing) return

        const handleMouseMove = (e) => {
            const diff = e.clientX - resizing.startX
            const newWidth = Math.max(60, resizing.startWidth + diff)
            setColumnWidths(prev => ({
                ...prev,
                [resizing.column]: newWidth
            }))
        }

        const handleMouseUp = () => {
            setResizing(null)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [resizing])

    const fetchAssignments = async () => {
        try {
            setLoading(true)

            const params = {
                page: filters.page,
                limit: filters.limit
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
            toast.error('Lỗi khi tải danh sách phân công')
            setAssignments([])
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await apiMethods.assignments.getStats()
            setStats(response.data?.data || {})
        } catch (error) {
            console.error('Fetch stats error:', error)
        }
    }

    const fetchExperts = async () => {
        try {
            const response = await apiMethods.users.getAll({ role: 'expert' })
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

    const handleSearch = (e) => {
        e.preventDefault()
        fetchAssignments()
    }

    const handleAccept = async (id) => {
        try {
            await apiMethods.assignments.accept(id, { responseNote: 'Chấp nhận phân công' })
            toast.success('Đã chấp nhận phân công')
            fetchAssignments()
            fetchStats()
        } catch (error) {
            console.error('Accept error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi chấp nhận')
        }
    }

    const handleReject = async (id) => {
        const reason = prompt('Lý do từ chối:')
        if (!reason) return

        try {
            await apiMethods.assignments.reject(id, { responseNote: reason })
            toast.success('Đã từ chối phân công')
            fetchAssignments()
            fetchStats()
        } catch (error) {
            console.error('Reject error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi từ chối')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa phân công này?')) return

        try {
            await apiMethods.assignments.delete(id)
            toast.success('Xóa phân công thành công')
            fetchAssignments()
            fetchStats()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xóa')
        }
    }

    const handleMouseDown = (e, column) => {
        e.preventDefault()
        setResizing({ column, startX: e.clientX, startWidth: columnWidths[column] })
    }

    const toggleExpandRow = (id, field) => {
        setExpandedRows(prev => ({
            ...prev,
            [`${id}-${field}`]: !prev[`${id}-${field}`]
        }))
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            accepted: 'bg-blue-100 text-blue-800 border-blue-200',
            in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
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
            low: 'bg-gray-100 text-gray-800',
            normal: 'bg-blue-100 text-blue-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800'
        }
        return colors[priority] || 'bg-gray-100 text-gray-800'
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

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            priority: '',
            expertId: '',
            page: 1,
            limit: 20
        })
    }

    const hasActiveFilters = filters.search || filters.status || filters.priority || filters.expertId

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Phân công đánh giá</h1>
                            <p className="text-purple-100">
                                Quản lý phân công đánh giá báo cáo cho chuyên gia
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/reports/assignments/create')}
                        className="inline-flex items-center px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all font-medium shadow-lg"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Tạo phân công mới
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-purple-100 text-sm mb-1">Tổng số</p>
                        <p className="text-3xl font-bold">{stats.total || 0}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-purple-100 text-sm mb-1">Chờ phản hồi</p>
                        <p className="text-3xl font-bold">{stats.pending || 0}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-purple-100 text-sm mb-1">Đang thực hiện</p>
                        <p className="text-3xl font-bold">{stats.inProgress || 0}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                        <p className="text-purple-100 text-sm mb-1">Hoàn thành</p>
                        <p className="text-3xl font-bold">{stats.completed || 0}</p>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo báo cáo..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                        </form>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center px-4 py-3 rounded-xl transition-all font-medium ${
                                showFilters || hasActiveFilters
                                    ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Filter className="h-5 w-5 mr-2" />
                            Bộ lọc
                            {hasActiveFilters && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-bold">
                                    {[filters.status, filters.priority, filters.expertId].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={fetchAssignments}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                        >
                            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">Lọc nâng cao</h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mức độ ưu tiên
                                </label>
                                <select
                                    value={filters.priority}
                                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Tất cả mức độ</option>
                                    <option value="low">Thấp</option>
                                    <option value="normal">Bình thường</option>
                                    <option value="high">Cao</option>
                                    <option value="urgent">Khẩn cấp</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chuyên gia
                                </label>
                                <select
                                    value={filters.expertId}
                                    onChange={(e) => handleFilterChange('expertId', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Danh sách phân công
                        <span className="ml-2 text-sm font-normal text-gray-500">
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
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có phân công nào'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {hasActiveFilters
                                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác'
                                : 'Bắt đầu bằng cách tạo phân công đầu tiên'
                            }
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all"
                            >
                                Xóa bộ lọc
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/reports/assignments/create')}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Tạo phân công mới
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.report }}
                                    >
                                        Báo cáo
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 group-hover:bg-purple-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'report')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.expert }}
                                    >
                                        Chuyên gia
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 group-hover:bg-purple-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'expert')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.deadline }}
                                    >
                                        Hạn chót
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 group-hover:bg-purple-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'deadline')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.priority }}
                                    >
                                        Ưu tiên
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 group-hover:bg-purple-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'priority')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.status }}
                                    >
                                        Trạng thái
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 group-hover:bg-purple-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'status')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.date }}
                                    >
                                        Ngày tạo
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-400 group-hover:bg-purple-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'date')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-300"
                                        style={{ width: columnWidths.actions }}
                                    >
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white">
                                {assignments.map((assignment) => (
                                    <tr key={assignment._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                        <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.report }}>
                                            <div
                                                className={`cursor-pointer hover:text-purple-600 ${
                                                    expandedRows[`${assignment._id}-report`] ? '' : 'truncate'
                                                }`}
                                                onClick={() => toggleExpandRow(assignment._id, 'report')}
                                                title={assignment.reportId?.title}
                                            >
                                                <p className="text-sm font-medium text-gray-900">
                                                    {assignment.reportId?.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {assignment.reportId?.code}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-sm" style={{ width: columnWidths.expert }}>
                                            {assignment.expertId?.fullName}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-sm" style={{ width: columnWidths.deadline }}>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                {formatDate(assignment.deadline)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.priority }}>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.priority)}`}>
                                                {getPriorityLabel(assignment.priority)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.status }}>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                                                {getStatusLabel(assignment.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-sm text-gray-500" style={{ width: columnWidths.date }}>
                                            {formatDate(assignment.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right" style={{ width: columnWidths.actions }}>
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => router.push(`/reports/assignments/${assignment._id}`)}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {assignment.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAccept(assignment._id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                            title="Chấp nhận"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(assignment._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Từ chối"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(assignment._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {pagination.pages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Hiển thị <strong>{((pagination.current - 1) * filters.limit) + 1}</strong> đến{' '}
                                        <strong>{Math.min(pagination.current * filters.limit, pagination.total)}</strong> trong tổng số{' '}
                                        <strong>{pagination.total}</strong> kết quả
                                    </p>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, page: pagination.current - 1 }))}
                                            disabled={!pagination.hasPrev}
                                            className="px-4 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                        >
                                            Trước
                                        </button>
                                        <button
                                            onClick={() => setFilters(prev => ({ ...prev, page: pagination.current + 1 }))}
                                            disabled={!pagination.hasNext}
                                            className="px-4 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
    )
}