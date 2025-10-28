import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import {
    Save, X, AlertCircle, RefreshCw, Users, Mail, Phone,
    Building, Briefcase, Lock, Eye, EyeOff, ArrowLeft, Shield, Check
} from 'lucide-react'
import api from '../../../services/api'

export default function EditUserPage() {
    const router = useRouter()
    const { id } = router.query
    const { user: currentUser } = useAuth()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [departments, setDepartments] = useState([]) // ✨ THÊM

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        roles: [],
        status: 'active',
        department: '',
        position: '',
        password: ''
    })

    const [errors, setErrors] = useState({})

    const roleOptions = [
        {
            value: 'admin',
            label: 'Quản trị viên',
            color: 'from-red-500 to-pink-500',
            description: 'Quản trị hệ thống'
        },
        {
            value: 'manager',
            label: 'Cán bộ quản lý',
            color: 'from-blue-500 to-cyan-500',
            description: 'Chức vụ cao nhất trong phòng ban'
        },
        {
            value: 'expert',
            label: 'Chuyên gia',
            color: 'from-teal-500 to-cyan-500',
            description: 'Thực hiện đánh giá'
        },
        {
            value: 'tdg',
            label: 'Cán bộ TĐG',
            color: 'from-sky-500 to-blue-500',
            description: 'Được giao đẩy file minh chứng'
        }
    ]

    const statusOptions = [
        { value: 'active', label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
        { value: 'inactive', label: 'Không hoạt động', color: 'bg-gray-100 text-gray-800' },
        { value: 'suspended', label: 'Bị khóa', color: 'bg-red-100 text-red-800' },
        { value: 'pending', label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' }
    ]

    const breadcrumbItems = [
        { name: 'Quản lý người dùng', icon: Users, path: '/users' },
        { name: 'Chỉnh sửa người dùng', icon: Shield }
    ]

    useEffect(() => {
        if (id) {
            fetchUser()
            fetchDepartments() // ✨ THÊM
        }
    }, [id])

    const fetchUser = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/api/users/${id}`)

            if (response.data.success) {
                const user = response.data.data
                setFormData({
                    fullName: user.fullName || '',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                    roles: user.roles || [user.role] || [],
                    status: user.status || 'active',
                    department: user.department?._id || user.department || '', // ✨ THAY
                    position: user.position || '',
                    password: ''
                })
            }
        } catch (error) {
            console.error('Error fetching user:', error)
            setMessage({
                type: 'error',
                text: 'Lỗi khi tải thông tin người dùng'
            })
        } finally {
            setLoading(false)
        }
    }

    // ✨ THÊM: Fetch departments
    const fetchDepartments = async () => {
        try {
            const response = await api.get('/api/departments', {
                params: {
                    status: 'active',
                    limit: 100
                }
            })
            if (response.data.success) {
                setDepartments(response.data.data.departments || [])
            }
        } catch (error) {
            console.error('Error fetching departments:', error)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    // ✨ THAY: handleRoleToggle cho nhiều roles
    const handleRoleToggle = (roleValue) => {
        setFormData(prev => {
            const roles = prev.roles.includes(roleValue)
                ? prev.roles.filter(r => r !== roleValue)
                : [...prev.roles, roleValue]
            return { ...prev, roles }
        })
        if (errors.roles) {
            setErrors(prev => ({ ...prev, roles: '' }))
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ và tên là bắt buộc'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc'
        }

        if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Số điện thoại phải có 10-11 chữ số'
        }

        if (formData.roles.length === 0) {
            newErrors.roles = 'Vui lòng chọn ít nhất một vai trò'
        }

        if (!formData.department) { // ✨ THÊM
            newErrors.department = 'Phòng ban là bắt buộc'
        }

        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            setMessage({
                type: 'error',
                text: 'Vui lòng kiểm tra lại thông tin'
            })
            return
        }

        try {
            setSaving(true)
            const updateData = { ...formData }

            if (!updateData.password) {
                delete updateData.password
            }

            const response = await api.put(`/api/users/${id}`, updateData)

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: 'Cập nhật người dùng thành công'
                })

                setTimeout(() => {
                    router.push('/users/users')
                }, 1500)
            }
        } catch (error) {
            console.error('Error updating user:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi cập nhật người dùng'
            })
        } finally {
            setSaving(false)
        }
    }

    const canManageUsers = currentUser?.role === 'admin' || currentUser?.roles?.includes('admin')

    if (!canManageUsers) {
        return (
            <Layout title="Không có quyền truy cập" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
                        <p className="text-gray-600">Bạn không có quyền chỉnh sửa người dùng</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (loading) {
        return (
            <Layout title="Đang tải..." breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
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

                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Shield className="w-10 h-10" />
                            <div>
                                <h1 className="text-3xl font-bold">Chỉnh sửa người dùng</h1>
                                <p className="text-blue-100">Cập nhật thông tin người dùng</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/users')}
                            className="flex items-center space-x-2 px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 transition-all font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Quay lại</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Users className="w-6 h-6 text-blue-600" />
                                    Thông tin cơ bản
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Họ và tên <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                            placeholder="Nguyễn Văn A"
                                        />
                                        {errors.fullName && (
                                            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Số điện thoại
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleChange}
                                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                    errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                                placeholder="0123456789"
                                            />
                                        </div>
                                        {errors.phoneNumber && (
                                            <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Trạng thái <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        >
                                            {statusOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* ✨ THÊM: Phần chọn VAI TRÒ (nhiều roles) */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-blue-600" />
                                    Vai trò <span className="text-red-500">*</span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {roleOptions.map(role => {
                                        const isSelected = formData.roles.includes(role.value)
                                        return (
                                            <label
                                                key={role.value}
                                                className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                    isSelected
                                                        ? `border-transparent bg-gradient-to-r ${role.color} text-white shadow-lg`
                                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleRoleToggle(role.value)}
                                                    className="hidden"
                                                />
                                                <div className="text-center">
                                                    <div className={`font-bold text-sm mb-1 ${
                                                        isSelected ? 'text-white' : 'text-gray-900'
                                                    }`}>
                                                        {role.label}
                                                    </div>
                                                    <div className={`text-xs ${
                                                        isSelected ? 'text-white opacity-90' : 'text-gray-600'
                                                    }`}>
                                                        {role.description}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="mt-2 flex justify-center">
                                                            <Check className="w-4 h-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                                {errors.roles && (
                                    <p className="mt-2 text-sm text-red-600">{errors.roles}</p>
                                )}
                                <div className="mt-3 text-sm text-gray-600">
                                    Đã chọn: <span className="font-bold text-blue-600">{formData.roles.length}</span> vai trò
                                </div>
                            </div>

                            {/* ✨ THÊM: Phần chọn PHÒNG BAN */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Briefcase className="w-6 h-6 text-blue-600" />
                                    Thông tin công việc
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phòng ban <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <select
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                    errors.department ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                            >
                                                <option value="">-- Chọn phòng ban --</option>
                                                {departments.map(dept => (
                                                    <option key={dept._id} value={dept._id}>
                                                        {dept.name} ({dept.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.department && (
                                            <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Chức vụ
                                        </label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="position"
                                                value={formData.position}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                placeholder="Trưởng phòng"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Lock className="w-6 h-6 text-blue-600" />
                                    Đổi mật khẩu
                                </h2>
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Lưu ý:</strong> Chỉ nhập mật khẩu mới nếu muốn thay đổi. Để trống nếu không muốn đổi mật khẩu.
                                    </p>
                                </div>
                                <div className="max-w-md">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Mật khẩu mới
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => router.push('/users')}
                                    className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-xl disabled:opacity-50 transition-all font-medium"
                                >
                                    {saving ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            <span>Đang lưu...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            <span>Lưu thay đổi</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    )
}