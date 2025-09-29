import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AlertCircle, Save, X, Eye, EyeOff } from 'lucide-react'
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
        role: 'expert',
        department: '',
        position: '',
        expertise: [],
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

    // Load danh sách để phân quyền
    const [accessOptions, setAccessOptions] = useState({
        academicYears: [],
        programs: [],
        organizations: [],
        standards: [],
        criteria: []
    })

    useEffect(() => {
        fetchAccessOptions()
    }, [])

    const fetchAccessOptions = async () => {
        try {
            // Gọi API để lấy danh sách các options
            const [academicYears, programs, organizations, standards, criteria] = await Promise.all([
                api.get('/academic-years').catch(() => ({ data: { data: [] } })),
                api.get('/programs').catch(() => ({ data: { data: [] } })),
                api.get('/organizations').catch(() => ({ data: { data: [] } })),
                api.get('/standards').catch(() => ({ data: { data: [] } })),
                api.get('/criteria').catch(() => ({ data: { data: [] } }))
            ])

            setAccessOptions({
                academicYears: academicYears.data.data || [],
                programs: programs.data.data || [],
                organizations: organizations.data.data || [],
                standards: standards.data.data || [],
                criteria: criteria.data.data || []
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

        // Clear error for this field
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

            const response = await api.post('/users', formData)

            if (response.data.success) {
                setGeneratedPassword(response.data.data.defaultPassword)
                setMessage({
                    type: 'success',
                    text: `Tạo người dùng thành công! Mật khẩu mặc định: ${response.data.data.defaultPassword}`
                })

                // Redirect sau 3 giây
                setTimeout(() => {
                    router.push('/users')
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
        <div className="max-w-4xl mx-auto">
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

                {/* Thông tin cơ bản */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Actions */}
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
            </form>
        </div>
    )
}