import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    RotateCcw, Search, Filter, Trash2, Calendar, User, FileText,
    ChevronLeft, ChevronRight, AlertCircle, RefreshCw, X, CheckCircle,
    Users, Database, Shield, Layers, Hash, File, FolderOpen
} from 'lucide-react'

const GeneralPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [deletedItems, setDeletedItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
    })

    const [showRestoreModal, setShowRestoreModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)

    const breadcrumbItems = [
        { name: 'Hệ thống', icon: Database },
        { name: 'Khôi phục dữ liệu', icon: RotateCcw }
    ]

    const typeIcons = {
        User: { icon: Users, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
        Evidence: { icon: FileText, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-100', textColor: 'text-green-700' },
        Report: { icon: FolderOpen, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
        Standard: { icon: Layers, color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
        Criteria: { icon: Hash, color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-100', textColor: 'text-indigo-700' },
        File: { icon: File, color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' }
    }

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user && user.role !== 'admin') {
            router.replace('/dashboard')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchDeletedItems()
        }
    }, [user, currentPage, searchTerm, typeFilter])

    const fetchDeletedItems = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                ...(searchTerm && { search: searchTerm }),
                ...(typeFilter && { type: typeFilter })
            })

            const response = await fetch(`/api/system/deleted-items?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu')
            }

            const result = await response.json()
            if (result.success) {
                setDeletedItems(result.data.items || [])
                setPagination(result.data.pagination)
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setLoading(false)
        }
    }

    const handleRestore = async () => {
        if (!selectedItem) return

        try {
            setActionLoading(true)
            const response = await fetch(`/api/system/deleted-items/${selectedItem.type}/${selectedItem._id}/restore`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Không thể khôi phục dữ liệu')
            }

            const result = await response.json()
            if (result.success) {
                setMessage({ type: 'success', text: 'Khôi phục dữ liệu thành công' })
                setShowRestoreModal(false)
                setSelectedItem(null)
                fetchDeletedItems()
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setActionLoading(false)
        }
    }

    const handlePermanentDelete = async () => {
        if (!selectedItem) return

        try {
            setActionLoading(true)
            const response = await fetch(`/api/system/deleted-items/${selectedItem.type}/${selectedItem._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Không thể xóa vĩnh viễn')
            }

            const result = await response.json()
            if (result.success) {
                setMessage({ type: 'success', text: 'Xóa vĩnh viễn thành công' })
                setShowDeleteModal(false)
                setSelectedItem(null)
                fetchDeletedItems()
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message })
        } finally {
            setActionLoading(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    if (isLoading || !user || user.role !== 'admin') {
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
                                <RotateCcw className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Khôi phục dữ liệu</h1>
                                <p className="text-indigo-100">Quản lý và khôi phục các dữ liệu đã bị xóa</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchDeletedItems}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:shadow-xl transition-all font-medium"
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span>Làm mới</span>
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Tổng dữ liệu đã xóa</p>
                                <p className="text-3xl font-bold text-indigo-600 mt-2">{pagination.total || 0}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                                <Database className="w-7 h-7 text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Có thể khôi phục</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{pagination.total || 0}</p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600">Loại dữ liệu</p>
                                <p className="text-3xl font-bold text-purple-600 mt-2">
                                    {new Set(deletedItems.map(item => item.type)).size || 0}
                                </p>
                            </div>
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                                <Layers className="w-7 h-7 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            >
                                <option value="">Tất cả loại dữ liệu</option>
                                <option value="User">Người dùng</option>
                                <option value="Evidence">Minh chứng</option>
                                <option value="Report">Báo cáo</option>
                                <option value="Standard">Tiêu chuẩn</option>
                                <option value="Criteria">Tiêu chí</option>
                                <option value="File">File</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Data List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : deletedItems.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Database className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">Không có dữ liệu nào đã bị xóa</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Loại</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tên</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Đã xóa bởi</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Thời gian xóa</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Thao tác</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                    {deletedItems.map((item) => {
                                        const typeConfig = typeIcons[item.type] || typeIcons.File
                                        const Icon = typeConfig.icon
                                        return (
                                            <tr key={item._id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`w-10 h-10 bg-gradient-to-br ${typeConfig.color} rounded-lg flex items-center justify-center`}>
                                                            <Icon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <span className={`ml-3 px-3 py-1 ${typeConfig.bgColor} ${typeConfig.textColor} rounded-full text-xs font-semibold`}>
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900">{item.name || 'N/A'}</div>
                                                    {item.description && (
                                                        <div className="text-sm text-gray-500 truncate max-w-md">{item.description}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <User className="w-4 h-4 text-gray-400 mr-2" />
                                                        <span className="text-sm text-gray-900">{item.deletedBy?.fullName || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                        <span className="text-sm text-gray-500">{formatDate(item.deletedAt)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item)
                                                                setShowRestoreModal(true)
                                                            }}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                            title="Khôi phục"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedItem(item)
                                                                setShowDeleteModal(true)
                                                            }}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Xóa vĩnh viễn"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.pages > 1 && (
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t-2 border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                            Hiển thị <span className="font-semibold text-indigo-600">{(pagination.current - 1) * 10 + 1}</span> đến{' '}
                                            <span className="font-semibold text-indigo-600">{Math.min(pagination.current * 10, pagination.total)}</span>{' '}
                                            trong tổng số <span className="font-semibold text-indigo-600">{pagination.total}</span> kết quả
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setCurrentPage(prev => prev - 1)}
                                                disabled={!pagination.hasPrev}
                                                className="p-2 border-2 border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <span className="text-sm font-semibold text-gray-700 px-4 py-2 bg-white rounded-lg border-2 border-gray-200">
                                                Trang {pagination.current} / {pagination.pages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                disabled={!pagination.hasNext}
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

                {/* Warning */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-7 h-7 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-yellow-900 mb-2">Lưu ý quan trọng</h3>
                            <ul className="space-y-2 text-sm text-yellow-800">
                                <li className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Dữ liệu đã xóa có thể được khôi phục hoàn toàn</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Xóa vĩnh viễn sẽ không thể hoàn tác và dữ liệu sẽ bị mất hoàn toàn</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                    <span>Nên tạo bản sao lưu trước khi thực hiện xóa vĩnh viễn</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Restore Modal */}
            {showRestoreModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start space-x-4 mb-6">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <RotateCcw className="w-7 h-7 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận khôi phục</h3>
                                <p className="text-gray-600">
                                    Bạn có chắc chắn muốn khôi phục <strong className="text-gray-900">{selectedItem?.name}</strong>?
                                    Dữ liệu sẽ được khôi phục về trạng thái trước khi xóa.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowRestoreModal(false)
                                    setSelectedItem(null)
                                }}
                                disabled={actionLoading}
                                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleRestore}
                                disabled={actionLoading}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                            >
                                {actionLoading ? 'Đang khôi phục...' : 'Khôi phục'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start space-x-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-7 h-7 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa vĩnh viễn</h3>
                                <p className="text-gray-600">
                                    Bạn có chắc chắn muốn xóa vĩnh viễn <strong className="text-gray-900">{selectedItem?.name}</strong>?
                                    <span className="text-red-600 font-semibold block mt-2">
                                        Hành động này không thể hoàn tác!
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setSelectedItem(null)
                                }}
                                disabled={actionLoading}
                                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handlePermanentDelete}
                                disabled={actionLoading}
                                className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                            >
                                {actionLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    )
}

export default GeneralPage