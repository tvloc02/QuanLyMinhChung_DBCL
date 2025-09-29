// frontend/components/structure/OrganizationsList.js
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
    Plus, Search, Edit2, Trash2, Eye, X,
    AlertCircle, ChevronLeft, ChevronRight, Building2
} from 'lucide-react'

export default function OrganizationsList() {
    const { user } = useAuth()
    const [organizations, setOrganizations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Pagination & Filters
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState('')
    const [levelFilter, setLevelFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState('desc')

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedOrganization, setSelectedOrganization] = useState(null)
    const [modalMode, setModalMode] = useState('create') // create, edit, view

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        level: 'national',
        type: 'education',
        website: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        country: 'Vietnam',
        status: 'active'
    })

    // Fetch organizations
    useEffect(() => {
        fetchOrganizations()
    }, [currentPage, search, levelFilter, typeFilter, statusFilter, sortBy, sortOrder])

    const fetchOrganizations = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                sortBy,
                sortOrder
            })

            if (search) params.append('search', search)
            if (levelFilter) params.append('level', levelFilter)
            if (typeFilter) params.append('type', typeFilter)
            if (statusFilter) params.append('status', statusFilter)

            const response = await fetch(`/api/organizations?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) throw new Error('Lỗi khi tải danh sách tổ chức')

            const data = await response.json()
            setOrganizations(data.data.organizations)
            setTotalPages(data.data.pagination.pages)
            setTotal(data.data.pagination.total)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setModalMode('create')
        setFormData({
            name: '',
            code: '',
            description: '',
            level: 'national',
            type: 'education',
            website: '',
            contactEmail: '',
            contactPhone: '',
            address: '',
            country: 'Vietnam',
            status: 'active'
        })
        setShowModal(true)
    }

    const handleEdit = (organization) => {
        setModalMode('edit')
        setSelectedOrganization(organization)
        setFormData({
            name: organization.name,
            code: organization.code,
            description: organization.description || '',
            level: organization.level,
            type: organization.type,
            website: organization.website || '',
            contactEmail: organization.contactEmail || '',
            contactPhone: organization.contactPhone || '',
            address: organization.address || '',
            country: organization.country || 'Vietnam',
            status: organization.status
        })
        setShowModal(true)
    }

    const handleView = (organization) => {
        setModalMode('view')
        setSelectedOrganization(organization)
        setFormData({
            name: organization.name,
            code: organization.code,
            description: organization.description || '',
            level: organization.level,
            type: organization.type,
            website: organization.website || '',
            contactEmail: organization.contactEmail || '',
            contactPhone: organization.contactPhone || '',
            address: organization.address || '',
            country: organization.country || 'Vietnam',
            status: organization.status
        })
        setShowModal(true)
    }

    const handleDelete = (organization) => {
        setSelectedOrganization(organization)
        setShowDeleteModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const url = modalMode === 'create'
                ? '/api/organizations'
                : `/api/organizations/${selectedOrganization._id}`

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

            await fetchOrganizations()
            setShowModal(false)
            alert(modalMode === 'create' ? 'Tạo tổ chức thành công!' : 'Cập nhật tổ chức thành công!')
        } catch (err) {
            alert(err.message)
        }
    }

    const confirmDelete = async () => {
        try {
            const response = await fetch(`/api/organizations/${selectedOrganization._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Có lỗi xảy ra')
            }

            await fetchOrganizations()
            setShowDeleteModal(false)
            alert('Xóa tổ chức thành công!')
        } catch (err) {
            alert(err.message)
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { label: 'Hoạt động', className: 'bg-green-100 text-green-800' },
            inactive: { label: 'Không hoạt động', className: 'bg-red-100 text-red-800' },
            suspended: { label: 'Tạm ngưng', className: 'bg-yellow-100 text-yellow-800' }
        }
        const config = statusConfig[status] || statusConfig.active
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
                {config.label}
            </span>
        )
    }

    const getLevelBadge = (level) => {
        const levelConfig = {
            national: { label: 'Quốc gia', className: 'bg-blue-100 text-blue-800' },
            international: { label: 'Quốc tế', className: 'bg-purple-100 text-purple-800' },
            regional: { label: 'Khu vực', className: 'bg-indigo-100 text-indigo-800' },
            institutional: { label: 'Cơ sở', className: 'bg-gray-100 text-gray-800' }
        }
        const config = levelConfig[level] || levelConfig.national
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
                {config.label}
            </span>
        )
    }

    const getTypeBadge = (type) => {
        const typeConfig = {
            government: { label: 'Chính phủ', className: 'bg-red-100 text-red-800' },
            education: { label: 'Giáo dục', className: 'bg-green-100 text-green-800' },
            professional: { label: 'Chuyên nghiệp', className: 'bg-blue-100 text-blue-800' },
            international: { label: 'Quốc tế', className: 'bg-purple-100 text-purple-800' },
            other: { label: 'Khác', className: 'bg-gray-100 text-gray-800' }
        }
        const config = typeConfig[type] || typeConfig.other
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
                {config.label}
            </span>
        )
    }

    if (loading && organizations.length === 0) {
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
                    <h2 className="text-2xl font-bold text-gray-900">Quản lý tổ chức</h2>
                    <p className="text-sm text-gray-600 mt-1">Tổng số: {total} tổ chức</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Thêm tổ chức
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
                    value={levelFilter}
                    onChange={(e) => {
                        setLevelFilter(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Tất cả cấp độ</option>
                    <option value="national">Quốc gia</option>
                    <option value="international">Quốc tế</option>
                    <option value="regional">Khu vực</option>
                    <option value="institutional">Cơ sở</option>
                </select>

                <select
                    value={typeFilter}
                    onChange={(e) => {
                        setTypeFilter(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Tất cả loại</option>
                    <option value="government">Chính phủ</option>
                    <option value="education">Giáo dục</option>
                    <option value="professional">Chuyên nghiệp</option>
                    <option value="international">Quốc tế</option>
                    <option value="other">Khác</option>
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
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="suspended">Tạm ngưng</option>
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
                    <option value="createdAt-desc">Mới nhất</option>
                    <option value="createdAt-asc">Cũ nhất</option>
                    <option value="name-asc">Tên A-Z</option>
                    <option value="name-desc">Tên Z-A</option>
                    <option value="code-asc">Mã A-Z</option>
                    <option value="code-desc">Mã Z-A</option>
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
                                Tên tổ chức
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cấp độ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Loại
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
                        {organizations.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            organizations.map((org) => (
                                <tr key={org._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm font-medium text-gray-900">
                                                {org.code}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {org.name}
                                        </div>
                                        {org.description && (
                                            <div className="text-sm text-gray-500 line-clamp-1">
                                                {org.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getLevelBadge(org.level)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getTypeBadge(org.type)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(org.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleView(org)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {user?.role === 'admin' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(org)}
                                                        className="text-green-600 hover:text-green-800"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(org)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
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
                                {modalMode === 'create' && 'Thêm tổ chức mới'}
                                {modalMode === 'edit' && 'Chỉnh sửa tổ chức'}
                                {modalMode === 'view' && 'Chi tiết tổ chức'}
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
                                        Mã tổ chức <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                        placeholder="VD: MOET"
                                        required
                                        disabled={modalMode === 'view' || modalMode === 'edit'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên tổ chức <span className="text-red-500">*</span>
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
                                        Cấp độ <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={modalMode === 'view'}
                                    >
                                        <option value="national">Quốc gia</option>
                                        <option value="international">Quốc tế</option>
                                        <option value="regional">Khu vực</option>
                                        <option value="institutional">Cơ sở</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Loại tổ chức <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        disabled={modalMode === 'view'}
                                    >
                                        <option value="government">Chính phủ</option>
                                        <option value="education">Giáo dục</option>
                                        <option value="professional">Chuyên nghiệp</option>
                                        <option value="international">Quốc tế</option>
                                        <option value="other">Khác</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://..."
                                        disabled={modalMode === 'view'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email liên hệ
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={modalMode === 'view'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.contactPhone}
                                        onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={modalMode === 'view'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quốc gia
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={modalMode === 'view'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Địa chỉ
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows="2"
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
                                    <option value="active">Hoạt động</option>
                                    <option value="inactive">Không hoạt động</option>
                                    <option value="suspended">Tạm ngưng</option>
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
                            Bạn có chắc chắn muốn xóa tổ chức <strong>{selectedOrganization?.name}</strong>?
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