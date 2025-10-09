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
    FolderTree,
    RefreshCw,
    BookOpen,
    Loader2,
    Sparkles,
    TrendingUp
} from 'lucide-react'

export default function EvidencePage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [statistics, setStatistics] = useState({
        totalEvidences: 0,
        activeEvidences: 0,
        inactiveEvidences: 0,
        totalFiles: 0,
        academicYear: null
    })
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

            try {
                const statsResponse = await apiMethods.evidences.getStatistics()
                const stats = statsResponse.data?.data || statsResponse.data || {}
                setStatistics({
                    totalEvidences: stats.totalEvidences || 0,
                    activeEvidences: stats.activeEvidences || 0,
                    inactiveEvidences: stats.inactiveEvidences || 0,
                    totalFiles: stats.totalFiles || 0,
                    academicYear: stats.academicYear || null
                })
            } catch (statError) {
                console.error('Statistics error:', statError)
            }

            try {
                const evidencesResponse = await apiMethods.evidences.getAll({
                    page: 1,
                    limit: 5,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                })

                const evidences = evidencesResponse.data?.data?.evidences ||
                    evidencesResponse.data?.evidences ||
                    evidencesResponse.data?.data ||
                    []
                setRecentEvidences(Array.isArray(evidences) ? evidences : [])
            } catch (evidenceError) {
                console.error('Evidences error:', evidenceError)
                setRecentEvidences([])
            }

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
            active: 'bg-green-100 text-green-800 border-green-200',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            inactive: 'bg-red-100 text-red-800 border-red-200',
            archived: 'bg-gray-100 text-gray-800 border-gray-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const StatCard = ({ title, value, icon: Icon, gradient, onClick }) => (
        <div
            className={`bg-gradient-to-br ${gradient} rounded-xl shadow-sm border-2 border-opacity-50 p-6 ${
                onClick ? 'cursor-pointer hover:shadow-lg transition-all' : ''
            }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-4xl font-bold text-gray-900">{formatNumber(value || 0)}</p>
                </div>
                <div className="w-16 h-16 bg-white bg-opacity-50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Icon className="h-8 w-8 text-gray-700" />
                </div>
            </div>
        </div>
    )

    const QuickAction = ({ title, description, icon: Icon, gradient, onClick }) => (
        <div
            className={`bg-gradient-to-br ${gradient} rounded-xl shadow-sm border-2 border-opacity-50 p-6 hover:shadow-lg transition-all cursor-pointer group`}
            onClick={onClick}
        >
            <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white bg-opacity-50 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7 text-gray-700" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
            </div>
        </div>
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Tổng quan minh chứng</h1>
                                <p className="text-indigo-100">Dashboard quản lý minh chứng chất lượng giáo dục</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 disabled:opacity-50 transition-all font-medium"
                            >
                                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <QuickAction
                                title="Thêm minh chứng"
                                description="Tạo minh chứng mới"
                                icon={Plus}
                                gradient="from-blue-50 to-indigo-100"
                                onClick={() => router.push('/evidence/create')}
                            />
                            <QuickAction
                                title="Quản lý minh chứng"
                                description="Xem và chỉnh sửa"
                                icon={FileText}
                                gradient="from-green-50 to-emerald-100"
                                onClick={() => router.push('/evidence/evidence-management')}
                            />
                            <QuickAction
                                title="Cây minh chứng"
                                description="Cấu trúc phân cấp"
                                icon={FolderTree}
                                gradient="from-purple-50 to-pink-100"
                                onClick={() => router.push('/evidence/evidence-tree')}
                            />
                            <QuickAction
                                title="Import minh chứng"
                                description="Nhập từ file Excel"
                                icon={Upload}
                                gradient="from-orange-50 to-amber-100"
                                onClick={() => router.push('/evidence/import-evidence')}
                            />
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Tổng minh chứng"
                                value={statistics.totalEvidences}
                                icon={FileText}
                                gradient="from-indigo-50 to-purple-100"
                                onClick={() => router.push('/evidence/evidence-management')}
                            />
                            <StatCard
                                title="Đang hoạt động"
                                value={statistics.activeEvidences}
                                icon={CheckCircle}
                                gradient="from-green-50 to-emerald-100"
                                onClick={() => router.push('/evidence/evidence-management?status=active')}
                            />
                            <StatCard
                                title="Ngừng hoạt động"
                                value={statistics.inactiveEvidences}
                                icon={XCircle}
                                gradient="from-red-50 to-pink-100"
                                onClick={() => router.push('/evidence/evidence-management?status=inactive')}
                            />
                            <StatCard
                                title="Tổng files"
                                value={statistics.totalFiles}
                                icon={TrendingUp}
                                gradient="from-purple-50 to-indigo-100"
                            />
                        </div>

                        {/* Recent Evidences */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                                        Minh chứng gần đây
                                    </h3>
                                    <button
                                        onClick={() => router.push('/evidence/evidence-management')}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center group"
                                    >
                                        <span>Xem tất cả</span>
                                        <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {recentEvidences.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText className="h-10 w-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có minh chứng nào</h3>
                                        <p className="text-gray-500 mb-6">Bắt đầu bằng cách tạo minh chứng đầu tiên</p>
                                        <button
                                            onClick={() => router.push('/evidence/create')}
                                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                                        >
                                            <Plus className="h-5 w-5 mr-2" />
                                            Tạo minh chứng mới
                                        </button>
                                    </div>
                                ) : (
                                    recentEvidences.map((evidence) => (
                                        <div key={evidence._id} className="p-6 hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <FileText className="h-6 w-6 text-indigo-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                                {evidence.name}
                                                            </h4>
                                                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                                                                {evidence.code}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                                                            <span className="flex items-center">
                                                                <BookOpen className="h-3 w-3 mr-1" />
                                                                {evidence.createdBy?.fullName || 'N/A'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{evidence.programId?.name || 'N/A'}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(evidence.createdAt)}</span>
                                                        </div>
                                                        {(evidence.standardId?.name || evidence.criteriaId?.name) && (
                                                            <p className="text-xs text-gray-600 mt-2 line-clamp-1">
                                                                {evidence.standardId?.name} {evidence.criteriaId?.name ? `- ${evidence.criteriaId.name}` : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                                        getStatusColor(evidence.status)
                                                    }`}>
                                                        {getStatusLabel(evidence.status)}
                                                    </span>
                                                    <button
                                                        onClick={() => router.push(`/evidence/files=${evidence._id}`)}
                                                        className="opacity-0 group-hover:opacity-100 text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Academic Year Info */}
                        {statistics.academicYear && (
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-indigo-700 font-medium">Năm học hiện tại</p>
                                        <p className="text-lg font-bold text-indigo-900">
                                            {statistics.academicYear.name} ({statistics.academicYear.code})
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    )
}