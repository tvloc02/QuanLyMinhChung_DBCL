import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Activity,
    Search,
    Filter,
    Download,
    Calendar,
    User,
    AlertCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Info,
    TrendingUp,
    BarChart3
} from 'lucide-react'

const LogsPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [logs, setLogs] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [actionFilter, setActionFilter] = useState('')
    const [severityFilter, setSeverityFilter] = useState('')
    const [resultFilter, setResultFilter] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({})

    const breadcrumbItems = [
        { name: 'Hệ thống', icon: Activity },
        { name: 'Lịch sử hoạt động', icon: Clock }
    ]

    const severityConfig = {
        low: { label: 'Thấp', color: 'bg-blue-100 text-blue-800', icon: Info },
        medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
        high: { label: 'Cao', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
        critical: { label: 'Nghiêm trọng', color: 'bg-red-100 text-red-800', icon: XCircle }
    }

    const resultConfig = {
        success: { label: 'Thành công', color: 'bg-green-100 text-green-800', icon: CheckCircle },
        failure: { label: 'Thất bại', color: 'bg-red-100 text-red-800', icon: XCircle },
        warning: { label: 'Cảnh báo', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
        info: { label: 'Thông tin', color: 'bg-blue-100 text-blue-800', icon: Info }
    }

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchLogs()
            fetchStats()
        }
    }, [user, currentPage, searchTerm, actionFilter, severityFilter, resultFilter, startDate, endDate])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage,
                limit: 20,
                ...(searchTerm && { search: searchTerm }),
                ...(actionFilter && { action: actionFilter }),
                ...(severityFilter && { severity: severityFilter }),
                ...(resultFilter && { result: resultFilter }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            })

            const response = await fetch(`/api/activity-logs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Không thể tải lịch sử hoạt động')
            }

            const result = await response.json()
            if (result.success) {
                setLogs(result.data.logs)
                setPagination(result.data.pagination)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const params = new URLSearchParams({
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            })

            const response = await fetch(`/api/activity-logs/stats?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setStats(result.data)
                }
            }
        } catch (err) {
            console.error('Error fetching stats:', err)
        }
    }

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                format: 'csv',
                ...(searchTerm && { search: searchTerm }),
                ...(actionFilter && { action: actionFilter }),
                ...(severityFilter && { severity: severityFilter }),
                ...(resultFilter && { result: resultFilter }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            })

            const response = await fetch(`/api/activity-logs/export?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Không thể xuất dữ liệu')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `activity-logs-${new Date().toISOString()}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            setError(err.message)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    const SeverityBadge = ({ severity }) => {
        const config = severityConfig[severity] || severityConfig.medium
        const Icon = config.icon
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        )
    }

    const ResultBadge = ({ result }) => {
        const config = resultConfig[result] || resultConfig.info
        const Icon = config.icon
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        )
    }

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
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Lịch sử hoạt động</h1>
                        <p className="text-gray-600 mt-1">Theo dõi và giám sát các hoạt động trong hệ thống</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>Xuất dữ liệu</span>
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Tổng hoạt động</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total || 0}</p>
                                </div>
                                <div className="bg-blue-100 rounded-full p-3">
                                    <Activity className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Thành công</p>
                                    <p className="text-2xl font-bold text-green-600 mt-2">
                                        {stats.byResult?.filter(r => r._id === 'success')[0]?.count || 0}
                                    </p>
                                </div>
                                <div className="bg-green-100 rounded-full p-3">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Thất bại</p>
                                    <p className="text-2xl font-bold text-red-600 mt-2">
                                        {stats.byResult?.filter(r => r._id === 'failure')[0]?.count || 0}
                                    </p>
                                </div>
                                <div className="bg-red-100 rounded-full p-3">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Nghiêm trọng</p>
                                    <p className="text-2xl font-bold text-orange-600 mt-2">
                                        {stats.bySeverity?.filter(s => s._id === 'critical' || s._id === 'high').reduce((sum, s) => sum + s.count, 0) || 0}
                                    </p>
                                </div>
                                <div className="bg-orange-100 rounded-full p-3">
                                    <AlertCircle className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            {/* Search */}
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Action Filter */}
                            <div>
                                <select
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả hành động</option>
                                    <option value="user_login">Đăng nhập</option>
                                    <option value="user_logout">Đăng xuất</option>
                                    <option value="user_create">Tạo người dùng</option>
                                    <option value="evidence_create">Tạo minh chứng</option>
                                    <option value="evidence_update">Cập nhật minh chứng</option>
                                    <option value="file_upload">Tải file</option>
                                    <option value="report_create">Tạo báo cáo</option>
                                </select>
                            </div>

                            {/* Severity Filter */}
                            <div>
                                <select
                                    value={severityFilter}
                                    onChange={(e) => setSeverityFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả mức độ</option>
                                    <option value="low">Thấp</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="high">Cao</option>
                                    <option value="critical">Nghiêm trọng</option>
                                </select>
                            </div>

                            {/* Result Filter */}
                            <div>
                                <select
                                    value={resultFilter}
                                    onChange={(e) => setResultFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả kết quả</option>
                                    <option value="success">Thành công</option>
                                    <option value="failure">Thất bại</option>
                                    <option value="warning">Cảnh báo</option>
                                    <option value="info">Thông tin</option>
                                </select>
                            </div>

                            {/* Date Range */}
                            <div className="md:col-span-1">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    placeholder="Từ ngày"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Logs List */}
                <div className="bg-white rounded-lg shadow">
                    {loading && logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-500">Đang tải...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
                            <p className="text-gray-500">Không tìm thấy hoạt động nào phù hợp</p>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thời gian
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Người dùng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hoạt động
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mô tả
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mức độ
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Kết quả
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            IP
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                            {formatDate(log.createdAt)}
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                            {log.userId?.fullName || 'System'}
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {log.actionText}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-900 max-w-md truncate">
                                                    {log.description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <SeverityBadge severity={log.severity} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <ResultBadge result={log.result} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.requestInfo?.ipAddress || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Hiển thị {((pagination.current - 1) * 20) + 1} - {Math.min(pagination.current * 20, pagination.total)} trong {pagination.total} kết quả
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="px-3 py-2 text-sm font-medium text-gray-900">
                                                Trang {pagination.current} / {pagination.pages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={!pagination.hasNext}
                                                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    )
}

export default LogsPage