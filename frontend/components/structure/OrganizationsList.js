import { useState, useEffect } from 'react'
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Building,
    MapPin,
    Phone,
    Mail,
    Globe,
    Users,
    Calendar
} from 'lucide-react'
import { ConfirmModal } from '../common/Modal'
import Modal from '../common/Modal'
import Pagination from '../common/Pagination'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function OrganizationsList() {
    const [organizations, setOrganizations] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState({ show: false, orgId: null })
    const [editingOrganization, setEditingOrganization] = useState(null)
    const [viewingOrganization, setViewingOrganization] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        shortName: '',
        description: '',
        type: 'university',
        parentId: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        isActive: true
    })
    const [formErrors, setFormErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const itemsPerPage = 10

    const organizationTypes = [
        { value: 'university', label: 'Trường đại học' },
        { value: 'institute', label: 'Viện nghiên cứu' },
        { value: 'college', label: 'Cao đẳng' },
        { value: 'center', label: 'Trung tâm' },
        { value: 'department', label: 'Phòng ban' },
        { value: 'faculty', label: 'Khoa' },
        { value: 'other', label: 'Khác' }
    ]

    useEffect(() => {
        fetchOrganizations()
    }, [searchQuery, currentPage])

    const fetchOrganizations = async () => {
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchQuery
            }

            // Mock data - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 500))

            const mockData = {
                organizations: [
                    {
                        id: '1',
                        code: 'VNUA',
                        name: 'Trường Đại học Nông nghiệp Việt Nam',
                        shortName: 'VNUA',
                        type: 'university',
                        description: 'Trường đại học nông nghiệp hàng đầu Việt Nam',
                        address: 'Trâu Quỳ, Gia Lâm, Hà Nội',
                        phone: '024-3827-6554',
                        email: 'info@vnua.edu.vn',
                        website: 'https://vnua.edu.vn',
                        contactPerson: 'Nguyễn Văn A',
                        contactPhone: '024-3827-6555',
                        contactEmail: 'contact@vnua.edu.vn',
                        isActive: true,
                        createdAt: '2024-01-01T00:00:00Z',
                        updatedAt: '2024-12-25T10:00:00Z',
                        evidenceCount: 245,
                        userCount: 50
                    },
                    {
                        id: '2',
                        code: 'TTKTCL',
                        name: 'Trung tâm kiểm định chất lượng giáo dục - VNUA',
                        shortName: 'TTKTCL-VNUA',
                        type: 'center',
                        parentId: '1',
                        description: 'Trung tâm kiểm định chất lượng giáo dục của VNUA',
                        address: 'Trâu Quỳ, Gia Lâm, Hà Nội',
                        phone: '024-3827-6556',
                        email: 'ttktcl@vnua.edu.vn',
                        website: '',
                        contactPerson: 'Trần Thị B',
                        contactPhone: '024-3827-6557',
                        contactEmail: 'ttktcl@vnua.edu.vn',
                        isActive: true,
                        createdAt: '2024-02-01T00:00:00Z',
                        updatedAt: '2024-12-20T15:30:00Z',
                        evidenceCount: 120,
                        userCount: 15
                    }
                ],
                pagination: {
                    total: 2,
                    totalPages: 1,
                    currentPage: 1
                }
            }

            setOrganizations(mockData.organizations)
            setTotalPages(mockData.pagination.totalPages)
            setTotalItems(mockData.pagination.total)
        } catch (error) {
            toast.error('Lỗi tải danh sách tổ chức')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateOrganization = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            const response = await apiMethods.createOrganization(formData)

            if (response.data.success) {
                toast.success('Tạo tổ chức thành công')
                setShowCreateModal(false)
                resetForm()
                fetchOrganizations()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi tạo tổ chức')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditOrganization = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            const response = await apiMethods.updateOrganization(editingOrganization.id, formData)

            if (response.data.success) {
                toast.success('Cập nhật tổ chức thành công')
                setShowEditModal(false)
                resetForm()
                fetchOrganizations()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật tổ chức')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteOrganization = async () => {
        try {
            const response = await apiMethods.deleteOrganization(deleteModal.orgId)

            if (response.data.success) {
                toast.success('Xóa tổ chức thành công')
                fetchOrganizations()
            }
        } catch (error) {
            toast.error('Lỗi xóa tổ chức')
        }
        setDeleteModal({ show: false, orgId: null })
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.code.trim()) {
            errors.code = 'Mã tổ chức không được để trống'
        }

        if (!formData.name.trim()) {
            errors.name = 'Tên tổ chức không được để trống'
        }

        if (!formData.shortName.trim()) {
            errors.shortName = 'Tên viết tắt không được để trống'
        }

        if (!formData.type) {
            errors.type = 'Vui lòng chọn loại tổ chức'
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email không hợp lệ'
        }

        if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
            errors.contactEmail = 'Email liên hệ không hợp lệ'
        }

        if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
            errors.website = 'Website phải bắt đầu bằng http:// hoặc https://'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            shortName: '',
            description: '',
            type: 'university',
            parentId: '',
            address: '',
            phone: '',
            email: '',
            website: '',
            contactPerson: '',
            contactPhone: '',
            contactEmail: '',
            isActive: true
        })
        setFormErrors({})
        setEditingOrganization(null)
    }

    const openEditModal = (org) => {
        setEditingOrganization(org)
        setFormData({
            code: org.code,
            name: org.name,
            shortName: org.shortName,
            description: org.description || '',
            type: org.type,
            parentId: org.parentId || '',
            address: org.address || '',
            phone: org.phone || '',
            email: org.email || '',
            website: org.website || '',
            contactPerson: org.contactPerson || '',
            contactPhone: org.contactPhone || '',
            contactEmail: org.contactEmail || '',
            isActive: org.isActive !== false
        })
        setShowEditModal(true)
    }

    const openDetailModal = (org) => {
        setViewingOrganization(org)
        setShowDetailModal(true)
    }

    const getTypeLabel = (type) => {
        const typeConfig = organizationTypes.find(t => t.value === type)
        return typeConfig ? typeConfig.label : type
    }

    const getParentOrganization = (parentId) => {
        if (!parentId) return null
        return organizations.find(org => org.id === parentId)
    }

    const OrganizationForm = ({ isEdit = false }) => (
        <form onSubmit={isEdit ? handleEditOrganization : handleCreateOrganization} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã tổ chức *
                    </label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="VD: VNUA"
                    />
                    {formErrors.code && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên viết tắt *
                    </label>
                    <input
                        type="text"
                        value={formData.shortName}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.shortName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="VD: VNUA"
                    />
                    {formErrors.shortName && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.shortName}</p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên đầy đủ *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập tên đầy đủ của tổ chức"
                />
                {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại tổ chức *
                    </label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.type ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        {organizationTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {formErrors.type && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tổ chức cha
                    </label>
                    <select
                        value={formData.parentId}
                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Không có</option>
                        {organizations
                            .filter(org => org.id !== editingOrganization?.id)
                            .map(org => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mô tả về tổ chức"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ
                </label>
                <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Địa chỉ của tổ chức"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Điện thoại
                    </label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="024-3827-6554"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="info@example.com"
                    />
                    {formErrors.email && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                    </label>
                    <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.website ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="https://example.com"
                    />
                    {formErrors.website && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.website}</p>
                    )}
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Thông tin liên hệ</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Người liên hệ
                        </label>
                        <input
                            type="text"
                            value={formData.contactPerson}
                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Họ tên người liên hệ"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            SĐT liên hệ
                        </label>
                        <input
                            type="tel"
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="024-3827-6555"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email liên hệ
                        </label>
                        <input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.contactEmail ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="contact@example.com"
                        />
                        {formErrors.contactEmail && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.contactEmail}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Kích hoạt tổ chức
                </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={() => {
                        if (isEdit) {
                            setShowEditModal(false)
                        } else {
                            setShowCreateModal(false)
                        }
                        resetForm()
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {submitting ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
                </button>
            </div>
        </form>
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý tổ chức</h1>
                    <p className="text-gray-600 mt-1">Quản lý thông tin các tổ chức trong hệ thống</p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setShowCreateModal(true)
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm tổ chức
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm theo tên, mã tổ chức..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Danh sách tổ chức ({totalItems})
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải...</p>
                    </div>
                ) : organizations.length === 0 ? (
                    <div className="text-center py-12">
                        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Chưa có tổ chức nào
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Bắt đầu bằng cách tạo tổ chức đầu tiên
                        </p>
                        <button
                            onClick={() => {
                                resetForm()
                                setShowCreateModal(true)
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm tổ chức
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {organizations.map(org => (
                            <div key={org.id} className="p-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Building className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="text-lg font-medium text-gray-900">
                                                    {org.name}
                                                </h4>
                                                <span className="text-sm text-gray-500">({org.shortName})</span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    org.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {org.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                </span>
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <span className="font-medium mr-2">Mã:</span>
                                                    <span className="font-mono">{org.code}</span>
                                                    <span className="mx-3">•</span>
                                                    <span className="font-medium mr-2">Loại:</span>
                                                    <span>{getTypeLabel(org.type)}</span>
                                                </div>

                                                {org.description && (
                                                    <p className="text-gray-600 line-clamp-2">
                                                        {org.description}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                                    {org.address && (
                                                        <div className="flex items-center">
                                                            <MapPin className="h-3 w-3 mr-1" />
                                                            {org.address}
                                                        </div>
                                                    )}
                                                    {org.phone && (
                                                        <div className="flex items-center">
                                                            <Phone className="h-3 w-3 mr-1" />
                                                            {org.phone}
                                                        </div>
                                                    )}
                                                    {org.email && (
                                                        <div className="flex items-center">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            {org.email}
                                                        </div>
                                                    )}
                                                    {org.website && (
                                                        <div className="flex items-center">
                                                            <Globe className="h-3 w-3 mr-1" />
                                                            <a
                                                                href={org.website}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                {org.website}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-4 text-xs">
                                                    <div className="flex items-center">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        <span>{org.userCount || 0} người dùng</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Building className="h-3 w-3 mr-1" />
                                                        <span>{org.evidenceCount || 0} minh chứng</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        <span>Tạo: {formatDate(org.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => openDetailModal(org)}
                                            className="text-blue-600 hover:text-blue-800 p-2"
                                            title="Xem chi tiết"
                                        >
                                            <Search className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(org)}
                                            className="text-green-600 hover:text-green-800 p-2"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ show: true, orgId: org.id })}
                                            className="text-red-600 hover:text-red-800 p-2"
                                            title="Xóa"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
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
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Thêm tổ chức mới"
                size="xlarge"
            >
                <OrganizationForm />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Chỉnh sửa tổ chức"
                size="xlarge"
            >
                <OrganizationForm isEdit={true} />
            </Modal>

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Thông tin chi tiết tổ chức"
                size="large"
            >
                {viewingOrganization && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Mã tổ chức</label>
                                <p className="text-sm text-gray-900 font-mono">{viewingOrganization.code}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Loại tổ chức</label>
                                <p className="text-sm text-gray-900">{getTypeLabel(viewingOrganization.type)}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500">Tên đầy đủ</label>
                            <p className="text-sm text-gray-900">{viewingOrganization.name}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500">Tên viết tắt</label>
                            <p className="text-sm text-gray-900">{viewingOrganization.shortName}</p>
                        </div>

                        {viewingOrganization.description && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Mô tả</label>
                                <p className="text-sm text-gray-900">{viewingOrganization.description}</p>
                            </div>
                        )}

                        {getParentOrganization(viewingOrganization.parentId) && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Tổ chức cha</label>
                                <p className="text-sm text-gray-900">
                                    {getParentOrganization(viewingOrganization.parentId).name}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Ngày tạo</label>
                                <p className="text-sm text-gray-900">{formatDate(viewingOrganization.createdAt)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Cập nhật cuối</label>
                                <p className="text-sm text-gray-900">{formatDate(viewingOrganization.updatedAt)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, orgId: null })}
                onConfirm={handleDeleteOrganization}
                title="Xác nhận xóa tổ chức"
                message="Bạn có chắc chắn muốn xóa tổ chức này? Thao tác này không thể hoàn tác và có thể ảnh hưởng đến các dữ liệu liên quan."
                confirmText="Xóa"
                type="danger"
            />
        </div>
    )
}