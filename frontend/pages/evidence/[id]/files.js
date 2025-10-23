import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
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
    Send
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function FileManagement() {
    const router = useRouter()
    const { evidenceId } = router.query
    const [evidence, setEvidence] = useState(null)
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [currentFolder, setCurrentFolder] = useState('root')
    const [folderName, setFolderName] = useState('')
    const [showCreateFolder, setShowCreateFolder] = useState(false)
    const [userRole, setUserRole] = useState(null)
    const [userFolder, setUserFolder] = useState(null)
    const [showUploadForm, setShowUploadForm] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [selectedFileForReject, setSelectedFileForReject] = useState(null)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const user = null // Lấy từ auth context

    useEffect(() => {
        if (evidenceId) {
            fetchEvidence()
            fetchFiles()
        }
    }, [evidenceId, currentFolder])

    const fetchEvidence = async () => {
        try {
            const response = await apiMethods.evidences.getById(evidenceId)
            setEvidence(response.data?.data)
        } catch (error) {
            console.error('Fetch evidence error:', error)
            toast.error('Lỗi khi tải thông tin minh chứng')
        }
    }

    const fetchFiles = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.files.getFolderContents({
                id: currentFolder === 'root' ? 'root' : currentFolder,
                evidenceId
            })
            setFiles(response.data?.data || [])
        } catch (error) {
            console.error('Fetch files error:', error)
            toast.error('Lỗi khi tải danh sách file')
        } finally {
            setLoading(false)
        }
    }

    const createUserFolder = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.files.createFolder(evidenceId, {
                folderName: `Nộp file - ${new Date().getTime()}`
            })
            setUserFolder(response.data?.data)
            setCurrentFolder(response.data?.data._id)
            toast.success('Tạo folder nộp file thành công')
            fetchFiles()
        } catch (error) {
            console.error('Create folder error:', error)
            toast.error('Lỗi khi tạo folder')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateFolder = async () => {
        if (!folderName.trim()) {
            toast.error('Vui lòng nhập tên thư mục')
            return
        }

        try {
            setLoading(true)
            await apiMethods.files.createFolder(evidenceId, {
                folderName: folderName.trim(),
                parentFolderId: currentFolder !== 'root' ? currentFolder : null
            })
            toast.success('Tạo thư mục thành công')
            setFolderName('')
            setShowCreateFolder(false)
            fetchFiles()
        } catch (error) {
            console.error('Create folder error:', error)
            toast.error('Lỗi khi tạo thư mục')
        } finally {
            setLoading(false)
        }
    }

    const handleUploadFiles = async (e) => {
        const uploadedFiles = Array.from(e.target.files)
        if (uploadedFiles.length === 0) return

        try {
            setUploading(true)
            const formData = new FormData()
            uploadedFiles.forEach(file => {
                formData.append('files', file)
            })

            await apiMethods.files.uploadFiles(evidenceId, {
                files: uploadedFiles,
                parentFolderId: currentFolder !== 'root' ? currentFolder : null
            })

            toast.success(`Upload ${uploadedFiles.length} file thành công`)
            setSelectedFiles([])
            fetchFiles()
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Lỗi khi upload file')
        } finally {
            setUploading(false)
        }
    }

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

    const handleDownloadFile = async (fileId) => {
        try {
            await apiMethods.files.downloadFile(fileId)
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Lỗi khi tải file')
        }
    }

    const handleApproveFile = async (fileId) => {
        try {
            await apiMethods.evidences.approveFile(fileId, {
                status: 'approved'
            })
            toast.success('Phê duyệt file thành công')
            fetchFiles()
        } catch (error) {
            console.error('Approve error:', error)
            toast.error('Lỗi khi phê duyệt file')
        }
    }

    const handleRejectFile = async (fileId) => {
        if (!rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        try {
            await apiMethods.evidences.approveFile(fileId, {
                status: 'rejected',
                rejectionReason: rejectReason.trim()
            })
            toast.success('Từ chối file thành công')
            setRejectReason('')
            setShowRejectModal(false)
            setSelectedFileForReject(null)
            fetchFiles()
        } catch (error) {
            console.error('Reject error:', error)
            toast.error('Lỗi khi từ chối file')
        }
    }

    const handleSubmitFiles = async () => {
        if (!confirm('Bạn có chắc chắn muốn nộp các file này? Sau khi nộp, Manager sẽ có thể duyệt hoặc từ chối.')) return

        try {
            // Mark as submitted - update evidence status
            await apiMethods.evidences.update(evidenceId, {
                status: 'pending_approval'
            })
            toast.success('Nộp file thành công. Vui lòng chờ Manager duyệt.')
            setIsSubmitted(true)
            fetchEvidence()
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Lỗi khi nộp file')
        }
    }

    const getFileIcon = (file) => {
        if (file.type === 'folder') return <Folder className="h-5 w-5 text-blue-500" />
        if (file.mimeType?.startsWith('image/')) return <FileText className="h-5 w-5 text-purple-500" />
        if (file.mimeType?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
        return <FileText className="h-5 w-5 text-gray-500" />
    }

    const getApprovalStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle className="h-3.5 w-3.5 mr-1" /> Đã duyệt</span>
            case 'rejected':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200"><XCircle className="h-3.5 w-3.5 mr-1" /> Đã từ chối</span>
            case 'pending':
                return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200"><Clock className="h-3.5 w-3.5 mr-1" /> Đang chờ</span>
            default:
                return null
        }
    }

    const isManager = userRole === 'manager'
    const isTDG = userRole === 'tdg'
    const canUpload = isTDG && !isSubmitted
    const canApprove = isManager

    if (!evidenceId) {
        return (
            <div className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Không tìm thấy minh chứng</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center text-blue-100 hover:text-white mb-3 font-semibold transition-colors"
                        >
                            <ChevronRight className="h-5 w-5 mr-1 transform -rotate-180" />
                            Quay lại
                        </button>
                        <h1 className="text-3xl font-bold mb-2">{evidence?.code} - {evidence?.name}</h1>
                        <p className="text-blue-100">Quản lý file minh chứng</p>
                    </div>
                </div>
            </div>

            {/* Status Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Trạng thái:</p>
                        <p className="text-lg font-bold text-blue-700">{evidence?.status === 'pending_approval' ? 'Đã nộp - Chờ duyệt' : 'Chưa nộp'}</p>
                    </div>
                    <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Vai trò:</p>
                        <p className="text-lg font-bold text-purple-700">{isManager ? 'Quản lý duyệt' : isTDG ? 'Nộp file' : 'Xem'}</p>
                    </div>
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Tổng file:</p>
                        <p className="text-lg font-bold text-green-700">{files.filter(f => f.type === 'file').length}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-wrap gap-3">
                    {canUpload && !userFolder && (
                        <button
                            onClick={createUserFolder}
                            disabled={loading}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-semibold"
                        >
                            <FolderPlus className="h-5 w-5 mr-2" />
                            Tạo Folder Nộp File
                        </button>
                    )}

                    {canUpload && userFolder && (
                        <>
                            <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold cursor-pointer">
                                <Upload className="h-5 w-5 mr-2" />
                                Upload File
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleUploadFiles}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </label>

                            {files.filter(f => f.type === 'file' && f.approvalStatus === 'pending').length > 0 && !isSubmitted && (
                                <button
                                    onClick={handleSubmitFiles}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                                >
                                    <Send className="h-5 w-5 mr-2" />
                                    Nộp File
                                </button>
                            )}
                        </>
                    )}

                    {showCreateFolder && (
                        <div className="w-full flex gap-2">
                            <input
                                type="text"
                                placeholder="Nhập tên thư mục..."
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleCreateFolder}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                            >
                                Tạo
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateFolder(false)
                                    setFolderName('')
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 font-semibold"
                            >
                                Hủy
                            </button>
                        </div>
                    )}

                    {!showCreateFolder && userFolder && (
                        <button
                            onClick={() => setShowCreateFolder(true)}
                            className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                        >
                            <FolderPlus className="h-5 w-5 mr-2" />
                            Tạo Thư Mục
                        </button>
                    )}
                </div>
            </div>

            {/* File List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50">
                    <h2 className="text-lg font-bold text-gray-900">
                        Danh sách file
                        <span className="ml-2 text-sm font-semibold text-blue-600">
                            ({files.filter(f => f.type === 'file').length} file)
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
                        <p className="text-gray-500 font-medium">Thư mục trống</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Tên</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Loại</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Ngày upload</th>
                                {isManager && (
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Trạng thái duyệt</th>
                                )}
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">Thao tác</th>
                            </tr>
                            </thead>
                            <tbody>
                            {files.map((file) => (
                                <tr key={file._id} className="hover:bg-gray-50 border-b border-gray-200">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {getFileIcon(file)}
                                            <div>
                                                <p className="font-semibold text-gray-900">{file.originalName}</p>
                                                {file.type === 'folder' && (
                                                    <p className="text-xs text-gray-500">{file.folderMetadata?.fileCount || 0} file</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {file.type === 'folder' ? 'Thư mục' : file.mimeType}
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
                                        <div className="flex gap-2">
                                            {file.type === 'folder' && (
                                                <button
                                                    onClick={() => setCurrentFolder(file._id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Mở thư mục"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                            )}

                                            {file.type === 'file' && (
                                                <>
                                                    <button
                                                        onClick={() => handleDownloadFile(file._id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="h-5 w-5" />
                                                    </button>

                                                    {isManager && file.approvalStatus === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveFile(file._id)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                                                </>
                                            )}

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
                            <p className="text-red-100 text-sm mt-2">{selectedFileForReject.originalName}</p>
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
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleRejectFile(selectedFileForReject._id)}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                            >
                                Từ Chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}