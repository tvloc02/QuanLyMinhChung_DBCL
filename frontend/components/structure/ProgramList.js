import { useState, useEffect } from 'react'
import {
    Plus,
    Edit,
    Trash2,
    Search,
    BookOpen,
    Calendar,
    Building,
    Users,
    FileText,
    Eye
} from 'lucide-react'
import { ConfirmModal } from '../common/Modal'
import Modal from '../common/Modal'
import Pagination from '../common/Pagination'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function ProgramList() {
    const [programs, setPrograms] = useState([])
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
    const [deleteModal, setDeleteModal] = useState({ show: false, programId: null })
    const [editingProgram, setEditingProgram] = useState(null)
    const [viewingProgram, setViewingProgram] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        version: '',
        organizationId: '',
        startDate: '',
        endDate: '',
        status: 'active',
        criteria: '',
        scope: '',
        objective: '',
        isActive: true
    })
    const [formErrors, setFormErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const itemsPerPage = 10

    const statusOptions = [
        { value: 'draft', label: 'Nháp', color: 'gray' },
        { value: 'active', label: 'Đang hoạt động', color: 'green' },
        { value: 'completed', label: 'Hoàn thành', color: 'blue' },
        { value: 'suspended', label: 'Tạm dừng', color: 'yellow' },
        { value: 'cancelled', label: 'Hủy bỏ', color: 'red' }
    ]

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        fetchPrograms()
    }, [searchQuery, currentPage])

    const fetchInitialData = async () => {
        try {
            const response = await apiMethods.getOrganizations()
            if (response.data.success) {
                setOrganizations(response.data.data)
            }
        } catch (error) {
            toast.error('Lỗi tải dữ liệu tổ chức')
        }
    }

    const fetchPrograms = async () => {
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchQuery
            }

            await new Promise(resolve => setTimeout(resolve, 500))

            const mockData = {
                programs: [
                    {
                        id: '1',
                        code: 'AUN-QA-2023',
                        name: 'Chương trình đánh giá chất lượng giáo dục AUN-QA 2023',
                        description: 'Chương trình đánh giá chất lượng theo tiêu chuẩn AUN-QA dành cho các trường đại học trong khu vực ASEAN',
                        version: '2.0',
                        organizationId: '1',
                        organization: {
                            name: 'Trường Đại học Nông nghiệp Việt Nam',
                            shortName: 'VNUA'
                        },
                        startDate: '2023-01-01',
                        endDate: '2025-12-31',
                        status: 'active',
                        criteria: 'Đánh giá dựa trên 11 tiêu chuẩn chính của AUN-QA',
                        scope: 'Áp dụng cho tất cả các chương trình đào tạo đại học',
                        objective: 'Nâng cao chất lượng giáo dục và đạt chuẩn quốc tế',
                        isActive: true,
                        createdAt: '2023-01-01T00:00:00Z',
                        updatedAt: '2024-12-25T10:00:00Z',
                        standardCount: 11,
                        criteriaCount: 42,
                        evidenceCount: 245,
                        userCount: 50
                    },
                    {
                        id: '2',
                        code: 'MOET-2024',
                        name: 'Chương trình kiểm định chất lượng Bộ GD&ĐT 2024',
                        description: 'Chương trình kiểm định chất lượng theo quy định của Bộ Giáo dục và Đào tạo Việt Nam',
                        version: '1.5',
                        organizationId: '2',
                        organization: {
                            name: 'Trung tâm kiểm định chất lượng giáo dục - VNUA',
                            shortName: 'TTKTCL-VNUA'
                        },
                        startDate: '2024-01-01',
                        endDate: '2024-12-31',
                        status: 'active',
                        criteria: 'Dựa trên 5 tiêu chuẩn chính của Bộ GD&ĐT',
                        scope: 'Kiểm định chất lượng cơ sở giáo dục',
                        objective: 'Đảm bảo chất lượng giáo dục theo tiêu chuẩn quốc gia',
                        isActive: true,
                        createdAt: '2024-01-01T00:00:00Z',
                        updatedAt: '2024-12-20T15:30:00Z',
                        standardCount: 5,
                        criteriaCount: 25,
                        evidenceCount: 120,
                        userCount: 25
                    }
                ],
                pagination: {
                    total: 2,
                    totalPages: 1,
                    currentPage: 1
                }
            }

            setPrograms(mockData.programs)
            setTotalPages(mockData.pagination.totalPages)
            setTotalItems(mockData.pagination.total)
        } catch (error) {
            toast.error('Lỗi tải danh sách chương trình')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateProgram = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            const response = await apiMethods.createProgram(formData)

            if (response.data.success) {
                toast.success('Tạo chương trình thành công')
                setShowCreateModal(false)
                resetForm()
                fetchPrograms()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi tạo chương trình')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditProgram = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            const response = await apiMethods.updateProgram(editingProgram.id, formData)

            if (response.data.success) {
                toast.success('Cập nhật chương trình thành công')
                setShowEditModal(false)
                resetForm()
                fetchPrograms()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật chương trình')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteProgram = async () => {
        try {
            const response = await apiMethods.deleteProgram(deleteModal.programId)

            if (response.data.success) {
                toast.success('Xóa chương trình thành công')
                fetchPrograms()
            }
        } catch (error) {
            toast.error('Lỗi xóa chương trình')
        }
        setDeleteModal({ show: false, programId: null })
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.code.trim()) {
            errors.code = 'Mã chương trình không được để trống'
        }

        if (!formData.name.trim()) {
            errors.name = 'Tên chương trình không được để trống'
        }

        if (!formData.organizationId) {
            errors.organizationId = 'Vui lòng chọn tổ chức'
        }

        if (!formData.status) {
            errors.status = 'Vui lòng chọn trạng thái'
        }

        if (formData.startDate && formData.endDate) {
            const startDate = new Date(formData.startDate)
            const endDate = new Date(formData.endDate)

            if (startDate >= endDate) {
                errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
            }
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            description: '',
            version: '',
            organizationId: '',
            startDate: '',
            endDate: '',
            status: 'active',
            criteria: '',
            scope: '',
            objective: '',
            isActive: true
        })
        setFormErrors({})
        setEditingProgram(null)
    }

    const openEditModal = (program) => {
        setEditingProgram(program)
        setFormData({
            code: program.code,
            name: program.name,
            description: program.description || '',
            version: program.version || '',
            organizationId: program.organizationId,
            startDate: program.startDate || '',
            endDate: program.endDate || '',
            status: program.status,
            criteria: program.criteria || '',
            scope: program.scope || '',
            objective: program.objective || '',
            isActive: program.isActive !== false
        })
        setShowEditModal(true)
    }

    const openDetailModal = (program) => {
        setViewingProgram(program)
        setShowDetailModal(true)
    }

    const getStatusConfig = (status) => {
        const config = statusOptions.find(s => s.value === status)
        return config || { label: status, color: 'gray' }
    }

    const getStatusBadge = (status) => {
        const config = getStatusConfig(status)
        const colorClasses = {
            gray: 'bg-gray-100 text-gray-800',
            green: 'bg-green-100 text-green-800',
            blue: 'bg-blue-100 text-blue-800',
            yellow: 'bg-yellow-100 text-yellow-800',
            red: 'bg-red-100 text-red-800'
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[config.color]}`}>
                {config.label}
            </span>
        )
    }

    const ProgramForm = ({ isEdit = false }) => (
        <form onSubmit={isEdit ? handleEditProgram : handleCreateProgram} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã chương trình *
                    </label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="VD: AUN-QA-2023"
                    />
                    {formErrors.code && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phiên bản
                    </label>
                    <input
                        type="text"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="VD: 2.0"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chương trình *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập tên chương trình"
                />
                {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
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
                    placeholder="Mô tả chi tiết về chương trình"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tổ chức thực hiện *
                    </label>
                    <select
                        value={formData.organizationId}
                        onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.organizationId ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Chọn tổ chức</option>
                        {organizations.map(org => (
                            <option key={org.id} value={org.id}>
                                {org.name}
                            </option>
                        ))}
                    </select>
                    {formErrors.organizationId && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.organizationId}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái *
                    </label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.status ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        {statusOptions.map(status => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                    {formErrors.status && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.status}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày bắt đầu
                    </label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày kết thúc
                    </label>
                    <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        min={formData.startDate}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {formErrors.endDate && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu chí đánh giá
                </label>
                <textarea
                    value={formData.criteria}
                    onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mô tả tiêu chí đánh giá của chương trình"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phạm vi áp dụng
                </label>
                <textarea
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phạm vi áp dụng của chương trình"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mục tiêu
                </label>
                <textarea
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mục tiêu của chương trình"
                />
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
                    Kích hoạt chương trình
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý chương trình đánh giá</h1>
                    <p className="text-gray-600 mt-1">Quản lý các chương trình đánh giá chất lượng trong hệ thống</p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setShowCreateModal(true)
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm chương trình
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm theo tên, mã chương trình..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Danh sách chương trình ({totalItems})
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải...</p>
                    </div>
                ) : programs.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Chưa có chương trình nào
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Bắt đầu bằng cách tạo chương trình đánh giá đầu tiên
                        </p>
                        <button
                            onClick={() => {
                                resetForm()
                                setShowCreateModal(true)
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm chương trình
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {programs.map(program => (
                            <div key={program.id} className="p-6 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <BookOpen className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="text-lg font-medium text-gray-900">
                                                    {program.name}
                                                </h4>
                                                {getStatusBadge(program.status)}
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    program.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {program.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                </span>
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <span className="font-medium mr-2">Mã:</span>
                                                    <span className="font-mono">{program.code}</span>
                                                    {program.version && (
                                                        <>
                                                            <span className="mx-3">•</span>
                                                            <span className="font-medium mr-2">Phiên bản:</span>
                                                            <span>{program.version}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {program.description && (
                                                    <p className="text-gray-600 line-clamp-2">
                                                        {program.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center space-x-4 text-xs">
                                                    <div className="flex items-center">
                                                        <Building className="h-3 w-3 mr-1" />
                                                        <span>{program.organization?.shortName}</span>
                                                    </div>
                                                    {program.startDate && program.endDate && (
                                                        <div className="flex items-center">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            <span>
                                                                {formatDate(program.startDate)} - {formatDate(program.endDate)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-4 text-xs">
                                                    <div className="flex items-center">
                                                        <BookOpen className="h-3 w-3 mr-1" />
                                                        <span>{program.standardCount || 0} tiêu chuẩn</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FileText className="h-3 w-3 mr-1" />
                                                        <span>{program.criteriaCount || 0} tiêu chí</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FileText className="h-3 w-3 mr-1" />
                                                        <span>{program.evidenceCount || 0} minh chứng</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Users className="h-3 w-3 mr-1" />
                                                        <span>{program.userCount || 0} người dùng</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => openDetailModal(program)}
                                            className="text-blue-600 hover:text-blue-800 p-2"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(program)}
                                            className="text-green-600 hover:text-green-800 p-2"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ show: true, programId: program.id })}
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

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Thêm chương trình đánh giá mới"
                size="xlarge"
            >
                <ProgramForm />
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Chỉnh sửa chương trình đánh giá"
                size="xlarge"
            >
                <ProgramForm isEdit={true} />
            </Modal>

            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Thông tin chi tiết chương trình"
                size="large"
            >
                {viewingProgram && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Mã chương trình</label>
                                <p className="text-sm text-gray-900 font-mono">{viewingProgram.code}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Phiên bản</label>
                                <p className="text-sm text-gray-900">{viewingProgram.version || 'N/A'}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500">Tên chương trình</label>
                            <p className="text-sm text-gray-900">{viewingProgram.name}</p>
                        </div>

                        {viewingProgram.description && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Mô tả</label>
                                <p className="text-sm text-gray-900">{viewingProgram.description}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Tổ chức thực hiện</label>
                                <p className="text-sm text-gray-900">{viewingProgram.organization?.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Trạng thái</label>
                                <div className="mt-1">
                                    {getStatusBadge(viewingProgram.status)}
                                </div>
                            </div>
                        </div>

                        {(viewingProgram.startDate || viewingProgram.endDate) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {viewingProgram.startDate && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Ngày bắt đầu</label>
                                        <p className="text-sm text-gray-900">{formatDate(viewingProgram.startDate)}</p>
                                    </div>
                                )}
                                {viewingProgram.endDate && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Ngày kết thúc</label>
                                        <p className="text-sm text-gray-900">{formatDate(viewingProgram.endDate)}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {viewingProgram.criteria && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Tiêu chí đánh giá</label>
                                <p className="text-sm text-gray-900">{viewingProgram.criteria}</p>
                            </div>
                        )}

                        {viewingProgram.scope && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Phạm vi áp dụng</label>
                                <p className="text-sm text-gray-900">{viewingProgram.scope}</p>
                            </div>
                        )}

                        {viewingProgram.objective && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Mục tiêu</label>
                                <p className="text-sm text-gray-900">{viewingProgram.objective}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{viewingProgram.standardCount || 0}</p>
                                <p className="text-xs text-gray-600">Tiêu chuẩn</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{viewingProgram.criteriaCount || 0}</p>
                                <p className="text-xs text-gray-600">Tiêu chí</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">{viewingProgram.evidenceCount || 0}</p>
                                <p className="text-xs text-gray-600">Minh chứng</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">{viewingProgram.userCount || 0}</p>
                                <p className="text-xs text-gray-600">Người dùng</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, programId: null })}
                onConfirm={handleDeleteProgram}
                title="Xác nhận xóa chương trình"
                message="Bạn có chắc chắn muốn xóa chương trình này? Thao tác này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan bao gồm tiêu chuẩn, tiêu chí và minh chứng."
                confirmText="Xóa"
                type="danger"
            />
        </div>
    )
}