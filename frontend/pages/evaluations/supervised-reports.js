import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import api, { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import { ActionButton } from '../../components/ActionButtons' // ✅ Import ActionButton
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
    AlertCircle,
    Users,
    Calendar,
    Award,
    Settings,
    Send,
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function SupervisedEvaluations() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    // Giả định vai trò Manager/Supervisor/Admin được phép truy cập
    const allowedRoles = ['admin', 'manager', 'supervisor']

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Giám sát đánh giá' }
    ]

    const [evaluations, setEvaluations] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
    })

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        rating: '',
        page: 1,
        limit: 10,
        sortBy: 'submittedAt',
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
        if (user && allowedRoles.includes(user.role)) {
            fetchEvaluations()
        }
    }, [filters, user])

    const fetchEvaluations = async () => {
        try {
            setLoading(true)
            const params = {
                page: filters.page,
                limit: filters.limit,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                forSupervisionView: true // ✅ Flag báo hiệu backend lọc cho Manager (status != draft)
            }

            if (filters.search) params.search = filters.search
            if (filters.status) params.status = filters.status
            if (filters.rating) params.rating = filters.rating

            const response = await apiMethods.evaluations.getAll(params)
            const data = response.data?.data || response.data

            setEvaluations(data?.evaluations || [])
            setPagination(data?.pagination || {
                current: 1,
                pages: 1,
                total: 0,
                hasNext: false,
                hasPrev: false
            })
        } catch (error) {
            console.error('Fetch supervised evaluations error:', error)
            toast.error('Lỗi khi tải danh sách đánh giá giám sát')
            setEvaluations([])
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
            rating: '',
            page: 1,
            limit: 10,
            sortBy: 'submittedAt',
            sortOrder: 'desc'
        })
    }

    // --- Styles/Labels (giữ nguyên) ---
    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            submitted: 'bg-blue-100 text-blue-800 border-blue-200',
            supervised: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            final: 'bg-green-100 text-green-800 border-green-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            submitted: 'Đã nộp',
            supervised: 'Đã giám sát',
            final: 'Hoàn tất'
        }
        return labels[status] || status
    }

    const getRatingColor = (rating) => {
        const colors = {
            excellent: 'text-indigo-700 bg-indigo-100 border-indigo-300',
            good: 'text-blue-700 bg-blue-100 border-blue-300',
            satisfactory: 'text-yellow-700 bg-yellow-100 border-yellow-300',
            needs_improvement: 'text-orange-700 bg-orange-100 border-orange-300',
            poor: 'text-red-700 bg-red-100 border-red-300'
        }
        return colors[rating] || 'text-gray-700 bg-gray-100 border-gray-300'
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

    // Tính toán số liệu thống kê đơn giản (chỉ trên dữ liệu trang hiện tại)
    const stats = {
        total: pagination.total,
        // ✅ Bỏ trạng thái 'Cần giám sát' vì nó trùng với 'Đã nộp'
        submitted: evaluations.filter(e => e.status === 'submitted').length,
        supervised: evaluations.filter(e => e.status === 'supervised').length,
        final: evaluations.filter(e => e.status === 'final').length,
    }
    // --- End Styles/Labels ---

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

    if (!user || !allowedRoles.includes(user.role)) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <h3 className="text-red-800 font-bold">Lỗi truy cập</h3>
                    <p className="text-red-600">Bạn không có quyền xem trang giám sát đánh giá này.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header - Màu Xanh Lam/Indigo */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Giám sát đánh giá báo cáo</h1>
                            <p className="text-blue-100">Tổng quan các đánh giá báo cáo đã được nộp</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                        <p className="text-blue-600 text-sm font-semibold mb-2">Tổng đánh giá (Đã nộp+)</p>
                        <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border-2 border-red-200">
                        <p className="text-red-600 text-sm font-semibold mb-2">Đã nộp (Cần Xử lý)</p>
                        <p className="text-3xl font-bold text-red-900">{stats.submitted}</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border-2 border-indigo-200">
                        <p className="text-indigo-600 text-sm font-semibold mb-2">Đã giám sát</p>
                        <p className="text-3xl font-bold text-indigo-900">{stats.supervised}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                        <p className="text-green-600 text-sm font-semibold mb-2">Hoàn tất</p>
                        <p className="text-3xl font-bold text-green-900">{stats.final}</p>
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
                                    placeholder="Tìm kiếm theo mã báo cáo, tên chuyên gia, tiêu đề..."
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
                                        {[filters.status, filters.rating].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={fetchEvaluations}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Trạng thái</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Tất cả trạng thái (trừ Bản nháp)</option>
                                        <option value="submitted">Đã nộp (Cần Giám sát)</option>
                                        <option value="supervised">Đã giám sát</option>
                                        <option value="final">Hoàn tất</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Xếp loại</label>
                                    <select
                                        value={filters.rating}
                                        onChange={(e) => handleFilterChange('rating', e.target.value)}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Tất cả xếp loại</option>
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h2 className="text-lg font-bold text-gray-900">
                            Danh sách đánh giá
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
                    ) : evaluations.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-10 w-10 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có đánh giá nào được nộp'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {hasActiveFilters
                                    ? 'Thử thay đổi bộ lọc'
                                    : 'Chưa có chuyên gia nào nộp đánh giá. Đánh giá bản nháp không được hiển thị.'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <tr>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-12">
                                            TT
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                            Báo cáo & Chuyên gia
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                            Xếp loại
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                            Ngày nộp
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-blue-200">
                                            Thao tác
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                    {evaluations.map((evaluation, index) => {
                                        const rowIndex = ((pagination.current - 1) * filters.limit) + index + 1

                                        return (
                                            <tr key={evaluation._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                                <td className="px-6 py-4 text-center border-r border-gray-200 font-semibold text-gray-700">
                                                    {rowIndex}
                                                </td>
                                                <td className="px-6 py-4 border-r border-gray-200">
                                                    <button
                                                        onClick={() => toggleExpandRow(evaluation._id)}
                                                        className="flex items-start space-x-3 hover:text-blue-600 transition-colors w-full"
                                                    >
                                                        {expandedRows[evaluation._id] ? (
                                                            <ChevronDown className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <div className="flex-1 min-w-0 text-left">
                                                            <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                                                {evaluation.reportId?.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 font-mono mb-1">
                                                                Mã: {evaluation.reportId?.code}
                                                            </p>
                                                            <p className="text-xs font-medium text-blue-700 flex items-center">
                                                                <Users className='h-3 w-3 mr-1' />
                                                                {evaluation.evaluatorId?.fullName}
                                                            </p>
                                                        </div>
                                                    </button>
                                                    {expandedRows[evaluation._id] && (
                                                        <div className="mt-3 ml-8 space-y-2 text-xs text-gray-600">
                                                            {evaluation.overallComment && (
                                                                <div>
                                                                    <p className="font-semibold text-gray-700">Nhận xét:</p>
                                                                    <p className="line-clamp-3 italic">{evaluation.overallComment}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center border-r border-gray-200">
                                                    {evaluation.rating ? (
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getRatingColor(evaluation.rating)}`}>
                                                            <Award className='h-3 w-3 mr-1'/>
                                                            {getRatingLabel(evaluation.rating)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500 italic text-xs">Chưa xếp loại</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center border-r border-gray-200">
                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(evaluation.status)}`}>
                                                        {getStatusLabel(evaluation.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center border-r border-gray-200">
                                                    <div className="flex items-center justify-center space-x-1 text-xs font-semibold text-gray-600">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(evaluation.submittedAt)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                                        {/* ✅ Sử dụng ActionButton */}
                                                        <ActionButton
                                                            icon={Eye}
                                                            onClick={() => router.push(`/evaluations/${evaluation._id}`)}
                                                            title="Xem chi tiết"
                                                            size="sm"
                                                            variant="view"
                                                        />

                                                        {evaluation.status === 'submitted' && (
                                                            <ActionButton
                                                                icon={Settings}
                                                                onClick={() => router.push(`/evaluations/${evaluation._id}/supervise`)}
                                                                title="Thực hiện giám sát"
                                                                size="sm"
                                                                variant="warning"
                                                            />
                                                        )}

                                                        {evaluation.status === 'supervised' && user.role === 'admin' && (
                                                            <ActionButton
                                                                icon={CheckCircle}
                                                                onClick={() => router.push(`/evaluations/${evaluation._id}/finalize`)}
                                                                title="Hoàn tất đánh giá"
                                                                size="sm"
                                                                variant="success"
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-t-2 border-blue-200">
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
                                            {[...Array(pagination.pages)].map((_, i) => {
                                                const pageNum = i + 1;
                                                // Logic rút gọn hiển thị pagination
                                                if (pagination.pages > 7) {
                                                    if (pageNum < pagination.current - 2 && pageNum > 1 && pageNum < pagination.pages) return null;
                                                    if (pageNum > pagination.current + 2 && pageNum < pagination.pages) return null;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-4 py-2 text-sm rounded-xl transition-all font-semibold ${
                                                            pagination.current === pageNum
                                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
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