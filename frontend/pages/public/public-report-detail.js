import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
    Download,
    Eye,
    FileText,
    Calendar,
    User,
    MessageSquare,
    Loader2,
    Link as LinkIcon,
    Clock,
    ExternalLink,
    Home,
    AlertCircle
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'

/**
 * Trang chi tiết báo cáo công khai
 * URL: /public/reports/[id]
 * Không yêu cầu đăng nhập
 * Các mã minh chứng trong báo cáo được hiển thị dưới dạng link
 */
export default function PublicReportDetail() {
    const router = useRouter()
    const { id } = router.query

    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('content')
    const [evidences, setEvidences] = useState([])
    const [versions, setVersions] = useState([])
    const [comments, setComments] = useState([])
    const [processedContent, setProcessedContent] = useState('')

    // Fetch báo cáo công khai
    const fetchPublicReport = async (reportId) => {
        try {
            setLoading(true)
            // Gọi API công khai (không cần auth)
            const response = await fetch(`/api/public/reports/${reportId}`)

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error('Báo cáo không tồn tại')
                    router.push('/')
                    return
                }
                throw new Error('Lỗi khi tải báo cáo')
            }

            const data = await response.json()
            const reportData = data.data || data

            if (reportData && reportData._id) {
                setReport(reportData)
                setComments(reportData.reviewerComments || [])

                // Xử lý nội dung - thay thế mã minh chứng thành link
                const processedHtml = processEvidenceLinks(reportData.content)
                setProcessedContent(processedHtml)

                // Fetch linked evidences
                fetchPublicEvidences(reportId)
                fetchPublicVersions(reportId)
            }
        } catch (error) {
            console.error('Fetch report error:', error)
            toast.error('Lỗi khi tải thông tin báo cáo')
        } finally {
            setLoading(false)
        }
    }

    // Xử lý nội dung - thay thế mã minh chứng thành link
    const processEvidenceLinks = (content) => {
        if (!content) return ''

        // Regex để tìm mã minh chứng (VD: A1.01.02.04)
        const evidenceCodePattern = /\b([A-Y]\d+\.\d{2}\.\d{2}\.\d{2})\b/g

        return content.replace(evidenceCodePattern, (match) => {
            return `<a href="/public/evidences/${match}" class="evidence-link" data-code="${match}" target="_blank" rel="noopener noreferrer">
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-mono font-semibold hover:bg-blue-200 transition-colors">
                    ${match}
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                </span>
            </a>`
        })
    }

    // Fetch linked evidences
    const fetchPublicEvidences = async (reportId) => {
        try {
            const response = await fetch(`/api/public/reports/${reportId}/evidences`)
            if (response.ok) {
                const data = await response.json()
                setEvidences(Array.isArray(data.data) ? data.data : [])
            }
        } catch (error) {
            console.error('Fetch evidences error:', error)
        }
    }

    // Fetch versions
    const fetchPublicVersions = async (reportId) => {
        try {
            const response = await fetch(`/api/public/reports/${reportId}/versions`)
            if (response.ok) {
                const data = await response.json()
                setVersions(Array.isArray(data.data) ? data.data : [])
            }
        } catch (error) {
            console.error('Fetch versions error:', error)
        }
    }

    // Handle download
    const handleDownload = async (format = 'html') => {
        if (!id) return toast.error('ID báo cáo không hợp lệ')
        if (!report?.code) return toast.error('Mã báo cáo không hợp lệ')

        try {
            const response = await fetch(`/api/public/reports/${id}/download?format=${format}`)

            if (!response.ok) {
                throw new Error('Lỗi khi tải báo cáo')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${report.code}.${format}`)
            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }, 100)

            toast.success('Tải xuống thành công')
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Lỗi khi tải xuống')
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800 border-gray-200',
            published: 'bg-green-100 text-green-800 border-green-200',
            archived: 'bg-blue-100 text-blue-800 border-blue-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
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

    useEffect(() => {
        if (router.isReady && id) {
            fetchPublicReport(id)
        }
    }, [router.isReady, id])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (!report) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/frontend/pages/public">
                        <a className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6">
                            <Home className="h-5 w-5 mr-2" />
                            Quay lại trang chủ
                        </a>
                    </Link>
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Báo cáo không tồn tại</h1>
                        <p className="text-gray-600">Báo cáo bạn đang tìm kiếm không có sẵn hoặc đã bị xóa.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/frontend/pages/public">
                        <a className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                            <Home className="h-5 w-5" />
                            <span>Trang chủ</span>
                        </a>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Báo cáo</h1>
                    <div className="w-24"></div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
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

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
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

                        {/* Keywords */}
                        {report.keywords && report.keywords.length > 0 && (
                            <div className="pt-6 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-3">Từ khóa:</p>
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

                        {/* Download Button */}
                        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => handleDownload('html')}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Tải xuống HTML
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
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
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Content Tab */}
                            {activeTab === 'content' && (
                                <div className="prose max-w-none">
                                    <div
                                        className="content-area"
                                        dangerouslySetInnerHTML={{ __html: processedContent }}
                                    />
                                </div>
                            )}

                            {/* Evidences Tab */}
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
                                                    <a
                                                        href={`/public/evidences/${evidence.evidenceId?.code}`}
                                                        className="ml-3 inline-flex items-center px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-all"
                                                    >
                                                        Xem chi tiết
                                                        <ExternalLink className="h-4 w-4 ml-1" />
                                                    </a>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Versions Tab */}
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
                                                            Phiên bản {index + 1}
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
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}