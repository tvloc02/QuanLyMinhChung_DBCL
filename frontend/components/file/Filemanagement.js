import { useState, useEffect } from 'react'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import {
    Upload,
    X as XIcon,
    FileText,
    FileImage,
    FileSpreadsheet,
    Presentation,
    File as FileIcon,
    Trash2,
    Check,
    XCircle,
    Clock,
    Loader2,
    AlertCircle
} from 'lucide-react'

export default function FileManagement({ evidence, onClose, onUpdate }) {
    const { user } = useAuth()
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Thêm các state cần thiết cho modal duyệt (dù modal không nằm trong component này)
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [approvalAction, setApprovalAction] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (evidence) {
            fetchFiles()
        }
    }, [evidence])

    // Hàm này phải tồn tại (hoặc được gọi từ bên ngoài) để mở modal
    const handleApproveClick = (file, action) => {
        if (!isAdmin) {
            toast.error('Bạn không có quyền duyệt file.');
            return;
        }
        setSelectedFile(file);
        setApprovalAction(action);
        setRejectionReason('');
        setShowApprovalModal(true); // Giả định modal được quản lý tại đây
    };

    // Hàm duyệt file đơn (Giống files.js)
    const handleApproveFile = async (fileId, status, rejectionReason = '') => {
        try {
            await apiMethods.files.approve(fileId, { status, rejectionReason })
            toast.success(status === 'approved' ? 'Duyệt file thành công' : 'Từ chối file thành công')
            fetchFiles()
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error('Approve file error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi duyệt file')
        }
    }


    const fetchFiles = async () => {
        try {
            setLoading(true)
            // Gọi API lấy thông tin evidence (bao gồm files đã populate)
            const response = await apiMethods.evidences.getById(evidence.id)
            const data = response.data?.data || response.data
            // Giả định response.data.files là mảng files
            setFiles(data?.files || [])
        } catch (error) {
            console.error('Fetch files error:', error)
            // Xử lý lỗi 403/500 tương tự như file files.js
            toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách files')
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = async (e) => {
        const selectedFiles = Array.from(e.target.files)
        if (selectedFiles.length === 0) return

        setUploading(true)
        try {
            // Giả định API uploadMultiple đã được cấu hình đúng trong api.js
            const response = await apiMethods.files.uploadMultiple(selectedFiles, evidence.id)

            if (response.data?.success) {
                toast.success(`Upload thành công ${selectedFiles.length} files`)
                fetchFiles()
                if (onUpdate) onUpdate()
            } else {
                toast.error(response.data?.message || 'Upload thất bại')
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi upload files'
            toast.error(errorMessage)
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const handleDeleteFile = async (fileId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa file này?')) return

        try {
            await apiMethods.files.delete(fileId)
            toast.success('Xóa file thành công')
            fetchFiles()
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error('Delete file error:', error)
            toast.error('Lỗi khi xóa file')
        }
    }

    // *** SỬA LỖI FONT: HÀM DECODE TÊN FILE ***
    const getSafeFileName = (fileName) => {
        if (!fileName) return 'Tên file không xác định';
        try {
            return decodeURIComponent(fileName);
        } catch (e) {
            return fileName;
        }
    };
    // *** KẾT THÚC SỬA LỖI FONT ***


    const getFileIcon = (mimeType) => {
        if (mimeType?.startsWith('image/')) {
            return <FileImage className="h-6 w-6 text-blue-500" />
        } else if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
            return <FileSpreadsheet className="h-6 w-6 text-green-500" />
        } else if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) {
            return <Presentation className="h-6 w-6 text-orange-500" />
        } else if (mimeType?.includes('pdf')) {
            return <FileText className="h-6 w-6 text-red-500" />
        }
        return <FileIcon className="h-6 w-6 text-gray-500" />
    }

    const getStatusLabel = (status) => {
        const labels = {
            'pending': 'Chờ duyệt',
            'approved': 'Đã duyệt',
            'rejected': 'Từ chối',
            'new': 'Mới', // Thêm trạng thái Evidence
            'in_progress': 'Đang thực hiện' // Thêm trạng thái Evidence
        }
        return labels[status] || status
    }

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'approved': 'bg-green-100 text-green-700 border-green-300',
            'rejected': 'bg-red-100 text-red-700 border-red-300',
            'new': 'bg-gray-100 text-gray-700 border-gray-300',
            'in_progress': 'bg-blue-100 text-blue-700 border-blue-300'
        }
        return colors[status] || colors['pending']
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <Check className="h-4 w-4" />
            case 'rejected':
                return <XCircle className="h-4 w-4" />
            case 'pending':
            default:
                return <Clock className="h-4 w-4" />
        }
    }

    // Hàm download riêng cho component này (để có thể gọi getSafeFileName)
    const handleDownloadFile = async (fileId, originalName) => {
        try {
            const response = await apiMethods.files.download(fileId);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', getSafeFileName(originalName));
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Tải file thành công');
        } catch (error) {
            console.error('Download error:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tải file');
        }
    }


    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200 flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                    Quản lý files
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                    <XIcon className="h-5 w-5 text-gray-600" />
                </button>
            </div>

            {/* Evidence Info */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                        {evidence.code}
                    </span>
                    {/* SỬ DỤNG STATUS CỦA EVIDENCE */}
                    <span className={`text-xs px-2 py-1 rounded border font-medium ${getStatusColor(evidence.status)}`}>
                        {getStatusLabel(evidence.status)}
                    </span>
                </div>
                <p className="text-sm text-gray-900 font-medium">{evidence.name}</p>
            </div>

            {/* Upload Area */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <label className={`cursor-pointer block ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-indigo-400 transition-colors text-center">
                        {uploading ? (
                            <>
                                <Loader2 className="h-8 w-8 text-indigo-600 mx-auto mb-2 animate-spin" />
                                <p className="text-sm text-indigo-600 font-medium">Đang upload...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">
                                    <span className="text-indigo-600 font-medium">Chọn files</span> để upload
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Tối đa 50MB mỗi file</p>
                            </>
                        )}
                        <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                        />
                    </div>
                </label>
            </div>

            {/* Files List */}
            <div className="flex-1 p-4 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-2" />
                        <p className="text-sm text-gray-500">Đang tải...</p>
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-8">
                        <FileIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Chưa có file nào</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {files.map((file) => (
                            <div key={file._id} className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                        {getFileIcon(file.mimeType)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate mb-1">
                                            {/* SỬ DỤNG HÀM SỬA LỖI FONT */}
                                            {getSafeFileName(file.originalName)}
                                        </p>
                                        <div className="flex items-center flex-wrap gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded border inline-flex items-center ${getStatusColor(file.approvalStatus)}`}>
                                                {getStatusIcon(file.approvalStatus)}
                                                <span className="ml-1">{getStatusLabel(file.approvalStatus)}</span>
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                        {file.rejectionReason && (
                                            <p className="text-xs text-red-600 mt-1 italic">
                                                Lý do: {file.rejectionReason}
                                            </p>
                                        )}
                                        <div className="flex items-center space-x-2 mt-2">
                                            {isAdmin && file.approvalStatus === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApproveFile(file._id, 'approved')}
                                                        className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium inline-flex items-center"
                                                    >
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const reason = prompt('Lý do từ chối:')
                                                            if (reason) handleApproveFile(file._id, 'rejected', reason)
                                                        }}
                                                        className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium inline-flex items-center"
                                                    >
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Từ chối
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDownloadFile(file._id, file.originalName)}
                                                className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium inline-flex items-center"
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Tải xuống
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFile(file._id)}
                                                className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium inline-flex items-center"
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}