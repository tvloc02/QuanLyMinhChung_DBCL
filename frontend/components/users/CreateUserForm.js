// frontend/components/users/CreateUserForm.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import {
    ArrowLeft, Save, User, Mail, Phone, Briefcase, Building,
    Shield, AlertCircle, Check, Eye, EyeOff, X, UserPlus
} from 'lucide-react'
import api from '../../services/api'

export default function CreateUserForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [generatedPassword, setGeneratedPassword] = useState('')

    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        phoneNumber: '',
        roles: ['expert'],
        department: '',
        position: '',
        academicYearAccess: [],
        programAccess: [],
        organizationAccess: [],
        standardAccess: [],
        criteriaAccess: []
    })

    const [errors, setErrors] = useState({})

    const roleOptions = [
        {
            value: 'admin',
            label: 'Quản trị viên',
            color: 'from-red-500 to-pink-500',
            description: 'Toàn quyền quản trị hệ thống'
        },
        {
            value: 'manager',
            label: 'Cán bộ quản lý',
            color: 'from-blue-500 to-indigo-500',
            description: 'Quản lý và phê duyệt báo cáo'
        },
        {
            value: 'expert',
            label: 'Chuyên gia',
            color: 'from-green-500 to-emerald-500',
            description: 'Thực hiện đánh giá các tiêu chí'
        },
        {
            value: 'advisor',
            label: 'Tư vấn',
            color: 'from-purple-500 to-violet-500',
            description: 'Tư vấn và giám sát quá trình'
        }
    ]

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleRoleToggle = (roleValue) => {
        setFormData(prev => {
            const currentRoles = prev.roles || []
            const newRoles = currentRoles.includes(roleValue)
                ? currentRoles.filter(r => r !== roleValue)
                : [...currentRoles, roleValue]

            return {
                ...prev,
                roles: newRoles.length > 0 ? newRoles : ['expert']
            }
        })
    }

    const validateForm = () => {
        const newErrors = {}

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc'
        } else {
            const cleanEmail = formData.email.replace('@cmcu.edu.vn', '').replace('@cmc.edu.vn', '')
            if (!/^[a-zA-Z0-9]+$/.test(cleanEmail)) {
                newErrors.email = 'Email không hợp lệ (chỉ chứa chữ và số)'
            }
        }

        // Full name validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ và tên là bắt buộc'
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự'
        } else if (formData.fullName.trim().length > 100) {
            newErrors.fullName = 'Họ và tên không được quá 100 ký tự'
        }

        // Phone validation
        if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Số điện thoại không hợp lệ (10-11 số)'
        }

        // Department validation
        if (formData.department && formData.department.length > 100) {
            newErrors.department = 'Phòng ban không được quá 100 ký tự'
        }

        // Position validation
        if (formData.position && formData.position.length > 100) {
            newErrors.position = 'Chức vụ không được quá 100 ký tự'
        }

        // Roles validation
        if (!formData.roles || formData.roles.length === 0) {
            newErrors.roles = 'Phải chọn ít nhất một vai trò'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            setMessage({
                type: 'error',
                text: 'Vui lòng kiểm tra lại thông tin nhập vào'
            })
            return
        }

        try {
            setLoading(true)
            setMessage({ type: '', text: '' })

            const response = await api.post('/users', formData)

            if (response.data.success) {
                setGeneratedPassword(response.data.data.defaultPassword)
                setMessage({
                    type: 'success',
                    text: 'Tạo người dùng thành công!'
                })

                // Scroll to top to see the password
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        } catch (error) {
            console.error('Create user error:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi tạo người dùng'
            })
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } finally {
            setLoading(false)
        }
    }

    const handleBackToList = () => {
        router.push('/users')
    }

    const handleCreateAnother = () => {
        setFormData({
            email: '',
            fullName: '',
            phoneNumber: '',
            roles: ['expert'],
            department: '',
            position: '',
            academicYearAccess: [],
            programAccess: [],
            organizationAccess: [],
            standardAccess: [],
            criteriaAccess: []
        })
        setGeneratedPassword('')
        setErrors({})
        setMessage({ type: '', text: '' })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="space-y-6">
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
                                {message.type === 'success' ? (
                                    <Check className="w-7 h-7 text-green-600" />
                                ) : (
                                    <AlertCircle className="w-7 h-7 text-red-600" />
                                )}
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

                            {/* Show generated password */}
                            {message.type === 'success' && generatedPassword && (
                                <div className="mt-4 p-4 bg-white border-2 border-green-300 rounded-xl">
                                    <p className="text-sm font-semibold text-green-900 mb-2">
                                        Mật khẩu mặc định:
                                    </p>
                                    <div className="flex items-center justify-between bg-green-50 px-4 py-3 rounded-lg">
                                        <code className="text-lg font-mono font-bold text-green-900">
                                            {showPassword ? generatedPassword : '••••••••'}
                                        </code>
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-green-700 mt-2">
                                        ⚠️ Vui lòng lưu lại mật khẩu này. Người dùng sẽ cần thay đổi mật khẩu khi đăng nhập lần đầu.
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setMessage({ type: '', text: '' })}
                            className="ml-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Action buttons after success */}
                    {message.type === 'success' && (
                        <div className="mt-4 flex gap-3 justify-end">
                            <button
                                onClick={handleBackToList}
                                className="px-6 py-2.5 bg-white text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 transition-all font-medium"
                            >
                                Về danh sách
                            </button>
                            <button
                                onClick={handleCreateAnother}
                                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                            >
                                Tạo người dùng khác
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <UserPlus className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Tạo người dùng mới</h1>
                            <p className="text-indigo-100">Thêm người dùng mới vào hệ thống</p>
                        </div>
                    </div>
                    <button
                        onClick={handleBackToList}
                        className="flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 transition-all font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Thông tin cơ bản</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Email */}
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                                <Mail className="w-4 h-4 text-indigo-600" />
                                <span>Email <span className="text-red-500">*</span></span>
                            </label>
                            <input
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Ví dụ: nguyenvana hoặc nguyenvana@cmc.edu.vn"
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.email}
                                </p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">
                                Nhập tên đăng nhập hoặc email đầy đủ. Hệ thống sẽ tự động xử lý.
                            </p>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                                <User className="w-4 h-4 text-indigo-600" />
                                <span>Họ và tên <span className="text-red-500">*</span></span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Nhập họ và tên đầy đủ"
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                    errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                            />
                            {errors.fullName && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.fullName}
                                </p>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                                <Phone className="w-4 h-4 text-indigo-600" />
                                <span>Số điện thoại</span>
                            </label>
                            <input
                                type="text"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="Nhập số điện thoại (10-11 số)"
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                    errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                            />
                            {errors.phoneNumber && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.phoneNumber}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Department */}
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Building className="w-4 h-4 text-indigo-600" />
                                    <span>Phòng ban</span>
                                </label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    placeholder="Nhập tên phòng ban"
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                        errors.department ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                />
                                {errors.department && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.department}
                                    </p>
                                )}
                            </div>

                            {/* Position */}
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Briefcase className="w-4 h-4 text-indigo-600" />
                                    <span>Chức vụ</span>
                                </label>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    placeholder="Nhập chức vụ"
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                        errors.position ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                />
                                {errors.position && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.position}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Roles */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b-2 border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Shield className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Vai trò <span className="text-red-500">*</span>
                                </h2>
                                <p className="text-sm text-gray-600">Chọn một hoặc nhiều vai trò cho người dùng</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roleOptions.map((role) => {
                                const isSelected = formData.roles.includes(role.value)
                                return (
                                    <div
                                        key={role.value}
                                        onClick={() => handleRoleToggle(role.value)}
                                        className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                isSelected
                                                    ? 'border-indigo-600 bg-indigo-600'
                                                    : 'border-gray-300'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${role.color} text-white`}>
                                                        {role.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{role.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {errors.roles && (
                            <p className="mt-4 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.roles}
                            </p>
                        )}
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={handleBackToList}
                        disabled={loading}
                        className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                    >
                        <Save className="w-5 h-5" />
                        <span>{loading ? 'Đang tạo...' : 'Tạo người dùng'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}