import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import Layout from '../../components/common/Layout'
import {
    Search,
    Filter,
    Eye,
    CheckCircle,
    Star,
    RefreshCw,
    BarChart3,
    TrendingUp,
    Award,
    Loader2
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function EvaluationsManagement() {
    const router = useRouter()

    const [evaluations, setEvaluations] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0
    })

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        rating: '',
        page: 1,
        limit: 20
    })

    const [showFilters, setShowFilters] = useState(false)
    const [stats, setStats] = useState({})

    const [columnWidths, setColumnWidths] = useState({
        report: 250,
        evaluator: 180,
        score: 100,
        rating: 150,
        status: 150,
        date: 120,
        actions: 120
    })
    const [resizing, setResizing] = useState(null)
    const [expandedRows, setExpandedRows] = useState({})

    useEffect(() => {
        fetchEvaluations()
        fetchStats()
    }, [filters.page, filters.status, filters.rating])

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

    const fetchEvaluations = async () => {
        try {
            setLoading(true)

            const params = {
                page: filters.page,
                limit: filters.limit
            }

            if (filters.search) params.search = filters.search
            if (filters.status) params.status = filters.status
            if (filters.rating) params.rating = filters.rating

            const response = await apiMethods.evaluations.getAll(params)
            const data = response.data?.data || response.data

            setEvaluations(data?.evaluations || [])
            setPagination(data?.pagination || { current: 1, pages: 1, total: 0 })
        } catch (error) {
            console.error('Fetch evaluations error:', error)
            toast.error('Lỗi khi tải danh sách đánh giá')
            setEvaluations([])
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await apiMethods.evaluations.getStats()
            setStats(response.data?.data || {})
        } catch (error) {
            console.error('Fetch stats error:', error)
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
        fetchEvaluations()
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
            draft: 'bg-gray-100 text-gray-800 border-gray-200',
            submitted: 'bg-blue-100 text-blue-800 border-blue-200',
            reviewed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            final: 'bg-green-100 text-green-800 border-green-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            submitted: 'Đã nộp',
            reviewed: 'Đã xem xét',
            final: 'Hoàn tất'
        }
        return labels[status] || status
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

    const getRatingLabel = (rating) => {
        const labels = {
            excellent: 'Xuất sắc',
            good: 'Tốt',
            satisfactory: 'Đạt yêu cầu',
            needs_improvement: 'Cần cải thiện',
            poor: 'Kém'
        }
        return labels[rating] || rating
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            rating: '',
            page: 1,
            limit: 20
        })
    }

    const hasActiveFilters = filters.search || filters.status || filters.rating

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <Award className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Đánh giá báo cáo</h1>
                            <p className="text-emerald-100">
                                Quản lý và theo dõi các đánh giá báo cáo
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-emerald-100 text-sm mb-1">Tổng số</p>
                            <p className="text-3xl font-bold">{stats.total || 0}</p>
                        </div>
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-emerald-100 text-sm mb-1">Bản nháp</p>
                            <p className="text-3xl font-bold">{stats.byStatus?.draft || 0}</p>
                        </div>
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-emerald-100 text-sm mb-1">Đã nộp</p>
                            <p className="text-3xl font-bold">{stats.byStatus?.submitted || 0}</p>
                        </div>
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-emerald-100 text-sm mb-1">Hoàn tất</p>
                            <p className="text-3xl font-bold">{stats.byStatus?.final || 0}</p>
                        </div>
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-emerald-100 text-sm mb-1">Điểm TB</p>
                            <p className="text-3xl font-bold">{stats.averageScore?.toFixed(2) || '0.00'}</p>
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
                                    placeholder="Tìm kiếm đánh giá..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                            </form>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-4 py-3 rounded-xl transition-all font-medium ${
                                    showFilters || hasActiveFilters
                                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Filter className="h-5 w-5 mr-2" />
                                Bộ lọc
                                {hasActiveFilters && (
                                    <span className="ml-2 px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full font-bold">
                                    {[filters.status, filters.rating].filter(Boolean).length}
                                </span>
                                )}
                            </button>
                            <button
                                onClick={fetchEvaluations}
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
                                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                        Xóa tất cả bộ lọc
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="draft">Bản nháp</option>
                                        <option value="submitted">Đã nộp</option>
                                        <option value="reviewed">Đã xem xét</option>
                                        <option value="final">Hoàn tất</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phân loại
                                    </label>
                                    <select
                                        value={filters.rating}
                                        onChange={(e) => handleFilterChange('rating', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Tất cả phân loại</option>
                                        <option value="excellent">Xuất sắc</option>
                                        <option value="good">Tốt</option>
                                        <option value="satisfactory">Đạt yêu cầu</option>
                                        <option value="needs_improvement">Cần cải thiện</option>
                                        <option value="poor">Kém</option>
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
                            Danh sách đánh giá
                            <span className="ml-2 text-sm font-normal text-gray-500">
                            ({pagination.total} kết quả)
                        </span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-16">
                            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                        </div>
                    ) : evaluations.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có đánh giá nào'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {hasActiveFilters
                                    ? 'Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác'
                                    : 'Chưa có đánh giá nào trong hệ thống'
                                }
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg font-medium transition-all"
                                >
                                    Xóa bộ lọc
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
                                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400 group-hover:bg-emerald-300"
                                                onMouseDown={(e) => handleMouseDown(e, 'report')}
                                            />
                                        </th>
                                        <th
                                            className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                            style={{ width: columnWidths.evaluator }}
                                        >
                                            Người đánh giá
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400 group-hover:bg-emerald-300"
                                                onMouseDown={(e) => handleMouseDown(e, 'evaluator')}
                                            />
                                        </th>
                                        <th
                                            className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                            style={{ width: columnWidths.score }}
                                        >
                                            Điểm
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400 group-hover:bg-emerald-300"
                                                onMouseDown={(e) => handleMouseDown(e, 'score')}
                                            />
                                        </th>
                                        <th
                                            className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                            style={{ width: columnWidths.rating }}
                                        >
                                            Phân loại
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400 group-hover:bg-emerald-300"
                                                onMouseDown={(e) => handleMouseDown(e, 'rating')}
                                            />
                                        </th>
                                        <th
                                            className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                            style={{ width: columnWidths.status }}
                                        >
                                            Trạng thái
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400 group-hover:bg-emerald-300"
                                                onMouseDown={(e) => handleMouseDown(e, 'status')}
                                            />
                                        </th>
                                        <th
                                            className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                            style={{ width: columnWidths.date }}
                                        >
                                            Ngày nộp
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400 group-hover:bg-emerald-300"
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
                                    {evaluations.map((evaluation) => (
                                        <tr key={evaluation._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                            <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.report }}>
                                                <div
                                                    className={`cursor-pointer hover:text-emerald-600 ${
                                                        expandedRows[`${evaluation._id}-report`] ? '' : 'truncate'
                                                    }`}
                                                    onClick={() => toggleExpandRow(evaluation._id, 'report')}
                                                    title={evaluation.reportId?.title}
                                                >
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {evaluation.reportId?.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {evaluation.reportId?.code}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 border-r border-gray-200 text-sm" style={{ width: columnWidths.evaluator }}>
                                                {evaluation.evaluatorId?.fullName}
                                            </td>
                                            <td className="px-4 py-3 border-r border-gray-200 text-center" style={{ width: columnWidths.score }}>
                                                <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg">
                                                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                                    <span className="text-sm font-bold text-emerald-900">
                                                    {evaluation.averageScore?.toFixed(2) || '0.00'}
                                                </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.rating }}>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRatingColor(evaluation.rating)}`}>
                                                {getRatingLabel(evaluation.rating)}
                                            </span>
                                            </td>
                                            <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.status }}>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(evaluation.status)}`}>
                                                {getStatusLabel(evaluation.status)}
                                            </span>
                                            </td>
                                            <td className="px-4 py-3 border-r border-gray-200 text-sm text-gray-500" style={{ width: columnWidths.date }}>
                                                {evaluation.submittedAt ? formatDate(evaluation.submittedAt) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right" style={{ width: columnWidths.actions }}>
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => router.push(`/reports/evaluations/${evaluation._id}`)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="Xem chi tiết"
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
        </Layout>
    )
}