import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AlertCircle, Save, X, Eye, EyeOff, Plus, Trash, Users, Shield, Sparkles, Zap, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function CreateUserForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [generatedPassword, setGeneratedPassword] = useState('')
    const [expertiseInput, setExpertiseInput] = useState('')
    const [useCustomPassword, setUseCustomPassword] = useState(false)

    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        password: '',
        phoneNumber: '',
        role: 'expert',
        status: 'active',
        department: '',
        position: '',
        expertise: [],
        userGroups: [],
        mustChangePassword: true,
        academicYearAccess: [],
        programAccess: [],
        organizationAccess: [],
        standardAccess: [],
        criteriaAccess: [],
        notificationSettings: {
            email: true,
            inApp: true,
            assignment: true,
            evaluation: true,
            deadline: true
        }
    })

    const [errors, setErrors] = useState({})

    const [accessOptions, setAccessOptions] = useState({
        academicYears: [],
        programs: [],
        organizations: [],
        standards: [],
        criteria: [],
        userGroups: []
    })

    useEffect(() => {
        fetchAccessOptions()
    }, [])

    const fetchAccessOptions = async () => {
        try {
            const [academicYears, programs, organizations, standards, criteria, userGroups] = await Promise.all([
                api.get('/academic-years').catch(() => ({ data: { data: [] } })),
                api.get('/programs').catch(() => ({ data: { data: [] } })),
                api.get('/organizations').catch(() => ({ data: { data: [] } })),
                api.get('/standards').catch(() => ({ data: { data: [] } })),
                api.get('/criteria').catch(() => ({ data: { data: [] } })),
                api.get('/user-groups').catch(() => ({ data: { data: [] } }))
            ])

            setAccessOptions({
                academicYears: academicYears.data.data || [],
                programs: programs.data.data || [],
                organizations: organizations.data.data || [],
                standards: standards.data.data || [],
                criteria: criteria.data.data || [],
                userGroups: userGroups.data.data || []
            })
        } catch (error) {
            console.error('Error fetching access options:', error)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        if (type === 'checkbox') {
            if (name.includes('.')) {
                const [parent, child] = name.split('.')
                setFormData(prev => ({
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: checked
                    }
                }))
            } else {
                setFormData(prev => ({ ...prev, [name]: checked }))
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleMultiSelect = (name, value) => {
        setFormData(prev => {
            const currentValues = prev[name] || []
            if (currentValues.includes(value)) {
                return {
                    ...prev,
                    [name]: currentValues.filter(v => v !== value)
                }
            } else {
                return {
                    ...prev,
                    [name]: [...currentValues, value]
                }
            }
        })
    }

    const addExpertise = () => {
        if (expertiseInput.trim()) {
            setFormData(prev => ({
                ...prev,
                expertise: [...prev.expertise, expertiseInput.trim()]
            }))
            setExpertiseInput('')
        }
    }

    const removeExpertise = (index) => {
        setFormData(prev => ({
            ...prev,
            expertise: prev.expertise.filter((_, i) => i !== index)
        }))
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            newErrors.email = 'Email phải có định dạng hợp lệ (ví dụ: user@gmail.com)'
        }


        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ tên là bắt buộc'
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự'
        }

        if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Số điện thoại không hợp lệ'
        }

        if (useCustomPassword) {
            if (!formData.password) {
                newErrors.password = 'Mật khẩu là bắt buộc'
            } else if (formData.password.length < 6) {
                newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
            }
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
            setLoading(true)
            setMessage({ type: '', text: '' })

            const dataToSend = { ...formData }

            if (!useCustomPassword) {
                delete dataToSend.password
            }

            const response = await api.post('/api/users', dataToSend)

            if (response.data.success) {
                setGeneratedPassword(response.data.data.defaultPassword)
                setMessage({
                    type: 'success',
                    text: `Tạo người dùng thành công!`
                })

                setTimeout(() => {
                    router.push('/users/users')
                }, 3000)
            }
        } catch (error) {
            console.error('Error creating user:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi tạo người dùng'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Success/Error Message */}
            {message.text && (
                <div className={`rounded-2xl border p-6 shadow-lg ${
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
                            <h3 className={`font-bold text-lg mb-2 ${
                                message.type === 'success' ? 'text-green-900' : 'text-red-900'
                            }`}>
                                {message.type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra'}
                            </h3>
                            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                                {message.text}
                            </p>
                            {generatedPassword && (
                                <div className="mt-4 p-4 bg-white rounded-xl border border-green-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-green-900 font-semibold mb-1">Mật khẩu mặc định:</p>
                                            <p className="font-mono font-bold text-green-900 text-lg">
                                                {showPassword ? generatedPassword : '••••••••'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="px-4 py-2 text-sm text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 rounded-lg transition-all font-medium"
                                        >
                                            {showPassword ? 'Ẩn' : 'Hiện'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Layout 2 cột */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cột trái */}
                    <div className="space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                                    <Users className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Thông tin cơ bản</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                            errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                        }`}
                                        placeholder="vd: nguyenvana"
                                    />
                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.email}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500">Nhập tên đăng nhập (không cần @cmcu.edu.vn)</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                            errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                        }`}
                                        placeholder="Nguyễn Văn A"
                                    />
                                    {errors.fullName && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.fullName}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                            errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                        }`}
                                        placeholder="0123456789"
                                    />
                                    {errors.phoneNumber && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.phoneNumber}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Vai trò <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        >
                                            <option value="expert">Chuyên gia đánh giá</option>
                                            <option value="advisor">Tư vấn/Giám sát</option>
                                            <option value="manager">Cán bộ quản lý</option>
                                            <option value="admin">Quản trị viên</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Trạng thái
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        >
                                            <option value="active">Hoạt động</option>
                                            <option value="inactive">Không hoạt động</option>
                                            <option value="pending">Chờ xác nhận</option>
                                            <option value="suspended">Bị khóa</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phòng ban
                                    </label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="Phòng Đảm bảo chất lượng"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Chức vụ
                                    </label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="Chuyên viên"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mật khẩu và Bảo mật */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                                    <Shield className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Mật khẩu và Bảo mật</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!useCustomPassword}
                                            onChange={() => {
                                                setUseCustomPassword(false)
                                                setFormData(prev => ({ ...prev, password: '' }))
                                            }}
                                            className="w-5 h-5 text-indigo-600"
                                        />
                                        <div className="flex items-center space-x-2">
                                            <Sparkles className="w-5 h-5 text-indigo-600" />
                                            <span className="text-sm font-semibold text-indigo-900">
                                                Sử dụng mật khẩu mặc định
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                {!useCustomPassword && (
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-5 h-5 text-blue-600" />
                                            <p className="text-sm font-semibold text-blue-900">Mật khẩu mặc định</p>
                                        </div>
                                        <p className="text-sm text-blue-800">
                                            Định dạng:
                                            <code className="ml-2 px-3 py-1 bg-white rounded-lg font-mono border border-blue-200">TênĐăngNhập@123</code>
                                        </p>
                                        <p className="text-xs text-blue-600 mt-2">
                                            Ví dụ: nguyenvana → Nguyenvana@123
                                        </p>
                                    </div>
                                )}

                                <div className="p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="mustChangePassword"
                                            checked={formData.mustChangePassword}
                                            onChange={handleChange}
                                            className="w-5 h-5 mt-1 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                Bắt buộc đổi mật khẩu ở lần đăng nhập đầu
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Người dùng sẽ phải đổi mật khẩu ngay sau khi đăng nhập lần đầu
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Lĩnh vực chuyên môn */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Lĩnh vực chuyên môn</h3>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={expertiseInput}
                                        onChange={(e) => setExpertiseInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                                        placeholder="Nhập lĩnh vực chuyên môn"
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={addExpertise}
                                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg flex items-center gap-2 transition-all font-medium"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Thêm
                                    </button>
                                </div>

                                {formData.expertise.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.expertise.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full border-2 border-indigo-200"
                                            >
                                                <span className="text-sm font-medium">{item}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExpertise(index)}
                                                    className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-full p-1 transition-all"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cài đặt thông báo */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Cài đặt thông báo</h3>

                            <div className="space-y-3">
                                {[
                                    { name: 'email', label: 'Nhận thông báo qua email' },
                                    { name: 'inApp', label: 'Nhận thông báo trong ứng dụng' },
                                    { name: 'assignment', label: 'Thông báo phân công công việc' },
                                    { name: 'evaluation', label: 'Thông báo đánh giá' },
                                    { name: 'deadline', label: 'Thông báo deadline' }
                                ].map((item) => (
                                    <label key={item.name} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-all border border-transparent hover:border-gray-200">
                                        <input
                                            type="checkbox"
                                            name={`notificationSettings.${item.name}`}
                                            checked={formData.notificationSettings[item.name]}
                                            onChange={handleChange}
                                            className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cột phải */}
                    <div className="space-y-6">
                        {/* Nhóm người dùng */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Nhóm người dùng</h3>
                            </div>

                            {accessOptions.userGroups.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-500">Chưa có nhóm người dùng nào</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {accessOptions.userGroups.map((group) => (
                                        <label
                                            key={group._id}
                                            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                formData.userGroups?.includes(group._id)
                                                    ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.userGroups?.includes(group._id)}
                                                onChange={() => handleMultiSelect('userGroups', group._id)}
                                                className="w-5 h-5 mt-1 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-900">{group.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 font-mono">{group.code}</div>
                                                {group.description && (
                                                    <div className="text-xs text-gray-600 mt-2">{group.description}</div>
                                                )}
                                                <div className="flex items-center gap-2 mt-3">
                                                    <span className={`text-xs px-3 py-1 rounded-full font-medium border ${
                                                        group.type === 'system' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                            group.type === 'department' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                'bg-green-100 text-green-700 border-green-200'
                                                    }`}>
                                                        {group.type === 'system' ? 'Hệ thống' :
                                                            group.type === 'department' ? 'Phòng ban' : 'Tùy chỉnh'}
                                                    </span>
                                                    {group.permissions && (
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                                            {group.permissions.length} quyền
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Phân quyền truy cập */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                                    <Shield className="w-6 h-6 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Phân quyền truy cập</h3>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { key: 'academicYearAccess', label: 'Năm học', options: accessOptions.academicYears, color: 'blue' },
                                    { key: 'programAccess', label: 'Chương trình', options: accessOptions.programs, color: 'green' },
                                    { key: 'organizationAccess', label: 'Tổ chức', options: accessOptions.organizations, color: 'purple' },
                                    { key: 'standardAccess', label: 'Tiêu chuẩn', options: accessOptions.standards, color: 'orange' },
                                    { key: 'criteriaAccess', label: 'Tiêu chí', options: accessOptions.criteria, color: 'pink' }
                                ].map((section) => (
                                    section.options.length > 0 && (
                                        <div key={section.key}>
                                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                                {section.label}
                                                <span className={`ml-2 text-xs text-${section.color}-600 bg-${section.color}-50 px-3 py-1 rounded-lg font-semibold`}>
                                                    {formData[section.key].length} đã chọn
                                                </span>
                                            </label>
                                            <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 space-y-2">
                                                {section.options.map((item) => (
                                                    <label
                                                        key={item._id}
                                                        className="flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-lg cursor-pointer transition-all"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData[section.key].includes(item._id)}
                                                            onChange={() => handleMultiSelect(section.key, item._id)}
                                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-gray-700 font-medium">{item.code} - {item.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                        disabled={loading}
                    >
                        <div className="flex items-center space-x-2">
                            <X className="w-5 h-5" />
                            <span>Hủy</span>
                        </div>
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Đang tạo...</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                <span>Tạo người dùng</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}