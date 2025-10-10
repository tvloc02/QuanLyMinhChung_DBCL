import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import { apiMethods } from '../../../services/api'
import toast from 'react-hot-toast'
import {
    Plus, Save, ArrowLeft, User, FileText, Calendar,
    AlertCircle, X, Loader2
} from 'lucide-react'

export default function CreateAssignmentPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { reportId } = router.query

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const [reports, setReports] = useState([])
    const [experts, setExperts] = useState([])

    const [formData, setFormData] = useState({
        reportId: reportId || '',
        expertId: '',
        deadline: '',
        priority: 'normal',
        assignmentNote: ''
    })

    const [formErrors, setFormErrors] = useState({})

    const breadcrumbItems = [
        { name: 'Báo cáo', icon: FileText, path: '/reports/reports' },
        { name: 'Phân công', path: '/reports/assignments' },
        { name: 'Tạo phân công mới', icon: Plus }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user) {
            fetchInitialData()
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (reportId) {
            setFormData(prev => ({ ...prev, reportId }))
        }
    }, [reportId])

    const fetchInitialData = async () => {
        try {
            setLoading(true)
            const [reportsRes, expertsRes] = await Promise.all([
                apiMethods.reports.getAll({ status: 'published', limit: 1000 }),
                apiMethods.users.getAll({ role: 'expert' })
            ])
            setReports(reportsRes.data?.data?.reports || [])
            setExperts(expertsRes.data?.data?.users || [])
        } catch (error) {
            console.error('Fetch data error:', error)
            toast.error('Lỗi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    const validateForm = () => {
        const errors = {}
        if (!formData.reportId) errors.reportId = 'Vui lòng chọn báo cáo'
        if (!formData.expertId) errors.expertId = 'Vui lòng chọn chuyên gia'
        if (!formData.deadline) errors.deadline = 'Vui lòng chọn hạn chót'

        const deadlineDate = new Date(formData.deadline)
        if (deadlineDate < new Date()) {
            errors.deadline = 'Hạn chót phải sau ngày hiện tại'
        }

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
            const response = await apiMethods.assignments.create(formData)

            if (response.data.success) {
                toast.success('Tạo phân công thành công')
                setTimeout(() => {
                    router.push('/reports/assignments')
                }, 1500)
            }
        } catch (error) {
            console.error('Create assignment error:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi tạo phân công'
            })
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
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="max-w-8xl mx-auto space-y-6">
                {/* Message Alert */}
                {message.text && (
                    <div className={`rounded-2xl border p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
                        message.type === 'success'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                    }`}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    message.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                    <AlertCircle className={`w-7 h-7 ${
                                        message.type === 'success' ? 'text-green-600' : 'text-red-600'
                                    }`} />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className={`font-bold text-lg mb-1 ${
                                    message.type === 'success' ? 'text-green-900' : 'text-red-900'
                                }`}>
                                    {message.type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra'}
                                </h3>
                                <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                                    {message.text}
                                </p>
                            </div>
                            <button
                                onClick={() => setMessage({ type: '', text: '' })}
                                className="ml-4 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Tạo phân công mới</h1>
                                <p className="text-purple-100">Phân công chuyên gia đánh giá báo cáo</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/reports/assignments')}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-purple-600 rounded-xl hover:shadow-xl transition-all font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Quay lại</span>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="space-y-6">
                        {/* Báo cáo */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <FileText className="w-4 h-4 inline mr-1" />
                                Báo cáo <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.reportId}
                                onChange={(e) => handleChange('reportId', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                                    formErrors.reportId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                                disabled={!!reportId}
                            >
                                <option value="">Chọn báo cáo</option>
                                {reports.map(report => (
                                    <option key={report._id} value={report._id}>
                                        {report.code} - {report.title}
                                    </option>
                                ))}
                            </select>
                            {formErrors.reportId && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.reportId}</p>
                            )}
                        </div>

                        {/* Chuyên gia */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                Chuyên gia <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.expertId}
                                onChange={(e) => handleChange('expertId', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                                    formErrors.expertId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                            >
                                <option value="">Chọn chuyên gia</option>
                                {experts.map(expert => (
                                    <option key={expert._id} value={expert._id}>
                                        {expert.fullName} - {expert.email}
                                    </option>
                                ))}
                            </select>
                            {formErrors.expertId && (
                                <p className="mt-1 text-sm text-red-600">{formErrors.expertId}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Hạn chót */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Hạn chót <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.deadline}
                                    onChange={(e) => handleChange('deadline', e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                                        formErrors.deadline ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                />
                                {formErrors.deadline && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.deadline}</p>
                                )}
                            </div>

                            {/* Mức độ ưu tiên */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Mức độ ưu tiên
                                </label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => handleChange('priority', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                >
                                    <option value="low">Thấp</option>
                                    <option value="normal">Bình thường</option>
                                    <option value="high">Cao</option>
                                    <option value="urgent">Khẩn cấp</option>
                                </select>
                            </div>
                        </div>

                        {/* Ghi chú */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Ghi chú phân công
                            </label>
                            <textarea
                                value={formData.assignmentNote}
                                onChange={(e) => handleChange('assignmentNote', e.target.value)}
                                rows={4}
                                maxLength={1000}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                                placeholder="Nhập ghi chú hoặc hướng dẫn cho chuyên gia..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.assignmentNote.length}/1000 ký tự
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => router.push('/reports/assignments')}
                                className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-xl disabled:opacity-50 transition-all font-medium"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Tạo phân công</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    )
}