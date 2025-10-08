import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Settings,
    Database,
    Mail,
    Activity,
    RotateCcw,
    Palette,
    Shield,
    HardDrive,
    Bell,
    Globe,
    Users,
    FileText,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Clock
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
            color: 'bg-blue-500',
            path: '/system/backup',
            stats: systemInfo?.backups || 0
        },
        {
            id: 'general',
            name: 'Khôi phục dữ liệu',
            description: 'Khôi phục các dữ liệu đã bị xóa',
            icon: RotateCcw,
            color: 'bg-green-500',
            path: '/system/general',
            stats: systemInfo?.deletedItems || 0
        },
        {
            id: 'logs',
            name: 'Lịch sử hoạt động',
            description: 'Theo dõi và giám sát hoạt động hệ thống',
            icon: Activity,
            color: 'bg-purple-500',
            path: '/system/logs',
            stats: systemInfo?.totalLogs || 0
        },
        {
            id: 'mail',
            name: 'Cấu hình Email',
            description: 'Thiết lập máy chủ SMTP và email',
            icon: Mail,
            color: 'bg-orange-500',
            path: '/system/mail',
            stats: systemInfo?.emailConfigured ? 'Đã cấu hình' : 'Chưa cấu hình'
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
                    <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
                    <p className="text-gray-600 mt-1">Quản lý và cấu hình các thiết lập hệ thống</p>
                </div>

                {/* System Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Trạng thái hệ thống</p>
                                <p className="text-2xl font-bold text-green-600 mt-2">Hoạt động</p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Dung lượng sử dụng</p>
                                <p className="text-2xl font-bold text-blue-600 mt-2">
                                    {systemInfo?.storageUsed || 'N/A'}
                                </p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-3">
                                <HardDrive className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Hoạt động hôm nay</p>
                                <p className="text-2xl font-bold text-purple-600 mt-2">
                                    {systemInfo?.todayActivities || 0}
                                </p>
                            </div>
                            <div className="bg-purple-100 rounded-full p-3">
                                <Activity className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Modules */}
                <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Quản lý hệ thống</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {systemModules.map((module) => {
                            const Icon = module.icon
                            return (
                                <div
                                    key={module.id}
                                    onClick={() => router.push(module.path)}
                                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4">
                                                <div className={`${module.color} rounded-lg p-3`}>
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {module.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {module.description}
                                                    </p>
                                                    {module.stats !== undefined && (
                                                        <div className="mt-3">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                                                {typeof module.stats === 'number'
                                                                    ? `${module.stats} mục`
                                                                    : module.stats
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Additional Settings */}
                <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Cài đặt nâng cao</h2>
                    <div className="bg-white rounded-lg shadow">
                        <div className="divide-y divide-gray-200">
                            <div className="p-6 hover:bg-gray-50 cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <Shield className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">Bảo mật</h3>
                                            <p className="text-sm text-gray-600">Cấu hình các thiết lập bảo mật</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <div className="p-6 hover:bg-gray-50 cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <Bell className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">Thông báo</h3>
                                            <p className="text-sm text-gray-600">Cấu hình hệ thống thông báo</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <div className="p-6 hover:bg-gray-50 cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <Globe className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">Ngôn ngữ & Khu vực</h3>
                                            <p className="text-sm text-gray-600">Thiết lập múi giờ và định dạng</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <div className="p-6 hover:bg-gray-50 cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <Palette className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">Giao diện</h3>
                                            <p className="text-sm text-gray-600">Tùy chỉnh màu sắc và giao diện</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                {systemInfo && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin hệ thống</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Phiên bản:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                        {systemInfo.version || '1.0.0'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Môi trường:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                        {systemInfo.environment || 'Production'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Cơ sở dữ liệu:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                        {systemInfo.database || 'MongoDB'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Thời gian hoạt động:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                        {systemInfo.uptime || 'N/A'}
                                    </span>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="text-gray-600">Sao lưu gần nhất:</span>
                                    <span className="ml-2 font-medium text-gray-900">
                                        {systemInfo.lastBackup
                                            ? new Date(systemInfo.lastBackup).toLocaleString('vi-VN')
                                            : 'Chưa có'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Chỉ quản trị viên mới có quyền truy cập các thiết lập hệ thống</li>
                                <li>Các thay đổi có thể ảnh hưởng đến toàn bộ hệ thống</li>
                                <li>Nên tạo bản sao lưu trước khi thực hiện thay đổi quan trọng</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default SystemPage