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

            console.log('✅ Evaluation loaded:', evalData)
            console.log('📊 Evaluation status:', evalData.status)
            console.log('👤 Evaluator ID:', evalData.evaluatorId)
            console.log('👤 Current user ID:', user.id)

            const evaluatorId = evalData.evaluatorId?._id || evalData.evaluatorId

            // 1. Kiểm tra quyền chỉnh sửa: Phải là bản nháp và là người tạo
            if (evalData.status !== 'draft') {
                console.log(`❌ Cannot edit - status is ${evalData.status}, only draft can be edited`)
                toast.error(`Chỉ có thể chỉnh sửa bản nháp. Đánh giá này đang ở trạng thái: ${evalData.status}.`)
                router.replace(`/reports/evaluations/${id}`)
                return
            }

            if (evaluatorId.toString() !== user.id.toString()) {
                console.log(`❌ Not the evaluator - ${evaluatorId} vs ${user.id}`)
                toast.error('Chỉ chuyên gia tạo đánh giá mới có thể chỉnh sửa.')
                router.replace(`/reports/evaluations/${id}`)
                return
            }
            // ----------------------------------------------------

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

            // 🚀 Xử lý lỗi 403 và 404 (Nếu backend từ chối ngay từ getById)
            const status = error.response?.status;
            const message = error.response?.data?.message;

            if (status === 403) {
                console.log('❌ Access denied (403) during fetch')
                toast.error(message || 'Bạn không có quyền xem trang chỉnh sửa này.')
                router.replace(id ? `/reports/evaluations/${id}` : '/reports/evaluations') // Chuyển sang trang chi tiết hoặc danh sách
                return
            } else if (status === 404) {
                console.log('❌ Evaluation not found')
                toast.error('Không tìm thấy đánh giá')
                router.replace('/reports/evaluations')
                return
            } else {
                toast.error('Lỗi tải đánh giá')
            }

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
        return validationErrors.length === 0 &&
            formData.overallComment.trim() &&
            formData.rating &&
            formData.evidenceAssessment.adequacy &&
            formData.evidenceAssessment.relevance &&
            formData.evidenceAssessment.quality &&
            formData.criteriaScores.length > 0 &&
            formData.criteriaScores.every(c => c.score !== undefined && c.score !== null && c.score !== '');
    }

    const handleUpdateCriteriaScore = (idx, value) => {
        const updated = { ...formData };
        updated.criteriaScores[idx].score = value ? parseFloat(value) : '';
        setFormData(updated);
        validateForm(updated);
    }

    const handleSave = async () => {
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
                },
                criteriaScores: formData.criteriaScores
            }

            console.log('📤 Saving evaluation:', submitData)

            await apiMethods.evaluations.update(evaluation._id, submitData)
            toast.success('Đánh giá đã được lưu')

            setTimeout(() => {
                fetchEvaluation()
            }, 500)
        } catch (error) {
            console.error('❌ Error saving:', error)
            const message = error.response?.data?.message || 'Lỗi khi lưu đánh giá'
            toast.error(message)
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async () => {
        if (!isFormValid()) {
            toast.error('Vui lòng điền đầy đủ tất cả thông tin bắt buộc')
            return
        }

        if (!window.confirm('Xác nhận nộp đánh giá? Sau khi nộp sẽ không thể chỉnh sửa.')) {
            return
        }

        try {
            setSubmitting(true)
            console.log('📤 Submitting evaluation ID:', evaluation._id)

            const submitRes = await apiMethods.evaluations.submit(evaluation._id)
            console.log('✅ Submit response:', submitRes)

            toast.success('Đánh giá đã được nộp')
            router.push('/reports/evaluations')
        } catch (error) {
            console.error('❌ Error submitting:', error)
            const errors = error.response?.data?.errors
            if (errors && Array.isArray(errors)) {
                toast.error(errors[0])
            } else {
                toast.error(error.response?.data?.message || 'Lỗi khi nộp đánh giá')
            }
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

    // Status tracking
    const status = {
        overallComment: !!formData.overallComment && formData.overallComment.trim() !== '',
        rating: !!formData.rating,
        evidenceAssessment: {
            adequacy: !!formData.evidenceAssessment.adequacy,
            relevance: !!formData.evidenceAssessment.relevance,
            quality: !!formData.evidenceAssessment.quality
        },
        criteriaScores: formData.criteriaScores?.every(c => c.score !== undefined && c.score !== null && c.score !== '')
    }

    const ratingOptions = [
        { value: 'excellent', label: '⭐ Xuất sắc', desc: 'Vượt trội' },
        { value: 'good', label: '✅ Tốt', desc: 'Rất tốt' },
        { value: 'satisfactory', label: '👍 Đạt yêu cầu', desc: 'Bình thường' },
        { value: 'needs_improvement', label: '⚠️ Cần cải thiện', desc: 'Yếu' },
        { value: 'poor', label: '❌ Kém', desc: 'Rất yếu' }
    ]

    return (
        <Layout title="Chỉnh sửa đánh giá" breadcrumbItems={breadcrumbItems}>
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

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {report?.title}
                        </h1>
                        <p className="text-gray-600">{report?.code}</p>
                    </div>
                </div>

                {/* Status */}
                {evaluation?.status && (
                    <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                        <p className="text-sm font-medium text-blue-800">
                            Trạng thái: Bản nháp
                        </p>
                    </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-red-800 mb-2">❌ Lỗi validation:</p>
                        <ul className="space-y-1">
                            {validationErrors.map((error, idx) => (
                                <li key={idx} className="text-sm text-red-700">• {error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Rating Selection */}
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
                                    const updated = { ...formData, rating: option.value };
                                    setFormData(updated);
                                    validateForm(updated);
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

                {/* Overall Comment */}
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
                            const updated = { ...formData, overallComment: e.target.value };
                            setFormData(updated);
                            validateForm(updated);
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

                {/* Evidence Assessment */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Đánh giá minh chứng</h2>
                        <span className={`text-sm font-semibold ${
                            status.evidenceAssessment.adequacy && status.evidenceAssessment.relevance && status.evidenceAssessment.quality
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

                {/* Criteria Scores */}
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

                {/* Form Status */}
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