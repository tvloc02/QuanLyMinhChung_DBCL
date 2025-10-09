import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react'
import { formatBytes, getFileIcon } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function FileUpload({
                                       accept = null,
                                       multiple = false,
                                       maxSize = 10 * 1024 * 1024, // 10MB
                                       maxFiles = 10,
                                       onUpload,
                                       disabled = false,
                                       className = ''
                                   }) {
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        // Handle rejected files
        rejectedFiles.forEach(({ file, errors }) => {
            errors.forEach(error => {
                if (error.code === 'file-too-large') {
                    toast.error(`File ${file.name} quá lớn. Kích thước tối đa: ${formatBytes(maxSize)}`)
                } else if (error.code === 'file-invalid-type') {
                    toast.error(`File ${file.name} không được hỗ trợ`)
                } else if (error.code === 'too-many-files') {
                    toast.error(`Chỉ có thể tải lên tối đa ${maxFiles} files`)
                }
            })
        })

        // Handle accepted files
        if (acceptedFiles.length > 0) {
            const newFiles = acceptedFiles.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                status: 'pending',
                progress: 0,
                error: null
            }))

            setFiles(prev => multiple ? [...prev, ...newFiles] : newFiles)
            toast.success(`Đã thêm ${acceptedFiles.length} file`)
        }
    }, [maxSize, maxFiles, multiple])

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragReject
    } = useDropzone({
        onDrop,
        accept,
        multiple,
        maxSize,
        maxFiles: multiple ? maxFiles : 1,
        disabled: disabled || uploading
    })

    const removeFile = (fileId) => {
        setFiles(prev => prev.filter(f => f.id !== fileId))
    }

    const uploadFiles = async () => {
        if (files.length === 0) {
            toast.error('Vui lòng chọn file để tải lên')
            return
        }

        setUploading(true)
        const uploadPromises = files.map(async (fileItem) => {
            try {
                // Update status
                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id
                        ? { ...f, status: 'uploading', progress: 0 }
                        : f
                ))

                // Simulate upload progress
                for (let progress = 0; progress <= 100; progress += 10) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                    setFiles(prev => prev.map(f =>
                        f.id === fileItem.id
                            ? { ...f, progress }
                            : f
                    ))
                }

                // Call upload handler
                if (onUpload) {
                    await onUpload(fileItem.file)
                }

                // Mark as completed
                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id
                        ? { ...f, status: 'completed', progress: 100 }
                        : f
                ))

                return { success: true, fileId: fileItem.id }
            } catch (error) {
                // Mark as error
                setFiles(prev => prev.map(f =>
                    f.id === fileItem.id
                        ? { ...f, status: 'error', error: error.message }
                        : f
                ))
                return { success: false, fileId: fileItem.id, error }
            }
        })

        try {
            const results = await Promise.all(uploadPromises)
            const successCount = results.filter(r => r.success).length
            const errorCount = results.filter(r => !r.success).length

            if (successCount > 0) {
                toast.success(`Tải lên thành công ${successCount} file`)
            }
            if (errorCount > 0) {
                toast.error(`Lỗi tải lên ${errorCount} file`)
            }
        } catch (error) {
            toast.error('Lỗi tải lên file')
        } finally {
            setUploading(false)
        }
    }

    const clearCompleted = () => {
        setFiles(prev => prev.filter(f => f.status !== 'completed'))
    }

    const clearAll = () => {
        setFiles([])
    }

    const getDropzoneClassName = () => {
        let baseClass = `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${className}`

        if (disabled || uploading) {
            return `${baseClass} border-gray-200 bg-gray-50 cursor-not-allowed`
        }

        if (isDragReject) {
            return `${baseClass} border-red-400 bg-red-50`
        }

        if (isDragActive) {
            return `${baseClass} border-blue-400 bg-blue-50`
        }

        return `${baseClass} border-gray-300 hover:border-gray-400 hover:bg-gray-50`
    }

    return (
        <div className="space-y-4">
            {/* Dropzone */}
            <div {...getRootProps()} className={getDropzoneClassName()}>
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />

                {isDragActive ? (
                    <div>
                        <p className="text-base text-blue-600 font-medium">
                            Thả file vào đây...
                        </p>
                    </div>
                ) : (
                    <div>
                        <p className="text-base text-gray-600 mb-2">
                            {multiple ? 'Kéo thả nhiều file vào đây' : 'Kéo thả file vào đây'} hoặc{' '}
                            <span className="text-blue-600 font-medium">click để chọn</span>
                        </p>
                        <p className="text-sm text-gray-500">
                            Kích thước tối đa: {formatBytes(maxSize)}
                            {multiple && ` • Tối đa ${maxFiles} files`}
                        </p>
                    </div>
                )}
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                            Danh sách file ({files.length})
                        </h3>
                        <div className="flex space-x-2">
                            {files.some(f => f.status === 'completed') && (
                                <button
                                    onClick={clearCompleted}
                                    className="text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Xóa file đã hoàn thành
                                </button>
                            )}
                            <button
                                onClick={clearAll}
                                className="text-sm text-red-600 hover:text-red-800"
                            >
                                Xóa tất cả
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {files.map((fileItem) => (
                            <div key={fileItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center flex-1 min-w-0">
                                    <File className="h-4 w-4 text-gray-500 mr-3 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {fileItem.file.name}
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>{formatBytes(fileItem.file.size)}</span>
                                            {fileItem.status === 'uploading' && (
                                                <span>Đang tải lên... {fileItem.progress}%</span>
                                            )}
                                            {fileItem.status === 'completed' && (
                                                <span className="text-green-600">Hoàn thành</span>
                                            )}
                                            {fileItem.status === 'error' && (
                                                <span className="text-red-600">Lỗi: {fileItem.error}</span>
                                            )}
                                        </div>
                                        {fileItem.status === 'uploading' && (
                                            <div className="mt-1 bg-gray-200 rounded-full h-1">
                                                <div
                                                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                                    style={{ width: `${fileItem.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                    {fileItem.status === 'completed' && (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                    {fileItem.status === 'error' && (
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    {fileItem.status !== 'uploading' && (
                                        <button
                                            onClick={() => removeFile(fileItem.id)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Upload Button */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={clearAll}
                            disabled={uploading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Xóa tất cả
                        </button>
                        <button
                            onClick={uploadFiles}
                            disabled={files.length === 0 || uploading || files.every(f => f.status === 'completed')}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Đang tải lên...' : `Tải lên (${files.filter(f => f.status === 'pending').length})`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}