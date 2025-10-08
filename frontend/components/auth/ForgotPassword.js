import { useState } from 'react'
import { Mail, ArrowLeft, CheckCircle, Moon, Sun } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function ForgotPassword({ onBackToLogin, isDarkMode: parentDarkMode, onToggleTheme }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [error, setError] = useState('')
    const [isDarkMode, setIsDarkMode] = useState(parentDarkMode || false)

    const toggleTheme = () => {
        const newDarkMode = !isDarkMode
        setIsDarkMode(newDarkMode)
        if (onToggleTheme) {
            onToggleTheme(newDarkMode)
        }
    }

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!email) {
            setError('Vui lòng nhập địa chỉ email')
            return
        }

        if (!validateEmail(email)) {
            setError('Địa chỉ email không hợp lệ')
            return
        }

        try {
            setLoading(true)
            await apiMethods.forgotPassword(email)
            setEmailSent(true)
            toast.success('Email khôi phục mật khẩu đã được gửi')
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Lỗi gửi email khôi phục'
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleResendEmail = async () => {
        try {
            setLoading(true)
            await apiMethods.forgotPassword(email)
            toast.success('Email đã được gửi lại')
        } catch (error) {
            toast.error('Lỗi gửi email')
        } finally {
            setLoading(false)
        }
    }

    if (emailSent) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                {/* Background */}
                <div className={`absolute inset-0 ${
                    isDarkMode
                        ? 'bg-gradient-to-br from-gray-900 to-gray-800'
                        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
                }`} />

                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), 
                               linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                        backgroundSize: '30px 30px'
                    }}></div>
                </div>

                <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-md w-full space-y-8">
                        {/* Theme Toggle */}
                        <div className="absolute top-6 right-6">
                            <button
                                onClick={toggleTheme}
                                className={`p-3 rounded-full transition-all duration-200 ${
                                    isDarkMode
                                        ? 'text-yellow-400 bg-white/10 hover:bg-white/20'
                                        : 'text-gray-600 bg-white/20 hover:bg-white/30'
                                }`}
                            >
                                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className={`mt-6 text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Email đã được gửi
                            </h2>
                            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến
                            </p>
                            <p className="text-sm font-medium text-blue-600">
                                {email}
                            </p>
                        </div>

                        <div className={`${
                            isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
                        } rounded-lg shadow-xl backdrop-blur-xl p-6`}>
                            <div className="space-y-4">
                                <div className="text-center">
                                    <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Vui lòng kiểm tra hộp thư email của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Nếu bạn không thấy email, hãy kiểm tra thư mục spam hoặc thư rác.
                                    </p>
                                </div>

                                <div className="flex flex-col space-y-3">
                                    <button
                                        onClick={handleResendEmail}
                                        disabled={loading}
                                        className={`w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                                            isDarkMode
                                                ? 'border-gray-600 text-gray-200 bg-gray-800/50 hover:bg-gray-700/50'
                                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
                                    >
                                        {loading ? 'Đang gửi...' : 'Gửi lại email'}
                                    </button>

                                    <button
                                        onClick={onBackToLogin}
                                        className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Quay lại đăng nhập
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Cần hỗ trợ? Liên hệ{' '}
                                <a href="mailto:support@cmc.edu.vn" className="text-blue-600 hover:text-blue-500">
                                    support@cmc.edu.vn
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className={`absolute inset-0 ${
                isDarkMode
                    ? 'bg-gradient-to-br from-gray-900 to-gray-800'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-100'
            }`} />

            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}></div>
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    {/* Theme Toggle */}
                    <div className="absolute top-6 right-6">
                        <button
                            onClick={toggleTheme}
                            className={`p-3 rounded-full transition-all duration-200 ${
                                isDarkMode
                                    ? 'text-yellow-400 bg-white/10 hover:bg-white/20'
                                    : 'text-gray-600 bg-white/20 hover:bg-white/30'
                            }`}
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">V</span>
                            </div>
                            <div>
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>CMC UNIVERSITY</p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Hệ thống quản lý minh chứng</p>
                            </div>
                        </div>
                        <h2 className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Quên mật khẩu?
                        </h2>
                        <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu
                        </p>
                    </div>

                    <div className={`${
                        isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
                    } rounded-lg shadow-xl backdrop-blur-xl p-6`}>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Địa chỉ email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            setError('')
                                        }}
                                        placeholder="Nhập địa chỉ email"
                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                            isDarkMode
                                                ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400'
                                                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500'
                                        } ${error ? 'border-red-500' : ''}`}
                                        required
                                    />
                                </div>
                                {error && (
                                    <p className="text-red-500 text-sm mt-2">{error}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Đang gửi...
                                    </div>
                                ) : (
                                    'Gửi email khôi phục'
                                )}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={onBackToLogin}
                                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Quay lại đăng nhập
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="text-center">
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            © 2025 CMC University. Made by Digital University PMU.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}