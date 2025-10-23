import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../../services/api'
import toast from 'react-hot-toast'
import {
    Plus,
    Download,
    Trash2,
    Folder,
    File,
    FolderPlus,
    Upload,
    Eye,
    X,
    Loader2,
    ChevronRight,
    Check,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Edit2,
    Send,
    ArrowLeft,
    SubmitIcon
} from 'lucide-react'
import { formatDate } from '../../../utils/helpers'

export default function FileManagement() {
    const router = useRouter()
    const { evidenceId } = router.query
    const [evidence, setEvidence] = useState(null)
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [currentFolder, setCurrentFolder] = useState('root')
    const [userRole, setUserRole] = useState(null)
    const [userFolder, setUserFolder] = useState(null)
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [selectedFileForReject, setSelectedFileForReject] = useState(null)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [breadcrumbs, setBreadcrumbs] = useState([])

    // Kiểm tra role
    const isManager = userRole === 'manager'
    const isTDG = userRole === 'tdg'
    const isAdmin = userRole === 'admin'
    const canUpload = isTDG || isAdmin

    useEffect(() => {
        if (evidenceId) {
            fetchEvidence()
            fetchUserRole()
        }
    }, [evidenceId])

    useEffect(() => {
        if (evidenceId) {
            fetchFiles()
        }
    }, [evidenceId, currentFolder])

    // Lấy role của user
    const fetchUserRole = async () => {
        try {
            const response = await apiMethods.auth.me()
            setUserRole(response.data?.data?.role || null)
        } catch (error) {
            console.error('Fetch user role error:', error)
        }
    }

    // Lấy thông tin minh chứng
    const fetchEvidence = async () => {
        try {
            const response = await apiMethods.evidences.getById(evidenceId)
            setEvidence(response.data?.data)
        } catch (error) {
            console.error('Fetch evidence error:', error)
            toast.error('Lỗi khi tải thông tin minh chứng')
        }
    }

    // Lấy danh sách file
    const fetchFiles = async () => {
        try {
            setLoading(true)
            const params = {
                folderId: currentFolder === 'root' ? null : currentFolder,
                page: 1,
                limit: 50
            }
            const response = await apiMethods.files.getByEvidence(evidenceId, params)
            setFiles(response.data?.data?.files || [])
        } catch (error) {
            console.error('Fetch files error:', error)
            toast.error('Lỗi khi tải danh sách file')
        } finally {
            setLoading(false)
        }
    }

    // Tạo folder cho TDG nộp file
    const handleCreateUserFolder = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.files.createFolder(evidenceId, {
                folderName: `Nộp file - ${new Date().toLocaleDateString('vi-VN')}`
            })
            const newFolder = response.data?.data
            setUserFolder(newFolder)
            setCurrentFolder(newFolder._id)
            toast.success('Tạo folder nộp file thành công')
            fetchFiles()
        } catch (error) {
            console.error('Create folder error:', error)
            toast.error('Lỗi khi tạo folder')
        } finally {
            setLoading(false)
        }
    }

    // Upload file
    const handleUploadFiles = async (e) => {
        const uploadedFiles = Array.from(e.target.files)
        if (uploadedFiles.length === 0) return

        try {
            setUploading(true)
            await apiMethods.files.uploadFiles(evidenceId, {
                files: uploadedFiles,
                parentFolderId: currentFolder !== 'root' ? currentFolder : null
            })
            toast.success(`Upload ${uploadedFiles.length} file thành công`)
            fetchFiles()
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Lỗi khi upload file')
        } finally {
            setUploading(false)
        }
    }

    // Nộp file (submit)
    const handleSubmitFiles = async () => {
        if (!userFolder) {
            toast.error('Vui lòng tạo folder nộp file trước')
            return
        }

        if (!confirm('Bạn có chắc chắn muốn nộp file? Sau khi nộp, manager sẽ duyệt file.')) {
            return
        }

        try {
            setUploading(true)
            await apiMethods.files.submitFiles(evidenceId)
            toast.success('Nộp file thành công. Chờ manager duyệt.')
            setIsSubmitted(true)
            fetchFiles()
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Lỗi khi nộp file')
        } finally {
            setUploading(false)
        }
    }

    // Xóa file
    const handleDeleteFile = async (fileId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa file/thư mục này?')) return

        try {
            await apiMethods.files.deleteFile(fileId)
            toast.success('Xóa file thành công')
            fetchFiles()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Lỗi khi xóa file')
        }
    }

    // Tải xuống file
    const handleDownloadFile = async (fileId, fileName) => {
        try {
            const response = await apiMethods.files.downloadFile(fileId)
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', fileName || 'file')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Lỗi khi tải file')
        }
    }

    // Duyệt file
    const handleApproveFile = async (fileId) => {
        try {
            setUploading(true)
            await apiMethods.files.approveFile(fileId)
            toast.success('Duyệt file thành công')
            fetchFiles()
        } catch (error) {
            console.error('Approve error:', error)
            toast.error('Lỗi khi duyệt file')
        } finally {
            setUploading(false)
        }
    }

    // Từ chối file
    const handleRejectFile = async (fileId) => {
        if (!rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        try {
            setUploading(true)
            await apiMethods.files.rejectFile(fileId, {
                rejectionReason: rejectReason.trim()
            })
            toast.success('Từ chối file thành công')
            setShowRejectModal(false)
            setSelectedFileForReject(null)
            setRejectReason('')
            fetchFiles()
        } catch (error) {
            console.error('Reject error:', error)
            toast.error('Lỗi khi từ chối file')
        } finally {
            setUploading(false)
        }
    }

    // Lấy icon cho loại file
    const getFileIcon = (file) => {
        if (file.type === 'folder') {
            return <Folder className="h-5 w-5 text-yellow-500" />
        }
        if (file.isImage) {
            return <Eye className="h-5 w-5 text-blue-500" />
        }
        if (file.isPdf) {
            return <FileText className="h-5 w-5 text-red-500" />
        }
        return <File className="h-5 w-5 text-gray-500" />
    }

    // Lấy badge cho trạng thái duyệt
    const getApprovalStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        Đã duyệt
                    </span>
                )
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        <XCircle className="h-4 w-4" />
                        Bị từ chối
                    </span>
                )
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        <Clock className="h-4 w-4" />
                        Chờ duyệt
                    </span>
                )
            default:
                return null
        }
    }

    // Mở folder
    const handleOpenFolder = (folderId) => {
        setCurrentFolder(folderId)
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: 'Folder' }])
    }

    // Quay lại folder cha
    const handleBackFolder = () => {
        if (currentFolder !== 'root') {
            const newBreadcrumbs = breadcrumbs.slice(0, -1)
            setBreadcrumbs(newBreadcrumbs)
            setCurrentFolder(newBreadcrumbs.length > 0 ? newBreadcrumbs[newBreadcrumbs.length - 1].id : 'root')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Quản lý File Minh Chứng
                    </h1>
                    {evidence && (
                        <p className="text-gray-600">
                            <span className="font-semibold">{evidence.code}</span> - {evidence.name}
                        </p>
                    )}
                </div>

                {/* Action Bar */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex flex-wrap gap-3">
                            {/* TDG Actions */}
                            {isTDG && !userFolder && (
                                <button
                                    onClick={handleCreateUserFolder}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
                                >
                                    <FolderPlus className="h-5 w-5" />
                                    {loading ? 'Đang tạo...' : 'Tạo Folder Nộp File'}
                                </button>
                            )}

                            {/* Upload button */}
                            {canUpload && userFolder && !isSubmitted && (
                                <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors font-semibold">
                                    <Upload className="h-5 w-5" />
                                    {uploading ? 'Đang upload...' : 'Chọn File'}
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleUploadFiles}
                                        disabled={uploading}
                                        className="hidden"
                                        accept="*/*"
                                    />
                                </label>
                            )}

                            {/* Submit button */}
                            {isTDG && userFolder && !isSubmitted && files.length > 0 && (
                                <button
                                    onClick={handleSubmitFiles}
                                    disabled={uploading}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-semibold"
                                >
                                    <Send className="h-5 w-5" />
                                    {uploading ? 'Đang nộp...' : 'Nộp File'}
                                </button>
                            )}

                            {/* Back button */}
                            {currentFolder !== 'root' && (
                                <button
                                    onClick={handleBackFolder}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                    Quay Lại
                                </button>
                            )}
                        </div>

                        {/* Status badge */}
                        {isSubmitted && (
                            <div className="px-4 py-2 bg-green-50 border-2 border-green-200 rounded-lg">
                                <p className="text-sm font-semibold text-green-800">
                                    ✓ Đã nộp file - Chờ manager duyệt
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Files List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">
                            Danh Sách File
                            <span className="text-sm text-gray-600 ml-2">
                                ({files.length} file)
                            </span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-16">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div className="p-16 text-center">
                            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">
                                {isTDG ? 'Tạo folder nộp file để bắt đầu' : 'Thư mục trống'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                        Tên
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                        Loại
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                        Người upload
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                        Ngày upload
                                    </th>
                                    {isManager && (
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                            Trạng thái duyệt
                                        </th>
                                    )}
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {files.map((file) => (
                                    <tr key={file._id} className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {getFileIcon(file)}
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {file.originalName}
                                                    </p>
                                                    {file.type === 'folder' && (
                                                        <p className="text-xs text-gray-500">
                                                            {file.folderMetadata?.fileCount || 0} file
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {file.type === 'folder' ? 'Thư mục' : file.extension}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {file.uploadedBy?.fullName || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(file.uploadedAt)}
                                        </td>
                                        {isManager && file.type === 'file' && (
                                            <td className="px-6 py-4">
                                                {getApprovalStatusBadge(file.approvalStatus)}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 flex-wrap">
                                                {/* Mở folder */}
                                                {file.type === 'folder' && (
                                                    <button
                                                        onClick={() => handleOpenFolder(file._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Mở thư mục"
                                                    >
                                                        <ChevronRight className="h-5 w-5" />
                                                    </button>
                                                )}

                                                {/* Tải xuống file */}
                                                {file.type === 'file' && (
                                                    <button
                                                        onClick={() =>
                                                            handleDownloadFile(file._id, file.originalName)
                                                        }
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="h-5 w-5" />
                                                    </button>
                                                )}

                                                {/* Duyệt file - Manager */}
                                                {isManager &&
                                                    file.type === 'file' &&
                                                    file.approvalStatus === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    handleApproveFile(file._id)
                                                                }
                                                                disabled={uploading}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Phê duyệt"
                                                            >
                                                                <Check className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedFileForReject(file)
                                                                    setShowRejectModal(true)
                                                                }}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Từ chối"
                                                            >
                                                                <X className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}

                                                {/* Xóa file */}
                                                {(canUpload || isManager) && (
                                                    <button
                                                        onClick={() => handleDeleteFile(file._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Reject Modal */}
                {showRejectModal && selectedFileForReject && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl">
                                <h2 className="text-2xl font-bold">Từ Chối File</h2>
                                <p className="text-red-100 text-sm mt-2">
                                    {selectedFileForReject.originalName}
                                </p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Lý do từ chối
                                    </label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Nhập lý do từ chối..."
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                        rows="4"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 border-t-2 border-gray-200 p-6 flex gap-3 rounded-b-2xl">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false)
                                        setSelectedFileForReject(null)
                                        setRejectReason('')
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
                                    disabled={uploading}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() =>
                                        handleRejectFile(selectedFileForReject._id)
                                    }
                                    disabled={uploading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {uploading ? 'Đang xử lý...' : 'Từ Chối'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}