import { useState, useEffect } from 'react'
import {
    Shield, Search, Plus, Edit, Trash2, X, AlertCircle, RefreshCw
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function PermissionsManagement() {
    const [permissions, setPermissions] = useState({})
    const [loading, setLoading] = useState(true)
    const [selectedModule, setSelectedModule] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedPermission, setSelectedPermission] = useState(null)
    const [message, setMessage] = useState({ type: '', text: '' })

    const modules = [
        { value: 'all', label: 'Tất cả module' },
        { value: 'reports', label: 'Báo cáo' },
        { value: 'evaluations', label: 'Đánh giá' },
        { value: 'users', label: 'Người dùng' },
        { value: 'standards', label: 'Tiêu chuẩn' },
        { value: 'criteria', label: 'Tiêu chí' },
        { value: 'programs', label: 'Chương trình' },
        { value: 'organizations', label: 'Tổ chức' },
        { value: 'academic_years', label: 'Năm học' },
        { value: 'system', label: 'Hệ thống' },
        { value: 'settings', label: 'Cài đặt' }
    ]

    const actions = [
        { value: 'create', label: 'Tạo mới' },
        { value: 'read', label: 'Xem' },
        { value: 'update', label: 'Cập nhật' },
        { value: 'delete', label: 'Xóa' },
        { value: 'approve', label: 'Phê duyệt' },
        { value: 'reject', label: 'Từ chối' },
        { value: 'assign', label: 'Phân công' },
        { value: 'export', label: 'Xuất' },
        { value: 'import', label: 'Nhập' },
        { value: 'manage', label: 'Quản lý' }
    ]

    const levels = [
        { value: 'basic', label: 'Cơ bản' },
        { value: 'intermediate', label: 'Trung bình' },
        { value: 'advanced', label: 'Nâng cao' },
        { value: 'critical', label: 'Quan trọng' }
    ]

    useEffect(() => {
        fetchPermissions()
    }, [])

    const fetchPermissions = async () => {
        try {
            setLoading(true)
            const response = await api.get('/permissions/by-module')
            if (response.data.success) {
                setPermissions(response.data.data)
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

    const getModuleColor = (module) => {
        const colors = {
            reports: 'blue', evaluations: 'green', users: 'purple',
            standards: 'yellow', criteria: 'orange', programs: 'pink',
            organizations: 'indigo', system: 'red', academic_years: 'teal'
        }
        return colors[module] || 'gray'
    }

    const getActionColor = (action) => {
        const colors = {
            create: 'green', read: 'blue', update: 'yellow',
            delete: 'red', approve: 'purple', manage: 'red'
        }
        return colors[action] || 'gray'
    }

    const getLevelColor = (level) => {
        const colors = {
            basic: 'green', intermediate: 'yellow',
            advanced: 'orange', critical: 'red'
        }
        return colors[level] || 'gray'
    }

    const filteredPermissions = () => {
        let filtered = {}

        Object.entries(permissions).forEach(([module, perms]) => {
            if (selectedModule === 'all' || selectedModule === module) {
                const matchedPerms = perms.filter(perm =>
                    perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    perm.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    perm.description?.toLowerCase().includes(searchTerm.toLowerCase())
                )

                if (matchedPerms.length > 0) {
                    filtered[module] = matchedPerms
                }
            }
        })

        return filtered
    }

    const PermissionCard = ({ permission }) => {
        const moduleColor = getModuleColor(permission.module)
        const actionColor = getActionColor(permission.action)
        const levelColor = getLevelColor(permission.level)

        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{permission.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500 font-mono">{permission.code}</p>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => {
                                setSelectedPermission(permission)
                                setShowEditModal(true)
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDeletePermission(permission._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {permission.description && (
                    <p className="text-sm text-gray-600 mb-3">{permission.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded bg-${moduleColor}-100 text-${moduleColor}-800`}>
            {permission.module}
          </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded bg-${actionColor}-100 text-${actionColor}-800`}>
            {permission.action}
          </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded bg-${levelColor}-100 text-${levelColor}-800`}>
            {permission.level}
          </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${permission.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {permission.status}
          </span>
                </div>
            </div>
        )
    }

    const PermissionModal = ({ isEdit = false, onClose, onSubmit, initialData = null }) => {
        const [formData, setFormData] = useState(initialData || {
            module: 'reports',
            action: 'create',
            name: '',
            description: '',
            level: 'basic',
            status: 'active'
        })

        const handleSubmit = (e) => {
            e.preventDefault()
            if (isEdit) {
                onSubmit(initialData._id, formData)
            } else {
                onSubmit(formData)
            }
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {isEdit ? 'Cập nhật quyền' : 'Tạo quyền mới'}
                            </h2>
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
                                    disabled={isEdit}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    {modules.filter(m => m.value !== 'all').map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
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
                                    disabled={isEdit}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    {actions.map(a => (
                                        <option key={a.value} value={a.value}>{a.label}</option>
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
                                placeholder="VD: Tạo báo cáo TĐG"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mô tả
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                placeholder="Mô tả chi tiết về quyền này..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cấp độ
                                </label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    {levels.map(l => (
                                        <option key={l.value} value={l.value}>{l.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Trạng thái
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="active">Hoạt động</option>
                                    <option value="inactive">Không hoạt động</option>
                                </select>
                            </div>
                        </div>

                        {!isEdit && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Mã quyền sẽ được tạo tự động:</strong> {formData.module.toUpperCase()}.{formData.action.toUpperCase()}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {isEdit ? 'Cập nhật' : 'Tạo quyền'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm quyền..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        {modules.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleSeedPermissions}
                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Khởi tạo mặc định
                    </button>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Tạo quyền mới
                    </button>
                </div>
            </div>

            {/* Permissions Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : Object.keys(filteredPermissions()).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-500">Không tìm thấy quyền nào</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(filteredPermissions()).map(([module, perms]) => (
                        <div key={module}>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize flex items-center gap-2">
                                <Shield className={`w-6 h-6 text-${getModuleColor(module)}-600`} />
                                {modules.find(m => m.value === module)?.label || module}
                                <span className="text-sm font-normal text-gray-500">
                  ({perms.length} quyền)
                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {perms.map((perm) => (
                                    <PermissionCard key={perm._id} permission={perm} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <PermissionModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreatePermission}
                />
            )}

            {showEditModal && selectedPermission && (
                <PermissionModal
                    isEdit
                    initialData={selectedPermission}
                    onClose={() => {
                        setShowEditModal(false)
                        setSelectedPermission(null)
                    }}
                    onSubmit={handleUpdatePermission}
                />
            )}
        </div>
    )
}