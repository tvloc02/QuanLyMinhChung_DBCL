import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    Eye,
    Edit,
    Trash2,
    Copy,
    Move,
    Download,
    Calendar,
    User,
    FileText,
    Plus
} from 'lucide-react'
import Pagination from '../common/Pagination'
import Loading from '../common/Loading'
import { ConfirmModal } from '../common/Modal'
import evidenceService from '../../services/evidenceService'
import toast from 'react-hot-toast'

export default function EvidenceList({
                                         filters = {},
                                         searchQuery = '',
                                         selectedEvidences = [],
                                         onSelectEvidence,
                                         onSelectAll
                                     }) {
    const [evidences, setEvidences] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null })
    const router = useRouter()

    const itemsPerPage = 10

    useEffect(() => {
        fetchEvidences()
    }, [filters, searchQuery, currentPage])

    const fetchEvidences = async () => {
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchQuery,
                ...filters
            }

            const response = await evidenceService.getEvidences(params)

            if (response.success) {
                setEvidences(response.data.evidences)
                setTotalPages(response.data.pagination.totalPages)
                setTotalItems(response.data.pagination.total)
            }
        } catch (error) {
            console.error('Error fetching evidences:', error)
            toast.error('Lỗi tải danh sách minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectAll = () => {
        if (selectedEvidences.length === evidences.length) {
            onSelectAll([])
        } else {
            onSelectAll(evidences.map(e => e._id))
        }
    }

    const handleView = (id) => {
        router.push(`/evidence-management/${id}`)
    }

    const handleEdit = (id) => {
        router.push(`/evidence-management/${id}/edit`)
    }

    const handleDelete = async (id) => {
        try {
            await evidenceService.deleteEvidence(id)
            toast.success('Xóa minh chứng thành công')
            fetchEvidences()
        } catch (error) {
            toast.error('Lỗi xóa minh chứng')
        }
        setDeleteModal({ show: false, id: null })
    }

    const handleCopy = (id) => {
        console.log('Copy evidence:', id)
    }

    const handleMove = (id) => {
        console.log('Move evidence:', id)
    }

    const handleDownload = (id) => {
        console.log('Download evidence:', id)
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="p-8">
                <Loading message="Đang tải danh sách minh chứng..." />
            </div>
        )
    }

    return (
        <div className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                        Danh sách minh chứng ({totalItems})
                    </h3>
                    <button
                        onClick={() => router.push('/evidence-management/create')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm minh chứng
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left">
                            <input
                                type="checkbox"
                                checked={selectedEvidences.length === evidences.length && evidences.length > 0}
                                onChange={handleSelectAll}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            STT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thao tác
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tên minh chứng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mã minh chứng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Chương trình
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày tạo
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {evidences.map((evidence, index) => (
                        <tr key={evidence._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedEvidences.includes(evidence._id)}
                                    onChange={() => onSelectEvidence(evidence._id)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleView(evidence._id)}
                                        className="p-1 text-blue-600 hover:text-blue-900"
                                        title="Xem"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(evidence._id)}
                                        className="p-1 text-green-600 hover:text-green-900"
                                        title="Sửa"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleCopy(evidence._id)}
                                        className="p-1 text-purple-600 hover:text-purple-900"
                                        title="Sao chép"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleMove(evidence._id)}
                                        className="p-1 text-orange-600 hover:text-orange-900"
                                        title="Di chuyển"
                                    >
                                        <Move className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDownload(evidence._id)}
                                        className="p-1 text-indigo-600 hover:text-indigo-900"
                                        title="Tải xuống"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteModal({ show: true, id: evidence._id })}
                                        className="p-1 text-red-600 hover:text-red-900"
                                        title="Xóa"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate">
                                <div className="flex items-center">
                                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                    <span className="text-sm font-medium text-gray-900">
                                            {evidence.name}
                                        </span>
                                </div>
                                {evidence.description && (
                                    <div className="text-sm text-gray-500 mt-1 truncate">
                                        {evidence.description}
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                {evidence.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {evidence.program?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(evidence.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(evidence.createdAt).toLocaleDateString('vi-VN')}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {evidences.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Chưa có minh chứng nào
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Bắt đầu bằng cách tạo minh chứng đầu tiên của bạn.
                    </p>
                    <button
                        onClick={() => router.push('/evidence-management/create')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm minh chứng
                    </button>
                </div>
            )}

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            )}

            <ConfirmModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, id: null })}
                onConfirm={() => handleDelete(deleteModal.id)}
                title="Xác nhận xóa"
                message="Bạn có chắc chắn muốn xóa minh chứng này? Thao tác này không thể hoàn tác."
                confirmText="Xóa"
                type="danger"
            />
        </div>
    )
}