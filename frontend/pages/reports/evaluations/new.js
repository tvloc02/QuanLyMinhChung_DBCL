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
    ArrowLeft,
    BookOpen,
} from 'lucide-react'
import { formatDate } from '../../../utils/helpers'
import toast from 'react-hot-toast'

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
        rating: 'satisfactory',
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
                rating: data.rating || 'satisfactory',
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
        let total = 2

        if (currentEval.overallComment) completed++
        if (currentEval.rating) completed++

        setProgress(Math.round((completed / total) * 100))
    }

    const handleCriteriaScoreChange = (index, field, value) => {
        const updated = [...formData.criteriaScores]
        updated[index] = { ...updated[index], [field]: value }
        setFormData({ ...formData, criteriaScores: updated })
    }

    // ✅ Calculate scores like backend does
    const calculateScoresForSubmit = (criteriaScores) => {
        if (!criteriaScores || criteriaScores.length === 0) {
            return {
                totalScore: 0,
                maxTotalScore: 0,
                averageScore: 0
            }
        }

        let totalWeightedScore = 0
        let totalMaxWeightedScore = 0
        let totalWeight = 0

        criteriaScores.forEach(criteria => {
            const weight = criteria.weight || 1
            totalWeightedScore += (criteria.score || 0) * weight
            totalMaxWeightedScore += criteria.maxScore * weight
            totalWeight += weight
        })

        const totalScore = Math.round(totalWeightedScore * 100) / 100
        const maxTotalScore = Math.round(totalMaxWeightedScore * 100) / 100
        let averageScore = 0

        if (totalMaxWeightedScore > 0) {
            averageScore = Math.round((totalWeightedScore / totalMaxWeightedScore) * 10 * 100) / 100
        }

        return { totalScore, maxTotalScore, averageScore }
    }

    // ✅ Auto-calculate rating based on average score
    const calculateRatingFromScore = (averageScore) => {
        if (averageScore >= 9) return 'excellent'
        if (averageScore >= 7) return 'good'
        if (averageScore >= 5) return 'satisfactory'
        if (averageScore >= 3) return 'needs_improvement'
        return 'poor'
    }

    const handleSave = async () => {
        try {
            // ✅ Validate required fields
            if (!formData.overallComment.trim()) {
                toast.error('Vui lòng nhập nhận xét tổng thể')
                return
            }

            if (!formData.evidenceAssessment.adequacy) {
                toast.error('Vui lòng chọn tính đầy đủ minh chứng')
                return
            }

            if (!formData.evidenceAssessment.relevance) {
                toast.error('Vui lòng chọn tính liên quan minh chứng')
                return
            }

            if (!formData.evidenceAssessment.quality) {
                toast.error('Vui lòng chọn chất lượng minh chứng')
                return
            }

            setSaving(true)

            // ✅ Calculate scores
            const scores = calculateScoresForSubmit(formData.criteriaScores)
            const autoRating = calculateRatingFromScore(scores.averageScore)

            // ✅ Only send fields that backend expects
            const submitData = {
                criteriaScores: formData.criteriaScores,
                overallComment: formData.overallComment.trim(),
                rating: autoRating,
                totalScore: scores.totalScore,
                maxTotalScore: scores.maxTotalScore,
                averageScore: scores.averageScore,
                evidenceAssessment: {
                    adequacy: formData.evidenceAssessment.adequacy,
                    relevance: formData.evidenceAssessment.relevance,
                    quality: formData.evidenceAssessment.quality
                }
            }

            console.log('📤 Sending evaluation data:', submitData)

            await apiMethods.evaluations.update(id, submitData)
            toast.success('Đánh giá đã được lưu')

            // Refresh to see updated data
            setTimeout(() => {
                fetchEvaluation()
            }, 500)
        } catch (error) {
            console.error('❌ Error saving:', error.response?.data || error.message)
            toast.error(error.response?.data?.message || 'Lỗi khi lưu đánh giá')
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async () => {
        try {
            if (!formData.overallComment.trim()) {
                toast.error('Vui lòng nhập nhận xét tổng thể')
                return
            }

            if (!window.confirm('Xác nhận nộp đánh giá? Sau khi nộp sẽ không thể chỉnh sửa.')) {
                return
            }

            setSubmitting(true)
            console.log('📤 Submitting evaluation ID:', id)

            await apiMethods.evaluations.submit(id)
            toast.success('Đánh giá đã được nộp')
            router.push('/reports/evaluations')
        } catch (error) {
            console.error('❌ Error submitting:', error.response?.data || error.message)
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

    if (user && user.role !== 'expert') {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-red-800 font-semibold">Lỗi truy cập</h3>
                    <p className="text-red-600">Trang này chỉ dành cho chuyên gia đánh giá</p>
                </div>
            </Layout>
        )
    }

    const scores = calculateScoresForSubmit(formData.criteriaScores)

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

                {/* Score Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Tóm tắt điểm số</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Điểm tổng</p>
                            <p className="text-2xl font-bold text-blue-600">{scores.totalScore}</p>
                            <p className="text-xs text-gray-600 mt-1">/ {scores.maxTotalScore}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Điểm trung bình</p>
                            <p className="text-2xl font-bold text-indigo-600">{scores.averageScore?.toFixed(2)}</p>
                            <p className="text-xs text-gray-600 mt-1">/ 10</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Xếp loại</p>
                            <p className="text-sm font-bold text-gray-900">
                                {calculateRatingFromScore(scores.averageScore) === 'excellent' && '⭐ Xuất sắc'}
                                {calculateRatingFromScore(scores.averageScore) === 'good' && '✅ Tốt'}
                                {calculateRatingFromScore(scores.averageScore) === 'satisfactory' && '👍 Đạt yêu cầu'}
                                {calculateRatingFromScore(scores.averageScore) === 'needs_improvement' && '⚠️ Cần cải thiện'}
                                {calculateRatingFromScore(scores.averageScore) === 'poor' && '❌ Kém'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Criteria Scores */}
                {formData.criteriaScores.length > 0 && (
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
                                                step="0.5"
                                                value={criteria.score || 0}
                                                onChange={(e) => handleCriteriaScoreChange(idx, 'score', parseFloat(e.target.value) || 0)}
                                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-600">/ {criteria.maxScore}</span>
                                        </div>
                                    </div>

                                    <textarea
                                        value={criteria.comment || ''}
                                        onChange={(e) => handleCriteriaScoreChange(idx, 'comment', e.target.value)}
                                        placeholder="Bình luận cho tiêu chí này..."
                                        maxLength={2000}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(criteria.comment || '').length}/2000 ký tự
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Overall Comment */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Nhận xét tổng thể</h2>
                        <span className="text-xs text-gray-500">
                            {formData.overallComment.length}/5000 ký tự
                        </span>
                    </div>

                    <textarea
                        value={formData.overallComment}
                        onChange={(e) => {
                            setFormData({ ...formData, overallComment: e.target.value })
                            calculateProgress()
                        }}
                        placeholder="Nhập nhận xét tổng thể về báo cáo..."
                        maxLength={5000}
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />

                    {!formData.overallComment.trim() && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">Nhận xét tổng thể là bắt buộc</p>
                        </div>
                    )}
                </div>

                {/* Evidence Assessment */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Đánh giá minh chứng</h2>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Tính đầy đủ <span className="text-red-600">*</span>
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
                                <option value="">-- Chọn --</option>
                                <option value="insufficient">Không đủ</option>
                                <option value="adequate">Đủ</option>
                                <option value="comprehensive">Toàn diện</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Tính liên quan <span className="text-red-600">*</span>
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
                                <option value="">-- Chọn --</option>
                                <option value="poor">Kém</option>
                                <option value="fair">Trung bình</option>
                                <option value="good">Tốt</option>
                                <option value="excellent">Xuất sắc</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Chất lượng <span className="text-red-600">*</span>
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
                                <option value="">-- Chọn --</option>
                                <option value="poor">Kém</option>
                                <option value="fair">Trung bình</option>
                                <option value="good">Tốt</option>
                                <option value="excellent">Xuất sắc</option>
                            </select>
                        </div>
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
                        disabled={saving || !formData.overallComment.trim()}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    {evaluation?.status === 'draft' && (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !formData.overallComment.trim()}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {submitting ? 'Đang nộp...' : 'Nộp đánh giá'}
                        </button>
                    )}
                </div>
            </div>
        </Layout>
    )
}