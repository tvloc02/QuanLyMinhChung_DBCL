import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { ActionButton } from '../../components/ActionButtons'
import toast from 'react-hot-toast'
import {
    Plus, Search, Edit3, Trash2, Calendar, CheckCircle, Eye, RefreshCw, X, Loader2
} from 'lucide-react'

const AcademicYearsPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [academicYears, setAcademicYears] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({})
    const [selectedYear, setSelectedYear] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedItems, setSelectedItems] = useState([])

    const breadcrumbItems = [
        { name: 'Quản lý năm học', icon: Calendar }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        fetchAcademicYears()
    }, [currentPage, searchTerm, sortBy, sortOrder])

    const fetchAcademicYears = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                sortBy,
                sortOrder,
                ...(searchTerm && { search: searchTerm })
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
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value)
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
                toast.success('Đã đặt làm năm học hiện tại thành công')
            } else {
                const error = await response.json()
                toast.error(error.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Có lỗi xảy ra khi đặt năm học hiện tại')
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
                toast.success('Xóa năm học thành công')
            } else {
                const error = await response.json()
                toast.error(error.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            toast.error('Có lỗi xảy ra khi xóa năm học')
        }
    }

    const handleBulkDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.length} năm học đã chọn?`)) return

        try {
            await Promise.all(selectedItems.map(id =>
                fetch(`/api/academic-years/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
            ))
            toast.success(`Đã xóa ${selectedItems.length} năm học`)
            setSelectedItems([])
            fetchAcademicYears()
        } catch (error) {
            toast.error('Có lỗi xảy ra khi xóa năm học')
        }
    }

    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedItems.length === academicYears.length) {
            setSelectedItems([])
        } else {
            setSelectedItems(academicYears.map(y => y._id))
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN')
    }

    if (isLoading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
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
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Quản lý năm học</h1>
                                <p className="text-blue-100">Quản lý và cấu hình các năm học trong hệ thống</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/academic-years/create')}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-xl transition-all font-semibold"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Tạo năm học mới</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm năm học..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <select
                                    value={`${sortBy}-${sortOrder}`}
                                    onChange={(e) => {
                                        const [field, order] = e.target.value.split('-')
                                        setSortBy(field)
                                        setSortOrder(order)
                                    }}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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

                {/* Bulk Actions */}
                {selectedItems.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200 rounded-xl p-4 shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-900 font-semibold">
                                Đã chọn <strong className="text-lg text-blue-600">{selectedItems.length}</strong> năm học
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleBulkDelete}
                                    className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 font-semibold transition-all shadow-md hover:shadow-lg"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Xóa
                                </button>
                                <button
                                    onClick={() => setSelectedItems([])}
                                    className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 text-sm rounded-xl hover:bg-gray-50 border-2 border-gray-300 font-semibold transition-all shadow-md"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Hủy chọn
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Years List */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : academicYears.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có năm học nào</h3>
                            <p className="text-gray-500 mb-6">Bắt đầu bằng cách tạo năm học đầu tiên</p>
                            <button
                                onClick={() => router.push('/academic-years/create')}
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Tạo năm học mới</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className="bg-gradient-to-r from-blue-50 to-sky-50">
                                    <tr>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase border-r border-b-2 border-blue-200 w-20">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.length === academicYears.length}
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                            />
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase border-r border-b-2 border-blue-200 w-20">STT</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase border-r border-b-2 border-blue-200">Năm học</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase border-r border-b-2 border-blue-200 w-40">Năm</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase border-r border-b-2 border-blue-200 w-48">Ngày bắt đầu</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase border-r border-b-2 border-blue-200 w-48">Ngày kết thúc</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase border-b-2 border-blue-200 w-80">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                    {academicYears.map((year, index) => (
                                        <tr
                                            key={year._id}
                                            className={`transition-all border-b border-gray-200 ${
                                                year.isCurrent
                                                    ? 'bg-gradient-to-r from-blue-50 to-sky-50'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-4 py-4 text-center border-r border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(year._id)}
                                                    onChange={() => toggleSelectItem(year._id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-center border-r border-gray-200">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {((currentPage - 1) * 10) + index + 1}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 border-r border-gray-200">
                                                <div className="flex items-center space-x-3">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900 mb-1">{year.name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                                                                {year.code}
                                                            </span>
                                                            {year.isCurrent && (
                                                                <span className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-lg shadow-md">
                                                                    Hiện tại
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center border-r border-gray-200">
                                                <div className="text-sm font-bold text-gray-900">
                                                    {year.startYear} - {year.endYear}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center border-r border-gray-200">
                                                <div className="text-sm text-gray-700 font-medium">
                                                    {formatDate(year.startDate)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center border-r border-gray-200">
                                                <div className="text-sm text-gray-700 font-medium">
                                                    {formatDate(year.endDate)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-4">
                                                    <ActionButton
                                                        icon={Eye}
                                                        variant="view"
                                                        size="sm"
                                                        onClick={() => router.push(`/academic-years/${year._id}`)}
                                                    />

                                                    <ActionButton
                                                        icon={Edit3}
                                                        variant="edit"
                                                        size="sm"
                                                        onClick={() => router.push(`/academic-years/edit/${year._id}`)}
                                                    />

                                                    <ActionButton
                                                        icon={Trash2}
                                                        variant="delete"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedYear(year)
                                                            setShowDeleteModal(true)
                                                        }}
                                                    />

                                                    <ActionButton
                                                        icon={CheckCircle}
                                                        variant="success"
                                                        size="sm"
                                                        disabled={year.isCurrent}
                                                        onClick={() => !year.isCurrent && handleSetCurrent(year._id)}
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
                                <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-t-2 border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Hiển thị <span className="font-semibold text-blue-600">{((pagination.current - 1) * 10) + 1}</span> đến{' '}
                                            <span className="font-semibold text-blue-600">{Math.min(pagination.current * 10, pagination.total)}</span>{' '}
                                            trong tổng số <span className="font-semibold text-blue-600">{pagination.total}</span> kết quả
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                disabled={!hasPrevPage}
                                                className="px-4 py-2 text-sm border-2 border-blue-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
                                            >
                                                Trước
                                            </button>
                                            {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                                                let pageNum;
                                                if (totalPages <= 7) {
                                                    pageNum = i + 1;
                                                } else if (pagination.current <= 4) {
                                                    pageNum = i + 1;
                                                } else if (pagination.current >= totalPages - 3) {
                                                    pageNum = totalPages - 6 + i;
                                                } else {
                                                    pageNum = pagination.current - 3 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-4 py-2 text-sm rounded-xl transition-all font-semibold ${
                                                            pagination.current === pageNum
                                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                                                : 'border-2 border-blue-200 hover:bg-white text-gray-700'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                disabled={!hasNextPage}
                                                className="px-4 py-2 text-sm border-2 border-blue-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
                                            >
                                                Sau
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
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                            <div className="flex items-start space-x-4 mb-6">
                                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Trash2 className="w-7 h-7 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa năm học</h3>
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
                                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-semibold"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
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