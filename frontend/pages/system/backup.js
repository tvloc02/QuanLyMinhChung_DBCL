import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Database,
    Download,
    Upload,
    Clock,
    HardDrive,
    AlertCircle,
    CheckCircle,
    Trash2,
    RefreshCw,
    FileArchive,
    Calendar,
    User,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

const BackupPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [backups, setBackups] = useState([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [restoring, setRestoring] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({})
    const [selectedBackup, setSelectedBackup] = useState(null)
    const [showRestoreModal, setShowRestoreModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const breadcrumbItems = [
        { name: 'Hệ thống', icon: Database },
        { name: 'Sao lưu & Khôi phục', icon: HardDrive }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user && user.role !== 'admin') {
            router.replace('/dashboard')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchBackups()
        }
    }, [user, currentPage])

    const fetchBackups = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/system/backups?page=${currentPage}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Không thể tải danh sách sao lưu')
            }

            const result = await response.json()
            if (result.success) {
                setBackups(result.data.backups)
                setPagination(result.data.pagination)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateBackup = async () => {
        try {
            setCreating(true)
            setError(null)
            setSuccess(null)

            const response = await fetch('/api/system/backups', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Không thể tạo bản sao lưu')
            }

            const result = await response.json()
            setSuccess('Tạo bản sao lưu thành công!')
            await fetchBackups()
        } catch (err) {
            setError(err.message)
        } finally {
            setCreating(false)
        }
    }

    const handleRestoreBackup = async () => {
        if (!selectedBackup) return

        try {
            setRestoring(true)
            setError(null)
            setSuccess(null)

            const response = await fetch(`/api/system/backups/${selectedBackup._id}/restore`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Không thể khôi phục dữ liệu')
            }

            setSuccess('Khôi phục dữ liệu thành công!')
            setShowRestoreModal(false)
            setSelectedBackup(null)
            setTimeout(() => {
                window.location.reload()
            }, 2000)
        } catch (err) {
            setError(err.message)
        } finally {
            setRestoring(false)
        }
    }

    const handleDownloadBackup = async (backupId) => {
        try {
            const response = await fetch(`/api/system/backups/${backupId}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Không thể tải xuống bản sao lưu')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `backup-${backupId}.zip`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteBackup = async () => {
        if (!selectedBackup) return

        try {
            const response = await fetch(`/api/system/backups/${selectedBackup._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Không thể xóa bản sao lưu')
            }

            setSuccess('Xóa bản sao lưu thành công!')
            setShowDeleteModal(false)
            setSelectedBackup(null)
            await fetchBackups()
        } catch (err) {
            setError(err.message)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sao lưu & Khôi phục</h1>
                        <p className="text-gray-600 mt-1">Quản lý các bản sao lưu dữ liệu hệ thống</p>
                    </div>
                    <button
                        onClick={handleCreateBackup}
                        disabled={creating}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {creating ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Đang tạo...</span>
                            </>
                        ) : (
                            <>
                                <Database className="w-4 h-4" />
                                <span>Tạo bản sao lưu</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-medium text-green-800">Thành công</h3>
                            <p className="text-sm text-green-700 mt-1">{success}</p>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Nên tạo bản sao lưu thường xuyên để bảo vệ dữ liệu</li>
                                <li>Khôi phục dữ liệu sẽ ghi đè toàn bộ dữ liệu hiện tại</li>
                                <li>Tải xuống và lưu trữ bản sao lưu ở nơi an toàn</li>
                                <li>Không xóa bản sao lưu quan trọng</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Backups List */}
                <div className="bg-white rounded-lg shadow">
                    {loading && backups.length === 0 ? (
                        <div className="p-12 text-center">
                            <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                            <p className="text-gray-500">Đang tải...</p>
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="p-12 text-center">
                            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bản sao lưu nào</h3>
                            <p className="text-gray-500 mb-4">Tạo bản sao lưu đầu tiên để bảo vệ dữ liệu</p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                                <div className="grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="col-span-3">Tên file</div>
                                    <div className="col-span-2">Kích thước</div>
                                    <div className="col-span-2">Thời gian tạo</div>
                                    <div className="col-span-2">Người tạo</div>
                                    <div className="col-span-2">Trạng thái</div>
                                    <div className="col-span-1">Thao tác</div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-gray-200">
                                {backups.map((backup) => (
                                    <div key={backup._id} className="px-6 py-4 hover:bg-gray-50">
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            {/* Filename */}
                                            <div className="col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <FileArchive className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-900">
                                                            {backup.filename || 'backup.zip'}
                                                        </h3>
                                                        {backup.description && (
                                                            <p className="text-xs text-gray-500 mt-1">{backup.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Size */}
                                            <div className="col-span-2">
                                                <div className="flex items-center space-x-2">
                                                    <HardDrive className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {formatSize(backup.size || 0)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Created Date */}
                                            <div className="col-span-2">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {formatDate(backup.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Created By */}
                                            <div className="col-span-2">
                                                <div className="flex items-center space-x-2">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-900">
                                                        {backup.createdBy?.fullName || 'System'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Hoàn thành
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-1">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleDownloadBackup(backup._id)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBackup(backup)
                                                            setShowRestoreModal(true)
                                                        }}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                        title="Khôi phục"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBackup(backup)
                                                            setShowDeleteModal(true)
                                                        }}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Hiển thị {((pagination.current - 1) * 10) + 1} - {Math.min(pagination.current * 10, pagination.total)} trong {pagination.total} kết quả
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="px-3 py-2 text-sm font-medium text-gray-900">
                                                Trang {pagination.current} / {pagination.pages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={!pagination.hasNext}
                                                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Restore Modal */}
                {showRestoreModal && selectedBackup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận khôi phục</h3>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    <strong>Cảnh báo:</strong> Thao tác này sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu từ bản sao lưu. Hành động này không thể hoàn tác!
                                </p>
                            </div>
                            <p className="text-gray-600 mb-2">
                                Khôi phục từ file: <strong>{selectedBackup.filename}</strong>
                            </p>
                            <p className="text-gray-600 mb-6">
                                Thời gian tạo: {formatDate(selectedBackup.createdAt)}
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowRestoreModal(false)
                                        setSelectedBackup(null)
                                    }}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    disabled={restoring}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRestoreBackup}
                                    disabled={restoring}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {restoring ? (
                                        <span className="flex items-center space-x-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Đang khôi phục...</span>
                                        </span>
                                    ) : (
                                        'Khôi phục dữ liệu'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && selectedBackup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận xóa</h3>
                            <p className="text-gray-600 mb-6">
                                Bạn có chắc chắn muốn xóa bản sao lưu <strong>{selectedBackup.filename}</strong>? Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedBackup(null)
                                    }}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDeleteBackup}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Xóa bản sao lưu
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default BackupPage