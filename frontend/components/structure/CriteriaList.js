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
    FileText
} from 'lucide-react'
import { ConfirmModal } from '../common/Modal'
import Modal from '../common/Modal'
import Pagination from '../common/Pagination'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function CriteriaList() {
    const [criteria, setCriteria] = useState([])
    const [standards, setStandards] = useState([])
    const [programs, setPrograms] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedStandard, setSelectedStandard] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [showFilters, setShowFilters] = useState(false)
    const [expandedStandards, setExpandedStandards] = useState(new Set())

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState({ show: false, criteriaId: null })
    const [editingCriteria, setEditingCriteria] = useState(null)

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        standardId: '',
        order: 0,
        isActive: true
    })
    const [formErrors, setFormErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const itemsPerPage = 10

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        fetchCriteria()
    }, [searchQuery, selectedProgram, selectedStandard, currentPage])

    const fetchInitialData = async () => {
        try {
            // Fetch programs and standards
            const [programsRes, standardsRes] = await Promise.all([
                apiMethods.getPrograms(),
                apiMethods.getStandards()
            ])

            if (programsRes.data.success) {
                setPrograms(programsRes.data.data)
            }

            if (standardsRes.data.success) {
                setStandards(standardsRes.data.data)
            }
        } catch (error) {
            toast.error('Lỗi tải dữ liệu')
        }
    }

    const fetchCriteria = async () => {
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchQuery,
                programId: selectedProgram,
                standardId: selectedStandard
            }

            const response = await apiMethods.getCriteria(params)

            if (response.data.success) {
                setCriteria(response.data.data.criteria)
                setTotalPages(response.data.data.pagination.totalPages)
                setTotalItems(response.data.data.pagination.total)
            }
        } catch (error) {
            toast.error('Lỗi tải danh sách tiêu chí')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCriteria = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            const response = await apiMethods.createCriterion(formData)

            if (response.data.success) {
                toast.success('Tạo tiêu chí thành công')
                setShowCreateModal(false)
                resetForm()
                fetchCriteria()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi tạo tiêu chí')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditCriteria = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            const response = await apiMethods.updateCriterion(editingCriteria.id, formData)

            if (response.data.success) {
                toast.success('Cập nhật tiêu chí thành công')
                setShowEditModal(false)
                resetForm()
                fetchCriteria()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi cập nhật tiêu chí')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteCriteria = async () => {
        try {
            const response = await apiMethods.deleteCriterion(deleteModal.criteriaId)

            if (response.data.success) {
                toast.success('Xóa tiêu chí thành công')
                fetchCriteria()
            }
        } catch (error) {
            toast.error('Lỗi xóa tiêu chí')
        }
        setDeleteModal({ show: false, criteriaId: null })
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.code.trim()) {
            errors.code = 'Mã tiêu chí không được để trống'
        }

        if (!formData.name.trim()) {
            errors.name = 'Tên tiêu chí không được để trống'
        }

        if (!formData.standardId) {
            errors.standardId = 'Vui lòng chọn tiêu chuẩn'
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
            standardId: '',
            order: 0,
            isActive: true
        })
        setFormErrors({})
        setEditingCriteria(null)
    }

    const openEditModal = (criteria) => {
        setEditingCriteria(criteria)
        setFormData({
            code: criteria.code,
            name: criteria.name,
            description: criteria.description || '',
            standardId: criteria.standardId,
            order: criteria.order || 0,
            isActive: criteria.isActive !== false
        })
        setShowEditModal(true)
    }

    const openCreateModal = () => {
        resetForm()
        if (selectedStandard) {
            setFormData(prev => ({ ...prev, standardId: selectedStandard }))
        }
        setShowCreateModal(true)
    }

    const toggleStandardExpansion = (standardId) => {
        const newExpanded = new Set(expandedStandards)
        if (newExpanded.has(standardId)) {
            newExpanded.delete(standardId)
        } else {
            newExpanded.add(standardId)
        }
        setExpandedStandards(newExpanded)
    }

    const getFilteredStandards = () => {
        if (!selectedProgram) return standards
        return standards.filter(std => std.programId === selectedProgram)
    }

    const getCriteriaByStandard = (standardId) => {
        return criteria.filter(criteria => criteria.standardId === standardId)
    }

    const CriteriaForm = ({ isEdit = false }) => (
        <form onSubmit={isEdit ? handleEditCriteria : handleCreateCriteria} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã tiêu chí *
                    </label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Nhập mã tiêu chí"
                    />
                    {formErrors.code && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tiêu chuẩn *
                    </label>
                    <select
                        value={formData.standardId}
                        onChange={(e) => setFormData({ ...formData, standardId: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.standardId ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Chọn tiêu chuẩn</option>
                        {getFilteredStandards().map(standard => (
                            <option key={standard.id} value={standard.id}>
                                {standard.code} - {standard.name}
                            </option>
                        ))}
                    </select>
                    {formErrors.standardId && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.standardId}</p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên tiêu chí *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập tên tiêu chí"
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
                    placeholder="Nhập mô tả tiêu chí"
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý tiêu chí</h1>
                    <p className="text-gray-600 mt-1">Quản lý các tiêu chí đánh giá trong hệ thống</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm tiêu chí
                </button>
            </div>

            {/* Filters */}
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
                            placeholder="Tìm kiếm theo tên, mã tiêu chí..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chương trình
                                </label>
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => {
                                        setSelectedProgram(e.target.value)
                                        setSelectedStandard('') // Reset standard when program changes
                                    }}
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tiêu chuẩn
                                </label>
                                <select
                                    value={selectedStandard}
                                    onChange={(e) => setSelectedStandard(e.target.value)}
                                    disabled={!selectedProgram}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">
                                        {selectedProgram ? 'Tất cả tiêu chuẩn' : 'Chọn chương trình trước'}
                                    </option>
                                    {getFilteredStandards().map(standard => (
                                        <option key={standard.id} value={standard.id}>
                                            {standard.code} - {standard.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Criteria List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Danh sách tiêu chí ({totalItems})
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải...</p>
                    </div>
                ) : (
                    <div className="p-6">
                        {getFilteredStandards().map(standard => {
                            const standardCriteria = getCriteriaByStandard(standard.id)
                            if (standardCriteria.length === 0) return null

                            const isExpanded = expandedStandards.has(standard.id)

                            return (
                                <div key={standard.id} className="mb-6 border border-gray-200 rounded-lg">
                                    <div
                                        onClick={() => toggleStandardExpansion(standard.id)}
                                        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                    >
                                        <div className="flex items-center">
                                            {isExpanded ? (
                                                <ChevronDown className="h-5 w-5 text-gray-500 mr-2" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
                                            )}
                                            <BookOpen className="h-5 w-5 text-blue-500 mr-3" />
                                            <div>
                                                <h4 className="text-lg font-medium text-gray-900">
                                                    {standard.code} - {standard.name}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {standardCriteria.length} tiêu chí
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setFormData(prev => ({ ...prev, standardId: standard.id }))
                                                openCreateModal()
                                            }}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                            title="Thêm tiêu chí cho tiêu chuẩn này"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 border-t border-gray-200">
                                            <div className="space-y-3">
                                                {standardCriteria.map(criteria => (
                                                    <div
                                                        key={criteria.id}
                                                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                                    >
                                                        <div className="flex items-center flex-1">
                                                            <FileText className="h-4 w-4 text-gray-400 mr-3" />
                                                            <div className="flex-1">
                                                                <h5 className="text-sm font-medium text-gray-900">
                                                                    {criteria.code} - {criteria.name}
                                                                </h5>
                                                                {criteria.description && (
                                                                    <p className="text-xs text-gray-600 mt-1">
                                                                        {criteria.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center space-x-4 mt-1">
                                                                    <span className="text-xs text-gray-500">
                                                                        Thứ tự: {criteria.order}
                                                                    </span>
                                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                                        criteria.isActive
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                        {criteria.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex space-x-2 ml-4">
                                                            <button
                                                                onClick={() => openEditModal(criteria)}
                                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteModal({
                                                                    show: true,
                                                                    criteriaId: criteria.id
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

                        {criteria.length === 0 && (
                            <div className="text-center py-12">
                                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Chưa có tiêu chí nào
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Bắt đầu bằng cách tạo tiêu chí đầu tiên
                                </p>
                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm tiêu chí
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

            {/* Create Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Thêm tiêu chí mới"
                size="large"
            >
                <CriteriaForm />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Chỉnh sửa tiêu chí"
                size="large"
            >
                <CriteriaForm isEdit={true} />
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, criteriaId: null })}
                onConfirm={handleDeleteCriteria}
                title="Xác nhận xóa tiêu chí"
                message="Bạn có chắc chắn muốn xóa tiêu chí này? Thao tác này không thể hoàn tác và có thể ảnh hưởng đến các minh chứng liên quan."
                confirmText="Xóa"
                type="danger"
            />
        </div>
    )
}