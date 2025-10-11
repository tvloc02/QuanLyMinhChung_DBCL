import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../contexts/AuthContext'
import Layout from '../../../../components/common/Layout'
import { apiMethods } from '../../../../services/api'
import toast from 'react-hot-toast'
import {
    Star,
    Save,
    Send,
    ArrowLeft,
    Loader2,
    CheckCircle,
    AlertCircle,
    Plus,
    Minus,
    FileText,
    TrendingUp,
    Clock
} from 'lucide-react'

export default function EvaluationEditPage() {
    const router = useRouter()
    const { id } = router.query
    const { user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const [evaluation, setEvaluation] = useState(null)
    const [report, setReport] = useState(null)

    const [formData, setFormData] = useState({
        criteriaScores: [],
        overallComment: '',
        strengths: [],
        improvementAreas: [],
        recommendations: [],
        evidenceAssessment: {
            adequacy: 'adequate',
            relevance: 'fair',
            quality: 'fair',
            missingEvidence: []
        }
    })

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/' },
        { name: 'Đánh giá', href: '/reports/evaluations' },
        { name: 'Chỉnh sửa đánh giá' }
    ]

    useEffect(() => {
        if (id && user) {
            fetchEvaluation()
        }
    }, [id, user])

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!evaluation || evaluation.status !== 'draft') return

        const interval = setInterval(() => {
            handleAutoSave()
        }, 30000)

        return () => clearInterval(interval)
    }, [formData, evaluation])

    const fetchEvaluation = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.evaluations.getById(id)
            const evalData = response.data?.data || response.data

            setEvaluation(evalData)
            setReport(evalData.reportId)

            // Populate form with existing data
            setFormData({
                criteriaScores: evalData.criteriaScores || [],
                overallComment: evalData.overallComment || '',
                strengths: evalData.strengths || [],
                improvementAreas: evalData.improvementAreas || [],
                recommendations: evalData.recommendations || [],
                evidenceAssessment: evalData.evidenceAssessment || {
                    adequacy: 'adequate',
                    relevance: 'fair',
                    quality: 'fair',
                    missingEvidence: []
                }
            })
        } catch (error) {
            console.error('Fetch evaluation error:', error)
            toast.error('Lỗi khi tải thông tin đánh giá')
        } finally {
            setLoading(false)
        }
    }

    const handleAutoSave = useCallback(async () => {
        if (!evaluation || evaluation.status !== 'draft') return

        try {
            await apiMethods.evaluations.autoSave(id, formData)
            setLastSaved(new Date())
        } catch (error) {
            console.error('Auto save error:', error)
        }
    }, [id, formData, evaluation])

    const handleSave = async () => {
        try {
            setSaving(true)
            await apiMethods.evaluations.update(id, formData)
            setLastSaved(new Date())
            toast.success('Lưu đánh giá thành công')
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Lỗi khi lưu đánh giá')
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async () => {
        // Validate
        if (!formData.overallComment.trim()) {
            toast.error('Vui lòng nhập nhận xét tổng thể')
            return
        }

        if (formData.criteriaScores.some(c => c.score === 0)) {
            toast.error('Vui lòng chấm điểm cho tất cả các tiêu chí')
            return
        }

        if (!confirm('Bạn có chắc chắn muốn nộp đánh giá? Sau khi nộp sẽ không thể chỉnh sửa.')) {
            return
        }

        try {
            setSubmitting(true)
            await apiMethods.evaluations.submit(id)
            toast.success('Nộp đánh giá thành công')
            router.push('/reports/evaluations')
        } catch (error) {
            console.error('Submit error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi nộp đánh giá')
        } finally {
            setSubmitting(false)
        }
    }

    const handleScoreChange = (index, value) => {
        const newScores = [...formData.criteriaScores]
        newScores[index] = {
            ...newScores[index],
            score: parseFloat(value) || 0
        }
        setFormData({ ...formData, criteriaScores: newScores })
    }

    const handleCommentChange = (index, value) => {
        const newScores = [...formData.criteriaScores]
        newScores[index] = {
            ...newScores[index],
            comment: value
        }
        setFormData({ ...formData, criteriaScores: newScores })
    }

    const addStrength = () => {
        setFormData({
            ...formData,
            strengths: [...formData.strengths, { point: '', evidenceReference: '' }]
        })
    }

    const removeStrength = (index) => {
        const newStrengths = formData.strengths.filter((_, i) => i !== index)
        setFormData({ ...formData, strengths: newStrengths })
    }

    const addImprovementArea = () => {
        setFormData({
            ...formData,
            improvementAreas: [...formData.improvementAreas, { area: '', recommendation: '', priority: 'medium' }]
        })
    }

    const removeImprovementArea = (index) => {
        const newAreas = formData.improvementAreas.filter((_, i) => i !== index)
        setFormData({ ...formData, improvementAreas: newAreas })
    }

    const addRecommendation = () => {
        setFormData({
            ...formData,
            recommendations: [...formData.recommendations, { recommendation: '', type: 'short_term', priority: 'medium' }]
        })
    }

    const removeRecommendation = (index) => {
        const newRecs = formData.recommendations.filter((_, i) => i !== index)
        setFormData({ ...formData, recommendations: newRecs })
    }

    const calculateAverageScore = () => {
        if (formData.criteriaScores.length === 0) return 0

        let totalWeighted = 0
        let totalMaxWeighted = 0

        formData.criteriaScores.forEach(criteria => {
            const weight = criteria.weight || 1
            totalWeighted += criteria.score * weight
            totalMaxWeighted += criteria.maxScore * weight
        })

        if (totalMaxWeighted === 0) return 0
        return (totalWeighted / totalMaxWeighted) * 10
    }

    const getScoreColor = (score, maxScore) => {
        const percentage = (score / maxScore) * 100
        if (percentage >= 90) return 'text-green-600'
        if (percentage >= 70) return 'text-blue-600'
        if (percentage >= 50) return 'text-yellow-600'
        if (percentage >= 30) return 'text-orange-600'
        return 'text-red-600'
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

    const averageScore = calculateAverageScore()

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
                                <h1 className="text-2xl font-bold mb-1">Đánh giá báo cáo</h1>
                                <p className="text-purple-100">{report?.title}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center space-x-2 mb-1">
                                <Star className="h-6 w-6 text-yellow-300 fill-current" />
                                <span className="text-3xl font-bold">{averageScore.toFixed(2)}</span>
                                <span className="text-purple-200">/ 10</span>
                            </div>
                            {lastSaved && (
                                <p className="text-sm text-purple-200 flex items-center justify-end space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Lưu lần cuối: {new Date(lastSaved).toLocaleTimeString('vi-VN')}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Criteria Scores */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                        Đánh giá theo tiêu chí
                    </h2>
                    <div className="space-y-6">
                        {formData.criteriaScores.map((criteria, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-all">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Điểm số
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={criteria.maxScore}
                                        step="0.5"
                                        value={criteria.score}
                                        onChange={(e) => handleScoreChange(index, e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder={`Nhập điểm (0-${criteria.maxScore})`}
                                    />
                                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                                            style={{ width: `${(criteria.score / criteria.maxScore) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nhận xét chi tiết
                                    </label>
                                    <textarea
                                        value={criteria.comment}
                                        onChange={(e) => handleCommentChange(index, e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Nhập nhận xét cho tiêu chí này..."
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Overall Comment */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-600" />
                        Nhận xét tổng thể *
                    </h2>
                    <textarea
                        value={formData.overallComment}
                        onChange={(e) => setFormData({ ...formData, overallComment: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Nhập nhận xét tổng thể về báo cáo..."
                        required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        {formData.overallComment.length} ký tự
                    </p>
                </div>

                {/* Strengths */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                            Điểm mạnh
                        </h2>
                        <button
                            type="button"
                            onClick={addStrength}
                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-all"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Thêm điểm mạnh
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.strengths.map((strength, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        value={strength.point}
                                        onChange={(e) => {
                                            const newStrengths = [...formData.strengths]
                                            newStrengths[index].point = e.target.value
                                            setFormData({ ...formData, strengths: newStrengths })
                                        }}
                                        className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Điểm mạnh..."
                                    />
                                    <input
                                        type="text"
                                        value={strength.evidenceReference}
                                        onChange={(e) => {
                                            const newStrengths = [...formData.strengths]
                                            newStrengths[index].evidenceReference = e.target.value
                                            setFormData({ ...formData, strengths: newStrengths })
                                        }}
                                        className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                        placeholder="Tham chiếu minh chứng (tùy chọn)..."
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeStrength(index)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {formData.strengths.length === 0 && (
                            <p className="text-center text-gray-500 py-4">Chưa có điểm mạnh nào</p>
                        )}
                    </div>
                </div>

                {/* Improvement Areas */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                            Điểm cần cải thiện
                        </h2>
                        <button
                            type="button"
                            onClick={addImprovementArea}
                            className="inline-flex items-center px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-all"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Thêm điểm cải thiện
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.improvementAreas.map((area, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        value={area.area}
                                        onChange={(e) => {
                                            const newAreas = [...formData.improvementAreas]
                                            newAreas[index].area = e.target.value
                                            setFormData({ ...formData, improvementAreas: newAreas })
                                        }}
                                        className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="Điểm cần cải thiện..."
                                    />
                                    <textarea
                                        value={area.recommendation}
                                        onChange={(e) => {
                                            const newAreas = [...formData.improvementAreas]
                                            newAreas[index].recommendation = e.target.value
                                            setFormData({ ...formData, improvementAreas: newAreas })
                                        }}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                        placeholder="Khuyến nghị cải thiện..."
                                    />
                                    <select
                                        value={area.priority}
                                        onChange={(e) => {
                                            const newAreas = [...formData.improvementAreas]
                                            newAreas[index].priority = e.target.value
                                            setFormData({ ...formData, improvementAreas: newAreas })
                                        }}
                                        className="px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                    >
                                        <option value="low">Ưu tiên thấp</option>
                                        <option value="medium">Ưu tiên trung bình</option>
                                        <option value="high">Ưu tiên cao</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeImprovementArea(index)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        {formData.improvementAreas.length === 0 && (
                            <p className="text-center text-gray-500 py-4">Chưa có điểm cần cải thiện nào</p>
                        )}
                    </div>
                </div>

                {/* Evidence Assessment */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-purple-600" />
                        Đánh giá minh chứng
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tính đầy đủ
                            </label>
                            <select
                                value={formData.evidenceAssessment.adequacy}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    evidenceAssessment: { ...formData.evidenceAssessment, adequacy: e.target.value }
                                })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="insufficient">Chưa đầy đủ</option>
                                <option value="adequate">Đầy đủ</option>
                                <option value="comprehensive">Toàn diện</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tính liên quan
                            </label>
                            <select
                                value={formData.evidenceAssessment.relevance}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    evidenceAssessment: { ...formData.evidenceAssessment, relevance: e.target.value }
                                })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="poor">Kém</option>
                                <option value="fair">Khá</option>
                                <option value="good">Tốt</option>
                                <option value="excellent">Xuất sắc</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chất lượng
                            </label>
                            <select
                                value={formData.evidenceAssessment.quality}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    evidenceAssessment: { ...formData.evidenceAssessment, quality: e.target.value }
                                })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="poor">Kém</option>
                                <option value="fair">Khá</option>
                                <option value="good">Tốt</option>
                                <option value="excellent">Xuất sắc</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                        >
                            Hủy
                        </button>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 font-medium transition-all"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5 mr-2" />
                                        Lưu nháp
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !formData.overallComment.trim()}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Đang nộp...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5 mr-2" />
                                        Nộp đánh giá
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}