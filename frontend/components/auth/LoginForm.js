import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowLeft,
    Moon,
    Sun,
    ArrowUpDown,
    FileText,
    BookOpen,
    TrendingUp
} from 'lucide-react'
import ForgotPassword from "./ForgotPassword";

export default function LoginForm() {
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [rememberMe, setRememberMe] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const { login } = useAuth()
    const router = useRouter()
    const backgroundImage = '/images/Login' // Đường dẫn đến ảnh background
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!formData.email || !formData.password) {
            setError('Vui lòng nhập đầy đủ thông tin')
            return
        }

        setIsLoading(true)

        try {
            const result = await login(formData.email, formData.password)

            if (result.success) {
                // Lưu remember me nếu được chọn
                if (rememberMe) {
                    localStorage.setItem('rememberLogin', 'true')
                }
                router.push('/dashboard')
            } else {
                setError(result.message || 'Đăng nhập thất bại')
            }
        } catch (err) {
            setError('Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        // Clear error when user starts typing
        if (error) setError('')
    }

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode)
    }

    // Nếu đang hiển thị form quên mật khẩu
    if (showForgotPassword) {
        return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background - chỉ áp dụng trong container này */}
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

            <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-5xl mx-auto">
                    <div className="grid lg:grid-cols-2 rounded-lg overflow-hidden shadow-2xl backdrop-blur-xl">
                        {/* Left Side - Features */}
                        <div className={`relative p-8 ${
                            isDarkMode
                                ? 'bg-gradient-to-br from-blue-900/90 to-blue-900/90'
                                : 'bg-gradient-to-br from-blue-600 to-blue-600'
                        } text-white`}>
                            <div className="absolute top-6 left-6">
                                <button
                                    onClick={toggleTheme}
                                    className={`p-3 rounded-full transition-all duration-200 ${
                                        isDarkMode
                                            ? 'text-yellow-400 bg-white/10 hover:bg-white/20'
                                            : 'text-white bg-white/20 hover:bg-white/30'
                                    }`}
                                >
                                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="text-center mb-8 mt-12">
                                <h2 className="text-3xl font-bold mb-4 leading-tight">
                                    Chào mừng đến với<br />
                                    Hệ thống quản lý minh chứng
                                </h2>
                                <p className="text-base opacity-90 leading-relaxed">
                                    Quản lý, tổ chức và theo dõi tất cả minh chứng<br />
                                    một cách hiệu quả và chuyên nghiệp.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-white/10 rounded-lg">
                                    <div className="mb-3 flex justify-center">
                                        <div className="bg-white/20 p-2 rounded-md">
                                            <ArrowUpDown className="w-6 h-6 text-white/80" />
                                        </div>
                                    </div>
                                    <h3 className="text-base font-semibold mb-1 text-center">
                                        Quản lý dễ dàng
                                    </h3>
                                    <p className="text-white/80 text-xs leading-relaxed text-center">
                                        Thêm, sửa, xóa minh chứng một cách nhanh chóng
                                    </p>
                                </div>

                                <div className="p-4 bg-white/10 rounded-lg">
                                    <div className="mb-3 flex justify-center">
                                        <div className="bg-white/20 p-2 rounded-md">
                                            <FileText className="w-6 h-6 text-white/80" />
                                        </div>
                                    </div>
                                    <h3 className="text-base font-semibold mb-1 text-center">
                                        Tổ chức khoa học
                                    </h3>
                                    <p className="text-white/80 text-xs leading-relaxed text-center">
                                        Phân loại theo tiêu chuẩn và tiêu chí
                                    </p>
                                </div>

                                <div className="p-4 bg-white/10 rounded-lg">
                                    <div className="mb-3 flex justify-center">
                                        <div className="bg-white/20 p-2 rounded-md">
                                            <BookOpen className="w-6 h-6 text-white/80" />
                                        </div>
                                    </div>
                                    <h3 className="text-base font-semibold mb-1 text-center">
                                        Import hàng loạt
                                    </h3>
                                    <p className="text-white/80 text-xs leading-relaxed text-center">
                                        Tải lên nhiều file từ Excel, folder
                                    </p>
                                </div>

                                <div className="p-4 bg-white/10 rounded-lg">
                                    <div className="mb-3 flex justify-center">
                                        <div className="bg-white/20 p-2 rounded-md">
                                            <TrendingUp className="w-6 h-6 text-white/80" />
                                        </div>
                                    </div>
                                    <h3 className="text-base font-semibold mb-1 text-center">
                                        Báo cáo chi tiết
                                    </h3>
                                    <p className="text-white/80 text-xs leading-relaxed text-center">
                                        Xuất báo cáo, thống kê đầy đủ
                                    </p>
                                </div>
                            </div>

                            <div className="absolute bottom-6 left-0 right-0 text-center">
                                <p className="text-sm text-white/70">
                                    © 2025 CMC University. Made by Digital University PMU.
                                </p>
                            </div>
                        </div>

                        {/* Right Side - Login Form */}
                        <div className={`relative p-8 ${
                            isDarkMode
                                ? 'bg-gray-900/95 border-l border-gray-700/50'
                                : 'bg-white/95 border-l border-gray-200/50'
                        }`}>
                            <div className="mb-8">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">V</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <div className="w-3 h-3 bg-white rounded-full"></div>
                                            </div>
                                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>CMC UNIVERSITY</span>
                                        </div>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                            Hệ thống quản lý minh chứng
                                        </p>
                                    </div>
                                </div>

                                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    Đăng nhập
                                </h1>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        EMAIL / TÊN ĐĂNG NHẬP
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Nhập email hoặc tên đăng nhập"
                                            autoComplete="username"
                                            className={`w-full pl-10 pr-4 py-4 text-base rounded-lg border transition-colors ${
                                                isDarkMode
                                                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400'
                                                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            MẬT KHẨU
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-blue-500 text-sm hover:underline focus:outline-none"
                                        >
                                            Quên mật khẩu?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Nhập mật khẩu"
                                            autoComplete="current-password"
                                            className={`w-full pl-10 pr-12 py-4 text-base rounded-lg border transition-colors ${
                                                isDarkMode
                                                    ? 'bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400'
                                                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500'
                                            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="remember" className={`ml-2 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                                        Ghi nhớ đăng nhập
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full py-4 px-4 text-base rounded-lg font-medium transition-all duration-200 ${
                                        isLoading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-[1.02]'
                                    } text-white shadow-lg`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Đang đăng nhập...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center space-x-2">
                                            <span>→</span>
                                            <span>Đăng nhập</span>
                                        </div>
                                    )}
                                </button>

                                <div className="text-center">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}> - HOẶC - </span>
                                </div>

                                <button
                                    type="button"
                                    className={`w-full py-4 px-4 text-base rounded-lg font-medium border transition-all ${
                                        isDarkMode
                                            ? 'bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    } flex items-center justify-center space-x-2`}
                                >
                                    <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">M</span>
                                    </div>
                                    <span>Đăng nhập với Microsoft</span>
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Made by Ban Đại học số - Trường Đại học CMC
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}