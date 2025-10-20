import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import {
    ArrowLeft,
    FileText,
    Download,
    Edit,
    Share2,
    Eye,
    Clock,
    User,
    CheckCircle,
    AlertCircle,
    Loader2,
    Code,
    Link as LinkIcon
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

// Hàm kiểm tra tính hợp lệ của MongoDB ObjectId (chuỗi 24 ký tự hex)
const isMongoId = (id) => {
    if (typeof id !== 'string') return false;
    // Kiểm tra phải là chuỗi 24 ký tự hex
    return id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
};

export default function ReportDetailPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { id } = router.query

    const [loading, setLoading] = useState(true)
    const [report, setReport] = useState(null)
    const [evaluations, setEvaluations] = useState([])

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && router.isReady && id) {
            // ✅ ĐÃ SỬA: CHỈ gọi fetchReport nếu ID là một MongoDB ObjectId hợp lệ
            if (isMongoId(id)) {
                fetchReport(id);
            } else {
                // Nếu ID không hợp lệ (ví dụ: 'id1,id2,id3'), chặn fetch API.
                console.warn(`[REPORT DETAIL] Invalid ID format or multiple IDs detected: ${id}. Blocking fetch.`);
                // Ngừng hiển thị loading spinner nếu component đã sẵn sàng và ID không hợp lệ
                if (loading) setLoading(false);
            }
        }
    }, [user, id, router.isReady]) // Không cần 'loading' trong dependency array vì nó có thể gây lỗi

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Chi tiết', icon: FileText }
    ]

    const fetchReport = async (reportId) => {
        try {
            setLoading(true)
            console.log('📥 Fetching report detail:', reportId)

            // Gọi API với ID đã được xác nhận là hợp lệ
            const response = await apiMethods.reports.getById(reportId)
            console.log('📦 Report response:', response)

            const reportData = response.data?.data || response.data

            if (!reportData || !reportData._id) {
                toast.error('Không tìm thấy báo cáo')
                router.push('/reports/reports')
                return
            }

            console.log('✅ Report loaded:', reportData)
            setReport(reportData)

            if (reportData.evaluations && reportData.evaluations.length > 0) {
                setEvaluations(reportData.evaluations)
            }
        } catch (error) {
            console.error('❌ Error fetching report:', error)
            console.error('Error response:', error.response?.data)

            if (error.response?.status === 403) {
                toast.error('Bạn không có quyền xem báo cáo này')
            } else if (error.response?.status === 404) {
                toast.error('Không tìm thấy báo cáo')
            } else if (error.response?.status === 400) {
                // Lỗi 400 (Bad Request)
                toast.error('ID báo cáo không hợp lệ hoặc lỗi API')
            } else {
                toast.error('Lỗi tải báo cáo')
            }

            // Chỉ chuyển hướng nếu lỗi là nghiêm trọng
            if (error.response?.status !== 400) {
                setTimeout(() => {
                    router.push('/reports/reports')
                }, 1500)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadWord = async () => {
        try {
            const response = await apiMethods.reports.download(id, 'html')

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${report.code}-${report.title}.doc`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('Tải báo cáo Word thành công')
        } catch (error) {
            console.error('Download Word error:', error)
            if (error.response?.status === 400) {
                toast.error('Định dạng Word chưa được hỗ trợ. Đang tải HTML...')
                handleDownloadHtml()
            } else {
                toast.error('Lỗi tải báo cáo')
            }
        }
    }

    const handleDownloadHtml = async () => {
        try {
            const response = await apiMethods.reports.download(id, 'html')

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${report.code}-${report.title}.html`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('Tải báo cáo HTML thành công')
        } catch (error) {
            console.error('Download HTML error:', error)
            toast.error('Lỗi tải báo cáo')
        }
    }

    const handleEdit = () => {
        router.push(`/reports/${id}/edit`)
    }

    const getStatusBadge = (status) => {
        const badges = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Bản nháp' },
            published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã xuất bản' },
            archived: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Lưu trữ' }
        }
        const badge = badges[status] || badges.draft
        return badge
    }

    const getTypeBadge = (type) => {
        const badges = {
            criteria_analysis: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Phân tích tiêu chí' },
            standard_analysis: { bg: 'bg-sky-100', text: 'text-sky-800', label: 'Phân tích tiêu chuẩn' },
            comprehensive_report: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Báo cáo tổng hợp' }
        }
        const badge = badges[type] || badges.criteria_analysis
        return badge
    }

    // Chỉ hiển thị loading nếu đang thực hiện fetch và ID hợp lệ
    if (isLoading || (loading && isMongoId(id))) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Đang tải báo cáo...</p>
                </div>
            </Layout>
        )
    }

    // Nếu ID không hợp lệ và đã dừng loading (lỗi 400 giả định)
    if (!report && !isMongoId(id)) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold text-red-800">Lỗi</h3>
                            <p className="text-red-600 text-sm">Đường dẫn không hợp lệ, ID báo cáo bị sai.</p>
                        </div>
                    </div>
                </div>
            </Layout>
        )
    }


    if (!report) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold text-red-800">Lỗi</h3>
                            <p className="text-red-600 text-sm">Không thể tải báo cáo</p>
                        </div>
                    </div>
                </div>
            </Layout>
        )
    }

    const statusBadge = getStatusBadge(report.status)
    const typeBadge = getTypeBadge(report.type)

    return (
        <Layout title={`${report.title}`} breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-blue-100 hover:text-white mb-4 font-semibold transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </button>

                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-mono bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                                    {report.code}
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold mb-3">{report.title}</h1>
                            <p className="text-blue-100 line-clamp-2">{report.summary}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <span className={`px-4 py-2 rounded-lg font-semibold text-sm border border-white border-opacity-20 ${statusBadge.bg} ${statusBadge.text}`}>
                                {statusBadge.label}
                            </span>
                            <span className={`px-4 py-2 rounded-lg font-semibold text-sm border border-white border-opacity-20 ${typeBadge.bg} ${typeBadge.text}`}>
                                {typeBadge.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Người tạo</p>
                                <p className="font-semibold text-gray-900 text-sm">{report.createdBy?.fullName || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Ngày tạo</p>
                                <p className="font-semibold text-gray-900 text-sm">{formatDate(report.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <Eye className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Lượt xem</p>
                                <p className="font-semibold text-gray-900 text-sm">{report.metadata?.viewCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <Download className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Lượt tải</p>
                                <p className="font-semibold text-gray-900 text-sm">{report.metadata?.downloadCount || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Classification */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Phân loại</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {report.programId && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Chương trình</p>
                                <p className="font-semibold text-gray-900">{report.programId?.name || 'N/A'}</p>
                            </div>
                        )}

                        {report.organizationId && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Tổ chức</p>
                                <p className="font-semibold text-gray-900">{report.organizationId?.name || 'N/A'}</p>
                            </div>
                        )}

                        {report.standardId && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Tiêu chuẩn</p>
                                <p className="font-semibold text-gray-900">{report.standardId?.code}</p>
                                <p className="text-xs text-gray-600 mt-1">{report.standardId?.name}</p>
                            </div>
                        )}

                        {report.criteriaId && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Tiêu chí</p>
                                <p className="font-semibold text-gray-900">{report.criteriaId?.code}</p>
                                <p className="text-xs text-gray-600 mt-1">{report.criteriaId?.name}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {report.content && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Nội dung báo cáo
                        </h2>
                        <div
                            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: report.content }}
                        />
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                <Code className="h-3 w-3 inline mr-1" />
                                Tổng số từ: <strong>{report.wordCount || 0}</strong> từ
                            </p>
                        </div>
                    </div>
                )}

                {/* Keywords */}
                {report.keywords && report.keywords.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Từ khóa</h2>
                        <div className="flex flex-wrap gap-2">
                            {report.keywords.map((keyword, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold border border-blue-300"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Linked Evidences */}
                {report.linkedEvidences && report.linkedEvidences.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-blue-600" />
                            Minh chứng liên kết
                        </h2>
                        <div className="space-y-3">
                            {report.linkedEvidences.map((evidence, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-mono font-bold text-blue-700">{evidence.evidenceId?.code}</p>
                                            <p className="text-gray-900 font-semibold mt-1">{evidence.evidenceId?.name}</p>
                                            {evidence.contextText && (
                                                <p className="text-sm text-gray-600 mt-2">
                                                    <strong>Ngữ cảnh:</strong> {evidence.contextText}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(evidence.linkedAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Evaluations */}
                {evaluations && evaluations.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Đánh giá
                            <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-bold">
                                {evaluations.length}
                            </span>
                        </h2>
                        <div className="space-y-4">
                            {evaluations.map((evaluation, idx) => (
                                <div key={idx} className="border border-green-200 rounded-lg p-4 bg-green-50">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {evaluation.evaluatorId?.fullName || 'Chuyên gia'}
                                            </p>
                                            <p className="text-xs text-gray-600">{evaluation.evaluatorId?.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {evaluation.rating && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                    evaluation.rating === 'excellent' ? 'bg-green-200 text-green-800 border-green-300' :
                                                        evaluation.rating === 'good' ? 'bg-blue-200 text-blue-800 border-blue-300' :
                                                            evaluation.rating === 'satisfactory' ? 'bg-yellow-200 text-yellow-800 border-yellow-300' :
                                                                evaluation.rating === 'needs_improvement' ? 'bg-orange-200 text-orange-800 border-orange-300' :
                                                                    'bg-red-200 text-red-800 border-red-300'
                                                }`}>
                                                    {evaluation.rating === 'excellent' ? 'Xuất sắc' :
                                                        evaluation.rating === 'good' ? 'Tốt' :
                                                            evaluation.rating === 'satisfactory' ? 'Đạt yêu cầu' :
                                                                evaluation.rating === 'needs_improvement' ? 'Cần cải thiện' : 'Kém'}
                                                </span>
                                            )}
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                evaluation.status === 'draft' ? 'bg-gray-200 text-gray-800 border-gray-300' :
                                                    evaluation.status === 'submitted' ? 'bg-blue-200 text-blue-800 border-blue-300' :
                                                        evaluation.status === 'supervised' ? 'bg-purple-200 text-purple-800 border-purple-300' :
                                                            'bg-green-200 text-green-800 border-green-300'
                                            }`}>
                                                {evaluation.status === 'draft' ? 'Bản nháp' :
                                                    evaluation.status === 'submitted' ? 'Đã nộp' :
                                                        evaluation.status === 'supervised' ? 'Đã giám sát' : 'Hoàn tất'}
                                            </span>
                                        </div>
                                    </div>

                                    {evaluation.overallComment && (
                                        <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                                            {evaluation.overallComment}
                                        </p>
                                    )}

                                    {evaluation.submittedAt && (
                                        <p className="text-xs text-gray-600">
                                            <strong>Ngày nộp:</strong> {formatDate(evaluation.submittedAt)}
                                        </p>
                                    )}

                                    <button
                                        onClick={() => router.push(`/reports/evaluations/${evaluation._id}`)}
                                        className="mt-3 text-xs text-green-600 hover:text-green-700 font-bold hover:underline"
                                    >
                                        Xem chi tiết đánh giá →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Thao tác</h2>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleDownloadWord}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Tải Word (.docx)
                        </button>

                        <button
                            onClick={handleDownloadHtml}
                            className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold transition-colors"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Tải HTML
                        </button>

                        {report.status === 'draft' && (
                            <button
                                onClick={handleEdit}
                                className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold transition-colors"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                            </button>
                        )}

                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    )
}