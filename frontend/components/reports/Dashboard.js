'use client'
import { useState, useEffect } from 'react'
import {
    FileText,
    Upload,
    Download,
    Search,
    Plus,
    CheckCircle,
    XCircle,
    Clock,
    Edit,
    Eye
} from 'lucide-react'
import StatisticsChart from './StatisticsChart'

export default function Dashboard() {
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
    })

    const [recentActivities, setRecentActivities] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setTimeout(() => {
            setStats({
                total: 0,
                approved: 0,
                pending: 0,
                rejected: 0
            })

            setRecentActivities([
                { id: 1, action: 'Thêm minh chứng mới', code: '', time: '', type: 'add' },
                { id: 2, action: 'Phê duyệt minh chứng', code: '', time: '', type: 'approve' },
                { id: 3, action: 'Cập nhật minh chứng', code: '', time: '', type: 'edit' },
                { id: 4, action: 'Từ chối minh chứng', code: '', time: '', type: 'reject' }
            ])

            setLoading(false)
        }, 1000)
    }, [])

    const statsCards = [
        { title: 'Tổng minh chứng', value: stats.total, icon: FileText, color: 'bg-blue-500', change: '' },
        { title: 'Đã phê duyệt', value: stats.approved, icon: CheckCircle, color: 'bg-green-500', change: '' },
        { title: 'Chờ xử lý', value: stats.pending, icon: Clock, color: 'bg-yellow-500', change: '' },
        { title: 'Từ chối', value: stats.rejected, icon: XCircle, color: 'bg-red-500', change: '' }
    ]

    const quickActions = [
        {
            title: 'Thêm minh chứng',
            description: 'Thêm minh chứng mới thủ công',
            icon: Plus,
            color: 'bg-blue-500',
            href: '/evidence-management/create'
        },
        {
            title: 'Import minh chứng',
            description: 'Tải lên từ file Excel',
            icon: Upload,
            color: 'bg-green-500',
            href: '/import-evidence'
        },
        {
            title: 'Tìm kiếm minh chứng',
            description: 'Tìm theo tiêu chuẩn/tiêu chí',
            icon: Search,
            color: 'bg-purple-500',
            href: '/evidence-management'
        },
        {
            title: 'Xuất báo cáo',
            description: 'Tạo báo cáo danh mục',
            icon: Download,
            color: 'bg-orange-500',
            href: '/reports'
        }
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Thống kê</h2>
                <p className="text-gray-600 mt-1">Tổng quan hệ thống quản lý minh chứng</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                                <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} từ tháng trước
                </span>
                            </div>
                            <div className={`${stat.color} p-3 rounded-lg`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                        <a
                            key={index}
                            href={action.href}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow block"
                        >
                            <div className={`${action.color} p-3 rounded-lg w-fit mb-4`}>
                                <action.icon className="h-6 w-6 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
                            <p className="text-sm text-gray-600">{action.description}</p>
                        </a>
                    ))}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activities */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
                    <div className="space-y-4">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${
                                    activity.type === 'add' ? 'bg-blue-100' :
                                        activity.type === 'approve' ? 'bg-green-100' :
                                            activity.type === 'edit' ? 'bg-yellow-100' : 'bg-red-100'
                                }`}>
                                    {activity.type === 'add' && <Plus className="h-4 w-4 text-blue-600" />}
                                    {activity.type === 'approve' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                    {activity.type === 'edit' && <Edit className="h-4 w-4 text-yellow-600" />}
                                    {activity.type === 'reject' && <XCircle className="h-4 w-4 text-red-600" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                    <p className="text-sm text-gray-600">Mã: {activity.code}</p>
                                </div>
                                <span className="text-xs text-gray-500">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Statistics Chart */}
                <StatisticsChart stats={stats} />
            </div>
        </div>
    )
}