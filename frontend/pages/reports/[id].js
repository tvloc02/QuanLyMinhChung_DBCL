import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import { apiMethods } from '../../../services/api'
import {
    ArrowLeft,
    BookOpen,
    User,
    Calendar,
    FileText,
    CheckCircle,
    AlertCircle,
    TrendingUp
} from 'lucide-react'
import { formatDate } from '../../../utils/helpers'
import toast from 'react-hot-toast'

export default function EvaluationDetailPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { id } = router.query

    const [loading, setLoading] = useState(true)
    const [evaluation, setEvaluation] = useState(null)
    const [statistics, setStatistics] = useState(null)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && router.isReady && id) {
            fetchEvaluation()
            fetchStatistics()
        }
    }, [user, id, router.isReady])

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Đánh giá', path: '/reports/evaluations' },
        { name: 'Chi tiết', icon: BookOpen }
    ]

    const fetchEvaluation = async () => {
        try {
            setLoading(true)
            console.log('📥 Fetching evaluation detail:', id)

            const response = await apiMethods.evaluations.getById(id)
            const evalData = response.data?.data || response.data

            if (!evalData) {
                toast.error('Không tìm thấy đánh giá')
                router.push('/reports/evaluations')
                return
            }

            console.log('✅ Evaluation detail loaded:', evalData)
            setEvaluation(evalData)
        } catch (error) {
            console.error('❌ Error fetching evaluation:', error)

            if (error.response?.status === 403) {
                toast.error('Bạn không có quyền xem đánh giá này')
            } else if (error.response?.status === 404) {
                toast.error('Không tìm thấy đánh giá')
            } else {
                toast.error('Lỗi tải đánh giá')
            }

            router.push('/reports/evaluations')
        } finally {
            setLoading(false)
        }
    }

    const fetchStatistics = async () => {
        try {
            console.log('📥 Fetching statistics for role:', user?.role)
            let statsRes

            if (user?.role === 'expert') {
                // ✅ SỬA: Gọi getEvaluatorStats(evaluatorId) thay vì getStats()
                statsRes = await apiMethods.evaluations.getEvaluatorStats(user.id)
                console.log('✅ Expert stats:', statsRes.data?.data)
            } else if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'manager') {
                // ✅ SỬA: Gọi getSystemStats() (không có tham số)
                statsRes = await apiMethods.evaluations.getSystemStats()
                console.log('✅ System stats:', statsRes.data?.data)
            }

            if (statsRes?.data?.data) {
                setStatistics(statsRes.data.data)
            }
        } catch (error) {
            console.error('❌ Error fetching statistics:', error)
            // Không show toast để không làm gián đoạn
        }
    }

    const getRatingColor = (rating) => {
        const colors = {
            excellent: 'bg-green-100 text-green-800 border-green-300',
            good: 'bg-blue-100 text-blue-800 border-blue-300',
            satisfactory: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            needs_improvement: 'bg-orange-100 text-orange-800 border-orange-300',
            poor: 'bg-red-100 text-red-800 border-red-300'
        }
        return colors[rating] || 'bg-gray-100 text-gray-800 border-gray-300'
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

    if (isLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!evaluation) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-red-800 font-semibold">Lỗi</h3>
                    <p className="text-red-600">Không thể tải đánh giá</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title='Chi tiết đánh giá' breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </button>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {evaluation.reportId?.title}
                            </h1>
                            <p className="text-gray-600">{evaluation.reportId?.code}</p>
                        </div>
                        <div className="flex gap-2">
                            <span className={`px-4 py-2 rounded-lg font-semibold text-sm border ${getStatusColor(evaluation.status)}`}>
                                {getStatusText(evaluation.status)}
                            </span>
                            <span className={`px-4 py-2 rounded-lg font-semibold text-sm border ${getRatingColor(evaluation.rating)}`}>
                                {getRatingText(evaluation.rating)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Evaluation Score */}
                {evaluation.averageScore !== undefined && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 uppercase font-semibold mb-1">Điểm đánh giá trung bình</p>
                                <p className="text-4xl font-bold text-blue-900">{evaluation.averageScore}/10</p>
                            </div>
                            <TrendingUp className="h-12 w-12 text-blue-600 opacity-30" />
                        </div>
                    </div>
                )}

                {/* Evaluator Info */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start gap-3">
                            <User className="h-5 w-5 text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Chuyên gia đánh giá</p>
                                <p className="font-semibold text-gray-900">{evaluation.evaluatorId?.fullName}</p>
                                <p className="text-sm text-gray-600">{evaluation.evaluatorId?.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Ngày nộp</p>
                                <p className="font-semibold text-gray-900">
                                    {evaluation.submittedAt ? formatDate(evaluation.submittedAt) : 'Chưa nộp'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overall Comment */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Nhận xét tổng thể
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {evaluation.overallComment}
                    </p>
                </div>

                {/* Evidence Assessment */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Đánh giá minh chứng</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Tính đầy đủ</p>
                            <p className="text-lg font-bold text-gray-900">
                                {evaluation.evidenceAssessment?.adequacy === 'insufficient' ? 'Không đủ' :
                                    evaluation.evidenceAssessment?.adequacy === 'adequate' ? 'Đủ' : 'Toàn diện'}
                            </p>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Tính liên quan</p>
                            <p className="text-lg font-bold text-gray-900">
                                {evaluation.evidenceAssessment?.relevance === 'poor' ? 'Kém' :
                                    evaluation.evidenceAssessment?.relevance === 'fair' ? 'Trung bình' :
                                        evaluation.evidenceAssessment?.relevance === 'good' ? 'Tốt' : 'Xuất sắc'}
                            </p>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Chất lượng</p>
                            <p className="text-lg font-bold text-gray-900">
                                {evaluation.evidenceAssessment?.quality === 'poor' ? 'Kém' :
                                    evaluation.evidenceAssessment?.quality === 'fair' ? 'Trung bình' :
                                        evaluation.evidenceAssessment?.quality === 'good' ? 'Tốt' : 'Xuất sắc'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Supervisor Guidance */}
                {evaluation.supervisorGuidance?.comments && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Hướng dẫn từ giám sát
                        </h2>
                        <p className="text-purple-900 whitespace-pre-wrap">
                            {evaluation.supervisorGuidance.comments}
                        </p>
                        {evaluation.supervisorGuidance.guidedBy && (
                            <p className="text-sm text-purple-600 mt-3">
                                - {evaluation.supervisorGuidance.guidedBy?.fullName}
                                {evaluation.supervisorGuidance.guidedAt && ` (${formatDate(evaluation.supervisorGuidance.guidedAt)})`}
                            </p>
                        )}
                    </div>
                )}

                {/* Statistics */}
                {statistics && user?.role === 'expert' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Thống kê của tôi</h2>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <p className="text-xs text-blue-600 uppercase font-semibold">Tổng cộng</p>
                                <p className="text-3xl font-bold text-blue-900 mt-2">{statistics.total || 0}</p>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                <p className="text-xs text-yellow-600 uppercase font-semibold">Bản nháp</p>
                                <p className="text-3xl font-bold text-yellow-900 mt-2">{statistics.draft || 0}</p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <p className="text-xs text-blue-600 uppercase font-semibold">Đã nộp</p>
                                <p className="text-3xl font-bold text-blue-900 mt-2">{statistics.submitted || 0}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                <p className="text-xs text-green-600 uppercase font-semibold">Hoàn tất</p>
                                <p className="text-3xl font-bold text-green-900 mt-2">{statistics.final || 0}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Back Button */}
                <div className="flex justify-end">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </Layout>
    )
}