import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Activity, Search, Download, Calendar, User, AlertCircle, Clock,
    ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle,
    Info, RefreshCw, X, TrendingUp, BarChart3, Shield
} from 'lucide-react'

const LogsPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [logs, setLogs] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [searchTerm, setSearchTerm] = useState('')
    const [actionFilter, setActionFilter] = useState('')
    const [severityFilter, setSeverityFilter] = useState('')
    const [resultFilter, setResultFilter] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
    })

    const breadcrumbItems = [
        { name: 'Hệ thống', icon: Shield },
        { name: 'Lịch sử hoạt động', icon: Activity }
    ]

    const severityConfig = {
        low: { label: 'Thấp', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Info },
        medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle },
        high: { label: 'Cao', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
        critical: { label: 'Nghiêm trọng', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
    }

    const resultConfig = {
        success: { label: 'Thành công', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
        failure: { label: 'Thất bại', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
        warning: { label: 'Cảnh báo', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle },
        info: { label: 'Thông tin', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Info }
    }

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user && user.role !== 'admin') {
            router.replace('/dashboard')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
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
                setLogs(result.data.logs || [])
                setPagination(result.data.pagination)
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
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

            setMessage({ type: 'success', text: 'Xuất dữ liệu thành công' })
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    const SeverityBadge = ({ severity }) => {
        const config = severityConfig[severity] || severityConfig.medium
        const Icon = config.icon
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                <Icon className="w-3 h-3 mr-1.5" />
                {config.label}
            </span>
        )
    }

    const ResultBadge = ({ result }) => {
        const config = resultConfig[result] || resultConfig.info
        const Icon = config.icon
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                <Icon className="w-3 h-3 mr-1.5" />
                {config.label}
            </span>
        )
    }

    if (isLoading || !user || user.role !== 'admin') {
        return (
            <Layout title="Đang tải..." breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {message.text && (
                    <div className={`rounded-2xl border p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
                        message.type === 'success'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                    }`}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    message.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                    <AlertCircle className={`w-7 h-7 ${
                                        message.type === 'success' ? 'text-green-600' : 'text-red-600'
                                    }`} />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className={`font-bold text-lg mb-1 ${
                                    message.type === 'success' ? 'text-green-900' : 'text-red-900'
                                }`}>
                                    {message.type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra'}
                                </h3>
                                <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                                    {message.text}
                                </p>
                            </div>
                            <button
                                onClick={() => setMessage({ type: '', text: '' })}
                                className="ml-4 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-r from-blue-700 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Activity className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Lịch sử hoạt động</h1>
                                <p className="text-blue-100">Theo dõi và giám sát các hoạt động trong hệ thống</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-700 rounded-xl hover:shadow-xl transition-all font-medium"
                        >
                            <Download className="w-5 h-5" />
                            <span>Xuất dữ liệu</span>
                        </button>
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600">Tổng hoạt động</p>
                                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total || 0}</p>
                                </div>
                                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <Activity className="w-7 h-7 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600">Thành công</p>
                                    <p className="text-3xl font-bold text-green-600 mt-2">
                                        {stats.byResult?.find(r => r._id === 'success')?.count || 0}
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-7 h-7 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600">Thất bại</p>
                                    <p className="text-3xl font-bold text-red-600 mt-2">
                                        {stats.byResult?.find(r => r._id === 'failure')?.count || 0}
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center">
                                    <XCircle className="w-7 h-7 text-red-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600">Nghiêm trọng</p>
                                    <p className="text-3xl font-bold text-orange-600 mt-2">
                                        {stats.bySeverity?.filter(s => s._id === 'critical' || s._id === 'high').reduce((sum, s) => sum + (s.count || 0), 0) || 0}
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-7 h-7 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <select
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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

                            <div>
                                <select
                                    value={severityFilter}
                                    onChange={(e) => setSeverityFilter(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    <option value="">Tất cả mức độ</option>
                                    <option value="low">Thấp</option>
                                    <option value="medium">Trung bình</option>
                                    <option value="high">Cao</option>
                                    <option value="critical">Nghiêm trọng</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={resultFilter}
                                    onChange={(e) => setResultFilter(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    <option value="">Tất cả kết quả</option>
                                    <option value="success">Thành công</option>
                                    <option value="failure">Thất bại</option>
                                    <option value="warning">Cảnh báo</option>
                                    <option value="info">Thông tin</option>
                                </select>
                            </div>

                            <div>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Activity className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">Không có dữ liệu</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-blue-50 border-b-2 border-blue-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase">Thời gian</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase">Người dùng</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase">Hoạt động</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase">Mô tả</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase">Mức độ</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase">Kết quả</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase">IP</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                    {logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-blue-50 transition-all">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">{formatDate(log.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                                        <span className="text-xs font-bold">
                                                            {log.userId?.fullName?.charAt(0).toUpperCase() || 'S'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {log.userId?.fullName || 'System'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900">{log.actionText}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600 max-w-md truncate">{log.description}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <SeverityBadge severity={log.severity} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <ResultBadge result={log.result} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {log.requestInfo?.ipAddress || 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.pages > 1 && (
                                <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Hiển thị <span className="font-semibold text-blue-600">{(pagination.current - 1) * 20 + 1}</span> đến{' '}
                                            <span className="font-semibold text-blue-600">{Math.min(pagination.current * 20, pagination.total)}</span>{' '}
                                            trong tổng số <span className="font-semibold text-blue-600">{pagination.total}</span> kết quả
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="p-2 border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <span className="text-sm font-semibold text-gray-700 px-4 py-2 bg-white rounded-lg border-2 border-gray-200">
                                                Trang {pagination.current} / {pagination.pages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={!pagination.hasNext}
                                                className="p-2 border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="w-5 h-5" />
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