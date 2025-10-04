import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AlertCircle, Save, X, Eye, EyeOff, Plus, Trash, Users, Shield } from 'lucide-react'
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
        } else {
            const cleanEmail = formData.email.replace('@cmcu.edu.vn', '')
            if (!/^[a-zA-Z0-9]+$/.test(cleanEmail)) {
                newErrors.email = 'Email không hợp lệ'
            }
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
                    text: `Tạo người dùng thành công! ${response.data.data.defaultPassword ? 'Mật khẩu mặc định: ' + response.data.data.defaultPassword : ''}`
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
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Message Alert */}
                {message.text && (
                    <div className={`p-4 rounded-lg ${
                        message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <div>
                                <p>{message.text}</p>
                                {generatedPassword && (
                                    <p className="mt-2 font-mono font-bold">
                                        Mật khẩu: {showPassword ? generatedPassword : '••••••••'}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="ml-2 text-sm underline"
                                        >
                                            {showPassword ? 'Ẩn' : 'Hiện'}
                                        </button>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Layout 2 cột cho màn hình lớn */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cột trái */}
                    <div className="space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Thông tin cơ bản
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="vd: nguyenvana"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">Nhập tên đăng nhập (không cần @cmcu.edu.vn)</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.fullName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Nguyễn Văn A"
                                    />
                                    {errors.fullName && (
                                        <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0123456789"
                                    />
                                    {errors.phoneNumber && (
                                        <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vai trò <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="expert">Chuyên gia đánh giá</option>
                                            <option value="advisor">Tư vấn/Giám sát</option>
                                            <option value="manager">Cán bộ quản lý</option>
                                            <option value="admin">Quản trị viên</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Trạng thái
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="active">Hoạt động</option>
                                            <option value="inactive">Không hoạt động</option>
                                            <option value="pending">Chờ xác nhận</option>
                                            <option value="suspended">Bị khóa</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phòng ban
                                    </label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Phòng Đảm bảo chất lượng"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chức vụ
                                    </label>
                                    <input
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Chuyên viên"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mật khẩu và Bảo mật */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Mật khẩu và Bảo mật
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!useCustomPassword}
                                            onChange={() => {
                                                setUseCustomPassword(false)
                                                setFormData(prev => ({ ...prev, password: '' }))
                                            }}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Sử dụng mật khẩu mặc định
                                        </span>
                                    </label>
                                </div>

                                {!useCustomPassword && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            <strong>Mật khẩu mặc định:</strong> Định dạng:
                                            <code className="ml-1 px-2 py-1 bg-blue-100 rounded">TênĐăngNhập@123</code>
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            Ví dụ: nguyenvana → Nguyenvana@123
                                        </p>
                                    </div>
                                )}

                                <div className="p-4 border border-gray-200 rounded-lg">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="mustChangePassword"
                                            checked={formData.mustChangePassword}
                                            onChange={handleChange}
                                            className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-gray-900">
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
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lĩnh vực chuyên môn</h3>

                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={expertiseInput}
                                        onChange={(e) => setExpertiseInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                                        placeholder="Nhập lĩnh vực chuyên môn"
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={addExpertise}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Thêm
                                    </button>
                                </div>

                                {formData.expertise.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.expertise.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full"
                                            >
                                                <span className="text-sm">{item}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExpertise(index)}
                                                    className="text-blue-600 hover:text-blue-800"
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
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt thông báo</h3>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="notificationSettings.email"
                                        checked={formData.notificationSettings.email}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Nhận thông báo qua email</span>
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="notificationSettings.inApp"
                                        checked={formData.notificationSettings.inApp}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Nhận thông báo trong ứng dụng</span>
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="notificationSettings.assignment"
                                        checked={formData.notificationSettings.assignment}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Thông báo phân công công việc</span>
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="notificationSettings.evaluation"
                                        checked={formData.notificationSettings.evaluation}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Thông báo đánh giá</span>
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="notificationSettings.deadline"
                                        checked={formData.notificationSettings.deadline}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Thông báo deadline</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải */}
                    <div className="space-y-6">
                        {/* Nhóm người dùng */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Nhóm người dùng
                            </h3>

                            {accessOptions.userGroups.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    Chưa có nhóm người dùng nào
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {accessOptions.userGroups.map((group) => (
                                        <label
                                            key={group._id}
                                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                formData.userGroups?.includes(group._id)
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.userGroups?.includes(group._id)}
                                                onChange={() => handleMultiSelect('userGroups', group._id)}
                                                className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900">{group.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{group.code}</div>
                                                {group.description && (
                                                    <div className="text-xs text-gray-600 mt-1">{group.description}</div>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                                        group.type === 'system' ? 'bg-purple-100 text-purple-700' :
                                                            group.type === 'department' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-green-100 text-green-700'
                                                    }`}>
                                                        {group.type === 'system' ? 'Hệ thống' :
                                                            group.type === 'department' ? 'Phòng ban' : 'Tùy chỉnh'}
                                                    </span>
                                                    {group.permissions && (
                                                        <span className="text-xs text-gray-500">
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
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Phân quyền truy cập
                            </h3>

                            <div className="space-y-6">
                                {/* Năm học */}
                                {accessOptions.academicYears.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Năm học ({formData.academicYearAccess.length} đã chọn)
                                        </label>
                                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                            {accessOptions.academicYears.map((item) => (
                                                <label
                                                    key={item._id}
                                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.academicYearAccess.includes(item._id)}
                                                        onChange={() => handleMultiSelect('academicYearAccess', item._id)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{item.code} - {item.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Chương trình */}
                                {accessOptions.programs.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Chương trình ({formData.programAccess.length} đã chọn)
                                        </label>
                                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                            {accessOptions.programs.map((item) => (
                                                <label
                                                    key={item._id}
                                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.programAccess.includes(item._id)}
                                                        onChange={() => handleMultiSelect('programAccess', item._id)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{item.code} - {item.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tổ chức */}
                                {accessOptions.organizations.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tổ chức ({formData.organizationAccess.length} đã chọn)
                                        </label>
                                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                            {accessOptions.organizations.map((item) => (
                                                <label
                                                    key={item._id}
                                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.organizationAccess.includes(item._id)}
                                                        onChange={() => handleMultiSelect('organizationAccess', item._id)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{item.code} - {item.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tiêu chuẩn */}
                                {accessOptions.standards.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tiêu chuẩn ({formData.standardAccess.length} đã chọn)
                                        </label>
                                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                            {accessOptions.standards.map((item) => (
                                                <label
                                                    key={item._id}
                                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.standardAccess.includes(item._id)}
                                                        onChange={() => handleMultiSelect('standardAccess', item._id)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{item.code} - {item.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tiêu chí */}
                                {accessOptions.criteria.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tiêu chí ({formData.criteriaAccess.length} đã chọn)
                                        </label>
                                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                            {accessOptions.criteria.map((item) => (
                                                <label
                                                    key={item._id}
                                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.criteriaAccess.includes(item._id)}
                                                        onChange={() => handleMultiSelect('criteriaAccess', item._id)}
                                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{item.code} - {item.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions - Sticky bottom */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 -mb-6">
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <X className="w-5 h-5" />
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Đang tạo...' : 'Tạo người dùng'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}