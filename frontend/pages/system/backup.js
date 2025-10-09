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
    ChevronRight,
    Loader2,
    Zap
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
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải...</p>
                </div>
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
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Database className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Sao lưu & Khôi phục</h1>
                                <p className="text-indigo-100">Quản lý các bản sao lưu dữ liệu hệ thống</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCreateBackup}
                            disabled={creating}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:shadow-xl transition-all font-medium disabled:opacity-50"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Đang tạo...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    <span>Tạo bản sao lưu</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="rounded-2xl border p-6 shadow-lg bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-7 h-7 text-red-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-bold text-red-900 mb-1">Có lỗi xảy ra</h3>
                                <p className="text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="rounded-2xl border p-6 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-7 h-7 text-green-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-bold text-green-900 mb-1">Thành công!</h3>
                                <p className="text-green-800">{success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-blue-900 font-semibold mb-2">Lưu ý quan trọng:</p>
                            <ul className="text-blue-800 text-sm space-y-1.5">
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Nên tạo bản sao lưu thường xuyên để bảo vệ dữ liệu</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Khôi phục dữ liệu sẽ ghi đè toàn bộ dữ liệu hiện tại</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Tải xuống và lưu trữ bản sao lưu ở nơi an toàn</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>Không xóa bản sao lưu quan trọng</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Backups List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading && backups.length === 0 ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">Đang tải...</p>
                        </div>
                    ) : backups.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Database className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có bản sao lưu nào</h3>
                            <p className="text-gray-500 mb-4">Tạo bản sao lưu đầu tiên để bảo vệ dữ liệu</p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                <div className="grid grid-cols-12 gap-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    <div className="col-span-3">Tên file</div>
                                    <div className="col-span-2">Kích thước</div>
                                    <div className="col-span-2">Thời gian tạo</div>
                                    <div className="col-span-2">Người tạo</div>
                                    <div className="col-span-2">Trạng thái</div>
                                    <div className="col-span-1 text-center">Thao tác</div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div>
                                {backups.map((backup) => (
                                    <div key={backup._id} className="px-6 py-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            {/* Filename */}
                                            <div className="col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                                                        <FileArchive className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900">
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
                                                    <span className="text-sm font-medium text-gray-900">
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
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Hoàn thành
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-1">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => handleDownloadBackup(backup._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Tải xuống"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBackup(backup)
                                                            setShowRestoreModal(true)
                                                        }}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                        title="Khôi phục"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBackup(backup)
                                                            setShowDeleteModal(true)
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
                                <div className="px-6 py-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Hiển thị <span className="font-semibold text-indigo-600">{((pagination.current - 1) * 10) + 1}</span> - <span className="font-semibold text-indigo-600">{Math.min(pagination.current * 10, pagination.total)}</span> trong <span className="font-semibold text-indigo-600">{pagination.total}</span> kết quả
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="p-2 border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <span className="text-sm font-semibold text-gray-700 px-4 py-2 bg-white rounded-lg border-2 border-gray-200">
                                                {pagination.current} / {pagination.pages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={!pagination.hasNext}
                                                className="p-2 border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="w-5 h-5" />
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4">
                                <Upload className="w-6 h-6 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận khôi phục</h3>
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
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
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRestoreModal(false)
                                        setSelectedBackup(null)
                                    }}
                                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                                    disabled={restoring}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRestoreBackup}
                                    disabled={restoring}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                                >
                                    {restoring ? (
                                        <span className="flex items-center justify-center space-x-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
                            <p className="text-gray-600 mb-6">
                                Bạn có chắc chắn muốn xóa bản sao lưu <strong>{selectedBackup.filename}</strong>? Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedBackup(null)
                                    }}
                                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDeleteBackup}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
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