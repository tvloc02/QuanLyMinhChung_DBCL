import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    Save, Send, Loader2, ArrowLeft, AlertCircle, CheckCircle, Plus, Award, MessageSquare, Zap, PenTool, Trash2, BookOpen, ClipboardCheck, Target
} from 'lucide-react'

export default function EvaluationForm() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { assignmentId, reportId } = router.query

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Đánh giá' }
    ]

    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // State chính
    const [evaluationData, setEvaluationData] = useState({
        _id: null,
        overallComment: '',
        score: null, // Điểm số 1-7
        evidenceAssessment: {
            adequacy: '',
            relevance: '',
            quality: ''
        },
        strengths: [],
        improvementAreas: [],
        recommendations: []
    })

    const [newStrength, setNewStrength] = useState('')
    const [newImprovement, setNewImprovement] = useState({ area: '', recommendation: '', priority: 'medium' })
    const [newRecommendation, setNewRecommendation] = useState({ recommendation: '', type: 'short_term', priority: 'medium' })
    const [validationErrors, setValidationErrors] = useState([])

    useEffect(() => {
        if (!isLoading && !user) router.replace('/login')
    }, [user, isLoading, router])

    useEffect(() => {
        if (router.isReady && assignmentId && reportId && user) {
            fetchData()
        }
    }, [router.isReady, assignmentId, reportId, user])

    const fetchData = async () => {
        try {
            setLoading(true)
            const reportRes = await apiMethods.reports.getById(reportId)
            setReport(reportRes.data?.data)

            const existingRes = await apiMethods.evaluations.getAll({ assignmentId, limit: 1 })

            if (existingRes.data?.data?.evaluations?.length > 0) {
                const existEval = existingRes.data.data.evaluations[0]
                setEvaluationData({
                    ...existEval,
                    evidenceAssessment: existEval.evidenceAssessment || { adequacy: '', relevance: '', quality: '' }
                })
                if (existEval.status !== 'draft') {
                    toast.info('Bài đánh giá này đã được nộp.')
                }
            } else {
                const createRes = await apiMethods.evaluations.create({ assignmentId })
                setEvaluationData({
                    ...createRes.data?.data,
                    evidenceAssessment: { adequacy: '', relevance: '', quality: '' }
                })
            }
        } catch (error) {
            console.error('Fetch data error:', error)
            toast.error('Lỗi khởi tạo dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    const handleEvidenceAssessmentChange = (field, value) => {
        setEvaluationData(prev => ({
            ...prev,
            evidenceAssessment: { ...prev.evidenceAssessment, [field]: value }
        }))
    }

    const addStrength = () => {
        if (!newStrength.trim()) return
        setEvaluationData(prev => ({ ...prev, strengths: [...prev.strengths, { point: newStrength, evidenceReference: '' }] }))
        setNewStrength('')
    }
    const removeStrength = (idx) => setEvaluationData(prev => ({ ...prev, strengths: prev.strengths.filter((_, i) => i !== idx) }))

    const addImprovement = () => {
        if (!newImprovement.area.trim()) return
        setEvaluationData(prev => ({ ...prev, improvementAreas: [...prev.improvementAreas, newImprovement] }))
        setNewImprovement({ area: '', recommendation: '', priority: 'medium' })
    }
    const removeImprovement = (idx) => setEvaluationData(prev => ({ ...prev, improvementAreas: prev.improvementAreas.filter((_, i) => i !== idx) }))

    const addRecommendation = () => {
        if (!newRecommendation.recommendation.trim()) return
        setEvaluationData(prev => ({ ...prev, recommendations: [...prev.recommendations, newRecommendation] }))
        setNewRecommendation({ recommendation: '', type: 'short_term', priority: 'medium' })
    }
    const removeRecommendation = (idx) => setEvaluationData(prev => ({ ...prev, recommendations: prev.recommendations.filter((_, i) => i !== idx) }))

    const validate = () => {
        const errors = []
        if (!evaluationData.overallComment?.trim()) errors.push('Nhận xét tổng thể là bắt buộc')
        if (!evaluationData.score) errors.push('Vui lòng chấm điểm (1-7)')
        const { adequacy, relevance, quality } = evaluationData.evidenceAssessment || {}
        if (!adequacy) errors.push('Đánh giá tính đầy đủ minh chứng là bắt buộc')
        if (!relevance) errors.push('Đánh giá tính liên quan minh chứng là bắt buộc')
        if (!quality) errors.push('Đánh giá chất lượng minh chứng là bắt buộc')

        setValidationErrors(errors)
        return errors.length === 0
    }

    const handleSaveDraft = async () => {
        setSaving(true)
        try {
            const payload = {
                overallComment: evaluationData.overallComment,
                score: evaluationData.score,
                evidenceAssessment: evaluationData.evidenceAssessment,
                strengths: evaluationData.strengths,
                improvementAreas: evaluationData.improvementAreas,
                recommendations: evaluationData.recommendations
            }
            await apiMethods.evaluations.update(evaluationData._id, payload)
            toast.success('Đã lưu nháp')
        } catch (error) {
            console.error('Save draft error:', error)
            toast.error('Lỗi khi lưu nháp')
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async () => {
        if (!validate()) {
            toast.error('Vui lòng điền đầy đủ các mục bắt buộc (*)')
            // Scroll lên đầu trang để xem lỗi
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        setSubmitting(true)
        try {
            // GỌI API SUBMIT TRỰC TIẾP (Không lưu nháp ở đây nữa)
            // Lưu ý: Dữ liệu phải được lưu trước đó bằng nút "Lưu nháp"
            await apiMethods.evaluations.submit(evaluationData._id)

            toast.success('Nộp đánh giá thành công')
            setTimeout(() => router.push('/evaluations/my-evaluations'), 1500)
        } catch (error) {
            console.error('Submit error:', error)
            const msg = error.response?.data?.message || error.message || 'Lỗi khi nộp đánh giá';
            toast.error(msg);
        } finally {
            setSubmitting(false)
        }
    }

    const getProgress = () => {
        let completed = 0
        const total = 5
        if (evaluationData.overallComment?.trim()) completed++
        if (evaluationData.score) completed++
        if (evaluationData.evidenceAssessment?.adequacy) completed++
        if (evaluationData.evidenceAssessment?.relevance) completed++
        if (evaluationData.evidenceAssessment?.quality) completed++
        return Math.round((completed / total) * 100)
    }

    const scores = [1, 2, 3, 4, 5, 6, 7]
    const scoreLabels = { 1: 'Kém', 2: 'Yếu', 3: 'Trung bình yếu', 4: 'Trung bình', 5: 'Khá', 6: 'Tốt', 7: 'Xuất sắc' }

    if (loading || !evaluationData) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6 max-w-7xl mx-auto pb-10">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <PenTool className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Đánh giá báo cáo: {report?.code}</h1>
                                <p className="text-blue-100 text-sm mt-1">{report?.title}</p>
                            </div>
                        </div>
                        <button onClick={() => router.back()} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Hiển thị lỗi validation */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <h3 className="text-red-800 font-bold flex items-center mb-2">
                            <AlertCircle className="w-5 h-5 mr-2" /> Vui lòng bổ sung thông tin:
                        </h3>
                        <ul className="list-disc list-inside text-red-700 text-sm">
                            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* CỘT TRÁI: Nội dung báo cáo */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-xl shadow p-6 border border-gray-200 h-full max-h-[calc(100vh-200px)] overflow-y-auto sticky top-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                <BookOpen className="w-5 h-5 mr-2 text-blue-600" /> Nội dung báo cáo
                            </h3>
                            <div
                                className="prose prose-sm max-w-none text-gray-700"
                                dangerouslySetInnerHTML={{ __html: report?.content || '<p class="text-gray-500 italic">Không có nội dung hiển thị.</p>' }}
                            />
                        </div>
                    </div>

                    {/* CỘT PHẢI: Form Đánh giá */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* --- CARD 1: TIẾN ĐỘ & HÀNH ĐỘNG --- */}
                        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-blue-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                    <Target className="w-5 h-5 mr-2 text-blue-600" /> Trạng thái đánh giá
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getProgress() === 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    Hoàn thành: {getProgress()}%
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${getProgress() === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                                    style={{ width: `${getProgress()}%` }}
                                ></div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={saving || submitting}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition flex justify-center items-center disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                    Lưu nháp
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || getProgress() < 100}
                                    className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition flex justify-center items-center shadow-lg 
                                        ${getProgress() < 100 ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5'}
                                        ${submitting ? 'opacity-70 cursor-wait' : ''}
                                    `}
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                                    Nộp đánh giá
                                </button>
                            </div>
                            {getProgress() < 100 && (
                                <p className="text-xs text-center text-red-500 mt-3 italic">
                                    * Vui lòng điền đủ thông tin và <b>Lưu nháp</b> trước khi nộp.
                                </p>
                            )}
                        </div>

                        {/* CARD 2: Tổng hợp & Điểm số */}
                        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" /> 1. Kết luận chung
                            </h3>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Nhận xét tổng thể <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={evaluationData.overallComment}
                                    onChange={(e) => setEvaluationData(prev => ({ ...prev, overallComment: e.target.value }))}
                                    rows={5}
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
                                    placeholder="Nhập nhận xét chi tiết, đánh giá chung về chất lượng báo cáo..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Điểm đánh giá (Thang 1 - 7) <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-7 gap-2">
                                    {scores.map(score => (
                                        <button
                                            key={score}
                                            onClick={() => setEvaluationData(prev => ({ ...prev, score }))}
                                            className={`py-3 text-lg font-bold rounded-lg border transition-all ${
                                                evaluationData.score === score
                                                    ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100 transform scale-105'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                                            }`}
                                        >
                                            {score}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 text-center h-6">
                                    {evaluationData.score && (
                                        <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                                            {scoreLabels[evaluationData.score]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CARD 3: Đánh giá minh chứng */}
                        <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                <ClipboardCheck className="w-5 h-5 mr-2 text-blue-600" /> 2. Đánh giá minh chứng
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['adequacy', 'relevance', 'quality'].map((field) => (
                                    <div key={field}>
                                        <label className="block text-xs font-bold text-gray-700 mb-2 capitalize">
                                            {field === 'adequacy' ? 'Tính đầy đủ *' : field === 'relevance' ? 'Tính liên quan *' : 'Chất lượng *'}
                                        </label>
                                        <select
                                            value={evaluationData.evidenceAssessment[field]}
                                            onChange={(e) => handleEvidenceAssessmentChange(field, e.target.value)}
                                            className={`w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 ${
                                                evaluationData.evidenceAssessment[field] ? 'border-green-300 bg-green-50 focus:ring-green-500' : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                        >
                                            <option value="">-- Chọn --</option>
                                            {field === 'adequacy'
                                                ? <><option value="insufficient">Chưa đủ</option><option value="adequate">Đủ</option><option value="comprehensive">Toàn diện</option></>
                                                : <><option value="poor">Kém</option><option value="fair">Trung bình</option><option value="good">Tốt</option><option value="excellent">Xuất sắc</option></>
                                            }
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CARD 4: Điểm mạnh */}
                        <div className="bg-white rounded-xl shadow p-6 border border-green-200">
                            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center border-b border-green-100 pb-2">
                                <CheckCircle className="w-5 h-5 mr-2" /> 3. Điểm mạnh (Tùy chọn)
                            </h3>
                            <ul className="space-y-2 mb-4">
                                {evaluationData.strengths.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100 animate-fadeIn">
                                        <span className="text-sm text-gray-800 font-medium">• {item.point}</span>
                                        <button onClick={() => removeStrength(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                                    </li>
                                ))}
                                {evaluationData.strengths.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có điểm mạnh nào được ghi nhận.</p>}
                            </ul>
                            <div className="flex gap-2">
                                <input
                                    type="text" placeholder="Nhập điểm mạnh..."
                                    value={newStrength} onChange={(e) => setNewStrength(e.target.value)}
                                    className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && addStrength()}
                                />
                                <button onClick={addStrength} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"><Plus className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* CARD 5: Điểm cần cải thiện */}
                        <div className="bg-white rounded-xl shadow p-6 border border-orange-200">
                            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center border-b border-orange-100 pb-2">
                                <Zap className="w-5 h-5 mr-2" /> 4. Điểm cần cải thiện (Tùy chọn)
                            </h3>
                            <ul className="space-y-3 mb-4">
                                {evaluationData.improvementAreas.map((item, idx) => (
                                    <li key={idx} className="bg-orange-50 p-3 rounded-lg border border-orange-100 relative animate-fadeIn">
                                        <button onClick={() => removeImprovement(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                                        <p className="text-sm font-bold text-gray-800 mb-1">Vấn đề: {item.area}</p>
                                        {item.recommendation && <p className="text-xs text-gray-600 italic">Gợi ý: {item.recommendation}</p>}
                                    </li>
                                ))}
                                {evaluationData.improvementAreas.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có điểm cần cải thiện nào.</p>}
                            </ul>
                            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <input
                                    type="text" placeholder="Vấn đề cần cải thiện..."
                                    value={newImprovement.area} onChange={(e) => setNewImprovement(prev => ({...prev, area: e.target.value}))}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text" placeholder="Khuyến nghị (nếu có)..."
                                        value={newImprovement.recommendation} onChange={(e) => setNewImprovement(prev => ({...prev, recommendation: e.target.value}))}
                                        className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                    <button onClick={addImprovement} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-semibold">Thêm</button>
                                </div>
                            </div>
                        </div>

                        {/* CARD 6: Khuyến nghị chung */}
                        <div className="bg-white rounded-xl shadow p-6 border border-purple-200">
                            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center border-b border-purple-100 pb-2">
                                <Award className="w-5 h-5 mr-2" /> 5. Khuyến nghị chung (Tùy chọn)
                            </h3>
                            <ul className="space-y-3 mb-4">
                                {evaluationData.recommendations.map((item, idx) => (
                                    <li key={idx} className="bg-purple-50 p-3 rounded-lg border border-purple-100 relative animate-fadeIn">
                                        <button onClick={() => removeRecommendation(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                                        <p className="text-sm font-semibold text-gray-800 mb-1">{item.recommendation}</p>
                                        <div className="flex gap-2">
                                            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-md">
                                                {item.type === 'immediate' ? 'Ngay lập tức' : item.type === 'short_term' ? 'Ngắn hạn' : 'Dài hạn'}
                                            </span>
                                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md capitalize">
                                                {item.priority === 'low' ? 'Thấp' : item.priority === 'medium' ? 'Trung bình' : 'Cao'}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                                {evaluationData.recommendations.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có khuyến nghị nào.</p>}
                            </ul>
                            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <textarea
                                    placeholder="Nội dung khuyến nghị..."
                                    value={newRecommendation.recommendation} onChange={(e) => setNewRecommendation(prev => ({...prev, recommendation: e.target.value}))}
                                    rows={2}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <div className="flex gap-2">
                                    <select value={newRecommendation.type} onChange={(e) => setNewRecommendation(prev => ({...prev, type: e.target.value}))} className="p-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                                        <option value="immediate">Ngay lập tức</option>
                                        <option value="short_term">Ngắn hạn</option>
                                        <option value="long_term">Dài hạn</option>
                                    </select>
                                    <select value={newRecommendation.priority} onChange={(e) => setNewRecommendation(prev => ({...prev, priority: e.target.value}))} className="p-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                                        <option value="low">Thấp</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="high">Cao</option>
                                    </select>
                                    <button onClick={addRecommendation} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold">Thêm</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    )
}