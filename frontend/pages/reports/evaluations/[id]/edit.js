import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../contexts/AuthContext'
import Layout from '../../../../components/common/Layout'
import { apiMethods } from '../../../../services/api'
import {
    Save,
    Send,
    ArrowLeft,
    BookOpen,
    AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditEvaluationPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { id } = router.query

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [evaluation, setEvaluation] = useState(null)
    const [report, setReport] = useState(null)

    const [formData, setFormData] = useState({
        overallComment: '',
        rating: '',
        evidenceAssessment: {
            adequacy: '',
            relevance: '',
            quality: ''
        },
        criteriaScores: []
    })

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'expert' && router.isReady && id) {
            fetchEvaluation()
        }
    }, [user, id, router.isReady])

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Đánh giá', path: '/reports/evaluations' },
        { name: 'Chỉnh sửa', icon: BookOpen }
    ]

    const fetchEvaluation = async () => {
        try {
            setLoading(true)
            console.log('📥 Fetching evaluation:', id)

            const response = await apiMethods.evaluations.getById(id)
            const evalData = response.data?.data || response.data

            if (!evalData) {
                console.warn('⚠️ Evaluation data is empty')
                toast.error('Không tìm thấy đánh giá')
                router.replace('/reports/evaluations')
                return
            }

            if (user.role === 'expert') {
                const evaluatorId = evalData.evaluatorId?._id || evalData.evaluatorId;
                const isMyEvaluation = evaluatorId && evaluatorId.toString() === user.id.toString();

                if (!isMyEvaluation || evalData.status !== 'draft') {
                    console.log(`❌ Expert is forbidden to edit status: ${evalData.status}, isMyEval: ${isMyEvaluation}`)
                    toast.error('Chỉ có thể chỉnh sửa bản nháp của bạn.')
                    router.replace(`/reports/evaluations/${id}`)
                    return
                }
            }

            console.log('✅ Evaluation loaded:', evalData)
            setEvaluation(evalData)
            setReport(evalData.reportId)

            setFormData({
                overallComment: evalData.overallComment || '',
                rating: evalData.rating || '',
                evidenceAssessment: evalData.evidenceAssessment || {
                    adequacy: '',
                    relevance: '',
                    quality: ''
                },
                criteriaScores: evalData.criteriaScores || []
            })

        } catch (error) {
            console.error('❌ Error fetching evaluation:', error)
            console.error('Status:', error.response?.status)
            console.error('Message:', error.response?.data?.message)

            if (error.response?.status === 403) {
                console.log('❌ Access denied (403) - Bạn không có quyền xem/sửa đánh giá này')
                toast.error('Bạn không có quyền truy cập trang này.')
            } else if (error.response?.status === 404) {
                console.log('❌ Evaluation not found')
                toast.error('Không tìm thấy đánh giá')
            } else {
                toast.error('Lỗi tải đánh giá')
            }

            router.replace('/reports/evaluations')
        } finally {
            setLoading(false)
        }
    }

    const isFormValid = () => {
        return (
            formData.overallComment.trim() &&
            formData.rating &&
            formData.evidenceAssessment.adequacy &&
            formData.evidenceAssessment.relevance &&
            formData.evidenceAssessment.quality
            // Kiểm tra tối thiểu về điểm tiêu chí (nếu cần, nhưng thường được quản lý ở component riêng)
            // && formData.criteriaScores?.every(c => c.score !== undefined && c.score !== null)
        )
    }

    const handleSave = async () => {
        // Có thể cho phép lưu nháp ngay cả khi chưa đủ form validation chính,
        // nhưng sẽ dùng isFormValid để chặn nộp. Giữ lại validation hiện tại cho UI/UX tốt hơn.
        if (!isFormValid()) {
            toast.error('Vui lòng điền đầy đủ tất cả thông tin bắt buộc')
            return
        }

        try {
            setSaving(true)

            const submitData = {
                overallComment: formData.overallComment.trim(),
                rating: formData.rating,
                evidenceAssessment: {
                    adequacy: formData.evidenceAssessment.adequacy,
                    relevance: formData.evidenceAssessment.relevance,
                    quality: formData.evidenceAssessment.quality
                }
                // criteriaScores: formData.criteriaScores // Gửi nếu cần cập nhật điểm
            }

            console.log('📤 Saving evaluation data (Draft):', submitData)

            await apiMethods.evaluations.update(evaluation._id, submitData)
            toast.success('Đánh giá đã được lưu')

            setTimeout(() => {
                fetchEvaluation()
            }, 500)
        } catch (error) {
            console.error('Error saving:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi lưu đánh giá')
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async () => {
        if (!isFormValid()) {
            toast.error('Vui lòng điền đầy đủ tất cả thông tin bắt buộc')
            return
        }

        // Cần kiểm tra điểm tiêu chí trước khi nộp
        if (formData.criteriaScores.some(c => c.score === undefined || c.score === null)) {
            toast.error('Vui lòng nhập đầy đủ điểm cho các tiêu chí đánh giá.');
            return
        }


        if (!window.confirm('Xác nhận nộp đánh giá? Sau khi nộp sẽ không thể chỉnh sửa.')) {
            return
        }

        try {
            setSubmitting(true)
            console.log('📤 Submitting evaluation ID:', evaluation._id)

            // Lưu lần cuối trước khi nộp
            await handleSave()

            await apiMethods.evaluations.submit(evaluation._id)
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

    if (!evaluation || !report) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-yellow-800 font-semibold">Không tìm thấy</h3>
                    <p className="text-yellow-700">Không tìm thấy đánh giá hoặc báo cáo</p>
                </div>
            </Layout>
        )
    }

    if (user.role === 'expert' && evaluation.status !== 'draft') {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-red-800 font-semibold">Lỗi trạng thái</h3>
                    <p className="text-red-600">Đánh giá đã được nộp. Không thể chỉnh sửa.</p>
                </div>
            </Layout>
        )
    }


    const ratingOptions = [
        { value: 'excellent', label: '⭐ Xuất sắc', desc: 'Vượt trội' },
        { value: 'good', label: '✅ Tốt', desc: 'Rất tốt' },
        { value: 'satisfactory', label: '👍 Đạt yêu cầu', desc: 'Bình thường' },
        { value: 'needs_improvement', label: '⚠️ Cần cải thiện', desc: 'Yếu' },
        { value: 'poor', label: '❌ Kém', desc: 'Rất yếu' }
    ]

    return (
        <Layout title='Chỉnh sửa đánh giá' breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </button>

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {report?.title}
                        </h1>
                        <p className="text-gray-600">{report?.code}</p>
                    </div>
                </div>

                {evaluation?.status && (
                    <div className={`p-4 rounded-lg border ${
                        evaluation.status === 'draft'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-green-50 border-green-200'
                    }`}>
                        <p className={`text-sm font-medium ${
                            evaluation.status === 'draft'
                                ? 'text-blue-800'
                                : 'text-green-800'
                        }`}>
                            Trạng thái: {evaluation.status === 'draft' ? 'Bản nháp' : 'Đã nộp'}
                        </p>
                    </div>
                )}

                {evaluation.supervisorGuidance?.comments && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h3 className="text-orange-800 font-semibold flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Hướng dẫn giám sát
                        </h3>
                        <p className="text-orange-700 text-sm mt-2">{evaluation.supervisorGuidance.comments}</p>
                        <p className="text-xs text-gray-500 mt-2">
                            Từ: {evaluation.supervisorGuidance.guidedBy?.fullName}
                        </p>
                    </div>
                )}


                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Xếp loại đánh giá</h2>
                        <span className="text-red-600 text-sm font-semibold">*Bắt buộc</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {ratingOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFormData({ ...formData, rating: option.value })}
                                className={`p-4 rounded-lg border-2 transition-all text-center ${
                                    formData.rating === option.value
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <p className="font-semibold text-sm">{option.label}</p>
                                <p className="text-xs text-gray-600 mt-1">{option.desc}</p>
                            </button>
                        ))}
                    </div>

                    {!formData.rating && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">Vui lòng chọn xếp loại</p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Nhận xét tổng thể</h2>
                        <span className="text-red-600 text-sm font-semibold">*Bắt buộc</span>
                    </div>

                    <textarea
                        value={formData.overallComment}
                        onChange={(e) => setFormData({ ...formData, overallComment: e.target.value })}
                        placeholder="Nhập nhận xét tổng thể về báo cáo..."
                        maxLength={5000}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                            {formData.overallComment.length}/5000 ký tự
                        </p>
                    </div>

                    {!formData.overallComment.trim() && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">Nhận xét tổng thể là bắt buộc</p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Đánh giá minh chứng</h2>
                        <span className="text-red-600 text-sm font-semibold">*Bắt buộc</span>
                    </div>

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
                                <option value="">-- Chọn --</option>
                                <option value="insufficient">Không đủ</option>
                                <option value="adequate">Đủ</option>
                                <option value="comprehensive">Toàn diện</option>
                            </select>
                            {!formData.evidenceAssessment.adequacy && (
                                <p className="text-xs text-red-600 mt-1">Bắt buộc</p>
                            )}
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
                                <option value="">-- Chọn --</option>
                                <option value="poor">Kém</option>
                                <option value="fair">Trung bình</option>
                                <option value="good">Tốt</option>
                                <option value="excellent">Xuất sắc</option>
                            </select>
                            {!formData.evidenceAssessment.relevance && (
                                <p className="text-xs text-red-600 mt-1">Bắt buộc</p>
                            )}
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
                                <option value="">-- Chọn --</option>
                                <option value="poor">Kém</option>
                                <option value="fair">Trung bình</option>
                                <option value="good">Tốt</option>
                                <option value="excellent">Xuất sắc</option>
                            </select>
                            {!formData.evidenceAssessment.quality && (
                                <p className="text-xs text-red-600 mt-1">Bắt buộc</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <span className={isFormValid() ? 'text-green-600' : 'text-red-600'}>
                            {isFormValid() ? '✅' : '❌'}
                        </span>
                        {' '}
                        {isFormValid()
                            ? 'Đủ thông tin để lưu/nộp'
                            : 'Chưa đầy đủ thông tin bắt buộc'}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg shadow-lg">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !isFormValid()}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    {evaluation?.status === 'draft' && (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !isFormValid()}
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