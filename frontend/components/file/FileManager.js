import { useState, useEffect } from 'react'
import {
    Folder,
    File,
    Upload,
    Download,
    Trash2,
    Eye,
    Search,
    Grid,
    List,
    Plus,
    X,
    MoreVertical,
    Edit,
    Copy,
    Move
} from 'lucide-react'
import FileUpload from './FileUpLoad'
import FileViewer from './FileViewer'
import { ConfirmModal } from '../common/Modal'
import { formatBytes, formatDate, getFileIcon } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function FileManager({
                                        evidenceId = null,
                                        allowUpload = true,
                                        allowDelete = true,
                                        allowEdit = true,
                                        onFileSelect = null,
                                        multiSelect = false
                                    }) {
    const [files, setFiles] = useState([])
    const [folders, setFolders] = useState([])
    const [currentPath, setCurrentPath] = useState('/')
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('grid') // grid or list
    const [selectedFiles, setSelectedFiles] = useState([])
    const [showUpload, setShowUpload] = useState(false)
    const [showViewer, setShowViewer] = useState(false)
    const [currentFile, setCurrentFile] = useState(null)
    const [deleteModal, setDeleteModal] = useState({ show: false, files: [] })
    const [actionMenu, setActionMenu] = useState({ show: false, file: null, position: { x: 0, y: 0 } })

    useEffect(() => {
        fetchFiles()
    }, [currentPath, evidenceId])

    const fetchFiles = async () => {
        try {
            setLoading(true)
            // Mock data - replace with actual API call
            const mockFiles = [
                {
                    id: '1',
                    name: 'Document1.pdf',
                    type: 'application/pdf',
                    size: 2048576,
                    createdAt: '2024-12-25T10:00:00Z',
                    updatedAt: '2024-12-25T10:00:00Z',
                    path: currentPath,
                    isFolder: false,
                    thumbnail: null
                },
                {
                    id: '2',
                    name: 'Image1.jpg',
                    type: 'image/jpeg',
                    size: 1024576,
                    createdAt: '2024-12-24T15:30:00Z',
                    updatedAt: '2024-12-24T15:30:00Z',
                    path: currentPath,
                    isFolder: false,
                    thumbnail: '/api/files/2/thumbnail'
                },
                {
                    id: 'folder1',
                    name: 'Subfolder',
                    type: 'folder',
                    size: 0,
                    createdAt: '2024-12-23T12:00:00Z',
                    updatedAt: '2024-12-25T09:00:00Z',
                    path: currentPath,
                    isFolder: true,
                    itemCount: 5
                }
            ]

            const filteredFiles = mockFiles.filter(file =>
                !searchQuery || file.name.toLowerCase().includes(searchQuery.toLowerCase())
            )

            const folderItems = filteredFiles.filter(item => item.isFolder)
            const fileItems = filteredFiles.filter(item => !item.isFolder)

            setFolders(folderItems)
            setFiles(fileItems)
        } catch (error) {
            toast.error('Lỗi tải danh sách file')
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = async (file) => {
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (evidenceId) {
                formData.append('evidenceId', evidenceId)
            }
            formData.append('path', currentPath)

            const response = await apiMethods.uploadFile(formData)
            if (response.data.success) {
                toast.success(`Tải lên ${file.name} thành công`)
                fetchFiles()
                return response.data.data
            }
        } catch (error) {
            throw new Error('Upload thất bại')
        }
    }

    const handleFileClick = (file) => {
        if (onFileSelect) {
            onFileSelect(file)
            return
        }

        if (file.isFolder) {
            setCurrentPath(`${currentPath}${file.name}/`)
        } else {
            setCurrentFile(file)
            setShowViewer(true)
        }
    }

    const handleFileSelect = (file) => {
        if (!multiSelect) {
            setSelectedFiles([file.id])
            return
        }

        setSelectedFiles(prev => {
            if (prev.includes(file.id)) {
                return prev.filter(id => id !== file.id)
            } else {
                return [...prev, file.id]
            }
        })
    }

    const handleSelectAll = () => {
        const allIds = [...folders, ...files].map(item => item.id)
        setSelectedFiles(selectedFiles.length === allIds.length ? [] : allIds)
    }

    const handleDownloadFile = async (file) => {
        try {
            const response = await apiMethods.downloadFile(file.id)

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.download = file.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success(`Đang tải xuống ${file.name}`)
        } catch (error) {
            toast.error('Lỗi tải xuống file')
        }
    }

    const handleDeleteFiles = async () => {
        try {
            const filesToDelete = deleteModal.files
            await Promise.all(filesToDelete.map(fileId => apiMethods.deleteFile(fileId)))

            toast.success(`Đã xóa ${filesToDelete.length} file`)
            fetchFiles()
            setSelectedFiles([])
        } catch (error) {
            toast.error('Lỗi xóa file')
        }
        setDeleteModal({ show: false, files: [] })
    }

    const handleContextMenu = (e, file) => {
        e.preventDefault()
        setActionMenu({
            show: true,
            file,
            position: { x: e.clientX, y: e.clientY }
        })
    }

    const closeActionMenu = () => {
        setActionMenu({ show: false, file: null, position: { x: 0, y: 0 } })
    }

    const getBreadcrumbs = () => {
        const parts = currentPath.split('/').filter(Boolean)
        return [
            { name: 'Root', path: '/' },
            ...parts.map((part, index) => ({
                name: part,
                path: '/' + parts.slice(0, index + 1).join('/') + '/'
            }))
        ]
    }

    const FileIcon = ({ file }) => {
        if (file.isFolder) {
            return <Folder className="h-8 w-8 text-blue-500" />
        }

        if (file.thumbnail) {
            return (
                <img
                    src={file.thumbnail}
                    alt={file.name}
                    className="h-8 w-8 object-cover rounded"
                />
            )
        }

        const IconComponent = getFileIcon(file.name)
        return <File className="h-8 w-8 text-gray-500" />
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                            Quản lý file
                        </h3>

                        {/* Breadcrumb */}
                        <nav className="flex mt-2" aria-label="Breadcrumb">
                            <ol className="flex items-center space-x-2">
                                {getBreadcrumbs().map((crumb, index) => (
                                    <li key={crumb.path} className="flex items-center">
                                        {index > 0 && <span className="text-gray-400 mx-2">/</span>}
                                        <button
                                            onClick={() => setCurrentPath(crumb.path)}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            {crumb.name}
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm file..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* View Mode */}
                        <div className="flex rounded-md shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 text-sm font-medium rounded-l-md border ${
                                    viewMode === 'grid'
                                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Grid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                                    viewMode === 'list'
                                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Upload Button */}
                        {allowUpload && (
                            <button
                                onClick={() => setShowUpload(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Tải lên
                            </button>
                        )}
                    </div>
                </div>

                {/* Selection Actions */}
                {selectedFiles.length > 0 && (
                    <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg p-3">
                        <span className="text-sm text-blue-700">
                            Đã chọn {selectedFiles.length} file
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => {
                                    const filesToDownload = [...folders, ...files].filter(f => selectedFiles.includes(f.id))
                                    filesToDownload.forEach(file => !file.isFolder && handleDownloadFile(file))
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Tải xuống
                            </button>
                            {allowDelete && (
                                <button
                                    onClick={() => setDeleteModal({ show: true, files: selectedFiles })}
                                    className="text-sm text-red-600 hover:text-red-800"
                                >
                                    Xóa
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedFiles([])}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                Hủy chọn
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {folders.length === 0 && files.length === 0 ? (
                            <div className="text-center py-12">
                                <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {searchQuery ? 'Không tìm thấy file' : 'Thư mục trống'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {searchQuery
                                        ? 'Không có file nào phù hợp với từ khóa tìm kiếm'
                                        : 'Thư mục này chưa có file nào'
                                    }
                                </p>
                                {allowUpload && !searchQuery && (
                                    <button
                                        onClick={() => setShowUpload(true)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Tải lên file đầu tiên
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className={`${viewMode === 'grid'
                                ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
                                : 'space-y-2'
                            }`}>
                                {/* Show select all in list mode */}
                                {viewMode === 'list' && multiSelect && (
                                    <div className="flex items-center py-2 px-4 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={selectedFiles.length === [...folders, ...files].length}
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-700">
                                            Chọn tất cả
                                        </span>
                                    </div>
                                )}

                                {/* Folders */}
                                {folders.map(folder => (
                                    <div
                                        key={folder.id}
                                        className={`${viewMode === 'grid'
                                            ? 'p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer'
                                            : 'flex items-center py-3 px-4 hover:bg-gray-50 rounded-lg cursor-pointer'
                                        } ${selectedFiles.includes(folder.id) ? 'bg-blue-50 border-blue-300' : ''}`}
                                        onClick={() => handleFileClick(folder)}
                                        onContextMenu={(e) => handleContextMenu(e, folder)}
                                    >
                                        {viewMode === 'grid' ? (
                                            <div className="text-center">
                                                <Folder className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {folder.name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {folder.itemCount} items
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {multiSelect && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFiles.includes(folder.id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation()
                                                            handleFileSelect(folder)
                                                        }}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-3"
                                                    />
                                                )}
                                                <Folder className="h-6 w-6 text-blue-500 mr-3" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {folder.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {folder.itemCount} items • {formatDate(folder.updatedAt)}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {/* Files */}
                                {files.map(file => (
                                    <div
                                        key={file.id}
                                        className={`${viewMode === 'grid'
                                            ? 'p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer'
                                            : 'flex items-center py-3 px-4 hover:bg-gray-50 rounded-lg cursor-pointer'
                                        } ${selectedFiles.includes(file.id) ? 'bg-blue-50 border-blue-300' : ''}`}
                                        onClick={() => handleFileClick(file)}
                                        onContextMenu={(e) => handleContextMenu(e, file)}
                                    >
                                        {viewMode === 'grid' ? (
                                            <div className="text-center">
                                                <div className="mb-2">
                                                    <FileIcon file={file} />
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatBytes(file.size)}
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {multiSelect && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFiles.includes(file.id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation()
                                                            handleFileSelect(file)
                                                        }}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-3"
                                                    />
                                                )}
                                                <FileIcon file={file} />
                                                <div className="flex-1 min-w-0 ml-3">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatBytes(file.size)} • {formatDate(file.updatedAt)}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Tải lên file
                            </h3>
                            <button
                                onClick={() => setShowUpload(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <FileUpload
                            multiple={true}
                            onUpload={handleFileUpload}
                        />
                    </div>
                </div>
            )}

            {/* File Viewer */}
            {showViewer && currentFile && (
                <FileViewer
                    file={currentFile}
                    onClose={() => {
                        setShowViewer(false)
                        setCurrentFile(null)
                    }}
                />
            )}

            {/* Context Menu */}
            {actionMenu.show && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={closeActionMenu}
                    />
                    <div
                        className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1"
                        style={{
                            left: actionMenu.position.x,
                            top: actionMenu.position.y
                        }}
                    >
                        <button
                            onClick={() => {
                                handleFileClick(actionMenu.file)
                                closeActionMenu()
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            {actionMenu.file?.isFolder ? 'Mở' : 'Xem'}
                        </button>

                        {!actionMenu.file?.isFolder && (
                            <button
                                onClick={() => {
                                    handleDownloadFile(actionMenu.file)
                                    closeActionMenu()
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Tải xuống
                            </button>
                        )}

                        {allowEdit && (
                            <>
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Đổi tên
                                </button>
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Sao chép
                                </button>
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    <Move className="h-4 w-4 mr-2" />
                                    Di chuyển
                                </button>
                            </>
                        )}

                        {allowDelete && (
                            <button
                                onClick={() => {
                                    setDeleteModal({ show: true, files: [actionMenu.file.id] })
                                    closeActionMenu()
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, files: [] })}
                onConfirm={handleDeleteFiles}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa ${deleteModal.files.length} file? Thao tác này không thể hoàn tác.`}
                confirmText="Xóa"
                type="danger"
            />
        </div>
    )
}