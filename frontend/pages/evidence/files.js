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
    File,
    FileImage,
    FileSpreadsheet,
    Presentation,
    Loader2,
    ArrowLeft,
    Sparkles,
    X,
    Eye
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
    const [previewDataUri, setPreviewDataUri] = useState(null);

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

    const fetchAndDisplayFile = useCallback(async (file) => {
        setPreviewDataUri(null);
        setPreviewLoading(true);
        setPreviewFile(file);
        setShowPreviewModal(true);

        const fileExtension = file.extension?.replace('.', '')?.toLowerCase() || file.originalName.split('.').pop()?.toLowerCase();

        const isOfficeFile = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension);
        const isPdfFile = file.mimeType === 'application/pdf';

        // KHÔI PHỤC LOGIC STREAM CHO CẢ FILE OFFICE VÀ PDF
        if (isOfficeFile || isPdfFile) {
            const streamUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/files/stream/${file._id}?token=${authToken}`;
            setPreviewDataUri(streamUrl);
            setPreviewLoading(false);
            return;
        }
        // KẾT THÚC KHÔI PHỤC LOGIC

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
            const errorMessage = error.response?.data?.message || "Không thể tải nội dung file để xem trước. Kiểm tra lại kết nối và trạng thái file.";
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
                toast.success(`Upload thành công ${savedFilesCount} file.`)
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
        return <File className="h-8 w-8 text-gray-500" />
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
                                <File className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Quản lý Files</h2>
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
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase min-w-[100px]">Kích thước</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase min-w-[150px]">Người Upload</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase min-w-[150px]">Ngày giờ Upload</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase min-w-[150px]">Hành động</th>
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
                                                            <div className="text-xs text-gray-500 font-normal">
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
                                                            title="Xem trước"
                                                        />

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
                                Hướng dẫn upload files
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2">
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
                                    <span>Tên file tiếng Việt được hỗ trợ đầy đủ (không bị lỗi font)</span>
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>

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
                                    const isOfficeFile = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension);

                                    // KHÔI PHỤC: Sử dụng logic forceRemoteRender cho file Office
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

                                    const docs = [{
                                        uri: previewDataUri,
                                        fileName: previewFile.originalName,
                                        fileType: previewFile.mimeType,
                                    }];

                                    // KHÔI PHỤC: Thiết lập forceRemoteRender
                                    const forceRemoteRender = isOfficeFile && !previewDataUri.startsWith('data:');

                                    return (
                                        <div className="w-full h-full min-h-[500px] bg-white shadow-lg">
                                            <DocViewer
                                                prefetchMethod="GET"
                                                documents={docs}
                                                pluginRenderers={AllRenderers}
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
                                                    csvDelimiter: ',',

                                                    officeRenderer: { disableLocal: forceRemoteRender },
                                                    docxRenderer: { disableLocal: forceRemoteRender },
                                                    xlsxRenderer: { disableLocal: forceRemoteRender },
                                                    pptxRenderer: { disableLocal: forceRemoteRender },

                                                    csvRenderer: { disableRemote: true },

                                                }}
                                                style={{ height: "100%", width: "100%" }}
                                            />
                                        </div>
                                    )
                                })()
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}