import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { User, Mail, Phone, Building, Calendar, Edit, Save, X } from 'lucide-react'
import ChangePassword from './ChangePassword'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function UserProfile() {
    const { user, checkAuth } = useAuth()
    const [isEditing, setIsEditing] = useState(false)
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        department: user?.department || '',
        position: user?.position || ''
    })

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            await apiMethods.updateUser(user.id, formData)
            await checkAuth() // Refresh user data
            toast.success('Cập nhật thông tin thành công')
            setIsEditing(false)
        } catch (error) {
            toast.error('Lỗi cập nhật thông tin')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            department: user?.department || '',
            position: user?.position || ''
        })
        setIsEditing(false)
    }

    const getRoleBadge = (role) => {
        const roleConfig = {
            admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Quản trị viên' },
            manager: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Quản lý' },
            staff: { bg: 'bg-green-100', text: 'text-green-800', label: 'Nhân viên' },
            viewer: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Người xem' }
        }

        const config = roleConfig[role] || roleConfig.viewer

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (showChangePassword) {
        return (
            <ChangePassword
                onSuccess={() => {
                    setShowChangePassword(false)
                    toast.success('Đổi mật khẩu thành công')
                }}
                onCancel={() => setShowChangePassword(false)}
            />
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <div className="px-6 py-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg -mt-10">
                                <span className="text-2xl font-bold text-gray-700">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                        </div>
                        <div className="ml-6 flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {user?.name || 'Người dùng'}
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {user?.position || 'Chức vụ'} • {user?.department || 'Phòng ban'}
                                    </p>
                                    <div className="mt-2">
                                        {getRoleBadge(user?.role)}
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowChangePassword(true)}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Đổi mật khẩu
                                    </button>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Chỉnh sửa
                                        </button>
                                    ) : (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={handleCancel}
                                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Hủy
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={loading}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                {loading ? 'Đang lưu...' : 'Lưu'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Details */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                        Thông tin cá nhân
                    </h2>
                </div>
                <div className="p-6">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        {/* Name */}
                        <div>
                            <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                <User className="h-4 w-4 mr-2" />
                                Họ và tên
                            </dt>
                            <dd>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900">{user?.name || 'Chưa cập nhật'}</p>
                                )}
                            </dd>
                        </div>

                        {/* Email */}
                        <div>
                            <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                <Mail className="h-4 w-4 mr-2" />
                                Email
                            </dt>
                            <dd>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900">{user?.email || 'Chưa cập nhật'}</p>
                                )}
                            </dd>
                        </div>

                        {/* Phone */}
                        <div>
                            <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                <Phone className="h-4 w-4 mr-2" />
                                Số điện thoại
                            </dt>
                            <dd>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900">{user?.phone || 'Chưa cập nhật'}</p>
                                )}
                            </dd>
                        </div>

                        {/* Department */}
                        <div>
                            <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                <Building className="h-4 w-4 mr-2" />
                                Phòng ban
                            </dt>
                            <dd>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900">{user?.department || 'Chưa cập nhật'}</p>
                                )}
                            </dd>
                        </div>

                        {/* Position */}
                        <div>
                            <dt className="text-sm font-medium text-gray-500 mb-2">
                                Chức vụ
                            </dt>
                            <dd>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-900">{user?.position || 'Chưa cập nhật'}</p>
                                )}
                            </dd>
                        </div>

                        {/* Join Date */}
                        <div>
                            <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                                <Calendar className="h-4 w-4 mr-2" />
                                Ngày tham gia
                            </dt>
                            <dd>
                                <p className="text-sm text-gray-900">
                                    {user?.createdAt ? formatDate(user.createdAt) : 'Chưa cập nhật'}
                                </p>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                        Thông tin tài khoản
                    </h2>
                </div>
                <div className="p-6">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-medium text-gray-500 mb-2">
                                Vai trò
                            </dt>
                            <dd>
                                {getRoleBadge(user?.role)}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm font-medium text-gray-500 mb-2">
                                Trạng thái
                            </dt>
                            <dd>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Hoạt động
                                </span>
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm font-medium text-gray-500 mb-2">
                                Đăng nhập cuối
                            </dt>
                            <dd>
                                <p className="text-sm text-gray-900">
                                    {user?.lastLogin ? formatDate(user.lastLogin) : 'Chưa có thông tin'}
                                </p>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    )
}