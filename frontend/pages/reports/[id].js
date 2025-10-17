import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    ArrowLeft,
    Edit,
    Download,
    CheckCircle,
    Eye,
    FileText,
    Calendar,
    User,
    MessageSquare,
    Loader2,
    Link as LinkIcon,
    Clock,
    ExternalLink
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ReportDetail() {
    const router = useRouter()
    const { id } = router.query
    const { user, isLoading } = useAuth()

    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('content')
    const [evidences, setEvidences] = useState([])
    const [versions, setVersions] = useState([])
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [addingComment, setAddingComment] = useState(false)
    const [downloadingHtml, setDownloadingHtml] = useState(false)

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/' },
        { name: 'Quản lý báo cáo', href: '/reports', icon: FileText },
        { name: report?.title || 'Chi tiết báo cáo' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (router.isReady && id && user) {
            setLoading(true)
            fetchReportDetail(id)
        }
    }, [router.isReady, id, user])

    const fetchReportDetail = async (reportId) => {
        try {
            const response = await apiMethods.reports.getById(reportId)
            const reportData = response.data?.data || response.data

            if (reportData && reportData._id) {
                setReport(reportData)
                setComments(reportData.reviewerComments || [])

                fetchEvidences(reportId)
                fetchVersions(reportId)
            } else {
                toast.error('Không tìm thấy dữ liệu báo cáo')
                router.push('/reports')
            }
        } catch (error) {
            console.error('Fetch report detail error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải thông tin báo cáo')
            router.push('/reports')
        } finally {
            setLoading(false)
        }
    }

    const fetchEvidences = async (reportId) => {
        try {
            const response = await apiMethods.reports.getEvidences(reportId)
            const data = response.data?.data || response.data || []
            setEvidences(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Fetch evidences error:', error)
            setEvidences([])
        }
    }

    const fetchVersions = async (reportId) => {
        try {
            const response = await apiMethods.reports.getVersions(reportId)
            const data = response.data?.data || response.data || []
            setVersions(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Fetch versions error:', error)
            setVersions([])
        }
    }

    const handleDownloadHtml = async () => {
        if (!id) return toast.error('ID báo cáo không hợp lệ')

        try {
            setDownloadingHtml(true)
            const response = await apiMethods.reports.download(id, 'html')

            let blob
            if (response.data instanceof Blob) {
                blob = response.data
            } else if (response.data instanceof ArrayBuffer) {
                blob = new Blob([response.data], { type: 'text/html;charset=utf-8' })
            } else {
                blob = new Blob([response.data], { type: 'text/html;charset=utf-8' })
            }

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${report.code}.html`)
            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }, 100)

            toast.success('Tải xuống thành công - File HTML chứa các liên kết công khai')
        } catch (error) {
            console.error('Download error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải xuống')
        } finally {
            setDownloadingHtml(false)
        }
    }

    const handlePublish = async () => {
        if (!confirm('Bạn có chắc chắn muốn xuất bản báo cáo này?')) return
        if (!id) return toast.error('ID báo cáo không hợp lệ')

        try {
            await apiMethods.reports.publish(id)
            toast.success('Xuất bản báo cáo thành công')
            fetchReportDetail(id)
        } catch (error) {
            console.error('Publish error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xuất bản')
        }
    }

    const handleAddComment = async () => {
        if (!newComment.trim()) {
            toast.error('Vui lòng nhập nội dung nhận xét')
            return
        }
        if (!id) return toast.error('ID báo cáo không hợp lệ')

        try {
            setAddingComment(true)
            await apiMethods.reports.addComment(id, newComment.trim())
            toast.success('Thêm nhận xét thành công')
            setNewComment('')
            fetchReportDetail(id)
        } catch (error) {
            console.error('Add comment error:', error)
            toast.error('Lỗi khi thêm nhận xét')
        } finally {
            setAddingComment(false)
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800 border-gray-200',
            under_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            published: 'bg-green-100 text-green-800 border-green-200',
            archived: 'bg-blue-100 text-blue-800 border-blue-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            under_review: 'Đang xem xét',
            published: 'Đã xuất bản',
            archived: 'Lưu trữ'
        }
        return labels[status] || status
    }

    const getTypeLabel = (type) => {
        const labels = {
            criteria_analysis: 'Phân tích tiêu chí',
            standard_analysis: 'Phân tích tiêu chuẩn',
            comprehensive_report: 'Báo cáo tổng hợp'
        }
        return labels[type] || type
    }

    const getPublicLink = () => {
        if (!report?.code) return null
        return `${typeof window !== 'undefined' ? window.location.origin : ''}/public/reports/${report.code}`
    }

    if (isLoading || loading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex flex-col justify-center items-center py-20">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                </div>
            </Layout>
        )
    }

    if (!user || !report) {
        return null
    }

    const publicLink = getPublicLink()

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <button
                            onClick={() => router.push('/reports')}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Quay lại
                        </button>
                        <div className="flex gap-2">
                            {report.status === 'draft' && (
                                <button
                                    onClick={handlePublish}
                                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg font-medium transition-all"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Xuất bản
                                </button>
                            )}
                            <button
                                onClick={() => router.push(`/reports/${id}/edit`)}
                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                            </button>
                            <button
                                onClick={handleDownloadHtml}
                                disabled={downloadingHtml}
                                className="inline-flex items-center px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-all disabled:opacity-50"
                            >
                                {downloadingHtml ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang tải...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-2" />
                                        Tải HTML
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-mono font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                                        {report.code}
                                    </span>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(report.status)}`}>
                                        {getStatusLabel(report.status)}
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                        {getTypeLabel(report.type)}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    {report.title}
                                </h1>
                                {report.summary && (
                                    <p className="text-gray-600 text-lg">
                                        {report.summary}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Public Link Info - Hiển thị khi published */}
                        {report.status === 'published' && publicLink && (
                            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                                <p className="text-sm font-semibold text-green-900 mb-2">
                                    🔗 Liên kết công khai (có thể chia sẻ):
                                </p>
                                <p className="text-sm text-green-800 break-all font-mono">
                                    {publicLink}
                                </p>
                                <p className="text-xs text-green-700 mt-2">
                                    💡 Khi bạn tải file HTML về, nó sẽ chứa link này để người khác có thể xem báo cáo công khai.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Người tạo</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {report.createdBy?.fullName || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <Calendar className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Ngày tạo</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {formatDate(report.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Eye className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Lượt xem</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {report.metadata?.viewCount || 0}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <Download className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Lượt tải</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {report.metadata?.downloadCount || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {report.keywords && report.keywords.length > 0 && (
                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2">Từ khóa:</p>
                                <div className="flex flex-wrap gap-2">
                                    {report.keywords.map((keyword, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="border-b border-gray-200">
                        <div className="flex space-x-1 p-2">
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === 'content'
                                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <FileText className="h-4 w-4 inline mr-2" />
                                Nội dung
                            </button>
                            <button
                                onClick={() => setActiveTab('evidences')}
                                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === 'evidences'
                                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <LinkIcon className="h-4 w-4 inline mr-2" />
                                Minh chứng ({evidences.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('versions')}
                                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === 'versions'
                                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Clock className="h-4 w-4 inline mr-2" />
                                Phiên bản ({versions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('comments')}
                                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === 'comments'
                                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <MessageSquare className="h-4 w-4 inline mr-2" />
                                Nhận xét ({comments.length})
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === 'content' && (
                            <div className="prose max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: report.content }} />
                            </div>
                        )}

                        {activeTab === 'evidences' && (
                            <div className="space-y-4">
                                {evidences.length === 0 ? (
                                    <div className="text-center py-12">
                                        <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500">Chưa có minh chứng nào được liên kết</p>
                                    </div>
                                ) : (
                                    evidences.map((evidence, index) => (
                                        <div
                                            key={index}
                                            className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                            {evidence.evidenceId?.code || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                                        {evidence.evidenceId?.name || 'Tên minh chứng'}
                                                    </p>
                                                    {evidence.contextText && (
                                                        <p className="text-xs text-gray-500 italic">
                                                            Ngữ cảnh: {evidence.contextText}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'versions' && (
                            <div className="space-y-4">
                                {versions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500">Chưa có phiên bản nào</p>
                                    </div>
                                ) : (
                                    versions.map((version, index) => (
                                        <div
                                            key={index}
                                            className="p-4 border border-gray-200 rounded-xl"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        Phiên bản {version.version}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(version.changedAt)}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-600">
                                                    {version.changedBy?.fullName}
                                                </span>
                                            </div>
                                            {version.changeNote && (
                                                <p className="text-sm text-gray-600">
                                                    {version.changeNote}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Nhập nhận xét của bạn..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows="4"
                                    />
                                    <div className="flex justify-end mt-3">
                                        <button
                                            onClick={handleAddComment}
                                            disabled={addingComment || !newComment.trim()}
                                            className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all disabled:opacity-50"
                                        >
                                            {addingComment ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Đang thêm...
                                                </>
                                            ) : (
                                                'Thêm nhận xét'
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {comments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">Chưa có nhận xét nào</p>
                                        </div>
                                    ) : (
                                        comments.map((comment, index) => (
                                            <div
                                                key={index}
                                                className="p-4 border border-gray-200 rounded-xl"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                            {comment.reviewerId?.fullName?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {comment.reviewerId?.fullName || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatDate(comment.commentedAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                                                        {comment.reviewerType}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 ml-13">
                                                    {comment.comment}
                                                </p>
                                                {comment.section && (
                                                    <p className="text-xs text-gray-500 mt-2 ml-13">
                                                        Phần: {comment.section}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    )
}