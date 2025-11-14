import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { formatDate, formatFileSize, getLocalStorage } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import {
    FileText,
    Upload,
    Download,
    Trash2,
    RefreshCw,
    File as FileIcon,
    FileImage,
    FileSpreadsheet,
    Presentation,
    Loader2,
    ArrowLeft,
    Sparkles,
    X,
    Eye,
    CheckCircle,
    BookOpen,
    Cpu,
    User
} from 'lucide-react'

import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer"
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

import { ActionButton } from '../../components/ActionButtons'

const AllRenderers = DocViewerRenderers;

export default function FilesPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { evidenceId } = router.query

    const [loading, setLoading] = useState(true)
    const [evidence, setEvidence] = useState(null)
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [previewFile, setPreviewFile] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewDataUri, setPreviewDataUri] = useState(null)

    // States cho content và summary
    const [showContentModal, setShowContentModal] = useState(false)
    const [fileContent, setFileContent] = useState(null)
    const [contentLoading, setContentLoading] = useState(false)

    const isAdmin = user?.role === 'admin'
    const isManager = user?.role === 'manager'
    const currentUserId = user?._id?.toString()

    const authToken = typeof window !== 'undefined' ? getLocalStorage('token') : null;

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
        { name: 'Files đính kèm', icon: FileIcon }
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

    const fetchFileContent = async (fileId) => {
        setContentLoading(true)
        setFileContent(null)
        setShowContentModal(true)

        try {
            const response = await apiMethods.files.getContent(fileId)
            if (response.data?.success) {
                setFileContent(response.data.data)
            } else {
                toast.error('Không thể lấy nội dung file')
                setShowContentModal(false)
            }
        } catch (error) {
            console.error('Fetch content error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi lấy nội dung file')
            setShowContentModal(false)
        } finally {
            setContentLoading(false)
        }
    }

    const reprocessFile = async (fileId) => {
        try {
            const response = await apiMethods.files.reprocess(fileId)
            if (response.data?.success) {
                toast.success('Đang xử lý lại file...')
                // Refresh sau 3 giây
                setTimeout(() => {
                    fetchData()
                }, 3000)
            }
        } catch (error) {
            toast.error('Lỗi khi xử lý lại file')
        }
    }

    // Xử lý preview cho PDF
    const previewPdfFile = (streamUrl) => {
        const docs = [{
            uri: streamUrl,
            fileName: previewFile.originalName,
            fileType: 'application/pdf',
        }];

        return (
            <div className="w-full h-full min-h-[500px] bg-white shadow-lg">
                <DocViewer
                    prefetchMethod="GET"
                    documents={docs}
                    pluginRenderers={AllRenderers}
                    requestHeaders={{
                        Authorization: `Bearer ${authToken}`,
                    }}
                    config={{
                        header: {
                            disableFileName: true,
                            disableHeader: true,
                        },
                        pdfVerticalScrollByDefault: true,
                        pdfZoom: {
                            defaultZoom: 0.8,
                            zoomJump: 0.2,
                        },
                    }}
                    style={{ height: "100%", width: "100%" }}
                />
            </div>
        );
    };

    // Xử lý preview cho Excel
    const previewExcelFile = (streamUrl) => {
        const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(streamUrl)}`;
        return (
            <div className="w-full h-full min-h-[500px] bg-white shadow-lg">
                <iframe
                    src={officeUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    title={previewFile.originalName}
                    style={{ minHeight: '70vh' }}
                >
                    This is an embedded <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>.
                </iframe>
            </div>
        );
    };

    // Xử lý preview cho Word
    const previewWordFile = (streamUrl) => {
        const docs = [{ uri: streamUrl, fileName: previewFile.originalName }];
        return (
            <div className="w-full h-full min-h-[500px] bg-white shadow-lg">
                <DocViewer
                    prefetchMethod="GET"
                    documents={docs}
                    pluginRenderers={AllRenderers}
                    requestHeaders={{
                        Authorization: `Bearer ${authToken}`,
                    }}
                    config={{
                        header: {
                            disableFileName: true,
                            disableHeader: true,
                        },
                    }}
                    style={{ height: "100%", width: "100%" }}
                />
            </div>
        );
    };

    // Xử lý preview cho ảnh
    const previewImageFile = (dataUri) => {
        return (
            <div className="w-full h-full min-h-[500px] bg-gray-200 shadow-lg flex items-center justify-center p-4">
                <img
                    src={dataUri}
                    alt={previewFile.originalName}
                    className="max-w-full max-h-full object-contain"
                />
            </div>
        );
    };

    // Xử lý preview cho Text/CSV
    const previewTextFile = (dataUri) => {
        return (
            <div className="w-full h-full min-h-[500px] bg-white shadow-lg p-6 overflow-y-auto">
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap break-words">
                    {atob(dataUri.split(',')[1])}
                </div>
            </div>
        );
    };

    const fetchAndDisplayFile = useCallback(async (file) => {
        setPreviewDataUri(null);
        setPreviewLoading(true);
        setPreviewFile(file);
        setShowPreviewModal(true);

        const fileExtension = file.extension?.replace('.', '')?.toLowerCase() || file.originalName.split('.').pop()?.toLowerCase();

        const isOfficeFile = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension);
        const isPdfFile = file.mimeType === 'application/pdf';
        const isImageFile = file.mimeType?.startsWith('image/');
        const isTextFile = ['txt', 'csv'].includes(fileExtension);

        // Dùng stream URL cho PDF, Office files
        if (isOfficeFile || isPdfFile) {
            const streamUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/files/stream/${file._id}`;
            setPreviewDataUri(streamUrl);
            setPreviewLoading(false);
            return;
        }

        // Các file khác convert thành data URI
        try {
            const response = await apiMethods.files.download(file._id);
            const blob = new Blob([response.data], { type: file.mimeType });

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                setPreviewDataUri(reader.result);
                setPreviewLoading(false);
            };
            reader.onerror = (e) => {
                console.error("FileReader error:", e);
                toast.error("Lỗi khi đọc file.");
                setPreviewLoading(false);
            }

        } catch (error) {
            console.error('File fetch for preview error:', error);
            const errorMessage = error.response?.data?.message || "Lỗi server: Không thể tải nội dung file.";
            toast.error(errorMessage);
            setPreviewLoading(false);
            setPreviewFile(null);
            setShowPreviewModal(false);
        }
    }, [authToken]);

    const handlePreviewClick = (file) => {
        fetchAndDisplayFile(file);
    }

    const isFileViewable = (file) => {
        if (!file) return false;

        const viewableMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
            'application/vnd.oasis.opendocument.text',
            'application/vnd.oasis.opendocument.spreadsheet'
        ];

        if (file.mimeType?.startsWith('image/')) return true;
        const extension = file.originalName.split('.').pop()?.toLowerCase();
        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt', 'csv'].includes(extension)) return true;

        return viewableMimes.includes(file.mimeType);
    };

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
            const response = await apiMethods.files.uploadMultiple(filesToUpload, evidenceId)

            if (response.data?.success) {
                const savedFilesCount = response.data.data?.length || 0
                toast.success(`Upload thành công ${savedFilesCount} file. Đang xử lý nội dung...`)
                fetchData()
            } else {
                toast.error(response.data?.message || 'Upload thất bại')
            }

        } catch (error) {
            console.error('Upload error:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi khi upload file'
            toast.error(errorMessage)
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

    const handleDelete = async (fileId, uploadedBy) => {
        if (!confirm('Bạn có chắc chắn muốn xóa file này?')) {
            return
        }

        const isUploader = currentUserId && uploadedBy && uploadedBy.toString() === currentUserId
        const hasManagerRole = isAdmin || isManager
        const canDelete = hasManagerRole || isUploader

        if (!canDelete) {
            toast.error('Bạn không có quyền xóa file này.')
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
        return <FileIcon className="h-8 w-8 text-gray-500" />
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
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <FileIcon className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Quản lý Files</h2>
                                <p className="text-blue-100">Với AI tóm tắt nội dung</p>
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

                            <label className={`inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} transition-all font-medium shadow-lg`}>
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Sparkles className="h-5 w-5 mr-2" />
                                    Danh sách files ({files.length})
                                </h3>
                            </div>

                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase w-12">STT</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tên file</th>

                                    {/* === CỘT MỚI: NGƯỜI UPLOAD === */}
                                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase min-w-[180px]">Người upload</th>

                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase min-w-[100px]">Kích thước</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase min-w-[150px]">Ngày upload</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase min-w-[200px]">Hành động</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {files.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-16 text-center text-gray-500">
                                            Chưa có file nào được upload.
                                        </td>
                                    </tr>
                                ) : (
                                    files.map((file, index) => {
                                        const isUploader = currentUserId && file.uploadedBy?._id?.toString() === currentUserId
                                        const hasManagerRole = isAdmin || isManager
                                        const canDelete = hasManagerRole || isUploader

                                        return (
                                            <tr key={file._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-2 py-4 text-center text-sm text-gray-600">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        {getFileIcon(file.mimeType)}
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-900" title={file.originalName}>
                                                                {file.originalName}
                                                            </div>
                                                            {/* Đã xóa dòng người upload nhỏ ở đây để chuyển sang cột riêng */}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* === CỘT MỚI: NGƯỜI UPLOAD === */}
                                                <td className="px-3 py-4 text-left">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center text-sm font-medium text-gray-900">
                                                            <User className="w-3 h-3 mr-1 text-gray-400" />
                                                            {file.uploadedBy?.fullName || 'N/A'}
                                                        </div>
                                                        {file.uploadedBy?.email && (
                                                            <div className="text-xs text-gray-500 ml-4">
                                                                {file.uploadedBy.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-3 py-4 text-center text-sm text-gray-600">
                                                    {formatFileSize(file.size)}
                                                </td>
                                                <td className="px-3 py-4 text-center text-xs font-medium text-gray-600">
                                                    {formatDate(file.uploadedAt, 'dd/MM/yyyy HH:mm')}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <ActionButton
                                                            icon={Eye}
                                                            variant="view"
                                                            size="sm"
                                                            onClick={() => handlePreviewClick(file)}
                                                            title="Xem file (Preview)"
                                                        />

                                                        {/* Nút xem Tóm tắt/Nội dung AI */}
                                                        {file.processStatus === 'completed' && (
                                                            <button
                                                                onClick={() => fetchFileContent(file._id)}
                                                                title="Xem Tóm tắt & Nội dung AI"
                                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all ring-1 ring-purple-100"
                                                            >
                                                                <Sparkles className="h-5 w-5" />
                                                            </button>
                                                        )}

                                                        {/* Nút xử lý lại nếu lỗi */}
                                                        {file.processStatus === 'failed' && (
                                                            <button
                                                                onClick={() => reprocessFile(file._id)}
                                                                title="Xử lý lại AI"
                                                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                                                            >
                                                                <Cpu className="h-5 w-5" />
                                                            </button>
                                                        )}

                                                        <ActionButton
                                                            icon={Download}
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleDownload(file._id, file.originalName)}
                                                            title="Tải xuống"
                                                        />

                                                        <button
                                                            onClick={() => handleDelete(file._id, file.uploadedBy?._id)}
                                                            title="Xóa"
                                                            disabled={!canDelete}
                                                            className={`p-2 rounded-xl transition-all ${
                                                                !canDelete
                                                                    ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                                                                    : 'text-red-600 hover:bg-red-50'
                                                            }`}
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                                <Sparkles className="h-5 w-5 mr-2" />
                                Hướng dẫn sử dụng
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Hệ thống tự động trích xuất và tóm tắt nội dung file sau khi upload.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Nhấn vào biểu tượng <strong><Sparkles className="inline w-4 h-4"/></strong> để xem tóm tắt và nội dung chi tiết.</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Nhấn vào biểu tượng <strong><Eye className="inline w-4 h-4"/></strong> để xem trước file gốc.</span>
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>

            {/* Modal xem nội dung văn bản & Tóm tắt */}
            {showContentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <BookOpen className="h-6 w-6" />
                                <h3 className="text-lg font-bold">Nội dung & Tóm tắt AI</h3>
                            </div>
                            <button
                                onClick={() => setShowContentModal(false)}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {contentLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                </div>
                            ) : fileContent ? (
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-purple-200">
                                        <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center">
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Tóm tắt bởi AI
                                        </h4>
                                        <p className="text-gray-700">
                                            {fileContent.summary || 'Chưa có tóm tắt'}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold text-gray-900">
                                                Thông tin file
                                            </h4>
                                            {fileContent.processStatus === 'completed' && (
                                                <span className="text-xs text-green-600 flex items-center">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Đã vector hóa
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Tên file:</span>
                                                <p className="font-medium">{fileContent.originalName}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Người upload:</span>
                                                <p className="font-medium">{fileContent.uploadedBy?.fullName || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                            Nội dung trích xuất (5000 ký tự đầu)
                                        </h4>
                                        <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                                                {fileContent.content || 'Không có nội dung'}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    Không có dữ liệu hoặc file chưa được xử lý.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal preview file gốc */}
            {showPreviewModal && previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                {getFileIcon(previewFile.mimeType)}
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold truncate">{previewFile.originalName}</h3>
                                    <p className="text-sm text-blue-100">{formatFileSize(previewFile.size)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleDownload(previewFile._id, previewFile.originalName)}
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

                        <div className="flex-1 overflow-y-auto bg-gray-100 p-2 sm:p-4">
                            {previewLoading || !previewDataUri ? (
                                <div className="flex items-center justify-center w-full h-full min-h-[500px]">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                                        <p className="text-gray-600">Đang tải nội dung file...</p>
                                    </div>
                                </div>
                            ) : (
                                (() => {
                                    const isSupported = isFileViewable(previewFile);
                                    const fileExtension = previewFile.extension?.replace('.', '')?.toLowerCase() || previewFile.originalName.split('.').pop()?.toLowerCase();
                                    const isPdfFile = previewFile.mimeType === 'application/pdf';
                                    const isExcelFile = ['xls', 'xlsx'].includes(fileExtension);
                                    const isWordFile = ['doc', 'docx'].includes(fileExtension);
                                    const isImageFile = previewFile.mimeType?.startsWith('image/');
                                    const isTextFile = ['txt', 'csv'].includes(fileExtension);

                                    if (!isSupported) {
                                        return (
                                            <div className="flex items-center justify-center h-full p-4">
                                                <div className="text-center bg-white rounded-lg p-8">
                                                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                                    <p className="text-gray-600 mb-4">
                                                        Định dạng file này không hỗ trợ xem trực tiếp
                                                    </p>
                                                    <button
                                                        onClick={() => handleDownload(previewFile._id, previewFile.originalName)}
                                                        className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Download className="h-5 w-5 mr-2" />
                                                        Tải xuống file
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    }

                                    if (isPdfFile) {
                                        return previewPdfFile(previewDataUri);
                                    }

                                    if (isExcelFile) {
                                        return previewExcelFile(previewDataUri);
                                    }

                                    if (isWordFile) {
                                        return previewWordFile(previewDataUri);
                                    }

                                    if (isImageFile) {
                                        return previewImageFile(previewDataUri);
                                    }

                                    if (isTextFile) {
                                        return previewTextFile(previewDataUri);
                                    }

                                    return (
                                        <div className="flex items-center justify-center h-full p-4">
                                            <div className="text-center">
                                                <FileIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-600">Không thể xem trước file này</p>
                                            </div>
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}