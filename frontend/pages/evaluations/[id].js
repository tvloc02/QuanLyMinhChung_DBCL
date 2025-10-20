import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import api, { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    FileText,
    ArrowLeft,
    Loader2,
    Award,
    Star,
    MessageSquare,
    CheckCircle,
    Lightbulb,
    TrendingUp,
    Calendar,
    User,
    Clock,
    AlertCircle,
    Edit
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function EvaluationDetail() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { id } = router.query

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Đánh giá', href: '/reports/my-evaluations' },
        { name: 'Chi tiết' }
    ]

    const [evaluation, setEvaluation] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (router.isReady && id && user) {
            fetchEvaluation()
        }
    }, [router.isReady, id, user])

    const fetchEvaluation = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.evaluations.getById(id)
            const data = response.data?.data
            setEvaluation(data)
        } catch (error) {
            console.error('Fetch evaluation error:', error)
            toast.error('Lỗi khi tải thông tin đánh giá')
            setTimeout(() => router.back(), 1000)
        } finally {
            setLoading(false)
        }
    }

    const getRatingColor = (rating) => {
        const colors = {
            excellent: 'from-green-500 to-green-600 text-white',
            good: 'from-blue-500 to-blue-600 text-white',
            satisfactory: 'from-yellow-500 to-yellow-600 text-white',
            needs_improvement: 'from-orange-500 to-orange-600 text-white',
            poor: 'from-red-500 to-red-600 text-white'
        }
        return colors[rating] || 'from-gray-500 to-gray-600 text-white'
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

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            submitted: 'bg-blue-100 text-blue-800 border-blue-200',
            supervised: 'bg-cyan-100 text-cyan-800 border-cyan-200',
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

    const getEvidenceColor = (value) => {
        const colors = {
            insufficient: 'bg-red-100 text-red-800 border-red-200',
            adequate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            comprehensive: 'bg-green-100 text-green-800 border-green-200',
            poor: 'bg-red-100 text-red-800 border-red-200',
            fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            good: 'bg-blue-100 text-blue-800 border-blue-200',
            excellent: 'bg-green-100 text-green-800 border-green-200'
        }
        return colors[value] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getEvidenceLabel = (key, value) => {
        const labels = {
            adequacy: { insufficient: 'Chưa đủ', adequate: 'Đủ', comprehensive: 'Toàn diện' },
            relevance: { poor: 'Kém', fair: 'Trung bình', good: 'Tốt', excellent: 'Xuất sắc' },
            quality: { poor: 'Kém', fair: 'Trung bình', good: 'Tốt', excellent: 'Xuất sắc' }
        }
        return labels[key]?.[value] || value
    }

    if (isLoading || loading) {
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

    if (!evaluation) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <h3 className="text-red-800 font-bold">Lỗi</h3>
                    <p className="text-red-600">Không tìm thấy đánh giá</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-2">
                                {evaluation.reportId?.title}
                            </h1>
                            <p className="text-blue-100 font-mono text-sm">
                                Mã báo cáo: {evaluation.reportId?.code}
                            </p>
                        </div>
                        <button
                            onClick={() => router.back()}
                            className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Trạng thái</p>
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(evaluation.status)}`}>
                            {getStatusLabel(evaluation.status)}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Điểm trung bình</p>
                        <div className="flex items-center space-x-2">
                            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                            <span className="text-3xl font-bold text-gray-900">
                                {evaluation.averageScore?.toFixed(2) || 'N/A'}
                            </span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Xếp loại</p>
                        {evaluation.rating && (
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border bg-gradient-to-r ${getRatingColor(evaluation.rating)} `}>
                                <Award className="h-4 w-4 mr-1" />
                                {getRatingLabel(evaluation.rating)}
                            </div>
                        )}
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Ngày tạo</p>
                        <div className="flex items-center space-x-1 text-sm font-semibold text-gray-900">
                            <Calendar className="h-4 w-4" />
                            {formatDate(evaluation.createdAt)}
                        </div>
                    </div>
                </div>

                {/* Nhận xét tổng thể */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
                        Nhận xét tổng thể
                    </h2>
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                            {evaluation.overallComment || 'Chưa có nhận xét'}
                        </p>
                    </div>
                </div>

                {/* Evidence Assessment */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Đánh giá minh chứng</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Tính đầy đủ
                            </label>
                            <div className={`p-4 rounded-lg text-center font-semibold border ${getEvidenceColor(evaluation.evidenceAssessment?.adequacy)}`}>
                                {getEvidenceLabel('adequacy', evaluation.evidenceAssessment?.adequacy)}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Tính liên quan
                            </label>
                            <div className={`p-4 rounded-lg text-center font-semibold border ${getEvidenceColor(evaluation.evidenceAssessment?.relevance)}`}>
                                {getEvidenceLabel('relevance', evaluation.evidenceAssessment?.relevance)}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Chất lượng
                            </label>
                            <div className={`p-4 rounded-lg text-center font-semibold border ${getEvidenceColor(evaluation.evidenceAssessment?.quality)}`}>
                                {getEvidenceLabel('quality', evaluation.evidenceAssessment?.quality)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Criteria Scores */}
                {evaluation.criteriaScores?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Điểm theo tiêu chí</h2>
                        <div className="space-y-4">
                            {evaluation.criteriaScores.map((criteria, idx) => (
                                <div key={idx} className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Tiêu chí</p>
                                            <p className="text-lg font-bold text-gray-900">{criteria.criteriaName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Điểm tối đa</p>
                                            <p className="text-lg font-bold text-gray-900">{criteria.maxScore}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Điểm đạt được</p>
                                            <div className="flex items-baseline space-x-1">
                                                <span className="text-3xl font-bold text-green-600">{criteria.score}</span>
                                                <span className="text-gray-500">/ {criteria.maxScore}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Tỷ lệ</p>
                                            <p className="text-lg font-bold text-blue-600">
                                                {Math.round((criteria.score / criteria.maxScore) * 100)}%
                                            </p>
                                        </div>
                                    </div>
                                    {criteria.comment && (
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <p className="text-xs font-semibold text-gray-600 mb-2">Bình luận</p>
                                            <p className="text-gray-900">{criteria.comment}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Strengths */}
                {evaluation.strengths?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-green-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                            Điểm mạnh
                        </h2>
                        <div className="space-y-3">
                            {evaluation.strengths.map((strength, idx) => (
                                <div key={idx} className="p-4 bg-green-50 rounded-lg border-2 border-green-200 flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-gray-900 font-semibold">{strength.point}</p>
                                        {strength.evidenceReference && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                Minh chứng: {strength.evidenceReference}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Improvement Areas */}
                {evaluation.improvementAreas?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Lightbulb className="h-6 w-6 mr-2 text-orange-600" />
                            Điểm cần cải thiện
                        </h2>
                        <div className="space-y-4">
                            {evaluation.improvementAreas.map((area, idx) => (
                                <div key={idx} className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                                    <p className="text-gray-900 font-semibold mb-2">{area.area}</p>
                                    {area.recommendation && (
                                        <div className="bg-white p-3 rounded border border-orange-100">
                                            <p className="text-xs font-semibold text-gray-600 mb-1">Khuyến nghị</p>
                                            <p className="text-gray-900">{area.recommendation}</p>
                                        </div>
                                    )}
                                    {area.priority && (
                                        <div className="mt-2">
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                                area.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    area.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                                {area.priority === 'high' ? 'Cao' : area.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {evaluation.recommendations?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <TrendingUp className="h-6 w-6 mr-2 text-purple-600" />
                            Khuyến nghị
                        </h2>
                        <div className="space-y-3">
                            {evaluation.recommendations.map((rec, idx) => (
                                <div key={idx} className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200 flex items-start">
                                    <TrendingUp className="h-5 w-5 text-purple-600 mr-3 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-gray-900 font-semibold">{rec.recommendation}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded font-semibold">
                                                {rec.type === 'immediate' ? 'Ngay lập tức' :
                                                    rec.type === 'short_term' ? 'Ngắn hạn' : 'Dài hạn'}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                                rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                                {rec.priority === 'high' ? 'Cao' : rec.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Supervisor Guidance */}
                {evaluation.supervisorGuidance?.comments && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                        <h3 className="text-blue-900 font-bold mb-2">Hướng dẫn từ người giám sát</h3>
                        <p className="text-blue-800">{evaluation.supervisorGuidance.comments}</p>
                        {evaluation.supervisorGuidance.guidedAt && (
                            <p className="text-xs text-blue-600 mt-2">
                                Ngày: {formatDate(evaluation.supervisorGuidance.guidedAt)}
                            </p>
                        )}
                    </div>
                )}

                {/* Back Button */}
                <div className="flex justify-start">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </button>
                </div>
            </div>
        </Layout>
    )
}