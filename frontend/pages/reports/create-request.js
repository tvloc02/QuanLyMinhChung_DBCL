import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import toast from 'react-hot-toast'
import {
    FileText, Save, ArrowLeft, Plus, AlertCircle, RefreshCw, X, Check, BookOpen, Building2, Calendar, Loader2, Info, List, Zap
} from 'lucide-react'
import { apiMethods } from '../../services/api'

const REPORT_TYPES = [
    { value: 'criteria_analysis', label: 'Phân tích tiêu chí' },
    { value: 'standard_analysis', label: 'Phân tích tiêu chuẩn' },
    { value: 'comprehensive_report', label: 'Báo cáo tổng hợp' }
]

export default function CreateRequestPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([]) // <-- Thêm Standards
    const [criteria, setCriteria] = useState([])   // <-- Thêm Criteria
    const [tdgUsers, setTdgUsers] = useState([])

    const [showUserModal, setShowUserModal] = useState(false)
    const [showTypesModal, setShowTypesModal] = useState(false)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        programId: '',
        organizationId: '',
        standardId: '', // <-- Thêm standardId
        criteriaId: '', // <-- Thêm criteriaId
        deadline: '',
        priority: 'normal',
        types: [],
        assignedTo: []
    })

    const [formErrors, setFormErrors] = useState({})

    const breadcrumbItems = [
        { name: 'Báo cáo', icon: FileText, path: '/reports/reports' },
        { name: 'Tạo yêu cầu viết báo cáo', icon: Plus }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user && user.role === 'manager') {
            fetchInitialData()
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (formData.programId && formData.organizationId) {
            fetchStandards()
        } else {
            setStandards([])
            setFormData(prev => ({ ...prev, standardId: '', criteriaId: '' }))
        }
    }, [formData.programId, formData.organizationId])

    useEffect(() => {
        if (formData.standardId) {
            fetchCriteria()
        } else {
            setCriteria([])
            setFormData(prev => ({ ...prev, criteriaId: '' }))
        }
    }, [formData.standardId])


    const fetchInitialData = async () => {
        try {
            setLoading(true)
            const [programsRes, orgsRes, usersRes] = await Promise.all([
                apiMethods.programs.getAll({ status: 'active' }),
                apiMethods.organizations.getAll({ status: 'active' }),
                apiMethods.users.getAll({ role: 'tdg', limit: 100 })
            ])
            setPrograms(programsRes.data.data.programs || [])
            setOrganizations(orgsRes.data.data.organizations || [])
            setTdgUsers(usersRes.data.data.users || [])
        } catch (error) {
            console.error('Fetch initial data error:', error)
            setMessage({ type: 'error', text: 'Lỗi tải dữ liệu ban đầu' })
        } finally {
            setLoading(false)
        }
    }

    const fetchStandards = async () => {
        try {
            const response = await apiMethods.standards.getAll({
                programId: formData.programId,
                organizationId: formData.organizationId
            })
            setStandards(response.data?.data?.standards || response.data?.data || [])
        } catch (error) {
            console.error('Fetch standards error:', error)
            setStandards([])
        }
    }

    const fetchCriteria = async () => {
        try {
            const response = await apiMethods.criteria.getAll({
                standardId: formData.standardId
            })
            const criteriaData = response.data?.data?.criterias ||
                response.data?.data?.criteria ||
                response.data?.data || []
            setCriteria(criteriaData)
        } catch (error) {
            console.error('Fetch criteria error:', error)
            setCriteria([])
        }
    }

    const validateForm = () => {
        const errors = {}
        const types = formData.types
        const isComprehensive = types.length === 1 && types.includes('comprehensive_report')
        const requiresStandard = types.includes('standard_analysis')
        const requiresCriteria = types.includes('criteria_analysis')

        if (!formData.title.trim()) errors.title = 'Tiêu đề là bắt buộc'
        if (!formData.description.trim()) errors.description = 'Mô tả là bắt buộc'
        if (!formData.programId) errors.programId = 'Chương trình là bắt buộc'
        if (!formData.organizationId) errors.organizationId = 'Tổ chức là bắt buộc'
        if (!formData.deadline) errors.deadline = 'Hạn chót là bắt buộc'
        if (formData.assignedTo.length === 0) errors.assignedTo = 'Chọn ít nhất 1 người'
        if (formData.types.length === 0) errors.types = 'Chọn loại báo cáo là bắt buộc'

        if (!isComprehensive) {
            if (requiresCriteria && !formData.criteriaId) {
                errors.criteriaId = 'Phân tích tiêu chí bắt buộc chọn Tiêu chí'
                errors.standardId = 'Tiêu chí cần Tiêu chuẩn cha'
            } else if (requiresStandard && !formData.standardId) {
                errors.standardId = 'Phân tích tiêu chuẩn/tiêu chí bắt buộc chọn Tiêu chuẩn'
            }
            if (formData.criteriaId && !formData.standardId) {
                errors.standardId = 'Không thể chọn Tiêu chí mà không chọn Tiêu chuẩn'
            }
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ và chính xác thông tin bắt buộc' })
            return
        }

        try {
            setSubmitting(true)

            // Lấy standardId và criteriaId dựa trên loại báo cáo
            let standardIdToSend = formData.standardId || null
            let criteriaIdToSend = formData.criteriaId || null

            const types = formData.types
            const isComprehensive = types.length === 1 && types.includes('comprehensive_report')

            // Nếu chỉ là báo cáo tổng hợp, không gửi standardId/criteriaId để tránh lỗi
            if (isComprehensive) {
                standardIdToSend = null
                criteriaIdToSend = null
            }

            // Tạo yêu cầu cho từng người được giao
            const promises = formData.assignedTo.map(userId => {
                return apiMethods.reportRequests.create({
                    title: formData.title,
                    description: formData.description,
                    types: formData.types,
                    programId: formData.programId,
                    organizationId: formData.organizationId,
                    standardId: standardIdToSend, // Gửi null nếu là tổng hợp hoặc không chọn
                    criteriaId: criteriaIdToSend, // Gửi null nếu là tổng hợp hoặc không chọn
                    deadline: formData.deadline,
                    priority: formData.priority,
                    assignedTo: userId
                })
            })

            await Promise.all(promises)

            setMessage({ type: 'success', text: `Tạo yêu cầu cho ${formData.assignedTo.length} người thành công` })
            setTimeout(() => {
                router.push('/reports/requests')
            }, 1500)
        } catch (error) {
            console.error('Submit error:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi tạo yêu cầu'
            setMessage({ type: 'error', text: errorMessage })
        } finally {
            setSubmitting(false)
        }
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const toggleUserSelection = (userId) => {
        setFormData(prev => ({
            ...prev,
            assignedTo: prev.assignedTo.includes(userId)
                ? prev.assignedTo.filter(id => id !== userId)
                : [...prev.assignedTo, userId]
        }))
    }

    const toggleTypeSelection = (type) => {
        setFormData(prev => {
            const newTypes = prev.types.includes(type)
                ? prev.types.filter(t => t !== type)
                : [...prev.types, type]

            let updatedTypes = newTypes

            // Logic: Nếu chọn Tổng hợp (comprehensive_report), bỏ chọn các loại khác
            if (type === 'comprehensive_report' && !prev.types.includes(type)) {
                updatedTypes = ['comprehensive_report']
            }
            // Logic: Nếu bỏ chọn Tổng hợp, và danh sách rỗng, không làm gì.
            else if (prev.types.includes('comprehensive_report') && type !== 'comprehensive_report') {
                updatedTypes = newTypes.filter(t => t !== 'comprehensive_report')
            }

            return {
                ...prev,
                types: updatedTypes
            }
        })
    }

    const getSelectedTypeLabels = () => {
        return formData.types
            .map(t => REPORT_TYPES.find(rt => rt.value === t)?.label)
            .filter(Boolean)
            .join(', ')
    }

    if (isLoading || loading) {
        return (
            <Layout title="Đang tải..." breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user || user.role !== 'manager') {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-red-600">Chỉ Manager mới có quyền tạo yêu cầu</p>
                </div>
            </Layout>
        )
    }

    const isComprehensiveOnly = formData.types.length === 1 && formData.types.includes('comprehensive_report')
    const hasStandardOrCriteriaType = formData.types.includes('standard_analysis') || formData.types.includes('criteria_analysis')
    const showStandardCriteriaSelect = hasStandardOrCriteriaType && !isComprehensiveOnly

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {message.text && (
                    <div className={`rounded-2xl border p-6 shadow-lg ${
                        message.type === 'success'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-center">
                            <AlertCircle className={`w-5 h-5 mr-3 ${
                                message.type === 'success' ? 'text-blue-600' : 'text-red-600'
                            }`} />
                            <p className={message.type === 'success' ? 'text-blue-800' : 'text-red-800'}>
                                {message.text}
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Tạo yêu cầu viết báo cáo</h1>
                                <p className="text-blue-100">Giao nhiệm vụ viết báo cáo cho TDG</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 transition-all font-semibold"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Quay lại</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Info className="w-5 h-5 mr-2 text-blue-600" />
                            Thông tin yêu cầu
                        </h2>

                        <div className="space-y-6">
                            {/* Tiêu đề */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                        formErrors.title ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                    }`}
                                    placeholder="Nhập tiêu đề yêu cầu"
                                    maxLength={500}
                                />
                                {formErrors.title && <p className="mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 inline mr-1" />{formErrors.title}</p>}
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Mô tả chi tiết <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={4}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all ${
                                        formErrors.description ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                    }`}
                                    placeholder="Nhập mô tả chi tiết về yêu cầu"
                                    maxLength={2000}
                                />
                                {formErrors.description && <p className="mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 inline mr-1" />{formErrors.description}</p>}
                            </div>

                            {/* Chọn loại báo cáo */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Loại báo cáo được phép <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowTypesModal(true)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl text-left flex items-center justify-between font-medium transition-all ${
                                        formErrors.types
                                            ? 'border-red-300 bg-red-50 text-red-700'
                                            : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    }`}
                                >
                                    <span>
                                        {formData.types.length === 0
                                            ? 'Chọn loại báo cáo'
                                            : `Đã chọn ${formData.types.length} loại: ${getSelectedTypeLabels()}`
                                        }
                                    </span>
                                    <Plus className="w-5 h-5" />
                                </button>
                                {formErrors.types && <p className="mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 inline mr-1" />{formErrors.types}</p>}
                            </div>

                            {/* Hàng 1: Chương trình, Tổ chức */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <BookOpen className="w-4 h-4 inline mr-1 text-blue-600" />
                                        Chương trình <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.programId}
                                        onChange={(e) => handleChange('programId', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                            formErrors.programId ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                        }`}
                                    >
                                        <option value="">Chọn chương trình</option>
                                        {programs.map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.programId && <p className="mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 inline mr-1" />{formErrors.programId}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <Building2 className="w-4 h-4 inline mr-1 text-blue-600" />
                                        Tổ chức <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.organizationId}
                                        onChange={(e) => handleChange('organizationId', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                            formErrors.organizationId ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                        }`}
                                    >
                                        <option value="">Chọn tổ chức</option>
                                        {organizations.map(o => (
                                            <option key={o._id} value={o._id}>{o.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.organizationId && <p className="mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 inline mr-1" />{formErrors.organizationId}</p>}
                                </div>
                            </div>

                            {/* Hàng Tiêu chuẩn/Tiêu chí (Chỉ hiện khi không phải Báo cáo Tổng hợp) */}
                            {showStandardCriteriaSelect && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <List className="w-4 h-4 inline mr-1 text-blue-600" />
                                            Tiêu chuẩn {formData.types.includes('standard_analysis') && <span className="text-red-500">*</span>}
                                        </label>
                                        <select
                                            value={formData.standardId}
                                            onChange={(e) => handleChange('standardId', e.target.value)}
                                            disabled={!formData.programId || !formData.organizationId}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 ${
                                                formErrors.standardId ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                            }`}
                                        >
                                            <option value="">Chọn Tiêu chuẩn</option>
                                            {standards.map(s => (
                                                <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                                            ))}
                                        </select>
                                        {formErrors.standardId && <p className="mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 inline mr-1" />{formErrors.standardId}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Zap className="w-4 h-4 inline mr-1 text-blue-600" />
                                            Tiêu chí {formData.types.includes('criteria_analysis') && <span className="text-red-500">*</span>}
                                        </label>
                                        <select
                                            value={formData.criteriaId}
                                            onChange={(e) => handleChange('criteriaId', e.target.value)}
                                            disabled={!formData.standardId || !formData.types.includes('criteria_analysis')}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 ${
                                                formErrors.criteriaId ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                            }`}
                                        >
                                            <option value="">Chọn Tiêu chí</option>
                                            {criteria.map(c => (
                                                <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                                            ))}
                                        </select>
                                        {formErrors.criteriaId && <p className="mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 inline mr-1" />{formErrors.criteriaId}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Hàng 2: Hạn chót, Độ ưu tiên */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1 text-blue-600" />
                                        Hạn chót <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.deadline}
                                        onChange={(e) => handleChange('deadline', e.target.value)}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                            formErrors.deadline ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                        }`}
                                    />
                                    {formErrors.deadline && <p className="mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 inline mr-1" />{formErrors.deadline}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Độ ưu tiên
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => handleChange('priority', e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Thấp</option>
                                        <option value="normal">Bình thường</option>
                                        <option value="high">Cao</option>
                                        <option value="urgent">Khẩn cấp</option>
                                    </select>
                                </div>
                            </div>

                            {/* Giao cho TDG */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Giao cho TDG <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowUserModal(true)}
                                    className={`w-full px-4 py-3 border-2 rounded-xl text-left flex items-center justify-between font-medium transition-all ${
                                        formErrors.assignedTo
                                            ? 'border-red-300 bg-red-50 text-red-700'
                                            : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    }`}
                                >
                                    <span>
                                        {formData.assignedTo.length === 0
                                            ? 'Chọn TDG...'
                                            : `Đã chọn ${formData.assignedTo.length} người`
                                        }
                                    </span>
                                    <Plus className="w-5 h-5" />
                                </button>
                                {formErrors.assignedTo && <p className="mt-1 text-sm text-red-600"><AlertCircle className="w-4 h-4 inline mr-1" />{formErrors.assignedTo}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-8 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold disabled:opacity-50"
                            disabled={submitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl font-semibold disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Đang tạo...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Tạo yêu cầu</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal chọn loại báo cáo */}
            {showTypesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Chọn loại báo cáo được phép</h3>
                            <button
                                onClick={() => setShowTypesModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-3">
                            <p className="text-sm text-gray-600 mb-4">
                                Lưu ý: Chỉ chọn **Báo cáo tổng hợp** nếu bạn muốn báo cáo độc lập mà không liên quan đến Tiêu chuẩn/Tiêu chí cụ thể.
                            </p>
                            {REPORT_TYPES.map(type => (
                                <label
                                    key={type.value}
                                    className="flex items-center p-4 border-2 border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.types.includes(type.value)}
                                        onChange={() => toggleTypeSelection(type.value)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="ml-3 flex-1">
                                        <p className="font-semibold text-gray-900">{type.label}</p>
                                    </div>
                                    {formData.types.includes(type.value) && (
                                        <Check className="w-5 h-5 text-blue-600" />
                                    )}
                                </label>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 border-t-2 border-gray-200 p-6 flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-700">
                                Đã chọn: <span className="text-blue-600">{formData.types.length}</span> loại
                            </p>
                            <button
                                onClick={() => setShowTypesModal(false)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                            >
                                Xong
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chọn TDG */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between flex-shrink-0">
                            <h3 className="text-xl font-bold">Chọn TDG để giao nhiệm vụ</h3>
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-3 overflow-y-auto flex-1">
                            {tdgUsers.map(user => (
                                <label
                                    key={user._id}
                                    className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.assignedTo.includes(user._id)}
                                        onChange={() => toggleUserSelection(user._id)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="ml-3 flex-1">
                                        <p className="font-semibold text-gray-900">{user.fullName}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                    {formData.assignedTo.includes(user._id) && (
                                        <Check className="w-5 h-5 text-blue-600" />
                                    )}
                                </label>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 p-6 flex items-center justify-between flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-700">
                                Đã chọn: <span className="text-blue-600">{formData.assignedTo.length}</span> người
                            </p>
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                            >
                                Xong
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}