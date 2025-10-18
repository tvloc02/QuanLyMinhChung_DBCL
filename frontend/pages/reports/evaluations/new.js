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

    // ✅ FIXED: Only send required fields to backend
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
        if (currentEval.rating && currentEval.rating !== 'satisfactory') completed++

        setProgress(Math.round((completed / total) * 100))
    }

    const handleCriteriaScoreChange = (index, field, value) => {
        const updated = [...formData.criteriaScores]
        updated[index] = { ...updated[index], [field]: value }
        setFormData({ ...formData, criteriaScores: updated })
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            // ✅ FIXED: Only send required fields
            const submitData = {
                criteriaScores: formData.criteriaScores,
                overallComment: formData.overallComment,
                rating: formData.rating,
                evidenceAssessment: formData.evidenceAssessment
            }

            await apiMethods.evaluations.update(id, submitData)
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
                                                value={criteria.score}
                                                onChange={(e) => handleCriteriaScoreChange(idx, 'score', parseFloat(e.target.value) || 0)}
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
                )}

                {/* Rating Selection */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Xếp loại đánh giá</h2>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                            { value: 'poor', label: 'Kém', color: 'red' },
                            { value: 'needs_improvement', label: 'Cần cải thiện', color: 'orange' },
                            { value: 'satisfactory', label: 'Đạt yêu cầu', color: 'yellow' },
                            { value: 'good', label: 'Tốt', color: 'blue' },
                            { value: 'excellent', label: 'Xuất sắc', color: 'green' }
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFormData({ ...formData, rating: option.value })}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    formData.rating === option.value
                                        ? `border-${option.color}-500 bg-${option.color}-50`
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <p className="font-medium text-sm text-gray-900">{option.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Overall Comment */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Nhận xét tổng thể</h2>

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
                        disabled={submitting || !formData.overallComment.trim()}
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