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
    AlertCircle,
    CheckCircle,
    XCircle
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
    const [validationErrors, setValidationErrors] = useState([])

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

            validateForm(evalData)

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

    // ✅ Hàm validate form toàn bộ
    const validateForm = (data = formData) => {
        const errors = [];

        // 1. Kiểm tra Nhận xét tổng thể
        if (!data.overallComment || data.overallComment.trim() === '') {
            errors.push('Nhận xét tổng thể là bắt buộc');
        }

        // 2. Kiểm tra Xếp loại
        if (!data.rating) {
            errors.push('Xếp loại đánh giá là bắt buộc');
        }

        // 3. Kiểm tra Đánh giá minh chứng
        if (!data.evidenceAssessment.adequacy) {
            errors.push('Tính đầy đủ minh chứng là bắt buộc');
        }
        if (!data.evidenceAssessment.relevance) {
            errors.push('Tính liên quan minh chứng là bắt buộc');
        }
        if (!data.evidenceAssessment.quality) {
            errors.push('Chất lượng minh chứng là bắt buộc');
        }

        // 4. Kiểm tra Điểm tiêu chí
        if (!data.criteriaScores || data.criteriaScores.length === 0) {
            errors.push('Phải có ít nhất một tiêu chí đánh giá');
        } else {
            data.criteriaScores.forEach((criteria, idx) => {
                if (criteria.score === undefined || criteria.score === null || criteria.score === '') {
                    errors.push(`Tiêu chí ${idx + 1} (${criteria.criteriaName}): chưa có điểm`);
                }
                if (typeof criteria.score === 'number' && (criteria.score < 0 || criteria.score > (criteria.maxScore || 10))) {
                    errors.push(`Tiêu chí ${idx + 1} (${criteria.criteriaName}): điểm phải từ 0 đến ${criteria.maxScore || 10}`);
                }
            });
        }

        setValidationErrors(errors);
        return errors.length === 0;
    }

    const isFormValid = () => {
        return validateForm(formData);
    }

    const handleUpdateCriteriaScore = (index, score) => {
        const updatedScores = [...formData.criteriaScores];
        updatedScores[index].score = score === '' ? undefined : parseFloat(score);
        setFormData({ ...formData, criteriaScores: updatedScores });
        validateForm({ ...formData, criteriaScores: updatedScores });
    }

    const handleSave = async () => {
        if (!isFormValid()) {
            toast.error('Vui lòng điền đầy đủ tất cả thông tin bắt buộc');
            return;
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
                },
                criteriaScores: formData.criteriaScores
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
            toast.error('Vui lòng điền đầy đủ tất cả thông tin bắt buộc');
            return;
        }

        if (!window.confirm('Xác nhận nộp đánh giá? Sau khi nộp sẽ không thể chỉnh sửa.')) {
            return
        }

        try {
            setSubmitting(true)
            console.log('📤 Submitting evaluation ID:', evaluation._id)

            // Lưu lần cuối trước khi nộp
            const submitData = {
                overallComment: formData.overallComment.trim(),
                rating: formData.rating,
                evidenceAssessment: {
                    adequacy: formData.evidenceAssessment.adequacy,
                    relevance: formData.evidenceAssessment.relevance,
                    quality: formData.evidenceAssessment.quality
                },
                criteriaScores: formData.criteriaScores
            }

            await apiMethods.evaluations.update(evaluation._id, submitData)
            await apiMethods.evaluations.submit(evaluation._id)
            toast.success('Đánh giá đã được nộp')
            router.push('/reports/evaluations')
        } catch (error) {
            console.error('Error submitting:', error)

            // Hiển thị lỗi validation chi tiết từ backend
            if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors.join('\n');
                toast.error(`Lỗi: ${errorMessages}`);
            } else {
                toast.error(error.response?.data?.message || 'Lỗi khi nộp đánh giá')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const getValidationStatus = () => {
        return {
            overallComment: formData.overallComment && formData.overallComment.trim() !== '',
            rating: !!formData.rating,
            evidenceAssessment: {
                adequacy: !!formData.evidenceAssessment.adequacy,
                relevance: !!formData.evidenceAssessment.relevance,
                quality: !!formData.evidenceAssessment.quality
            },
            criteriaScores: formData.criteriaScores &&
                formData.criteriaScores.length > 0 &&
                formData.criteriaScores.every(c => c.score !== undefined && c.score !== null && c.score !== '')
        }
    }

    const status = getValidationStatus()
    const completedCount = (
        (status.overallComment ? 1 : 0) +
        (status.rating ? 1 : 0) +
        (status.evidenceAssessment.adequacy ? 1 : 0) +
        (status.evidenceAssessment.relevance ? 1 : 0) +
        (status.evidenceAssessment.quality ? 1 : 0) +
        (status.criteriaScores ? 1 : 0)
    )
    const totalRequired = 6
    const progressPercent = Math.round((completedCount / totalRequired) * 100)

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

                {/* ✅ Progress Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Tiến độ hoàn thành</h3>

                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">Đã hoàn thành: {completedCount}/{totalRequired}</span>
                            <span className="text-2xl font-bold text-blue-600">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all ${
                                    progressPercent === 100
                                        ? 'bg-green-500'
                                        : progressPercent >= 50
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className={`p-3 rounded border text-sm font-medium flex items-center gap-2 ${
                            status.overallComment
                                ? 'bg-green-50 border-green-300 text-green-700'
                                : 'bg-red-50 border-red-300 text-red-700'
                        }`}>
                            {status.overallComment ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            Nhận xét
                        </div>
                        <div className={`p-3 rounded border text-sm font-medium flex items-center gap-2 ${
                            status.rating
                                ? 'bg-green-50 border-green-300 text-green-700'
                                : 'bg-red-50 border-red-300 text-red-700'
                        }`}>
                            {status.rating ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            Xếp loại
                        </div>
                        <div className={`p-3 rounded border text-sm font-medium flex items-center gap-2 ${
                            (status.evidenceAssessment.adequacy && status.evidenceAssessment.relevance && status.evidenceAssessment.quality)
                                ? 'bg-green-50 border-green-300 text-green-700'
                                : 'bg-red-50 border-red-300 text-red-700'
                        }`}>
                            {(status.evidenceAssessment.adequacy && status.evidenceAssessment.relevance && status.evidenceAssessment.quality) ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            Minh chứng
                        </div>
                        <div className={`p-3 rounded border text-sm font-medium flex items-center gap-2 ${
                            status.criteriaScores
                                ? 'bg-green-50 border-green-300 text-green-700'
                                : 'bg-red-50 border-red-300 text-red-700'
                        }`}>
                            {status.criteriaScores ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            Tiêu chí
                        </div>
                    </div>

                    {/* Hiển thị lỗi validation */}
                    {validationErrors.length > 0 && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                            <h4 className="text-red-800 font-semibold mb-2 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Lỗi cần sửa:
                            </h4>
                            <ul className="space-y-1">
                                {validationErrors.map((error, idx) => (
                                    <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                                        <span className="mt-0.5">•</span>
                                        <span>{error}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Xếp loại đánh giá</h2>
                        <span className={`text-sm font-semibold ${status.rating ? 'text-green-600' : 'text-red-600'}`}>
                            {status.rating ? '✅ Đã chọn' : '❌ Bắt buộc'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {ratingOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setFormData({ ...formData, rating: option.value });
                                    validateForm({ ...formData, rating: option.value });
                                }}
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
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Nhận xét tổng thể</h2>
                        <span className={`text-sm font-semibold ${status.overallComment ? 'text-green-600' : 'text-red-600'}`}>
                            {status.overallComment ? '✅ Đã điền' : '❌ Bắt buộc'}
                        </span>
                    </div>

                    <textarea
                        value={formData.overallComment}
                        onChange={(e) => {
                            setFormData({ ...formData, overallComment: e.target.value });
                            validateForm({ ...formData, overallComment: e.target.value });
                        }}
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
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Đánh giá minh chứng</h2>
                        <span className={`text-sm font-semibold ${
                            (status.evidenceAssessment.adequacy && status.evidenceAssessment.relevance && status.evidenceAssessment.quality)
                                ? 'text-green-600'
                                : 'text-red-600'
                        }`}>
                            {(status.evidenceAssessment.adequacy && status.evidenceAssessment.relevance && status.evidenceAssessment.quality)
                                ? '✅ Đã chọn'
                                : '❌ Bắt buộc'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                                Tính đầy đủ
                            </label>
                            <select
                                value={formData.evidenceAssessment.adequacy}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    const updated = { ...formData };
                                    updated.evidenceAssessment.adequacy = newValue;
                                    setFormData(updated);
                                    validateForm(updated);
                                }}
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
                                Tính liên quan
                            </label>
                            <select
                                value={formData.evidenceAssessment.relevance}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    const updated = { ...formData };
                                    updated.evidenceAssessment.relevance = newValue;
                                    setFormData(updated);
                                    validateForm(updated);
                                }}
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
                                Chất lượng
                            </label>
                            <select
                                value={formData.evidenceAssessment.quality}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    const updated = { ...formData };
                                    updated.evidenceAssessment.quality = newValue;
                                    setFormData(updated);
                                    validateForm(updated);
                                }}
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

                {/* ✅ Điểm tiêu chí */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Điểm tiêu chí đánh giá</h2>
                        <span className={`text-sm font-semibold ${status.criteriaScores ? 'text-green-600' : 'text-red-600'}`}>
                            {status.criteriaScores ? '✅ Đầy đủ' : '❌ Bắt buộc'}
                        </span>
                    </div>

                    {formData.criteriaScores && formData.criteriaScores.length > 0 ? (
                        <div className="space-y-4">
                            {formData.criteriaScores.map((criteria, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                    <div className="grid grid-cols-3 gap-4 items-start">
                                        <div className="col-span-2">
                                            <p className="text-sm font-semibold text-gray-900">{idx + 1}. {criteria.criteriaName}</p>
                                            {criteria.description && (
                                                <p className="text-xs text-gray-600 mt-1">{criteria.description}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 mb-1 block">
                                                Điểm (0-{criteria.maxScore || 10})
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={criteria.maxScore || 10}
                                                step="0.5"
                                                value={criteria.score || ''}
                                                onChange={(e) => handleUpdateCriteriaScore(idx, e.target.value)}
                                                placeholder="Nhập điểm"
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                                                    (criteria.score !== undefined && criteria.score !== null && criteria.score !== '')
                                                        ? 'border-green-300 focus:ring-green-500 bg-green-50'
                                                        : 'border-red-300 focus:ring-red-500 bg-red-50'
                                                }`}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                {criteria.score !== undefined && criteria.score !== null && criteria.score !== ''
                                                    ? `✅ ${criteria.score}/${criteria.maxScore || 10}`
                                                    : '❌ Chưa điền'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            Không có tiêu chí đánh giá
                        </div>
                    )}
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