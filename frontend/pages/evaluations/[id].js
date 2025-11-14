import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    User, Clock, MessageSquare, CheckCircle, BarChart3, FileText,
    ArrowLeft, Target, Zap, ClipboardCheck, Loader2, AlertCircle
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function EvaluationDetailSplitView() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { id: evaluationId } = router.query

    const [report, setReport] = useState(null)
    const [evaluations, setEvaluations] = useState([])
    const [selectedEval, setSelectedEval] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')

    const breadcrumbItems = [
        { name: 'Đánh giá của tôi', href: '/evaluations/my-evaluations' },
        { name: 'Chi tiết' }
    ]

    useEffect(() => {
        if (!isLoading && !user) router.replace('/login')
    }, [user, isLoading, router])

    useEffect(() => {
        if (router.isReady && evaluationId && user) {
            fetchData()
        }
    }, [evaluationId, user, router.isReady])

    const fetchData = async () => {
        try {
            setLoading(true)
            setErrorMsg('')

            // 1. Lấy chi tiết bản đánh giá hiện tại
            const currentEvalRes = await apiMethods.evaluations.getById(evaluationId)
            const currentEval = currentEvalRes.data?.data

            if (!currentEval) throw new Error("Không tìm thấy bản đánh giá này")

            const reportInfo = currentEval.reportId
            const reportId = reportInfo?._id || reportInfo

            // 2. Lấy thông tin báo cáo
            const reportRes = await apiMethods.reports.getById(reportId)
            setReport(reportRes.data?.data)

            // 3. Lấy danh sách đánh giá liên quan
            const params = {
                reportId: reportId,
                limit: 100,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            }

            // Nếu là Evaluator thì chỉ lấy của mình, còn Manager/Reporter lấy hết
            if (user.role === 'evaluator') {
                params.evaluatorId = user.id
            }

            const listRes = await apiMethods.evaluations.getAll(params)
            const listEvals = listRes.data?.data?.evaluations || []

            // --- KHÔNG LỌC DRAFT NỮA ---
            // Code cũ có filter draft, giờ bỏ đi để Manager/Reporter thấy hết

            setEvaluations(listEvals)

            // Tìm bản đánh giá hiện tại trong danh sách để highlight
            const found = listEvals.find(e => e._id === evaluationId)
            setSelectedEval(found || currentEval)

        } catch (error) {
            console.error('Fetch error:', error)
            // Nếu Backend chưa sửa xong mà Frontend chạy trước thì vẫn bắt lỗi 403 ở đây
            if (error.response && error.response.status === 403) {
                setErrorMsg("Bạn chưa có quyền xem bản đánh giá này (Vui lòng cập nhật Backend để mở quyền).")
            } else {
                const msg = error.response?.data?.message || error.message || 'Lỗi không xác định'
                setErrorMsg(msg)
            }
        } finally {
            setLoading(false)
        }
    }

    // ... (Giữ nguyên các hàm getScoreColor, renderEvidenceBadge, getStatusBadge như cũ)
    const getScoreColor = (score) => {
        if (!score) return 'text-gray-600 bg-gray-100 border-gray-200'
        if (score >= 6) return 'text-indigo-600 bg-indigo-50 border-indigo-200'
        if (score >= 5) return 'text-blue-600 bg-blue-50 border-blue-200'
        if (score >= 3.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    const renderEvidenceBadge = (val) => {
        const map = {
            insufficient: { text: 'Chưa đủ', color: 'bg-red-100 text-red-700' },
            adequate: { text: 'Đủ', color: 'bg-blue-100 text-blue-700' },
            comprehensive: { text: 'Toàn diện', color: 'bg-green-100 text-green-700' },
            poor: { text: 'Kém', color: 'bg-red-100 text-red-700' },
            fair: { text: 'Trung bình', color: 'bg-yellow-100 text-yellow-700' },
            good: { text: 'Tốt', color: 'bg-blue-100 text-blue-700' },
            excellent: { text: 'Xuất sắc', color: 'bg-indigo-100 text-indigo-700' }
        }
        const item = map[val] || { text: val || '---', color: 'bg-gray-100 text-gray-500' }
        return <span className={`text-xs px-2 py-1 rounded-md font-medium ${item.color}`}>{item.text}</span>
    }

    const getStatusBadge = (status) => {
        const map = {
            draft: { text: 'Bản nháp', color: 'bg-yellow-100 text-yellow-700' },
            submitted: { text: 'Đã nộp', color: 'bg-blue-100 text-blue-700' },
            supervised: { text: 'Đã giám sát', color: 'bg-cyan-100 text-cyan-700' },
            final: { text: 'Hoàn tất', color: 'bg-green-100 text-green-700' }
        }
        const item = map[status] || { text: status, color: 'bg-gray-100' }
        return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.color}`}>{item.text}</span>
    }

    if (loading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <p className="mt-4 text-gray-500 font-medium">Đang tải dữ liệu đánh giá...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (errorMsg) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="h-[calc(100vh-200px)] flex items-center justify-center">
                    <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-red-800">Có lỗi xảy ra</h3>
                        <p className="text-red-600 mt-2">{errorMsg}</p>
                        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Chi tiết đánh giá" breadcrumbItems={breadcrumbItems}>
            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardCheck className="w-6 h-6 text-blue-600" />
                        Đánh giá báo cáo
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Mã BC: <span className="font-mono font-bold text-gray-700">{report?.code || '...'}</span> - {report?.title || '...'}
                    </p>
                </div>
                <button onClick={() => router.back()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
                </button>
            </div>

            {/* SPLIT VIEW */}
            <div className="h-[calc(100vh-180px)] bg-gray-50 p-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">

                    {/* CỘT TRÁI: DANH SÁCH */}
                    <div className="lg:col-span-4 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 text-sm flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                {user.role === 'evaluator' ? 'Đánh giá khác của tôi' : 'DS Chuyên gia'}
                            </h3>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">{evaluations.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {evaluations.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <p className="text-sm">Danh sách trống</p>
                                </div>
                            ) : (
                                evaluations.map((item) => (
                                    <div
                                        key={item._id}
                                        onClick={() => setSelectedEval(item)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                            selectedEval?._id === item._id
                                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-200'
                                                : 'bg-white border-gray-100 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-gray-800 text-sm truncate">
                                                    {item.evaluatorId?.fullName || 'Ẩn danh'}
                                                </p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getScoreColor(item.score)}`}>
                                                {item.score ? `${item.score}/7` : '--'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
                                            <span className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {formatDate(item.submittedAt || item.createdAt)}
                                            </span>
                                            {getStatusBadge(item.status)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI: CHI TIẾT */}
                    <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
                        {!selectedEval ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
                                <div className="text-center">
                                    <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                    <p>Chọn đánh giá để xem</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">Chi tiết nội dung</h3>
                                        <p className="text-xs text-gray-500">Người đánh giá: {selectedEval.evaluatorId?.fullName}</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {/* 1. Nhận xét */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center">
                                            <MessageSquare className="w-4 h-4 mr-2 text-blue-500" /> 1. Nhận xét chung
                                        </h4>
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <div className="flex items-center mb-3">
                                                <span className={`text-3xl font-bold mr-3 ${!selectedEval.score ? 'text-gray-400' : 'text-blue-700'}`}>
                                                    {selectedEval.score || 0}/7
                                                </span>
                                            </div>
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                                {selectedEval.overallComment || <span className="italic text-gray-400">Chưa có nhận xét.</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. Minh chứng */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-indigo-500" /> 2. Đánh giá minh chứng
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 mb-1">Tính đầy đủ</p>
                                                {renderEvidenceBadge(selectedEval.evidenceAssessment?.adequacy)}
                                            </div>
                                            <div className="text-center border-l border-gray-100">
                                                <p className="text-xs text-gray-500 mb-1">Tính liên quan</p>
                                                {renderEvidenceBadge(selectedEval.evidenceAssessment?.relevance)}
                                            </div>
                                            <div className="text-center border-l border-gray-100">
                                                <p className="text-xs text-gray-500 mb-1">Chất lượng</p>
                                                {renderEvidenceBadge(selectedEval.evidenceAssessment?.quality)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Điểm mạnh/Cải thiện */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center">
                                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> 3. Điểm mạnh
                                            </h4>
                                            <ul className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2 h-full">
                                                {selectedEval.strengths?.length > 0 ? (
                                                    selectedEval.strengths.map((str, idx) => (
                                                        <li key={idx} className="flex items-start text-sm text-gray-700">
                                                            <span className="mr-2 text-green-600">•</span> {str.point}
                                                        </li>
                                                    ))
                                                ) : <li className="text-sm text-gray-400 italic">Không có</li>}
                                            </ul>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center">
                                                <Zap className="w-4 h-4 mr-2 text-orange-500" /> 4. Cần cải thiện
                                            </h4>
                                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-2 h-full">
                                                {selectedEval.improvementAreas?.length > 0 ? (
                                                    selectedEval.improvementAreas.map((item, idx) => (
                                                        <div key={idx} className="text-sm border-b border-orange-200 last:border-0 pb-2 last:pb-0">
                                                            <p className="font-bold text-gray-800">{item.area}</p>
                                                            {item.recommendation && <p className="text-gray-600 text-xs italic">Gợi ý: {item.recommendation}</p>}
                                                        </div>
                                                    ))
                                                ) : <p className="text-sm text-gray-400 italic">Không có</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. Khuyến nghị */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase flex items-center">
                                            <Target className="w-4 h-4 mr-2 text-purple-500" /> 5. Khuyến nghị
                                        </h4>
                                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2">
                                            {selectedEval.recommendations?.length > 0 ? (
                                                selectedEval.recommendations.map((item, idx) => (
                                                    <div key={idx} className="bg-white border border-purple-100 p-3 rounded-lg shadow-sm">
                                                        <p className="text-sm font-medium text-gray-800">{item.recommendation}</p>
                                                        <div className="flex gap-2 mt-2">
                                                            <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded">{item.type}</span>
                                                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Ưu tiên: {item.priority}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : <p className="text-sm text-gray-400 italic">Không có khuyến nghị</p>}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    )
}