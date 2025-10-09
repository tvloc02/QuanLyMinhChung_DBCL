import { useState, useEffect } from 'react'
import { X, Save, Building2, Mail, Phone, Globe, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function OrganizationModal({ organization, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        website: '',
        contactEmail: '',
        contactPhone: '',
        status: 'active'
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name || '',
                code: organization.code || '',
                website: organization.website || '',
                contactEmail: organization.contactEmail || '',
                contactPhone: organization.contactPhone || '',
                status: organization.status || 'active'
            })
        }
    }, [organization])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Tên tổ chức là bắt buộc'
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Mã tổ chức là bắt buộc'
        } else if (!/^[A-Z0-9\-_]+$/.test(formData.code)) {
            newErrors.code = 'Mã chỉ được chứa chữ hoa, số, gạch ngang và gạch dưới'
        }

        if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
            newErrors.website = 'Website phải có định dạng URL hợp lệ (http:// hoặc https://)'
        }

        if (formData.contactEmail && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.contactEmail)) {
            newErrors.contactEmail = 'Email không hợp lệ'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) return

        try {
            setLoading(true)

            const submitData = {
                ...formData,
                code: formData.code.toUpperCase()
            }

            if (organization) {
                await apiMethods.organizations.update(organization._id, submitData)
                toast.success('Cập nhật tổ chức thành công')
            } else {
                await apiMethods.organizations.create(submitData)
                toast.success('Tạo tổ chức thành công')
            }

            onSuccess()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header với gradient */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Building2 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {organization ? 'Chỉnh sửa tổ chức' : 'Thêm tổ chức mới'}
                                </h2>
                                <p className="text-green-100 text-sm">
                                    {organization ? 'Cập nhật thông tin tổ chức đánh giá' : 'Tạo tổ chức đánh giá mới'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all flex items-center justify-center text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mã tổ chức */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                                    <span className="text-white text-xs">1</span>
                                </div>
                                Mã tổ chức <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                disabled={!!organization}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase ${
                                    errors.code ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-white'
                                } ${organization ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="VD: MOET"
                            />
                            {errors.code && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <Info size={14} className="mr-1" />
                                    {errors.code}
                                </p>
                            )}
                        </div>

                        {/* Trạng thái */}
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-5">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                                <div className="w-6 h-6 bg-gray-500 rounded-lg flex items-center justify-center mr-2">
                                    <span className="text-white text-xs">2</span>
                                </div>
                                Trạng thái
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                            >
                                <option value="active">✅ Hoạt động</option>
                                <option value="inactive">⏸️ Không hoạt động</option>
                                <option value="suspended">🔒 Tạm ngưng</option>
                            </select>
                        </div>
                    </div>

                    {/* Tên tổ chức */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center mr-2">
                                <span className="text-white text-xs">3</span>
                            </div>
                            Tên tổ chức <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                                errors.name ? 'border-red-300 bg-red-50' : 'border-green-200 bg-white'
                            }`}
                            placeholder="Nhập tên tổ chức"
                        />
                        {errors.name && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <Info size={14} className="mr-1" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email liên hệ */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-5">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                                <Mail className="w-5 h-5 text-purple-500 mr-2" />
                                Email liên hệ
                            </label>
                            <input
                                type="email"
                                name="contactEmail"
                                value={formData.contactEmail}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                                    errors.contactEmail ? 'border-red-300 bg-red-50' : 'border-purple-200 bg-white'
                                }`}
                                placeholder="contact@example.com"
                            />
                            {errors.contactEmail && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <Info size={14} className="mr-1" />
                                    {errors.contactEmail}
                                </p>
                            )}
                        </div>

                        {/* Số điện thoại */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-5">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                                <Phone className="w-5 h-5 text-orange-500 mr-2" />
                                Số điện thoại
                            </label>
                            <input
                                type="text"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-orange-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                placeholder="0243 869 8113"
                            />
                        </div>
                    </div>

                    {/* Website */}
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <Globe className="w-5 h-5 text-cyan-500 mr-2" />
                            Website
                        </label>
                        <input
                            type="text"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                                errors.website ? 'border-red-300 bg-red-50' : 'border-cyan-200 bg-white'
                            }`}
                            placeholder="https://example.com"
                        />
                        {errors.website && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <Info size={14} className="mr-1" />
                                {errors.website}
                            </p>
                        )}
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-4 p-6 border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-50 font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-medium"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang lưu...</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Lưu tổ chức</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}