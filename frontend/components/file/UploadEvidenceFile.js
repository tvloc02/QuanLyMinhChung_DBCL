import { useState, useEffect } from 'react'
import { Upload, X, AlertCircle, CheckCircle, Loader2, File, Info, Check, Folder, FolderPlus, Trash2, Eye, History, Download, Clock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

// ============ COMPONENT LỊCH SỬ FILE ĐÃ UPLOAD ============

const UploadHistoryPanel = ({ evidenceId, uploadedByCurrentUser }) => {
    const [historyFiles, setHistoryFiles] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUploadHistory()
    }, [evidenceId])

    const fetchUploadHistory = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.files.getByEvidence(evidenceId, {
                uploadedBy: 'current', // Filter file của user hiện tại
                limit: 100
            })

            const files = response.data?.data?.items || response.data?.data || []
            // Chỉ lấy file loại 'file' (không phải folder) được upload bởi user hiện tại
            const userFiles = files.filter(f => f.type === 'file' && f.uploadedBy)
            setHistoryFiles(userFiles)
        } catch (error) {
            console.error('Fetch upload history error:', error)
            toast.error('Lỗi khi tải lịch sử upload')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            'approved': { color: 'bg-green-100 text-green-700', icon: Check, label: 'Đã duyệt' },
            'pending': { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Chờ duyệt' },
            'rejected': { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Từ chối' },
        }
        const config = statusConfig[status] || statusConfig['pending']
        const Icon = config.icon
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </span>
        )
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-600" />
                    Lịch sử file của bạn ({historyFiles.length})
                </h3>
                <button
                    onClick={fetchUploadHistory}
                    disabled={loading}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                    Làm mới
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
            ) : historyFiles.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
                    <File className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Chưa upload file nào</p>
                </div>
            ) : (
                <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                    {historyFiles.map((file) => (
                        <div
                            key={file._id}
                            className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <File className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {file.originalName}
                                        </p>
                                        {getStatusBadge(file.approvalStatus)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        <span>{formatFileSize(file.size)}</span>
                                        <span>•</span>
                                        <span>{formatDate(file.uploadedAt)}</span>
                                    </div>
                                    {file.rejectionReason && (
                                        <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                            <p className="text-xs text-red-700">
                                                <strong>Lý do từ chối:</strong> {file.rejectionReason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                <a
                                    href={file.filePath || `/uploads/evidences/${file.storedName}`}
                                    download={file.originalName}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
                                    title="Tải file"
                                >
                                    <Download className="h-4 w-4" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ============ COMPONENT CHÍNH UploadEvidenceFile ============

const CreateFolderModal = ({ evidenceId, parentFolderId, onClose, onSuccess }) => {
    const [folderName, setFolderName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!folderName.trim()) return toast.error('Vui lòng nhập tên thư mục');

        try {
            setSubmitting(true);
            await apiMethods.files.createFolder(evidenceId, {
                folderName: folderName.trim(),
                parentFolderId: parentFolderId || null
            });

            toast.success(`Tạo thư mục "${folderName.trim()}" thành công`);
            onSuccess();
        } catch (error) {
            console.error('Create folder error:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tạo thư mục');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full space-y-4">
                <h4 className="text-lg font-bold">Tạo thư mục mới</h4>
                <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Nhập tên thư mục..."
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={submitting}
                />
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || !folderName.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                    >
                        Tạo
                    </button>
                </div>
            </form>
        </div>
    );
};

const FolderContentSelector = ({ evidenceId, selectedFolderId, onSelectFolder, onFolderCreated }) => {
    const [contents, setContents] = useState([])
    const [loading, setLoading] = useState(false)
    const [currentPath, setCurrentPath] = useState([{ id: 'root', name: 'Thư mục gốc' }])
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
    const currentFolderId = currentPath[currentPath.length - 1].id;

    const fetchContents = async (folderId) => {
        setLoading(true)
        try {
            let response;
            let items = [];

            if (folderId === 'root') {
                response = await apiMethods.files.getByEvidence(evidenceId, {
                    parentFolderId: null,
                    page: 1,
                    limit: 1000
                });
                items = response.data?.data?.items || response.data?.data || [];
            } else {
                response = await apiMethods.files.getFolderContents({
                    folderId: folderId,
                    evidenceId: evidenceId
                })
                items = response.data?.data || [];
            }

            setContents(items.filter(item => item.type === 'folder'))

        } catch (error) {
            console.error('Fetch folder contents error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải nội dung thư mục')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchContents(currentFolderId)
        onSelectFolder(currentFolderId === 'root' ? null : currentFolderId);
    }, [currentPath])

    const handleOpenFolder = (folder) => {
        setCurrentPath(prev => [...prev, { id: folder._id, name: folder.originalName }])
    }

    const handleNavigatePath = (index) => {
        setCurrentPath(prev => prev.slice(0, index + 1))
    }

    const handleSelectCurrentFolder = () => {
        const targetId = currentFolderId === 'root' ? null : currentFolderId;
        onSelectFolder(targetId);
        toast.success(`Đã chọn "${currentPath[currentPath.length - 1].name}" làm thư mục đích.`);
    };

    const handleFolderCreationSuccess = () => {
        onFolderCreated();
        setShowCreateFolderModal(false);
        fetchContents(currentFolderId);
    };

    return (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center space-x-1 text-sm overflow-x-auto whitespace-nowrap py-1">
                    <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    {currentPath.map((item, index) => (
                        <span key={item.id} className="flex items-center">
                            <button
                                onClick={() => handleNavigatePath(index)}
                                className={`font-semibold hover:text-blue-600 ${index === currentPath.length - 1 ? 'text-blue-600' : 'text-gray-600'}`}
                            >
                                {item.name}
                            </button>
                            {index < currentPath.length - 1 && <span className="mx-1 text-gray-400">/</span>}
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSelectCurrentFolder}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                            (selectedFolderId === (currentFolderId === 'root' ? null : currentFolderId))
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                        disabled={loading}
                        title="Chọn thư mục hiện tại làm thư mục đích cho việc upload"
                    >
                        <Check className="h-4 w-4 mr-1.5" />
                        Chọn đích
                    </button>
                    <button
                        onClick={() => setShowCreateFolderModal(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-sm"
                        disabled={loading}
                    >
                        <FolderPlus className="h-4 w-4 mr-1.5" />
                        Tạo thư mục
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
            ) : contents.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center py-4">
                    Chưa có thư mục con.
                </p>
            ) : (
                <div className="max-h-36 overflow-y-auto space-y-2">
                    {contents.map(folder => (
                        <button
                            key={folder._id}
                            onClick={() => handleOpenFolder(folder)}
                            className="w-full flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-left"
                        >
                            <div className="flex items-center gap-2">
                                <Folder className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                <span className="text-sm font-semibold text-gray-900 truncate">
                                    {folder.originalName}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500">{folder.folderMetadata?.fileCount || 0} mục</span>
                        </button>
                    ))}
                </div>
            )}

            {showCreateFolderModal && (
                <CreateFolderModal
                    evidenceId={evidenceId}
                    parentFolderId={currentFolderId === 'root' ? null : currentFolderId}
                    onClose={() => setShowCreateFolderModal(false)}
                    onSuccess={handleFolderCreationSuccess}
                />
            )}

        </div>
    );
};


export default function UploadEvidenceFile({ evidence, onClose, onSuccess }) {
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [selectedFolderId, setSelectedFolderId] = useState(null)
    const [showHistory, setShowHistory] = useState(false)

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const newFiles = Array.from(e.dataTransfer.files).map(file => ({
                file,
                id: Math.random(),
                name: file.name,
                size: file.size,
                type: file.type
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                id: Math.random(),
                name: file.name,
                size: file.size,
                type: file.type
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
        e.target.value = ''
    }

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id))
    }

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error('Vui lòng chọn ít nhất một file')
            return
        }

        try {
            setUploading(true)

            const response = await apiMethods.files.uploadFiles(evidence._id, {
                files: files.map(f => f.file),
                parentFolderId: selectedFolderId || undefined
            })

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Lỗi khi upload file');
            }

            const data = response.data;
            setUploadedFiles(prev => [...prev, ...(data.data || [])]);

            const successCount = data.data?.length || 0;
            const failCount = files.length - successCount;

            setFiles([])

            if (successCount > 0 && failCount === 0) {
                toast.success(`Đã upload thành công ${successCount} file. Giờ nộp file để manager duyệt.`)
            } else if (successCount > 0 && failCount > 0) {
                toast.success(`Upload thành công ${successCount} file, thất bại ${failCount} file`)
            } else {
                toast.error('Upload thất bại')
            }

        } catch (error) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Lỗi khi upload file')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async () => {
        if (uploadedFiles.length === 0) {
            toast.error('Vui lòng upload file trước')
            return
        }

        try {
            setSubmitting(true)

            const response = await apiMethods.files.submitFiles(evidence._id);

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Lỗi khi nộp file');
            }

            toast.success('Đã nộp file thành công. Manager sẽ duyệt trong thời gian sớm nhất.')
            setUploadedFiles([])
            setFiles([])
            onSuccess()
        } catch (error) {
            console.error('Submit error:', error)
            toast.error(error.message || 'Lỗi khi nộp file')
        } finally {
            setSubmitting(false)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex items-center justify-between border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Upload và nộp file minh chứng</h2>
                            <p className="text-blue-100 text-sm">
                                {evidence.code} - {evidence.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={uploading || submitting}
                        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all disabled:opacity-50"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    <FolderContentSelector
                        evidenceId={evidence._id}
                        selectedFolderId={selectedFolderId}
                        onSelectFolder={setSelectedFolderId}
                        onFolderCreated={onSuccess}
                    />

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Folder className="h-5 w-5 text-purple-600 flex-shrink-0" />
                            <p className="text-sm text-purple-800 font-semibold">
                                Thư mục đích upload: <span className="text-purple-900 font-bold">{selectedFolderId || 'Thư mục gốc'}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="inline-flex items-center px-3 py-1.5 text-xs bg-purple-200 text-purple-700 rounded-lg font-semibold hover:bg-purple-300 transition-all"
                        >
                            <History className="h-4 w-4 mr-1.5" />
                            Lịch sử
                        </button>
                    </div>

                    {showHistory && (
                        <UploadHistoryPanel evidenceId={evidence._id} uploadedByCurrentUser={true} />
                    )}

                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                            dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                        <Upload className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                        <p className="text-gray-900 font-semibold mb-2">
                            Kéo thả file vào đây hoặc click để chọn
                        </p>
                        <p className="text-gray-500 text-sm mb-4">
                            Hỗ trợ tất cả loại file, tối đa 10 file, mỗi file &lt; 100MB
                        </p>
                        <label className="inline-block">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                disabled={uploading || submitting}
                                className="hidden"
                            />
                            <span className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold cursor-pointer disabled:opacity-50">
                                Chọn file
                            </span>
                        </label>
                    </div>

                    {files.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">
                                    Danh sách file cần upload ({files.length})
                                </h3>
                                <span className="text-sm text-gray-600">
                                    Tổng: {formatFileSize(totalSize)}
                                </span>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {files.map((f) => (
                                    <div
                                        key={f.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <File className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {f.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(f.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFile(f.id)}
                                            disabled={uploading || submitting}
                                            className="ml-2 p-1.5 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                            title="Xóa file"
                                        >
                                            <X className="h-5 w-5 text-red-600" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {uploadedFiles.length > 0 && (
                        <div className="space-y-3 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <h3 className="font-bold text-green-900">
                                    File đã upload ({uploadedFiles.length})
                                </h3>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {uploadedFiles.map((f) => (
                                    <div
                                        key={f._id}
                                        className="flex items-center gap-2 p-2 bg-white rounded border border-green-200"
                                    >
                                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {f.originalName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(f.size)} • Chờ duyệt
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-2">Hướng dẫn:</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                <li><strong>Bước 1:</strong> Chọn/Tạo thư mục đích ở trên.</li>
                                <li><strong>Bước 2:</strong> Chọn file → Click "Upload" để lưu file vào thư mục đích.</li>
                                <li><strong>Bước 3:</strong> File sẽ hiển thị ở danh sách "File đã upload".</li>
                                <li><strong>Bước 4:</strong> Click "Nộp file" để gửi cho manager duyệt.</li>
                            </ol>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>Chỉ upload file liên quan đến minh chứng này</li>
                                <li>Tên file nên rõ ràng, có ý nghĩa</li>
                                <li>Kiểm tra file trước upload để tránh lỗi</li>
                                <li>Sau khi nộp, chờ manager duyệt (không thể chỉnh sửa)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading || submitting}
                        className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    {uploadedFiles.length === 0 ? (
                        <button
                            onClick={handleUpload}
                            disabled={uploading || files.length === 0}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Đang upload...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-5 w-5" />
                                    Upload {files.length > 0 && `(${files.length})`}
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || uploadedFiles.length === 0}
                            className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Đang nộp...
                                </>
                            ) : (
                                <>
                                    <Check className="h-5 w-5" />
                                    Nộp file ({uploadedFiles.length})
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}