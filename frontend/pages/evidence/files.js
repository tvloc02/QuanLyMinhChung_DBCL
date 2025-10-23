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
    Check,
    FolderPlus, // Thêm FolderPlus
    Folder // Thêm Folder
} from 'lucide-react'


// Component Modal Tạo Thư Mục (Có thể đặt ở file riêng, nhưng để đơn giản, đặt tạm ở đây)
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

    // Thêm state cho folder
    const [currentFolderId, setCurrentFolderId] = useState(null); // null = root folder
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

    // Phân quyền theo role
    const isAdmin = user?.role === 'admin'
    const isManager = user?.role === 'manager'
    const isTDG = user?.role === 'tdg'
    const isEx = user?.role === 'ex' // Người kiểm toán

    // Các quyền hạn
    const canUpload = isTDG || isManager // TDG/Manager được upload và tạo folder (Back-end sẽ kiểm tra department)
    const canApprove = isManager // Chỉ Manager được duyệt
    const canOnlyView = isAdmin || isEx // Admin và Ex chỉ được xem
    const canSubmit = isTDG // Chỉ TDG được nộp file

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && evidenceId) {
            fetchData()
        }
    }, [user, evidenceId, currentFolderId]) // Thêm currentFolderId vào dependency

    const breadcrumbItems = [
        { name: 'Quản lý minh chứng', href: '/evidence/evidence-management', icon: ArrowLeft },
        { name: 'Files đính kèm', icon: File }
    ]

    const fetchData = async () => {
        try {
            setLoading(true)

            let evidenceResponse
            try {
                // Lấy thông tin minh chứng
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

            // Lấy nội dung folder hiện tại
            let filesResponse;
            if (currentFolderId === null) {
                // Lấy files/folders ở thư mục gốc (parentFolder: null)
                filesResponse = await apiMethods.files.getByEvidence(evidenceId, { parentFolder: 'root' });
            } else {
                // Lấy files/folders trong thư mục con
                filesResponse = await apiMethods.files.getFolderContents({
                    folderId: currentFolderId,
                    evidenceId: evidenceId
                });
            }

            const filesInFolder = filesResponse.data?.data || [];

            // Sắp xếp: folders lên trước, rồi files, theo tên
            filesInFolder.sort((a, b) => {
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (a.type !== 'folder' && b.type === 'folder') return 1;
                return a.originalName.localeCompare(b.originalName);
            });

            setFiles(filesInFolder)
            setSelectedItems([])
        } catch (error) {
            console.error('Fetch data error:', error)

            // Xử lý lỗi 403
            if (error.response?.status === 403) {
                toast.error('Bạn không có quyền truy cập minh chứng này')
                setTimeout(() => {
                    router.push('/evidence/evidence-management')
                }, 1500)
            } else if (error.response?.status === 401) {
                toast.error('Vui lòng đăng nhập lại')
                router.push('/login')
            } else {
                toast.error(error.response?.data?.message || 'Lỗi khi tải dữ liệu')
            }
        } finally {
            setLoading(false)
        }
    }

    // Tạo Breadcrumb cho Folder
    const [folderPath, setFolderPath] = useState([{ id: null, name: 'Thư mục gốc' }]);

    useEffect(() => {
        if (evidenceId) {
            // Logic để lấy tên folder nếu currentFolderId thay đổi (cần API getFileInfo)
            // Tạm thời giả định đơn giản: nếu currentFolderId là null, ta ở root.
            if (currentFolderId === null) {
                setFolderPath([{ id: null, name: 'Thư mục gốc' }]);
            } else {
                // Trong thực tế, cần gọi API getFileInfo để lấy path
                // Hoặc giữ state path khi navigate
            }
        }
    }, [currentFolderId, evidenceId]);

    // Mở folder
    const handleOpenFolder = (folder) => {
        setCurrentFolderId(folder._id);
        // Cập nhật path
        setFolderPath(prev => [...prev, { id: folder._id, name: folder.originalName }]);
    };

    // Quay lại folder cha
    const handleNavigateBack = () => {
        if (folderPath.length > 1) {
            const newPath = folderPath.slice(0, folderPath.length - 1);
            setFolderPath(newPath);
            setCurrentFolderId(newPath[newPath.length - 1].id);
        }
    };

    // Quay lại folder bất kỳ trong path
    const handleNavigateTo = (index) => {
        if (index < folderPath.length - 1) {
            const newPath = folderPath.slice(0, index + 1);
            setFolderPath(newPath);
            setCurrentFolderId(newPath[newPath.length - 1].id);
        }
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files)
        if (selectedFiles.length > 0) {
            handleUpload(selectedFiles)
        }
        e.target.value = ''
    }

    // Cập nhật hàm handleUpload để gửi parentFolderId
    const handleUpload = async (filesToUpload) => {
        if (!canUpload) {
            toast.error('Bạn không có quyền upload file')
            return
        }
        // ... kiểm tra max size và limit giữ nguyên

        setUploading(true)
        let successCount = 0
        let failCount = 0

        for (const file of filesToUpload) {
            try {
                const formData = new FormData()
                formData.append('files', file)

                // Thêm parentFolderId nếu có
                if (currentFolderId) {
                    formData.append('parentFolderId', currentFolderId);
                }

                // SỬ DỤNG API METHODS ĐỂ DỄ QUẢN LÝ HEADERS/INTERCEPTORS
                const response = await apiMethods.files.uploadFiles(evidenceId, {
                    files: [file],
                    parentFolderId: currentFolderId
                })

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

    // Hàm nộp file (chỉ TDG) giữ nguyên
    const handleSubmitFiles = async () => {
        if (!canSubmit) {
            toast.error('Bạn không có quyền nộp file')
            return
        }

        const pendingFiles = files.filter(f => f.approvalStatus === 'pending' && f.type === 'file') // Chỉ nộp files
        if (pendingFiles.length === 0) {
            toast.error('Không có file nào để nộp')
            return
        }

        try {
            setSubmittingFile(true)

            // Sử dụng apiMethods
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

    // Hàm xóa file/folder
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

    // Hàm handleApprovalSubmit giữ nguyên
    const handleApprovalSubmit = async () => {
        if (approvalAction === 'reject' && !rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        if (!selectedFile) {
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

    // Hàm getFileIcon giữ nguyên
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

    // Hàm getApprovalStatusBadge giữ nguyên
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

    // Lọc ra file chờ nộp (pending)
    const pendingFiles = files.filter(f => f.approvalStatus === 'pending' && f.type === 'file')

    // TÍNH LẠI STATS TỪ MỌI NƠI
    const allFiles = evidence?.files || [];
    const approvedFiles = allFiles.filter(f => f.approvalStatus === 'approved').length;
    const rejectedFiles = allFiles.filter(f => f.approvalStatus === 'rejected').length;
    const totalPending = allFiles.filter(f => f.approvalStatus === 'pending').length; // Tổng pending

    return (
        <Layout breadcrumbItems={breadcrumbItems}>
            {/* ... (Header và Stats giữ nguyên, nhưng Stats nên dùng totalPending) */}
            <div className="space-y-6">
                {/* Header với role info */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <h1 className="text-3xl font-bold mb-2">Quản lý files minh chứng</h1>
                    <p className="text-blue-100 mb-3">
                        {evidence?.code} - {evidence?.name}
                    </p>

                    {/* Role Badge giữ nguyên */}
                    {/* ... */}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-600 text-sm font-semibold">Tổng Chờ duyệt</p>
                                <p className="text-3xl font-bold text-yellow-900">{totalPending}</p> {/* Dùng tổng pending */}
                            </div>
                            <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                    </div>
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 text-sm font-semibold">Đã duyệt</p>
                                <p className="text-3xl font-bold text-green-900">{approvedFiles}</p> {/* Dùng approvedFiles */}
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-600 text-sm font-semibold">Từ chối</p>
                                <p className="text-3xl font-bold text-red-900">{rejectedFiles}</p> {/* Dùng rejectedFiles */}
                            </div>
                            <XCircle className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* Breadcrumb và Action Buttons */}
                <div className="flex gap-3 flex-wrap items-center justify-between">
                    {/* Breadcrumb */}
                    <div className="flex items-center space-x-1 text-sm overflow-x-auto whitespace-nowrap py-1 bg-gray-100 p-2 rounded-xl border border-gray-200">
                        {folderPath.length > 1 && (
                            <button
                                onClick={handleNavigateBack}
                                className="p-1 rounded-full hover:bg-gray-200 text-gray-700"
                                title="Quay lại"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        )}
                        <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        {folderPath.map((item, index) => (
                            <span key={item.id} className="flex items-center">
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

                    {/* Action Buttons */}
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

                        {/* ... (Nút Duyệt/Từ chối hàng loạt giữ nguyên) ... */}
                        {canApprove && totalPending > 0 && (
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

                {/* Files/Folders Table */}
                {files.length > 0 ? (
                    <>
                        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                {/* ... (Thead giữ nguyên) */}
                                <tr className="bg-gray-50 border-b-2 border-gray-200">
                                    <th className="px-6 py-4 text-left">
                                        {/* Select All chỉ nên chọn files */}
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
                                                        {/* Manager: Duyệt/Từ chối nếu pending */}
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

                                                        {/* Tất cả người dùng: Download */}
                                                        <button
                                                            onClick={() => handleDownload(file._id, getSafeFileName(file.originalName || file.filename))}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                            title="Tải xuống"
                                                        >
                                                            <Download className="h-5 w-5" />
                                                        </button>

                                                        {/* TDG: Xóa file chưa nộp */}
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

                                                {/* Xóa folder */}
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

                        {/* Upload Guidelines giữ nguyên */}
                        {/* ... */}
                    </>
                ) : (
                    // ... (Chưa có file nào giữ nguyên) ...
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

            {/* Approval Modal giữ nguyên */}
            {/* ... */}

            {/* Create Folder Modal */}
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