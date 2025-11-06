import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    FileText,
    Download,
    Eye,
    X,
    FileImage,
    Calendar,
    User,
    Tag,
    Document
} from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export default function PublicEvidenceView() {
    const router = useRouter()
    const [evidence, setEvidence] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [viewingFile, setViewingFile] = useState(null)
    const [fileContent, setFileContent] = useState(null)
    const [fileLoading, setFileLoading] = useState(false)

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
            const response = await fetch(`${API_BASE_URL}/api/public/evidences/${code}`)
            const data = await response.json()

            if (data.success) {
                setEvidence(data.data)
            } else {
                setError(data.message || 'Không thể tải minh chứng')
            }
        } catch (err) {
            console.error('Fetch error:', err)
            setError('Lỗi khi tải minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const viewFile = async (file) => {
        setViewingFile(file)
        setFileLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/files/download/${file._id}`)
            if (!response.ok) throw new Error('Failed to load file')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)

            // Xác định loại file
            if (file.mimeType.startsWith('image/')) {
                setFileContent({ type: 'image', url, name: file.originalName })
            } else if (file.mimeType === 'application/pdf') {
                setFileContent({ type: 'pdf', url, name: file.originalName })
            } else if (file.mimeType.startsWith('text/')) {
                const text = await blob.text()
                setFileContent({ type: 'text', content: text, name: file.originalName })
            } else {
                setFileContent({ type: 'unknown', name: file.originalName })
            }
        } catch (err) {
            console.error('Error loading file:', err)
            setFileContent({ type: 'error', name: file.originalName })
        } finally {
            setFileLoading(false)
        }
    }

    const downloadFile = (file) => {
        const downloadUrl = `${API_BASE_URL}/api/files/download/${file._id}`
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = file.originalName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    const formatDate = (date) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getStatusColor = (status) => {
        const colors = {
            new: 'from-gray-400 to-gray-600',
            in_progress: 'from-blue-400 to-blue-600',
            completed: 'from-yellow-400 to-yellow-600',
            approved: 'from-green-400 to-green-600',
            rejected: 'from-red-400 to-red-600'
        }
        return colors[status] || 'from-gray-400 to-gray-600'
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

    const getFileIcon = (mimeType) => {
        if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5" />
        if (mimeType === 'application/pdf') return <FileText className="w-5 h-5" />
        return <Document className="w-5 h-5" />
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
                    <p className="text-white font-semibold">Đang tải minh chứng...</p>
                </div>
            </div>
        )
    }

    if (error || !evidence) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-700">
                    <div className="flex items-center justify-center w-14 h-14 bg-red-500 bg-opacity-20 rounded-full mx-auto mb-4">
                        <AlertCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white text-center mb-2">Lỗi</h1>
                    <p className="text-center text-slate-300 mb-6">{error || 'Không tìm thấy minh chứng'}</p>
                    <button
                        onClick={() => router.back()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold hover:from-blue-700 hover:to-blue-800"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Modal xem file */}
            {viewingFile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-700">
                            <div className="flex items-center gap-3">
                                {getFileIcon(viewingFile.mimeType)}
                                <span className="text-white font-semibold truncate">{viewingFile.originalName}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setViewingFile(null)
                                    setFileContent(null)
                                }}
                                className="p-2 hover:bg-slate-600 rounded-lg transition-all text-slate-300 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-auto bg-slate-900" style={{ height: 'calc(90vh - 60px)' }}>
                            {fileLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                                </div>
                            ) : fileContent ? (
                                <>
                                    {fileContent.type === 'image' && (
                                        <div className="h-full flex items-center justify-center p-4">
                                            <img
                                                src={fileContent.url}
                                                alt={fileContent.name}
                                                className="max-h-full max-w-full rounded-lg"
                                            />
                                        </div>
                                    )}
                                    {fileContent.type === 'pdf' && (
                                        <iframe
                                            src={fileContent.url}
                                            className="w-full h-full"
                                            title="PDF Viewer"
                                        />
                                    )}
                                    {fileContent.type === 'text' && (
                                        <pre className="p-6 text-slate-300 font-mono text-sm overflow-auto whitespace-pre-wrap break-words">
                                            {fileContent.content}
                                        </pre>
                                    )}
                                    {fileContent.type === 'unknown' && (
                                        <div className="h-full flex items-center justify-center flex-col gap-4">
                                            <Document className="w-16 h-16 text-slate-500" />
                                            <p className="text-slate-400">Loại file này không hỗ trợ xem trực tiếp</p>
                                            <button
                                                onClick={() => downloadFile(viewingFile)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                Tải xuống
                                            </button>
                                        </div>
                                    )}
                                    {fileContent.type === 'error' && (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-red-400">Lỗi khi tải file</p>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="min-h-screen">
                <button
                    onClick={() => router.back()}
                    className="fixed top-6 left-6 z-40 inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold px-4 py-2 hover:bg-slate-700 rounded-lg transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Quay lại
                </button>

                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 pt-24 pb-12 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm border border-white border-opacity-20">
                                <FileText className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                    <span className="text-sm font-mono font-bold bg-white bg-opacity-20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white border-opacity-30">
                                        {evidence.code}
                                    </span>
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${getStatusColor(evidence.status)} text-white`}>
                                        {getStatusLabel(evidence.status)}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-bold text-white mb-2">{evidence.name}</h1>
                                {evidence.description && (
                                    <p className="text-blue-100 text-lg">{evidence.description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 py-12">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                        {evidence.createdBy && (
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-600 transition-all">
                                <p className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Người tạo
                                </p>
                                <p className="text-lg font-bold text-white">{evidence.createdBy.fullName}</p>
                                <p className="text-sm text-slate-400 mt-1">{evidence.createdBy.email}</p>
                            </div>
                        )}

                        {evidence.createdAt && (
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-600 transition-all">
                                <p className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Ngày tạo
                                </p>
                                <p className="text-lg font-bold text-white">{formatDate(evidence.createdAt)}</p>
                            </div>
                        )}

                        {evidence.standardId && (
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-600 transition-all">
                                <p className="text-sm font-semibold text-slate-400 mb-2">Tiêu chuẩn</p>
                                <p className="text-lg font-bold text-white">{evidence.standardId.code}</p>
                                <p className="text-sm text-slate-400 mt-1">{evidence.standardId.name}</p>
                            </div>
                        )}

                        {evidence.criteriaId && (
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-600 transition-all">
                                <p className="text-sm font-semibold text-slate-400 mb-2">Tiêu chí</p>
                                <p className="text-lg font-bold text-white">{evidence.criteriaId.code}</p>
                                <p className="text-sm text-slate-400 mt-1">{evidence.criteriaId.name}</p>
                            </div>
                        )}
                    </div>

                    {/* Files Section */}
                    {evidence.attachments && evidence.attachments.length > 0 && (
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <FileText className="w-7 h-7" />
                                    Tệp đính kèm
                                    <span className="ml-auto bg-white bg-opacity-20 px-3 py-1 rounded-full text-lg">
                                        {evidence.attachments.length}
                                    </span>
                                </h2>
                            </div>

                            <div className="divide-y divide-slate-700">
                                {evidence.attachments.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className="p-6 hover:bg-slate-700 transition-all group"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="p-3 bg-blue-600 bg-opacity-20 rounded-lg text-blue-400 group-hover:text-blue-300">
                                                    {getFileIcon(file.mimeType)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-white group-hover:text-blue-400 truncate text-lg">
                                                        {file.originalName}
                                                    </p>
                                                    <p className="text-sm text-slate-400 mt-1">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB • {formatDate(file.uploadedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => viewFile(file)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-blue-600/50"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Xem
                                                </button>
                                                <button
                                                    onClick={() => downloadFile(file)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg font-semibold transition-all"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Tải
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {evidence.tags && evidence.tags.length > 0 && (
                        <div className="mt-12">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Tag className="w-5 h-5" />
                                Nhãn
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {evidence.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-4 py-2 bg-blue-600 bg-opacity-20 text-blue-300 border border-blue-600 border-opacity-50 rounded-full text-sm font-semibold hover:border-blue-500 transition-all"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {evidence.notes && (
                        <div className="mt-12">
                            <h2 className="text-2xl font-bold text-white mb-4">Ghi chú</h2>
                            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-lg">
                                    {evidence.notes}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-20 py-8 border-t border-slate-700">
                    <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
                        <p>© {new Date().getFullYear()} - Hệ thống quản lý minh chứng</p>
                    </div>
                </div>
            </div>
        </div>
    )
}