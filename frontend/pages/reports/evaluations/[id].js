import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import { apiMethods } from '../../../services/api'
import toast from 'react-hot-toast'
import {
    Plus,
    FileText,
    TrendingUp,
    Users,
    CircleCheck,
    Hourglass,
    ArrowRight,
    Search,
    RefreshCw,
    AlertCircle
} from 'lucide-react'

// Giả định component là trang danh sách/dashboard chính
export default function EvaluationsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { search, status, rating, page: initialPage = 1 } = router.query

    const [loading, setLoading] = useState(true)
    const [evaluations, setEvaluations] = useState([])
    const [total, setTotal] = useState(0)
    const [stats, setStats] = useState(null)
    const [currentPage, setCurrentPage] = useState(parseInt(initialPage))
    const [searchTerm, setSearchTerm] = useState(search || '')
    const [filterStatus, setFilterStatus] = useState(status || '')
    const [filterRating, setFilterRating] = useState(rating || '')
    const limit = 10

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && router.isReady) {
            fetchEvaluations()
            fetchStatistics()
        }
    }, [user, router.isReady, currentPage, filterStatus, filterRating, search])

    const fetchStatistics = async () => {
        try {
            let statsRes
            let statsData

            if (user.role === 'expert') {
                statsRes = await apiMethods.evaluations.getEvaluatorStats(user.id)
                statsData = statsRes.data?.data || statsRes.data
            } else if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'manager') {
                statsRes = await apiMethods.evaluations.getSystemStats()
                statsData = statsRes.data?.data || statsRes.data
            }

            if (statsData) {
                setStats(statsData)
            }
        } catch (error) {
            console.error('❌ Error fetching statistics:', error)
        }
    }

    const fetchEvaluations = async () => {
        try {
            setLoading(true)

            // 🚀 SỬA LỖI 400: Xây dựng queryParams sạch hơn
            const rawParams = {
                page: currentPage,
                limit,
                search: searchTerm.trim() || undefined, // undefined nếu trống
                status: filterStatus || undefined,
                rating: filterRating || undefined,
            }

            // Lọc ra các tham số có giá trị (loại bỏ undefined/null/empty string)
            const queryParams = Object.keys(rawParams).reduce((acc, key) => {
                const value = rawParams[key];
                if (value !== undefined && value !== null && value !== '') {
                    // Đảm bảo các tham số như page/limit là số nếu có
                    if (key === 'page' || key === 'limit') {
                        acc[key] = parseInt(value);
                    } else {
                        acc[key] = value;
                    }
                }
                return acc;
            }, {});


            // Đã sửa: Gọi hàm getAll
            const response = await apiMethods.evaluations.getAll(queryParams)
            const data = response.data?.data || response.data

            setEvaluations(data.evaluations || [])
            setTotal(data.pagination?.total || 0) // Lấy total từ pagination
        } catch (error) {
            console.error('❌ Error fetching evaluations:', error)

            // Thông báo lỗi cụ thể cho 400 Bad Request
            const message = error.response?.data?.message || 'Lỗi tải danh sách đánh giá. Vui lòng kiểm tra tham số lọc.'
            toast.error(message)
            setEvaluations([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setCurrentPage(1)
        fetchEvaluations() // Gọi lại fetchEvaluations sau khi tìm kiếm
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Xác nhận xóa đánh giá này?')) {
            return
        }
        try {
            // Giả định hàm xóa là apiMethods.evaluations.delete
            await apiMethods.evaluations.delete(id)
            toast.success('Đã xóa đánh giá thành công')
            fetchEvaluations()
            fetchStatistics()
        } catch (error) {
            console.error('❌ Error deleting evaluation:', error)
            const message = error.response?.data?.message
            toast.error(message || 'Lỗi khi xóa đánh giá')
        }
    }

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Đánh giá', icon: FileText }
    ]

    const totalPages = Math.ceil(total / limit)

    const statusOptions = [
        { value: '', label: 'Tất cả trạng thái' },
        { value: 'draft', label: 'Bản nháp' },
        { value: 'submitted', label: 'Đã nộp' },
        { value: 'supervised', label: 'Đã giám sát' },
        { value: 'final', label: 'Đã hoàn thành' },
    ]

    const ratingOptions = [
        { value: '', label: 'Tất cả xếp loại' },
        { value: 'excellent', label: 'Xuất sắc' },
        { value: 'good', label: 'Tốt' },
        { value: 'satisfactory', label: 'Đạt yêu cầu' },
        { value: 'needs_improvement', label: 'Cần cải thiện' },
        { value: 'poor', label: 'Kém' }
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (user && user.role !== 'expert' && user.role !== 'admin' && user.role !== 'supervisor' && user.role !== 'manager') {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-red-800 font-semibold">Lỗi truy cập</h3>
                    <p className="text-red-600">Trang này chỉ dành cho chuyên gia và quản lý.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Quản lý Đánh giá" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Đánh giá Báo cáo</h1>
                    <button
                        onClick={() => router.push('/reports/expert-assignments')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo đánh giá mới
                    </button>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                            <p className="text-sm font-medium text-gray-500">Tổng đánh giá</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total || 0}</p>
                            {stats.userRole && <p className="text-xs text-gray-500">({stats.userRole === 'expert' ? 'Của bạn' : 'Hệ thống'})</p>}
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                            <p className="text-sm font-medium text-gray-500">Điểm TB</p>
                            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.averageScore ? stats.averageScore.toFixed(2) : 'N/A'}</p>
                            <p className="text-xs text-gray-500">/ 100</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                            <p className="text-sm font-medium text-gray-500">Đã nộp/Hoàn thành</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{stats.byStatus?.submitted || 0}</p>
                            <p className="text-xs text-gray-500">Bản nháp: {stats.byStatus?.draft || 0}</p>
                        </div>
                        <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                            <p className="text-sm font-medium text-gray-500">Tỷ lệ Xuất sắc</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-1">
                                {stats.byRating?.excellent ? (stats.byRating.excellent / stats.total * 100).toFixed(1) : 0}%
                            </p>
                            <p className="text-xs text-gray-500">Tốt: {stats.byRating?.good || 0}</p>
                        </div>
                    </div>
                )}


                {/* Filter and Search */}
                <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex space-x-4 items-center">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo nhận xét tổng thể..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select
                        value={filterRating}
                        onChange={(e) => {
                            setFilterRating(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {ratingOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Search className="h-4 w-4 mr-2" />
                        Tìm kiếm
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('');
                            setFilterRating('');
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </form>

                {/* Evaluations Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Báo cáo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chuyên gia</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xếp loại</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm TB</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="text-center py-4">Đang tải...</td>
                            </tr>
                        ) : evaluations.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-gray-500">Không tìm thấy đánh giá nào.</td>
                            </tr>
                        ) : (
                            evaluations.map((evaluation) => (
                                <tr key={evaluation._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {evaluation.reportId?.title || 'N/A'}
                                        <p className="text-xs text-gray-500">{evaluation.reportId?.code || ''}</p>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {evaluation.evaluatorId?.fullName || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                evaluation.status === 'draft' ? 'bg-blue-100 text-blue-800' :
                                                    evaluation.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                                                        evaluation.status === 'supervised' ? 'bg-indigo-100 text-indigo-800' :
                                                            evaluation.status === 'final' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {evaluation.status === 'draft' ? 'Bản nháp' :
                                                    evaluation.status === 'submitted' ? 'Đã nộp' :
                                                        evaluation.status === 'supervised' ? 'Đã giám sát' :
                                                            evaluation.status === 'final' ? 'Hoàn thành' :
                                                                'Không rõ'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                                        {evaluation.rating || 'Chưa xếp loại'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                                        {evaluation.averageScore ? evaluation.averageScore.toFixed(2) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => router.push(`/reports/evaluations/${evaluation._id}`)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Xem chi tiết"
                                            >
                                                <FileText className="h-5 w-5" />
                                            </button>
                                            {evaluation.status === 'draft' && evaluation.evaluatorId?._id.toString() === user.id.toString() && (
                                                <button
                                                    onClick={() => router.push(`/reports/evaluations/${evaluation._id}/edit`)}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title="Chỉnh sửa"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 18.271M16.862 4.487L19.5 7.125M18 14.25v2.25H6.75V4.5H14.25" />
                                                    </svg>
                                                </button>
                                            )}
                                            {evaluation.status === 'draft' && evaluation.evaluatorId?._id.toString() === user.id.toString() && (
                                                <button
                                                    onClick={() => handleDelete(evaluation._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Xóa bản nháp"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.953-2.828a1 1 0 000-1.414l-9.9-9.9A1 1 0 007.882.72l-2.8 2.8a1 1 0 00-.293.707v17.172a1 1 0 00.293.707l2.8 2.8a1 1 0 001.414 0l9.9-9.9a1 1 0 000-1.414z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-700">
                            Hiển thị {((currentPage - 1) * limit) + 1} đến {Math.min(currentPage * limit, total)} trên tổng số {total} đánh giá
                        </p>
                        <nav className="flex space-x-1" aria-label="Pagination">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50"
                            >
                                Trước
                            </button>
                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentPage(index + 1)}
                                    className={`px-3 py-1 text-sm font-medium rounded-lg ${
                                        currentPage === index + 1
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50"
                            >
                                Tiếp
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </Layout>
    )
}