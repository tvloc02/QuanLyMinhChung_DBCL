import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    User,
    Clock,
    MessageSquare,
    CheckCircle,
    BarChart3,
    FileText,
    ArrowLeft,
    Target,
    Zap,
    ClipboardCheck,
    Loader2,
    AlertCircle
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ReportEvaluationsSplitView() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { reportId } = router.query

    // -- State --
    const [report, setReport] = useState(null)
    const [evaluations, setEvaluations] = useState([])
    const [selectedEval, setSelectedEval] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports' },
        { name: 'Chi tiết đánh giá' }
    ]

    // -- Authentication Check --
    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    // -- Fetch Data --
    useEffect(() => {
        if (router.isReady && reportId && user) {
            fetchData()
        }
    }, [reportId, user, router.isReady])

    const fetchData = async () => {
        try {
            setLoading(true)
            setErrorMsg('')

            console.log("--- BẮT ĐẦU TẢI DỮ LIỆU ---")

            // 1. Lấy thông tin báo cáo
            try {
                const reportRes = await apiMethods.reports.getById(reportId)
                setReport(reportRes.data?.data)
            } catch (err) {
                console.error("Lỗi lấy thông tin báo cáo:", err)
                // Không chặn lại, vẫn thử lấy đánh giá
            }

            // 2. Thiết lập tham số query lấy đánh giá
            const params = {
                reportId: reportId,
                limit: 100,
                sortBy: 'createdAt', // Sửa thành createdAt để thấy cả bài mới tạo
                sortOrder: 'desc'
            }

            // LOGIC BACKEND:
            // Nếu là Evaluator: Backend tự động lọc bài của chính họ.
            // Nếu là Manager/Reporter: Backend trả về tất cả theo reportId.

            console.log("Gửi request API với params:", params)

            const evalRes = await apiMethods.evaluations.getAll(params)

            console.log("Dữ liệu thô từ Backend:", evalRes.data)

            let fetchedEvals = evalRes.data?.data?.evaluations || []

            // --- QUAN TRỌNG: BỎ BỘ LỌC CLIENT-SIDE ---
            // Trước đây code cũ lọc bỏ 'draft', giờ ta giữ lại để debug
            // Nếu bạn muốn lọc lại sau này, hãy bỏ comment đoạn dưới:
            /*
            if (user.role !== 'evaluator') {
                fetchedEvals = fetchedEvals.filter(e => ['submitted', 'supervised', 'final'].includes(e.status))
            }
            */
            // ------------------------------------------

            console.log("Dữ liệu hiển thị lên màn hình:", fetchedEvals)

            setEvaluations(fetchedEvals)

            // Tự động chọn bài đầu tiên nếu có
            if (fetchedEvals.length > 0) {
                setSelectedEval(fetchedEvals[0])
            }

        } catch (error) {
            console.error('Fetch error:', error)
            const msg = error.response?.data?.message || error.message || 'Lỗi không xác định'
            setErrorMsg(msg)
            toast.error(`Lỗi tải dữ liệu: ${msg}`)
        } finally {
            setLoading(false)
        }
    }

    // -- Helpers Render --
    const getScoreColor = (score) => {
        if (!score) return 'text-gray-600 bg-gray-100 border-gray-200'
        if (score >= 6) return 'text-indigo-600 bg-indigo-50 border-indigo-200'
        if (score >= 5) return 'text-blue-600 bg-blue-50 border-blue-200'
        if (score >= 3.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    const renderEvidenceBadge = (val) => {
        const map = {
            // Adequacy
            insufficient: { text: 'Chưa đủ', color: 'bg-red-100 text-red-700' },
            adequate: { text: 'Đủ', color: 'bg-blue-100 text-blue-700' },
            comprehensive: { text: 'Toàn diện', color: 'bg-green-100 text-green-700' },
            // Relevance/Quality
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
                        <h3 className="text-lg font-bold text-red-800">Không thể tải dữ liệu</h3>
                        <p className="text-red-600 mt-2">{errorMsg}</p>
                        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium">
                            Thử lại
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
                        Mã BC: <span className="font-mono font-bold text-gray-700">{report?.code || '...'}</span> - {report?.title || 'Đang tải...'}
                    </p>
                </div>
                <button onClick={() => router.back()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
                </button>
            </div>

            {/* MAIN CONTENT: SPLIT VIEW */}
            <div className="h-[calc(100vh-180px)] bg-gray-50 p-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">

                    {/* CỘT TRÁI: DANH SÁCH ĐÁNH GIÁ */}
                    <div className="lg:col-span-4 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                {user.role === 'evaluator' ? 'Đánh giá của tôi' : 'Danh sách chuyên gia'}
                            </h3>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">{evaluations.length}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {evaluations.length === 0 ? (
                                <div className="text-center py-10 px-4 text-gray-400">
                                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Chưa có dữ liệu đánh giá nào.</p>
                                    <p className="text-xs mt-2">(Vui lòng kiểm tra lại Năm học được chọn)</p>
                                </div>
                            ) : (
                                evaluations.map((item) => (
                                    <div
                                        key={item._id}
                                        onClick={() => setSelectedEval(item)}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                            selectedEval?._id === item._id
                                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                                : 'bg-white border-gray-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-gray-800 text-sm truncate" title={item.evaluatorId?.fullName}>
                                                    {item.evaluatorId?.fullName || 'Ẩn danh'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{item.evaluatorId?.email}</p>
                                            </div>
                                            {item.score ? (
                                                <span className={`text-xs font-bold px-2 py-1 rounded border ${getScoreColor(item.score)}`}>
                                                    {item.score}/7
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold px-2 py-1 rounded border bg-gray-100 text-gray-500">--</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
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

                    {/* CỘT PHẢI: NỘI DUNG CHI TIẾT */}
                    <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
                        {!selectedEval ? (
                            <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">
                                <div className="text-center">
                                    <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-20" />
                                    <p>Chọn một bản đánh giá để xem chi tiết</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Detail Header */}
                                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">Chi tiết đánh giá</h3>
                                        <p className="text-xs text-gray-500">ID: {selectedEval._id}</p>
                                    </div>
                                    {user.role === 'manager' && selectedEval.status === 'submitted' && (
                                        <button className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm">
                                            Giám sát / Duyệt
                                        </button>
                                    )}
                                </div>

                                {/* Detail Content (Scrollable) */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                    {/* 1. Kết luận chung */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center">
                                            <MessageSquare className="w-4 h-4 mr-2 text-blue-500" /> 1. Nhận xét & Điểm số
                                        </h4>
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <div className="flex items-center mb-3">
                                                <span className={`text-3xl font-bold mr-3 ${!selectedEval.score ? 'text-gray-400' : 'text-blue-700'}`}>
                                                    {selectedEval.score || 0}/7
                                                </span>
                                                <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-600" style={{ width: `${((selectedEval.score || 0) / 7) * 100}%` }}></div>
                                                </div>
                                            </div>
                                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                                {selectedEval.overallComment || <span className="italic text-gray-400">Chưa có nhận xét tổng thể.</span>}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* 2. Đánh giá minh chứng */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center">
                                                <FileText className="w-4 h-4 mr-2 text-indigo-500" /> 2. Chất lượng minh chứng
                                            </h4>
                                            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                                    <span className="text-sm text-gray-600">Tính đầy đủ:</span>
                                                    {renderEvidenceBadge(selectedEval.evidenceAssessment?.adequacy)}
                                                </div>
                                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                                    <span className="text-sm text-gray-600">Tính liên quan:</span>
                                                    {renderEvidenceBadge(selectedEval.evidenceAssessment?.relevance)}
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Chất lượng:</span>
                                                    {renderEvidenceBadge(selectedEval.evidenceAssessment?.quality)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. Điểm mạnh */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center">
                                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> 3. Điểm mạnh
                                            </h4>
                                            <ul className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2 h-full">
                                                {selectedEval.strengths?.length > 0 ? (
                                                    selectedEval.strengths.map((str, idx) => (
                                                        <li key={idx} className="flex items-start text-sm text-gray-700">
                                                            <span className="mr-2 text-green-600">•</span> {str.point}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-sm text-gray-400 italic">Không có ghi chú điểm mạnh</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* 4. Cần cải thiện & Khuyến nghị */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center">
                                                <Zap className="w-4 h-4 mr-2 text-orange-500" /> 4. Cần cải thiện
                                            </h4>
                                            <div className="space-y-3">
                                                {selectedEval.improvementAreas?.length > 0 ? (
                                                    selectedEval.improvementAreas.map((item, idx) => (
                                                        <div key={idx} className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm">
                                                            <p className="font-bold text-gray-800 mb-1">{item.area}</p>
                                                            {item.recommendation && <p className="text-gray-600 text-xs italic mt-1">💡 Gợi ý: {item.recommendation}</p>}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic pl-4 border-l-2 border-gray-200">Không có ghi chú</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center">
                                                <Target className="w-4 h-4 mr-2 text-purple-500" /> 5. Khuyến nghị chung
                                            </h4>
                                            <div className="space-y-3">
                                                {selectedEval.recommendations?.length > 0 ? (
                                                    selectedEval.recommendations.map((item, idx) => (
                                                        <div key={idx} className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-sm relative">
                                                            <p className="font-medium text-gray-800 mb-2">{item.recommendation}</p>
                                                            <div className="flex gap-2">
                                                                <span className="text-[10px] px-2 py-0.5 bg-white border border-purple-200 rounded text-purple-700 uppercase font-bold">
                                                                    {item.type === 'immediate' ? 'Ngay lập tức' : item.type}
                                                                </span>
                                                                <span className="text-[10px] px-2 py-0.5 bg-white border border-purple-200 rounded text-purple-700 capitalize">
                                                                    Ưu tiên: {item.priority}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic pl-4 border-l-2 border-gray-200">Không có khuyến nghị</p>
                                                )}
                                            </div>
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