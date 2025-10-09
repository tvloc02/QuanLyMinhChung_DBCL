import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Copy,
    Calendar,
    CheckCircle,
    Clock,
    Archive,
    FileText,
    Eye,
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
    const [hoveredAction, setHoveredAction] = useState(null)

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

    const ActionButton = ({ icon: Icon, tooltip, onClick, color = 'blue' }) => {
        const colorStyles = {
            blue: {
                bg: 'bg-blue-50',
                hover: 'hover:bg-blue-100',
                text: 'text-blue-600',
                border: 'border-blue-200'
            },
            green: {
                bg: 'bg-green-50',
                hover: 'hover:bg-green-100',
                text: 'text-green-600',
                border: 'border-green-200'
            },
            red: {
                bg: 'bg-red-50',
                hover: 'hover:bg-red-100',
                text: 'text-red-600',
                border: 'border-red-200'
            },
            yellow: {
                bg: 'bg-yellow-50',
                hover: 'hover:bg-yellow-100',
                text: 'text-yellow-600',
                border: 'border-yellow-200'
            },
            purple: {
                bg: 'bg-purple-50',
                hover: 'hover:bg-purple-100',
                text: 'text-purple-600',
                border: 'border-purple-200'
            }
        }

        const style = colorStyles[color] || colorStyles.blue

        return (
            <div className="relative group">
                <button
                    onClick={onClick}
                    onMouseEnter={() => setHoveredAction(tooltip)}
                    onMouseLeave={() => setHoveredAction(null)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border ${style.bg} ${style.hover} ${style.text} ${style.border}`}
                >
                    <Icon className="w-4 h-4" />
                </button>
                {hoveredAction === tooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
                        {tooltip}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                )}
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (loading && academicYears.length === 0) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="bg-white rounded-xl shadow-sm">
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

    const hasNextPage = pagination.hasNext || false
    const hasPrevPage = pagination.hasPrev || false
    const totalPages = pagination.pages || 1

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Quản lý năm học</h1>
                            <p className="text-indigo-100">Quản lý và cấu hình các năm học trong hệ thống</p>
                        </div>
                        <button
                            onClick={() => router.push('/academic-years/create')}
                            className="flex items-center space-x-2 bg-white text-indigo-600 px-6 py-3 rounded-xl hover:shadow-xl transition-all font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Tạo năm học mới</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm năm học..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => handleStatusFilter(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="draft">Nháp</option>
                                    <option value="active">Đang hoạt động</option>
                                    <option value="completed">Đã hoàn thành</option>
                                    <option value="archived">Đã lưu trữ</option>
                                </select>
                            </div>

                            <div>
                                <select
                                    value={`${sortBy}-${sortOrder}`}
                                    onChange={(e) => {
                                        const [field, order] = e.target.value.split('-')
                                        setSortBy(field)
                                        setSortOrder(order)
                                    }}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {academicYears.length === 0 ? (
                        <div className="p-12 text-center">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có năm học nào</h3>
                            <p className="text-gray-500 mb-6">Bắt đầu bằng cách tạo năm học đầu tiên</p>
                            <button
                                onClick={() => router.push('/academic-years/create')}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                            >
                                Tạo năm học mới
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <div className="grid grid-cols-12 gap-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[900px]">
                                    <div className="col-span-1 text-center">STT</div>
                                    <div className="col-span-4">
                                        <button
                                            onClick={() => handleSort('name')}
                                            className="flex items-center space-x-1 hover:text-indigo-600 transition-colors"
                                        >
                                            <span>Năm học</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="col-span-2">
                                        <button
                                            onClick={() => handleSort('startYear')}
                                            className="flex items-center space-x-1 hover:text-indigo-600 transition-colors"
                                        >
                                            <span>Thời gian</span>
                                            <ArrowUpDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="col-span-2">Trạng thái</div>
                                    <div className="col-span-3 text-center">Thao tác</div>
                                </div>
                            </div>

                            <div>
                                {academicYears.map((year, index) => (
                                    <div key={year._id} className="px-6 py-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
                                        <div className="grid grid-cols-12 gap-4 items-center min-w-[900px]">
                                            <div className="col-span-1 text-center">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {((currentPage - 1) * 10) + index + 1}
                                                </span>
                                            </div>

                                            <div className="col-span-4">
                                                <div className="flex items-center space-x-3">
                                                    {year.isCurrent && (
                                                        <div className="relative flex-shrink-0">
                                                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                                                            <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{year.name}</h3>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-md">
                                                                {year.code}
                                                            </span>
                                                            {year.isCurrent && (
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-md">
                                                                    Hiện tại
                                                                </span>
                                                            )}
                                                        </div>
                                                        {year.description && (
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{year.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <div className="text-sm font-medium text-gray-900 mb-1">
                                                    {year.startYear} - {year.endYear}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(year.startDate)} - {formatDate(year.endDate)}
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <StatusBadge status={year.status} />
                                            </div>

                                            <div className="col-span-3">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <ActionButton
                                                        icon={Eye}
                                                        tooltip="Xem chi tiết"
                                                        onClick={() => router.push(`/academic-years/${year._id}`)}
                                                        color="blue"
                                                    />

                                                    <ActionButton
                                                        icon={Edit3}
                                                        tooltip="Chỉnh sửa"
                                                        onClick={() => router.push(`/academic-years/edit/${year._id}`)}
                                                        color="green"
                                                    />

                                                    {!year.isCurrent && (
                                                        <ActionButton
                                                            icon={CheckCircle}
                                                            tooltip="Đặt làm hiện tại"
                                                            onClick={() => handleSetCurrent(year._id)}
                                                            color="purple"
                                                        />
                                                    )}

                                                    <ActionButton
                                                        icon={Copy}
                                                        tooltip="Sao chép dữ liệu"
                                                        onClick={() => router.push(`/academic-years/copy?source=${year._id}`)}
                                                        color="yellow"
                                                    />

                                                    <ActionButton
                                                        icon={Trash2}
                                                        tooltip="Xóa năm học"
                                                        onClick={() => {
                                                            setSelectedYear(year)
                                                            setShowDeleteModal(true)
                                                        }}
                                                        color="red"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            Hiển thị {((pagination.current - 1) * 10) + 1} - {Math.min(pagination.current * 10, pagination.total)} trong {pagination.total} kết quả
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={!hasPrevPage}
                                                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg">
                                                {pagination.current} / {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={!hasNextPage}
                                                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {showDeleteModal && selectedYear && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa năm học</h3>
                            <p className="text-gray-600 mb-6">
                                Bạn có chắc chắn muốn xóa năm học <strong className="text-gray-900">{selectedYear.name}</strong>?
                                Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedYear(null)
                                    }}
                                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
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