import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import api, { apiMethods } from '../../../services/api'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    Loader2,
    Users,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    Send,
    Edit,
    Settings,
    User,
    Award
} from 'lucide-react'
import { formatDate } from '../../../utils/helpers'

export default function EvaluationSupervise() {
    const router = useRouter()
    const { id } = router.query
    const { user, isLoading: authLoading } = useAuth()

    const allowedRoles = ['admin', 'manager', 'supervisor']

    const [evaluation, setEvaluation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [supervisorComment, setSupervisorComment] = useState('')
    const [error, setError] = useState(null)

    // --- Helpers (sao chép từ [id].js) ---
    const getRatingColor = (rating) => {
        const colors = {
            excellent: 'text-indigo-700 bg-indigo-100 border-indigo-300',
            good: 'text-blue-700 bg-blue-100 border-blue-300',
            satisfactory: 'text-yellow-700 bg-yellow-100 border-yellow-300',
            needs_improvement: 'text-orange-700 bg-orange-100 border-orange-300',
            poor: 'text-red-700 bg-red-100 border-red-300'
        }
        return colors[rating] || 'text-gray-700 bg-gray-100 border-gray-300'
    }

    const getRatingLabel = (rating) => {
        const labels = {
            excellent: 'Xuất sắc',
            good: 'Tốt',
            satisfactory: 'Đạt yêu cầu',
            needs_improvement: 'Cần cải thiện',
            poor: 'Kém'
        }
        return labels[rating] || rating
    }

    // --- Data Fetching & Authorization ---

    const fetchEvaluationDetail = useCallback(async () => {
        if (!id) return
        try {
            setLoading(true)
            const response = await apiMethods.evaluations.getById(id)
            const data = response.data?.data || response.data

            if (data.status !== 'submitted') {
                toast.error(`Đánh giá không ở trạng thái 'Đã nộp' (Hiện tại: ${data.status}).`)
                router.replace(`/evaluations/${id}`)
                return
            }

            setEvaluation(data)
            setSupervisorComment(data.supervisorGuidance?.comments || '') // Load nhận xét cũ nếu có
        } catch (error) {
            console.error('Fetch evaluation detail error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải chi tiết đánh giá')
            router.replace('/evaluations/supervised-reports')
        } finally {
            setLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login')
        } else if (!authLoading && user && !allowedRoles.includes(user.role)) {
            toast.error('Bạn không có quyền giám sát đánh giá.')
            router.replace('/')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (id && user && allowedRoles.includes(user.role)) {
            fetchEvaluationDetail()
        }
    }, [id, user, fetchEvaluationDetail])

    // --- Actions ---

    const handleSupervise = async (action) => {
        if (!supervisorComment && action === 'reject') {
            toast.error('Vui lòng cung cấp lý do/nhận xét để yêu cầu đánh giá lại.')
            return
        }

        const actionLabel = action === 'approve' ? 'CHẤP THUẬN' : 'YÊU CẦU ĐÁNH GIÁ LẠI';
        const confirmationMessage = action === 'approve'
            ? 'Bạn có chắc chắn muốn CHẤP THUẬN đánh giá này? Thao tác này sẽ khóa đánh giá này khỏi việc sửa đổi của chuyên gia.'
            : 'Bạn có chắc chắn muốn YÊU CẦU CHUYÊN GIA ĐÁNH GIÁ LẠI? Thao tác này sẽ chuyển đánh giá về trạng thái Bản nháp.';

        if (!confirm(confirmationMessage)) return

        setIsProcessing(true)
        setError(null)
        try {
            let response;
            const payload = { comments: supervisorComment.trim() };

            if (action === 'approve') {
                response = await apiMethods.evaluations.supervise(id, payload) // Giả định apiMethods.evaluations.supervise chấp nhận body
            } else {
                response = await apiMethods.evaluations.requestReEvaluation(id, payload) // Giả định apiMethods.evaluations.requestReEvaluation là hàm mới
            }

            toast.success(response.data.message)
            router.replace(`/evaluations/${id}`)

        } catch (error) {
            console.error(`${actionLabel} error:`, error)
            setError(error.response?.data?.message || `Lỗi khi ${actionLabel.toLowerCase()}`)
            toast.error(error.response?.data?.message || `Lỗi khi ${actionLabel.toLowerCase()}`)
        } finally {
            setIsProcessing(false)
        }
    }

    // --- Render Logic ---

    if (loading) {
        return (
            <Layout title="Giám sát đánh giá" breadcrumbItems={[]}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải chi tiết đánh giá...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!evaluation) {
        return null; // Chờ redirect
    }

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Giám sát', href: '/evaluations/supervised-reports' },
        { name: `Giám sát: ${evaluation.reportId?.code}` }
    ]

    return (
        <Layout title="Giám sát đánh giá" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                    <Settings className="w-8 h-8" />
                                </div>
                                <h1 className="text-3xl font-bold">Giám sát đánh giá</h1>
                            </div>
                            <p className="text-blue-100 font-semibold">
                                Báo cáo: {evaluation.reportId?.title} (Mã: {evaluation.reportId?.code})
                            </p>
                            <p className="text-blue-100 text-sm mt-1 flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                Chuyên gia: {evaluation.evaluatorId?.fullName}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center px-4 py-2 rounded-full font-semibold border-2 bg-blue-100 text-blue-700 border-blue-200">
                                Đã nộp
                            </span>
                        </div>
                    </div>
                </div>

                {/* Phần Tổng quan Đánh giá */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center">
                            <MessageSquare className="h-6 w-6 text-blue-600 mr-2" />
                            Nhận xét tổng thể & Xếp loại của Chuyên gia
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-2">
                            <p className="text-sm font-semibold text-gray-600">NHẬN XÉT TỔNG THỂ:</p>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-gray-800 whitespace-pre-wrap">{evaluation.overallComment || <span className="italic text-gray-500">Chưa có nhận xét</span>}</p>
                            </div>
                        </div>
                        <div className="col-span-1 space-y-2">
                            <p className="text-sm font-semibold text-gray-600">XẾP LOẠI:</p>
                            {evaluation.rating ? (
                                <span className={`inline-flex items-center px-4 py-2 rounded-full text-md font-bold border-2 ${getRatingColor(evaluation.rating)}`}>
                                    <Award className="h-5 w-5 mr-2" />
                                    {getRatingLabel(evaluation.rating)}
                                </span>
                            ) : (
                                <span className="text-gray-500 italic">Chưa xếp loại</span>
                            )}
                            <div className="mt-4">
                                <button
                                    onClick={() => router.push(`/evaluations/${id}`)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    Xem toàn bộ chi tiết đánh giá →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Khu vực Giám sát */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <Settings className="h-6 w-6 text-red-600 mr-2" />
                        Quyết định Giám sát
                    </h2>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Nhận xét Giám sát */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Edit className="h-4 w-4 mr-1" />
                            Nhận xét/Hướng dẫn của Giám sát viên (Bắt buộc nếu Yêu cầu đánh giá lại)
                        </label>
                        <textarea
                            rows="5"
                            value={supervisorComment}
                            onChange={(e) => setSupervisorComment(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="Nhập nhận xét của bạn về đánh giá này. Nếu có điểm cần sửa đổi, hãy ghi chi tiết ở đây."
                            disabled={isProcessing}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-100">
                        {/* 1. Yêu cầu Đánh giá lại (Reject) */}
                        <button
                            onClick={() => handleSupervise('reject')}
                            disabled={isProcessing || supervisorComment.trim() === ''}
                            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-lg"
                        >
                            {isProcessing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                            Yêu cầu Đánh giá lại (Về Bản nháp)
                        </button>

                        {/* 2. Chấp thuận Giám sát (Approve) */}
                        <button
                            onClick={() => handleSupervise('approve')}
                            disabled={isProcessing}
                            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-lg"
                        >
                            {isProcessing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                            Chấp thuận Giám sát (Hoàn thành bước này)
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                        Lưu ý: Chấp thuận giám sát sẽ chuyển trạng thái đánh giá sang "Đã giám sát".
                    </div>
                </div>
            </div>
        </Layout>
    )
}