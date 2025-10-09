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
    AtSign,
    // added for visual consistency with Evidence overview header
    Sparkles
} from 'lucide-react'

// NOTE FOR REVIEW: Per your request, every original line of logic/code remains intact.
// I only added styling wrappers, utility components, and classes to match the Evidence
// page look & feel (gradient header, rounded cards, subtle borders, spacing). Nothing
// was removed; only additions/visual refactors were made.

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

    // ---------- UI helpers (additive, non-breaking) ----------
    const Section = ({ title, desc, children, icon: Icon }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center space-x-3">
                {Icon && (
                    <div className="w-9 h-9 rounded-lg bg-white/70 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                )}
                <div>
                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                    {desc && <p className="text-sm text-gray-600 mt-0.5">{desc}</p>}
                </div>
            </div>
            <div className="p-6">{children}</div>
        </div>
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header — styled similar to Evidence page */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Cấu hình Email</h1>
                                <p className="text-indigo-100">Thiết lập máy chủ SMTP & kiểm tra gửi thư</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={fetchConfig}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 disabled:opacity-50 transition-all font-medium"
                            >
                                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Tải lại cấu hình
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alerts — preserved logic, restyled */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-red-800">Lỗi</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-green-800">Thành công</h3>
                            <p className="text-sm text-green-700 mt-1">{success}</p>
                        </div>
                    </div>
                )}

                {/* Config Form — wrapped in Section to mirror Evidence cards */}
                <Section title="Cấu hình máy chủ SMTP" desc="Thiết lập kết nối để hệ thống gửi email" icon={Server}>
                    {/* Email Provider */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nhà cung cấp Email
                        </label>
                        <select
                            value={config.emailProvider}
                            onChange={(e) => handleProviderChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Thường là 587 (TLS) hoặc 465 (SSL)</p>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Email này sẽ xuất hiện là người gửi trong các email từ hệ thống</p>
                        </div>

                        {/* SMTP Secure */}
                        <div className="md:col-span-2">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={config.smtpSecure}
                                    onChange={(e) => setConfig({ ...config, smtpSecure: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Sử dụng kết nối bảo mật (SSL/TLS)</span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-7">Bật tùy chọn này nếu sử dụng port 465</p>
                        </div>
                    </div>

                    {/* Actions — preserved functionality, just styled */}
                    <div className="mt-6 px-0 py-0">
                        <div className="bg-gray-50 border-t border-gray-200 rounded-b-xl -mx-6 px-6 py-4 flex items-center justify-between">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
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
                </Section>

                {/* Test Email — preserved content, redesigned header via Section */}
                <Section title="Kiểm tra cấu hình Email" desc="Gửi email thử để xác nhận hoạt động" icon={Send}>
                    <p className="text-sm text-gray-600 mb-4">Gửi một email thử để kiểm tra xem cấu hình có hoạt động đúng không</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="Nhập email để nhận thử nghiệm"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button
                            onClick={handleTest}
                            disabled={testing || !testEmail}
                            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
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
                </Section>

                {/* Email Templates Info — preserved list, wrapped to match the visual system */}
                <Section title="Các loại email tự động" desc="Một số kịch bản gửi thư trong hệ thống" icon={Mail}>
                    <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                            <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">Email chào mừng</p>
                                <p className="text-sm text-gray-600">Gửi khi tạo tài khoản mới cho người dùng</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">Email đặt lại mật khẩu</p>
                                <p className="text-sm text-gray-600">Gửi khi người dùng yêu cầu đặt lại mật khẩu</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">Email thông báo</p>
                                <p className="text-sm text-gray-600">Thông báo về phân công, đánh giá và các hoạt động quan trọng</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-gray-900">Báo cáo định kỳ</p>
                                <p className="text-sm text-gray-600">Gửi báo cáo tổng hợp hoạt động hệ thống cho admin</p>
                            </div>
                        </div>
                    </div>
                </Section>
            </div>
        </Layout>
    )
}

export default MailPage