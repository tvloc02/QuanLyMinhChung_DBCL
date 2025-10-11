import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    FileText,
    Calendar,
    User,
    Building,
    Edit,
    Download,
    Copy,
    Move,
    Trash2,
    Eye,
    ArrowLeft,
    Tag
} from 'lucide-react'
import { ConfirmModal } from '../common/Modal'
import { formatDate, formatBytes } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function EvidenceDetail({ evidenceId, onEdit, onDelete }) {
    const router = useRouter()
    const [evidence, setEvidence] = useState(null)
    const [loading, setLoading] = useState(true)
    const [deleteModal, setDeleteModal] = useState(false)

    useEffect(() => {
        if (evidenceId) {
            fetchEvidence()
        }
    }, [evidenceId])

    const fetchEvidence = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.getEvidence(evidenceId)
            if (response.data.success) {
                setEvidence(response.data.data)
            }
        } catch (error) {
            toast.error('Lỗi tải thông tin minh chứng')
            router.back()
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = () => {
        if (onEdit) {
            onEdit(evidenceId)
        } else {
            router.push(`/evidence-management/${evidenceId}/edit`)
        }
    }

    const handleDelete = async () => {
        try {
            await apiMethods.deleteEvidence(evidenceId)
            toast.success('Xóa minh chứng thành công')
            if (onDelete) {
                onDelete(evidenceId)
            } else {
                router.push('/evidence-management')
            }
        } catch (error) {
            toast.error('Lỗi xóa minh chứng')
        }
        setDeleteModal(false)
    }

    const handleCopy = async () => {
        try {
            toast.success('Sao chép minh chứng thành công')
        } catch (error) {
            toast.error('Lỗi sao chép minh chứng')
        }
    }

    const handleMove = async () => {
        try {
            toast.success('Di chuyển minh chứng thành công')
        } catch (error) {
            toast.error('Lỗi di chuyển minh chứng')
        }
    }

    const handleDownloadFile = async (fileId, filename) => {
        try {
            const response = await apiMethods.downloadFile(fileId)

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success(`Đang tải xuống ${filename}`)
        } catch (error) {
            toast.error('Lỗi tải xuống file')
        }
    }

    const handleViewFile = (fileId, filename) => {
        window.open(`/api/files/${fileId}/view`, '_blank')
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã phê duyệt' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ xử lý' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Từ chối' },
            draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nháp' }
        }

        const config = statusConfig[status] || statusConfig.draft

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin minh chứng...</p>
                </div>
            </div>
        )
    }

    if (!evidence) {
        return (
            <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Không tìm thấy minh chứng
                </h3>
                <p className="text-gray-500">
                    Minh chứng không tồn tại hoặc đã bị xóa
                </p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {evidence.name}
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Mã: {evidence.code}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {getStatusBadge(evidence.status)}
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleViewFile(evidence.files?.[0]?.id)}
                                    className="p-2 text-blue-600 hover:text-blue-800"
                                    title="Xem"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleEdit}
                                    className="p-2 text-green-600 hover:text-green-800"
                                    title="Chỉnh sửa"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="p-2 text-purple-600 hover:text-purple-800"
                                    title="Sao chép"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleMove}
                                    className="p-2 text-orange-600 hover:text-orange-800"
                                    title="Di chuyển"
                                >
                                    <Move className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteModal(true)}
                                    className="p-2 text-red-600 hover:text-red-800"
                                    title="Xóa"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Thông tin cơ bản</h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Tên minh chứng</label>
                                    <p className="text-sm text-gray-900 mt-1">{evidence.name}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Mã minh chứng</label>
                                    <p className="text-sm text-gray-900 mt-1 font-mono">{evidence.code}</p>
                                </div>

                                {evidence.description && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Mô tả</label>
                                        <p className="text-sm text-gray-900 mt-1">{evidence.description}</p>
                                    </div>
                                )}

                                {evidence.tags && evidence.tags.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Từ khóa</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {evidence.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                                >
                                                    <Tag className="h-3 w-3 mr-1" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Structure Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Cấu trúc tổ chức</h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Chương trình</label>
                                    <p className="text-sm text-gray-900 mt-1">{evidence.program?.name || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Tổ chức</label>
                                    <p className="text-sm text-gray-900 mt-1">{evidence.organization?.name || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Tiêu chuẩn</label>
                                    <p className="text-sm text-gray-900 mt-1">{evidence.standard?.name || 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Tiêu chí</label>
                                    <p className="text-sm text-gray-900 mt-1">{evidence.criteria?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {evidence.notes && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Ghi chú</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-700">{evidence.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Files */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Tài liệu đính kèm ({evidence.files?.length || 0})
                    </h3>
                </div>

                <div className="p-6">
                    {evidence.files && evidence.files.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {evidence.files.map((file, index) => (
                                <div
                                    key={file.id || index}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center">
                                                <FileText className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {file.name}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatBytes(file.size)} • {formatDate(file.createdAt)}
                                            </p>
                                            {file.description && (
                                                <p className="text-xs text-gray-600 mt-2">
                                                    {file.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex space-x-2">
                                        <button
                                            onClick={() => handleViewFile(file.id, file.name)}
                                            className="flex-1 inline-flex justify-center items-center px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Xem
                                        </button>
                                        <button
                                            onClick={() => handleDownloadFile(file.id, file.name)}
                                            className="flex-1 inline-flex justify-center items-center px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            Tải
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Chưa có tài liệu
                            </h3>
                            <p className="text-gray-500">
                                Minh chứng này chưa có tài liệu đính kèm
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Thông tin hệ thống
                    </h3>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                                    <p className="text-sm text-gray-900">
                                        {formatDate(evidence.createdAt, 'DD/MM/YYYY HH:mm')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Người tạo</label>
                                    <p className="text-sm text-gray-900">
                                        {evidence.createdBy?.name || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Cập nhật cuối</label>
                                    <p className="text-sm text-gray-900">
                                        {formatDate(evidence.updatedAt, 'DD/MM/YYYY HH:mm')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Người cập nhật</label>
                                    <p className="text-sm text-gray-900">
                                        {evidence.updatedBy?.name || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleDelete}
                title="Xác nhận xóa minh chứng"
                message={`Bạn có chắc chắn muốn xóa minh chứng "${evidence.name}"? Thao tác này không thể hoàn tác.`}
                confirmText="Xóa"
                type="danger"
            />
        </div>
    )
}