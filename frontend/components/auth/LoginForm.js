import { useState, useEffect } from 'react'
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Moon,
    Sun,
    ArrowUpDown,
    FileText,
    BookOpen,
    TrendingUp,
    Shield,
    Users
} from 'lucide-react'

export default function LoginForm() {
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const [isFlipping, setIsFlipping] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [rememberMe, setRememberMe] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const infoPages = [
        {
            icon: ArrowUpDown,
            title: 'Quản lý dễ dàng',
            description: 'Thêm, sửa, xóa minh chứng một cách nhanh chóng và hiệu quả',
            color: 'from-purple-500 to-blue-500'
        },
        {
            icon: FileText,
            title: 'Tổ chức khoa học',
            description: 'Phân loại theo tiêu chuẩn và tiêu chí một cách có hệ thống',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: BookOpen,
            title: 'Import hàng loạt',
            description: 'Tải lên nhiều file từ Excel, folder nhanh chóng',
            color: 'from-cyan-500 to-teal-500'
        },
        {
            icon: TrendingUp,
            title: 'Báo cáo chi tiết',
            description: 'Xuất báo cáo, thống kê đầy đủ và trực quan',
            color: 'from-teal-500 to-green-500'
        },
        {
            icon: Shield,
            title: 'Bảo mật cao',
            description: 'Đảm bảo an toàn thông tin với công nghệ mã hóa hiện đại',
            color: 'from-green-500 to-emerald-500'
        },
        {
            icon: Users,
            title: 'Cộng tác nhóm',
            description: 'Làm việc nhóm hiệu quả với phân quyền chi tiết',
            color: 'from-emerald-500 to-purple-500'
        }
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setIsFlipping(true)
            setTimeout(() => {
                setCurrentPage((prev) => (prev + 1) % infoPages.length)
                setIsFlipping(false)
            }, 600)
        }, 3000)

        return () => clearInterval(interval)
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')

        if (!formData.email || !formData.password) {
            setError('Vui lòng nhập đầy đủ thông tin')
            return
        }

        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            alert('Login successful!')
        }, 1500)
    }

    const currentPageData = infoPages[currentPage]
    const IconComponent = currentPageData.icon

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
            <div className="w-full max-w-6xl">
                <div className={`grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                    {/* Left Side - Book Flip */}
                    <div className={`relative overflow-hidden bg-gradient-to-br ${currentPageData.color} p-12 flex flex-col justify-between min-h-[600px]`}>
                        <div className="absolute top-6 right-6 z-20">
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
                            >
                                {isDarkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
                            </button>
                        </div>

                        <div className="text-white z-10">
                            <h2 className="text-4xl font-bold mb-4 leading-tight">
                                Chào mừng đến với<br />
                                Hệ thống quản lý minh chứng
                            </h2>
                            <p className="text-lg opacity-90 leading-relaxed">
                                Quản lý, tổ chức và theo dõi tất cả minh chứng<br />
                                một cách hiệu quả và chuyên nghiệp.
                            </p>
                        </div>

                        <div className="relative h-64 my-8">
                            <div
                                className={`absolute inset-0 transition-all duration-600 ${
                                    isFlipping ? 'opacity-0 rotate-y-90' : 'opacity-100 rotate-y-0'
                                }`}
                                style={{
                                    transformStyle: 'preserve-3d',
                                    transform: isFlipping ? 'rotateY(-90deg)' : 'rotateY(0deg)',
                                    transition: 'all 0.6s ease-in-out'
                                }}
                            >
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center border border-white/20 shadow-2xl">
                                    <div className="mb-6">
                                        <div className="bg-white/20 p-4 rounded-2xl inline-block">
                                            <IconComponent className="w-16 h-16 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4">
                                        {currentPageData.title}
                                    </h3>
                                    <p className="text-white/90 text-lg leading-relaxed">
                                        {currentPageData.description}
                                    </p>
                                </div>
                            </div>

                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                {infoPages.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setIsFlipping(true)
                                            setTimeout(() => {
                                                setCurrentPage(index)
                                                setIsFlipping(false)
                                            }, 600)
                                        }}
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            index === currentPage
                                                ? 'bg-white w-8'
                                                : 'bg-white/40 hover:bg-white/60 w-2'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="text-center text-white/80 text-sm z-10">
                            <p>© 2025 CMC University. Made by Digital University PMU.</p>
                        </div>
                    </div>

                    {/* Right Side - Login */}
                    <div className={`p-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="mb-8">
                            <div className="flex items-center space-x-3 mb-8">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-xl">V</span>
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                            <div className="w-3 h-3 bg-white rounded-full"></div>
                                        </div>
                                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                            CMC UNIVERSITY
                                        </span>
                                    </div>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Hệ thống quản lý minh chứng
                                    </p>
                                </div>
                            </div>

                            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                Đăng nhập
                            </h1>
                        </div>

                        <div className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    EMAIL / TÊN ĐĂNG NHẬP
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData({...formData, email: e.target.value})
                                            if (error) setError('')
                                        }}
                                        placeholder="Nhập email hoặc tên đăng nhập"
                                        className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                                                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        MẬT KHẨU
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => alert('Chức năng quên mật khẩu')}
                                        className="text-blue-500 text-sm hover:underline focus:outline-none"
                                    >
                                        Quên mật khẩu?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => {
                                            setFormData({...formData, password: e.target.value})
                                            if (error) setError('')
                                        }}
                                        placeholder="Nhập mật khẩu"
                                        className={`w-full pl-10 pr-12 py-3 rounded-lg border transition-all ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                                                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
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
                                <label htmlFor="remember" className={`ml-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                                    isLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02]'
                                } text-white shadow-lg`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Đang đăng nhập...</span>
                                    </div>
                                ) : (
                                    'Đăng nhập →'
                                )}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className={`w-full border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className={`px-2 ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                                        HOẶC
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => alert('Đăng nhập với Microsoft')}
                                className={`w-full py-3 px-4 rounded-lg font-medium border transition-all ${
                                    isDarkMode
                                        ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                } flex items-center justify-center space-x-2`}
                            >
                                <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">M</span>
                                </div>
                                <span>Đăng nhập với Microsoft</span>
                            </button>
                        </div>

                        <div className="mt-8 text-center">
                            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                Made by Ban Đại học số - Trường Đại học CMC
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}