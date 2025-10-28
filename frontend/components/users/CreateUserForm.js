import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    ArrowLeft, Save, User, Mail, Phone, Briefcase, Building,
    Shield, AlertCircle, Check, Eye, EyeOff, X, UserPlus, Loader2
} from 'lucide-react'
import api from '../../services/api'

export default function CreateUserForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [generatedPassword, setGeneratedPassword] = useState('')
    const [departments, setDepartments] = useState([])

    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        phoneNumber: '',
        roles: [''],
        department: '',
        position: ''
    })

    const [errors, setErrors] = useState({})

    const roleOptions = [
        {
            value: 'admin',
            label: 'Quản trị viên',
            color: 'from-red-600 to-pink-600', // Đã giữ nguyên cho Admin
            description: 'Quản trị hệ thống'
        },
        {
            value: 'manager',
            label: 'Cán bộ quản lý tự đánh giá',
            color: 'from-indigo-600 to-blue-600', // Tông xanh/indigo
            description: 'Chức vụ cao nhất trong phòng ban'
        },
        {
            value: 'tdg',
            label: 'Cán bộ TĐG',
            color: 'from-sky-600 to-blue-600', // Tông xanh lam
            description: 'Được giao đẩy file minh chứng và báo cáo'
        },
        {
            value: 'expert',
            label: 'Chuyên gia đánh giá',
            color: 'from-teal-600 to-emerald-600', // Tông xanh ngọc
            description: 'Thực hiện đánh giá các tiêu chí'
        }
    ]

    useEffect(() => {
        fetchDepartments()
    }, [])

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/api/departments', {
                params: {
                    status: 'active',
                    limit: 100
                }
            })
            if (response.data.success) {
                setDepartments(response.data.data.departments)
            }
        } catch (error) {
            console.error('Error fetching departments:', error)
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleRoleChange = (roleValue) => {
        setFormData(prev => {
            const newRoles = prev.roles.includes(roleValue)
                ? prev.roles.filter(r => r !== roleValue)
                : [...prev.roles, roleValue]

            return {
                ...prev,
                roles: newRoles.length > 0 ? newRoles : ['expert'],
                role: (newRoles.length > 0 ? newRoles : ['expert'])[0]
            }
        })
        if (errors.roles) {
            setErrors(prev => ({ ...prev, roles: '' }))
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc'
        } else {
            const emailInput = formData.email.trim()
            const fullEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
            const usernameRegex = /^[a-zA-Z0-9]+$/

            if (!fullEmailRegex.test(emailInput) && !usernameRegex.test(emailInput)) {
                newErrors.email = 'Email không hợp lệ'
            }
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ và tên là bắt buộc'
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự'
        }

        if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Số điện thoại không hợp lệ (10-11 số)'
        }

        if (!formData.department) {
            newErrors.department = 'Phòng ban là bắt buộc'
        }

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
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }

        try {
            setLoading(true)
            setMessage({ type: '', text: '' })

            const submitData = {
                email: formData.email.trim(),
                fullName: formData.fullName.trim(),
                phoneNumber: formData.phoneNumber?.trim() || '',
                roles: formData.roles,
                role: formData.roles[0] || 'expert',
                departmentRole: formData.roles[0] === 'expert' ? 'expert' : formData.roles[0],
                position: formData.position?.trim() || '',
                department: formData.department
            }

            const response = await api.post('/api/users', submitData)

            if (response.data.success) {
                setGeneratedPassword(response.data.data.defaultPassword)
                setMessage({
                    type: 'success',
                    text: 'Tạo người dùng thành công!'
                })

                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        } catch (error) {
            console.error('Create user error:', error)
            console.error('Error response:', error.response?.data)

            const errorMessage = error.response?.data?.message || 'Lỗi khi tạo người dùng'
            const validationErrors = error.response?.data?.errors

            setMessage({
                type: 'error',
                text: errorMessage
            })

            if (validationErrors && Array.isArray(validationErrors)) {
                const backendErrors = {}
                validationErrors.forEach(err => {
                    if (err.path) {
                        backendErrors[err.path] = err.msg
                    }
                })
                setErrors(backendErrors)
            }

            window.scrollTo({ top: 0, behavior: 'smooth' })
        } finally {
            setLoading(false)
        }
    }

    const handleBackToList = () => {
        router.push('/users/users')
    }

    const handleCreateAnother = () => {
        setFormData({
            email: '',
            fullName: '',
            phoneNumber: '',
            roles: ['expert'],
            department: '',
            position: ''
        })
        setGeneratedPassword('')
        setErrors({})
        setMessage({ type: '', text: '' })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="space-y-6">
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

                            {message.type === 'success' && generatedPassword && (
                                <div className="mt-4 p-4 bg-white border-2 border-green-300 rounded-xl">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Mật khẩu mặc định:</p>
                                    <div className="flex items-center space-x-2">
                                        <code className="flex-1 px-3 py-2 bg-green-50 rounded-lg font-mono text-sm font-semibold text-green-900">
                                            {generatedPassword}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedPassword)
                                                alert('Đã sao chép!')
                                            }}
                                            className="px-3 py-2 text-green-600 hover:bg-green-100 rounded-lg transition-all"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {message.type === 'success' && (
                                <div className="mt-6 flex items-center space-x-3">
                                    <button
                                        type="button"
                                        onClick={handleCreateAnother}
                                        className="px-6 py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all"
                                    >
                                        Tạo người dùng khác
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleBackToList}
                                        className="px-6 py-3 text-sm font-semibold text-green-700 border-2 border-green-300 hover:bg-green-50 rounded-xl transition-all"
                                    >
                                        Quay lại danh sách
                                    </button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setMessage({ type: '', text: '' })} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <UserPlus className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Tạo người dùng mới</h1>
                            <p className="text-blue-100">Thêm người dùng mới vào hệ thống</p>
                        </div>
                    </div>
                    <button
                        onClick={handleBackToList}
                        className="flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 transition-all font-semibold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200 overflow-hidden">
                    <div className="bg-blue-50 px-6 py-4 border-b-2 border-blue-200">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Thông tin cơ bản</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                                <Mail className="w-4 h-4 text-blue-600" />
                                <span>Email / Username <span className="text-red-500">*</span></span>
                            </label>
                            <input
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="nguyenvana hoặc nguyenvana@example.com"
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                    errors.email ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                }`}
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                                <User className="w-4 h-4 text-blue-600" />
                                <span>Họ và tên <span className="text-red-500">*</span></span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Nhập họ và tên đầy đủ"
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                    errors.fullName ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                }`}
                            />
                            {errors.fullName && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.fullName}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Phone className="w-4 h-4 text-blue-600" />
                                    <span>Số điện thoại</span>
                                </label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="0912345678"
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                        errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                    }`}
                                />
                                {errors.phoneNumber && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.phoneNumber}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Briefcase className="w-4 h-4 text-blue-600" />
                                    <span>Chức vụ</span>
                                </label>
                                <input
                                    type="text"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    placeholder="Nhập chức vụ"
                                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                                <Building className="w-4 h-4 text-blue-600" />
                                <span>Phòng ban <span className="text-red-500">*</span></span>
                            </label>
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                    errors.department ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                }`}
                            >
                                <option value="">Chọn phòng ban</option>
                                {departments.map(dept => (
                                    <option key={dept._id} value={dept._id}>
                                        {dept.name} ({dept.code})
                                    </option>
                                ))}
                            </select>
                            {errors.department && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.department}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Vai trò */}
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200 overflow-hidden">
                    <div className="bg-blue-50 px-6 py-4 border-b-2 border-blue-200">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Vai trò <span className="text-red-500">*</span>
                                </h2>
                                <p className="text-sm text-gray-600">Chọn vai trò hệ thống cho người dùng</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roleOptions.map((role) => {
                                const isSelected = formData.roles.includes(role.value)
                                return (
                                    <label
                                        key={role.value}
                                        className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-600'
                                                    : 'border-gray-300'
                                            }`}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleRoleChange(role.value)}
                                                    className="hidden"
                                                />
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${role.color} text-white`}>
                                                        {role.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">{role.description}</p>
                                            </div>
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                        {errors.roles && (
                            <p className="mt-4 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors.roles}
                            </p>
                        )}
                        <div className="mt-4 text-sm text-gray-600">
                            Đã chọn: <span className="font-bold text-blue-600">{formData.roles.length}</span> vai trò
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={handleBackToList}
                        disabled={loading}
                        className="px-8 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-100 rounded-xl transition-all font-medium disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Đang tạo...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                <span>Tạo người dùng</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}