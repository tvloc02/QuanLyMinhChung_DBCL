import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import api, { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    Save,
    Send,
    Loader2,
    ArrowLeft,
    AlertCircle,
    CheckCircle,
    Plus,
    Award,
    MessageSquare,
    Zap,
    PenTool,
    Trash2
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function EvaluationForm() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { assignmentId, reportId } = router.query

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Đánh giá' }
    ]

    const [assignment, setAssignment] = useState(null)
    const [report, setReport] = useState(null)
    const [evaluation, setEvaluation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        overallComment: '',
        rating: '',
        evidenceAssessment: {
            adequacy: '',
            relevance: '',
            quality: ''
        },
        strengths: [],
        improvementAreas: [],
        recommendations: []
    })

    const [validationErrors, setValidationErrors] = useState([])
    const [newStrength, setNewStrength] = useState('')
    const [newImprovement, setNewImprovement] = useState({ area: '', recommendation: '', priority: 'medium' })
    const [newRecommendation, setNewRecommendation] = useState({ recommendation: '', type: 'short_term', priority: 'medium' })

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (router.isReady && assignmentId && reportId && user) {
            fetchData()
        }
    }, [router.isReady, assignmentId, reportId, user])

    const fetchData = async () => {
        try {
            setLoading(true)

            const assignmentRes = await apiMethods.assignments.getById(assignmentId)
            const assignmentData = assignmentRes.data?.data
            setAssignment(assignmentData)

            const reportRes = await apiMethods.reports.getById(reportId)
            const reportData = reportRes.data?.data
            setReport(reportData)

            try {
                const evaluationsRes = await apiMethods.evaluations.getAll({
                    assignmentId,
                    limit: 1
                })
                if (evaluationsRes.data?.data?.evaluations?.length > 0) {
                    const existingEval = evaluationsRes.data.data.evaluations[0]
                    setEvaluation(existingEval)
                    setFormData(prev => ({
                        ...prev,
                        overallComment: existingEval.overallComment || '',
                        rating: existingEval.rating || '',
                        evidenceAssessment: existingEval.evidenceAssessment || prev.evidenceAssessment,
                        strengths: existingEval.strengths || [],
                        improvementAreas: existingEval.improvementAreas || [],
                        recommendations: existingEval.recommendations || []
                    }))
                }
            } catch (err) {
                console.log('No existing evaluation found, creating new one')
            }
        } catch (error) {
            console.error('Fetch data error:', error)
            toast.error('Lỗi khi tải dữ liệu')
            setTimeout(() => router.back(), 1000)
        } finally {
            setLoading(false)
        }
    }

    const handleAutoSave = async () => {
        if (!evaluation) return

        try {
            setSaving(true)
            await apiMethods.evaluations.autoSave(evaluation._id, formData)
            toast.success('Lưu tự động thành công')
        } catch (error) {
            console.error('Auto save error:', error)
            toast.error('Lỗi khi lưu tự động')
        } finally {
            setSaving(false)
        }
    }

    const handleAddStrength = () => {
        if (!newStrength.trim()) {
            toast.error('Vui lòng nhập điểm mạnh')
            return
        }
        setFormData(prev => ({
            ...prev,
            strengths: [...prev.strengths, { point: newStrength, evidenceReference: '' }]
        }))
        setNewStrength('')
        toast.success('Thêm điểm mạnh thành công')
    }

    const handleRemoveStrength = (index) => {
        setFormData(prev => ({
            ...prev,
            strengths: prev.strengths.filter((_, i) => i !== index)
        }))
    }

    const handleAddImprovement = () => {
        if (!newImprovement.area.trim()) {
            toast.error('Vui lòng nhập điểm cần cải thiện')
            return
        }
        setFormData(prev => ({
            ...prev,
            improvementAreas: [...prev.improvementAreas, newImprovement]
        }))
        setNewImprovement({ area: '', recommendation: '', priority: 'medium' })
        toast.success('Thêm điểm cần cải thiện thành công')
    }

    const handleRemoveImprovement = (index) => {
        setFormData(prev => ({
            ...prev,
            improvementAreas: prev.improvementAreas.filter((_, i) => i !== index)
        }))
    }

    const handleAddRecommendation = () => {
        if (!newRecommendation.recommendation.trim()) {
            toast.error('Vui lòng nhập khuyến nghị')
            return
        }
        setFormData(prev => ({
            ...prev,
            recommendations: [...prev.recommendations, newRecommendation]
        }))
        setNewRecommendation({ recommendation: '', type: 'short_term', priority: 'medium' })
        toast.success('Thêm khuyến nghị thành công')
    }

    const handleRemoveRecommendation = (index) => {
        setFormData(prev => ({
            ...prev,
            recommendations: prev.recommendations.filter((_, i) => i !== index)
        }))
    }

    const validateForm = () => {
        const errors = []

        if (!formData.overallComment || formData.overallComment.trim() === '') {
            errors.push('Nhận xét tổng thể là bắt buộc')
        }

        const validRatings = ['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor']
        if (!formData.rating || !validRatings.includes(formData.rating)) {
            errors.push('Xếp loại đánh giá là bắt buộc và phải hợp lệ')
        }

        const validAdequacy = ['insufficient', 'adequate', 'comprehensive']
        if (!formData.evidenceAssessment?.adequacy || !validAdequacy.includes(formData.evidenceAssessment.adequacy)) {
            errors.push('Tính đầy đủ minh chứng là bắt buộc và phải hợp lệ')
        }

        const validRelevanceQuality = ['poor', 'fair', 'good', 'excellent']
        if (!formData.evidenceAssessment?.relevance || !validRelevanceQuality.includes(formData.evidenceAssessment.relevance)) {
            errors.push('Tính liên quan minh chứng là bắt buộc và phải hợp lệ')
        }

        if (!formData.evidenceAssessment?.quality || !validRelevanceQuality.includes(formData.evidenceAssessment.quality)) {
            errors.push('Chất lượng minh chứng là bắt buộc và phải hợp lệ')
        }

        setValidationErrors(errors)
        return errors.length === 0
    }

    const handleSubmit = async () => {
        if (!evaluation) {
            try {
                setLoading(true)
                const evalRes = await apiMethods.evaluations.create({ assignmentId })
                setEvaluation(evalRes.data?.data)
                toast.success('Tạo đánh giá thành công')
            } catch (error) {
                console.error('Create evaluation error:', error)
                toast.error('Lỗi khi tạo đánh giá')
                setLoading(false)
                return
            } finally {
                setLoading(false)
            }
        }

        if (!validateForm()) {
            toast.error('Vui lòng kiểm tra các lỗi validation')
            return
        }

        try {
            setSubmitting(true)

            await apiMethods.evaluations.update(evaluation._id, formData)
            toast('Đang cập nhật và nộp...', { icon: '🔄' });

            await apiMethods.evaluations.submit(evaluation._id)
            toast.success('Nộp đánh giá thành công')
            setTimeout(() => router.push('/evaluations/my-evaluations'), 1500)
        } catch (error) {
            console.error('Submit error:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi khi nộp đánh giá';

            if (error.response?.data?.errors?.length > 0) {
                toast.error(`${errorMessage}: ${error.response.data.errors.join(', ')}`, { duration: 6000 });
            } else {
                toast.error(errorMessage)
            }

        } finally {
            setSubmitting(false)
        }
    }

    const handleSaveDraft = async () => {
        if (!evaluation) {
            try {
                setLoading(true)
                const evalRes = await apiMethods.evaluations.create({ assignmentId })
                setEvaluation(evalRes.data?.data)
                toast.success('Tạo bản nháp thành công')
            } catch (error) {
                console.error('Create evaluation error:', error)
                toast.error('Lỗi khi tạo bản nháp')
            } finally {
                setLoading(false)
            }
        } else {
            await handleAutoSave()
        }
    }

    const getProgress = () => {
        let completed = 0
        const total = 5

        if (formData.overallComment && formData.overallComment.trim()) completed++
        if (formData.rating) completed++
        if (formData.evidenceAssessment?.adequacy) completed++
        if (formData.evidenceAssessment?.relevance) completed++
        if (formData.evidenceAssessment?.quality) completed++

        const baseProgress = Math.round((completed / total) * 100)

        return Math.min(baseProgress, 100)
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

    if (!user || user.role !== 'expert') {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <h3 className="text-red-800 font-bold">Lỗi truy cập</h3>
                    <p className="text-red-600">Chỉ chuyên gia đánh giá có thể tạo đánh giá</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6 max-w-8xl mx-auto">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <PenTool className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Đánh giá báo cáo</h1>
                                <p className="text-blue-100">
                                    {report?.title}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.back()}
                            className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-all"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Mã báo cáo</p>
                        <p className="text-2xl font-bold text-gray-900">{report?.code}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Hạn chót</p>
                        <p className="text-2xl font-bold text-gray-900">{formatDate(assignment?.deadline)}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <p className="text-gray-600 text-sm font-semibold mb-2">Tiến độ</p>
                        <div className="flex items-center space-x-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                                    style={{ width: `${getProgress()}%` }}
                                />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">{getProgress()}%</span>
                        </div>
                    </div>
                </div>

                {validationErrors.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl">
                        <h3 className="text-red-800 font-bold mb-3 flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            Lỗi Validation
                        </h3>
                        <ul className="space-y-1">
                            {validationErrors.map((error, idx) => (
                                <li key={idx} className="text-red-700 text-sm">
                                    • {error}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
                            Nhận xét tổng thể <span className="text-red-500 ml-1">*</span>
                        </h2>
                        <textarea
                            value={formData.overallComment}
                            onChange={(e) => setFormData(prev => ({ ...prev, overallComment: e.target.value }))}
                            placeholder="Nhập nhận xét chi tiết về báo cáo..."
                            rows={6}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            {formData.overallComment.length} / 5000 ký tự
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Award className="h-6 w-6 mr-2 text-green-600" />
                                Xếp loại đánh giá <span className="text-red-500 ml-1">*</span>
                            </h2>
                            <div className="space-y-3">
                                {[
                                    { value: 'excellent', label: 'Xuất sắc', color: 'border-green-500 bg-green-50' },
                                    { value: 'good', label: 'Tốt', color: 'border-blue-500 bg-blue-50' },
                                    { value: 'satisfactory', label: 'Đạt yêu cầu', color: 'border-yellow-500 bg-yellow-50' },
                                    { value: 'needs_improvement', label: 'Cần cải thiện', color: 'border-orange-500 bg-orange-50' },
                                    { value: 'poor', label: 'Kém', color: 'border-red-500 bg-red-50' }
                                ].map(option => (
                                    <label
                                        key={option.value}
                                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                            formData.rating === option.value
                                                ? `${option.color} border-2`
                                                : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="rating"
                                            value={option.value}
                                            checked={formData.rating === option.value}
                                            onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="ml-3 font-semibold text-gray-900">{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Đánh giá minh chứng</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tính đầy đủ <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.evidenceAssessment?.adequacy || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            evidenceAssessment: { ...prev.evidenceAssessment, adequacy: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">-- Chọn --</option>
                                        <option value="insufficient">Chưa đủ</option>
                                        <option value="adequate">Đủ</option>
                                        <option value="comprehensive">Toàn diện</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tính liên quan <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.evidenceAssessment?.relevance || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            evidenceAssessment: { ...prev.evidenceAssessment, relevance: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">-- Chọn --</option>
                                        <option value="poor">Kém</option>
                                        <option value="fair">Trung bình</option>
                                        <option value="good">Tốt</option>
                                        <option value="excellent">Xuất sắc</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Chất lượng <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.evidenceAssessment?.quality || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            evidenceAssessment: { ...prev.evidenceAssessment, quality: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-green-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                            Điểm mạnh (Tùy chọn)
                        </h2>
                        <div className="space-y-3 mb-4">
                            {formData.strengths.map((strength, idx) => (
                                <div key={idx} className="flex items-start justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                    <span className="text-gray-900">{strength.point}</span>
                                    <button
                                        onClick={() => handleRemoveStrength(idx)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newStrength}
                                onChange={(e) => setNewStrength(e.target.value)}
                                placeholder="Thêm điểm mạnh..."
                                className="flex-1 px-4 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddStrength()}
                            />
                            <button
                                onClick={handleAddStrength}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <Zap className="h-6 w-6 mr-2 text-orange-600" />
                            Điểm cần cải thiện (Tùy chọn)
                        </h2>
                        <div className="space-y-3 mb-4">
                            {formData.improvementAreas.map((area, idx) => (
                                <div key={idx} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-gray-900 font-semibold">{area.area}</span>
                                        <button
                                            onClick={() => handleRemoveImprovement(idx)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {area.recommendation && (
                                        <p className="text-sm text-gray-600">Khuyến nghị: {area.recommendation}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={newImprovement.area}
                                onChange={(e) => setNewImprovement(prev => ({ ...prev, area: e.target.value }))}
                                placeholder="Điểm cần cải thiện..."
                                className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <textarea
                                value={newImprovement.recommendation}
                                onChange={(e) => setNewImprovement(prev => ({ ...prev, recommendation: e.target.value }))}
                                placeholder="Khuyến nghị cải thiện..."
                                rows={2}
                                className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                            />
                            <button
                                onClick={handleAddImprovement}
                                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold flex items-center justify-center"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <MessageSquare className="h-6 w-6 mr-2 text-purple-600" />
                            Khuyến nghị (Tùy chọn)
                        </h2>
                        <div className="space-y-3 mb-4">
                            {formData.recommendations.map((rec, idx) => (
                                <div key={idx} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <span className="text-gray-900 font-semibold">{rec.recommendation}</span>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded">
                                                    {rec.type === 'immediate' ? 'Ngay lập tức' : rec.type === 'short_term' ? 'Ngắn hạn' : 'Dài hạn'}
                                                </span>
                                                <span className="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded">
                                                    {rec.priority === 'low' ? 'Thấp' : rec.priority === 'medium' ? 'Trung bình' : 'Cao'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveRecommendation(idx)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <textarea
                                value={newRecommendation.recommendation}
                                onChange={(e) => setNewRecommendation(prev => ({ ...prev, recommendation: e.target.value }))}
                                placeholder="Thêm khuyến nghị..."
                                rows={2}
                                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={newRecommendation.type}
                                    onChange={(e) => setNewRecommendation(prev => ({ ...prev, type: e.target.value }))}
                                    className="px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="immediate">Ngay lập tức</option>
                                    <option value="short_term">Ngắn hạn</option>
                                    <option value="long_term">Dài hạn</option>
                                </select>
                                <select
                                    value={newRecommendation.priority}
                                    onChange={(e) => setNewRecommendation(prev => ({ ...prev, priority: e.target.value }))}
                                    className="px-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="low">Thấp</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="high">Cao</option>
                                </select>
                            </div>
                            <button
                                onClick={handleAddRecommendation}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm khuyến nghị
                            </button>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-2xl p-6 flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="h-6 w-6" />
                        <span className="font-semibold">
                            {getProgress() === 100 ? 'Đánh giá đã sẵn sàng' : 'Hoàn thành form để nộp'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-3 border-2 border-white rounded-lg hover:bg-white hover:text-blue-600 transition-all font-semibold"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all font-semibold flex items-center disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Lưu nháp
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || getProgress() !== 100}
                            className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:shadow-lg transition-all font-semibold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang nộp...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Nộp đánh giá
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    )
}