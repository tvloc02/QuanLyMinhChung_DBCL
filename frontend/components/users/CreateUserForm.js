import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    AlertCircle,
    Save,
    X,
    Plus,
    Shield,
    Loader2
} from 'lucide-react'
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
        roles: [], // 👈 nhiều vai trò
        status: 'active',
        department: '',
        position: '',
        expertise: [],
        mustChangePassword: true,
        notificationSettings: {
            email: true,
            inApp: true,
            assignment: true,
            evaluation: true,
            deadline: true
        }
    })

    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        if (type === 'checkbox' && name.includes('.')) {
            const [parent, child] = name.split('.')
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: checked }
            }))
        } else if (type === 'checkbox' && name === 'roles') {
            setFormData(prev => ({
                ...prev,
                roles: checked
                    ? [...prev.roles, value]
                    : prev.roles.filter(r => r !== value)
            }))
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
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
        if (!formData.email.trim()) newErrors.email = 'Email là bắt buộc'
        if (!formData.fullName.trim()) newErrors.fullName = 'Họ tên là bắt buộc'
        if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber))
            newErrors.phoneNumber = 'Số điện thoại không hợp lệ'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) {
            setMessage({ type: 'error', text: 'Vui lòng kiểm tra lại thông tin' })
            return
        }
        try {
            setLoading(true)
            const response = await api.post('/api/users', formData)
            if (response.data.success) {
                setGeneratedPassword(response.data.data.defaultPassword)
                setMessage({ type: 'success', text: 'Tạo người dùng thành công!' })
                setTimeout(() => router.push('/users/users'), 2500)
            }
        } catch (error) {
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
            {message.text && (
                <div
                    className={`rounded-2xl border p-6 shadow-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                    }`}
                >
                    <p
                        className={`font-semibold ${
                            message.type === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}
                    >
                        {message.text}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cột trái */}
                    <div className="space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                Thông tin cơ bản
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Email</label>
                                    <input
                                        type="text"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full border rounded-xl px-4 py-3"
                                        placeholder="vd: nguyenvana"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1">Họ và tên</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full border rounded-xl px-4 py-3"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1">Số điện thoại</label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full border rounded-xl px-4 py-3"
                                        placeholder="0123456789"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mật khẩu */}
                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Mật khẩu</h3>
                            <label className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    checked={useCustomPassword}
                                    onChange={(e) => setUseCustomPassword(e.target.checked)}
                                />
                                <span className="text-sm font-medium">Nhập mật khẩu thủ công</span>
                            </label>
                            {useCustomPassword && (
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full border rounded-xl px-4 py-3"
                                    placeholder="Nhập mật khẩu"
                                />
                            )}
                        </div>

                        {/* Lĩnh vực chuyên môn */}
                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Lĩnh vực chuyên môn</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={expertiseInput}
                                    onChange={(e) => setExpertiseInput(e.target.value)}
                                    placeholder="Nhập lĩnh vực"
                                    className="flex-1 border rounded-xl px-4 py-3"
                                />
                                <button
                                    type="button"
                                    onClick={addExpertise}
                                    className="px-4 py-3 bg-indigo-600 text-white rounded-xl"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            {formData.expertise.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {formData.expertise.map((exp, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border rounded-full"
                                        >
                                            <span className="text-sm">{exp}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeExpertise(i)}
                                                className="text-indigo-600 hover:text-indigo-800"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cài đặt thông báo */}
                        <div className="bg-white rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Cài đặt thông báo</h3>
                            {Object.keys(formData.notificationSettings).map((key) => (
                                <label key={key} className="flex items-center gap-2 mb-1">
                                    <input
                                        type="checkbox"
                                        name={`notificationSettings.${key}`}
                                        checked={formData.notificationSettings[key]}
                                        onChange={handleChange}
                                    />
                                    <span className="text-sm">{key}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Cột phải: Vai trò */}
                    <div className="bg-white rounded-2xl border p-6 shadow-sm h-fit">
                        <div className="flex items-center space-x-3 mb-4">
                            <Shield className="w-5 h-5 text-orange-600" />
                            <h3 className="text-lg font-bold text-gray-900">Vai trò</h3>
                        </div>

                        {['admin', 'manager', 'expert', 'advisor'].map((role) => (
                            <label key={role} className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    name="roles"
                                    value={role}
                                    checked={formData.roles.includes(role)}
                                    onChange={handleChange}
                                />
                                <span className="capitalize text-sm font-medium text-gray-700">
                  {role}
                </span>
                            </label>
                        ))}

                        {formData.roles.length === 0 && (
                            <p className="text-sm text-gray-500 italic mt-2">
                                Chưa chọn vai trò nào
                            </p>
                        )}
                    </div>
                </div>

                {/* Nút lưu */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        <Save className="w-5 h-5" /> Lưu người dùng
                    </button>
                </div>
            </form>
        </div>
    )
}
