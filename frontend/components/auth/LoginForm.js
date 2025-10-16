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

    // Xóa biến backgroundImage vì không dùng nữa

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
        <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex flex-1">
                {/* Left Side - Features (2/3 màn hình) */}
                <div className={`relative flex flex-col justify-between p-12 lg:p-16 w-full lg:w-2/3 ${
                    isDarkMode
                        ? 'bg-gradient-to-br from-blue-800 to-blue-800'
                        : 'bg-gradient-to-br from-blue-600 to-blue-600'
                } text-white`}>

                    {/* Theme Toggle Button - Giữ nguyên vị trí */}
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

                    {/* Main Content */}
                    <div className="flex flex-col items-center justify-center flex-grow text-center">
                        <div className="mb-10">
                            <div className="flex items-center justify-center space-x-3 mb-6">
                                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-black text-3xl">V</span>
                                </div>
                                <div>
                                    <span className="text-base font-semibold tracking-widest text-white block">CMC UNIVERSITY</span>
                                    <p className="text-sm opacity-80">
                                        Hệ thống quản lý minh chứng
                                    </p>
                                </div>
                            </div>
                            <h2 className="text-5xl font-extrabold mb-4 leading-tight">
                                Quản lý minh chứng<br />
                                chuyên nghiệp
                            </h2>
                            <p className="text-lg opacity-90 leading-relaxed max-w-lg mx-auto">
                                Nền tảng toàn diện giúp bạn tổ chức, theo dõi và báo cáo minh chứng một cách hiệu quả nhất.
                            </p>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-6 max-w-xl">
                            <div className="p-5 bg-white/10 rounded-xl transition duration-300 hover:bg-white/20 backdrop-blur-sm">
                                <div className="mb-3 flex justify-start">
                                    <div className="bg-white/20 p-3 rounded-lg">
                                        <ArrowUpDown className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-1">
                                    Quản lý dễ dàng
                                </h3>
                                <p className="text-white/80 text-sm">
                                    Thêm, sửa, xóa minh chứng nhanh chóng và trực quan.
                                </p>
                            </div>

                            <div className="p-5 bg-white/10 rounded-xl transition duration-300 hover:bg-white/20 backdrop-blur-sm">
                                <div className="mb-3 flex justify-start">
                                    <div className="bg-white/20 p-3 rounded-lg">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-1">
                                    Tổ chức khoa học
                                </h3>
                                <p className="text-white/80 text-sm">
                                    Phân loại theo tiêu chuẩn, tiêu chí rõ ràng, dễ tìm kiếm.
                                </p>
                            </div>

                            <div className="p-5 bg-white/10 rounded-xl transition duration-300 hover:bg-white/20 backdrop-blur-sm">
                                <div className="mb-3 flex justify-start">
                                    <div className="bg-white/20 p-3 rounded-lg">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-1">
                                    Import hàng loạt
                                </h3>
                                <p className="text-white/80 text-sm">
                                    Tải lên đồng thời nhiều file từ Excel, Folder giúp tiết kiệm thời gian.
                                </p>
                            </div>

                            <div className="p-5 bg-white/10 rounded-xl transition duration-300 hover:bg-white/20 backdrop-blur-sm">
                                <div className="mb-3 flex justify-start">
                                    <div className="bg-white/20 p-3 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-1">
                                    Báo cáo chi tiết
                                </h3>
                                <p className="text-white/80 text-sm">
                                    Xuất báo cáo, thống kê đầy đủ, hỗ trợ ra quyết định.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center">
                        <p className="text-sm text-white/70">
                            © 2025 CMC University. Made by Digital University PMU.
                        </p>
                    </div>
                </div>

                {/* Right Side - Login Form (1/3 màn hình) */}
                <div className={`relative flex flex-col justify-center items-center w-full lg:w-1/3 p-8 sm:p-12 ${
                    isDarkMode
                        ? 'bg-gray-900 border-l border-gray-700'
                        : 'bg-white border-l border-gray-200'
                }`}>
                    <div className="w-full max-w-sm">
                        <div className="mb-8">
                            <h1 className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                Đăng nhập
                            </h1>
                            <p className={`mt-2 text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Vui lòng nhập thông tin tài khoản của bạn.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
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
                                        className={`w-full pl-10 pr-4 py-3 text-base rounded-lg border transition-colors ${
                                            isDarkMode
                                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-400'
                                                : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                        MẬT KHẨU
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="text-blue-500 text-sm hover:underline font-medium focus:outline-none"
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
                                        className={`w-full pl-10 pr-12 py-3 text-base rounded-lg border transition-colors ${
                                            isDarkMode
                                                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-400'
                                                : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500'
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

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="remember"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="remember" className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Ghi nhớ đăng nhập
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3 px-4 text-lg rounded-lg font-bold transition-all duration-200 ${
                                    isLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                } text-white shadow-lg`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Đang đăng nhập...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                        <span>Đăng nhập</span>
                                        <span>→</span>
                                    </div>
                                )}
                            </button>

                            <div className="text-center">
                                <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}> - HOẶC - </span>
                            </div>

                            <button
                                type="button"
                                className={`w-full py-3 px-4 text-base rounded-lg font-medium border transition-all ${
                                    isDarkMode
                                        ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                                } flex items-center justify-center space-x-2`}
                            >
                                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">M</span>
                                </div>
                                <span>Đăng nhập với Microsoft</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}