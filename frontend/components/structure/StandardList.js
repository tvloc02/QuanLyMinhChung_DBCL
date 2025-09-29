// frontend/components/structure/StandardList.js
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
    Plus, Search, Edit2, Trash2, Eye, X,
    AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react'

export default function StandardList() {
    const { user } = useAuth()
    const [standards, setStandards] = useState([])
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Pagination & Filters
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [programFilter, setProgramFilter] = useState('')
    const [organizationFilter, setOrganizationFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sortBy, setSortBy] = useState('order')
    const [sortOrder, setSortOrder] = useState('asc')

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedStandard, setSelectedStandard] = useState(null)
    const [modalMode, setModalMode] = useState('create')

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        programId: '',
        organizationId: '',
        order: 1,
        weight: 0,
        objectives: '',
        guidelines: '',
        evaluationCriteria: [],
        status: 'draft'
    })

    // Fetch data
    useEffect(() => {
        fetchStandards()
    }, [currentPage, search, programFilter, organizationFilter, statusFilter, sortBy, sortOrder])

    useEffect(() => {
        fetchPrograms()
        fetchOrganizations()
    }, [])

    const fetchStandards = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                sortBy,
                sortOrder
            })

            if (search) params.append('search', search)
            if (programFilter) params.append('programId', programFilter)
            if (organizationFilter) params.append('organizationId', organizationFilter)
            if (statusFilter) params.append('status', statusFilter)

            const response = await fetch(`/api/standards?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) throw new Error('Lỗi khi tải danh sách tiêu chuẩn')

            const data = await response.json()
            setStandards(data.data.standards)
            setTotalPages(data.data.pagination.pages)
            setTotal(data.data.pagination.total)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchPrograms = async () => {
        try {
            const response = await fetch('/api/programs/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setPrograms(data.data)
            }
        } catch (err) {
            console.error('Lỗi khi tải chương trình:', err)
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await fetch('/api/organizations/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setOrganizations(data.data)
            }
        } catch (err) {
            console.error('Lỗi khi tải tổ chức:', err)
        }
    }

    const handleCreate = () => {
        setModalMode('create')
        setFormData({
            name: '',
            code: '',
            description: '',
            programId: '',
            organizationId: '',
            order: 1,
            weight: 0,
            objectives: '',
            guidelines: '',
            evaluationCriteria: [],
            status: 'draft'
        })
        setShowModal(true)
    }

    const handleEdit = (standard) => {
        setModalMode('edit')
        setSelectedStandard(standard)
        setFormData({
            name: standard.name,
            code: standard.code,
            description: standard.description || '',
            programId: standard.programId._id || standard.programId,
            organizationId: standard.organizationId._id || standard.organizationId,
            order: standard.order,
            weight: standard.weight || 0,
            objectives: standard.objectives || '',
            guidelines: standard.guidelines || '',
            evaluationCriteria: standard.evaluationCriteria || [],
            status: standard.status
        })
        setShowModal(true)
    }

    const handleView = (standard) => {
        setModalMode('view')
        setSelectedStandard(standard)
        setFormData({
            name: standard.name,
            code: standard.code,
            description: standard.description || '',
            programId: standard.programId._id || standard.programId,
            organizationId: standard.organizationId._id || standard.organizationId,
            order: standard.order,
            weight: standard.weight || 0,
            objectives: standard.objectives || '',
            guidelines: standard.guidelines || '',
            evaluationCriteria: standard.evaluationCriteria || [],
            status: standard.status
        })
        setShowModal(true)
    }

    const handleDelete = (standard) => {
        setSelectedStandard(standard)
        setShowDeleteModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const url = modalMode === 'create'
                ? '/api/standards'
                : `/api/standards/${selectedStandard._id}`

            const method = modalMode === 'create' ? 'POST' : 'PUT'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Có lỗi xảy ra')
            }

            await fetchStandards()
            setShowModal(false)
            alert(modalMode === 'create' ? 'Tạo tiêu chuẩn thành công!' : 'Cập nhật tiêu chuẩn thành công!')
        } catch (err) {
            alert(err.message)
        }
    }

    const confirmDelete = async () => {
        try {
            const response = await fetch(`/api/standards/${selectedStandard._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Có lỗi xảy ra')
            }

            await fetchStandards()
            setShowDeleteModal(false)
            alert('Xóa tiêu chuẩn thành công!')
        } catch (err) {
            alert(err.message)
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { label: 'Nháp', className: 'bg-gray-100 text-gray-800' },
            active: { label: 'Hoạt động', className: 'bg-green-100 text-green-800' },
            inactive: { label: 'Không hoạt động', className: 'bg-red-100 text-red-800' },
            archived: { label: 'Lưu trữ', className: 'bg-yellow-100 text-yellow-800' }
        }
        const config = statusConfig[status] || statusConfig.draft
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
                {config.label}
            </span>
        )
    }

    if (loading && standards.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Quản lý tiêu chuẩn</h2>
                    <p className="text-sm text-gray-600 mt-1">Tổng số: {total} tiêu chuẩn</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Thêm tiêu chuẩn
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setCurrentPage(1)
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <select
                    value={programFilter}
                    onChange={(e) => {
                        setProgramFilter(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Tất cả chương trình</option>
                    {programs.map(program => (
                        <option key={program._id} value={program._id}>
                            {program.name}
                        </option>
                    ))}
                </select>

                <select
                    value={organizationFilter}
                    onChange={(e) => {
                        setOrganizationFilter(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Tất cả tổ chức</option>
                    {organizations.map(org => (
                        <option key={org._id} value={org._id}>
                            {org.name}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="draft">Nháp</option>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="archived">Lưu trữ</option>
                </select>

                <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                        const [newSortBy, newSortOrder] = e.target.value.split('-')
                        setSortBy(newSortBy)
                        setSortOrder(newSortOrder)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="order-asc">Thứ tự tăng dần</option>
                    <option value="order-desc">Thứ tự giảm dần</option>
                    <option value="code-asc">Mã A-Z</option>
                    <option value="code-desc">Mã Z-A</option>
                    <option value="name-asc">Tên A-Z</option>
                    <option value="name-desc">Tên Z-A</option>
                    <option value="createdAt-desc">Mới nhất</option>
                    <option value="createdAt-asc">Cũ nhất</option>
                </select>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Mã
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tên tiêu chuẩn
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Chương trình
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tổ chức
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thứ tự
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {standards.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            standards.map((standard) => (
                                <tr key={standard._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm font-medium text-gray-900">
                                                {standard.code}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {standard.name}
                                        </div>
                                        {standard.description && (
                                            <div className="text-sm text-gray-500 line-clamp-1">
                                                {standard.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {standard.programId?.name || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {standard.organizationId?.name || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {standard.order}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(standard.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleView(standard)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {(user?.role === 'admin' || user?.role === 'manager') && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(standard)}
                                                        className="text-green-600 hover:text-green-800"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    {user?.role === 'admin' && (
                                                        <button
                                                            onClick={() => handleDelete(standard)}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                {modalMode === 'create' && 'Thêm tiêu chuẩn mới'}
                                {modalMode === 'edit' && 'Chỉnh sửa tiêu chuẩn'}
                                {modalMode === 'view' && 'Chi tiết tiêu chuẩn'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mã tiêu chuẩn <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                        placeholder="VD: 01"
                                        required
                                        disabled={modalMode === 'view'}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Mã 1-2 chữ số</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên tiêu chuẩn <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={modalMode === 'view'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mô tả
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows="3"
                                    disabled={modalMode === 'view'}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chương trình <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.programId}
                                        onChange={(e) => setFormData({...formData, programId: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={modalMode === 'view' || modalMode === 'edit'}
                                    >
                                        <option value="">-- Chọn chương trình --</option>
                                        {programs.map(program => (
                                            <option key={program._id} value={program._id}>
                                                {program.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tổ chức <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.organizationId}
                                        onChange={(e) => setFormData({...formData, organizationId: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={modalMode === 'view' || modalMode === 'edit'}
                                    >
                                        <option value="">-- Chọn tổ chức --</option>
                                        {organizations.map(org => (
                                            <option key={org._id} value={org._id}>
                                                {org.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Thứ tự
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="1"
                                        disabled={modalMode === 'view'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trọng số (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value)})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        disabled={modalMode === 'view'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mục tiêu
                                </label>
                                <textarea
                                    value={formData.objectives}
                                    onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows="3"
                                    disabled={modalMode === 'view'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hướng dẫn
                                </label>
                                <textarea
                                    value={formData.guidelines}
                                    onChange={(e) => setFormData({...formData, guidelines: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows="3"
                                    disabled={modalMode === 'view'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Trạng thái
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={modalMode === 'view'}
                                >
                                    <option value="draft">Nháp</option>
                                    <option value="active">Hoạt động</option>
                                    <option value="inactive">Không hoạt động</option>
                                    <option value="archived">Lưu trữ</option>
                                </select>
                            </div>

                            {modalMode !== 'view' && (
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        {modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertCircle size={24} />
                            <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa tiêu chuẩn <strong>{selectedStandard?.name}</strong>?
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}