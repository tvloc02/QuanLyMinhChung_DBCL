import { useState, useEffect } from 'react'
import {
    X,
    Download,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Maximize,
    FileText,
    AlertCircle,
    ExternalLink
} from 'lucide-react'
import { formatBytes, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function FileViewer({ file, onClose, onDownload }) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [zoom, setZoom] = useState(100)
    const [rotation, setRotation] = useState(0)
    const [fullscreen, setFullscreen] = useState(false)

    useEffect(() => {
        // Reset state when file changes
        setZoom(100)
        setRotation(0)
        setError(null)
        setLoading(true)

        // Simulate loading
        const timer = setTimeout(() => {
            setLoading(false)
        }, 1000)

        return () => clearTimeout(timer)
    }, [file])

    const handleDownload = async () => {
        try {
            if (onDownload) {
                await onDownload(file)
            } else {
                // Default download implementation
                const link = document.createElement('a')
                link.href = `/api/files/${file.id}/download`
                link.download = file.name
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success(`Đang tải xuống ${file.name}`)
            }
        } catch (error) {
            toast.error('Lỗi tải xuống file')
        }
    }

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 300))
    }

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 25))
    }

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360)
    }

    const handleFullscreen = () => {
        setFullscreen(!fullscreen)
    }

    const getFileType = () => {
        if (!file.type) return 'unknown'

        if (file.type.startsWith('image/')) return 'image'
        if (file.type === 'application/pdf') return 'pdf'
        if (file.type.startsWith('video/')) return 'video'
        if (file.type.startsWith('audio/')) return 'audio'
        if (file.type.startsWith('text/')) return 'text'
        if (file.type.includes('word') || file.type.includes('document')) return 'document'
        if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'spreadsheet'
        if (file.type.includes('powerpoint') || file.type.includes('presentation')) return 'presentation'

        return 'unknown'
    }

    const renderFileContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải file...</p>
                    </div>
                </div>
            )
        }

        if (error) {
            return (
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải file</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            )
        }

        const fileType = getFileType()
        const fileUrl = `/api/files/${file.id}/view`

        switch (fileType) {
            case 'image':
                return (
                    <div className="flex items-center justify-center min-h-96 bg-gray-50">
                        <img
                            src={fileUrl}
                            alt={file.name}
                            className="max-w-full max-h-full object-contain"
                            style={{
                                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                                transition: 'transform 0.2s ease-in-out'
                            }}
                            onError={() => setError('Không thể tải hình ảnh')}
                        />
                    </div>
                )

            case 'pdf':
                return (
                    <div className="h-96">
                        <iframe
                            src={`${fileUrl}#zoom=${zoom}`}
                            className="w-full h-full border-0"
                            title={file.name}
                            onError={() => setError('Không thể tải file PDF')}
                        />
                    </div>
                )

            case 'video':
                return (
                    <div className="flex items-center justify-center h-96 bg-black">
                        <video
                            src={fileUrl}
                            controls
                            className="max-w-full max-h-full"
                            style={{
                                transform: `scale(${zoom / 100})`,
                                transition: 'transform 0.2s ease-in-out'
                            }}
                            onError={() => setError('Không thể phát video')}
                        >
                            Trình duyệt không hỗ trợ video
                        </video>
                    </div>
                )

            case 'audio':
                return (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <audio
                                src={fileUrl}
                                controls
                                className="w-full max-w-md"
                                onError={() => setError('Không thể phát audio')}
                            >
                                Trình duyệt không hỗ trợ audio
                            </audio>
                        </div>
                    </div>
                )

            case 'text':
                return (
                    <div className="h-96 p-4 bg-gray-50">
                        <iframe
                            src={fileUrl}
                            className="w-full h-full border-0 bg-white rounded"
                            title={file.name}
                            onError={() => setError('Không thể tải file text')}
                        />
                    </div>
                )

            default:
                return (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Không thể xem trước file này
                            </h3>
                            <p className="text-gray-600 mb-4">
                                File {file.name} không hỗ trợ xem trước trực tiếp
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={handleDownload}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Tải xuống để xem
                                </button>
                                <div>
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Mở trong tab mới
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )
        }
    }

    const showControls = ['image', 'pdf', 'video'].includes(getFileType())

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 ${fullscreen ? '' : 'p-4'}`}>
            <div className={`bg-white rounded-lg shadow-xl ${fullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl max-h-full'} flex flex-col`}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        <FileText className="h-6 w-6 text-gray-400" />
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                                {file.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {formatBytes(file.size)} • {formatDate(file.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Controls */}
                        {showControls && (
                            <>
                                <button
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 25}
                                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                    title="Thu nhỏ"
                                >
                                    <ZoomOut className="h-5 w-5" />
                                </button>

                                <span className="text-sm text-gray-600 min-w-0">
                                    {zoom}%
                                </span>

                                <button
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 300}
                                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                    title="Phóng to"
                                >
                                    <ZoomIn className="h-5 w-5" />
                                </button>

                                {getFileType() === 'image' && (
                                    <button
                                        onClick={handleRotate}
                                        className="p-2 text-gray-500 hover:text-gray-700"
                                        title="Xoay"
                                    >
                                        <RotateCw className="h-5 w-5" />
                                    </button>
                                )}

                                <button
                                    onClick={handleFullscreen}
                                    className="p-2 text-gray-500 hover:text-gray-700"
                                    title="Toàn màn hình"
                                >
                                    <Maximize className="h-5 w-5" />
                                </button>
                            </>
                        )}

                        <button
                            onClick={handleDownload}
                            className="p-2 text-gray-500 hover:text-gray-700"
                            title="Tải xuống"
                        >
                            <Download className="h-5 w-5" />
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700"
                            title="Đóng"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {renderFileContent()}
                </div>

                {/* Footer - File Info */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                            <span>Loại: {file.type || 'Không xác định'}</span>
                            <span>Kích thước: {formatBytes(file.size)}</span>
                            <span>Cập nhật: {formatDate(file.updatedAt)}</span>
                        </div>

                        {file.description && (
                            <div className="max-w-md truncate">
                                <span className="font-medium">Mô tả:</span> {file.description}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}