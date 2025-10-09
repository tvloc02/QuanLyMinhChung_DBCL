import { useState, useEffect } from 'react'
import { Shield, Search, Plus, Edit, Trash2, X, RefreshCw, Eye } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function PermissionsManagement() {
    const [permissions, setPermissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedPermission, setSelectedPermission] = useState(null)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [filterModule, setFilterModule] = useState('all')
    const [filterLevel, setFilterLevel] = useState('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const itemsPerPage = 10

    const modules = [
        { value: 'all', label: 'Tất cả module' },
        { value: 'reports', label: 'Báo cáo' },
        { value: 'evaluations', label: 'Đánh giá' },
        { value: 'users', label: 'Người dùng' },
        { value: 'standards', label: 'Tiêu chuẩn' },
        { value: 'criteria', label: 'Tiêu chí' },
        { value: 'programs', label: 'Chương trình' },
        { value: 'system', label: 'Hệ thống' }
    ]

    const levels = [
        { value: 'all', label: 'Tất cả cấp độ' },
        { value: 'basic', label: 'Cơ bản' },
        { value: 'intermediate', label: 'Trung bình' },
        { value: 'advanced', label: 'Nâng cao' },
        { value: 'critical', label: 'Quan trọng' }
    ]

    useEffect(() => {
        fetchPermissions()
    }, [currentPage, filterModule, filterLevel, searchTerm])

    const fetchPermissions = async () => {
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                ...(filterModule !== 'all' && { module: filterModule }),
                ...(filterLevel !== 'all' && { level: filterLevel }),
                ...(searchTerm && { search: searchTerm })
            }

            const response = await api.get('/api/permissions', { params })
            if (response.data.success) {
                setPermissions(response.data.data.permissions)
                setTotalPages(response.data.data.pagination.pages)
            }
        } catch (error) {
            console.error('Error fetching permissions:', error)
            toast.error('Lỗi khi tải danh sách quyền')
        } finally {
            setLoading(false)
        }
    }

    const handleCreatePermission = async (formData) => {
        try {
            const response = await api.post('/permissions', formData)
            if (response.data.success) {
                toast.success('Tạo quyền thành công')
                setShowCreateModal(false)
                fetchPermissions()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi tạo quyền')
        }
    }

    const handleUpdatePermission = async (id, formData) => {
        try {
            const response = await api.put(`/permissions/${id}`, formData)
            if (response.data.success) {
                toast.success('Cập nhật quyền thành công')
                setShowEditModal(false)
                setSelectedPermission(null)
                fetchPermissions()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền')
        }
    }

    const handleDeletePermission = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa quyền này?')) return

        try {
            const response = await api.delete(`/permissions/${id}`)
            if (response.data.success) {
                toast.success('Xóa quyền thành công')
                fetchPermissions()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa quyền')
        }
    }

    const handleSeedPermissions = async () => {
        if (!confirm('Khởi tạo quyền mặc định? Hành động này sẽ tạo tất cả các quyền cơ bản.')) return

        try {
            const response = await api.post('/permissions/seed')
            if (response.data.success) {
                toast.success(response.data.message)
                fetchPermissions()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi khởi tạo quyền')
        }
    }

    const getLevelColor = (level) => {
        const colors = {
            basic: 'green',
            intermediate: 'yellow',
            advanced: 'orange',
            critical: 'red'
        }
        return colors[level] || 'gray'
    }

    const getLevelText = (level) => {
        const texts = {
            basic: 'Cơ bản',
            intermediate: 'Trung bình',
            advanced: 'Nâng cao',
            critical: 'Quan trọng'
        }
        return texts[level] || level
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Quản lý quyền hệ thống</h1>
                <p className="text-blue-100">Quản lý và cấu hình các quyền trong hệ thống</p>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Tạo quyền mới
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm quyền..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <select
                        value={filterModule}
                        onChange={(e) => setFilterModule(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {modules.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>

                    <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {levels.map(l => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleSeedPermissions}
                    className="mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Khởi tạo quyền mặc định
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                STT
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Mã quyền
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tên quyền
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Module
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cấp độ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : permissions.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    Không tìm thấy quyền nào
                                </td>
                            </tr>
                        ) : (
                            permissions.map((permission, index) => (
                                <tr key={permission._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <code className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded font-mono">
                                            {permission.code}
                                        </code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                                        {permission.description && (
                                            <div className="text-xs text-gray-500 mt-1">{permission.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {permission.module}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded bg-${getLevelColor(permission.level)}-100 text-${getLevelColor(permission.level)}-800`}>
                        {getLevelText(permission.level)}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          permission.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}>
                        {permission.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedPermission(permission)
                                                    setShowDetailModal(true)
                                                }}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedPermission(permission)
                                                    setShowEditModal(true)
                                                }}
                                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                title="Sửa"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePermission(permission._id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="Xóa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Đầu
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Trước
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Sau
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cuối
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && <CreatePermissionModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreatePermission} />}
            {showEditModal && selectedPermission && (
                <EditPermissionModal
                    permission={selectedPermission}
                    onClose={() => { setShowEditModal(false); setSelectedPermission(null); }}
                    onSubmit={handleUpdatePermission}
                />
            )}
            {showDetailModal && selectedPermission && (
                <DetailPermissionModal
                    permission={selectedPermission}
                    onClose={() => { setShowDetailModal(false); setSelectedPermission(null); }}
                />
            )}
        </div>
    )
}

// Modal Components
function CreatePermissionModal({ onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        module: 'reports',
        action: 'create',
        name: '',
        description: '',
        level: 'basic'
    })

    const actions = ['create', 'read', 'update', 'delete', 'approve', 'manage']
    const modules = ['reports', 'evaluations', 'users', 'standards', 'criteria', 'programs', 'system']
    const levels = ['basic', 'intermediate', 'advanced', 'critical']

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Tạo quyền mới</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Module <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.module}
                                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                {modules.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hành động <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.action}
                                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                {actions.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên quyền <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
                        <select
                            value={formData.level}
                            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {levels.map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                            Hủy
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Tạo quyền
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function EditPermissionModal({ permission, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: permission.name,
        description: permission.description || '',
        level: permission.level,
        status: permission.status
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(permission._id, formData)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Cập nhật quyền</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên quyền</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="basic">Cơ bản</option>
                                <option value="intermediate">Trung bình</option>
                                <option value="advanced">Nâng cao</option>
                                <option value="critical">Quan trọng</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                            Hủy
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Cập nhật
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function DetailPermissionModal({ permission, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Chi tiết quyền</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Mã quyền</label>
                            <p className="text-gray-900 font-mono">{permission.code}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Tên quyền</label>
                            <p className="text-gray-900">{permission.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Module</label>
                            <p className="text-gray-900">{permission.module}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Hành động</label>
                            <p className="text-gray-900">{permission.action}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Cấp độ</label>
                            <p className="text-gray-900">{permission.level}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                            <p className="text-gray-900">{permission.status}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Mô tả</label>
                        <p className="text-gray-900">{permission.description || 'Không có mô tả'}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}