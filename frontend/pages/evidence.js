import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import { formatDate, formatNumber } from '../utils/helpers'
import toast from 'react-hot-toast'
import {
    FileText,
    Plus,
    Upload,
    Search,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    TrendingUp,
    BarChart3,
    Users,
    Calendar,
    BookOpen,
    FolderTree,
    Download,
    Filter,
    RefreshCw
} from 'lucide-react'

export default function EvidencePage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [statistics, setStatistics] = useState(null)
    const [recentEvidences, setRecentEvidences] = useState([])
    const [chartData, setChartData] = useState(null)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const breadcrumbItems = [
        { name: 'Tổng quan minh chứng', icon: FileText }
    ]

    const fetchData = async () => {
        try {
            setLoading(true)
            await new Promise(resolve => setTimeout(resolve, 800))

            const mockStatistics = {
                overview: {
                    totalEvidences: 1247,
                    pendingApproval: 89,
                    approvedEvidences: 892,
                    rejectedEvidences: 32,
                    draftEvidences: 234
                },
                byStatus: {
                    approved: 892,
                    pending: 89,
                    rejected: 32,
                    draft: 234
                },
                byProgram: [
                    { name: '', count: 0, percentage: 0 },
                    { name: '', count: 0, percentage: 0 },
                    { name: '', count: 0, percentage: 0 },
                    { name: '', count: 0, percentage: 0 }
                ],
                monthlyTrend: [
                    { month: '', evidences: 0, approved: 0 },
                    { month: '', evidences: 0, approved: 0 },
                    { month: '', evidences: 0, approved: 0 },
                    { month: '', evidences: 0, approved: 0 },
                    { month: '', evidences: 0, approved: 0 },
                    { month: '', evidences: 0, approved: 0 }
                ]
            }

            const mockRecentEvidences = [
                {
                    id: '1',
                    code: 'H1.01.02.15',
                    name: 'Báo cáo kết quả học tập sinh viên K65',
                    status: 'approved',
                    submittedBy: 'Nguyễn Văn A',
                    submittedAt: '2024-12-25T10:30:00Z',
                    program: 'AUN-QA 2023',
                    criteriaName: 'Chất lượng sinh viên đầu vào'
                },
                {
                    id: '2',
                    code: 'H1.01.02.16',
                    name: 'Danh sách sinh viên tốt nghiệp loại xuất sắc',
                    status: 'pending',
                    submittedBy: 'Trần Thị B',
                    submittedAt: '2024-12-25T09:15:00Z',
                    program: 'AUN-QA 2023',
                    criteriaName: 'Kết quả học tập của sinh viên'
                },
                {
                    id: '3',
                    code: 'H1.01.02.17',
                    name: 'Thống kê tỷ lệ có việc làm sau tốt nghiệp',
                    status: 'draft',
                    submittedBy: 'Lê Văn C',
                    submittedAt: '2024-12-25T08:45:00Z',
                    program: 'MOET 2024',
                    criteriaName: 'Sinh viên và hỗ trợ sinh viên'
                },
                {
                    id: '4',
                    code: 'H1.01.02.18',
                    name: 'Báo cáo khảo sát sinh viên về chương trình',
                    status: 'rejected',
                    submittedBy: 'Phạm Thị D',
                    submittedAt: '2024-12-24T16:20:00Z',
                    program: 'AUN-QA 2023',
                    criteriaName: 'Đánh giá và cải tiến chương trình'
                }
            ]

            setStatistics(mockStatistics)
            setRecentEvidences(mockRecentEvidences)
        } catch (error) {
            toast.error('Lỗi tải dữ liệu tổng quan')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />
            case 'rejected':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'draft':
                return <AlertCircle className="h-4 w-4 text-gray-500" />
            default:
                return <Eye className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusLabel = (status) => {
        const labels = {
            approved: 'Đã phê duyệt',
            pending: 'Chờ xử lý',
            rejected: 'Từ chối',
            draft: 'Nháp'
        }
        return labels[status] || status
    }

    const getStatusColor = (status) => {
        const colors = {
            approved: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            rejected: 'bg-red-100 text-red-800',
            draft: 'bg-gray-100 text-gray-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const StatCard = ({ title, value, icon: Icon, color, change, trend, onClick }) => (
        <div
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
                onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
            onClick={onClick}
        >
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

    const QuickAction = ({ title, description, icon: Icon, color, onClick }) => (
        <div
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-600">{description}</p>
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
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tổng quan minh chứng</h1>
                        <p className="text-gray-600">Dashboard quản lý minh chứng chất lượng giáo dục</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={fetchData}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Làm mới
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 ml-3">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <QuickAction
                                title="Thêm minh chứng"
                                description="Tạo minh chứng mới"
                                icon={Plus}
                                color="bg-blue-500"
                                onClick={() => router.push('/evidence-management?action=create')}
                            />
                            <QuickAction
                                title="Quản lý minh chứng"
                                description="Xem và chỉnh sửa"
                                icon={FileText}
                                color="bg-green-500"
                                onClick={() => router.push('/evidence-management')}
                            />
                            <QuickAction
                                title="Cây minh chứng"
                                description="Cấu trúc phân cấp"
                                icon={FolderTree}
                                color="bg-purple-500"
                                onClick={() => router.push('/evidence-tree')}
                            />
                            <QuickAction
                                title="Import minh chứng"
                                description="Nhập từ file Excel"
                                icon={Upload}
                                color="bg-orange-500"
                                onClick={() => router.push('/import-evidence')}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                            <StatCard
                                title="Tổng minh chứng"
                                value={statistics?.overview.totalEvidences}
                                icon={FileText}
                                color="bg-blue-500"
                                change="+12.5%"
                                trend="up"
                                onClick={() => router.push('/evidence-management')}
                            />
                            <StatCard
                                title="Chờ phê duyệt"
                                value={statistics?.overview.pendingApproval}
                                icon={Clock}
                                color="bg-yellow-500"
                                change="-5.2%"
                                trend="down"
                                onClick={() => router.push('/evidence-management?status=pending')}
                            />
                            <StatCard
                                title="Đã phê duyệt"
                                value={statistics?.overview.approvedEvidences}
                                icon={CheckCircle}
                                color="bg-green-500"
                                change="+8.3%"
                                trend="up"
                                onClick={() => router.push('/evidence-management?status=approved')}
                            />
                            <StatCard
                                title="Từ chối"
                                value={statistics?.overview.rejectedEvidences}
                                icon={XCircle}
                                color="bg-red-500"
                                onClick={() => router.push('/evidence-management?status=rejected')}
                            />
                            <StatCard
                                title="Nháp"
                                value={statistics?.overview.draftEvidences}
                                icon={AlertCircle}
                                color="bg-gray-500"
                                onClick={() => router.push('/evidence-management?status=draft')}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Phân bố trạng thái</h3>
                                    <BarChart3 className="h-5 w-5 text-gray-400" />
                                </div>

                                <div className="space-y-4">
                                    {Object.entries(statistics?.byStatus || {}).map(([status, count]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(status)}
                                                <span className="text-sm text-gray-600">{getStatusLabel(status)}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            status === 'approved' ? 'bg-green-500' :
                                                                status === 'pending' ? 'bg-yellow-500' :
                                                                    status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                                                        }`}
                                                        style={{
                                                            width: `${(count / statistics?.overview.totalEvidences * 100)}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                                                    {formatNumber(count)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Theo chương trình</h3>
                                    <BookOpen className="h-5 w-5 text-gray-400" />
                                </div>

                                <div className="space-y-4">
                                    {statistics?.byProgram.map((program, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {program.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {program.percentage}% tổng số
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${program.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                                                    {formatNumber(program.count)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Minh chứng gần đây
                                    </h3>
                                    <button
                                        onClick={() => router.push('/evidence-management')}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Xem tất cả →
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {recentEvidences.map((evidence) => (
                                    <div key={evidence.id} className="p-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-start space-x-3 flex-1">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <FileText className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                                            {evidence.name}
                                                        </h4>
                                                        <span className="text-xs text-gray-500 font-mono">
                                                            ({evidence.code})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                        <span>{evidence.submittedBy}</span>
                                                        <span>•</span>
                                                        <span>{evidence.program}</span>
                                                        <span>•</span>
                                                        <span>{formatDate(evidence.submittedAt, { format: 'datetime' })}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {evidence.criteriaName}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    getStatusColor(evidence.status)
                                                }`}>
                                                    {getStatusLabel(evidence.status)}
                                                </span>
                                                <button
                                                    onClick={() => router.push(`/evidence-management?view=${evidence.id}`)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Xu hướng theo tháng</h3>
                                <TrendingUp className="h-5 w-5 text-gray-400" />
                            </div>

                            <div className="grid grid-cols-6 gap-4">
                                {statistics?.monthlyTrend.map((month, index) => (
                                    <div key={index} className="text-center">
                                        <div className="mb-2">
                                            <div className="relative h-24 bg-gray-100 rounded">
                                                <div
                                                    className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-b"
                                                    style={{ height: `${(month.evidences / 200 * 100)}%` }}
                                                ></div>
                                                <div
                                                    className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-b"
                                                    style={{ height: `${(month.approved / 200 * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-gray-700">{month.month}</p>
                                        <div className="text-xs text-gray-500">
                                            <span className="text-blue-600">{month.evidences}</span>
                                            /
                                            <span className="text-green-600">{month.approved}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                    <span>Tổng minh chứng</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                                    <span>Đã phê duyệt</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )
}