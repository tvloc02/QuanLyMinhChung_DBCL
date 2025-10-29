import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../contexts/AuthContext'
import Layout from '../../../../components/common/Layout'
import { apiMethods } from '../../../../services/api'
import toast from 'react-hot-toast'
import {
    Star,
    ArrowLeft,
    Loader2,
    CheckCircle,
    AlertCircle,
    FileText,
    TrendingUp,
    TrendingDown,
    Calendar,
    User,
    Edit,
    Download,
    Eye
} from 'lucide-react'
import { formatDate } from '../../../../utils/helpers'

export default function EvaluationDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const { user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [evaluation, setEvaluation] = useState(null)

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/' },
        { name: 'Đánh giá', href: '/reports/evaluations' },
        { name: 'Chi tiết đánh giá' }
    ]

    useEffect(() => {
        if (id && user) {
            fetchEvaluation()
        }
    }, [id, user])

    const fetchEvaluation = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.evaluations.getById(id)
            setEvaluation(response.data?.data || response.data)
        } catch (error) {
            console.error('Fetch evaluation error:', error)
            toast.error('Lỗi khi tải thông tin đánh giá')
        } finally {
            setLoading(false)
        }
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

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            submitted: 'Đã nộp',
            reviewed: 'Đã xem xét',
            final: 'Hoàn tất'
        }
        return labels[status] || status
    }

    const getScoreColor = (score, maxScore) => {
        const percentage = (score / maxScore) * 100
        if (percentage >= 90) return 'text-green-600'
        if (percentage >= 70) return 'text-blue-600'
        if (percentage >= 50) return 'text-yellow-600'
        if (percentage >= 30) return 'text-orange-600'
        return 'text-red-600'
    }

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-red-100 text-red-800'
        }
        return colors[priority] || 'bg-gray-100 text-gray-800'
    }

    const getPriorityLabel = (priority) => {
        const labels = {
            low: 'Thấp',
            medium: 'Trung bình',
            high: 'Cao'
        }
        return labels[priority] || priority
    }

    if (loading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
            </Layout>
        )
    }

    if (!evaluation) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="text-center py-12">
                    <p className="text-gray-600">Không tìm thấy đánh giá</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold mb-1">Chi tiết đánh giá</h1>
                                <p className="text-purple-100">{evaluation.reportId?.title}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {evaluation.status === 'draft' && evaluation.evaluatorId?._id === user.id && (
                                <button
                                    onClick={() => router.push(`/reports/evaluations/${id}/edit`)}
                                    className="inline-flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Score Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                                <Star className="h-8 w-8 text-yellow-500 fill-current" />
                                <span className="text-4xl font-bold text-gray-900">
                                    {evaluation.averageScore?.toFixed(2) || '0.00'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">Điểm trung bình</p>
                        </div>
                        <div className="text-center">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getRatingColor(evaluation.rating)}`}>
                                {getRatingLabel(evaluation.rating)}
                            </span>
                            <p className="text-sm text-gray-600 mt-2">Phân loại</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                                <CheckCircle className="h-6 w-6 text-blue-600" />
                                <span className="text-2xl font-bold text-gray-900">
                                    {evaluation.status === 'final' ? '100%' : '0%'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">{getStatusLabel(evaluation.status)}</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                                <Calendar className="h-6 w-6 text-purple-600" />
                                <span className="text-lg font-medium text-gray-900">
                                    {evaluation.submittedAt ? formatDate(evaluation.submittedAt) : 'N/A'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">Ngày nộp</p>
                        </div>
                    </div>
                </div>

                {/* Evaluator Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-purple-600" />
                        Thông tin người đánh giá
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Họ tên</p>
                            <p className="font-medium text-gray-900">{evaluation.evaluatorId?.fullName || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{evaluation.evaluatorId?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                            <p className="font-medium text-gray-900">{formatDate(evaluation.startedAt)}</p>
                        </div>
                        {evaluation.reviewedBy && (
                            <div>
                                <p className="text-sm text-gray-600">Người xem xét</p>
                                <p className="font-medium text-gray-900">{evaluation.reviewedBy?.fullName || 'N/A'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Criteria Scores */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                        Điểm theo tiêu chí
                    </h2>
                    <div className="space-y-4">
                        {evaluation.criteriaScores?.map((criteria, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{criteria.criteriaName}</h3>
                                        <p className="text-sm text-gray-500">
                                            Điểm tối đa: {criteria.maxScore} | Trọng số: {criteria.weight * 100}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-2xl font-bold ${getScoreColor(criteria.score, criteria.maxScore)}`}>
                                            {criteria.score}
                                        </span>
                                        <span className="text-gray-500"> / {criteria.maxScore}</span>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                            style={{ width: `${(criteria.score / criteria.maxScore) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                {criteria.comment && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-sm text-gray-700">{criteria.comment}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Overall Comment */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-600" />
                        Nhận xét tổng thể
                    </h2>
                    <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{evaluation.overallComment || 'Chưa có nhận xét'}</p>
                    </div>
                </div>

                {/* Strengths */}
                {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                            Điểm mạnh ({evaluation.strengths.length})
                        </h2>
                        <div className="space-y-3">
                            {evaluation.strengths.map((strength, index) => (
                                <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-gray-900 font-medium mb-1">{strength.point}</p>
                                    {strength.evidenceReference && (
                                        <p className="text-sm text-green-700">
                                            <span className="font-medium">Minh chứng:</span> {strength.evidenceReference}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Improvement Areas */}
                {evaluation.improvementAreas && evaluation.improvementAreas.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                            Điểm cần cải thiện ({evaluation.improvementAreas.length})
                        </h2>
                        <div className="space-y-3">
                            {evaluation.improvementAreas.map((area, index) => (
                                <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="text-gray-900 font-medium flex-1">{area.area}</p>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(area.priority)}`}>
                                            {getPriorityLabel(area.priority)}
                                        </span>
                                    </div>
                                    {area.recommendation && (
                                        <p className="text-sm text-orange-700">
                                            <span className="font-medium">Khuyến nghị:</span> {area.recommendation}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {evaluation.recommendations && evaluation.recommendations.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                            Khuyến nghị ({evaluation.recommendations.length})
                        </h2>
                        <div className="space-y-3">
                            {evaluation.recommendations.map((rec, index) => (
                                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="text-gray-900 flex-1">{rec.recommendation}</p>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                                                {getPriorityLabel(rec.priority)}
                                            </span>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                {rec.type === 'immediate' ? 'Ngay lập tức' :
                                                    rec.type === 'short_term' ? 'Ngắn hạn' : 'Dài hạn'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Evidence Assessment */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-600" />
                        Đánh giá minh chứng
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Tính đầy đủ</p>
                            <p className="font-medium text-gray-900 capitalize">
                                {evaluation.evidenceAssessment?.adequacy === 'insufficient' ? 'Chưa đầy đủ' :
                                    evaluation.evidenceAssessment?.adequacy === 'adequate' ? 'Đầy đủ' : 'Toàn diện'}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Tính liên quan</p>
                            <p className="font-medium text-gray-900 capitalize">
                                {evaluation.evidenceAssessment?.relevance === 'poor' ? 'Kém' :
                                    evaluation.evidenceAssessment?.relevance === 'fair' ? 'Khá' :
                                        evaluation.evidenceAssessment?.relevance === 'good' ? 'Tốt' : 'Xuất sắc'}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Chất lượng</p>
                            <p className="font-medium text-gray-900 capitalize">
                                {evaluation.evidenceAssessment?.quality === 'poor' ? 'Kém' :
                                    evaluation.evidenceAssessment?.quality === 'fair' ? 'Khá' :
                                        evaluation.evidenceAssessment?.quality === 'good' ? 'Tốt' : 'Xuất sắc'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reviewer Comments */}
                {evaluation.reviewerComments && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                            Nhận xét của người xem xét
                        </h2>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-gray-700">{evaluation.reviewerComments}</p>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}