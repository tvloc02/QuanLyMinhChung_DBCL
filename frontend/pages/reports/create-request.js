import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import toast from 'react-hot-toast'
import {
    FileText, Save, ArrowLeft, Plus, AlertCircle, RefreshCw
} from 'lucide-react'
import { apiMethods } from '../../services/api'

export default function CreateRequestPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])
    const [tdgUsers, setTdgUsers] = useState([])

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'criteria_analysis',
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        deadline: '',
        priority: 'normal',
        assignedTo: ''
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
                apiMethods.programs.getAll(),
                apiMethods.organizations.getAll(),
                apiMethods.users.getAll({ role: 'tdg' })
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
        if (!formData.programId || !formData.organizationId) return
        try {
            const response = await apiMethods.standards.getAll({
                programId: formData.programId,
                organizationId: formData.organizationId,
                status: 'active'
            })
            setStandards(response.data.data.standards || response.data.data || [])
        } catch (error) {
            console.error('Fetch standards error:', error)
            setMessage({ type: 'error', text: 'Lỗi khi tải danh sách tiêu chuẩn' })
        }
    }

    const fetchCriteria = async () => {
        if (!formData.standardId) return
        try {
            const response = await apiMethods.criteria.getAll({
                standardId: formData.standardId,
                status: 'active'
            })
            let criteriaData = []
            if (response.data.data) {
                if (Array.isArray(response.data.data.criterias)) {
                    criteriaData = response.data.data.criterias
                } else if (Array.isArray(response.data.data.criteria)) {
                    criteriaData = response.data.data.criteria
                } else if (Array.isArray(response.data.data)) {
                    criteriaData = response.data.data
                }
            }
            setCriteria(criteriaData)
        } catch (error) {
            console.error('Fetch criteria error:', error)
            setMessage({ type: 'error', text: 'Lỗi khi tải danh sách tiêu chí' })
            setCriteria([])
        }
    }

    const validateForm = () => {
        const errors = {}
        if (!formData.title.trim()) errors.title = 'Tiêu đề là bắt buộc'
        if (!formData.description.trim()) errors.description = 'Mô tả là bắt buộc'
        if (!formData.programId) errors.programId = 'Chương trình là bắt buộc'
        if (!formData.organizationId) errors.organizationId = 'Tổ chức là bắt buộc'
        if (formData.type !== 'comprehensive_report' && !formData.standardId) {
            errors.standardId = 'Tiêu chuẩn là bắt buộc'
        }
        if (formData.type === 'criteria_analysis' && !formData.criteriaId) {
            errors.criteriaId = 'Tiêu chí là bắt buộc'
        }
        if (!formData.deadline) errors.deadline = 'Hạn chót là bắt buộc'
        if (!formData.assignedTo) errors.assignedTo = 'Người nhận yêu cầu là bắt buộc'

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' })
            return
        }

        try {
            setSubmitting(true)
            const submitData = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                programId: formData.programId,
                organizationId: formData.organizationId,
                deadline: formData.deadline,
                priority: formData.priority,
                assignedTo: formData.assignedTo
            }

            if (formData.type !== 'comprehensive_report') {
                submitData.standardId = formData.standardId
            }
            if (formData.type === 'criteria_analysis') {
                submitData.criteriaId = formData.criteriaId
            }

            const response = await apiMethods.reportRequests.create(submitData)

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Tạo yêu cầu thành công' })
                setTimeout(() => {
                    router.push('/reports/requests')
                }, 1500)
            }
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

    if (isLoading || loading) {
        return (
            <Layout title="Đang tải..." breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
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
                    <p className="text-red-600">Chỉ Manager mới có quyền tạo yêu cầu</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {message.text && (
                    <div className={`rounded-2xl border p-6 shadow-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                    }`}>
                        <div className="flex items-center">
                            <AlertCircle className={`w-5 h-5 mr-3 ${
                                message.type === 'success' ? 'text-green-600' : 'text-red-600'
                            }`} />
                            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                                {message.text}
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Tạo yêu cầu viết báo cáo</h1>
                                <p className="text-indigo-100">Giao nhiệm vụ viết báo cáo cho TDG</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/reports/requests')}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:shadow-xl font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Quay lại</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin yêu cầu</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                        formErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="Nhập tiêu đề yêu cầu"
                                    maxLength={500}
                                />
                                {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Mô tả chi tiết <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={4}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                                        formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="Nhập mô tả chi tiết về yêu cầu"
                                    maxLength={2000}
                                />
                                {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Loại báo cáo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleChange('type', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="criteria_analysis">Phân tích tiêu chí</option>
                                        <option value="standard_analysis">Phân tích tiêu chuẩn</option>
                                        <option value="comprehensive_report">Báo cáo tổng hợp</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Độ ưu tiên
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => handleChange('priority', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="low">Thấp</option>
                                        <option value="normal">Bình thường</option>
                                        <option value="high">Cao</option>
                                        <option value="urgent">Khẩn cấp</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Chương trình <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.programId}
                                        onChange={(e) => handleChange('programId', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            formErrors.programId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    >
                                        <option value="">Chọn chương trình</option>
                                        {programs.map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.programId && <p className="mt-1 text-sm text-red-600">{formErrors.programId}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tổ chức <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.organizationId}
                                        onChange={(e) => handleChange('organizationId', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            formErrors.organizationId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    >
                                        <option value="">Chọn tổ chức</option>
                                        {organizations.map(o => (
                                            <option key={o._id} value={o._id}>{o.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.organizationId && <p className="mt-1 text-sm text-red-600">{formErrors.organizationId}</p>}
                                </div>

                                {formData.type !== 'comprehensive_report' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tiêu chuẩn <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.standardId}
                                            onChange={(e) => handleChange('standardId', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                formErrors.standardId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                            disabled={!formData.programId || !formData.organizationId}
                                        >
                                            <option value="">Chọn tiêu chuẩn</option>
                                            {standards.map(s => (
                                                <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                                            ))}
                                        </select>
                                        {formErrors.standardId && <p className="mt-1 text-sm text-red-600">{formErrors.standardId}</p>}
                                    </div>
                                )}

                                {formData.type === 'criteria_analysis' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tiêu chí <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.criteriaId}
                                            onChange={(e) => handleChange('criteriaId', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                                formErrors.criteriaId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                            disabled={!formData.standardId}
                                        >
                                            <option value="">Chọn tiêu chí</option>
                                            {criteria.map(c => (
                                                <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                                            ))}
                                        </select>
                                        {formErrors.criteriaId && <p className="mt-1 text-sm text-red-600">{formErrors.criteriaId}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Hạn chót <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.deadline}
                                        onChange={(e) => handleChange('deadline', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            formErrors.deadline ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    />
                                    {formErrors.deadline && <p className="mt-1 text-sm text-red-600">{formErrors.deadline}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Giao cho TDG <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.assignedTo}
                                        onChange={(e) => handleChange('assignedTo', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                            formErrors.assignedTo ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    >
                                        <option value="">Chọn TDG</option>
                                        {tdgUsers.map(u => (
                                            <option key={u._id} value={u._id}>{u.fullName}</option>
                                        ))}
                                    </select>
                                    {formErrors.assignedTo && <p className="mt-1 text-sm text-red-600">{formErrors.assignedTo}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/reports/requests')}
                            className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl disabled:opacity-50 font-medium"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
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
        </Layout>
    )
}