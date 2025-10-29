import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import { formatDate, formatFileSize } from '../../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../../services/api'
import {
    FileText,
    Upload,
    Download,
    Trash2,
    RefreshCw,
    File,
    FileImage,
    FileSpreadsheet,
    Presentation,
    Loader2,
    ArrowLeft,
    Check,
    X,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react'

export default function FilesPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { evidenceId } = router.query

    const [loading, setLoading] = useState(true)
    const [evidence, setEvidence] = useState(null)
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [rejectionModal, setRejectionModal] = useState({ show: false, fileId: null })
    const [rejectionReason, setRejectionReason] = useState('')

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && evidenceId) {
            fetchData()
        }
    }, [user, evidenceId])

    const breadcrumbItems = [
        { name: 'Quản lý minh chứng', href: '/evidence-management', icon: FileText },
        { name: 'Files đính kèm', icon: File }
    ]

    const fetchData = async () => {
        try {
            setLoading(true)

            const response = await apiMethods.evidences.getById(evidenceId)
            const data = response.data?.data || response.data

            setEvidence(data)
            setFiles(data?.files || [])
        } catch (error) {
            console.error('Fetch data error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files)
        if (selectedFiles.length > 0) {
            handleUpload(selectedFiles)
        }
        e.target.value = ''
    }

    const handleUpload = async (filesToUpload) => {
        if (filesToUpload.length > 10) {
            toast.error('Chỉ được upload tối đa 10 files mỗi lần')
            return
        }

        const maxSize = 50 * 1024 * 1024
        const oversizedFiles = filesToUpload.filter(file => file.size > maxSize)
        if (oversizedFiles.length > 0) {
            toast.error(`File "${oversizedFiles[0].name}" vượt quá 50MB`)
            return
        }

        setUploading(true)
        try {
            await apiMethods.files.upload(evidenceId, filesToUpload)
            toast.success('Upload files thành công')
            fetchData()
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Lỗi khi upload files')
        } finally {
            setUploading(false)
        }
    }

    const handleDownload = async (fileId, fileName) => {
        try {
            const response = await apiMethods.files.download(fileId)

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('Tải file thành công')
        } catch (error) {
            console.error('Download error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải file')
        }
    }

    const handleDelete = async (fileId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa file này?')) {
            return
        }

        try {
            const response = await apiMethods.files.delete(fileId)

            if (response.data?.success) {
                toast.success(response.data.message || 'Xóa file thành công')
                fetchData()
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xóa file')
        }
    }

    const handleApprove = async (fileId) => {
        try {
            await apiMethods.files.approve(fileId, { status: 'approved' })
            toast.success('Duyệt file thành công')
            fetchData()
        } catch (error) {
            console.error('Approve error:', error)
            toast.error('Lỗi khi duyệt file')
        }
    }

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        try {
            await apiMethods.files.approve(rejectionModal.fileId, {
                status: 'rejected',
                rejectionReason: rejectionReason.trim()
            })
            toast.success('Từ chối file thành công')
            setRejectionModal({ show: false, fileId: null })
            setRejectionReason('')
            fetchData()
        } catch (error) {
            console.error('Reject error:', error)
            toast.error('Lỗi khi từ chối file')
        }
    }

    const getFileIcon = (mimeType) => {
        if (mimeType?.startsWith('image/')) {
            return <FileImage className="h-8 w-8 text-blue-500" />
        } else if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
            return <FileSpreadsheet className="h-8 w-8 text-green-500" />
        } else if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
            return <Presentation className="h-8 w-8 text-orange-500" />
        } else if (mimeType?.includes('pdf')) {
            return <FileText className="h-8 w-8 text-red-500" />
        }
        return <File className="h-8 w-8 text-gray-500" />
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />
            case 'rejected':
                return <XCircle className="h-5 w-5 text-red-500" />
            case 'pending':
            default:
                return <Clock className="h-5 w-5 text-yellow-500" />
        }
    }

    const getStatusLabel = (status) => {
        const labels = {
            'pending': 'Chờ duyệt',
            'approved': 'Đã duyệt',
            'rejected': 'Từ chối'
        }
        return labels[status] || 'Chờ duyệt'
    }

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'approved': 'bg-green-100 text-green-700 border-green-300',
            'rejected': 'bg-red-100 text-red-700 border-red-300'
        }
        return colors[status] || colors['pending']
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (!evidenceId) {
        return (
            <Layout title="Files minh chứng" breadcrumbItems={breadcrumbItems}>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                    <p className="text-yellow-800 font-medium">Vui lòng chọn minh chứng để quản lý files</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <File className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Quản lý files minh chứng</h1>
                                {evidence && (
                                    <p className="text-indigo-100">
                                        <span className="font-semibold">{evidence.code}</span> - {evidence.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => router.push('/evidence-management')}
                                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all font-medium"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Quay lại
                            </button>

                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 disabled:opacity-50 transition-all font-medium"
                            >
                                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>

                            <label className={`inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} transition-all font-medium shadow-lg`}>
                                <Upload className="h-5 w-5 mr-2" />
                                {uploading ? 'Đang upload...' : 'Upload files'}
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileSelect}
                                    disabled={uploading}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl shadow-sm border-2 border-indigo-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-indigo-700 mb-1">Tổng files</p>
                                        <p className="text-4xl font-bold text-indigo-900">{files.length}</p>
                                    </div>
                                    <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <File className="h-8 w-8 text-indigo-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl shadow-sm border-2 border-yellow-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-yellow-700 mb-1">Chờ duyệt</p>
                                        <p className="text-4xl font-bold text-yellow-900">
                                            {files.filter(f => f.approvalStatus === 'pending').length}
                                        </p>
                                    </div>
                                    <div className="w-16 h-16 bg-yellow-100 rounded-xl flex items-center justify-center">
                                        <Clock className="h-8 w-8 text-yellow-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-sm border-2 border-green-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-700 mb-1">Đã duyệt</p>
                                        <p className="text-4xl font-bold text-green-900">
                                            {files.filter(f => f.approvalStatus === 'approved').length}
                                        </p>
                                    </div>
                                    <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl shadow-sm border-2 border-red-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-red-700 mb-1">Từ chối</p>
                                        <p className="text-4xl font-bold text-red-900">
                                            {files.filter(f => f.approvalStatus === 'rejected').length}
                                        </p>
                                    </div>
                                    <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
                                        <XCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Files List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <File className="h-5 w-5 mr-2 text-indigo-600" />
                                    Danh sách files ({files.length})
                                </h3>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {files.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <File className="h-10 w-10 text-indigo-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có file nào được upload</h3>
                                        <p className="text-gray-500 mb-6">Bắt đầu bằng cách upload file đầu tiên</p>
                                        <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg cursor-pointer transition-all font-medium">
                                            <Upload className="h-5 w-5 mr-2" />
                                            Upload file đầu tiên
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    files.map((file) => (
                                        <div key={file._id} className="p-6 hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 flex-1">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        {getFileIcon(file.mimeType)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-semibold text-gray-900 truncate mb-2">
                                                            {file.originalName || file.filename}
                                                        </h4>
                                                        <div className="flex items-center flex-wrap gap-3">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(file.approvalStatus)}`}>
                                                                {getStatusIcon(file.approvalStatus)}
                                                                <span className="ml-1">{getStatusLabel(file.approvalStatus)}</span>
                                                            </span>
                                                            <span className="text-xs text-gray-500 px-2 py-1 bg-blue-50 rounded font-medium">
                                                                {formatFileSize(file.size)}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {file.uploadedBy?.fullName || 'N/A'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(file.uploadedAt || file.createdAt)}
                                                            </span>
                                                        </div>
                                                        {file.rejectionReason && (
                                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                                <p className="text-xs text-red-700 flex items-center">
                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                    <span className="font-medium">Lý do từ chối:</span>
                                                                    <span className="ml-1">{file.rejectionReason}</span>
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 ml-4">
                                                    {user.role === 'admin' && file.approvalStatus === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(file._id)}
                                                                className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                                                title="Duyệt"
                                                            >
                                                                <Check className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectionModal({ show: true, fileId: file._id })}
                                                                className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                                title="Từ chối"
                                                            >
                                                                <X className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDownload(file._id, file.originalName || file.filename)}
                                                        className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(file._id)}
                                                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Upload Guidelines */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center">
                                <AlertCircle className="h-5 w-5 mr-2" />
                                Hướng dẫn upload files
                            </h4>
                            <ul className="text-sm text-indigo-800 space-y-2">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Các định dạng hỗ trợ: PDF, Word, Excel, PowerPoint, Text, Image (JPG, PNG, GIF)</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Kích thước tối đa mỗi file: 50MB</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Số lượng file tối đa trong mỗi lần upload: 10 files</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>File sẽ ở trạng thái "Chờ duyệt" sau khi upload, chờ Admin duyệt</span>
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectionModal.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Từ chối file</h3>
                        <p className="text-sm text-gray-600 mb-4">Vui lòng nhập lý do từ chối file này:</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Nhập lý do từ chối..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setRejectionModal({ show: false, fileId: null })
                                    setRejectionReason('')
                                }}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
                            >
                                Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}