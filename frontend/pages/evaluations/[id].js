import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import api, { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Award,
    Calendar,
    User,
    Loader2,
    MessageSquare,
    Lightbulb,
    TrendingUp,
    Eye,
    Edit,
    ArrowRight,
    Settings,
    Share2,
    Download,
    Printer, // ✅ ĐÃ SỬA: Thay thế Print bằng Printer để tránh lỗi "Element type is invalid"
    Zap
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function EvaluationDetail() {
    const router = useRouter()
    const { id } = router.query
    const { user, isLoading: authLoading } = useAuth()

    const [evaluation, setEvaluation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (id && user) {
            fetchEvaluationDetail()
        }
    }, [id, user])

    const fetchEvaluationDetail = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.evaluations.getById(id)
            setEvaluation(response.data?.data || response.data)
        } catch (error) {
            console.error('Fetch evaluation detail error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải chi tiết đánh giá')
            if (error.response?.status === 404 || error.response?.status === 403) { // Xử lý lỗi 403
                router.replace('/evaluations/my-evaluations')
            }
        } finally {
            setLoading(false)
        }
    }

    const getRatingColor = (rating) => {
        const colors = {
            excellent: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', dark: 'bg-indigo-600' },
            good: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dark: 'bg-blue-600' },
            satisfactory: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dark: 'bg-yellow-600' },
            needs_improvement: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dark: 'bg-orange-600' },
            poor: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dark: 'bg-red-600' }
        }
        return colors[rating] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', dark: 'bg-gray-600' }
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
            draft: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-50' },
            submitted: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-50' },
            supervised: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-50' },
            final: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-50' }
        }
        return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', badge: 'bg-gray-50' }
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

    const getEvidenceQualityColor = (quality) => {
        const colors = {
            excellent: 'bg-indigo-100 text-indigo-700 border-indigo-300',
            good: 'bg-blue-100 text-blue-700 border-blue-300',
            fair: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            poor: 'bg-red-100 text-red-700 border-red-300'
        }
        return colors[quality] || 'bg-gray-100 text-gray-700 border-gray-300'
    }

    const getEvidenceAdequacyLabel = (adequacy) => {
        const labels = {
            insufficient: 'Không đủ',
            adequate: 'Đủ',
            comprehensive: 'Toàn diện'
        }
        return labels[adequacy] || adequacy
    }

    const getEvidenceQualityLabel = (quality) => {
        const labels = {
            excellent: 'Xuất sắc',
            good: 'Tốt',
            fair: 'Bình thường',
            poor: 'Kém'
        }
        return labels[quality] || quality
    }

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Đánh giá của tôi', href: '/evaluations/my-evaluations' },
        { name: 'Chi tiết đánh giá' }
    ]

    if (loading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải chi tiết đánh giá...</p>
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
                    <p className="text-red-600">Không tìm thấy đánh giá này</p>
                </div>
            </Layout>
        )
    }

    const ratingColor = getRatingColor(evaluation.rating)
    const statusColor = getStatusColor(evaluation.status)

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header với nút quay lại */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Quay lại
                </button>

                {/* Header - Màu xanh lam */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                    <Award className="w-8 h-8" />
                                </div>
                                <h1 className="text-3xl font-bold">Chi tiết đánh giá</h1>
                            </div>
                            <p className="text-blue-100">
                                Báo cáo: <span className="font-semibold">{evaluation.reportId?.title}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full font-semibold border-2 ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                                {getStatusLabel(evaluation.status)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Xếp loại */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-600">XẾP LOẠI</p>
                            <Award className="h-5 w-5 text-blue-600" />
                        </div>
                        {evaluation.rating ? (
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${ratingColor.bg} ${ratingColor.text} ${ratingColor.border}`}>
                                {getRatingLabel(evaluation.rating)}
                            </span>
                        ) : (
                            <p className="text-gray-500 text-sm">Chưa xếp loại</p>
                        )}
                    </div>

                    {/* Trạng thái */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-600">TRẠNG THÁI</p>
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{getStatusLabel(evaluation.status)}</p>
                    </div>

                    {/* Ngày tạo */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-600">NGÀY TẠO</p>
                            <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900">{formatDate(evaluation.createdAt)}</p>
                    </div>

                    {/* Mã báo cáo */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-600">MÃ BÁO CÁO</p>
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-lg font-bold text-gray-900 font-mono">{evaluation.reportId?.code}</p>
                    </div>
                </div>

                {/* Tabs điều hướng */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="flex flex-wrap border-b-2 border-blue-200">
                        {[
                            { id: 'overview', label: 'Tổng quan', icon: Eye },
                            { id: 'evidence', label: 'Minh chứng', icon: FileText },
                            { id: 'strengths', label: 'Điểm mạnh', icon: TrendingUp },
                            { id: 'improvements', label: 'Cần cải thiện', icon: AlertCircle },
                            { id: 'recommendations', label: 'Khuyến nghị', icon: Lightbulb }
                        ].map(tab => {
                            const TabIcon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-6 py-4 font-semibold border-b-4 transition-all ${
                                        activeTab === tab.id
                                            ? 'text-blue-600 border-blue-600 bg-blue-50'
                                            : 'text-gray-600 border-transparent hover:text-blue-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <TabIcon className="h-5 w-5 mr-2" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    <div className="p-8">
                        {/* Tab: Tổng quan */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <MessageSquare className="h-6 w-6 text-blue-600 mr-3" />
                                        Nhận xét tổng thể
                                    </h3>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {evaluation.overallComment || <span className="text-gray-500 italic">Chưa có nhận xét</span>}
                                        </p>
                                    </div>
                                </div>

                                {/* Thông tin người đánh giá */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                                        <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center">
                                            <User className="h-4 w-4 text-blue-600 mr-2" />
                                            NGƯỜI ĐÁNH GIÁ
                                        </h4>
                                        <p className="text-lg font-semibold text-gray-900">{evaluation.evaluatorId?.fullName}</p>
                                        <p className="text-sm text-gray-600">{evaluation.evaluatorId?.email}</p>
                                    </div>

                                    {evaluation.supervisorGuidance?.guidedBy && (
                                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border-2 border-cyan-200">
                                            <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center">
                                                <Settings className="h-4 w-4 text-cyan-600 mr-2" />
                                                NGƯỜI GIÁM SÁT
                                            </h4>
                                            <p className="text-lg font-semibold text-gray-900">{evaluation.supervisorGuidance.guidedBy.fullName}</p>
                                            <p className="text-sm text-gray-600">{evaluation.supervisorGuidance.guidedBy.email}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Thời gian */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                                        <p className="text-gray-600 font-semibold mb-1">Bắt đầu</p>
                                        <p className="text-gray-900 font-bold">{formatDate(evaluation.startedAt)}</p>
                                    </div>
                                    {evaluation.submittedAt && (
                                        <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border-2 border-sky-200">
                                            <p className="text-gray-600 font-semibold mb-1">Nộp lúc</p>
                                            <p className="text-gray-900 font-bold">{formatDate(evaluation.submittedAt)}</p>
                                        </div>
                                    )}
                                    {evaluation.finalizedAt && (
                                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border-2 border-indigo-200">
                                            <p className="text-gray-600 font-semibold mb-1">Hoàn tất lúc</p>
                                            <p className="text-gray-900 font-bold">{formatDate(evaluation.finalizedAt)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab: Minh chứng */}
                        {activeTab === 'evidence' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <FileText className="h-6 w-6 text-blue-600 mr-3" />
                                        Đánh giá minh chứng
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Tính đầy đủ */}
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                                            <p className="text-sm font-bold text-gray-600 mb-3">TÍNH ĐẦY ĐỦ</p>
                                            {evaluation.evidenceAssessment?.adequacy ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-300">
                                                    {getEvidenceAdequacyLabel(evaluation.evidenceAssessment.adequacy)}
                                                </span>
                                            ) : (
                                                <p className="text-gray-500 text-sm italic">Chưa đánh giá</p>
                                            )}
                                        </div>

                                        {/* Tính liên quan */}
                                        <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-6 border-2 border-sky-200">
                                            <p className="text-sm font-bold text-gray-600 mb-3">TÍNH LIÊN QUAN</p>
                                            {evaluation.evidenceAssessment?.relevance ? (
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${getEvidenceQualityColor(evaluation.evidenceAssessment.relevance)}`}>
                                                    {getEvidenceQualityLabel(evaluation.evidenceAssessment.relevance)}
                                                </span>
                                            ) : (
                                                <p className="text-gray-500 text-sm italic">Chưa đánh giá</p>
                                            )}
                                        </div>

                                        {/* Chất lượng */}
                                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border-2 border-cyan-200">
                                            <p className="text-sm font-bold text-gray-600 mb-3">CHẤT LƯỢNG</p>
                                            {evaluation.evidenceAssessment?.quality ? (
                                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${getEvidenceQualityColor(evaluation.evidenceAssessment.quality)}`}>
                                                    {getEvidenceQualityLabel(evaluation.evidenceAssessment.quality)}
                                                </span>
                                            ) : (
                                                <p className="text-gray-500 text-sm italic">Chưa đánh giá</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Điểm mạnh */}
                        {activeTab === 'strengths' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <TrendingUp className="h-6 w-6 text-blue-600 mr-3" />
                                    Điểm mạnh
                                </h3>
                                {evaluation.strengths && evaluation.strengths.length > 0 ? (
                                    <div className="space-y-3">
                                        {evaluation.strengths.map((strength, index) => (
                                            <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-900 font-semibold">{strength.point}</p>
                                                        {strength.evidenceReference && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                <span className="font-semibold">Tham chiếu:</span> {strength.evidenceReference}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-center py-8">Chưa có điểm mạnh nào được ghi lại</p>
                                )}
                            </div>
                        )}

                        {/* Tab: Cần cải thiện */}
                        {activeTab === 'improvements' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <AlertCircle className="h-6 w-6 text-blue-600 mr-3" />
                                    Các lĩnh vực cần cải thiện
                                </h3>
                                {evaluation.improvementAreas && evaluation.improvementAreas.length > 0 ? (
                                    <div className="space-y-3">
                                        {evaluation.improvementAreas.map((area, index) => (
                                            <div key={index} className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200">
                                                <div className="flex items-start space-x-3 mb-3">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-900 font-semibold">{area.area}</p>
                                                        <div className="mt-2 flex items-center space-x-2">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${
                                                                area.priority === 'high' ? 'bg-red-100 text-red-700 border-red-300' :
                                                                    area.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                                        'bg-blue-100 text-blue-700 border-blue-300'
                                                            }`}>
                                                                {area.priority === 'high' ? 'Cao' : area.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {area.recommendation && (
                                                    <div className="ml-9 bg-white rounded-lg p-3 border-l-4 border-orange-400">
                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-semibold">Khuyến nghị:</span> {area.recommendation}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-center py-8">Chưa ghi lại lĩnh vực cần cải thiện nào</p>
                                )}
                            </div>
                        )}

                        {/* Tab: Khuyến nghị */}
                        {activeTab === 'recommendations' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <Lightbulb className="h-6 w-6 text-blue-600 mr-3" />
                                    Khuyến nghị
                                </h3>
                                {evaluation.recommendations && evaluation.recommendations.length > 0 ? (
                                    <div className="space-y-3">
                                        {evaluation.recommendations.map((rec, index) => (
                                            <div key={index} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-gray-900 font-semibold">{rec.recommendation}</p>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${
                                                                rec.type === 'immediate' ? 'bg-red-100 text-red-700 border-red-300' :
                                                                    rec.type === 'short_term' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                                        'bg-green-100 text-green-700 border-green-300'
                                                            }`}>
                                                                {rec.type === 'immediate' ? 'Ngay lập tức' : rec.type === 'short_term' ? 'Ngắn hạn' : 'Dài hạn'}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${
                                                                rec.priority === 'high' ? 'bg-red-100 text-red-700 border-red-300' :
                                                                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                                        'bg-blue-100 text-blue-700 border-blue-300'
                                                            }`}>
                                                                {rec.priority === 'high' ? 'Ưu tiên cao' : rec.priority === 'medium' ? 'Ưu tiên trung bình' : 'Ưu tiên thấp'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic text-center py-8">Chưa có khuyến nghị nào</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer với action buttons */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="text-sm text-gray-600">
                            <p>
                                Cập nhật lần cuối: <span className="font-semibold text-gray-900">{formatDate(evaluation.updatedAt)}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={() => router.push(`/evaluations/${evaluation._id}/edit`)}
                                disabled={evaluation.status !== 'draft'}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
                            >
                                <Edit className="h-5 w-5 mr-2" />
                                Sửa
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                            >
                                <Printer className="h-5 w-5 mr-2" /> {/* ✅ ĐÃ SỬA: Thay thế Print bằng Printer */}
                                In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}