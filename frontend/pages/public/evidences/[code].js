import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    FileText,
    Download,
    ExternalLink,
    Eye,
    Clock
} from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PublicReportView() {
    const router = useRouter()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        if (!router.isReady) return

        const { code } = router.query
        const codeValue = Array.isArray(code) ? code[0] : code

        if (codeValue && typeof codeValue === 'string' && codeValue.trim() !== '') {
            fetchReport(codeValue)
        }
    }, [router.isReady, router.query])

    const fetchReport = async (code) => {
        try {
            setLoading(true)
            setError(null)

            const response = await axios.get(`${API_BASE_URL}/public/reports/${code}`)

            if (response.data.success) {
                setReport(response.data.data)
            } else {
                setError(response.data.message || 'Không thể tải báo cáo')
            }
        } catch (err) {
            console.error('Fetch report error:', err)
            setError(err.response?.data?.message || 'Lỗi khi tải báo cáo')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getTypeLabel = (type) => {
        const labels = {
            criteria_analysis: 'Phân tích tiêu chí',
            standard_analysis: 'Phân tích tiêu chuẩn',
            comprehensive_report: 'Báo cáo tổng hợp'
        }
        return labels[type] || type
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Đang tải báo cáo...</p>
                </div>
            </div>
        )
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Lỗi</h1>
                    <p className="text-center text-gray-600 mb-6">{error || 'Không tìm thấy báo cáo'}</p>
                    <button
                        onClick={() => router.back()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 px-4 py-2 hover:bg-blue-50 rounded-lg transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Quay lại
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-sm font-mono font-semibold bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                                        {report.code}
                                    </span>
                                    <span className="text-xs font-semibold bg-white bg-opacity-20 px-2 py-1 rounded">
                                        {getTypeLabel(report.type)}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-bold mb-2">{report.title}</h1>
                                {report.summary && (
                                    <p className="text-blue-100">{report.summary}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {report.createdBy && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Người tạo</p>
                                    <p className="text-lg font-bold text-gray-900">{report.createdBy.fullName}</p>
                                    <p className="text-sm text-gray-600 mt-1">{report.createdBy.email}</p>
                                </div>
                            )}

                            {report.createdAt && (
                                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Ngày tạo</p>
                                    <p className="text-lg font-bold text-gray-900">{formatDate(report.createdAt)}</p>
                                </div>
                            )}

                            {report.standardId && (
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Tiêu chuẩn</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {report.standardId.code} - {report.standardId.name}
                                    </p>
                                </div>
                            )}

                            {report.criteriaId && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Tiêu chí</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {report.criteriaId.code} - {report.criteriaId.name}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        {report.metadata && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="text-center">
                                    <Eye className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Lượt xem</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {report.metadata.viewCount || 0}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <Download className="w-5 h-5 text-green-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Lượt tải</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {report.metadata.downloadCount || 0}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <Clock className="w-5 h-5 text-orange-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Cập nhật</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {formatDate(report.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Keywords */}
                        {report.keywords && report.keywords.length > 0 && (
                            <div className="border-t pt-8">
                                <h3 className="font-semibold text-gray-900 mb-3">Từ khóa</h3>
                                <div className="flex flex-wrap gap-2">
                                    {report.keywords.map((keyword, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        {report.content && (
                            <div className="border-t pt-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Nội dung</h2>
                                <div className="prose max-w-none bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div dangerouslySetInnerHTML={{ __html: report.content }} />
                                </div>
                            </div>
                        )}

                        {/* Linked Evidences */}
                        {report.linkedEvidences && report.linkedEvidences.length > 0 && (
                            <div className="border-t pt-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Minh chứng liên quan</h2>
                                <div className="space-y-3">
                                    {report.linkedEvidences.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={`/public/evidences/${link.evidenceId.code}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <FileText className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                                                <div>
                                                    <p className="font-medium text-gray-900 group-hover:text-blue-600">
                                                        {link.evidenceId.code} - {link.evidenceId.name}
                                                    </p>
                                                    {link.contextText && (
                                                        <p className="text-sm text-gray-500">
                                                            Ngữ cảnh: {link.contextText}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-gray-600">
                    <p>© {new Date().getFullYear()} - Hệ thống quản lý minh chứng</p>
                </div>
            </div>
        </div>
    )
}