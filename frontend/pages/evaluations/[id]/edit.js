import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import api, { apiMethods } from '../../../services/api'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    FileText,
    Award,
    Calendar,
    User,
    Loader2,
    MessageSquare,
    Lightbulb,
    TrendingUp,
    AlertCircle,
    Save,
    Send,
    Trash2,
    CheckCircle, Edit
} from 'lucide-react'
import { formatDate } from '../../../utils/helpers'

// Component con cho việc thêm/sửa Điểm mạnh, Cải thiện, Khuyến nghị
const ListEditor = ({ items, setItems, title, pointLabel, fields, Icon, itemColor = 'blue' }) => {
    const [newItem, setNewItem] = useState(
        fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {})
    )

    const addItem = () => {
        if (newItem[pointLabel].trim() === '') {
            toast.error(`Vui lòng nhập ${pointLabel.toLowerCase()}`)
            return
        }
        setItems([...items, newItem])
        setNewItem(fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {}))
    }

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const handleInputChange = (name, value) => {
        setNewItem(prev => ({ ...prev, [name]: value }))
    }

    const getColorClasses = (field, item) => {
        if (field.name === 'priority') {
            const priority = item[field.name];
            return priority === 'high'
                ? 'bg-red-100 text-red-700 border-red-300'
                : priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                    : 'bg-blue-100 text-blue-700 border-blue-300';
        }
        return `bg-${itemColor}-100 text-${itemColor}-700 border-${itemColor}-300`;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Icon className={`h-6 w-6 text-${itemColor}-600 mr-3`} />
                {title} ({items.length})
            </h3>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div key={index} className={`bg-${itemColor}-50 rounded-xl p-4 border-2 border-${itemColor}-200 flex justify-between items-start`}>
                        <div className="flex-1 space-y-2">
                            <p className="font-semibold text-gray-900">
                                {index + 1}. {item[pointLabel]}
                            </p>
                            {fields.filter(f => f.name !== pointLabel).map(field => (
                                field.type === 'select'
                                    ? (
                                        <span key={field.name} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ml-2 ${getColorClasses(field, item)}`}>
                                            {field.options.find(opt => opt.value === item[field.name])?.label || item[field.name]}
                                        </span>
                                    )
                                    : (
                                        <p key={field.name} className="text-sm text-gray-600 ml-2">
                                            <span className="font-semibold">{field.label}:</span> {item[field.name]}
                                        </p>
                                    )
                            ))}
                        </div>
                        <button
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors flex-shrink-0"
                            title="Xóa"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 space-y-3">
                <h4 className="text-md font-bold text-gray-800">Thêm mới</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{pointLabel}</label>
                        <textarea
                            rows="2"
                            value={newItem[pointLabel]}
                            onChange={(e) => handleInputChange(pointLabel, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Nhập ${pointLabel.toLowerCase()}`}
                        />
                    </div>
                    {fields.filter(f => f.name !== pointLabel).map(field => (
                        <div key={field.name} className={field.span ? 'md:col-span-2' : 'md:col-span-1'}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    rows="2"
                                    value={newItem[field.name]}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`Nhập ${field.placeholder}`}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    value={newItem[field.name]}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    {field.options.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={newItem[field.name]}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`Nhập ${field.placeholder}`}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <button
                    onClick={addItem}
                    className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Thêm vào danh sách
                </button>
            </div>
        </div>
    )
}

export default function EvaluationEdit() {
    const router = useRouter()
    const { id } = router.query
    const { user, isLoading: authLoading } = useAuth()

    const [evaluation, setEvaluation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')

    // State cho dữ liệu chỉnh sửa
    const [formData, setFormData] = useState({
        overallComment: '',
        rating: '',
        evidenceAssessment: { adequacy: '', relevance: '', quality: '' },
        strengths: [],
        improvementAreas: [],
        recommendations: []
    })

    function useDebounce(formData, number) {
        return undefined;
    }

    const debouncedFormData = useDebounce(formData, 3000) // Tự động lưu sau 3 giây dừng gõ

    // --- Helpers ---
    const getRatingColor = (rating) => {
        const colors = {
            excellent: 'text-indigo-700 bg-indigo-100 border-indigo-300',
            good: 'text-blue-700 bg-blue-100 border-blue-300',
            satisfactory: 'text-yellow-700 bg-yellow-100 border-yellow-300',
            needs_improvement: 'text-orange-700 bg-orange-100 border-orange-300',
            poor: 'text-red-700 bg-red-100 border-red-300'
        }
        return colors[rating] || 'text-gray-700 bg-gray-100 border-gray-300'
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

    const getEvidenceQualityColor = (quality) => {
        const colors = {
            excellent: 'bg-indigo-100 text-indigo-700 border-indigo-300',
            good: 'bg-blue-100 text-blue-700 border-blue-300',
            fair: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            poor: 'bg-red-100 text-red-700 border-red-300'
        }
        return colors[quality] || 'bg-gray-100 text-gray-700 border-gray-300'
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

    // --- Data Fetching & Setup ---

    const fetchEvaluationDetail = useCallback(async () => {
        if (!id) return
        try {
            setLoading(true)
            const response = await apiMethods.evaluations.getById(id)
            const data = response.data?.data || response.data

            // 🛑 Kiểm tra trạng thái: CHỈ cho phép sửa bản nháp
            if (data.status !== 'draft') {
                toast.error('Chỉ có thể chỉnh sửa đánh giá ở trạng thái Bản nháp.')
                router.replace(`/evaluations/${id}`)
                return
            }

            setEvaluation(data)
            setFormData({
                overallComment: data.overallComment || '',
                rating: data.rating || '',
                evidenceAssessment: data.evidenceAssessment || { adequacy: '', relevance: '', quality: '' },
                strengths: data.strengths || [],
                improvementAreas: data.improvementAreas || [],
                recommendations: data.recommendations || []
            })
        } catch (error) {
            console.error('Fetch evaluation detail error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải chi tiết đánh giá')
            if (error.response?.status === 404 || error.response?.status === 403) {
                router.replace('/evaluations/my-evaluations')
            }
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (id && user && user.role === 'expert') {
            fetchEvaluationDetail()
        }
    }, [id, user, fetchEvaluationDetail])

    // --- Auto Save Logic ---
    useEffect(() => {
        const autoSave = async () => {
            if (!evaluation || evaluation.status !== 'draft' || saving) return

            // Kiểm tra xem dữ liệu có thay đổi so với lần tự động lưu gần nhất không (logic đơn giản)
            const hasChanged = JSON.stringify(debouncedFormData) !== JSON.stringify({
                overallComment: evaluation.overallComment || '',
                rating: evaluation.rating || '',
                evidenceAssessment: evaluation.evidenceAssessment || { adequacy: '', relevance: '', quality: '' },
                strengths: evaluation.strengths || [],
                improvementAreas: evaluation.improvementAreas || [],
                recommendations: evaluation.recommendations || []
            });

            if (!hasChanged) return;

            setSaving(true)
            try {
                const response = await apiMethods.evaluations.autoSave(id, debouncedFormData)
                // Cập nhật lại thời gian lưu gần nhất trên state Evaluation
                setEvaluation(prev => ({
                    ...prev,
                    metadata: {
                        ...prev.metadata,
                        lastSaved: response.data.data.lastSaved
                    }
                }))
                toast.success('Đã lưu tự động', { id: 'auto-save', duration: 1000 })
            } catch (error) {
                console.error('Auto save error:', error)
                toast.error('Lỗi khi tự động lưu', { id: 'auto-save' })
            } finally {
                setSaving(false)
            }
        }

        if (id && evaluation && debouncedFormData) {
            autoSave()
        }
    }, [debouncedFormData, id, evaluation, saving])


    // --- Handlers ---

    const handleFormChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleEvidenceChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            evidenceAssessment: {
                ...prev.evidenceAssessment,
                [name]: value
            }
        }))
    }

    const handleSubmitEvaluation = async () => {
        if (!confirm('Bạn có chắc chắn muốn NỘP đánh giá này? Đánh giá đã nộp sẽ không thể chỉnh sửa được nữa.')) return

        setSaving(true)
        try {
            // Cập nhật lần cuối trước khi nộp
            await apiMethods.evaluations.update(id, formData);

            await apiMethods.evaluations.submit(id)
            toast.success('Nộp đánh giá thành công!')
            router.replace(`/evaluations/${id}`)
        } catch (error) {
            console.error('Submit error:', error)
            const messages = error.response?.data?.errors?.join(', ') || error.response?.data?.message || 'Lỗi khi nộp đánh giá'
            toast.error(messages)
        } finally {
            setSaving(false)
        }
    }

    // --- Render Logic ---

    if (loading) {
        return (
            <Layout title="Chỉnh sửa đánh giá" breadcrumbItems={[]}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải đánh giá và kiểm tra quyền...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!evaluation || evaluation.status !== 'draft') {
        // Redirection đã được xử lý trong fetchEvaluationDetail
        return null;
    }

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Đánh giá của tôi', href: '/evaluations/my-evaluations' },
        { name: `Chi tiết (${evaluation.reportId?.code})`, href: `/evaluations/${id}` },
        { name: 'Chỉnh sửa' }
    ]

    const totalProgress = (
        (formData.overallComment ? 20 : 0) +
        (formData.rating ? 20 : 0) +
        (formData.evidenceAssessment.adequacy && formData.evidenceAssessment.relevance && formData.evidenceAssessment.quality ? 20 : 0) +
        (formData.strengths.length > 0 ? 10 : 0) +
        (formData.improvementAreas.length > 0 ? 15 : 0) +
        (formData.recommendations.length > 0 ? 15 : 0)
    );

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header với nút quay lại */}
                <button
                    onClick={() => router.push(`/evaluations/${id}`)}
                    className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Quay lại chi tiết
                </button>

                {/* Header - Màu xanh lam */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                    <Edit className="w-8 h-8" />
                                </div>
                                <h1 className="text-3xl font-bold">Chỉnh sửa đánh giá</h1>
                            </div>
                            <p className="text-blue-100 font-semibold">
                                Báo cáo: {evaluation.reportId?.title} (Mã: {evaluation.reportId?.code})
                            </p>
                            <p className="mt-2 text-sm text-yellow-200 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Đánh giá này đang ở trạng thái **Bản nháp**.
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="text-xs text-blue-100 font-medium">Tiến độ</div>
                            <div className="text-3xl font-bold">{totalProgress}%</div>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4 w-full bg-blue-400 rounded-full h-2.5">
                        <div
                            className="bg-green-400 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${totalProgress}%` }}
                        />
                    </div>
                </div>

                {/* Tabs điều hướng */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="flex flex-wrap border-b-2 border-blue-200">
                        {[
                            { id: 'overview', label: '1. Nhận xét & Xếp loại', icon: MessageSquare },
                            { id: 'evidence', label: '2. Minh chứng', icon: FileText },
                            { id: 'strengths', label: '3. Điểm mạnh', icon: TrendingUp },
                            { id: 'improvements', label: '4. Cải thiện', icon: AlertCircle },
                            { id: 'recommendations', label: '5. Khuyến nghị', icon: Lightbulb }
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
                        {/* Tab: Nhận xét & Xếp loại */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Nhận xét tổng thể */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <MessageSquare className="h-6 w-6 text-blue-600 mr-3" />
                                        Nhận xét tổng thể <span className="text-red-500 ml-2">*</span>
                                    </h3>
                                    <textarea
                                        rows="8"
                                        value={formData.overallComment}
                                        onChange={(e) => handleFormChange('overallComment', e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Nhập nhận xét tổng thể của bạn về báo cáo này..."
                                    />
                                </div>

                                {/* Xếp loại */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                        <Award className="h-6 w-6 text-blue-600 mr-3" />
                                        Xếp loại <span className="text-red-500 ml-2">*</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select
                                            value={formData.rating}
                                            onChange={(e) => handleFormChange('rating', e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        >
                                            <option value="">-- Chọn xếp loại --</option>
                                            <option value="excellent">Xuất sắc</option>
                                            <option value="good">Tốt</option>
                                            <option value="satisfactory">Đạt yêu cầu</option>
                                            <option value="needs_improvement">Cần cải thiện</option>
                                            <option value="poor">Kém</option>
                                        </select>
                                        {formData.rating && (
                                            <div className="flex items-center justify-center">
                                                <span className={`inline-flex items-center px-4 py-2 rounded-full text-md font-bold border-2 ${getRatingColor(formData.rating)}`}>
                                                    {getRatingLabel(formData.rating)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Minh chứng */}
                        {activeTab === 'evidence' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <FileText className="h-6 w-6 text-blue-600 mr-3" />
                                    Đánh giá minh chứng <span className="text-red-500 ml-2">*</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Tính đầy đủ */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">TÍNH ĐẦY ĐỦ</label>
                                        <select
                                            value={formData.evidenceAssessment.adequacy}
                                            onChange={(e) => handleEvidenceChange('adequacy', e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        >
                                            <option value="">-- Chọn --</option>
                                            <option value="insufficient">Không đủ</option>
                                            <option value="adequate">Đủ</option>
                                            <option value="comprehensive">Toàn diện</option>
                                        </select>
                                    </div>

                                    {/* Tính liên quan */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">TÍNH LIÊN QUAN</label>
                                        <select
                                            value={formData.evidenceAssessment.relevance}
                                            onChange={(e) => handleEvidenceChange('relevance', e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        >
                                            <option value="">-- Chọn --</option>
                                            <option value="poor">Kém</option>
                                            <option value="fair">Bình thường</option>
                                            <option value="good">Tốt</option>
                                            <option value="excellent">Xuất sắc</option>
                                        </select>
                                    </div>

                                    {/* Chất lượng */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">CHẤT LƯỢNG</label>
                                        <select
                                            value={formData.evidenceAssessment.quality}
                                            onChange={(e) => handleEvidenceChange('quality', e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        >
                                            <option value="">-- Chọn --</option>
                                            <option value="poor">Kém</option>
                                            <option value="fair">Bình thường</option>
                                            <option value="good">Tốt</option>
                                            <option value="excellent">Xuất sắc</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Điểm mạnh */}
                        {activeTab === 'strengths' && (
                            <ListEditor
                                items={formData.strengths}
                                setItems={(newItems) => handleFormChange('strengths', newItems)}
                                title="Điểm mạnh (Strengths)"
                                pointLabel="point"
                                Icon={TrendingUp}
                                itemColor="blue"
                                fields={[
                                    { name: 'point', label: 'Điểm mạnh', placeholder: 'Mô tả điểm mạnh', type: 'textarea' },
                                    { name: 'evidenceReference', label: 'Tham chiếu', placeholder: 'VD: Chương 2, Mục 2.1', type: 'text' },
                                ]}
                            />
                        )}

                        {/* Tab: Cần cải thiện */}
                        {activeTab === 'improvements' && (
                            <ListEditor
                                items={formData.improvementAreas}
                                setItems={(newItems) => handleFormChange('improvementAreas', newItems)}
                                title="Lĩnh vực cần cải thiện (Improvement Areas)"
                                pointLabel="area"
                                Icon={AlertCircle}
                                itemColor="orange"
                                fields={[
                                    { name: 'area', label: 'Lĩnh vực', placeholder: 'Mô tả lĩnh vực cần cải thiện', type: 'textarea', span: true },
                                    {
                                        name: 'priority',
                                        label: 'Mức độ ưu tiên',
                                        type: 'select',
                                        defaultValue: 'medium',
                                        options: [
                                            { value: 'low', label: 'Thấp' },
                                            { value: 'medium', label: 'Trung bình' },
                                            { value: 'high', label: 'Cao' }
                                        ]
                                    },
                                    { name: 'recommendation', label: 'Khuyến nghị chi tiết', placeholder: 'Khuyến nghị để cải thiện', type: 'textarea', span: true },
                                ]}
                            />
                        )}

                        {/* Tab: Khuyến nghị */}
                        {activeTab === 'recommendations' && (
                            <ListEditor
                                items={formData.recommendations}
                                setItems={(newItems) => handleFormChange('recommendations', newItems)}
                                title="Khuyến nghị bổ sung (Recommendations)"
                                pointLabel="recommendation"
                                Icon={Lightbulb}
                                itemColor="indigo"
                                fields={[
                                    { name: 'recommendation', label: 'Khuyến nghị', placeholder: 'Nội dung khuyến nghị', type: 'textarea', span: true },
                                    {
                                        name: 'type',
                                        label: 'Thời gian',
                                        type: 'select',
                                        defaultValue: 'short_term',
                                        options: [
                                            { value: 'immediate', label: 'Ngay lập tức' },
                                            { value: 'short_term', label: 'Ngắn hạn' },
                                            { value: 'long_term', label: 'Dài hạn' }
                                        ]
                                    },
                                    {
                                        name: 'priority',
                                        label: 'Ưu tiên',
                                        type: 'select',
                                        defaultValue: 'medium',
                                        options: [
                                            { value: 'low', label: 'Thấp' },
                                            { value: 'medium', label: 'Trung bình' },
                                            { value: 'high', label: 'Cao' }
                                        ]
                                    },
                                ]}
                            />
                        )}

                    </div>
                </div>

                {/* Footer với action buttons */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky bottom-0 z-10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="text-sm text-gray-600 flex items-center">
                            <Save className={`h-4 w-4 mr-2 ${saving ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
                            {saving ? (
                                <span className="font-semibold text-blue-600">Đang tự động lưu...</span>
                            ) : (
                                <span>
                                    Đã lưu lần cuối: <span className="font-semibold text-gray-900">{evaluation.metadata?.lastSaved ? formatDate(evaluation.metadata.lastSaved, 'hh:mm:ss') : 'Chưa có'}</span>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={handleSubmitEvaluation}
                                disabled={saving || totalProgress < 100}
                                className={`inline-flex items-center px-6 py-3 text-white rounded-xl hover:shadow-lg font-semibold transition-all ${
                                    totalProgress < 100
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
                                }`}
                                title={totalProgress < 100 ? 'Vui lòng hoàn thành tất cả các mục bắt buộc (đạt 100% tiến độ) trước khi nộp' : 'Nộp đánh giá'}
                            >
                                {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
                                Nộp đánh giá
                                {totalProgress < 100 && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-bold">
                                        {totalProgress}%
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}