import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import {useAuth} from '../../contexts/AuthContext';
import {
    BarChart3,
    Search,
    Filter,
    Eye,
    MessageSquare,
    TrendingUp,
    Star,
    User,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    Download,
    Printer
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

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

const getStatusColor = (status) => {
    const colors = {
        draft: 'bg-gray-100 text-gray-800',
        submitted: 'bg-blue-100 text-blue-800',
        supervised: 'bg-purple-100 text-purple-800',
        final: 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
    const statusMap = {
        draft: 'Bản nháp',
        submitted: 'Đã nộp',
        supervised: 'Đã giám sát',
        final: 'Hoàn tất'
    }
    return statusMap[status] || status
}

const getEvidenceLevel = (level) => {
    const map = {
        insufficient: { color: 'bg-red-100 text-red-800', text: 'Không đủ' },
        adequate: { color: 'bg-yellow-100 text-yellow-800', text: 'Đủ' },
        comprehensive: { color: 'bg-green-100 text-green-800', text: 'Toàn diện' }
    }
    return map[level] || { color: 'bg-gray-100 text-gray-800', text: level }
}

export default function EvaluationsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [evaluations, setEvaluations] = useState([])
    const [pagination, setPagination] = useState(null)
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        search: '',
        status: '',
        rating: ''
    })
    const [statistics, setStatistics] = useState(null)
    const [selectedEval, setSelectedEval] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [supervisorComment, setSupervisorComment] = useState('')
    const [showSuperviseModal, setShowSuperviseModal] = useState(false)
    const [superviseId, setSuperviseId] = useState(null)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && (user.role === 'expert' || user.role === 'manager' || user.role === 'supervisor' || user.role === 'admin')) {
            fetchEvaluations()
            fetchStatistics()
        }
    }, [user, filters])

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Đánh giá', icon: BarChart3 }
    ]

    const cleanParams = (obj) => {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        )
    }

    const fetchEvaluations = async () => {
        try {
            setLoading(true)
            const params = cleanParams({
                ...filters,
                ...(user.role === 'expert' ? { evaluatorId: user.id } : {})
            })

            const response = await apiMethods.evaluations.getAll(params)
            const data = response.data?.data || response.data

            setEvaluations(data?.evaluations || [])
            setPagination(data?.pagination)
        } catch (error) {
            console.error('Error fetching evaluations:', error)
            const message = error.response?.data?.message || 'Lỗi tải danh sách đánh giá'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const fetchStatistics = async () => {
        try {
            let statsRes

            if (user.role === 'expert') {
                statsRes = await apiMethods.evaluations.getStats(`/stats/evaluator/${user.id}`)
            } else if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'manager') {
                statsRes = await apiMethods.evaluations.getSystemStats()
            }

            setStatistics(statsRes?.data?.data)
        } catch (error) {
            console.error('Error fetching statistics:', error)
        }
    }

    const handleShowDetail = (evaluation) => {
        setSelectedEval(evaluation)
        setShowDetailModal(true)
    }

    const handleSubmitEvaluation = async (evaluationId) => {
        if (!window.confirm('Xác nhận nộp đánh giá? Sau khi nộp sẽ không thể chỉnh sửa.')) {
            return
        }

        try {
            await apiMethods.evaluations.submit(evaluationId)
            toast.success('Đánh giá đã được nộp')
            fetchEvaluations()
            fetchStatistics()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi nộp đánh giá')
        }
    }

    const handleSupervise = async () => {
        if (!supervisorComment.trim()) {
            toast.error('Vui lòng nhập hướng dẫn')
            return
        }

        try {
            await apiMethods.evaluations.supervise(superviseId, { comments: supervisorComment })
            toast.success('Đánh giá đã được giám sát')
            setShowSuperviseModal(false)
            setSupervisorComment('')
            setSuperviseId(null)
            fetchEvaluations()
            fetchStatistics()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi giám sát đánh giá')
        }
    }

    const handleFinalize = async (evaluationId) => {
        if (!window.confirm('Xác nhận hoàn tất đánh giá? Hành động này không thể hoàn tác.')) {
            return
        }

        try {
            await apiMethods.evaluations.finalize(evaluationId)
            toast.success('Đánh giá đã được hoàn tất')
            fetchEvaluations()
            fetchStatistics()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi hoàn tất đánh giá')
        }
    }

    const handleEditEvaluation = (evaluationId) => {
             router.push(`/reports/evaluations/${evaluationId}/edit`)
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

    if (!['expert', 'manager', 'supervisor', 'admin'].includes(user.role)) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-red-800 font-semibold">Lỗi truy cập</h3>
                    <p className="text-red-600">Bạn không có quyền truy cập trang này</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Đánh giá báo cáo" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <BarChart3 className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">
                                {user.role === 'expert' ? 'Đánh giá của tôi' : 'Quản lý đánh giá'}
                            </h1>
                            <p className="text-blue-100">
                                {user.role === 'expert'
                                    ? 'Xem và quản lý các đánh giá bạn đã thực hiện'
                                    : user.role === 'manager'
                                        ? 'Xem đánh giá cho báo cáo bạn tạo'
                                        : user.role === 'supervisor'
                                            ? 'Giám sát và hướng dẫn đánh giá'
                                            : 'Quản lý tất cả đánh giá hệ thống'}
                            </p>
                        </div>
                    </div>

                    {statistics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-blue-100 text-sm mb-1">Tổng đánh giá</p>
                                <p className="text-3xl font-bold">{statistics.total || 0}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-blue-100 text-sm mb-1">Bản nháp</p>
                                <p className="text-3xl font-bold">{statistics.draft || 0}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-blue-100 text-sm mb-1">Đã nộp</p>
                                <p className="text-3xl font-bold">{statistics.submitted || 0}</p>
                            </div>
                            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                                <p className="text-blue-100 text-sm mb-1">Hoàn tất</p>
                                <p className="text-3xl font-bold">{statistics.final || 0}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo báo cáo, chuyên gia..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="draft">Bản nháp</option>
                            <option value="submitted">Đã nộp</option>
                            <option value="supervised">Đã giám sát</option>
                            <option value="final">Hoàn tất</option>
                        </select>

                        <select
                            value={filters.rating}
                            onChange={(e) => setFilters({ ...filters, rating: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả xếp loại</option>
                            <option value="excellent">Xuất sắc</option>
                            <option value="good">Tốt</option>
                            <option value="satisfactory">Đạt yêu cầu</option>
                            <option value="needs_improvement">Cần cải thiện</option>
                            <option value="poor">Kém</option>
                        </select>

                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>

                {/* Evaluations List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : evaluations.length === 0 ? (
                        <div className="text-center py-12">
                            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Không có đánh giá nào</p>
                            <p className="text-gray-400 text-sm mt-1">Các đánh giá sẽ xuất hiện ở đây</p>
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
                                        {(user.role === 'supervisor' || user.role === 'admin') && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Đánh giá bởi
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Điểm
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Xếp loại
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày nộp
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {evaluations.map((evaluation) => (
                                        <tr
                                            key={evaluation._id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => handleShowDetail(evaluation)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 max-w-xs truncate">
                                                            {evaluation.reportId?.title}
                                                        </span>
                                                    <span className="text-sm text-gray-500">
                                                            {evaluation.reportId?.code}
                                                        </span>
                                                </div>
                                            </td>
                                            {(user.role === 'supervisor' || user.role === 'admin') && (
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="flex items-center space-x-1">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <span>{evaluation.evaluatorId?.fullName}</span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                        <span className="font-bold text-lg text-gray-900">
                                                            {evaluation.averageScore?.toFixed(1) || '--'}/10
                                                        </span>
                                                    <span className="text-xs text-gray-500">
                                                            {evaluation.totalScore} / {evaluation.maxTotalScore}
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getRatingColor(evaluation.rating)}`}>
                                                        {getRatingText(evaluation.rating)}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(evaluation.status)}`}>
                                                        {getStatusText(evaluation.status)}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {evaluation.submittedAt ? formatDate(evaluation.submittedAt) : '--'}
                                            </td>
                                            <td
                                                className="px-6 py-4 text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleShowDetail(evaluation)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Chi tiết"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>

                                                    {user.role === 'expert' && evaluation.status === 'draft' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditEvaluation(evaluation._id)}
                                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <MessageSquare className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleSubmitEvaluation(evaluation._id)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Nộp đánh giá"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {(user.role === 'supervisor' || user.role === 'admin') && evaluation.status === 'submitted' && (
                                                        <button
                                                            onClick={() => {
                                                                setSuperviseId(evaluation._id)
                                                                setShowSuperviseModal(true)
                                                            }}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Giám sát"
                                                        >
                                                            <AlertCircle className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    {user.role === 'admin' && evaluation.status === 'supervised' && (
                                                        <button
                                                            onClick={() => handleFinalize(evaluation._id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Hoàn tất"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
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
                            {pagination && pagination.pages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                        Trang {pagination.current} / {pagination.pages} | Tổng {pagination.total} đánh giá
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
            {showDetailModal && selectedEval && (
                <EvaluationDetailModal
                    evaluation={selectedEval}
                    onClose={() => setShowDetailModal(false)}
                    userRole={user.role}
                />
            )}

            {/* Supervise Modal */}
            {showSuperviseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
                            <h2 className="text-lg font-bold text-orange-900">Giám sát đánh giá</h2>
                            <p className="text-sm text-orange-700 mt-1">Vui lòng nhập hướng dẫn cho chuyên gia</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <textarea
                                value={supervisorComment}
                                onChange={(e) => setSupervisorComment(e.target.value)}
                                placeholder="Nhập hướng dẫn, ý kiến..."
                                maxLength={3000}
                                rows={5}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            />
                            <p className="text-xs text-gray-500">
                                {supervisorComment.length}/3000 ký tự
                            </p>
                        </div>

                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowSuperviseModal(false)
                                    setSupervisorComment('')
                                    setSuperviseId(null)
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSupervise}
                                disabled={!supervisorComment.trim()}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Giám sát
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}

// Detail Modal Component
function EvaluationDetailModal({ evaluation, onClose, userRole }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-96 overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">{evaluation.reportId?.title}</h2>
                        <p className="text-blue-100 text-sm">{evaluation.reportId?.code}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Scores Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Điểm đánh giá</h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Điểm trung bình</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {evaluation.averageScore?.toFixed(1) || '--'}/10
                                </p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Xếp loại</p>
                                <p className={`text-sm font-bold px-2 py-1 rounded inline-block ${getRatingColor(evaluation.rating)}`}>
                                    {getRatingText(evaluation.rating)}
                                </p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Trạng thái</p>
                                <p className={`text-sm font-bold px-2 py-1 rounded inline-block ${getStatusColor(evaluation.status)}`}>
                                    {getStatusText(evaluation.status)}
                                </p>
                            </div>
                        </div>

                        {/* Criteria Scores */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-900 mb-3">Điểm theo tiêu chí</p>
                            <div className="space-y-3">
                                {evaluation.criteriaScores?.map((criteria, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{criteria.criteriaName}</p>
                                            {criteria.comment && (
                                                <p className="text-xs text-gray-600 mt-1">{criteria.comment}</p>
                                            )}
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="text-lg font-bold text-gray-900">
                                                {criteria.score}/{criteria.maxScore}
                                            </p>
                                            <p className="text-xs text-gray-500">Trọng số: {(criteria.weight * 100).toFixed(0)}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Overall Comment */}
                    {evaluation.overallComment && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Nhận xét tổng thể</h3>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {evaluation.overallComment}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Strengths and Improvements */}
                    <div className="grid grid-cols-2 gap-4">
                        {evaluation.strengths?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Điểm mạnh</h3>
                                <ul className="space-y-2">
                                    {evaluation.strengths.map((strength, idx) => (
                                        <li key={idx} className="text-sm text-gray-700 flex space-x-2">
                                            <span className="text-green-600 font-bold">•</span>
                                            <span>{strength.point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {evaluation.improvementAreas?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2">Cần cải thiện</h3>
                                <ul className="space-y-2">
                                    {evaluation.improvementAreas.map((area, idx) => (
                                        <li key={idx} className="text-sm text-gray-700 flex space-x-2">
                                            <span className="text-orange-600 font-bold">•</span>
                                            <span>{area.area}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Evidence Assessment */}
                    {evaluation.evidenceAssessment && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Đánh giá minh chứng</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Tính đầy đủ</p>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getEvidenceLevel(evaluation.evidenceAssessment.adequacy).color}`}>
                                        {getEvidenceLevel(evaluation.evidenceAssessment.adequacy).text}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Tính liên quan</p>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRatingColor(evaluation.evidenceAssessment.relevance)}`}>
                                        {evaluation.evidenceAssessment.relevance}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                    <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Chất lượng</p>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRatingColor(evaluation.evidenceAssessment.quality)}`}>
                                        {evaluation.evidenceAssessment.quality}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Supervisor Guidance */}
                    {evaluation.supervisorGuidance?.comments && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <p className="text-xs text-orange-600 uppercase font-semibold mb-2">Hướng dẫn giám sát</p>
                            <p className="text-sm text-gray-700">{evaluation.supervisorGuidance.comments}</p>
                            <p className="text-xs text-gray-500 mt-2">
                                Từ: {evaluation.supervisorGuidance.guidedBy?.fullName} - {formatDate(evaluation.supervisorGuidance.guidedAt)}
                            </p>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    )
}