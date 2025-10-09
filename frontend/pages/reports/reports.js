import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    BarChart3,
    PieChart,
    TrendingUp,
    FileText,
    Download,
    Calendar,
    Filter,
    RefreshCw,
    Users,
    Building,
    BookOpen,
    CheckCircle,
    AlertCircle,
    Clock,
    Eye
} from 'lucide-react'
import { formatDate, formatNumber } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function ReportsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedPeriod, setSelectedPeriod] = useState('month')
    const [statistics, setStatistics] = useState(null)
    const [chartData, setChartData] = useState(null)
    const [programs, setPrograms] = useState([])

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user, selectedProgram, selectedPeriod])

    const breadcrumbItems = [
        { name: 'Báo cáo thống kê', icon: BarChart3 }
    ]

    const fetchData = async () => {
        try {
            setLoading(true)
            // Mock API call - replace with actual service
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Mock data
            const mockStatistics = {
                overview: {
                    totalEvidences: 0,
                    totalPrograms: 0,
                    totalStandards: 0,
                    totalCriteria: 0,
                    totalUsers: 0,
                    totalOrganizations: 0
                },
                evidenceStats: {
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    draft: 0,
                    byMonth: [
                        { month: '', count: 0 },
                        { month: '', count: 0 },
                        { month: '', count: 0 },
                        { month: '', count: 0 },
                        { month: '', count: 0 },
                        { month: '', count: 0 }
                    ]
                },
                programStats: [
                    { name: '', evidences: 0, completion: 0 },
                    { name: '', evidences: 0, completion: 0 },
                    { name: '', evidences: 0, completion: 0 },
                    { name: '', evidences: 0, completion: 0 },
                    { name: '', evidences: 0, completion: 0 }
                ],
                userActivity: [
                    { name: '', evidences: 0, role: '' },
                    { name: '', evidences: 0, role: '' },
                    { name: '', evidences: 0, role: '' },
                    { name: '', evidences: 0, role: '' },
                    { name: '', evidences: 0, role: '' }
                ],
                recentActivities: [
                    { type: '', user: '', action: '', time: '' },
                    { type: '', user: '', action: '', time: '' },
                    { type: '', user: '', action: '', time: '' },
                    { type: '', user: '', action: '', time: '' }
                ]
            }

            const mockPrograms = [
                { id: '', name: '' },
                { id: '', name: '' }
            ]

            setStatistics(mockStatistics)
            setPrograms(mockPrograms)
        } catch (error) {
            toast.error('Lỗi tải dữ liệu báo cáo')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchData()
        toast.success('Đã cập nhật dữ liệu mới nhất')
    }

    const handleExportReport = async (type) => {
        try {
            toast.loading('Đang xuất báo cáo...')
            // Mock export - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.dismiss()
            toast.success(`Xuất báo cáo ${type} thành công`)
        } catch (error) {
            toast.dismiss()
            toast.error('Lỗi xuất báo cáo')
        }
    }

    const getStatusIcon = (type) => {
        switch (type) {
            case 'create':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'approve':
                return <CheckCircle className="h-4 w-4 text-blue-500" />
            case 'update':
                return <Clock className="h-4 w-4 text-yellow-500" />
            case 'reject':
                return <AlertCircle className="h-4 w-4 text-red-500" />
            default:
                return <Eye className="h-4 w-4 text-gray-500" />
        }
    }

    const StatCard = ({ title, value, icon: Icon, color, change, trend }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(value)}</p>
                    {change && (
                        <div className={`flex items-center mt-2 text-sm ${
                            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                            <TrendingUp className={`h-4 w-4 mr-1 ${
                                trend === 'down' ? 'rotate-180' : ''
                            }`} />
                            <span>{change}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </div>
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Báo cáo thống kê</h1>
                        <p className="text-gray-600">Tổng quan về hệ thống quản lý minh chứng</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>

                        <div className="relative">
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả chương trình</option>
                                {programs.map(program => (
                                    <option key={program.id} value={program.id}>
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 ml-3">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* Overview Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                            <StatCard
                                title="Tổng minh chứng"
                                value={statistics?.overview.totalEvidences}
                                icon={FileText}
                                color="bg-blue-500"
                                change="+12%"
                                trend="up"
                            />
                            <StatCard
                                title="Chương trình"
                                value={statistics?.overview.totalPrograms}
                                icon={BookOpen}
                                color="bg-green-500"
                                change="+2"
                                trend="up"
                            />
                            <StatCard
                                title="Tiêu chuẩn"
                                value={statistics?.overview.totalStandards}
                                icon={BarChart3}
                                color="bg-purple-500"
                            />
                            <StatCard
                                title="Tiêu chí"
                                value={statistics?.overview.totalCriteria}
                                icon={FileText}
                                color="bg-yellow-500"
                            />
                            <StatCard
                                title="Người dùng"
                                value={statistics?.overview.totalUsers}
                                icon={Users}
                                color="bg-red-500"
                                change="+3"
                                trend="up"
                            />
                            <StatCard
                                title="Tổ chức"
                                value={statistics?.overview.totalOrganizations}
                                icon={Building}
                                color="bg-indigo-500"
                            />
                        </div>

                        {/* Evidence Status Chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Trạng thái minh chứng</h3>
                                    <PieChart className="h-5 w-5 text-gray-400" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                            <span className="text-sm text-gray-600">Đã phê duyệt</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatNumber(statistics?.evidenceStats.approved)}
                                            <span className="text-gray-500 ml-1">
                                                ({Math.round(statistics?.evidenceStats.approved / statistics?.overview.totalEvidences * 100)}%)
                                            </span>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                            <span className="text-sm text-gray-600">Chờ xử lý</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatNumber(statistics?.evidenceStats.pending)}
                                            <span className="text-gray-500 ml-1">
                                                ({Math.round(statistics?.evidenceStats.pending / statistics?.overview.totalEvidences * 100)}%)
                                            </span>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                            <span className="text-sm text-gray-600">Từ chối</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatNumber(statistics?.evidenceStats.rejected)}
                                            <span className="text-gray-500 ml-1">
                                                ({Math.round(statistics?.evidenceStats.rejected / statistics?.overview.totalEvidences * 100)}%)
                                            </span>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                                            <span className="text-sm text-gray-600">Nháp</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatNumber(statistics?.evidenceStats.draft)}
                                            <span className="text-gray-500 ml-1">
                                                ({Math.round(statistics?.evidenceStats.draft / statistics?.overview.totalEvidences * 100)}%)
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Program Progress */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Tiến độ chương trình</h3>
                                    <BarChart3 className="h-5 w-5 text-gray-400" />
                                </div>

                                <div className="space-y-4">
                                    {statistics?.programStats.map((program, index) => (
                                        <div key={index}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {program.name}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {program.completion}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${program.completion}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {formatNumber(program.evidences)} minh chứng
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* User Activity & Recent Activities */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Users */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Người dùng tích cực</h3>
                                    <Users className="h-5 w-5 text-gray-400" />
                                </div>

                                <div className="space-y-3">
                                    {statistics?.userActivity.map((user, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.role}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-blue-600">
                                                {user.evidences} minh chứng
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activities */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
                                    <Clock className="h-5 w-5 text-gray-400" />
                                </div>

                                <div className="space-y-3">
                                    {statistics?.recentActivities.map((activity, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="flex-shrink-0 mr-3 mt-0.5">
                                                {getStatusIcon(activity.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900">
                                                    <span className="font-medium">{activity.user}</span>{' '}
                                                    {activity.action}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(activity.time, 'DD/MM/YYYY HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Export Section */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xuất báo cáo</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <button
                                    onClick={() => handleExportReport('excel')}
                                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Download className="h-5 w-5 mr-2 text-green-600" />
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-gray-900">Excel</div>
                                        <div className="text-xs text-gray-500">Báo cáo tổng hợp</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleExportReport('pdf')}
                                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Download className="h-5 w-5 mr-2 text-red-600" />
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-gray-900">PDF</div>
                                        <div className="text-xs text-gray-500">Báo cáo chi tiết</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleExportReport('statistics')}
                                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-gray-900">Thống kê</div>
                                        <div className="text-xs text-gray-500">Biểu đồ & số liệu</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleExportReport('custom')}
                                    className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-gray-900">Tùy chỉnh</div>
                                        <div className="text-xs text-gray-500">Theo khoảng thời gian</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )
}