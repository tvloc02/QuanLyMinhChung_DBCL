import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Mail,
    Send,
    CheckCircle,
    AlertCircle,
    Save,
    RefreshCw,
    Eye,
    EyeOff,
    Server,
    Lock,
    User,
    AtSign
} from 'lucide-react'

const MailPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [config, setConfig] = useState({
        smtpHost: '',
        smtpPort: '587',
        smtpSecure: false,
        smtpUser: '',
        smtpPass: '',
        smtpFrom: '',
        emailProvider: 'custom'
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [testEmail, setTestEmail] = useState('')

    const breadcrumbItems = [
        { name: 'Hệ thống', icon: Mail },
        { name: 'Cấu hình Email', icon: Server }
    ]

    const emailProviders = [
        { value: 'custom', label: 'Tùy chỉnh', host: '', port: '587' },
        { value: 'gmail', label: 'Gmail', host: 'smtp.gmail.com', port: '587' },
        { value: 'outlook', label: 'Outlook', host: 'smtp.live.com', port: '587' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user && user.role !== 'admin') {
            router.replace('/dashboard')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchConfig()
        }
    }, [user])

    const fetchConfig = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/system/mail-config', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Không thể tải cấu hình email')
            }

            const result = await response.json()
            if (result.success && result.data) {
                setConfig(result.data)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleProviderChange = (provider) => {
        const selected = emailProviders.find(p => p.value === provider)
        if (selected) {
            setConfig({
                ...config,
                emailProvider: provider,
                smtpHost: selected.host,
                smtpPort: selected.port,
                smtpSecure: false
            })
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError(null)
            setSuccess(null)

            const response = await fetch('/api/system/mail-config', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Không thể lưu cấu hình')
            }

            setSuccess('Lưu cấu hình email thành công!')
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleTest = async () => {
        if (!testEmail) {
            setError('Vui lòng nhập địa chỉ email để gửi thử')
            return
        }

        try {
            setTesting(true)
            setError(null)
            setSuccess(null)

            const response = await fetch('/api/system/test-email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...config,
                    testEmail
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Không thể gửi email thử')
            }

            setSuccess(`Email thử đã được gửi đến ${testEmail}. Vui lòng kiểm tra hộp thư!`)
        } catch (err) {
            setError(err.message)
        } finally {
            setTesting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cấu hình Email</h1>
                    <p className="text-gray-600 mt-1">Cấu hình máy chủ SMTP để gửi email từ hệ thống</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-green-800">Thành công</h3>
                            <p className="text-sm text-green-700 mt-1">{success}</p>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Hướng dẫn cấu hình Gmail:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Truy cập: <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline">Google Account Security</a></li>
                                <li>Bật xác thực 2 bước (2-Step Verification)</li>
                                <li>Tạo "Mật khẩu ứng dụng" (App Password)</li>
                                <li>Sử dụng mật khẩu ứng dụng thay cho mật khẩu thường</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Config Form */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 space-y-6">
                        {/* Email Provider */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nhà cung cấp Email
                            </label>
                            <select
                                value={config.emailProvider}
                                onChange={(e) => handleProviderChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {emailProviders.map(provider => (
                                    <option key={provider.value} value={provider.value}>
                                        {provider.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* SMTP Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* SMTP Host */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Server className="w-4 h-4" />
                                        <span>SMTP Host</span>
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    value={config.smtpHost}
                                    onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                                    placeholder="smtp.gmail.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* SMTP Port */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Server className="w-4 h-4" />
                                        <span>SMTP Port</span>
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    value={config.smtpPort}
                                    onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                                    placeholder="587"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Thường là 587 (TLS) hoặc 465 (SSL)
                                </p>
                            </div>

                            {/* SMTP User */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <User className="w-4 h-4" />
                                        <span>SMTP User</span>
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    value={config.smtpUser}
                                    onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                                    placeholder="your-email@gmail.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* SMTP Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Lock className="w-4 h-4" />
                                        <span>SMTP Password</span>
                                    </div>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={config.smtpPass}
                                        onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                                        placeholder="Mật khẩu ứng dụng"
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* SMTP From */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <AtSign className="w-4 h-4" />
                                        <span>Email người gửi</span>
                                    </div>
                                </label>
                                <input
                                    type="email"
                                    value={config.smtpFrom}
                                    onChange={(e) => setConfig({ ...config, smtpFrom: e.target.value })}
                                    placeholder="noreply@yourdomain.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Email này sẽ xuất hiện là người gửi trong các email từ hệ thống
                                </p>
                            </div>

                            {/* SMTP Secure */}
                            <div className="md:col-span-2">
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={config.smtpSecure}
                                        onChange={(e) => setConfig({ ...config, smtpSecure: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Sử dụng kết nối bảo mật (SSL/TLS)
                                    </span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1 ml-7">
                                    Bật tùy chọn này nếu sử dụng port 465
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex items-center justify-between">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Đang lưu...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Lưu cấu hình</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Test Email */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Kiểm tra cấu hình Email
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Gửi một email thử để kiểm tra xem cấu hình có hoạt động đúng không
                        </p>

                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    placeholder="Nhập email để nhận thử nghiệm"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                onClick={handleTest}
                                disabled={testing || !testEmail}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {testing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Đang gửi...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>Gửi email thử</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Email Templates Info */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Các loại email tự động
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Email chào mừng</p>
                                    <p className="text-sm text-gray-600">Gửi khi tạo tài khoản mới cho người dùng</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Email đặt lại mật khẩu</p>
                                    <p className="text-sm text-gray-600">Gửi khi người dùng yêu cầu đặt lại mật khẩu</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Email thông báo</p>
                                    <p className="text-sm text-gray-600">Thông báo về phân công, đánh giá và các hoạt động quan trọng</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">Báo cáo định kỳ</p>
                                    <p className="text-sm text-gray-600">Gửi báo cáo tổng hợp hoạt động hệ thống cho admin</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default MailPage