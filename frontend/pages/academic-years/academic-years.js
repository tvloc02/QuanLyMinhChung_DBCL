import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Plus, Search, Edit3, Trash2, Copy, Calendar, CheckCircle, Clock, Archive,
    FileText, Eye, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, X
} from 'lucide-react'

const AcademicYearsPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [academicYears, setAcademicYears] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({})
    const [selectedYear, setSelectedYear] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const breadcrumbItems = [
        { name: 'Quản lý năm học', icon: Calendar }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    const statusConfig = {
        draft: { label: 'Nháp', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: FileText },
        active: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
        completed: { label: 'Đã hoàn thành', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
        archived: { label: 'Đã lưu trữ', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Archive }
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
            setMessage({ type: 'error', text: err.message })
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
                setMessage({ type: 'success', text: 'Đã đặt làm năm học hiện tại thành công' })
            } else {
                const error = await response.json()
                setMessage({ type: 'error', text: error.message || 'Có lỗi xảy ra' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra khi đặt năm học hiện tại' })
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
                setMessage({ type: 'success', text: 'Xóa năm học thành công' })
            } else {
                const error = await response.json()
                setMessage({ type: 'error', text: error.message || 'Có lỗi xảy ra' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Có lỗi xảy ra khi xóa năm học' })
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN')
    }

    const StatusBadge = ({ status }) => {
        const config = statusConfig[status] || statusConfig.draft
        const Icon = config.icon
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
                <Icon className="w-3 h-3 mr-1.5" />
                {config.label}
            </span>
        )
    }

    const ActionButton = ({ icon: Icon, tooltip, onClick, color = 'blue' }) => {
        const colorStyles = {
            blue: 'text-blue-600 hover:bg-blue-100',
            green: 'text-green-600 hover:bg-green-100',
            red: 'text-red-600 hover:bg-red-100',
            yellow: 'text-yellow-600 hover:bg-yellow-100',
            purple: 'text-purple-600 hover:bg-purple-100'
        }

        const colorClass = colorStyles[color] || colorStyles.blue

        return (
            <button
                onClick={onClick}
                className={`p-2 ${colorClass} rounded-lg transition-all`}
                title={tooltip}
            >
                <Icon className="w-[18px] h-[18px]" />
            </button>
        )
    }

    if (isLoading) {
        return (
            <Layout title="Đang tải..." breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user) {
        return null
    }

    const hasNextPage = pagination.hasNext || false
    const hasPrevPage = pagination.hasPrev || false
    const totalPages = pagination.pages || 1

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Message Alert */}
                {message.text && (
                    <div className={`rounded-2xl border p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
                        message.type === 'success'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                    }`}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    message.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                    <AlertCircle className={`w-7 h-7 ${
                                        message.type === 'success' ? 'text-green-600' : 'text-red-600'
                                    }`} />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className={`font-bold text-lg mb-1 ${
                                    message.type === 'success' ? 'text-green-900' : 'text-red-900'
                                }`}>
                                    {message.type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra'}
                                </h3>
                                <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                                    {message.text}
                                </p>
                            </div>
                            <button
                                onClick={() => setMessage({ type: '', text: '' })}
                                className="ml-4 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Quản lý năm học</h1>
                                <p className="text-indigo-100">Quản lý và cấu hình các năm học trong hệ thống</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/academic-years/create')}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:shadow-xl transition-all font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Tạo năm học mới</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm năm học..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => handleStatusFilter(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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

                {/* Years List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : academicYears.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có năm học nào</h3>
                            <p className="text-gray-500 mb-6">Bắt đầu bằng cách tạo năm học đầu tiên</p>
                            <button
                                onClick={() => router.push('/academic-years/create')}
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Tạo năm học mới</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">STT</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Năm học</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Thời gian</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Trạng thái</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                    {academicYears.map((year, index) => (
                                        <tr key={year._id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {((currentPage - 1) * 10) + index + 1}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    {year.isCurrent && (
                                                        <div className="relative flex-shrink-0">
                                                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                                                            <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900 mb-1">{year.name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md">
                                                                {year.code}
                                                            </span>
                                                            {year.isCurrent && (
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-md">
                                                                    Hiện tại
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 mb-1">
                                                    {year.startYear} - {year.endYear}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatDate(year.startDate)} - {formatDate(year.endDate)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={year.status} />
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
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
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t-2 border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Hiển thị <span className="font-semibold text-indigo-600">{((pagination.current - 1) * 10) + 1}</span> đến{' '}
                                            <span className="font-semibold text-indigo-600">{Math.min(pagination.current * 10, pagination.total)}</span>{' '}
                                            trong tổng số <span className="font-semibold text-indigo-600">{pagination.total}</span> kết quả
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={!hasPrevPage}
                                                className="p-2 border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <span className="text-sm font-semibold text-gray-700 px-4 py-2 bg-white rounded-lg border-2 border-gray-200">
                                                Trang {pagination.current} / {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={!hasNextPage}
                                                className="p-2 border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRight className="w-5 h-5" />
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="flex items-start space-x-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <Trash2 className="w-7 h-7 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa năm học</h3>
                                    <p className="text-gray-600">
                                        Bạn có chắc chắn muốn xóa năm học <strong className="text-gray-900">{selectedYear.name}</strong>?
                                        Hành động này không thể hoàn tác.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedYear(null)
                                    }}
                                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
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