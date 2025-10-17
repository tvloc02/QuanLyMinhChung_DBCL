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

export default function PublicEvidenceView() {
    const router = useRouter()
    const [evidence, setEvidence] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!router.isReady) return

        const { code } = router.query
        const codeValue = Array.isArray(code) ? code[0] : code

        if (codeValue && typeof codeValue === 'string' && codeValue.trim() !== '') {
            fetchEvidence(codeValue)
        }
    }, [router.isReady, router.query])

    const fetchEvidence = async (code) => {
        try {
            setLoading(true)
            setError(null)

            console.log('Fetching evidence with code:', code)
            console.log('API URL:', `${API_BASE_URL}/public/evidences/${code}`)

            // ✅ FIX: Gọi đúng endpoint /public/evidences (không phải /public/reports)
            const response = await axios.get(`${API_BASE_URL}/public/evidences/${code}`)

            if (response.data.success) {
                setEvidence(response.data.data)
            } else {
                setError(response.data.message || 'Không thể tải minh chứng')
            }
        } catch (err) {
            console.error('Fetch evidence error:', err)
            console.error('Error response:', err.response?.status, err.response?.data)

            // Thông báo lỗi chi tiết
            if (err.response?.status === 404) {
                setError('Minh chứng không tồn tại hoặc chưa được xuất bản')
            } else if (err.response?.data?.message) {
                setError(err.response.data.message)
            } else {
                setError('Lỗi khi tải minh chứng: ' + (err.message || 'Không xác định'))
            }
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

    const getStatusLabel = (status) => {
        const labels = {
            new: 'Mới',
            in_progress: 'Đang thực hiện',
            completed: 'Hoàn thành',
            approved: 'Đã duyệt',
            rejected: 'Từ chối'
        }
        return labels[status] || status
    }

    const getStatusColor = (status) => {
        const colors = {
            new: 'bg-gray-100 text-gray-800 border-gray-200',
            in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
            completed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Đang tải minh chứng...</p>
                </div>
            </div>
        )
    }

    if (error || !evidence) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Lỗi</h1>
                    <p className="text-center text-gray-600 mb-6">{error || 'Không tìm thấy minh chứng'}</p>
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
                                        {evidence.code}
                                    </span>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded border ${getStatusColor(evidence.status)}`}>
                                        {getStatusLabel(evidence.status)}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-bold mb-2">{evidence.name}</h1>
                                {evidence.description && (
                                    <p className="text-blue-100">{evidence.description}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {evidence.createdBy && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Người tạo</p>
                                    <p className="text-lg font-bold text-gray-900">{evidence.createdBy.fullName}</p>
                                    <p className="text-sm text-gray-600 mt-1">{evidence.createdBy.email}</p>
                                </div>
                            )}

                            {evidence.createdAt && (
                                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Ngày tạo</p>
                                    <p className="text-lg font-bold text-gray-900">{formatDate(evidence.createdAt)}</p>
                                </div>
                            )}

                            {evidence.standardId && (
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Tiêu chuẩn</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {evidence.standardId.code} - {evidence.standardId.name}
                                    </p>
                                </div>
                            )}

                            {evidence.criteriaId && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                                    <p className="text-sm font-semibold text-gray-600 mb-2">Tiêu chí</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {evidence.criteriaId.code} - {evidence.criteriaId.name}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Document Info */}
                        {(evidence.documentNumber || evidence.issueDate) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                {evidence.documentNumber && (
                                    <div>
                                        <p className="text-sm text-gray-600">Số hiệu</p>
                                        <p className="text-lg font-bold text-gray-900">{evidence.documentNumber}</p>
                                    </div>
                                )}
                                {evidence.issueDate && (
                                    <div>
                                        <p className="text-sm text-gray-600">Ngày cấp</p>
                                        <p className="text-lg font-bold text-gray-900">{formatDate(evidence.issueDate)}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Files */}
                        {evidence.files && evidence.files.length > 0 && (
                            <div className="border-t pt-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                    Tệp đính kèm ({evidence.files.length})
                                </h2>
                                <div className="space-y-3">
                                    {evidence.files.map((file, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <FileText className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                                                <div>
                                                    <p className="font-medium text-gray-900 group-hover:text-blue-600">
                                                        {file.originalName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB • {formatDate(file.uploadedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    // ✅ FIX: Gọi download API đúng cách
                                                    const downloadUrl = `${API_BASE_URL}/files/${file._id}/download`
                                                    window.open(downloadUrl, '_blank')
                                                }}
                                                className="ml-3 inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-all"
                                            >
                                                <Download className="w-4 h-4" />
                                                Tải xuống
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {evidence.tags && evidence.tags.length > 0 && (
                            <div className="border-t pt-8">
                                <h3 className="font-semibold text-gray-900 mb-3">Nhãn</h3>
                                <div className="flex flex-wrap gap-2">
                                    {evidence.tags.map((tag, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {evidence.notes && (
                            <div className="border-t pt-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ghi chú</h2>
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <p className="text-gray-700 whitespace-pre-wrap">{evidence.notes}</p>
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