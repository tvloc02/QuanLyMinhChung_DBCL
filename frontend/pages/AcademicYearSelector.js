import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    Calendar,
    Plus,
    Settings,
    Edit,
    Trash2,
    Check,
    Copy,
    BarChart3,
    Search,
    Filter,
    MoreVertical,
    CheckCircle,
    X,
    Info,
    AlertTriangle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
    academicYearAPI,
    formatAcademicYearName,
    getAcademicYearStatusText,
    validateAcademicYearDates,
    generateAcademicYearCode,
    generateAcademicYearName,
    getNextAcademicYearSuggestion
} from '../utils/academicYear'
import toast from 'react-hot-toast'

const AcademicYearConfiguration = () => {
    const { user } = useAuth()
    const router = useRouter()
    const [academicYears, setAcademicYears] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showCopyModal, setShowCopyModal] = useState(false)
    const [showStatsModal, setShowStatsModal] = useState(false)

    const [selectedYear, setSelectedYear] = useState(null)
    const [availableYearsForCopy, setAvailableYearsForCopy] = useState([])
    const [yearStats, setYearStats] = useState(null)

    const loadAcademicYears = async (page = 1) => {
        try {
            setLoading(true)
            const response = await academicYearAPI.getAll({
                page,
                limit: 10,
                search: searchTerm,
                status: statusFilter === 'all' ? undefined : statusFilter,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            })

            setAcademicYears(response.data.academicYears)
            setTotalPages(response.data.pagination.pages)
            setCurrentPage(response.data.pagination.current)
        } catch (error) {
            toast.error('Lỗi khi tải danh sách năm học')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAcademicYears(currentPage)
    }, [searchTerm, statusFilter, currentPage])

    const handleSearch = (e) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    const handleStatusFilter = (e) => {
        setStatusFilter(e.target.value)
        setCurrentPage(1)
    }

    const handleSetCurrent = async (yearId) => {
        try {
            await academicYearAPI.setCurrent(yearId)
            toast.success('Đã đặt làm năm học hiện tại')
            loadAcademicYears(currentPage)
        } catch (error) {
            toast.error('Lỗi khi đặt năm học hiện tại')
        }
    }

    const handleDelete = async () => {
        if (!selectedYear) return

        try {
            await academicYearAPI.delete(selectedYear._id)
            toast.success('Xóa năm học thành công')
            setShowDeleteModal(false)
            setSelectedYear(null)
            loadAcademicYears(currentPage)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa năm học')
        }
    }

    const handleShowStats = async (year) => {
        try {
            setSelectedYear(year)
            const response = await academicYearAPI.getStatistics(year._id)
            setYearStats(response.data)
            setShowStatsModal(true)
        } catch (error) {
            toast.error('Lỗi khi tải thống kê năm học')
        }
    }

    const handleShowCopy = async (year) => {
        try {
            setSelectedYear(year)
            const response = await academicYearAPI.getAvailableForCopy(year._id)
            setAvailableYearsForCopy(response.data)
            setShowCopyModal(true)
        } catch (error) {
            toast.error('Lỗi khi tải danh sách năm học')
        }
    }

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800'
            case 'draft':
                return 'bg-yellow-100 text-yellow-800'
            case 'completed':
                return 'bg-blue-100 text-blue-800'
            case 'archived':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (!user || !['admin', 'manager'].includes(user.role)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không có quyền truy cập</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Bạn không có quyền truy cập trang này
                    </p>
                </div>
            </div>
        )
    }

    return (

        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Cấu hình năm học</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Quản lý và cấu hình các năm học trong hệ thống
                    </p>
                </div>

                {/* Actions & Filters */}
                <div className="bg-white shadow rounded-lg mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex-1 flex items-center space-x-4">
                                <div className="flex-1 max-w-lg">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm năm học..."
                                            value={searchTerm}
                                            onChange={handleSearch}
                                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Filter className="h-4 w-4 text-gray-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={handleStatusFilter}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="draft">Nháp</option>
                                        <option value="active">Đang hoạt động</option>
                                        <option value="completed">Đã hoàn thành</option>
                                        <option value="archived">Lưu trữ</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm năm học
                            </button>
                        </div>
                    </div>
                </div>

                {/* Academic Years List */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Danh sách năm học ({academicYears.length})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : academicYears.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có năm học nào</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Bắt đầu bằng cách tạo năm học đầu tiên
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Năm học
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thời gian
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thống kê
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {academicYears.map((year) => (
                                        <tr key={year._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatAcademicYearName(year)}
                                                        </div>
                                                        {year.description && (
                                                            <div className="text-sm text-gray-500">
                                                                {year.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {year.isCurrent && (
                                                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Hiện tại
                                                            </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {new Date(year.startDate).toLocaleDateString('vi-VN')} - {new Date(year.endDate).toLocaleDateString('vi-VN')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(year.status)}`}>
                                                        {getAcademicYearStatusText(year.status)}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex space-x-4">
                                                    <span>{year.metadata?.totalPrograms || 0} Chương trình</span>
                                                    <span>{year.metadata?.totalEvidences || 0} Minh chứng</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {!year.isCurrent && (
                                                        <button
                                                            onClick={() => handleSetCurrent(year._id)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Đặt làm năm hiện tại"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleShowStats(year)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Xem thống kê"
                                                    >
                                                        <BarChart3 className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleShowCopy(year)}
                                                        className="text-purple-600 hover:text-purple-900"
                                                        title="Sao chép dữ liệu"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedYear(year)
                                                            setShowEditModal(true)
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>

                                                    {!year.isCurrent && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedYear(year)
                                                                setShowDeleteModal(true)
                                                            }}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Trước
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Hiển thị trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Trước
                                                </button>
                                                <button
                                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Sau
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <AcademicYearModal
                    isEdit={showEditModal}
                    year={selectedYear}
                    onClose={() => {
                        setShowCreateModal(false)
                        setShowEditModal(false)
                        setSelectedYear(null)
                    }}
                    onSuccess={() => {
                        loadAcademicYears(currentPage)
                        setShowCreateModal(false)
                        setShowEditModal(false)
                        setSelectedYear(null)
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <DeleteConfirmModal
                    year={selectedYear}
                    onClose={() => {
                        setShowDeleteModal(false)
                        setSelectedYear(null)
                    }}
                    onConfirm={handleDelete}
                />
            )}

            {/* Copy Data Modal */}
            {showCopyModal && (
                <CopyDataModal
                    year={selectedYear}
                    availableYears={availableYearsForCopy}
                    onClose={() => {
                        setShowCopyModal(false)
                        setSelectedYear(null)
                    }}
                    onSuccess={() => {
                        loadAcademicYears(currentPage)
                        setShowCopyModal(false)
                        setSelectedYear(null)
                    }}
                />
            )}

            {/* Statistics Modal */}
            {showStatsModal && (
                <StatisticsModal
                    year={selectedYear}
                    stats={yearStats}
                    onClose={() => {
                        setShowStatsModal(false)
                        setSelectedYear(null)
                        setYearStats(null)
                    }}
                />
            )}
        </div>
    )
}

// Academic Year Create/Edit Modal Component
const AcademicYearModal = ({ isEdit, year, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        startYear: year?.startYear || '',
        endYear: year?.endYear || '',
        code: year?.code || '',
        name: year?.name || '',
        startDate: year?.startDate ? new Date(year.startDate).toISOString().split('T')[0] : '',
        endDate: year?.endDate ? new Date(year.endDate).toISOString().split('T')[0] : '',
        description: year?.description || '',
        status: year?.status || 'draft',
        isCurrent: year?.isCurrent || false
    })

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))

        // Auto-generate code and name when years change
        if (name === 'startYear' || name === 'endYear') {
            const startYear = name === 'startYear' ? value : formData.startYear
            const endYear = name === 'endYear' ? value : formData.endYear

            if (startYear && endYear) {
                setFormData(prev => ({
                    ...prev,
                    code: generateAcademicYearCode(parseInt(startYear), parseInt(endYear)),
                    name: generateAcademicYearName(parseInt(startYear), parseInt(endYear))
                }))
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setLoading(true)

            const data = {
                ...formData,
                startYear: parseInt(formData.startYear),
                endYear: parseInt(formData.endYear),
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate)
            }

            // Validate
            const errors = validateAcademicYearDates(
                data.startDate,
                data.endDate,
                data.startYear,
                data.endYear
            )

            if (errors.length > 0) {
                toast.error(errors[0])
                return
            }

            if (isEdit) {
                await academicYearAPI.update(year._id, data)
                toast.success('Cập nhật năm học thành công')
            } else {
                await academicYearAPI.create(data)
                toast.success('Tạo năm học thành công')
            }

            onSuccess()
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra'
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {isEdit ? 'Chỉnh sửa năm học' : 'Tạo năm học mới'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white px-6 py-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Năm bắt đầu *
                                        </label>
                                        <input
                                            type="number"
                                            name="startYear"
                                            value={formData.startYear}
                                            onChange={handleInputChange}
                                            min="2020"
                                            max="2050"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Năm kết thúc *
                                        </label>
                                        <input
                                            type="number"
                                            name="endYear"
                                            value={formData.endYear}
                                            onChange={handleInputChange}
                                            min="2021"
                                            max="2051"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Mã năm học *
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        required
                                        pattern="^\d{4}-\d{4}$"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tên năm học *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Ngày bắt đầu *
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Ngày kết thúc *
                                        </label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Trạng thái
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="draft">Nháp</option>
                                        <option value="active">Đang hoạt động</option>
                                        <option value="completed">Đã hoàn thành</option>
                                        <option value="archived">Lưu trữ</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Mô tả
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="isCurrent"
                                        name="isCurrent"
                                        type="checkbox"
                                        checked={formData.isCurrent}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isCurrent" className="ml-2 block text-sm text-gray-900">
                                        Đặt làm năm học hiện tại
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

// Delete Confirmation Modal
const DeleteConfirmModal = ({ year, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-6 py-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Xác nhận xóa năm học
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Bạn có chắc chắn muốn xóa năm học <strong>{formatAcademicYearName(year)}</strong>?
                                        Hành động này không thể hoàn tác.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                        >
                            Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Copy Data Modal
const CopyDataModal = ({ year, availableYears, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false)
    const [selectedSourceYear, setSelectedSourceYear] = useState('')
    const [copySettings, setCopySettings] = useState({
        programs: true,
        organizations: true,
        standards: true,
        criteria: true,
        evidenceTemplates: false
    })

    const handleCopy = async () => {
        if (!selectedSourceYear) {
            toast.error('Vui lòng chọn năm học nguồn')
            return
        }

        try {
            setLoading(true)
            await academicYearAPI.copyData(year._id, selectedSourceYear, copySettings)
            toast.success('Sao chép dữ liệu thành công')
            onSuccess()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi sao chép dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Sao chép dữ liệu từ năm học khác
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Sao chép dữ liệu vào năm học <strong>{formatAcademicYearName(year)}</strong>
                        </p>
                    </div>

                    <div className="bg-white px-6 py-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Chọn năm học nguồn *
                                </label>
                                <select
                                    value={selectedSourceYear}
                                    onChange={(e) => setSelectedSourceYear(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">-- Chọn năm học --</option>
                                    {availableYears.map((sourceYear) => (
                                        <option key={sourceYear._id} value={sourceYear._id}>
                                            {formatAcademicYearName(sourceYear)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chọn dữ liệu cần sao chép
                                </label>
                                <div className="space-y-2">
                                    {Object.entries(copySettings).map(([key, value]) => (
                                        <div key={key} className="flex items-center">
                                            <input
                                                id={key}
                                                name={key}
                                                type="checkbox"
                                                checked={value}
                                                onChange={(e) => setCopySettings(prev => ({
                                                    ...prev,
                                                    [key]: e.target.checked
                                                }))}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={key} className="ml-2 block text-sm text-gray-900">
                                                {key === 'programs' && 'Chương trình đánh giá'}
                                                {key === 'organizations' && 'Tổ chức đánh giá'}
                                                {key === 'standards' && 'Tiêu chuẩn'}
                                                {key === 'criteria' && 'Tiêu chí'}
                                                {key === 'evidenceTemplates' && 'Mẫu minh chứng (không bao gồm file)'}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleCopy}
                            disabled={loading || !selectedSourceYear}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang sao chép...' : 'Sao chép'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Statistics Modal
const StatisticsModal = ({ year, stats, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">
                                Thống kê năm học
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            {formatAcademicYearName(year)}
                        </p>
                    </div>

                    <div className="bg-white px-6 py-4">
                        {stats ? (
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <BookOpen className="h-8 w-8 text-blue-600" />
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-blue-600">Chương trình</p>
                                            <p className="text-2xl font-semibold text-blue-900">{stats.programs}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <Target className="h-8 w-8 text-green-600" />
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-green-600">Tiêu chuẩn</p>
                                            <p className="text-2xl font-semibold text-green-900">{stats.standards}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <CheckSquare className="h-8 w-8 text-yellow-600" />
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-yellow-600">Tiêu chí</p>
                                            <p className="text-2xl font-semibold text-yellow-900">{stats.criteria}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <FileText className="h-8 w-8 text-purple-600" />
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-purple-600">Minh chứng</p>
                                            <p className="text-2xl font-semibold text-purple-900">{stats.evidences}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 px-6 py-3 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AcademicYearConfiguration