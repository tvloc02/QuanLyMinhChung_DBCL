import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit3,
    Trash2,
    Copy,
    Settings,
    Calendar,
    CheckCircle,
    Clock,
    Archive,
    FileText,
    Eye,
    Users,
    BookOpen,
    Target,
    Folder,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

const AcademicYearsPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [academicYears, setAcademicYears] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({})
    const [selectedYear, setSelectedYear] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showActionsDropdown, setShowActionsDropdown] = useState(null)

    const breadcrumbItems = [
        { name: 'Quản lý năm học', icon: Calendar }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    const statusConfig = {
        draft: { label: 'Nháp', color: 'bg-yellow-100 text-yellow-800', icon: FileText },
        active: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-800', icon: CheckCircle },
        completed: { label: 'Đã hoàn thành', color: 'bg-blue-100 text-blue-800', icon: Clock },
        archived: { label: 'Đã lưu trữ', color: 'bg-gray-100 text-gray-800', icon: Archive }
    }

    useEffect(() => {
        fetchAcademicYears()
    }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder])

    const fetchAcademicYears = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                sortBy,
                sortOrder,
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter && { status: statusFilter })
            })

            const response = await fetch(`/api/academic-years?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Không thể tải danh sách năm học')
            }

            const result = await response.json()
            if (result.success) {
                setAcademicYears(result.data.academicYears)
                setPagination(result.data.pagination)
            } else {
                throw new Error(result.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1)
    }

    const handleStatusFilter = (status) => {
        setStatusFilter(status)
        setCurrentPage(1)
    }

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
        setCurrentPage(1)
    }

    const handleSetCurrent = async (yearId) => {
        try {
            const response = await fetch(`/api/academic-years/${yearId}/set-current`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                await fetchAcademicYears()
                alert('Đã đặt làm năm học hiện tại thành công')
            } else {
                const error = await response.json()
                alert(error.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            alert('Có lỗi xảy ra khi đặt năm học hiện tại')
        }
    }

    const handleDelete = async () => {
        if (!selectedYear) return

        try {
            const response = await fetch(`/api/academic-years/${selectedYear._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                await fetchAcademicYears()
                setShowDeleteModal(false)
                setSelectedYear(null)
                alert('Xóa năm học thành công')
            } else {
                const error = await response.json()
                alert(error.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            alert('Có lỗi xảy ra khi xóa năm học')
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN')
    }

    const StatusBadge = ({ status }) => {
        const config = statusConfig[status] || statusConfig.draft
        const Icon = config.icon
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        )
    }

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

    if (loading && academicYears.length === 0) {
        return (
            <Layout
                title=""
                breadcrumbItems={breadcrumbItems}
            >
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý năm học</h1>
                        <p className="text-gray-600 mt-1">Quản lý và cấu hình các năm học trong hệ thống</p>
                    </div>
                    <Link href="/academic-years/create">
                        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <Plus className="w-4 h-4" />
                            <span>Tạo năm học mới</span>
                        </button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm theo tên, mã hoặc mô tả..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => handleStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="draft">Nháp</option>
                                    <option value="active">Đang hoạt động</option>
                                    <option value="completed">Đã hoàn thành</option>
                                    <option value="archived">Đã lưu trữ</option>
                                </select>
                            </div>

                            {/* Sort */}
                            <div>
                                <select
                                    value={`${sortBy}-${sortOrder}`}
                                    onChange={(e) => {
                                        const [field, order] = e.target.value.split('-')
                                        setSortBy(field)
                                        setSortOrder(order)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="createdAt-desc">Mới nhất</option>
                                    <option value="createdAt-asc">Cũ nhất</option>
                                    <option value="name-asc">Tên A-Z</option>
                                    <option value="name-desc">Tên Z-A</option>
                                    <option value="startYear-desc">Năm bắt đầu (mới)</option>
                                    <option value="startYear-asc">Năm bắt đầu (cũ)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Academic Years List */}
                <div className="bg-white rounded-lg shadow">
                    {academicYears.length === 0 ? (
                        <div className="p-12 text-center">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có năm học nào</h3>
                            <p className="text-gray-500 mb-4">Bắt đầu bằng cách tạo năm học đầu tiên</p>
                            <Link href="/academic-years/create">
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                    Tạo năm học mới
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                                <div className="grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="col-span-3">
                                        <button
                                            onClick={() => handleSort('name')}
                                            className="flex items-center space-x-1 hover:text-gray-900"
                                        >
                                            <span>Năm học</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="col-span-2">
                                        <button
                                            onClick={() => handleSort('startYear')}
                                            className="flex items-center space-x-1 hover:text-gray-900"
                                        >
                                            <span>Thời gian</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="col-span-2">Trạng thái</div>
                                    <div className="col-span-2">Thống kê</div>
                                    <div className="col-span-2">Ngày tạo</div>
                                    <div className="col-span-1">Thao tác</div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-gray-200">
                                {academicYears.map((year) => (
                                    <div key={year._id} className="px-6 py-4 hover:bg-gray-50">
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                            {/* Name */}
                                            <div className="col-span-3">
                                                <div className="flex items-center space-x-3">
                                                    {year.isCurrent && (
                                                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Năm học hiện tại"></div>
                                                    )}
                                                    <div>
                                                        <h3 className="text-sm font-medium text-gray-900">{year.name}</h3>
                                                        <p className="text-sm text-gray-500">{year.code}</p>
                                                        {year.description && (
                                                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{year.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Duration */}
                                            <div className="col-span-2">
                                                <div className="text-sm text-gray-900">
                                                    {year.startYear} - {year.endYear}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(year.startDate)} - {formatDate(year.endDate)}
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="col-span-2">
                                                <StatusBadge status={year.status} />
                                                {year.isCurrent && (
                                                    <div className="text-xs text-green-600 mt-1 font-medium">Hiện tại</div>
                                                )}
                                            </div>

                                            {/* Statistics */}
                                            <div className="col-span-2">
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex items-center space-x-1">
                                                        <BookOpen className="w-3 h-3 text-gray-400" />
                                                        <span>{year.metadata?.totalPrograms || 0}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Target className="w-3 h-3 text-gray-400" />
                                                        <span>{year.metadata?.totalStandards || 0}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Folder className="w-3 h-3 text-gray-400" />
                                                        <span>{year.metadata?.totalEvidences || 0}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Users className="w-3 h-3 text-gray-400" />
                                                        <span>{year.metadata?.totalCriteria || 0}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Created Date */}
                                            <div className="col-span-2">
                                                <div className="text-sm text-gray-900">{formatDate(year.createdAt)}</div>
                                                <div className="text-xs text-gray-500">
                                                    bởi {year.createdBy?.fullName || 'N/A'}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-1">
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowActionsDropdown(showActionsDropdown === year._id ? null : year._id)}
                                                        className="p-1 rounded-full hover:bg-gray-100"
                                                    >
                                                        <MoreVertical className="w-4 h-4 text-gray-400" />
                                                    </button>

                                                    {showActionsDropdown === year._id && (
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                                            <div className="py-1">
                                                                <Link href={`/academic-years/${year._id}`}>
                                                                    <a className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                                        <Eye className="w-4 h-4 mr-3" />
                                                                        Xem chi tiết
                                                                    </a>
                                                                </Link>
                                                                <Link href={`/academic-years/${year._id}/edit`}>
                                                                    <a className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                                        <Edit3 className="w-4 h-4 mr-3" />
                                                                        Chỉnh sửa
                                                                    </a>
                                                                </Link>
                                                                {!year.isCurrent && (
                                                                    <button
                                                                        onClick={() => handleSetCurrent(year._id)}
                                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-3" />
                                                                        Đặt làm hiện tại
                                                                    </button>
                                                                )}
                                                                <Link href={`/academic-years/copy?source=${year._id}`}>
                                                                    <a className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                                        <Copy className="w-4 h-4 mr-3" />
                                                                        Sao chép dữ liệu
                                                                    </a>
                                                                </Link>
                                                                <div className="border-t border-gray-100"></div>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedYear(year)
                                                                        setShowDeleteModal(true)
                                                                        setShowActionsDropdown(null)
                                                                    }}
                                                                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-3" />
                                                                    Xóa năm học
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Hiển thị {((pagination.current - 1) * 10) + 1} - {Math.min(pagination.current * 10, pagination.total)} trong {pagination.total} kết quả
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="px-3 py-2 text-sm font-medium text-gray-900">
                                                Trang {pagination.current} / {pagination.pages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={!pagination.hasNext}
                                                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Delete Modal */}
                {showDeleteModal && selectedYear && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận xóa năm học</h3>
                            <p className="text-gray-600 mb-6">
                                Bạn có chắc chắn muốn xóa năm học <strong>{selectedYear.name}</strong>?
                                Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedYear(null)
                                    }}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Xóa năm học
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default AcademicYearsPage