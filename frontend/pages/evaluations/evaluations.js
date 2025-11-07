import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import api, { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    FileText,
    Search,
    Filter,
    Eye,
    RefreshCw,
    Loader2,
    BarChart3,
    Calendar,
    MessageSquare,
    Award,
    User,
    ClipboardCheck
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ReportEvaluations() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    const { reportId } = router.query

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Đánh giá Báo cáo TĐG' }
    ]

    const [evaluations, setEvaluations] = useState([])
    const [averageScore, setAverageScore] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reportTitle, setReportTitle] = useState('Đang tải...')

    const [filters, setFilters] = useState({
        status: '',
        rating: '',
        page: 1,
        limit: 10,
        sortBy: 'submittedAt',
        sortOrder: 'desc'
    })

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (router.isReady && reportId && user) {
            fetchReportDetails()
            fetchEvaluationsForReport()
            fetchAverageScore()
        }
    }, [filters, reportId, user, router.isReady])

    const fetchReportDetails = async () => {
        try {
            const reportRes = await apiMethods.reports.getById(reportId)
            setReportTitle(reportRes.data?.data?.title || 'Báo cáo không tên')
        } catch (error) {
            console.error('Fetch report details error:', error)
            setReportTitle('Lỗi tải tên báo cáo')
        }
    }

    const fetchAverageScore = async () => {
        try {
            const scoreRes = await apiMethods.evaluations.getAverageScoreByReport(reportId)
            setAverageScore(scoreRes.data?.data?.averageScore)
        } catch (error) {
            console.error('Fetch average score error:', error)
            setAverageScore(null)
        }
    }

    const fetchEvaluationsForReport = async () => {
        try {
            setLoading(true)

            const params = {
                page: filters.page,
                limit: filters.limit,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                reportId: reportId,
                status: filters.status,
                rating: filters.rating
            }

            const response = await apiMethods.evaluations.getAll(params)
            const data = response.data?.data || response.data

            // Chỉ hiển thị các bản đã nộp trở lên (submitted, supervised, final)
            setEvaluations(data?.evaluations?.filter(e => e.status !== 'draft') || [])

        } catch (error) {
            console.error('Fetch evaluations for report error:', error)
            toast.error('Lỗi khi tải danh sách đánh giá cho báo cáo này')
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

    const getStatusColor = (status) => {
        const colors = {
            submitted: 'bg-blue-100 text-blue-800 border-blue-200',
            supervised: 'bg-cyan-100 text-cyan-800 border-cyan-200',
            final: 'bg-indigo-100 text-indigo-800 border-indigo-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getStatusLabel = (status) => {
        const labels = {
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

    // Chỉ cho phép admin/manager/reporter xem danh sách đánh giá đã nộp
    if (user && !['admin', 'manager', 'reporter'].includes(user.role)) {
        return (
            <Layout title="Đánh giá Báo cáo TĐG" breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <h3 className="text-red-800 font-bold">Lỗi truy cập</h3>
                    <p className="text-red-600">Bạn không có quyền xem trang này.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Đánh giá Báo cáo TĐG" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <ClipboardCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Đánh giá Báo cáo TĐG</h1>
                            <p className="text-blue-200">
                                Xem các đánh giá của người đánh giá dành cho báo cáo: <span className="font-semibold">{reportTitle}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <h3 className="text-sm font-bold text-gray-900 flex-1 min-w-[150px]">Lọc kết quả</h3>

                        <div className="min-w-[180px]">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Trạng thái</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="submitted">Đã nộp</option>
                                <option value="supervised">Đã giám sát</option>
                                <option value="final">Hoàn tất</option>
                            </select>
                        </div>

                        <div className="min-w-[180px]">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Xếp loại</label>
                            <select
                                value={filters.rating}
                                onChange={(e) => handleFilterChange('rating', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả xếp loại</option>
                                <option value="excellent">Xuất sắc</option>
                                <option value="good">Tốt</option>
                                <option value="satisfactory">Đạt yêu cầu</option>
                                <option value="needs_improvement">Cần cải thiện</option>
                                <option value="poor">Kém</option>
                            </select>
                        </div>

                        <button
                            onClick={fetchEvaluationsForReport}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border-2 border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 disabled:opacity-50 transition-all font-semibold text-blue-700 mt-auto"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Tìm kiếm
                        </button>
                    </div>
                    {averageScore !== null && (
                        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                            <p className="text-sm font-semibold text-indigo-800 flex items-center">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Điểm trung bình các đánh giá đã nộp:
                            </p>
                            <span className="text-xl font-bold text-indigo-700">
                                {averageScore.toFixed(2)} / 10
                            </span>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h2 className="text-lg font-bold text-gray-900">
                            Các bản đánh giá ({evaluations.length})
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
                                <MessageSquare className="h-10 w-10 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                Chưa có đánh giá nào được nộp
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Các người đánh giá chưa nộp bản đánh giá cho báo cáo này.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                        Người đánh giá
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                        Điểm TB
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
                                {evaluations.map((evaluation) => (
                                    <tr key={evaluation._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                        <td className="px-6 py-4 border-r border-gray-200">
                                            <div className="flex items-center space-x-2">
                                                <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {evaluation.evaluatorId?.fullName || 'Người đánh giá ẩn danh'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center border-r border-gray-200">
                                            <span className="text-sm font-bold text-gray-900">
                                                {evaluation.averageScore?.toFixed(2) || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center border-r border-gray-200">
                                            {evaluation.rating && (
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getRatingColor(evaluation.rating)}`}>
                                                    <Award className="h-3 w-3 mr-1" />
                                                    {getRatingLabel(evaluation.rating)}
                                                </span>
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
                                                {formatDate(evaluation.submittedAt || evaluation.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => router.push(`/reports/evaluations/${evaluation._id}`)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Xem chi tiết đánh giá"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}