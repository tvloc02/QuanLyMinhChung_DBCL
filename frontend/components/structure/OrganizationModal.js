import { useState, useEffect } from 'react'
import { X, Save, Building2, Mail, Phone, Globe, Info, Plus, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function OrganizationModal({ organization, onClose, onSuccess }) {
    const isViewMode = organization?.isViewMode || false;
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        website: '',
        contactEmail: '',
        contactPhone: '',
        status: 'active',
        departments: []
    })
    const [errors, setErrors] = useState({})
    const [departments, setDepartments] = useState([])
    const [showDeptForm, setShowDeptForm] = useState(false)
    const [editingDeptId, setEditingDeptId] = useState(null)
    const [deptFormData, setDeptFormData] = useState({
        name: '',
        email: '',
        phone: ''
    })
    const [deptErrors, setDeptErrors] = useState({})

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name || '',
                code: organization.code || '',
                website: organization.website || '',
                contactEmail: organization.contactEmail || '',
                contactPhone: organization.contactPhone || '',
                status: organization.status || 'active',
                departments: organization.departments || []
            })
            setDepartments(organization.departments || [])
        }
    }, [organization])

    const handleChange = (e) => {
        if (isViewMode) return;

        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleDeptChange = (e) => {
        const { name, value } = e.target
        setDeptFormData(prev => ({ ...prev, [name]: value }))
        if (deptErrors[name]) {
            setDeptErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validateDeptForm = () => {
        const newErrors = {}

        if (!deptFormData.name.trim()) {
            newErrors.name = 'Tên phòng ban là bắt buộc'
        }

        if (deptFormData.email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(deptFormData.email)) {
            newErrors.email = 'Email không hợp lệ'
        }

        if (deptFormData.phone && !/^[\d\s\-\+\(\)]+$/.test(deptFormData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ'
        }

        setDeptErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleAddDepartment = async (e) => {
        e.preventDefault()

        if (!validateDeptForm()) return

        try {
            setLoading(true)

            if (organization?._id) {
                // Organization đã tồn tại - gọi API
                if (editingDeptId) {
                    // Update existing department
                    try {
                        await apiMethods.organizations.updateDepartment(
                            organization._id,
                            editingDeptId,
                            deptFormData
                        )
                        setDepartments(prev =>
                            prev.map(d => d._id === editingDeptId ? { ...d, ...deptFormData } : d)
                        )
                        toast.success('Cập nhật phòng ban thành công')
                        setEditingDeptId(null)
                    } catch (apiError) {
                        const errorMsg = apiError.response?.data?.message || apiError.message
                        toast.error(`Cập nhật phòng ban thất bại: ${errorMsg}`)
                        console.error('Update department error:', apiError)
                        setLoading(false)
                        return
                    }
                } else {
                    // Add new department
                    try {
                        // Trim data trước gửi
                        const deptData = {
                            name: (deptFormData.name || '').trim(),
                            email: (deptFormData.email || '').trim() || undefined,
                            phone: (deptFormData.phone || '').trim() || undefined
                        }

                        const response = await apiMethods.organizations.addDepartment(
                            organization._id,
                            deptData
                        )

                        if (response.data?.data) {
                            setDepartments(prev => [...prev, response.data.data])
                            toast.success('Thêm phòng ban thành công')
                        }
                    } catch (apiError) {
                        const errorMsg = apiError.response?.data?.message || apiError.message
                        toast.error(`Thêm phòng ban thất bại: ${errorMsg}`)
                        console.error('Add department error:', apiError)
                        setLoading(false)
                        return
                    }
                }
            } else {
                // Tạo mới - thêm vào state local
                const newDept = {
                    _id: `temp_${Date.now()}`,
                    name: deptFormData.name,
                    email: deptFormData.email,
                    phone: deptFormData.phone,
                    createdAt: new Date()
                }

                if (editingDeptId) {
                    // Edit department in new org
                    setDepartments(prev =>
                        prev.map(d => d._id === editingDeptId ? { ...d, ...deptFormData } : d)
                    )
                    toast.success('Cập nhật phòng ban thành công')
                    setEditingDeptId(null)
                } else {
                    // Add new department to new org
                    setDepartments(prev => [...prev, newDept])
                    toast.success('Thêm phòng ban thành công')
                }
            }

            setDeptFormData({ name: '', email: '', phone: '' })
            setShowDeptForm(false)
            setLoading(false)  // ← Chú ý: setLoading TRƯỚC để form không bị disable
        } catch (error) {
            console.error('Unexpected error:', error)
            toast.error(error.message || 'Có lỗi xảy ra khi xử lý phòng ban')
            setLoading(false)
        }
    }

    const handleEditDepartment = (dept) => {
        setEditingDeptId(dept._id)
        setDeptFormData({
            name: dept.name,
            email: dept.email || '',
            phone: dept.phone || ''
        })
        setShowDeptForm(true)
    }

    const handleDeleteDepartment = async (deptId) => {
        if (!confirm('Bạn có chắc muốn xóa phòng ban này?')) return

        try {
            setLoading(true)

            if (organization?._id) {
                // Delete từ server nếu organization đã tồn tại
                try {
                    await apiMethods.organizations.deleteDepartment(organization._id, deptId)
                } catch (apiError) {
                    const errorMsg = apiError.response?.data?.message || apiError.message
                    toast.error(`Xóa phòng ban thất bại: ${errorMsg}`)
                    console.error('Delete department error:', apiError)
                    setLoading(false)
                    return
                }
            }

            // Delete từ state local
            setDepartments(prev => prev.filter(d => d._id !== deptId))
            toast.success('Xóa phòng ban thành công')
        } catch (error) {
            console.error('Unexpected error:', error)
            toast.error(error.message || 'Có lỗi xảy ra khi xóa phòng ban')
        } finally {
            setLoading(false)
        }
    }

    const handleCancelDeptForm = () => {
        setShowDeptForm(false)
        setEditingDeptId(null)
        setDeptFormData({ name: '', email: '', phone: '' })
        setDeptErrors({})
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

        if (formData.contactPhone && !/^[\d\s\-\+\(\)]+$/.test(formData.contactPhone)) {
            newErrors.contactPhone = 'Số điện thoại không hợp lệ'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (isViewMode) {
            onClose();
            return;
        }

        if (!validate()) return

        try {
            setLoading(true)

            // Xử lý departments - chỉ gửi những thay đổi thực tế
            let submitDepartments = []

            if (Array.isArray(departments) && departments.length > 0) {
                submitDepartments = departments.map(dept => ({
                    ...(dept._id && !String(dept._id).startsWith('temp_') && { _id: dept._id }),
                    name: dept.name,
                    email: dept.email || undefined,
                    phone: dept.phone || undefined
                }))
            }

            const submitData = {
                name: formData.name.trim(),
                code: formData.code.toUpperCase().trim(),
                website: formData.website ? formData.website.trim() : undefined,
                contactEmail: formData.contactEmail ? formData.contactEmail.trim() : undefined,
                contactPhone: formData.contactPhone ? formData.contactPhone.trim() : undefined,
                status: formData.status,
                departments: submitDepartments
            }

            console.log('📤 Submitting data:', {
                isUpdate: !!organization?._id,
                departmentsCount: submitDepartments.length,
                data: submitData
            })

            if (organization && !organization.isViewMode) {
                // Update organization
                try {
                    const response = await apiMethods.organizations.update(organization._id, submitData)
                    console.log('✅ Update response:', response.data)
                    toast.success('Cập nhật tổ chức thành công')
                } catch (apiError) {
                    const errorMsg = apiError.response?.data?.message || apiError.message
                    console.error('❌ Update error:', apiError.response?.data)
                    toast.error(`Cập nhật tổ chức thất bại: ${errorMsg}`)
                    setLoading(false)
                    return
                }
            } else {
                // Create new organization
                try {
                    const response = await apiMethods.organizations.create(submitData)
                    console.log('✅ Create response:', response.data)
                    toast.success('Tạo tổ chức thành công')
                } catch (apiError) {
                    const errorMsg = apiError.response?.data?.message || apiError.message
                    console.error('❌ Create error:', apiError.response?.data)
                    toast.error(`Tạo tổ chức thất bại: ${errorMsg}`)
                    setLoading(false)
                    return
                }
            }

            onSuccess()
        } catch (error) {
            console.error('❌ Unexpected error:', error)
            toast.error(error.message || 'Có lỗi xảy ra khi lưu tổ chức')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header với gradient - Xanh Lam */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Building2 className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {isViewMode ? 'Chi tiết tổ chức' : (organization ? 'Chỉnh sửa tổ chức' : 'Thêm tổ chức mới')}
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    {isViewMode ? 'Thông tin chi tiết tổ chức đánh giá' : (organization ? 'Cập nhật thông tin tổ chức đánh giá' : 'Tạo tổ chức đánh giá mới')}
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

                <form onSubmit={handleSubmit} id="organization-form" className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-220px)]">
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
                                disabled={!!organization || isViewMode}
                                readOnly={isViewMode}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase ${
                                    errors.code ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-white'
                                } ${organization || isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                                disabled={isViewMode}
                                className={`w-full px-4 py-3 border-2 border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                                <option value="suspended">Tạm ngưng</option>
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
                            disabled={isViewMode}
                            readOnly={isViewMode}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all ${
                                errors.name ? 'border-red-300 bg-red-50' : 'border-green-200 bg-white'
                            } ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                                disabled={isViewMode}
                                readOnly={isViewMode}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                                    errors.contactEmail ? 'border-red-300 bg-red-50' : 'border-purple-200 bg-white'
                                } ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                                disabled={isViewMode}
                                readOnly={isViewMode}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                    errors.contactPhone ? 'border-red-300 bg-red-50' : 'border-orange-200 bg-white'
                                } ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="0243 869 8113"
                            />
                            {errors.contactPhone && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <Info size={14} className="mr-1" />
                                    {errors.contactPhone}
                                </p>
                            )}
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
                            disabled={isViewMode}
                            readOnly={isViewMode}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                                errors.website ? 'border-red-300 bg-red-50' : 'border-cyan-200 bg-white'
                            } ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="https://example.com"
                        />
                        {errors.website && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <Info size={14} className="mr-1" />
                                {errors.website}
                            </p>
                        )}
                    </div>

                    {/* Departments Section */}
                    {!isViewMode && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-semibold text-gray-800">
                                    Danh sách phòng ban
                                </label>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        if (showDeptForm) {
                                            handleCancelDeptForm()
                                        }
                                        setShowDeptForm(!showDeptForm)
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Thêm phòng ban
                                </button>
                            </div>

                            {showDeptForm && (
                                <form onSubmit={handleAddDepartment} className="mb-4 p-4 bg-white rounded-lg border-2 border-indigo-200">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Tên phòng ban *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={deptFormData.name}
                                                onChange={handleDeptChange}
                                                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                                    deptErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                                placeholder="Nhập tên phòng ban"
                                            />
                                            {deptErrors.name && <p className="text-xs text-red-600 mt-1">{deptErrors.name}</p>}
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={deptFormData.email}
                                                onChange={handleDeptChange}
                                                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                                    deptErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                                placeholder="dept@example.com"
                                            />
                                            {deptErrors.email && <p className="text-xs text-red-600 mt-1">{deptErrors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-700 mb-1 block">Số điện thoại</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={deptFormData.phone}
                                                onChange={handleDeptChange}
                                                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                                    deptErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                                placeholder="0212345678"
                                            />
                                            {deptErrors.phone && <p className="text-xs text-red-600 mt-1">{deptErrors.phone}</p>}
                                        </div>

                                        <div className="flex gap-2 justify-end">
                                            <button
                                                type="button"
                                                onClick={handleCancelDeptForm}
                                                className="px-3 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-medium"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
                                            >
                                                {editingDeptId ? 'Cập nhật' : 'Thêm'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {departments.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">Chưa có phòng ban nào</p>
                                ) : (
                                    departments.map(dept => (
                                        <div key={dept._id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">{dept.name}</p>
                                                {dept.email && <p className="text-xs text-gray-600">{dept.email}</p>}
                                                {dept.phone && <p className="text-xs text-gray-600">{dept.phone}</p>}
                                            </div>
                                            <div className="flex gap-2 ml-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditDepartment(dept)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded transition-all"
                                                    disabled={loading}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDepartment(dept._id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-all"
                                                    disabled={loading}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {isViewMode && organization?.departments && organization.departments.length > 0 && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
                            <label className="text-sm font-semibold text-gray-800 mb-4 block">
                                Danh sách phòng ban
                            </label>
                            <div className="space-y-2">
                                {organization.departments.map(dept => (
                                    <div key={dept._id} className="bg-white p-3 rounded-lg border border-indigo-100">
                                        <p className="text-sm font-semibold text-gray-900">{dept.name}</p>
                                        {dept.email && <p className="text-xs text-gray-600">{dept.email}</p>}
                                        {dept.phone && <p className="text-xs text-gray-600">{dept.phone}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-4 p-6 border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-50 font-medium"
                    >
                        {isViewMode ? 'Đóng' : 'Hủy'}
                    </button>
                    {!isViewMode && (
                        <button
                            type="submit"
                            form="organization-form"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-medium"
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
                    )}
                </div>
            </div>
        </div>
    )
}