import { useState, useEffect } from 'react'
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    BookOpen,
    ChevronDown,
    ChevronRight,
    FileText,
    Eye,
    Building
} from 'lucide-react'
import { ConfirmModal } from '../common/Modal'
import Modal from '../common/Modal'
import Pagination from '../common/Pagination'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function StandardList() {
    const [standards, setStandards] = useState([])
    const [programs, setPrograms] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProgram, setSelectedProgram] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [showFilters, setShowFilters] = useState(false)
    const [expandedPrograms, setExpandedPrograms] = useState(new Set())

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState({ show: false, standardId: null })
    const [editingStandard, setEditingStandard] = useState(null)
    const [viewingStandard, setViewingStandard] = useState(null)

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        programId: '',
        order: 0,
        requirements: '',
        expectedOutcomes: '',
        isActive: true
    })
    const [formErrors, setFormErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const itemsPerPage = 10

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        fetchStandards()
    }, [searchQuery, selectedProgram, currentPage])

    const fetchInitialData = async () => {
        try {
            const response = await apiMethods.getPrograms()
            if (response.data.success) {
                setPrograms(response.data.data)
            }
        } catch (error) {
            toast.error('Lỗi tải dữ liệu chương trình')
        }
    }

    const fetchStandards = async () => {
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchQuery,
                programId: selectedProgram
            }

            // Mock data - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 500))

            const mockData = {
                standards: [
                    {
                        id: '1',
                        code: 'TC1',
                        name: 'Mục tiêu chương trình',
                        description: 'Chương trình phải có mục tiêu giáo dục được xác định rõ ràng và nhất quán với sứ mệnh của cơ sở giáo dục',
                        programId: '1',
                        program: {
                            name: 'Chương trình đánh giá chất lượng giáo dục AUN-QA 2023',
                            code: 'AUN-QA-2023'
                        },
                        order: 1,
                        requirements: 'Phải có tài liệu mô tả mục tiêu chương trình đào tạo',
                        expectedOutcomes: 'Mục tiêu chương trình được xác định rõ ràng và phù hợp',
                        isActive: true,
                        createdAt: '2023-01-15T00:00:00Z',
                        updatedAt: '2024-12-25T10:00:00Z',
                        criteriaCount: 4
                    },
                    {
                        id: '2',
                        code: 'TC2',
                        name: 'Đầu ra chương trình',
                        description: 'Chuẩn đầu ra của chương trình phải được xác định rõ ràng',
                        programId: '1',
                        program: {
                            name: 'Chương trình đánh giá chất lượng giáo dục AUN-QA 2023',
                            code: 'AUN-QA-2023'
                        },
                        order: 2,
                        requirements: 'Chuẩn đầu ra phải được mô tả chi tiết và có thể đo lường được',
                        expectedOutcomes: 'Sinh viên đạt được chuẩn đầu ra theo yêu cầu',
                        isActive: true,
                        createdAt: '2023-01-15T00:00:00Z',
                        updatedAt: '2024-12-20T15:30:00Z',
                        criteriaCount: 3
                    }
                ],
                pagination: {
                    total: 2,
                    totalPages: 1,
                    currentPage: 1
                }
            }

            setStandards(mockData.standards)
            setTotalPages(mockData.pagination.totalPages)
            setTotalItems(mockData.pagination.total)
        } catch (error) {
            toast.error('Lỗi tải danh sách tiêu chuẩn')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateStandard = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            const response = await apiMethods.createStandard(formData)

            if (response.data.success) {
                toast.success('Tạo tiêu chuẩn thành công')
                setShowCreateModal(false)
                resetForm()
                fetchStandards()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi tạo tiêu chuẩn')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditStandard = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            const response = await apiMethods.updateStandard(editingStandard.id, formData)

            if (response.data.success) {
                toast.success('Cập nhật tiêu chuẩn thành công')
                setShowEditModal(false)
                resetForm()
                fetchStandards()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật tiêu chuẩn')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteStandard = async () => {
        try {
            const response = await apiMethods.deleteStandard(deleteModal.standardId)

            if (response.data.success) {
                toast.success('Xóa tiêu chuẩn thành công')
                fetchStandards()
            }
        } catch (error) {
            toast.error('Lỗi xóa tiêu chuẩn')
        }
        setDeleteModal({ show: false, standardId: null })
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.code.trim()) {
            errors.code = 'Mã tiêu chuẩn không được để trống'
        }

        if (!formData.name.trim()) {
            errors.name = 'Tên tiêu chuẩn không được để trống'
        }

        if (!formData.programId) {
            errors.programId = 'Vui lòng chọn chương trình'
        }

        if (formData.order < 0) {
            errors.order = 'Thứ tự phải là số dương'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            description: '',
            programId: '',
            order: 0,
            requirements: '',
            expectedOutcomes: '',
            isActive: true
        })
        setFormErrors({})
        setEditingStandard(null)
    }

    const openEditModal = (standard) => {
        setEditingStandard(standard)
        setFormData({
            code: standard.code,
            name: standard.name,
            description: standard.description || '',
            programId: standard.programId,
            order: standard.order || 0,
            requirements: standard.requirements || '',
            expectedOutcomes: standard.expectedOutcomes || '',
            isActive: standard.isActive !== false
        })
        setShowEditModal(true)
    }

    const openDetailModal = (standard) => {
        setViewingStandard(standard)
        setShowDetailModal(true)
    }

    const openCreateModal = () => {
        resetForm()
        if (selectedProgram) {
            setFormData(prev => ({ ...prev, programId: selectedProgram }))
        }
        setShowCreateModal(true)
    }

    const toggleProgramExpansion = (programId) => {
        const newExpanded = new Set(expandedPrograms)
        if (newExpanded.has(programId)) {
            newExpanded.delete(programId)
        } else {
            newExpanded.add(programId)
        }
        setExpandedPrograms(newExpanded)
    }

    const getFilteredPrograms = () => {
        return programs
    }

    const getStandardsByProgram = (programId) => {
        return standards.filter(standard => standard.programId === programId)
    }

    const StandardForm = ({ isEdit = false }) => (
        <form onSubmit={isEdit ? handleEditStandard : handleCreateStandard} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã tiêu chuẩn *
                    </label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập mã tiêu chuẩn"
                    />
                    {formErrors.code && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chương trình *
                    </label>
                    <select
                        value={formData.programId}
                        onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.programId ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Chọn chương trình</option>
                        {programs.map(program => (
                            <option key={program.id} value={program.id}>
                                {program.code} - {program.name}
                            </option>
                        ))}
                    </select>
                    {formErrors.programId && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.programId}</p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên tiêu chuẩn *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập tên tiêu chuẩn"
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
                    placeholder="Nhập mô tả tiêu chuẩn"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yêu cầu
                </label>
                <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập yêu cầu của tiêu chuẩn"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kết quả mong đợi
                </label>
                <textarea
                    value={formData.expectedOutcomes}
                    onChange={(e) => setFormData({ ...formData, expectedOutcomes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập kết quả mong đợi"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thứ tự
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.order ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {formErrors.order && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.order}</p>
                    )}
                </div>

                <div className="flex items-center mt-6">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                        Kích hoạt
                    </label>
                </div>
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
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý tiêu chuẩn</h1>
                    <p className="text-gray-600 mt-1">Quản lý các tiêu chuẩn đánh giá trong hệ thống</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm tiêu chuẩn
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Tìm kiếm và lọc</h3>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <Filter className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tên, mã tiêu chuẩn..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {showFilters && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Chương trình
                            </label>
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả chương trình</option>
                                {programs.map(program => (
                                    <option key={program.id} value={program.id}>
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Danh sách tiêu chuẩn ({totalItems})
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải...</p>
                    </div>
                ) : (
                    <div className="p-6">
                        {getFilteredPrograms().map(program => {
                            const programStandards = getStandardsByProgram(program.id)
                            if (programStandards.length === 0) return null

                            const isExpanded = expandedPrograms.has(program.id)

                            return (
                                <div key={program.id} className="mb-6 border border-gray-200 rounded-lg">
                                    <div
                                        onClick={() => toggleProgramExpansion(program.id)}
                                        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                    >
                                        <div className="flex items-center">
                                            {isExpanded ? (
                                                <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
                                            )}
                                            <Building className="h-5 w-5 text-blue-500 mr-3" />
                                            <div>
                                                <h4 className="text-lg font-medium text-gray-900">
                                                    {program.code} - {program.name}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {programStandards.length} tiêu chuẩn
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setFormData(prev => ({ ...prev, programId: program.id }))
                                                openCreateModal()
                                            }}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                            title="Thêm tiêu chuẩn cho chương trình này"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 border-t border-gray-200">
                                            <div className="space-y-3">
                                                {programStandards.map(standard => (
                                                    <div
                                                        key={standard.id}
                                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                                    >
                                                        <div className="flex items-center flex-1">
                                                            <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                                                            <div className="flex-1">
                                                                <h5 className="text-lg font-medium text-gray-900">
                                                                    {standard.code} - {standard.name}
                                                                </h5>
                                                                {standard.description && (
                                                                    <p className="text-sm text-gray-600 mt-1">
                                                                        {standard.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center space-x-4 mt-2">
                                                                    <span className="text-xs text-gray-500">
                                                                        Thứ tự: {standard.order}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {standard.criteriaCount || 0} tiêu chí
                                                                    </span>
                                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                                        standard.isActive
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                        {standard.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex space-x-2 ml-4">
                                                            <button
                                                                onClick={() => openDetailModal(standard)}
                                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                                title="Xem chi tiết"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(standard)}
                                                                className="text-green-600 hover:text-green-800 p-1"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteModal({
                                                                    show: true,
                                                                    standardId: standard.id
                                                                })}
                                                                className="text-red-600 hover:text-red-800 p-1"
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {standards.length === 0 && (
                            <div className="text-center py-12">
                                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Chưa có tiêu chuẩn nào
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Bắt đầu bằng cách tạo tiêu chuẩn đầu tiên
                                </p>
                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm tiêu chuẩn
                                </button>
                            </div>
                        )}
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
                title="Thêm tiêu chuẩn mới"
                size="large"
            >
                <StandardForm />
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Chỉnh sửa tiêu chuẩn"
                size="large"
            >
                <StandardForm isEdit={true} />
            </Modal>

            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Thông tin chi tiết tiêu chuẩn"
                size="large"
            >
                {viewingStandard && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Mã tiêu chuẩn</label>
                                <p className="text-sm text-gray-900 font-mono">{viewingStandard.code}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Thứ tự</label>
                                <p className="text-sm text-gray-900">{viewingStandard.order}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500">Tên tiêu chuẩn</label>
                            <p className="text-sm text-gray-900">{viewingStandard.name}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-500">Chương trình</label>
                            <p className="text-sm text-gray-900">{viewingStandard.program?.name}</p>
                        </div>

                        {viewingStandard.description && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Mô tả</label>
                                <p className="text-sm text-gray-900">{viewingStandard.description}</p>
                            </div>
                        )}

                        {viewingStandard.requirements && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Yêu cầu</label>
                                <p className="text-sm text-gray-900">{viewingStandard.requirements}</p>
                            </div>
                        )}

                        {viewingStandard.expectedOutcomes && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Kết quả mong đợi</label>
                                <p className="text-sm text-gray-900">{viewingStandard.expectedOutcomes}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Ngày tạo</label>
                                <p className="text-sm text-gray-900">{formatDate(viewingStandard.createdAt)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Cập nhật cuối</label>
                                <p className="text-sm text-gray-900">{formatDate(viewingStandard.updatedAt)}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{viewingStandard.criteriaCount || 0}</p>
                                <p className="text-xs text-gray-600">Số tiêu chí</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, standardId: null })}
                onConfirm={handleDeleteStandard}
                title="Xác nhận xóa tiêu chuẩn"
                message="Bạn có chắc chắn muốn xóa tiêu chuẩn này? Thao tác này không thể hoàn tác và có thể ảnh hưởng đến các tiêu chí và minh chứng liên quan."
                confirmText="Xóa"
                type="danger"
            />
        </div>
    )
}