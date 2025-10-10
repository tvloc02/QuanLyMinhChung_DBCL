import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Settings, Database, Mail, Activity, RotateCcw, Palette, Shield,
    HardDrive, Bell, Globe, ChevronRight, AlertCircle, CheckCircle,
    RefreshCw, TrendingUp, Server, Zap
} from 'lucide-react'

const SystemPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [systemInfo, setSystemInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    const breadcrumbItems = [
        { name: 'Cài đặt hệ thống', icon: Settings }
    ]

    const systemModules = [
        {
            id: 'backup',
            name: 'Sao lưu & Khôi phục',
            description: 'Quản lý các bản sao lưu dữ liệu hệ thống',
            icon: Database,
            gradient: 'from-blue-500 to-cyan-500',
            path: '/system/backup',
            stats: systemInfo?.backups || 0
        },
        {
            id: 'general',
            name: 'Khôi phục dữ liệu',
            description: 'Khôi phục các dữ liệu đã bị xóa',
            icon: RotateCcw,
            gradient: 'from-green-500 to-emerald-500',
            path: '/system/general',
            stats: systemInfo?.deletedItems || 0
        },
        {
            id: 'logs',
            name: 'Lịch sử hoạt động',
            description: 'Theo dõi và giám sát hoạt động hệ thống',
            icon: Activity,
            gradient: 'from-purple-500 to-pink-500',
            path: '/system/logs',
            stats: systemInfo?.totalLogs || 0
        },
        {
            id: 'mail',
            name: 'Cấu hình Email',
            description: 'Thiết lập máy chủ SMTP và email',
            icon: Mail,
            gradient: 'from-orange-500 to-red-500',
            path: '/system/mail',
            stats: systemInfo?.emailConfigured ? 'Đã cấu hình' : 'Chưa cấu hình'
        }
    ]

    const advancedSettings = [
        {
            id: 'security',
            name: 'Bảo mật',
            description: 'Cấu hình các thiết lập bảo mật',
            icon: Shield,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-100'
        },
        {
            id: 'notification',
            name: 'Thông báo',
            description: 'Cấu hình hệ thống thông báo',
            icon: Bell,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            id: 'language',
            name: 'Ngôn ngữ & Khu vực',
            description: 'Thiết lập múi giờ và định dạng',
            icon: Globe,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            id: 'theme',
            name: 'Giao diện',
            description: 'Tùy chỉnh màu sắc và giao diện',
            icon: Palette,
            color: 'text-pink-600',
            bgColor: 'bg-pink-100'
        }
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
            fetchSystemInfo()
        }
    }, [user])

    const fetchSystemInfo = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/system/info', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setSystemInfo(result.data)
                }
            }
        } catch (err) {
            console.error('Error fetching system info:', err)
        } finally {
            setLoading(false)
        }
    }

    if (isLoading) {
        return (
            <Layout title="Đang tải..." breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user || user.role !== 'admin') {
        return (
            <Layout title="Không có quyền truy cập" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
                        <p className="text-gray-600">Bạn không có quyền truy cập trang này</p>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Settings className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Cài đặt hệ thống</h1>
                                <p className="text-indigo-100">Quản lý và cấu hình các thiết lập hệ thống</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchSystemInfo}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:shadow-xl transition-all font-medium"
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span>Làm mới</span>
                        </button>
                    </div>
                </div>

                {/* System Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 mb-1">Trạng thái hệ thống</p>
                                    <p className="text-3xl font-bold text-green-600">Hoạt động</p>
                                    <p className="text-sm text-gray-500 mt-1">Hệ thống đang chạy ổn định</p>
                                </div>
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 border-t-2 border-green-100">
                            <div className="flex items-center text-sm text-green-700">
                                <Zap className="w-4 h-4 mr-2" />
                                <span className="font-medium">Hiệu suất tốt</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 mb-1">Dung lượng sử dụng</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {systemInfo?.storageUsed || '2.4 GB'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Còn trống 47.6 GB</p>
                                </div>
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                    <HardDrive className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 border-t-2 border-blue-100">
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 mb-1">Hoạt động hôm nay</p>
                                    <p className="text-3xl font-bold text-purple-600">
                                        {systemInfo?.todayActivities || 248}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Người dùng</p>
                                </div>
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                                    <Activity className="w-8 h-8 text-purple-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-3 border-t-2 border-purple-100">
                            <div className="flex items-center text-sm text-purple-700">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                <span className="font-medium">Tăng trưởng tốt</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Modules */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Server className="w-6 h-6 text-indigo-600" />
                        Quản lý hệ thống
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {systemModules.map((module) => {
                            const Icon = module.icon
                            return (
                                <div
                                    key={module.id}
                                    onClick={() => router.push(module.path)}
                                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4 flex-1">
                                                <div className={`w-14 h-14 bg-gradient-to-br ${module.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                                    <Icon className="w-7 h-7 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                        {module.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        {module.description}
                                                    </p>
                                                    {module.stats !== undefined && (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200">
                                                            {typeof module.stats === 'number'
                                                                ? `${module.stats} mục`
                                                                : module.stats
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ml-4 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Advanced Settings */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-indigo-600" />
                        Cài đặt nâng cao
                    </h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {advancedSettings.map((setting) => {
                                const Icon = setting.icon
                                return (
                                    <div
                                        key={setting.id}
                                        className="group p-6 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-12 h-12 ${setting.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                    <Icon className={`w-6 h-6 ${setting.color}`} />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-gray-900 mb-0.5">
                                                        {setting.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {setting.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Server className="w-6 h-6 text-indigo-600" />
                            Thông tin hệ thống
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                <span className="text-sm font-semibold text-gray-700">Phiên bản</span>
                                <p className="text-lg font-bold text-indigo-600 mt-1">
                                    {systemInfo?.version || '1.0.0'}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                                <span className="text-sm font-semibold text-gray-700">Môi trường</span>
                                <p className="text-lg font-bold text-purple-600 mt-1">
                                    {systemInfo?.environment || 'Production'}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                                <span className="text-sm font-semibold text-gray-700">Cơ sở dữ liệu</span>
                                <p className="text-lg font-bold text-green-600 mt-1">
                                    {systemInfo?.database || 'MongoDB'}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100">
                                <span className="text-sm font-semibold text-gray-700">Thời gian hoạt động</span>
                                <p className="text-lg font-bold text-orange-600 mt-1">
                                    {systemInfo?.uptime || '7 ngày 14 giờ'}
                                </p>
                            </div>
                            <div className="md:col-span-2 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                                <span className="text-sm font-semibold text-gray-700">Sao lưu gần nhất</span>
                                <p className="text-lg font-bold text-cyan-600 mt-1">
                                    {systemInfo?.lastBackup
                                        ? new Date(systemInfo.lastBackup).toLocaleString('vi-VN')
                                        : 'Chưa có'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warning */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-7 h-7 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-yellow-900 mb-2">Lưu ý quan trọng</h3>
                            <ul className="space-y-2 text-sm text-yellow-800">
                                <li className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Chỉ quản trị viên mới có quyền truy cập các thiết lập hệ thống</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Các thay đổi có thể ảnh hưởng đến toàn bộ hệ thống</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Nên tạo bản sao lưu trước khi thực hiện thay đổi quan trọng</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default SystemPage