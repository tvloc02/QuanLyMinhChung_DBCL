import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import api, { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    FileText,
    Search,
    Filter,
    Eye,
    CheckCircle,
    Loader2,
    Lock, // Icon Hoàn tất
    AlertCircle,
    Settings,
    User,
    Calendar,
    ChevronDown,
    RefreshCw,
    Award
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function FinalApprovals() {
    const router = useRouter()
    const { user, isLoading: authLoading } = useAuth()

    // ✅ ĐÃ SỬA: Cho phép Admin, Supervisor VÀ Advisor truy cập
    const allowedRoles = ['admin', 'supervisor', 'advisor']

    const [evaluations, setEvaluations] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0
    })
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        search: '',
        status: 'supervised', // CHỈ LỌC ĐÁNH GIÁ ĐÃ GIÁM SÁT
        sortBy: 'submittedAt',
        sortOrder: 'asc'
    })
    const [isProcessing, setIsProcessing] = useState(false)

    // --- Authorization ---
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login')
        }
        // ✅ KIỂM TRA TRUY CẬP FRONTEND
        else if (!authLoading && user && !allowedRoles.includes(user.role)) {
            toast.error('Bạn không có quyền truy cập trang Hoàn tất đánh giá.')
            router.replace('/')
        }
    }, [user, authLoading, router])

    // --- Data Fetching ---
    const fetchEvaluations = useCallback(async () => {
        if (!user || !allowedRoles.includes(user.role)) return;

        setLoading(true)
        try {
            const response = await apiMethods.evaluations.getAll({
                ...filters,
                forSupervisionView: true,
                status: 'supervised' // Đảm bảo luôn lọc trạng thái này
            })
            const { evaluations, pagination: newPagination } = response.data.data
            setEvaluations(evaluations)
            setPagination(newPagination)
        } catch (error) {
            console.error('Fetch final approvals error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách đánh giá đã giám sát')
        } finally {
            setLoading(false)
        }
    }, [filters, user])

    useEffect(() => {
        fetchEvaluations()
    }, [fetchEvaluations])

    // --- Actions ---
    const handleFinalize = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn HOÀN TẤT đánh giá này? Thao tác này sẽ KHÓA vĩnh viễn đánh giá.')) return

        setIsProcessing(true)
        try {
            // Backend đã được sửa để chấp nhận advisor/supervisor/admin
            const response = await apiMethods.evaluations.finalize(id)

            toast.success(response.data.message)
            fetchEvaluations() // Tải lại danh sách

        } catch (error) {
            console.error('Finalize error:', error)
            // Lỗi 403 từ backend vẫn sẽ bị bắt ở đây nếu có vấn đề về token/session
            toast.error(error.response?.data?.message || 'Lỗi khi hoàn tất đánh giá')
        } finally {
            setIsProcessing(false)
        }
    }

    // --- Helpers ---
    const getStatusStyle = (status) => {
        const styles = {
            draft: 'bg-gray-100 text-gray-700',
            submitted: 'bg-blue-100 text-blue-700',
            supervised: 'bg-indigo-100 text-indigo-700 font-bold', // Đã giám sát - sẵn sàng hoàn tất
            final: 'bg-green-100 text-green-700 font-bold'
        }
        return styles[status] || 'bg-gray-100 text-gray-700'
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            submitted: 'Đã nộp',
            supervised: 'Đã giám sát',
            final: 'Hoàn tất'
        }
        return labels[status] || status
    }


    const breadcrumbItems = [
        { name: 'Quản lý', href: '/management' },
        { name: 'Hoàn tất đánh giá' }
    ]

    return (
        <Layout title="Hoàn tất đánh giá" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Lock className="w-6 h-6 mr-3 text-indigo-600" />
                            Danh sách chờ Hoàn tất (Trạng thái "Đã giám sát")
                        </h1>
                        <button
                            onClick={() => fetchEvaluations()}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                            disabled={loading || isProcessing}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : evaluations.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl">
                                <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">Không có đánh giá nào chờ Hoàn tất.</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã BC</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Chuyên gia</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày giám sát</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {evaluations.map((e) => (
                                    <tr key={e._id} className="hover:bg-indigo-50/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {e.reportId?.code || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                                            <User className="w-4 h-4 mr-2 text-blue-500" />
                                            {e.evaluatorId?.fullName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 rounded-full ${getStatusStyle(e.status)}`}>
                                                    {getStatusLabel(e.status)}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {e.supervisorGuidance?.guidedAt ? formatDate(e.supervisorGuidance.guidedAt) : 'Chưa có'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => router.push(`/evaluations/${e._id}`)}
                                                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleFinalize(e._id)}
                                                disabled={isProcessing}
                                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
                                                title="Hoàn tất đánh giá này"
                                            >
                                                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                                                Hoàn tất
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Thêm phần Phân trang ở đây nếu cần */}
                </div>
            </div>
        </Layout>
    )
}