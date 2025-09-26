import { useState, useCallback, useRef } from 'react'
import { Folder, Upload, X, File, CheckCircle, AlertCircle, FolderPlus } from 'lucide-react'
import { formatBytes, getFileExtension } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function FolderUpload({
                                         onUpload,
                                         onFolderStructureChange,
                                         maxFiles = 100,
                                         maxFolderDepth = 5,
                                         disabled = false,
                                         className = ''
                                     }) {
    const [folderStructure, setFolderStructure] = useState(null)
    const [uploadProgress, setUploadProgress] = useState({})
    const [uploading, setUploading] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef(null)

    // Process folder structure from FileList
    const processFolderStructure = useCallback((files) => {
        const structure = {}
        let totalSize = 0
        let fileCount = 0

        Array.from(files).forEach(file => {
            const pathParts = file.webkitRelativePath.split('/')
            const fileName = pathParts.pop()
            let current = structure

            // Build folder structure
            pathParts.forEach((part, index) => {
                if (!current[part]) {
                    current[part] = {
                        type: 'folder',
                        name: part,
                        children: {},
                        path: pathParts.slice(0, index + 1).join('/'),
                        size: 0,
                        fileCount: 0
                    }
                }
                current = current[part].children
            })

            // Add file to structure
            current[fileName] = {
                type: 'file',
                name: fileName,
                file: file,
                path: file.webkitRelativePath,
                size: file.size,
                extension: getFileExtension(fileName),
                lastModified: file.lastModified
            }

            totalSize += file.size
            fileCount++
        })

        // Calculate folder sizes and file counts
        const calculateFolderStats = (node) => {
            if (node.type === 'file') return { size: node.size, count: 1 }

            let totalSize = 0
            let totalCount = 0

            Object.values(node.children).forEach(child => {
                const stats = calculateFolderStats(child)
                totalSize += stats.size
                totalCount += stats.count
            })

            node.size = totalSize
            node.fileCount = totalCount

            return { size: totalSize, count: totalCount }
        }

        Object.values(structure).forEach(calculateFolderStats)

        return {
            structure,
            totalSize,
            fileCount,
            folderCount: Object.keys(structure).length
        }
    }, [])

    // Handle folder selection
    const handleFolderSelect = useCallback((files) => {
        if (files.length === 0) return

        // Check if files have relative paths (folder upload)
        const hasRelativePaths = Array.from(files).some(file => file.webkitRelativePath)

        if (!hasRelativePaths) {
            toast.error('Vui lòng chọn thư mục thay vì file riêng lẻ')
            return
        }

        // Check file count limit
        if (files.length > maxFiles) {
            toast.error(`Số lượng file vượt quá giới hạn (${maxFiles})`)
            return
        }

        // Check folder depth
        const maxDepth = Math.max(...Array.from(files).map(file =>
            file.webkitRelativePath.split('/').length - 1
        ))

        if (maxDepth > maxFolderDepth) {
            toast.error(`Độ sâu thư mục vượt quá giới hạn (${maxFolderDepth} cấp)`)
            return
        }

        const processed = processFolderStructure(files)
        setFolderStructure(processed)
        onFolderStructureChange?.(processed)

        toast.success(`Đã chọn thư mục với ${processed.fileCount} file`)
    }, [maxFiles, maxFolderDepth, processFolderStructure, onFolderStructureChange])

    // Handle file input change
    const handleFileInputChange = (e) => {
        const files = e.target.files
        if (files && files.length > 0) {
            handleFolderSelect(files)
        }
    }

    // Handle drag and drop
    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)

        const items = e.dataTransfer.items
        const files = []

        // Process dropped items
        const processEntry = (entry, path = '') => {
            return new Promise((resolve) => {
                if (entry.isFile) {
                    entry.file((file) => {
                        // Add webkitRelativePath to maintain folder structure
                        Object.defineProperty(file, 'webkitRelativePath', {
                            value: path + file.name,
                            writable: false
                        })
                        files.push(file)
                        resolve()
                    })
                } else if (entry.isDirectory) {
                    const dirReader = entry.createReader()
                    dirReader.readEntries(async (entries) => {
                        await Promise.all(
                            entries.map(childEntry =>
                                processEntry(childEntry, path + entry.name + '/')
                            )
                        )
                        resolve()
                    })
                } else {
                    resolve()
                }
            })
        }

        const processItems = async () => {
            const promises = []
            for (let i = 0; i < items.length; i++) {
                const entry = items[i].webkitGetAsEntry()
                if (entry) {
                    promises.push(processEntry(entry))
                }
            }

            await Promise.all(promises)

            if (files.length > 0) {
                handleFolderSelect(files)
            } else {
                toast.error('Không tìm thấy file nào trong thư mục')
            }
        }

        processItems().catch(error => {
            console.error('Error processing dropped items:', error)
            toast.error('Lỗi xử lý thư mục được kéo thả')
        })
    }, [handleFolderSelect])

    // Upload folder
    const handleUpload = async () => {
        if (!folderStructure || !onUpload) return

        try {
            setUploading(true)
            const allFiles = []

            // Extract all files from structure
            const extractFiles = (node, currentPath = '') => {
                if (node.type === 'file') {
                    allFiles.push({
                        file: node.file,
                        path: node.path
                    })
                } else {
                    Object.values(node.children).forEach(child =>
                        extractFiles(child, node.path)
                    )
                }
            }

            Object.values(folderStructure.structure).forEach(node =>
                extractFiles(node)
            )

            // Upload files with progress tracking
            for (let i = 0; i < allFiles.length; i++) {
                const { file, path } = allFiles[i]

                try {
                    setUploadProgress(prev => ({
                        ...prev,
                        [path]: { status: 'uploading', progress: 0 }
                    }))

                    await onUpload(file, {
                        preservePath: true,
                        relativePath: path,
                        onProgress: (progress) => {
                            setUploadProgress(prev => ({
                                ...prev,
                                [path]: { status: 'uploading', progress }
                            }))
                        }
                    })

                    setUploadProgress(prev => ({
                        ...prev,
                        [path]: { status: 'completed', progress: 100 }
                    }))
                } catch (error) {
                    setUploadProgress(prev => ({
                        ...prev,
                        [path]: { status: 'error', progress: 0, error: error.message }
                    }))
                }
            }

            const successCount = Object.values(uploadProgress).filter(p => p.status === 'completed').length
            const errorCount = Object.values(uploadProgress).filter(p => p.status === 'error').length

            if (errorCount === 0) {
                toast.success(`Tải lên thành công ${successCount} file`)
            } else {
                toast.error(`Tải lên ${successCount} file, ${errorCount} file lỗi`)
            }
        } catch (error) {
            toast.error('Lỗi tải lên thư mục')
        } finally {
            setUploading(false)
        }
    }

    // Clear selection
    const handleClear = () => {
        setFolderStructure(null)
        setUploadProgress({})
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Render folder tree
    const renderFolderTree = (structure, level = 0) => {
        return Object.entries(structure).map(([key, node]) => (
            <div key={node.path || key} style={{ marginLeft: level * 20 }}>
                <div className="flex items-center py-1">
                    {node.type === 'folder' ? (
                        <>
                            <Folder className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                                {node.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                                ({node.fileCount} files, {formatBytes(node.size)})
                            </span>
                        </>
                    ) : (
                        <>
                            <File className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">
                                {node.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                                {formatBytes(node.size)}
                            </span>
                            {uploadProgress[node.path] && (
                                <div className="ml-2 flex items-center">
                                    {uploadProgress[node.path].status === 'uploading' && (
                                        <div className="w-16 bg-gray-200 rounded-full h-1">
                                            <div
                                                className="bg-blue-600 h-1 rounded-full transition-all"
                                                style={{ width: `${uploadProgress[node.path].progress}%` }}
                                            />
                                        </div>
                                    )}
                                    {uploadProgress[node.path].status === 'completed' && (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                    {uploadProgress[node.path].status === 'error' && (
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {node.type === 'folder' && node.children && (
                    <div>
                        {renderFolderTree(node.children, level + 1)}
                    </div>
                )}
            </div>
        ))
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragOver
                        ? 'border-blue-400 bg-blue-50'
                        : disabled
                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    webkitdirectory=""
                    multiple
                    onChange={handleFileInputChange}
                    disabled={disabled}
                    className="hidden"
                />

                <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />

                <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                        {isDragOver
                            ? 'Thả thư mục vào đây...'
                            : 'Chọn hoặc kéo thả thư mục'
                        }
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                        Hỗ trợ tải lên toàn bộ cấu trúc thư mục với tất cả file bên trong
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>• Tối đa {maxFiles} file</p>
                        <p>• Độ sâu thư mục tối đa {maxFolderDepth} cấp</p>
                        <p>• Giữ nguyên cấu trúc thư mục gốc</p>
                    </div>
                </div>
            </div>

            {/* Folder Structure Preview */}
            {folderStructure && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                Cấu trúc thư mục
                            </h3>
                            <p className="text-sm text-gray-600">
                                {folderStructure.fileCount} file trong {folderStructure.folderCount} thư mục
                                • Tổng dung lượng: {formatBytes(folderStructure.totalSize)}
                            </p>
                        </div>
                        <button
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600"
                            title="Xóa lựa chọn"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-100 rounded p-3 bg-gray-50">
                        {renderFolderTree(folderStructure.structure)}
                    </div>

                    {/* Upload Actions */}
                    <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                        <button
                            onClick={handleClear}
                            disabled={uploading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Đang tải lên...' : `Tải lên thư mục`}
                        </button>
                    </div>
                </div>
            )}

            {/* Upload Progress Summary */}
            {Object.keys(uploadProgress).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Tiến trình tải lên
                    </h4>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                                {Object.values(uploadProgress).filter(p => p.status === 'completed').length}
                            </div>
                            <div className="text-blue-600">Thành công</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-yellow-600">
                                {Object.values(uploadProgress).filter(p => p.status === 'uploading').length}
                            </div>
                            <div className="text-yellow-600">Đang tải</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-red-600">
                                {Object.values(uploadProgress).filter(p => p.status === 'error').length}
                            </div>
                            <div className="text-red-600">Lỗi</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}