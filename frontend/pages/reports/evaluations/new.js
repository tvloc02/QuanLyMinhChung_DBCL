import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import { apiMethods } from '../../../services/api'
import {
    Save,
    Send,
    FileText,
    AlertCircle,
    Plus,
    Trash2,
    ArrowLeft,
    BookOpen,
    Clock
} from 'lucide-react'
import { formatDate } from '../../../utils/helpers'
import toast from 'react-hot-toast'

const getRatingColor = (rating) => {
    const colors = {
        excellent: 'text-green-600',
        good: 'text-blue-600',
        satisfactory: 'text-yellow-600',
        needs_improvement: 'text-orange-600',
        poor: 'text-red-600'
    }
    return colors[rating] || 'text-gray-600'
}

export default function EvaluationFormPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { id, assignmentId } = router.query

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [evaluation, setEvaluation] = useState(null)
    const [assignment, setAssignment] = useState(null)
    const [report, setReport] = useState(null)
    const [progress, setProgress] = useState(0)

    const [formData, setFormData] = useState({
        criteriaScores: [],
        overallComment: '',
        strengths: [],
        improvementAreas: [],
        recommendations: [],
        evidenceAssessment: {
            adequacy: 'adequate',
            relevance: 'fair',
            quality: 'fair'
        }
    })

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'expert' && router.isReady) {
            if (id) {
                fetchEvaluation()
            } else if (assignmentId) {
                fetchAssignmentAndCreateEvaluation()
            }
        }
    }, [user, id, assignmentId, router.isReady])

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Đánh giá', path: '/reports/evaluations' },
        { name: id ? 'Chỉnh sửa' : 'Tạo mới', icon: BookOpen }
    ]

    const fetchEvaluation = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.evaluations.getById(id)
            const data = response.data?.data || response.data

            setEvaluation(data)
            setReport(data.reportId)
            setFormData({
                criteriaScores: data.criteriaScores || [],
                overallComment: data.overallComment || '',
                strengths: data.strengths || [],
                improvementAreas: data.improvementAreas || [],
                recommendations: data.recommendations || [],
                evidenceAssessment: data.evidenceAssessment || {
                    adequacy: 'adequate',
                    relevance: 'fair',
                    quality: 'fair'
                }
            })
            calculateProgress(data)
        } catch (error) {
            console.error('Error fetching evaluation:', error)
            toast.error('Lỗi tải đánh giá')
            router.push('/reports/evaluations')
        } finally {
            setLoading(false)
        }
    }

    const fetchAssignmentAndCreateEvaluation = async () => {
        try {
            setLoading(true)
            const assignmentRes = await apiMethods.assignments.getById(assignmentId)
            const assignmentData = assignmentRes.data?.data || assignmentRes.data

            setAssignment(assignmentData)
            setReport(assignmentData.reportId)

            // Initialize form with criteria from assignment
            const criteriaScores = assignmentData.evaluationCriteria?.map(criteria => ({
                criteriaName: criteria.name,
                maxScore: criteria.maxScore,
                score: 0,
                weight: criteria.weight || 1,
                comment: ''
            })) || []

            setFormData(prev => ({
                ...prev,
                criteriaScores
            }))
        } catch (error) {
            console.error('Error fetching assignment:', error)
            toast.error('Lỗi tải phân quyền')
            router.push('/reports/expert-assignments')
        } finally {
            setLoading(false)
        }
    }

    const calculateProgress = (data = null) => {
        const currentEval = data || evaluation
        if (!currentEval) return

        let completed = 0
        let total = 5

        if (currentEval.overallComment) completed++
        if (currentEval.rating) completed++
        if (currentEval.evidenceAssessment?.adequacy) completed++
        if (currentEval.evidenceAssessment?.relevance) completed++
        if (currentEval.evidenceAssessment?.quality) completed++

        setProgress(Math.round((completed / total) * 100))
    }

    const handleCriteriaScoreChange = (index, field, value) => {
        const updated = [...formData.criteriaScores]
        updated[index] = { ...updated[index], [field]: value }
        setFormData({ ...formData, criteriaScores: updated })
    }

    const handleAddStrength = () => {
        setFormData({
            ...formData,
            strengths: [...formData.strengths, { point: '', evidenceReference: '' }]
        })
    }

    const handleRemoveStrength = (index) => {
        setFormData({
            ...formData,
            strengths: formData.strengths.filter((_, i) => i !== index)
        })
    }

    const handleStrengthChange = (index, field, value) => {
        const updated = [...formData.strengths]
        updated[index] = { ...updated[index], [field]: value }
        setFormData({ ...formData, strengths: updated })
    }

    const handleAddImprovement = () => {
        setFormData({
            ...formData,
            improvementAreas: [...formData.improvementAreas, { area: '', recommendation: '', priority: 'medium' }]
        })
    }

    const handleRemoveImprovement = (index) => {
        setFormData({
            ...formData,
            improvementAreas: formData.improvementAreas.filter((_, i) => i !== index)
        })
    }

    const handleImprovementChange = (index, field, value) => {
        const updated = [...formData.improvementAreas]
        updated[index] = { ...updated[index], [field]: value }
        setFormData({ ...formData, improvementAreas: updated })
    }

    const handleAddRecommendation = () => {
        setFormData({
            ...formData,
            recommendations: [...formData.recommendations, { recommendation: '', type: 'short_term', priority: 'medium' }]
        })
    }

    const handleRemoveRecommendation = (index) => {
        setFormData({
            ...formData,
            recommendations: formData.recommendations.filter((_, i) => i !== index)
        })
    }

    const handleRecommendationChange = (index, field, value) => {
        const updated = [...formData.recommendations]
        updated[index] = { ...updated[index], [field]: value }
        setFormData({ ...formData, recommendations: updated })
    }

    const handleAutoSave = async () => {
        try {
            await apiMethods.evaluations.autoSave(id, formData)
            // Silently auto-save
        } catch (error) {
            console.error('Auto-save error:', error)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            await apiMethods.evaluations.update(id, formData)
            toast.success('Đánh giá đã được lưu')
            fetchEvaluation()
        } catch (error) {
            console.error('Error saving:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi lưu đánh giá')
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async () => {
        if (!formData.overallComment.trim()) {
            toast.error('Vui lòng nhập nhận xét tổng thể')
            return
        }

        if (!window.confirm('Xác nhận nộp đánh giá? Sau khi nộp sẽ không thể chỉnh sửa.')) {
            return
        }

        try {
            setSubmitting(true)
            await apiMethods.evaluations.submit(id)
            toast.success('Đánh giá đã được nộp')
            router.push('/reports/evaluations')
        } catch (error) {
            console.error('Error submitting:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi nộp đánh giá')
        } finally {
            setSubmitting(false)
        }
    }

    if (isLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (user.role !== 'expert') {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-red-800 font-semibold">Lỗi truy cập</h3>
                    <p className="text-red-600">Trang này chỉ dành cho chuyên gia đánh giá</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title={id ? 'Chỉnh sửa đánh giá' : 'Tạo đánh giá'} breadcrumbItems={breadcrumbItems}>
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
                                {report?.title}
                            </h1>
                            <p className="text-gray-600">{report?.code}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">Tiến độ</p>
                            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{progress}% hoàn thành</p>
                        </div>
                    </div>
                </div>

                {/* Criteria Scores */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Điểm theo tiêu chí</h2>

                    <div className="space-y-4">
                        {formData.criteriaScores.map((criteria, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{criteria.criteriaName}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Trọng số: {(criteria.weight * 100).toFixed(0)}% | Điểm tối đa: {criteria.maxScore}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max={criteria.maxScore}
                                            value={criteria.score}
                                            onChange={(e) => handleCriteriaScoreChange(idx, 'score', parseFloat(e.target.value))}
                                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-600">/ {criteria.maxScore}</span>
                                    </div>
                                </div>

                                <textarea
                                    value={criteria.comment}
                                    onChange={(e) => handleCriteriaScoreChange(idx, 'comment', e.target.value)}
                                    placeholder="Bình luận cho tiêu chí này..."
                                    maxLength={2000}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {criteria.comment?.length || 0}/2000 ký tự
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Overall Comment */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Nhận xét tổng thể</h2>

                    <textarea
                        value={formData.overallComment}
                        onChange={(e) => setFormData({ ...formData, overallComment: e.target.value })}
                        placeholder="Nhập nhận xét tổng thể về báo cáo..."
                        maxLength={5000}
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {formData.overallComment?.length || 0}/5000 ký tự
                    </p>
                </div>

                {/* Evidence Assessment */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Đánh giá minh chứng</h2>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Tính đầy đủ
                            </label>
                            <select
                                value={formData.evidenceAssessment.adequacy}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    evidenceAssessment: {
                                        ...formData.evidenceAssessment,
                                        adequacy: e.target.value
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="insufficient">Không đủ</option>
                                <option value="adequate">Đủ</option>
                                <option value="comprehensive">Toàn diện</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Tính liên quan
                            </label>
                            <select
                                value={formData.evidenceAssessment.relevance}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    evidenceAssessment: {
                                        ...formData.evidenceAssessment,
                                        relevance: e.target.value
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="poor">Kém</option>
                                <option value="fair">Trung bình</option>
                                <option value="good">Tốt</option>
                                <option value="excellent">Xuất sắc</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Chất lượng
                            </label>
                            <select
                                value={formData.evidenceAssessment.quality}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    evidenceAssessment: {
                                        ...formData.evidenceAssessment,
                                        quality: e.target.value
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="poor">Kém</option>
                                <option value="fair">Trung bình</option>
                                <option value="good">Tốt</option>
                                <option value="excellent">Xuất sắc</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Strengths */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Điểm mạnh</h2>
                        <button
                            onClick={handleAddStrength}
                            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Thêm
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.strengths.map((strength, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4 flex gap-3">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        value={strength.point}
                                        onChange={(e) => handleStrengthChange(idx, 'point', e.target.value)}
                                        placeholder="Mô tả điểm mạnh..."
                                        maxLength={500}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={strength.evidenceReference}
                                        onChange={(e) => handleStrengthChange(idx, 'evidenceReference', e.target.value)}
                                        placeholder="Tham chiếu minh chứng..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    onClick={() => handleRemoveStrength(idx)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Improvement Areas */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Cần cải thiện</h2>
                        <button
                            onClick={handleAddImprovement}
                            className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Thêm
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.improvementAreas.map((area, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4 flex gap-3">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        value={area.area}
                                        onChange={(e) => handleImprovementChange(idx, 'area', e.target.value)}
                                        placeholder="Mô tả lĩnh vực cần cải thiện..."
                                        maxLength={500}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <textarea
                                        value={area.recommendation}
                                        onChange={(e) => handleImprovementChange(idx, 'recommendation', e.target.value)}
                                        placeholder="Khuyến nghị..."
                                        maxLength={1000}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                    <select
                                        value={area.priority}
                                        onChange={(e) => handleImprovementChange(idx, 'priority', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Ưu tiên thấp</option>
                                        <option value="medium">Ưu tiên trung bình</option>
                                        <option value="high">Ưu tiên cao</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => handleRemoveImprovement(idx)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Khuyến nghị</h2>
                        <button
                            onClick={handleAddRecommendation}
                            className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Thêm
                        </button>
                    </div>

                    <div className="space-y-3">
                        {formData.recommendations.map((rec, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4 flex gap-3">
                                <div className="flex-1 space-y-2">
                                    <textarea
                                        value={rec.recommendation}
                                        onChange={(e) => handleRecommendationChange(idx, 'recommendation', e.target.value)}
                                        placeholder="Nội dung khuyến nghị..."
                                        maxLength={1000}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={rec.type}
                                            onChange={(e) => handleRecommendationChange(idx, 'type', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="immediate">Ngay lập tức</option>
                                            <option value="short_term">Ngắn hạn</option>
                                            <option value="long_term">Dài hạn</option>
                                        </select>
                                        <select
                                            value={rec.priority}
                                            onChange={(e) => handleRecommendationChange(idx, 'priority', e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="low">Ưu tiên thấp</option>
                                            <option value="medium">Ưu tiên trung bình</option>
                                            <option value="high">Ưu tiên cao</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveRecommendation(idx)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg shadow-lg">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || progress < 100}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {submitting ? 'Đang nộp...' : 'Nộp đánh giá'}
                    </button>
                </div>
            </div>
        </Layout>
    )
}