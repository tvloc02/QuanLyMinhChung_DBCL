import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { formatDate, formatNumber } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import {
    FileText,
    Plus,
    Upload,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    TrendingUp,
    BarChart3,
    BookOpen,
    FolderTree,
    RefreshCw
} from 'lucide-react'

export default function EvidencePage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [statistics, setStatistics] = useState(null)
    const [recentEvidences, setRecentEvidences] = useState([])

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

            // Fetch statistics
            const statsResponse = await apiMethods.evidences.getStatistics()

            // Fetch recent evidences
            const evidencesResponse = await apiMethods.evidences.getAll({
                page: 1,
                limit: 5,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            })

            setStatistics(statsResponse.data.data)
            setRecentEvidences(evidencesResponse.data.data.evidences || [])
        } catch (error) {
            console.error('Fetch data error:', error)
            toast.error('Lỗi khi tải dữ liệu tổng quan')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />
            case 'inactive':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'archived':
                return <AlertCircle className="h-4 w-4 text-gray-500" />
            default:
                return <Eye className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusLabel = (status) => {
        const labels = {
            active: 'Đang hoạt động',
            pending: 'Chờ xử lý',
            inactive: 'Ngừng hoạt động',
            archived: 'Lưu trữ'
        }
        return labels[status] || status
    }

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            inactive: 'bg-red-100 text-red-800',
            archived: 'bg-gray-100 text-gray-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
        <div
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
                onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(value || 0)}</p>
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
            title="Tổng quan minh chứng"
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
                            disabled={loading}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* Quick Actions */}
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
                                onClick={() => router.push('/evidence/evidence-tree')}
                            />
                            <QuickAction
                                title="Import minh chứng"
                                description="Nhập từ file Excel"
                                icon={Upload}
                                color="bg-orange-500"
                                onClick={() => router.push('/evidence/import-evidence')}
                            />
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Tổng minh chứng"
                                value={statistics?.totalEvidences || 0}
                                icon={FileText}
                                color="bg-blue-500"
                                onClick={() => router.push('/evidence-management')}
                            />
                            <StatCard
                                title="Đang hoạt động"
                                value={statistics?.activeEvidences || 0}
                                icon={CheckCircle}
                                color="bg-green-500"
                                onClick={() => router.push('/evidence-management?status=active')}
                            />
                            <StatCard
                                title="Ngừng hoạt động"
                                value={statistics?.inactiveEvidences || 0}
                                icon={XCircle}
                                color="bg-red-500"
                                onClick={() => router.push('/evidence-management?status=inactive')}
                            />
                            <StatCard
                                title="Tổng files"
                                value={statistics?.totalFiles || 0}
                                icon={FileText}
                                color="bg-purple-500"
                            />
                        </div>

                        {/* Recent Evidences */}
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
                                {recentEvidences.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        Chưa có minh chứng nào
                                    </div>
                                ) : (
                                    recentEvidences.map((evidence) => (
                                        <div key={evidence._id} className="p-6 hover:bg-gray-50 transition-colors">
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
                                                            <span>{evidence.createdBy?.fullName || 'N/A'}</span>
                                                            <span>•</span>
                                                            <span>{evidence.programId?.name || 'N/A'}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(evidence.createdAt)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                                            {evidence.standardId?.name} - {evidence.criteriaId?.name}
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
                                                        onClick={() => router.push(`/evidence-management?view=${evidence._id}`)}
                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Academic Year Info */}
                        {statistics?.academicYear && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">
                                        Năm học hiện tại: {statistics.academicYear.name} ({statistics.academicYear.code})
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}