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
    Sparkles
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

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl shadow-sm border-2 border-indigo-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-indigo-700 mb-1">Tổng files</p>
                                        <p className="text-4xl font-bold text-indigo-900">{files.length}</p>
                                    </div>
                                    <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <File className="h-8 w-8 text-indigo-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-sm border-2 border-green-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-700 mb-1">Tổng dung lượng</p>
                                        <p className="text-4xl font-bold text-green-900">
                                            {formatFileSize(files.reduce((acc, file) => acc + (file.size || 0), 0))}
                                        </p>
                                    </div>
                                    <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                                        <FileText className="h-8 w-8 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl shadow-sm border-2 border-purple-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-purple-700 mb-1">Lượt tải xuống</p>
                                        <p className="text-4xl font-bold text-purple-900">
                                            {files.reduce((acc, file) => acc + (file.downloadCount || 0), 0)}
                                        </p>
                                    </div>
                                    <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <Download className="h-8 w-8 text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Files List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Sparkles className="h-5 w-5 mr-2 text-indigo-600" />
                                    Danh sách files ({files.length})
                                </h3>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {files.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <File className="h-10 w-10 text-indigo-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có file nào được upload</h3>
                                        <p className="text-gray-500 mb-6">Bắt đầu bằng cách upload file đầu tiên</p>
                                        <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg cursor-pointer transition-all font-medium">
                                            <Upload className="h-5 w-5 mr-2" />
                                            Upload file đầu tiên
                                            <input
                                                type="file"
                                                multiple
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    files.map((file) => (
                                        <div key={file._id} className="p-6 hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4 flex-1">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        {getFileIcon(file.mimeType)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                                                            {file.originalName || file.filename}
                                                        </h4>
                                                        <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                                                                {formatFileSize(file.size)}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{file.uploadedBy?.fullName || 'N/A'}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(file.uploadedAt || file.createdAt)}</span>
                                                            <span>•</span>
                                                            <span className="flex items-center">
                                                                <Download className="h-3 w-3 mr-1" />
                                                                {file.downloadCount || 0} lượt tải
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleDownload(file._id, file.originalName || file.filename)}
                                                        className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(file._id)}
                                                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
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
                                    <span>Tên file nên rõ ràng, dễ hiểu để dễ quản lý</span>
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    )
}