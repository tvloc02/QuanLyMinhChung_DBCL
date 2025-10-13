import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    FileText,
    Search,
    Filter,
    UserCheck,
    Eye,
    Edit,
    Users,
    Calendar,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    BookOpen,
    BarChart3
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import AssignReviewerModal from '../../components/reports/AssignReviewerModal'
import assessmentService from '../../services/assessmentService'

export default function AssessmentsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [reports, setReports] = useState([])
    const [pagination, setPagination] = useState(null)
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        search: '',
        type: ''
    })
    const [statistics, setStatistics] = useState(null)
    const [selectedReport, setSelectedReport] = useState(null)
    const [showAssignModal, setShowAssignModal] = useState(false)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchReports()
            fetchStatistics()
        }
    }, [user, filters])

    const breadcrumbItems = [
        { name: 'Đánh giá báo cáo', icon: FileText }
    ]

    const fetchReports = async () => {
        try {
            setLoading(true)

            const response = await assessmentService.getAll(filters)

            setReports(response.data.data.reports)
            setPagination(response.data.data.pagination)
        } catch (error) {
            console.error('Error fetching reports:', error)
            toast.error(error.response?.data?.message || 'Lỗi tải danh sách báo cáo')
        } finally {
            setLoading(false)
        }
    }

    const fetchStatistics = async () => {
        try {
            const response = await assessmentService.getStatistics()
            setStatistics(response.data.data)
        } catch (error) {
            console.error('Error fetching statistics:', error)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setFilters({ ...filters, page: 1 })
    }

    const handleViewReport = (reportId) => {
        router.push(`/reports/${reportId}`)
    }

    const handleAssignReviewer = (report) => {
        setSelectedReport(report)
        setShowAssignModal(true)
    }

    const handleAssignSuccess = () => {
        setShowAssignModal(false)
        fetchReports()
        toast.success('Phân quyền đánh giá thành công')
    }

    const getTypeColor = (type) => {
        switch (type) {
            case 'criteria_analysis':
                return 'bg-blue-100 text-blue-800'
            case 'standard_analysis':
                return 'bg-purple-100 text-purple-800'
            case 'comprehensive_report':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
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
        <Layout
            title="Đánh giá báo cáo"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Statistics */}
                {statistics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Tổng báo cáo</p>
                                    <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                                </div>
                                <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Phân tích tiêu chí</p>
                                    <p className="text-2xl font-bold text-gray-900">{statistics.criteriaAnalysis}</p>
                                </div>
                                <BookOpen className="h-8 w-8 text-purple-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Phân tích tiêu chuẩn</p>
                                    <p className="text-2xl font-bold text-gray-900">{statistics.standardAnalysis}</p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-green-500" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Báo cáo tổng hợp</p>
                                    <p className="text-2xl font-bold text-gray-900">{statistics.comprehensiveReport}</p>
                                </div>
                                <FileText className="h-8 w-8 text-orange-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên hoặc mã báo cáo..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả loại</option>
                            <option value="criteria_analysis">Phân tích tiêu chí</option>
                            <option value="standard_analysis">Phân tích tiêu chuẩn</option>
                            <option value="comprehensive_report">Báo cáo tổng hợp</option>
                        </select>

                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>

                {/* Reports List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">Không có báo cáo nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Báo cáo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Loại
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chuyên gia đánh giá
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Giám sát
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {reports.map((report) => (
                                    <tr key={report._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {report.title}
                                                    </span>
                                                <span className="text-sm text-gray-500">
                                                        {report.code}
                                                    </span>
                                                {report.standardInfo && (
                                                    <span className="text-xs text-gray-500 mt-1">
                                                            {report.standardInfo.code} - {report.standardInfo.name}
                                                        {report.criteriaInfo && (
                                                            <span> / {report.criteriaInfo.code}</span>
                                                        )}
                                                        </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(report.type)}`}>
                                                    {report.typeText}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {report.experts.length > 0 ? (
                                                <div className="flex flex-col space-y-1">
                                                    {report.experts.map((expert, idx) => (
                                                        <div key={idx} className="flex items-center text-sm">
                                                            <UserCheck className="h-4 w-4 text-green-500 mr-1" />
                                                            <span className="text-gray-900">{expert.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">Chưa phân công</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {report.advisors.length > 0 ? (
                                                <div className="flex flex-col space-y-1">
                                                    {report.advisors.map((advisor, idx) => (
                                                        <div key={idx} className="flex items-center text-sm">
                                                            <Users className="h-4 w-4 text-blue-500 mr-1" />
                                                            <span className="text-gray-900">{advisor.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">Chưa có</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {formatDate(report.createdAt, 'DD/MM/YYYY')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewReport(report._id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {(user.role === 'admin' || user.role === 'manager') && (
                                                    <button
                                                        onClick={() => handleAssignReviewer(report)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Phân quyền đánh giá"
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Hiển thị {((pagination.current - 1) * filters.limit) + 1} - {Math.min(pagination.current * filters.limit, pagination.total)} trong tổng số {pagination.total} báo cáo
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                        disabled={!pagination.hasPrev}
                                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Trước
                                    </button>
                                    <span className="text-sm text-gray-700">
                                        Trang {pagination.current} / {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                        disabled={!pagination.hasNext}
                                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Assign Reviewer Modal */}
            {showAssignModal && selectedReport && (
                <AssignReviewerModal
                    report={selectedReport}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={handleAssignSuccess}
                />
            )}
        </Layout>
    )
}