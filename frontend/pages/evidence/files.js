import { useState, useEffect, useCallback } from 'react'
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
    Check,
    FolderPlus,
    Folder
} from 'lucide-react'

const CreateFolderModal = ({ evidenceId, parentFolderId, onClose, onSuccess }) => {
    const [folderName, setFolderName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!folderName.trim()) {
            toast.error('Vui lòng nhập tên thư mục');
            return;
        }

        if (!evidenceId) {
            toast.error('Không tìm thấy ID minh chứng để tạo thư mục.');
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                folderName: folderName.trim()
            };

            if (parentFolderId) {
                payload.parentFolderId = parentFolderId;
            }

            const response = await apiMethods.files.createFolder(evidenceId, payload);

            if (response.data?.success) {
                toast.success(`Tạo thư mục "${folderName.trim()}" thành công`);
                setFolderName('');
                onSuccess();
            } else {
                toast.error(response.data?.message || 'Lỗi khi tạo thư mục');
            }
        } catch (error) {
            console.error('Create folder error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Lỗi khi tạo thư mục';
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center"><FolderPlus className="h-6 w-6 mr-2" /> Tạo Thư Mục Mới</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"><X className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tên thư mục <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="Nhập tên thư mục..."
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={submitting}
                            autoFocus
                        />
                    </div>
                    <div className="flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !folderName.trim()}
                            className="inline-flex items-center px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl"
                        >
                            {submitting ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Đang tạo...</> : 'Tạo Thư Mục'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default function FilesPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { evidenceId } = router.query

    const [loading, setLoading] = useState(true)
    const [evidence, setEvidence] = useState(null)
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [submittingFile, setSubmittingFile] = useState(false)
    const [showApprovalModal, setShowApprovalModal] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [approvalAction, setApprovalAction] = useState('approve')
    const [rejectionReason, setRejectionReason] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [selectedItems, setSelectedItems] = useState([])

    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [folderPath, setFolderPath] = useState([{ id: null, name: 'Thư mục gốc' }]);


    const isAdmin = user?.role === 'admin'
    const isManager = user?.role === 'manager'
    const isTDG = user?.role === 'tdg'
    const isEx = user?.role === 'ex'

    const canUpload = isTDG || isManager
    const canApprove = isManager
    const canOnlyView = isAdmin || isEx
    const canSubmit = isTDG

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && evidenceId) {
            fetchData()
        }
    }, [user, evidenceId, currentFolderId])

    const breadcrumbItems = [
        { name: 'Quản lý minh chứng', href: '/evidence-management', icon: ArrowLeft },
        { name: 'Files đính kèm', icon: File }
    ]

    const fetchData = async () => {
        try {
            setLoading(true)

            let evidenceResponse
            try {
                evidenceResponse = await apiMethods.evidences.getById(evidenceId)
            } catch (apiError) {
                if (apiError.response?.status === 403) {
                    console.warn('403 - Không có quyền, thử lấy dữ liệu khác')
                    throw apiError
                }
                throw apiError
            }

            const evidenceData = evidenceResponse.data?.data || evidenceResponse.data
            setEvidence(evidenceData)

            let filesInFolder = [];

            try {
                if (currentFolderId === null) {
                    const filesResponse = await apiMethods.files.getByEvidence(evidenceId, {
                        parentFolder: 'root'
                    });
                    filesInFolder = filesResponse.data?.data?.items || filesResponse.data?.data || [];
                } else {
                    const filesResponse = await apiMethods.files.getFolderContents({
                        folderId: currentFolderId,
                        evidenceId: evidenceId
                    });
                    filesInFolder = filesResponse.data?.data || [];
                }
            } catch (fileError) {
                console.warn('Error fetching files, using empty array:', fileError);
                filesInFolder = [];
            }

            if (Array.isArray(filesInFolder)) {
                filesInFolder.sort((a, b) => {
                    if (a.type === 'folder' && b.type !== 'folder') return -1;
                    if (a.type !== 'folder' && b.type === 'folder') return 1;
                    return (a.originalName || '').localeCompare(b.originalName || '');
                });
            } else {
                console.error("filesInFolder is not an array:", filesInFolder);
                filesInFolder = [];
            }

            setFiles(filesInFolder)
            setSelectedItems([])
        } catch (error) {
            console.error('Fetch data error:', error)

            if (error.response?.status === 403) {
                toast.error(error.response?.data?.message || 'Bạn không có quyền truy cập minh chứng này')
                setTimeout(() => {
                    router.push('/evidence-management')
                }, 1500)
            } else if (error.response?.status === 401) {
                toast.error('Vui lòng đăng nhập lại')
                await router.push('/login')
            } else {
                toast.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu')
            }
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

    const handleDownload = (fileId, fileName) => {
        apiMethods.files.downloadFile(fileId).then(response => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Tải file thành công');
        }).catch(error => {
            console.error('Download failed:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tải file');
        });
    };


    const handleUpload = async (filesToUpload) => {
        if (!canUpload) {
            toast.error('Bạn không có quyền upload file')
            return
        }

        if (filesToUpload.length > 10) {
            toast.error('Chỉ được upload tối đa 10 files mỗi lần')
            return
        }

        const maxSize = 100 * 1024 * 1024
        const oversizedFiles = filesToUpload.filter(file => file.size > maxSize)
        if (oversizedFiles.length > 0) {
            toast.error(`File "${oversizedFiles[0].name}" vượt quá 100MB`)
            return
        }

        setUploading(true)
        let successCount = 0
        let failCount = 0

        try {
            const response = await apiMethods.files.uploadFiles(evidenceId, {
                files: filesToUpload,
                parentFolderId: currentFolderId || undefined
            })

            if (response.data?.success) {
                successCount = response.data.data.length
                failCount = filesToUpload.length - successCount
            } else {
                failCount = filesToUpload.length
                throw new Error(response.data?.message || 'Lỗi khi upload file');
            }
        } catch (error) {
            console.error('Upload error:', error)
            failCount = filesToUpload.length
            if (!error.response) {
                toast.error('Lỗi kết nối hoặc hệ thống khi upload')
            }
        }

        setUploading(false)

        if (successCount > 0 && failCount === 0) {
            toast.success(`Upload thành công ${successCount} file`)
        } else if (successCount > 0 && failCount > 0) {
            toast.success(`Upload thành công ${successCount} file, thất bại ${failCount} file`)
        } else if (filesToUpload.length > 0) {
            toast.error('Upload thất bại')
        }

        fetchData()
    }

    const handleSubmitFiles = async () => {
        if (!canSubmit) {
            toast.error('Bạn không có quyền nộp file')
            return
        }

        const pendingFiles = files.filter(f => f.approvalStatus === 'pending' && f.type === 'file')
        if (pendingFiles.length === 0) {
            toast.error('Không có file nào để nộp')
            return
        }

        try {
            setSubmittingFile(true)
            const response = await apiMethods.files.submitFiles(evidenceId)

            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Lỗi khi nộp file')
            }

            toast.success('Đã nộp file thành công. Manager sẽ duyệt trong thời gian sớm nhất.')
            fetchData()
        } catch (error) {
            console.error('Submit error:', error)
            toast.error(error.message || 'Lỗi khi nộp file')
        } finally {
            setSubmittingFile(false)
        }
    }

    const handleDelete = async (fileId, fileType) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${fileType === 'folder' ? 'thư mục' : 'file'} này?`)) {
            return
        }

        try {
            const response = await apiMethods.files.deleteFile(fileId)

            if (response.data?.success) {
                toast.success(response.data.message || `${fileType === 'folder' ? 'Xóa thư mục' : 'Xóa file'} thành công`)
                fetchData()
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xóa')
        }
    }

    const handleApproveClick = (file, action) => {
        if (!canApprove) {
            toast.error('Bạn không có quyền duyệt file.');
            return;
        }
        setSelectedFile(file)
        setApprovalAction(action)
        setRejectionReason('')
        setShowApprovalModal(true)
    }

    const handleBulkApproveClick = (action) => {
        if (!canApprove) {
            toast.error('Bạn không có quyền thực hiện hành động này.');
            return;
        }

        const filesToApprove = files.filter(f => selectedItems.includes(f._id) && f.approvalStatus === 'pending' && f.type === 'file');

        if (filesToApprove.length === 0) {
            toast.error('Không có file chờ duyệt nào được chọn.');
            return;
        }

        handleApproveClick(filesToApprove[0], action);
    }

    const handleApprovalSubmit = async () => {
        if (approvalAction === 'reject' && !rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        if (!selectedFile || selectedFile.type === 'folder') {
            toast.error("Không tìm thấy file để xử lý.");
            return;
        }

        try {
            setSubmitting(true)

            if (approvalAction === 'approve') {
                await apiMethods.files.approveFile(selectedFile._id)
            } else {
                await apiMethods.files.rejectFile(selectedFile._id, { rejectionReason })
            }

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
        const file = files.find(f => f._id === fileId);
        if (file && file.type === 'folder') return;

        setSelectedItems(prev =>
            prev.includes(fileId) ? prev.filter(item => item !== fileId) : [...prev, fileId]
        )
    }

    const toggleSelectAll = () => {
        const fileIds = files.filter(f => f.type === 'file').map(f => f._id);
        if (selectedItems.length === fileIds.length) {
            setSelectedItems([])
        } else {
            setSelectedItems(fileIds)
        }
    }

    const getSafeFileName = (fileName) => {
        if (!fileName) return 'Tên File không xác định';
        try {
            return decodeURIComponent(fileName);
        } catch (e) {
            return fileName;
        }
    };

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

    const handleOpenFolder = (folder) => {
        setCurrentFolderId(folder._id);
        setFolderPath(prev => [...prev, { id: folder._id, name: folder.originalName }]);
    };

    const handleNavigateTo = (index) => {
        if (index < folderPath.length) {
            const newPath = folderPath.slice(0, index + 1);
            setFolderPath(newPath);
            setCurrentFolderId(newPath[newPath.length - 1].id);
        }
    };

    const allFiles = evidence?.files || [];
    const approvedFiles = allFiles.filter(f => f.approvalStatus === 'approved').length;
    const rejectedFiles = allFiles.filter(f => f.approvalStatus === 'rejected').length;
    const totalPending = allFiles.filter(f => f.approvalStatus === 'pending').length;


    if (isLoading || loading) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                </div>
            </Layout>
        )
    }

    const pendingFiles = files.filter(f => f.approvalStatus === 'pending' && f.type === 'file')

    return (
        <Layout breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <h1 className="text-3xl font-bold mb-2">Quản lý files minh chứng</h1>
                    <p className="text-blue-100 mb-3">
                        {evidence?.code} - {evidence?.name}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                        {isTDG && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white bg-opacity-20 text-white text-sm font-semibold">
                                <Upload className="h-4 w-4 mr-2" />
                                Thành viên đóng góp
                            </span>
                        )}
                        {isManager && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white bg-opacity-20 text-white text-sm font-semibold">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Quản lý
                            </span>
                        )}
                        {isAdmin && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white bg-opacity-20 text-white text-sm font-semibold">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Admin
                            </span>
                        )}
                        {isEx && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white bg-opacity-20 text-white text-sm font-semibold">
                                <FileText className="h-4 w-4 mr-2" />
                                Kiểm toán
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-600 text-sm font-semibold">Tổng Chờ duyệt</p>
                                <p className="text-3xl font-bold text-yellow-900">{totalPending}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-semibold">Đã duyệt</p>
                                <p className="text-3xl font-bold text-green-900">{approvedFiles}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-600 text-sm font-semibold">Từ chối</p>
                                <p className="text-3xl font-bold text-red-900">{rejectedFiles}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap items-center justify-between">
                    <div className="flex items-center space-x-1 text-sm overflow-x-auto whitespace-nowrap py-1 bg-gray-100 p-2 rounded-xl border border-gray-200 flex-1 min-w-0">
                        {folderPath.length > 1 && (
                            <button
                                onClick={() => handleNavigateTo(folderPath.length - 2)}
                                className="p-1 rounded-full hover:bg-gray-200 text-gray-700"
                                title="Quay lại"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        )}
                        <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        {folderPath.map((item, index) => (
                            <span key={item.id} className="flex items-center flex-shrink-0">
                                <button
                                    onClick={() => handleNavigateTo(index)}
                                    className={`font-semibold hover:text-blue-600 transition-colors ${index === folderPath.length - 1 ? 'text-blue-600' : 'text-gray-600'}`}
                                >
                                    {item.name}
                                </button>
                                {index < folderPath.length - 1 && <span className="mx-1 text-gray-400">/</span>}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        {canUpload && (
                            <>
                                <button
                                    onClick={() => setShowCreateFolderModal(true)}
                                    className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                                >
                                    <FolderPlus className="h-5 w-5 mr-2" />
                                    Tạo thư mục
                                </button>
                                <label className="inline-block">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileSelect}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                    <span className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold cursor-pointer disabled:opacity-50">
                                        <Upload className="h-5 w-5 mr-2" />
                                        {uploading ? 'Đang upload...' : 'Upload file'}
                                    </span>
                                </label>

                                {pendingFiles.length > 0 && (
                                    <button
                                        onClick={handleSubmitFiles}
                                        disabled={submittingFile}
                                        className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                                    >
                                        {submittingFile ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                Đang nộp...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-5 w-5 mr-2" />
                                                Nộp file ({pendingFiles.length})
                                            </>
                                        )}
                                    </button>
                                )}
                            </>
                        )}

                        {canApprove && totalPending > 0 && (
                            <>
                                <button
                                    onClick={() => {
                                        if (selectedItems.length === 0) {
                                            toast.error('Vui lòng chọn file để duyệt')
                                            return
                                        }
                                        handleBulkApproveClick('approve')
                                    }}
                                    className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                                >
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Duyệt ({selectedItems.filter(id =>
                                    files.find(f => f._id === id && f.approvalStatus === 'pending' && f.type === 'file')
                                ).length})
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedItems.length === 0) {
                                            toast.error('Vui lòng chọn file để từ chối')
                                            return
                                        }
                                        handleBulkApproveClick('reject')
                                    }}
                                    className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                                >
                                    <XCircle className="h-5 w-5 mr-2" />
                                    Từ chối ({selectedItems.filter(id =>
                                    files.find(f => f._id === id && f.approvalStatus === 'pending' && f.type === 'file')
                                ).length})
                                </button>
                            </>
                        )}

                        <button
                            onClick={fetchData}
                            className="inline-flex items-center px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                        >
                            <RefreshCw className="h-5 w-5 mr-2" />
                            Làm mới
                        </button>
                    </div>
                </div>

                {files.length > 0 ? (
                    <>
                        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-200">
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.length === files.filter(f => f.type === 'file').length && files.filter(f => f.type === 'file').length > 0}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Tên File/Folder
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Kích thước/Nội dung
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Trạng thái duyệt
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Ngày upload
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-gray-100">
                                {files.map((file) => (
                                    <tr key={file._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {file.type === 'file' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(file._id)}
                                                    onChange={() => toggleSelectItem(file._id)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {file.type === 'folder' ? (
                                                    <button
                                                        onClick={() => handleOpenFolder(file)}
                                                        className="flex items-center gap-3 group"
                                                    >
                                                        <Folder className="h-8 w-8 text-yellow-500" />
                                                        <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {file.originalName}
                                                        </span>
                                                    </button>
                                                ) : (
                                                    getFileIcon(file.mimeType)
                                                )}
                                                {file.type === 'file' && (
                                                    <span className="font-semibold text-gray-900">
                                                        {getSafeFileName(file.originalName)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {file.type === 'folder' ? (
                                                <span className="font-semibold">
                                                    {file.folderMetadata?.fileCount || 0} mục
                                                </span>
                                            ) : (
                                                formatFileSize(file.size)
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {file.type === 'file' ? (
                                                getApprovalStatusBadge(file.approvalStatus)
                                            ) : (
                                                <span className="text-xs text-gray-500">Folder</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(file.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {file.type === 'file' && (
                                                    <>
                                                        {canApprove && file.approvalStatus === 'pending' && (
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
                                                            onClick={() => handleDownload(file._id, getSafeFileName(file.originalName || file.filename))}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                            title="Tải xuống"
                                                        >
                                                            <Download className="h-5 w-5" />
                                                        </button>

                                                        {canUpload && file.approvalStatus === 'pending' && (
                                                            <button
                                                                onClick={() => handleDelete(file._id, 'file')}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}

                                                {file.type === 'folder' && canUpload && (
                                                    <button
                                                        onClick={() => handleDelete(file._id, 'folder')}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Xóa thư mục"
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

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center">
                                <Sparkles className="h-5 w-5 mr-2" />
                                Hướng dẫn
                            </h4>
                            {isTDG && (
                                <ul className="text-sm text-indigo-800 space-y-2">
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span><strong>Quản lý Folder:</strong> Bạn có thể Tạo Folder, click vào Folder để xem nội dung, và Upload file vào Folder đó.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span><strong>Bước 1:</strong> Click "Upload file" để chọn file từ máy tính</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span><strong>Bước 2:</strong> File sẽ được thêm vào danh sách (chờ duyệt)</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span><strong>Bước 3:</strong> Click "Nộp file" để gửi cho Manager duyệt</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Tối đa 10 file, mỗi file ≤ 100MB</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Chỉ có thể xóa file/folder ở trạng thái "Chờ duyệt"</span>
                                    </li>
                                </ul>
                            )}
                            {canApprove && (
                                <ul className="text-sm text-indigo-800 space-y-2">
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Chọn file từ danh sách → Click "Duyệt" hoặc "Từ chối"</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Nếu từ chối, vui lòng ghi rõ lý do</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>File được duyệt sẽ được xác nhận trong hệ thống</span>
                                    </li>
                                </ul>
                            )}
                            {canOnlyView && (
                                <ul className="text-sm text-indigo-800 space-y-2">
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Bạn có quyền xem tất cả file/folder</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>Click biểu tượng download để tải file</span>
                                    </li>
                                </ul>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-12 text-center">
                        <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-semibold mb-4">Chưa có file nào trong thư mục này</p>
                        {canUpload && (
                            <p className="text-gray-500 text-sm">
                                Nhấn "Upload file" hoặc "Tạo thư mục" để bắt đầu thêm file/folder
                            </p>
                        )}
                    </div>
                )}
            </div>

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
                                    onClick={() => {
                                        setShowApprovalModal(false);
                                        setSelectedFile(null);
                                    }}
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

                            <div className="flex items-center justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowApprovalModal(false);
                                        setSelectedFile(null);
                                    }}
                                    disabled={submitting}
                                    className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleApprovalSubmit}
                                    disabled={submitting || (approvalAction === 'reject' && !rejectionReason.trim())}
                                    className={`inline-flex items-center px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                        approvalAction === 'approve'
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl'
                                            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-xl'
                                    }`}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            {approvalAction === 'approve' ? (
                                                <>
                                                    <CheckCircle className="h-5 w-5 mr-2" />
                                                    Xác nhận duyệt
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-5 w-5 mr-2" />
                                                    Xác nhận từ chối
                                                </>
                                            )}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCreateFolderModal && (
                <CreateFolderModal
                    evidenceId={evidenceId}
                    parentFolderId={currentFolderId}
                    onClose={() => setShowCreateFolderModal(false)}
                    onSuccess={() => {
                        setShowCreateFolderModal(false);
                        fetchData();
                    }}
                />
            )}
        </Layout>
    )
}