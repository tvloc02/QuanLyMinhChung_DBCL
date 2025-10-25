import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/common/Layout'
import {
    User, Mail, Phone, Building, Calendar, Edit, Save, X, Lock,
    Shield, Bell, BarChart3, FileText, ClipboardCheck, Users,
    Eye, EyeOff, Award, TrendingUp, AlertCircle, CheckCircle, Home, Loader2, Briefcase
} from 'lucide-react'

export default function UserProfile() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/', icon: Home },
        { name: 'Thông tin cá nhân' }
    ]

    const [profileForm, setProfileForm] = useState({
        fullName: '',
        phoneNumber: '',
        department: '',
        position: '',
        notificationSettings: {
            email: true,
            inApp: true,
            assignment: true,
            evaluation: true,
            deadline: true
        }
    })

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const [errors, setErrors] = useState({})
    const [successMessage, setSuccessMessage] = useState('')

    // HÀM GIÚP ĐỊNH DẠNG EMAIL ĐÚNG
    const formatEmail = (email) => {
        if (!email) return 'Chưa cập nhật'

        // Nếu email đã có @, trả về nguyên dạng
        if (email.includes('@')) {
            return email
        }

        // Nếu chỉ là username, thêm @cmc.edu.vn
        return `${email}@cmc.edu.vn`
    }

    useEffect(() => {
        fetchUserProfile()
    }, [])

    const fetchUserProfile = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setUser(result.data)
                    setProfileForm({
                        fullName: result.data.fullName || '',
                        phoneNumber: result.data.phoneNumber || '',
                        department: result.data.department || '',
                        position: result.data.position || '',
                        notificationSettings: result.data.notificationSettings || {
                            email: true,
                            inApp: true,
                            assignment: true,
                            evaluation: true,
                            deadline: true
                        }
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleProfileUpdate = async () => {
        try {
            setErrors({})
            setSuccessMessage('')

            const token = localStorage.getItem('token')
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileForm)
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setUser(result.data)
                setIsEditingProfile(false)
                setSuccessMessage('Cập nhật thông tin thành công!')
                setTimeout(() => setSuccessMessage(''), 3000)
            } else {
                setErrors({ profile: result.message || 'Có lỗi xảy ra' })
            }
        } catch (error) {
            setErrors({ profile: 'Lỗi kết nối server' })
        }
    }

    const handlePasswordChange = async () => {
        try {
            setErrors({})
            setSuccessMessage('')

            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                setErrors({ password: 'Mật khẩu xác nhận không khớp' })
                return
            }

            if (passwordForm.newPassword.length < 6) {
                setErrors({ password: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
                return
            }

            const token = localStorage.getItem('token')
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setIsChangingPassword(false)
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                })
                setSuccessMessage('Đổi mật khẩu thành công!')
                setTimeout(() => setSuccessMessage(''), 3000)
            } else {
                setErrors({ password: result.message || 'Có lỗi xảy ra' })
            }
        } catch (error) {
            setErrors({ password: 'Lỗi kết nối server' })
        }
    }

    const formatDate = (date) => {
        if (!date) return 'Chưa cập nhật'
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                </div>
            </Layout>
        )
    }

    return (
        <Layout breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header - Màu xanh lam đồng bộ */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-6">
                            <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white border-opacity-30">
                                <User className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{user?.fullName || 'Người dùng'}</h1>
                                <div className="flex items-center space-x-4 text-blue-100">
                                    <div className="flex items-center">
                                        <Mail className="w-4 h-4 mr-2" />
                                        <span>{formatEmail(user?.email)}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center">
                                        <Shield className="w-4 h-4 mr-2" />
                                        <span>{user?.role || 'Người dùng'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 lg:mt-0 flex space-x-3">
                            {!isChangingPassword && (
                                <button
                                    onClick={() => setIsChangingPassword(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all font-semibold"
                                >
                                    <Lock className="w-4 h-4" />
                                    <span>Đổi mật khẩu</span>
                                </button>
                            )}
                            {!isEditingProfile && !isChangingPassword && (
                                <button
                                    onClick={() => setIsEditingProfile(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all font-semibold"
                                >
                                    <Edit className="w-4 h-4" />
                                    <span>Chỉnh sửa</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                            <p className="text-green-800 font-medium">{successMessage}</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {(errors.profile || errors.password) && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                            <p className="text-red-800">{errors.profile || errors.password}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Profile Information - Màu xanh lam đồng bộ */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200">
                            <div className="px-6 py-4 border-b border-blue-200 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
                                {isEditingProfile && (
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setIsEditingProfile(false)
                                                setProfileForm({
                                                    fullName: user?.fullName || '',
                                                    phoneNumber: user?.phoneNumber || '',
                                                    department: user?.department || '',
                                                    position: user?.position || '',
                                                    notificationSettings: user?.notificationSettings || {}
                                                })
                                                setErrors({})
                                            }}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-all font-medium"
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleProfileUpdate}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 rounded-xl text-sm text-white hover:bg-blue-700 transition-all font-semibold"
                                        >
                                            <Save className="h-4 w-4 mr-1" />
                                            Lưu
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                                        <dt className="flex items-center text-sm font-medium text-gray-600 mb-1">
                                            <User className="h-4 w-4 mr-2 text-blue-600" />
                                            Họ và tên
                                        </dt>
                                        <dd>
                                            {isEditingProfile ? (
                                                <input
                                                    type="text"
                                                    value={profileForm.fullName}
                                                    onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-900 font-semibold">{user?.fullName || 'Chưa cập nhật'}</p>
                                            )}
                                        </dd>
                                    </div>

                                    <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                                        <dt className="flex items-center text-sm font-medium text-gray-600 mb-1">
                                            <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                            Email
                                        </dt>
                                        <dd>
                                            <p className="text-sm text-gray-900 font-semibold">{formatEmail(user?.email)}</p>
                                        </dd>
                                    </div>

                                    <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                                        <dt className="flex items-center text-sm font-medium text-gray-600 mb-1">
                                            <Phone className="h-4 w-4 mr-2 text-blue-600" />
                                            Số điện thoại
                                        </dt>
                                        <dd>
                                            {isEditingProfile ? (
                                                <input
                                                    type="tel"
                                                    value={profileForm.phoneNumber}
                                                    onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-900 font-semibold">{user?.phoneNumber || 'Chưa cập nhật'}</p>
                                            )}
                                        </dd>
                                    </div>

                                    <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                                        <dt className="flex items-center text-sm font-medium text-gray-600 mb-1">
                                            <Building className="h-4 w-4 mr-2 text-blue-600" />
                                            Phòng ban
                                        </dt>
                                        <dd>
                                            {isEditingProfile ? (
                                                <input
                                                    type="text"
                                                    value={profileForm.department}
                                                    onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-900 font-semibold">{user?.department || 'Chưa cập nhật'}</p>
                                            )}
                                        </dd>
                                    </div>

                                    <div className="sm:col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <dt className="flex items-center text-sm font-medium text-gray-600 mb-1">
                                            <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                                            Chức vụ
                                        </dt>
                                        <dd>
                                            {isEditingProfile ? (
                                                <input
                                                    type="text"
                                                    value={profileForm.position}
                                                    onChange={(e) => setProfileForm({...profileForm, position: e.target.value})}
                                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-900 font-semibold">{user?.position || 'Chưa cập nhật'}</p>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Change Password */}
                        {isChangingPassword && (
                            <div className="bg-white rounded-xl shadow-lg border border-blue-200">
                                <div className="px-6 py-4 border-b border-blue-200 flex items-center justify-between bg-blue-50">
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <Lock className="h-5 w-5 mr-2 text-blue-600" />
                                        Đổi mật khẩu
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setIsChangingPassword(false)
                                            setPasswordForm({
                                                currentPassword: '',
                                                newPassword: '',
                                                confirmPassword: ''
                                            })
                                            setErrors({})
                                        }}
                                        className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-white"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mật khẩu hiện tại
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showOldPassword ? 'text' : 'password'}
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                                className="w-full px-4 py-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                placeholder="Nhập mật khẩu hiện tại"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowOldPassword(!showOldPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                                className="w-full px-4 py-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                placeholder="Nhập mật khẩu mới"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Xác nhận mật khẩu mới
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                                className="w-full px-4 py-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                placeholder="Xác nhận mật khẩu mới"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            onClick={() => {
                                                setIsChangingPassword(false)
                                                setPasswordForm({
                                                    currentPassword: '',
                                                    newPassword: '',
                                                    confirmPassword: ''
                                                })
                                            }}
                                            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handlePasswordChange}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
                                        >
                                            Cập nhật mật khẩu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notification Settings */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200">
                            <div className="px-6 py-4 border-b border-blue-200">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Bell className="h-5 w-5 mr-2 text-blue-600" />
                                    Cài đặt thông báo
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {[
                                        { key: 'email', label: 'Thông báo qua email', icon: '📧' },
                                        { key: 'inApp', label: 'Thông báo trong ứng dụng', icon: '🔔' },
                                        { key: 'assignment', label: 'Phân công công việc', icon: '📋' },
                                        { key: 'evaluation', label: 'Kết quả đánh giá', icon: '⭐' },
                                        { key: 'deadline', label: 'Nhắc nhở thời hạn', icon: '⏰' }
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                                            <label className="flex items-center cursor-pointer flex-1">
                                                <span className="text-lg mr-3">{item.icon}</span>
                                                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                                            </label>
                                            <input
                                                type="checkbox"
                                                checked={profileForm.notificationSettings?.[item.key] ?? false}
                                                onChange={(e) => setProfileForm({
                                                    ...profileForm,
                                                    notificationSettings: {
                                                        ...profileForm.notificationSettings,
                                                        [item.key]: e.target.checked
                                                    }
                                                })}
                                                disabled={!isEditingProfile}
                                                className="w-5 h-5 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Access Rights */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200">
                            <div className="px-6 py-4 border-b border-blue-200">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                                    Quyền truy cập
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Năm học</p>
                                        <div className="flex flex-wrap gap-2">
                                            {user?.academicYearAccess?.length > 0 ? (
                                                user.academicYearAccess.map(item => (
                                                    <span key={item._id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                            {item.name}
                          </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500">Chưa có quyền</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Chương trình đào tạo</p>
                                        <div className="flex flex-wrap gap-2">
                                            {user?.programAccess?.length > 0 ? (
                                                user.programAccess.map(item => (
                                                    <span key={item._id} className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                            {item.name}
                          </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500">Chưa có quyền</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Tiêu chuẩn</p>
                                        <div className="flex flex-wrap gap-2">
                                            {user?.standardAccess?.length > 0 ? (
                                                user.standardAccess.map(item => (
                                                    <span key={item._id} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-200">
                            {item.name}
                          </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500">Chưa có quyền</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Account Info */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200">
                            <div className="px-6 py-4 border-b border-blue-200 bg-blue-50">
                                <h2 className="text-lg font-semibold text-gray-900">Thông tin tài khoản</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-xs text-blue-600 mb-1">Đăng nhập cuối</p>
                                    <p className="text-sm font-semibold text-blue-900">{formatDate(user?.lastLogin)}</p>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <p className="text-xs text-indigo-600 mb-1">Số lần đăng nhập</p>
                                    <p className="text-sm font-semibold text-indigo-900">{user?.loginCount || 0} lần</p>
                                </div>
                                <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
                                    <p className="text-xs text-sky-600 mb-1">Ngày tham gia</p>
                                    <p className="text-sm font-semibold text-sky-900">{formatDate(user?.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200">
                            <div className="px-6 py-4 border-b border-blue-200 bg-blue-50">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                                    Thống kê hoạt động
                                </h2>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center">
                                        <FileText className="h-5 w-5 text-blue-600 mr-3" />
                                        <span className="text-sm text-blue-900 font-medium">Báo cáo</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-700">
                    {user?.metadata?.totalReports || 0}
                  </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center">
                                        <ClipboardCheck className="h-5 w-5 text-green-600 mr-3" />
                                        <span className="text-sm text-green-900 font-medium">Đánh giá</span>
                                    </div>
                                    <span className="text-lg font-bold text-green-700">
                    {user?.metadata?.totalEvaluations || 0}
                  </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-center">
                                        <Award className="h-5 w-5 text-yellow-600 mr-3" />
                                        <span className="text-sm text-yellow-900 font-medium">Điểm TB</span>
                                    </div>
                                    <span className="text-lg font-bold text-yellow-700">
                    {user?.metadata?.averageEvaluationScore?.toFixed(1) || '0.0'}
                  </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <div className="flex items-center">
                                        <TrendingUp className="h-5 w-5 text-indigo-600 mr-3" />
                                        <span className="text-sm text-indigo-900 font-medium">Phân công</span>
                                    </div>
                                    <span className="text-lg font-bold text-indigo-700">
                    {user?.metadata?.totalAssignments || 0}
                  </span>
                                </div>
                            </div>
                        </div>

                        {/* User Groups */}
                        {user?.userGroups?.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg border border-blue-200">
                                <div className="px-6 py-4 border-b border-blue-200 bg-blue-50">
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                                        Nhóm người dùng
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-2">
                                        {user.userGroups.map(group => (
                                            <div key={group._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                                                <span className="text-sm font-medium text-gray-900">{group.name}</span>
                                                <span className="text-xs text-blue-600 font-semibold">{group.code}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    )
}