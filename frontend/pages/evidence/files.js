import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { formatDate, formatFileSize } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../lib/api'
import {
    FileText,
    Upload,
    Download,
    Trash2,
    Eye,
    Search,
    Filter,
    RefreshCw,
    File,
    FileImage,
    FileSpreadsheet,
    Presentation
} from 'lucide-react'

export default function FilesPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { evidenceId } = router.query

    const [loading, setLoading] = useState(true)
    const [evidence, setEvidence] = useState(null)
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)

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

            setEvidence(response.data.data)
            setFiles(response.data.data.files || [])
        } catch (error) {
            console.error('Fetch data error:', error)
            toast.error('Lỗi khi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0) {
            handleUpload(files)
        }
    }

    const handleUpload = async (filesToUpload) => {
        try {
            setUploading(true)

            const response = await apiMethods.files.upload(evidenceId, filesToUpload)

            if (response.data.success) {
                toast.success(response.data.message)
                fetchData()
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi upload file')
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
            toast.error('Lỗi khi tải file')
        }
    }

    const handleDelete = async (fileId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa file này?')) {
            return
        }

        try {
            const response = await apiMethods.files.delete(fileId)

            if (response.data.success) {
                toast.success(response.data.message)
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
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (!evidenceId) {
        return (
            <Layout title="Files minh chứng" breadcrumbItems={breadcrumbItems}>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">Vui lòng chọn minh chứng để quản lý files</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout
            title="Quản lý files minh chứng"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý files minh chứng</h1>
                        {evidence && (
                            <p className="text-gray-600 mt-1">
                                <span className="font-medium">{evidence.code}</span> - {evidence.name}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>

                        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 cursor-pointer disabled:opacity-50">
                            <Upload className="h-4 w-4 mr-2" />
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

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Tổng files</p>
                                        <p className="text-3xl font-bold text-gray-900">{files.length}</p>
                                    </div>
                                    <div className="p-3 rounded-full bg-blue-500">
                                        <File className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Tổng dung lượng</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {formatFileSize(files.reduce((acc, file) => acc + (file.size || 0), 0))}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-full bg-green-500">
                                        <FileText className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Lượt tải xuống</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {files.reduce((acc, file) => acc + (file.downloadCount || 0), 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-full bg-purple-500">
                                        <Download className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Files List */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Danh sách files ({files.length})
                                </h3>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {files.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 mb-4">Chưa có file nào được upload</p>
                                        <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 cursor-pointer">
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload file đầu tiên
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    files.map((file) => (
                                        <div key={file._id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 flex-1">
                                                    <div className="flex-shrink-0">
                                                        {getFileIcon(file.mimeType)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                                            {file.originalName}
                                                        </h4>
                                                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                                            <span>{formatFileSize(file.size)}</span>
                                                            <span>•</span>
                                                            <span>{file.uploadedBy?.fullName || 'N/A'}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(file.uploadedAt)}</span>
                                                            <span>•</span>
                                                            <span>{file.downloadCount || 0} lượt tải</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleDownload(file._id, file.storedName)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(file._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Upload Guidelines */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Hướng dẫn upload files</h4>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>Các định dạng được hỗ trợ: PDF, Word, Excel, PowerPoint, Text, Image (JPG, PNG, GIF)</li>
                                <li>Kích thước tối đa mỗi file: 50MB</li>
                                <li>Số lượng file tối đa trong mỗi lần upload: 10 files</li>
                                <li>Tên file nên rõ ràng, dễ hiểu để dễ quản lý</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )
}