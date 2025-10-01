import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Upload,
    Download,
    RefreshCw,
    FileText,
    MoreVertical,
    ArrowRightLeft,
    Trash
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import MoveEvidenceModal from './MoveEvidenceModal.js'

export default function EvidenceManagement() {
    const router = useRouter()
    const { view, status: queryStatus } = router.query

    const [evidences, setEvidences] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0
    })

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        status: queryStatus || '',
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    })

    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])

    const [selectedEvidence, setSelectedEvidence] = useState(null)
    const [showMoveModal, setShowMoveModal] = useState(false)
    const [selectedItems, setSelectedItems] = useState([])
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        fetchEvidences()
        fetchPrograms()
        fetchOrganizations()
    }, [filters])

    useEffect(() => {
        if (filters.programId && filters.organizationId) {
            fetchStandards()
        }
    }, [filters.programId, filters.organizationId])

    useEffect(() => {
        if (filters.standardId) {
            fetchCriteria()
        }
    }, [filters.standardId])

    useEffect(() => {
        if (view) {
            handleViewDetail(view)
        }
    }, [view])

    const fetchEvidences = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.evidences.getAll(filters)
            const data = response.data?.data || response.data

            setEvidences(data?.evidences || [])
            setPagination(data?.pagination || { current: 1, pages: 1, total: 0 })
        } catch (error) {
            console.error('Fetch evidences error:', error)
            toast.error('Lỗi khi tải danh sách minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const fetchPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll()
            setPrograms(response.data?.data?.programs || [])
        } catch (error) {
            console.error('Fetch programs error:', error)
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll()
            setOrganizations(response.data?.data?.organizations || [])
        } catch (error) {
            console.error('Fetch organizations error:', error)
        }
    }

    const fetchStandards = async () => {
        try {
            const response = await apiMethods.standards.getAll({
                programId: filters.programId,
                organizationId: filters.organizationId
            })
            setStandards(response.data?.data?.standards || response.data?.data || [])
        } catch (error) {
            console.error('Fetch standards error:', error)
        }
    }

    const fetchCriteria = async () => {
        try {
            const response = await apiMethods.criteria.getAll({
                standardId: filters.standardId
            })
            const criteriaData = response.data?.data?.criterias ||
                response.data?.data?.criteria ||
                response.data?.data || []
            setCriteria(criteriaData)
        } catch (error) {
            console.error('Fetch criteria error:', error)
        }
    }

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1 // Reset to first page
        }))
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setFilters(prev => ({ ...prev, page: 1 }))
    }

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }))
    }

    const handleViewDetail = (id) => {
        router.push(`/evidence/files?evidenceId=${id}`)
    }

    const handleEdit = (evidence) => {
        // TODO: Implement edit modal
        toast.info('Chức năng chỉnh sửa đang phát triển')
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa minh chứng này?')) return

        try {
            await apiMethods.evidences.delete(id)
            toast.success('Xóa minh chứng thành công')
            fetchEvidences()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xóa minh chứng')
        }
    }

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) {
            toast.error('Vui lòng chọn minh chứng để xóa')
            return
        }

        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.length} minh chứng đã chọn?`)) return

        try {
            await apiMethods.evidences.bulkDelete(selectedItems)
            toast.success(`Đã xóa ${selectedItems.length} minh chứng`)
            setSelectedItems([])
            fetchEvidences()
        } catch (error) {
            console.error('Bulk delete error:', error)
            toast.error('Lỗi khi xóa minh chứng')
        }
    }

    const handleMove = (evidence) => {
        setSelectedEvidence(evidence)
        setShowMoveModal(true)
    }

    const handleMoveSuccess = () => {
        setShowMoveModal(false)
        setSelectedEvidence(null)
        fetchEvidences()
    }

    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedItems.length === evidences.length) {
            setSelectedItems([])
        } else {
            setSelectedItems(evidences.map(e => e._id))
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800',
            archived: 'bg-gray-100 text-gray-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status) => {
        const labels = {
            active: 'Hoạt động',
            inactive: 'Không hoạt động',
            pending: 'Chờ xử lý',
            archived: 'Lưu trữ'
        }
        return labels[status] || status
    }

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý minh chứng</h1>
                    <p className="text-gray-600 mt-1">
                        Tổng số: <strong>{pagination.total}</strong> minh chứng
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Bộ lọc
                    </button>

                    <button
                        onClick={fetchEvidences}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>

                    <button
                        onClick={() => router.push('/evidence/create')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm mới
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chương trình
                            </label>
                            <select
                                value={filters.programId}
                                onChange={(e) => handleFilterChange('programId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Tất cả</option>
                                {programs.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tổ chức
                            </label>
                            <select
                                value={filters.organizationId}
                                onChange={(e) => handleFilterChange('organizationId', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Tất cả</option>
                                {organizations.map(o => (
                                    <option key={o._id} value={o._id}>{o.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu chuẩn
                            </label>
                            <select
                                value={filters.standardId}
                                onChange={(e) => handleFilterChange('standardId', e.target.value)}
                                disabled={!filters.programId || !filters.organizationId}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                            >
                                <option value="">Tất cả</option>
                                {standards.map(s => (
                                    <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu chí
                            </label>
                            <select
                                value={filters.criteriaId}
                                onChange={(e) => handleFilterChange('criteriaId', e.target.value)}
                                disabled={!filters.standardId}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                            >
                                <option value="">Tất cả</option>
                                {criteria.map(c => (
                                    <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Tất cả</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                                <option value="pending">Chờ xử lý</option>
                                <option value="archived">Lưu trữ</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <form onSubmit={handleSearch} className="flex space-x-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, mã, số hiệu văn bản..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Tìm kiếm
                    </button>
                </form>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-900">
                            Đã chọn <strong>{selectedItems.length}</strong> minh chứng
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleBulkDelete}
                                className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                            >
                                <Trash className="h-4 w-4 mr-1" />
                                Xóa tất cả
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Evidence List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                ) : evidences.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Không tìm thấy minh chứng nào</p>
                        <button
                            onClick={() => router.push('/evidence/create')}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm minh chứng mới
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.length === evidences.length}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Mã MC
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tên minh chứng
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tiêu chuẩn/Tiêu chí
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Files
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Trạng thái
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Ngày tạo
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                {evidences.map((evidence) => (
                                    <tr key={evidence._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(evidence._id)}
                                                onChange={() => toggleSelectItem(evidence._id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className="text-sm font-mono text-blue-600">
                                                    {evidence.code}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="max-w-xs">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {evidence.name}
                                                </p>
                                                {evidence.documentNumber && (
                                                    <p className="text-xs text-gray-500">
                                                        Số hiệu: {evidence.documentNumber}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs">
                                                <p className="text-gray-900">
                                                    {evidence.standardId?.code} - {evidence.standardId?.name}
                                                </p>
                                                <p className="text-gray-500">
                                                    {evidence.criteriaId?.code} - {evidence.criteriaId?.name}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600">
                                                    {evidence.files?.length || 0} files
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(evidence.status)}`}>
                                                    {getStatusLabel(evidence.status)}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600">
                                                    {formatDate(evidence.createdAt)}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewDetail(evidence._id)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(evidence)}
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleMove(evidence)}
                                                    className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                                    title="Di chuyển"
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(evidence._id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Hiển thị <strong>{((pagination.current - 1) * filters.limit) + 1}</strong> đến{' '}
                                        <strong>{Math.min(pagination.current * filters.limit, pagination.total)}</strong> trong tổng số{' '}
                                        <strong>{pagination.total}</strong> kết quả
                                    </p>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.current - 1)}
                                            disabled={!pagination.hasPrev}
                                            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Trước
                                        </button>
                                        {[...Array(pagination.pages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`px-3 py-1 border rounded-md ${
                                                    pagination.current === i + 1
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handlePageChange(pagination.current + 1)}
                                            disabled={!pagination.hasNext}
                                            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Move Modal */}
            {showMoveModal && selectedEvidence && (
                <MoveEvidenceModal
                    evidence={selectedEvidence}
                    onClose={() => {
                        setShowMoveModal(false)
                        setSelectedEvidence(null)
                    }}
                    onSuccess={handleMoveSuccess}
                />
            )}
        </div>
    )
}