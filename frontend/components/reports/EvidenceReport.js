import { useState, useEffect } from 'react'
import {
    FileText,
    Download,
    Filter,
    Calendar,
    BarChart3,
    PieChart,
    TrendingUp,
    Users,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle
} from 'lucide-react'
import SearchBox from '../common/SearchBox'
import { formatDate, formatNumber } from '../../utils/helpers'
import exportService from '../../services/exportService'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'

export default function EvidenceReport() {
    const [loading, setLoading] = useState(true)
    const [reportData, setReportData] = useState(null)
    const [filters, setFilters] = useState({
        programId: '',
        organizationId: '',
        dateFrom: '',
        dateTo: '',
        status: '',
        searchQuery: ''
    })
    const [showFilters, setShowFilters] = useState(false)
    const [exporting, setExporting] = useState(false)

    // Mock data for options
    const [programs] = useState([
        { id: 'prog1', name: 'Chương trình đánh giá chất lượng giáo dục' },
        { id: 'prog2', name: 'Chương trình kiểm định chất lượng' }
    ])

    const [organizations] = useState([
        { id: 'org1', name: 'Trung tâm kiểm định chất lượng - VNUA' },
        { id: 'org2', name: 'Ban đảm bảo chất lượng' }
    ])

    const statusOptions = [
        { value: 'approved', label: 'Đã phê duyệt', color: 'text-green-600' },
        { value: 'pending', label: 'Chờ xử lý', color: 'text-yellow-600' },
        { value: 'rejected', label: 'Từ chối', color: 'text-red-600' },
        { value: 'draft', label: 'Nháp', color: 'text-gray-600' }
    ]

    useEffect(() => {
        fetchReportData()
    }, [filters])

    const fetchReportData = async () => {
        try {
            setLoading(true)
            // Mock API call - replace with actual service
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Mock data
            const mockData = {
                summary: {
                    total: 245,
                    approved: 180,
                    pending: 45,
                    rejected: 15,
                    draft: 5
                },
                byProgram: [
                    { program: 'Chương trình đánh giá chất lượng', count: 150, approved: 120, pending: 20, rejected: 10 },
                    { program: 'Chương trình kiểm định chất lượng', count: 95, approved: 60, pending: 25, rejected: 5 }
                ],
                byStandard: [
                    { standard: 'Tiêu chuẩn 1: Sứ mệnh và mục tiêu', count: 45, percentage: 18.4 },
                    { standard: 'Tiêu chuẩn 2: Tổ chức và quản lý', count: 38, percentage: 15.5 },
                    { standard: 'Tiêu chuẩn 3: Chương trình đào tạo', count: 52, percentage: 21.2 },
                    { standard: 'Tiêu chuẩn 4: Hoạt động đào tạo', count: 41, percentage: 16.7 },
                    { standard: 'Tiêu chuẩn 5: Đánh giá', count: 35, percentage: 14.3 },
                    { standard: 'Khác', count: 34, percentage: 13.9 }
                ],
                timeline: [
                    { month: '01/2024', created: 15, approved: 12 },
                    { month: '02/2024', created: 20, approved: 18 },
                    { month: '03/2024', created: 25, approved: 22 },
                    { month: '04/2024', created: 18, approved: 16 },
                    { month: '05/2024', created: 22, approved: 20 },
                    { month: '06/2024', created: 28, approved: 25 }
                ],
                topContributors: [
                    { name: 'Nguyễn Văn A', count: 25, department: 'Khoa CNTT' },
                    { name: 'Trần Thị B', count: 20, department: 'Khoa KT' },
                    { name: 'Lê Văn C', count: 18, department: 'Khoa NN' },
                    { name: 'Phạm Thị D', count: 15, department: 'Phòng ĐBCL' },
                    { name: 'Hoàng Văn E', count: 12, department: 'Ban giám hiệu' }
                ]
            }

            setReportData(mockData)
        } catch (error) {
            toast.error('Lỗi tải dữ liệu báo cáo')
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleExport = async (format) => {
        try {
            setExporting(true)
            const result = await exportService.exportEvidenceToExcel(filters, {
                filename: `evidence_report_${formatDate(new Date(), 'YYYY-MM-DD')}.${format}`,
                includeCharts: true
            })

            if (result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error('Lỗi xuất báo cáo')
        } finally {
            setExporting(false)
        }
    }

    const StatCard = ({ title, value, icon: Icon, color = 'blue', change }) => (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className={`text-2xl font-bold text-${color}-600`}>
                        {formatNumber(value)}
                    </p>
                    {change && (
                        <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change > 0 ? '+' : ''}{change}% từ tháng trước
                        </p>
                    )}
                </div>
                <div className={`p-3 bg-${color}-100 rounded-lg`}>
                    <Icon className={`h-6 w-6 text-${color}-600`} />
                </div>
            </div>
        </div>
    )

    const ProgressBar = ({ value, max, color = 'blue', label, showValue = true }) => (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-700">{label}</span>
                {showValue && (
                    <span className="text-gray-600">{value}/{max}</span>
                )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                />
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải dữ liệu báo cáo...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Báo cáo minh chứng</h1>
                    <p className="text-gray-600 mt-1">
                        Tổng quan và thống kê chi tiết về minh chứng trong hệ thống
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                            showFilters
                                ? 'border-blue-300 text-blue-700 bg-blue-50'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Bộ lọc
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => handleExport('xlsx')}
                            disabled={exporting}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {exporting ? 'Đang xuất...' : 'Xuất báo cáo'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Bộ lọc báo cáo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Chương trình
                            </label>
                            <select
                                value={filters.programId}
                                onChange={(e) => handleFilterChange('programId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả chương trình</option>
                                {programs.map(program => (
                                    <option key={program.id} value={program.id}>
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tổ chức
                            </label>
                            <select
                                value={filters.organizationId}
                                onChange={(e) => handleFilterChange('organizationId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả tổ chức</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trạng thái
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả trạng thái</option>
                                {statusOptions.map(status => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Từ ngày
                            </label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Đến ngày
                            </label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                min={filters.dateFrom}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {reportData && (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Tổng minh chứng"
                            value={reportData.summary.total}
                            icon={FileText}
                            color="blue"
                            change={8.2}
                        />
                        <StatCard
                            title="Đã phê duyệt"
                            value={reportData.summary.approved}
                            icon={CheckCircle}
                            color="green"
                            change={12.5}
                        />
                        <StatCard
                            title="Chờ xử lý"
                            value={reportData.summary.pending}
                            icon={Clock}
                            color="yellow"
                            change={-3.8}
                        />
                        <StatCard
                            title="Từ chối"
                            value={reportData.summary.rejected}
                            icon={XCircle}
                            color="red"
                            change={-15.2}
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* By Program */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <BarChart3 className="h-5 w-5 mr-2" />
                                Theo chương trình
                            </h3>
                            <div className="space-y-4">
                                {reportData.byProgram.map((item, index) => (
                                    <div key={index}>
                                        <ProgressBar
                                            label={item.program}
                                            value={item.count}
                                            max={reportData.summary.total}
                                            color="blue"
                                        />
                                        <div className="mt-2 flex space-x-4 text-xs text-gray-600">
                                            <span>Đã duyệt: {item.approved}</span>
                                            <span>Chờ: {item.pending}</span>
                                            <span>Từ chối: {item.rejected}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* By Standard */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <PieChart className="h-5 w-5 mr-2" />
                                Theo tiêu chuẩn
                            </h3>
                            <div className="space-y-3">
                                {reportData.byStandard.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-gray-700 truncate">
                                                    {item.standard}
                                                </span>
                                                <span className="text-sm text-gray-600 ml-2">
                                                    {item.percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-purple-600 h-2 rounded-full"
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="ml-4 text-sm font-medium text-gray-900">
                                            {item.count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Chart */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2" />
                            Xu hướng theo thời gian
                        </h3>
                        <div className="h-64 flex items-end space-x-4 border-b border-l border-gray-200 p-4">
                            {reportData.timeline.map((item, index) => {
                                const maxValue = Math.max(...reportData.timeline.map(t => t.created))
                                const createdHeight = (item.created / maxValue) * 200
                                const approvedHeight = (item.approved / maxValue) * 200

                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div className="relative w-full flex justify-center items-end mb-2" style={{ height: '200px' }}>
                                            <div
                                                className="bg-blue-200 rounded-t mr-1"
                                                style={{ height: `${createdHeight}px`, width: '20px' }}
                                            />
                                            <div
                                                className="bg-blue-600 rounded-t ml-1"
                                                style={{ height: `${approvedHeight}px`, width: '20px' }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-600 text-center">
                                            {item.month}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-center space-x-6 mt-4 text-sm">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-200 rounded mr-2" />
                                <span className="text-gray-600">Được tạo</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-600 rounded mr-2" />
                                <span className="text-gray-600">Được duyệt</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Contributors */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Top người đóng góp
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Hạng</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Tên</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Phòng ban</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Số minh chứng</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Tỷ lệ</th>
                                </tr>
                                </thead>
                                <tbody>
                                {reportData.topContributors.map((contributor, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center">
                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                                                        index === 0 ? 'bg-yellow-500' :
                                                            index === 1 ? 'bg-gray-400' :
                                                                index === 2 ? 'bg-amber-600' :
                                                                    'bg-blue-500'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-gray-900">
                                            {contributor.name}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {contributor.department}
                                        </td>
                                        <td className="py-3 px-4 text-gray-900">
                                            {formatNumber(contributor.count)}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {((contributor.count / reportData.summary.total) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}