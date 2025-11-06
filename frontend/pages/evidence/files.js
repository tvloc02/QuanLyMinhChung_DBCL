import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { formatDate, formatFileSize } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
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
    Sparkles,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Square,
    CheckSquare,
    X,
    Eye
} from 'lucide-react'

export default function FilesPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { evidenceId } = router.query

    const [loading, setLoading] = useState(true)
    const [evidence, setEvidence] = useState(null)
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [showApprovalModal, setShowApprovalModal] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [approvalAction, setApprovalAction] = useState('approve')
    const [rejectionReason, setRejectionReason] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [selectedItems, setSelectedItems] = useState([])

    // ⭐️ STATE CHO PREVIEW
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [previewFile, setPreviewFile] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)

    const isAdmin = user?.role === 'admin'

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
        { name: 'Quản lý minh chứng', href: '/evidence-management', icon: ArrowLeft },
        { name: 'Files đính kèm', icon: File }
    ]

    const fetchData = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.evidences.getById(evidenceId)
            const data = response.data?.data || response.data

            setEvidence(data)
            setFiles(data?.files || [])
            setSelectedItems([])
        } catch (error) {
            console.error('Fetch data error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    // ⭐️ HÀM PREVIEW
    const handlePreviewClick = (file) => {
        setPreviewFile(file)
        setShowPreviewModal(true)
    }

    // ⭐️ HÀM GENERATE PREVIEW URL
    const getPreviewUrl = (file) => {
        if (!file) return null

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
        const streamUrl = `${baseUrl}/api/files/stream/${file._id}`

        if (file.mimeType?.startsWith('image/')) {
            return streamUrl
        }

        if (file.mimeType === 'application/pdf') {
            return `https://docs.google.com/gview?url=${encodeURIComponent(streamUrl)}&embedded=true`
        }

        if (file.mimeType?.includes('word') ||
            file.mimeType?.includes('wordprocessingml') ||
            file.mimeType?.includes('spreadsheet') ||
            file.mimeType?.includes('spreadsheetml')) {
            return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(streamUrl)}`
        }

        return null
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
        let successCount = 0
        let failCount = 0

        for (const file of filesToUpload) {
            try {
                const response = await apiMethods.files.upload(file, evidenceId)
                if (response.data?.success) {
                    successCount++
                } else {
                    failCount++
                }
            } catch (error) {
                console.error('Upload error:', error)
                failCount++
            }
        }

        setUploading(false)

        if (successCount > 0 && failCount === 0) {
            toast.success(`Upload thành công ${successCount} file`)
        } else if (successCount > 0 && failCount > 0) {
            toast.success(`Upload thành công ${successCount} file, thất bại ${failCount} file`)
        } else {
            toast.error('Upload thất bại')
        }

        fetchData()
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

    const handleApproveClick = (file, action) => {
        if (!isAdmin) {
            toast.error('Bạn không có quyền duyệt file.')
            return
        }
        setSelectedFile(file)
        setApprovalAction(action)
        setRejectionReason('')
        setShowApprovalModal(true)
    }

    const handleBulkApproveClick = (action) => {
        if (!isAdmin) {
            toast.error('Bạn không có quyền thực hiện hành động này.')
            return
        }

        const filesToApprove = files.filter(f => selectedItems.includes(f._id) && f.approvalStatus === 'pending')
        if (filesToApprove.length === 0) {
            toast.error('Không có file chờ duyệt nào được chọn.')
            return
        }

        handleApproveClick(filesToApprove[0], action)
    }

    const handleApprovalSubmit = async () => {
        if (approvalAction === 'reject' && !rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        if (!selectedFile) {
            toast.error("Không tìm thấy file để xử lý.")
            return
        }

        try {
            setSubmitting(true)

            await apiMethods.files.approve(selectedFile._id, {
                status: approvalAction === 'approve' ? 'approved' : 'rejected',
                rejectionReason: approvalAction === 'reject' ? rejectionReason : undefined
            })

            toast.success(
                approvalAction === 'approve'
                    ? 'Duyệt file thành công'
                    : 'Từ chối file thành công'
            )
            setShowApprovalModal(false)
            setSelectedFile(null)
            fetchData()
        } catch (error) {
            console.error('Approval error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xử lý file')
        } finally {
            setSubmitting(false)
        }
    }

    const toggleSelectItem = (fileId) => {
        setSelectedItems(prev =>
            prev.includes(fileId) ? prev.filter(item => item !== fileId) : [...prev, fileId]
        )
    }

    const toggleSelectAll = () => {
        if (selectedItems.length === files.length) {
            setSelectedItems([])
        } else {
            setSelectedItems(files.map(f => f._id))
        }
    }

    // ⭐️ HÀM DECODE FILENAME
    const getSafeFileName = (fileName) => {
        if (!fileName) return 'Tên file không xác định'
        try {
            return decodeURIComponent(fileName)
        } catch (e) {
            return fileName
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

    const getApprovalStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Đã duyệt
                    </span>
                )
            case 'rejected':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Từ chối
                    </span>
                )
            case 'pending':
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Chờ duyệt
                    </span>
                )
        }
    }

    const pendingFilesCount = files.filter(f => f.approvalStatus === 'pending').length
    const approvedFilesCount = files.filter(f => f.approvalStatus === 'approved').length
    const rejectedFilesCount = files.filter(f => f.approvalStatus === 'rejected').length
    const pendingSelectedCount = files.filter(f => selectedItems.includes(f._id) && f.approvalStatus === 'pending').length

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

                {/* Bulk Actions */}
                {isAdmin && selectedItems.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200 rounded-xl p-4 shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-900 font-semibold">
                                Đã chọn <strong className="text-lg text-blue-600">{selectedItems.length}</strong> files
                            </span>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setSelectedItems([])}
                                    className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 text-sm rounded-xl hover:bg-gray-50 border-2 border-gray-300 font-semibold transition-all shadow-md"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Hủy chọn
                                </button>
                                <button
                                    onClick={() => handleBulkApproveClick('approve')}
                                    disabled={pendingSelectedCount === 0}
                                    className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 font-semibold transition-all shadow-md disabled:opacity-50"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Duyệt ({pendingSelectedCount})
                                </button>
                                <button
                                    onClick={() => handleBulkApproveClick('reject')}
                                    disabled={pendingSelectedCount === 0}
                                    className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 font-semibold transition-all shadow-md disabled:opacity-50"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Từ chối ({pendingSelectedCount})
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                    <File className="h-8 w-8 text-indigo-600" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl shadow-sm border-2 border-yellow-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-yellow-700 mb-1">Chờ duyệt</p>
                                        <p className="text-4xl font-bold text-yellow-900">{pendingFilesCount}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-yellow-600" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-sm border-2 border-green-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-700 mb-1">Đã duyệt</p>
                                        <p className="text-4xl font-bold text-green-900">{approvedFilesCount}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl shadow-sm border-2 border-red-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-red-700 mb-1">Từ chối</p>
                                        <p className="text-4xl font-bold text-red-900">{rejectedFilesCount}</p>
                                    </div>
                                    <XCircle className="h-8 w-8 text-red-600" />
                                </div>
                            </div>
                        </div>

                        {/* Files List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Sparkles className="h-5 w-5 mr-2 text-indigo-600" />
                                    Danh sách files ({files.length})
                                </h3>
                            </div>

                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    {isAdmin && (
                                        <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase w-12">
                                            <button onClick={toggleSelectAll}>
                                                {selectedItems.length === files.length && files.length > 0 ? (
                                                    <CheckSquare className="h-5 w-5 text-indigo-600" />
                                                ) : (
                                                    <Square className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </th>
                                    )}
                                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase w-12">STT</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase min-w-[300px]">Tên file</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase w-20">Kích thước</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase w-32">Người Upload</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase w-28">Trạng thái</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase w-60">Hành động</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {files.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdmin ? 7 : 6} className="p-16 text-center text-gray-500">
                                            Chưa có file nào được upload.
                                        </td>
                                    </tr>
                                ) : (
                                    files.map((file, index) => (
                                        <tr key={file._id} className="hover:bg-gray-50 transition-colors">
                                            {isAdmin && (
                                                <td className="px-3 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(file._id)}
                                                        onChange={() => toggleSelectItem(file._id)}
                                                        className="w-4 h-4 text-indigo-600 rounded"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-2 py-4 text-center text-sm text-gray-600">{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    {getFileIcon(file.mimeType)}
                                                    <div className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                                                        {getSafeFileName(file.originalName)}
                                                        <div className="text-xs text-gray-500 font-normal mt-0.5">
                                                            Tải: {file.downloadCount || 0}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-center text-sm text-gray-600">
                                                {formatFileSize(file.size)}
                                            </td>
                                            <td className="px-3 py-4 text-center text-sm text-gray-600">
                                                {file.uploadedBy?.fullName || 'N/A'}
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                {getApprovalStatusBadge(file.approvalStatus)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    {/* ⭐️ NÚT PREVIEW */}
                                                    <button
                                                        onClick={() => handlePreviewClick(file)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Xem trước"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>

                                                    {isAdmin && file.approvalStatus === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveClick(file, 'approve')}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                                                title="Duyệt"
                                                            >
                                                                <CheckCircle className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleApproveClick(file, 'reject')}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                                title="Từ chối"
                                                            >
                                                                <XCircle className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDownload(file._id, getSafeFileName(file.originalName))}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="h-5 w-5" />
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(file._id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Upload Guidelines */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center">
                                <Sparkles className="h-5 w-5 mr-2" />
                                Hướng dẫn upload files
                            </h4>
                            <ul className="text-sm text-indigo-800 space-y-2">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Các định dạng được hỗ trợ: PDF, Word, Excel, PowerPoint, Text, Image (JPG, PNG, GIF)</span>
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
                                    <span>Files được upload bởi Admin sẽ tự động được duyệt</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Files được upload bởi người dùng khác sẽ ở trạng thái chờ duyệt</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Tên file tiếng Việt được hỗ trợ đầy đủ (không bị lỗi font)</span>
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>

            {/* ⭐️ PREVIEW MODAL */}
            {showPreviewModal && previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto flex flex-col">
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
                            <div className="flex items-center space-x-3">
                                {getFileIcon(previewFile.mimeType)}
                                <div>
                                    <h3 className="text-lg font-bold">{getSafeFileName(previewFile.originalName)}</h3>
                                    <p className="text-sm text-blue-100">{formatFileSize(previewFile.size)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload(previewFile._id, getSafeFileName(previewFile.originalName))}
                                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                    title="Tải xuống"
                                >
                                    <Download className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 flex-1 overflow-auto">
                            {previewFile.mimeType?.startsWith('image/') ? (
                                <div className="flex justify-center">
                                    <img
                                        src={getPreviewUrl(previewFile)}
                                        alt={previewFile.originalName}
                                        className="max-w-full h-auto rounded-lg"
                                        onError={(e) => {
                                            e.target.style.display = 'none'
                                            e.target.nextElementSibling.style.display = 'block'
                                        }}
                                    />
                                    <div style={{display: 'none'}} className="text-center py-12">
                                        <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 mb-4">Không thể tải ảnh</p>
                                        <button
                                            onClick={() => handleDownload(previewFile._id, getSafeFileName(previewFile.originalName))}
                                            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <Download className="h-5 w-5 mr-2" />
                                            Tải xuống file
                                        </button>
                                    </div>
                                </div>
                            ) : previewFile.mimeType === 'application/pdf' ? (
                                <div className="space-y-4">
                                    <iframe
                                        src={getPreviewUrl(previewFile)}
                                        width="100%"
                                        height="500"
                                        className="rounded-lg border border-gray-300"
                                        title="PDF Preview"
                                    />
                                    <p className="text-sm text-gray-600 text-center">
                                        Nếu preview không hoạt động, <button
                                        onClick={() => handleDownload(previewFile._id, getSafeFileName(previewFile.originalName))}
                                        className="text-blue-600 hover:underline font-semibold"
                                    >
                                        hãy tải file xuống
                                    </button>
                                    </p>
                                </div>
                            ) : previewFile.mimeType?.includes('word') || previewFile.mimeType?.includes('excel') ? (
                                <div className="space-y-4">
                                    <iframe
                                        src={getPreviewUrl(previewFile)}
                                        width="100%"
                                        height="500"
                                        className="rounded-lg border border-gray-300"
                                        title="Document Preview"
                                    />
                                    <p className="text-sm text-gray-600 text-center">
                                        Nếu preview không hoạt động, <button
                                        onClick={() => handleDownload(previewFile._id, getSafeFileName(previewFile.originalName))}
                                        className="text-blue-600 hover:underline font-semibold"
                                    >
                                        hãy tải file xuống
                                    </button>
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 mb-4">
                                        Định dạng file này không hỗ trợ xem trước
                                    </p>
                                    <button
                                        onClick={() => handleDownload(previewFile._id, getSafeFileName(previewFile.originalName))}
                                        className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Download className="h-5 w-5 mr-2" />
                                        Tải xuống file
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && selectedFile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className={`px-6 py-5 rounded-t-2xl ${
                            approvalAction === 'approve'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : 'bg-gradient-to-r from-red-500 to-rose-600'
                        } text-white`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                        {approvalAction === 'approve' ? (
                                            <CheckCircle className="h-6 w-6" />
                                        ) : (
                                            <XCircle className="h-6 w-6" />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        {approvalAction === 'approve' ? 'Duyệt file' : 'Từ chối file'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowApprovalModal(false)}
                                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-700 mb-2">File:</p>
                                <p className="text-base font-semibold text-gray-900">
                                    {getSafeFileName(selectedFile.originalName)}
                                </p>
                            </div>

                            {approvalAction === 'reject' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Lý do từ chối <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Nhập lý do từ chối..."
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowApprovalModal(false)}
                                    disabled={submitting}
                                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleApprovalSubmit}
                                    disabled={submitting}
                                    className={`inline-flex items-center px-6 py-2 rounded-xl font-semibold text-white ${
                                        approvalAction === 'approve'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Xử lý...
                                        </>
                                    ) : (
                                        approvalAction === 'approve' ? 'Duyệt' : 'Từ chối'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}