import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { ConfirmModal } from '../../components/common/Modal'
import Modal from '../../components/common/Modal'
import Pagination from '../../components/common/Pagination'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
    Plus,
    Edit,
    Trash2,
    Search,
    BookOpen,
    Award,
    Star,
    Eye,
    Settings
} from 'lucide-react'

export default function AssessmentLevelsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [levels, setLevels] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState({ show: false, levelId: null })
    const [editingLevel, setEditingLevel] = useState(null)
    const [viewingLevel, setViewingLevel] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        minScore: 0,
        maxScore: 100,
        color: '#3B82F6',
        order: 0,
        requirements: '',
        isActive: true
    })
    const [formErrors, setFormErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    const itemsPerPage = 10

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchLevels()
        }
    }, [user, searchQuery, currentPage])

    const breadcrumbItems = [
        { name: 'Cấp đánh giá', icon: BookOpen }
    ]

    const fetchLevels = async () => {
        try {
            setLoading(true)
            await new Promise(resolve => setTimeout(resolve, 500))

            let filteredLevels = mockData.levels
            if (searchQuery) {
                filteredLevels = mockData.levels.filter(level =>
                    level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    level.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    level.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
            }

            setLevels(filteredLevels)
            setTotalPages(Math.ceil(filteredLevels.length / itemsPerPage))
            setTotalItems(filteredLevels.length)
        } catch (error) {
            toast.error('Lỗi tải danh sách cấp đánh giá')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateLevel = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success('Tạo cấp đánh giá thành công')
            setShowCreateModal(false)
            resetForm()
            fetchLevels()
        } catch (error) {
            toast.error('Lỗi tạo cấp đánh giá')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditLevel = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success('Cập nhật cấp đánh giá thành công')
            setShowEditModal(false)
            resetForm()
            fetchLevels()
        } catch (error) {
            toast.error('Lỗi cập nhật cấp đánh giá')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteLevel = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success('Xóa cấp đánh giá thành công')
            fetchLevels()
        } catch (error) {
            toast.error('Lỗi xóa cấp đánh giá')
        }
        setDeleteModal({ show: false, levelId: null })
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.name.trim()) {
            errors.name = 'Tên cấp đánh giá không được để trống'
        }

        if (!formData.code.trim()) {
            errors.code = 'Mã cấp đánh giá không được để trống'
        }

        if (formData.minScore < 0 || formData.minScore > 100) {
            errors.minScore = 'Điểm tối thiểu phải từ 0 đến 100'
        }

        if (formData.maxScore < 0 || formData.maxScore > 100) {
            errors.maxScore = 'Điểm tối đa phải từ 0 đến 100'
        }

        if (formData.minScore >= formData.maxScore) {
            errors.maxScore = 'Điểm tối đa phải lớn hơn điểm tối thiểu'
        }

        if (formData.order < 0) {
            errors.order = 'Thứ tự phải là số dương'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            minScore: 0,
            maxScore: 100,
            color: '#3B82F6',
            order: 0,
            requirements: '',
            isActive: true
        })
        setFormErrors({})
        setEditingLevel(null)
    }

    const openEditModal = (level) => {
        setEditingLevel(level)
        setFormData({
            name: level.name,
            code: level.code,
            description: level.description || '',
            minScore: level.minScore,
            maxScore: level.maxScore,
            color: level.color || '#3B82F6',
            order: level.order || 0,
            requirements: level.requirements || '',
            isActive: level.isActive !== false
        })
        setShowEditModal(true)
    }

    const openDetailModal = (level) => {
        setViewingLevel(level)
        setShowDetailModal(true)
    }

    const getLevelIcon = (score) => {
        if (score >= 90) return <Award className="h-5 w-5" />
        if (score >= 75) return <Star className="h-5 w-5" />
        if (score >= 60) return <BookOpen className="h-5 w-5" />
        return <Settings className="h-5 w-5" />
    }

    const LevelForm = ({ isEdit = false }) => (
        <form onSubmit={isEdit ? handleEditLevel : handleCreateLevel} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên cấp đánh giá *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="VD: Xuất sắc"
                    />
                    {formErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã cấp đánh giá *
                    </label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="VD: EXCELLENT"
                    />
                    {formErrors.code && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                    )}
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
                    placeholder="Mô tả chi tiết về cấp đánh giá này"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Điểm tối thiểu *
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.minScore}
                        onChange={(e) => setFormData({ ...formData, minScore: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.minScore ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {formErrors.minScore && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.minScore}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Điểm tối đa *
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.maxScore}
                        onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 0 })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.maxScore ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {formErrors.maxScore && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.maxScore}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Màu sắc
                    </label>
                    <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
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
                    placeholder="Yêu cầu để đạt được cấp đánh giá này"
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý cấp đánh giá</h1>
                        <p className="text-gray-600 mt-1">Quản lý các cấp độ đánh giá chất lượng</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm()
                            setShowCreateModal(true)
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm cấp đánh giá
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm theo tên, mã cấp đánh giá..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Assessment Levels List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Danh sách cấp đánh giá ({totalItems})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải...</p>
                        </div>
                    ) : levels.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Chưa có cấp đánh giá nào
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Bắt đầu bằng cách tạo cấp đánh giá đầu tiên
                            </p>
                            <button
                                onClick={() => {
                                    resetForm()
                                    setShowCreateModal(true)
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm cấp đánh giá
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {levels.map(level => (
                                <div key={level.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 flex-1">
                                            <div
                                                className="p-3 rounded-lg text-white"
                                                style={{ backgroundColor: level.color }}
                                            >
                                                {getLevelIcon(level.minScore)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="text-lg font-medium text-gray-900">
                                                        {level.name}
                                                    </h4>
                                                    <span className="text-sm text-gray-500 font-mono">
                                                        ({level.code})
                                                    </span>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        level.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {level.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                    {level.description}
                                                </p>

                                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                    <span>Điểm: {level.minScore} - {level.maxScore}</span>
                                                    <span>•</span>
                                                    <span>Thứ tự: {level.order}</span>
                                                    <span>•</span>
                                                    <span>Sử dụng: {level.usageCount} lần</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => openDetailModal(level)}
                                                className="text-blue-600 hover:text-blue-800 p-2"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(level)}
                                                className="text-green-600 hover:text-green-800 p-2"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ show: true, levelId: level.id })}
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
                    title="Thêm cấp đánh giá mới"
                    size="large"
                >
                    <LevelForm />
                </Modal>

                {/* Edit Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Chỉnh sửa cấp đánh giá"
                    size="large"
                >
                    <LevelForm isEdit={true} />
                </Modal>

                {/* Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Thông tin chi tiết cấp đánh giá"
                    size="large"
                >
                    {viewingLevel && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div
                                    className="p-4 rounded-lg text-white"
                                    style={{ backgroundColor: viewingLevel.color }}
                                >
                                    {getLevelIcon(viewingLevel.minScore)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{viewingLevel.name}</h3>
                                    <p className="text-gray-600 font-mono">({viewingLevel.code})</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Điểm tối thiểu</label>
                                    <p className="text-sm text-gray-900">{viewingLevel.minScore}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Điểm tối đa</label>
                                    <p className="text-sm text-gray-900">{viewingLevel.maxScore}</p>
                                </div>
                            </div>

                            {viewingLevel.description && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Mô tả</label>
                                    <p className="text-sm text-gray-900">{viewingLevel.description}</p>
                                </div>
                            )}

                            {viewingLevel.requirements && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Yêu cầu</label>
                                    <p className="text-sm text-gray-900">{viewingLevel.requirements}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Thứ tự</label>
                                    <p className="text-sm text-gray-900">{viewingLevel.order}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Số lần sử dụng</label>
                                    <p className="text-sm text-gray-900">{viewingLevel.usageCount}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Trạng thái</label>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        viewingLevel.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {viewingLevel.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Ngày tạo</label>
                                    <p className="text-sm text-gray-900">{formatDate(viewingLevel.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Cập nhật cuối</label>
                                    <p className="text-sm text-gray-900">{formatDate(viewingLevel.updatedAt)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Delete Confirmation */}
                <ConfirmModal
                    isOpen={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, levelId: null })}
                    onConfirm={handleDeleteLevel}
                    title="Xác nhận xóa cấp đánh giá"
                    message="Bạn có chắc chắn muốn xóa cấp đánh giá này? Thao tác này không thể hoàn tác và có thể ảnh hưởng đến các đánh giá đã thực hiện."
                    confirmText="Xóa"
                    type="danger"
                />
            </div>
        </Layout>
    )
}