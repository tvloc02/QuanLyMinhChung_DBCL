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
    TrendingUp,
    Hourglass,
    Users
} from 'lucide-react'

export default function EvidencePage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const isAdmin = user?.role === 'admin'
    const isManager = user?.role === 'manager'
    const canCreateEvidence = isAdmin || isManager
    const canManageEvidence = isAdmin || isManager
    // Các vai trò khác (TDG, Expert) chỉ có quyền xem/upload (qua trang files)

    const [loading, setLoading] = useState(true)
    const [statistics, setStatistics] = useState({
        totalEvidences: 0,
        newEvidences: 0,
        inProgressEvidences: 0,
        completedEvidences: 0,
        approvedEvidences: 0,
        rejectedEvidences: 0,
        totalFiles: 0,
        academicYear: null
    })
    const [recentEvidences, setRecentEvidences] = useState([])

    // Theo dõi trạng thái chuyển trang
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const handleStart = (url) => {
            // Chỉ hiển thị loading nếu chuyển đến trang khác
            if (url !== router.asPath) {
                setIsNavigating(true);
            }
        };
        const handleComplete = () => setIsNavigating(false);

        router.events.on('routeChangeStart', handleStart);
        router.events.on('routeChangeComplete', handleComplete);
        router.events.on('routeChangeError', handleComplete);

        return () => {
            router.events.off('routeChangeStart', handleStart);
            router.events.off('routeChangeComplete', handleComplete);
            router.events.off('routeChangeError', handleComplete);
        };
    }, [router]);


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

            // 1. Fetch Statistics
            try {
                // API cần được gọi với role-specific query params nếu không phải admin
                const params = !isAdmin && !isManager && user?.department ? { departmentId: user.department } : {};

                const statsResponse = await apiMethods.evidences.getStatistics(params)
                const stats = statsResponse.data?.data || statsResponse.data || {}
                setStatistics({
                    totalEvidences: stats.totalEvidences || 0,
                    newEvidences: stats.newEvidences || 0,
                    inProgressEvidences: stats.inProgressEvidences || 0,
                    completedEvidences: stats.completedEvidences || 0,
                    approvedEvidences: stats.approvedEvidences || 0,
                    rejectedEvidences: stats.rejectedEvidences || 0,
                    totalFiles: stats.totalFiles || 0,
                    academicYear: stats.academicYear || null
                })
            } catch (statError) {
                console.error('Statistics API Error:', statError)
                // toast.error('Lỗi khi tải thống kê minh chứng.') // Bỏ toast để tránh spam
            }

            // 2. Fetch Recent Evidences
            try {
                const params = {
                    page: 1,
                    limit: 5,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                };

                // Áp dụng giới hạn dữ liệu gần đây cho Manager/TDG/Expert
                if (!isAdmin && !isManager && user?.department) {
                    params.departmentId = user.department;
                }

                const evidencesResponse = await apiMethods.evidences.getAll(params)

                const evidences = evidencesResponse.data?.data?.evidences ||
                    evidencesResponse.data?.evidences ||
                    evidencesResponse.data?.data ||
                    []
                setRecentEvidences(Array.isArray(evidences) ? evidences : [])
            } catch (evidenceError) {
                console.error('Recent Evidences API Error:', evidenceError)
                setRecentEvidences([])
            }

        } catch (error) {
            console.error('Fetch data error:', error)
        } finally {
            setLoading(false)
        }
    }

    // --- Các hàm tiện ích được đặt ở đây để đảm bảo scope trước khi render JSX ---

    const getStatusIcon = (status) => {
        switch (status) {
            case 'new':
                return <FileText className="h-4 w-4 text-gray-500" />
            case 'in_progress':
                return <Clock className="h-4 w-4 text-blue-500" />
            case 'completed':
                return <Hourglass className="h-4 w-4 text-teal-500" /> // Chờ duyệt
            case 'approved':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'rejected':
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusLabel = (status) => {
        const labels = {
            'new': 'Mới tạo',
            'in_progress': 'Đang thực hiện',
            'completed': 'Hoàn thành (Chờ duyệt)',
            'approved': 'Đã duyệt',
            'rejected': 'Từ chối'
        }
        return labels[status] || 'Không rõ'
    }

    const getStatusColor = (status) => {
        const colors = {
            'new': 'bg-gray-100 text-gray-800 border-gray-200',
            'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
            'completed': 'bg-teal-100 text-teal-800 border-teal-200', // Chờ duyệt/Hoàn thành
            'approved': 'bg-green-100 text-green-800 border-green-200',
            'rejected': 'bg-red-100 text-red-800 border-red-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    // --- End Hàm tiện ích ---

    const StatCard = ({ title, value, icon: Icon, gradient, onClick, colorClass = 'text-gray-900' }) => (
        <div
            className={`bg-gradient-to-br ${gradient} rounded-xl shadow-md border border-blue-200 p-6 ${
                onClick ? 'cursor-pointer hover:shadow-lg transition-all' : ''
            }`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
                    <p className={`text-3xl font-bold ${colorClass}`}>{formatNumber(value || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-white bg-opacity-70 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-700" />
                </div>
            </div>
        </div>
    )

    const QuickAction = ({ title, description, icon: Icon, gradient, onClick, disabled = false }) => (
        <div
            className={`bg-gradient-to-br ${gradient} rounded-xl shadow-md border border-blue-200 p-6 ${
                disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg transition-all group'
            }`}
            onClick={disabled ? null : onClick}
        >
            <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 bg-white bg-opacity-70 rounded-xl flex items-center justify-center ${!disabled ? 'group-hover:scale-110 transition-transform' : ''}`}>
                    <Icon className="h-7 w-7 text-gray-700" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
            </div>
        </div>
    )

    if (isLoading || isNavigating) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
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
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Tổng quan minh chứng</h1>
                                <p className="text-blue-100">Dashboard quản lý minh chứng chất lượng giáo dục</p>
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
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
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
                                gradient="from-blue-50 to-blue-100"
                                onClick={() => router.push('/evidence/create')}
                                disabled={!canCreateEvidence}
                            />
                            <QuickAction
                                title="Quản lý minh chứng"
                                description="Xem và chỉnh sửa"
                                icon={FileText}
                                gradient="from-indigo-50 to-indigo-100"
                                onClick={() => router.push('/evidence/evidence-management')}
                            />
                            <QuickAction
                                title="Cây minh chứng"
                                description="Cấu trúc phân cấp"
                                icon={FolderTree}
                                gradient="from-purple-50 to-purple-100"
                                onClick={() => router.push('/evidence/evidence-tree')}
                            />
                            <QuickAction
                                title="Import minh chứng"
                                description="Nhập từ file Excel"
                                icon={Upload}
                                gradient="from-teal-50 to-teal-100"
                                onClick={() => router.push('/evidence/import-evidence')}
                                disabled={!canCreateEvidence}
                            />
                        </div>

                        {/* Statistics Cards (Theo trạng thái duyệt) */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <StatCard
                                title="Tổng MC"
                                value={statistics.totalEvidences}
                                icon={FileText}
                                gradient="from-blue-50 to-sky-100"
                                onClick={() => router.push('/evidence/evidence-management')}
                                colorClass="text-blue-900"
                            />
                            <StatCard
                                title="Mới tạo"
                                value={statistics.newEvidences}
                                icon={FileText}
                                gradient="from-gray-50 to-gray-100"
                                onClick={() => router.push('/evidence/evidence-management?status=new')}
                                colorClass="text-gray-900"
                            />
                            <StatCard
                                title="Đang thực hiện"
                                value={statistics.inProgressEvidences}
                                icon={Clock}
                                gradient="from-blue-100 to-cyan-100"
                                onClick={() => router.push('/evidence/evidence-management?status=in_progress')}
                                colorClass="text-blue-800"
                            />
                            <StatCard
                                title="Chờ duyệt"
                                value={statistics.completedEvidences}
                                icon={Hourglass}
                                gradient="from-teal-100 to-green-100"
                                onClick={() => router.push('/evidence/evidence-management?status=completed')}
                                colorClass="text-teal-800"
                            />
                            <StatCard
                                title="Đã duyệt"
                                value={statistics.approvedEvidences}
                                icon={CheckCircle}
                                gradient="from-green-100 to-emerald-100"
                                onClick={() => router.push('/evidence/evidence-management?status=approved')}
                                colorClass="text-green-800"
                            />
                            <StatCard
                                title="Từ chối"
                                value={statistics.rejectedEvidences}
                                icon={XCircle}
                                gradient="from-red-100 to-pink-100"
                                onClick={() => router.push('/evidence/evidence-management?status=rejected')}
                                colorClass="text-red-800"
                            />

                        </div>

                        {/* Tổng files */}
                        <div className="grid grid-cols-1">
                            <StatCard
                                title="Tổng files đính kèm"
                                value={statistics.totalFiles}
                                icon={TrendingUp}
                                gradient="from-yellow-50 to-amber-100"
                                colorClass="text-yellow-800"
                            />
                        </div>


                        {/* Recent Evidences */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
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

                            <div className="divide-y divide-blue-200">
                                {recentEvidences.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                            <FileText className="h-10 w-10 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có minh chứng nào</h3>
                                        <p className="text-gray-500 mb-6">
                                            Bắt đầu bằng cách tạo minh chứng đầu tiên
                                            {(!isAdmin && !isManager) && ' (Nếu bạn được phân quyền)'}
                                        </p>
                                        {canCreateEvidence && (
                                            <button
                                                onClick={() => router.push('/evidence/create')}
                                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                                            >
                                                <Plus className="h-5 w-5 mr-2" />
                                                Tạo minh chứng mới
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    recentEvidences.map((evidence) => (
                                        <div key={evidence._id} className="p-6 hover:bg-blue-50 transition-colors group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <FileText className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                                {evidence.name}
                                                            </h4>
                                                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                                {evidence.code}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                                                            <span className="flex items-center">
                                                                <Users className="h-3 w-3 mr-1" />
                                                                {evidence.createdBy?.fullName || 'N/A'}
                                                            </span>
                                                            <span>•</span>
                                                            <span className="text-xs text-indigo-600 font-medium">
                                                                {evidence.programId?.code || 'N/A'}
                                                            </span>
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
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${
                                                        getStatusColor(evidence.status)
                                                    }`}>
                                                        {getStatusLabel(evidence.status)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Academic Year Info */}
                        {statistics.academicYear && (
                            <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200 rounded-xl p-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <BookOpen className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-700 font-medium">Năm học hiện tại</p>
                                        <p className="text-lg font-bold text-blue-900">
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