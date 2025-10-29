import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/common/Layout'
import { apiMethods } from '../../../services/api'
import toast from 'react-hot-toast'
import {
    Star,
    Search,
    Filter,
    Eye,
    Edit,
    Send,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    RefreshCw,
    Loader2,
    X,
    TrendingUp,
    TrendingDown
} from 'lucide-react'
import { formatDate } from '../../../utils/helpers'

export default function EvaluationsPage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

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
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    })

    const [showFilters, setShowFilters] = useState(false)
    const [stats, setStats] = useState(null)

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/' },
        { name: 'Quản lý báo cáo', href: '/reports' },
        { name: 'Đánh giá báo cáo' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchEvaluations()
            fetchStats()
        }
    }, [filters.page, filters.status, filters.rating, user])

    const fetchEvaluations = async () => {
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
            const response = await apiMethods.evaluations.getSystemStats()
            setStats(response.data?.data)
        } catch (error) {
            console.error('Fetch stats error:', error)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        fetchEvaluations()
    }

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }))
    }

    const handleViewDetail = (id) => {
        router.push(`/reports/evaluations/${id}`)
    }

    const handleEdit = (id) => {
        router.push(`/reports/evaluations/${id}/edit`)
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            rating: '',
            page: 1,
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        })
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

    const getStatusIcon = (status) => {
        const icons = {
            draft: Clock,
            submitted: Send,
            reviewed: AlertCircle,
            final: CheckCircle
        }
        const Icon = icons[status] || Clock
        return <Icon className="h-4 w-4" />
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
            excellent: 'bg-green-100 text-green-800 border-green-200',
            good: 'bg-blue-100 text-blue-800 border-blue-200',
            satisfactory: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            needs_improvement: 'bg-orange-100 text-orange-800 border-orange-200',
            poor: 'bg-red-100 text-red-800 border-red-200'
        }
        return colors[rating] || 'bg-gray-100 text-gray-800 border-gray-200'
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

    const hasActiveFilters = filters.search || filters.status || filters.rating

    if (isLoading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Star className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Đánh giá báo cáo</h1>
                                <p className="text-purple-100">
                                    Quản lý và theo dõi các đánh giá
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Tổng đánh giá</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Đã nộp</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus?.submitted || 0}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <Send className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Điểm TB</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.averageScore ? stats.averageScore.toFixed(2) : '0.00'}
                                    </p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-xl">
                                    <Star className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Hoàn tất</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.byStatus?.final || 0}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <CheckCircle className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
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
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                                        onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value, page: 1 }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                        </div>
                    ) : evaluations.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có đánh giá nào'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {hasActiveFilters
                                    ? 'Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác'
                                    : 'Các đánh giá sẽ xuất hiện ở đây'
                                }
                            </p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300">
                                            STT
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300">
                                            Báo cáo
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300">
                                            Người đánh giá
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300">
                                            Điểm TB
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300">
                                            Phân loại
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300">
                                            Trạng thái
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300">
                                            Ngày nộp
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-300">
                                            Thao tác
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                    {evaluations.map((evaluation, index) => (
                                        <tr key={evaluation._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                            <td className="px-4 py-3 text-center border-r border-gray-200">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {(pagination.current - 1) * filters.limit + index + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-r border-gray-200">
                                                <div className="max-w-xs">
                                                    <p className="text-sm font-medium text-gray-900 truncate" title={evaluation.reportId?.title}>
                                                        {evaluation.reportId?.title || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{evaluation.reportId?.code}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center border-r border-gray-200 text-sm">
                                                {evaluation.evaluatorId?.fullName || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-center border-r border-gray-200">
                                                <div className="flex items-center justify-center space-x-1">
                                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {evaluation.averageScore?.toFixed(2) || '0.00'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">/ 10</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center border-r border-gray-200">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRatingColor(evaluation.rating)}`}>
                                                    {getRatingLabel(evaluation.rating)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center border-r border-gray-200">
                                                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(evaluation.status)}`}>
                                                    {getStatusIcon(evaluation.status)}
                                                    <span>{getStatusLabel(evaluation.status)}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center border-r border-gray-200 text-xs text-gray-500">
                                                {evaluation.submittedAt ? formatDate(evaluation.submittedAt) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleViewDetail(evaluation._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {evaluation.status === 'draft' && evaluation.evaluatorId?._id === user.id && (
                                                        <button
                                                            onClick={() => handleEdit(evaluation._id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
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
                                                onClick={() => handlePageChange(pagination.current - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="px-4 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                            >
                                                Trước
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
                                                        className={`px-4 py-2 text-sm rounded-xl transition-all font-medium ${
                                                            pagination.current === pageNum
                                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                                                : 'border-2 border-gray-200 hover:bg-white'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => handlePageChange(pagination.current + 1)}
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