import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    Search, Plus, Edit, Trash2, AlertCircle, RefreshCw, Building,
    ChevronLeft, ChevronRight, UserPlus, Trash, X, Users
} from 'lucide-react'
import api from '../../services/api'

export default function DepartmentsPage() {
    const router = useRouter()
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
    })

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState(null)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [actionLoading, setActionLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: ''
    })

    useEffect(() => {
        fetchDepartments()
    }, [pagination.current, searchTerm, statusFilter])

    const fetchDepartments = async () => {
        try {
            setLoading(true)
            const params = {
                page: pagination.current,
                limit: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            }

            if (searchTerm) params.search = searchTerm
            if (statusFilter) params.status = statusFilter

            const response = await api.get('/api/departments', { params })

            if (response.data.success) {
                setDepartments(response.data.data.departments)
                setPagination(response.data.data.pagination)
            }
        } catch (error) {
            console.error('Error fetching departments:', error)
            setMessage({
                type: 'error',
                text: 'Lỗi khi tải danh sách phòng ban'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()

        if (!formData.name.trim() || !formData.code.trim()) {
            setMessage({
                type: 'error',
                text: 'Vui lòng điền tên và mã phòng ban'
            })
            return
        }

        try {
            setActionLoading(true)
            await api.post('/api/departments', formData)

            setMessage({
                type: 'success',
                text: 'Tạo phòng ban thành công'
            })

            setShowCreateModal(false)
            setFormData({ name: '', code: '', description: '' })
            fetchDepartments()
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi tạo phòng ban'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleUpdate = async (e) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            setMessage({
                type: 'error',
                text: 'Vui lòng điền tên phòng ban'
            })
            return
        }

        try {
            setActionLoading(true)
            await api.put(`/api/departments/${selectedDepartment._id}`, formData)

            setMessage({
                type: 'success',
                text: 'Cập nhật phòng ban thành công'
            })

            setShowEditModal(false)
            setSelectedDepartment(null)
            setFormData({ name: '', code: '', description: '' })
            fetchDepartments()
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi cập nhật phòng ban'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedDepartment) return

        try {
            setActionLoading(true)
            await api.delete(`/api/departments/${selectedDepartment._id}`)

            setMessage({
                type: 'success',
                text: 'Xóa phòng ban thành công'
            })

            setShowDeleteModal(false)
            setSelectedDepartment(null)
            fetchDepartments()
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi xóa phòng ban'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const openCreateModal = () => {
        setFormData({ name: '', code: '', description: '' })
        setShowCreateModal(true)
    }

    const openEditModal = (dept) => {
        setSelectedDepartment(dept)
        setFormData({
            name: dept.name,
            code: dept.code,
            description: dept.description || ''
        })
        setShowEditModal(true)
    }

    return (
        <div className="space-y-6">
            {message.text && (
                <div className={`rounded-2xl border p-6 shadow-lg ${
                    message.type === 'success'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                        : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                }`}>
                    <div className="flex items-start">
                        <AlertCircle className={`w-6 h-6 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                        <p className={`ml-3 ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {message.text}
                        </p>
                        <button
                            onClick={() => setMessage({ type: '', text: '' })}
                            className="ml-auto text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Building className="w-8 h-8" />
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Quản lý phòng ban</h1>
                            <p className="text-indigo-100">Quản lý tất cả phòng ban trong hệ thống</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:shadow-xl transition-all font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Thêm phòng ban</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, mã..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setPagination(prev => ({ ...prev, current: 1 }))
                            }}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value)
                            setPagination(prev => ({ ...prev, current: 1 }))
                        }}
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : departments.length === 0 ? (
                    <div className="text-center py-12">
                        <Building className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Không tìm thấy phòng ban nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-blue-50 to-sky-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tên phòng ban</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Mã</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Quản lý</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Thành viên</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Thao tác</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {departments.map((dept) => (
                                <tr key={dept._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{dept.name}</div>
                                        {dept.description && (
                                            <p className="text-sm text-gray-500 mt-1">{dept.description.substring(0, 50)}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm font-bold text-indigo-600">{dept.code}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {dept.manager?.fullName || 'Không có'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium">{dept.members?.length || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                            dept.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {dept.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => openEditModal(dept)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedDepartment(dept)
                                                    setShowDeleteModal(true)
                                                }}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && departments.length > 0 && (
                    <div className="bg-gray-50 px-6 py-4 border-t">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                Trang {pagination.current} / {pagination.pages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                                    disabled={!pagination.hasPrev}
                                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                                    disabled={!pagination.hasNext}
                                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Tạo phòng ban mới</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Tên phòng ban</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Mã phòng ban</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Đang tạo...' : 'Tạo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedDepartment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Cập nhật phòng ban</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Tên phòng ban</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false)
                                        setSelectedDepartment(null)
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedDepartment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6 text-center">
                            Bạn có chắc chắn muốn xóa phòng ban <strong>{selectedDepartment.name}</strong>?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setSelectedDepartment(null)
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}