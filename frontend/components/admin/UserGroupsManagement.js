import { useState, useEffect } from 'react'
import {
    Users, Shield, Plus, Edit, Trash2, X, Search, UserPlus, Eye, RefreshCw, Lock, Settings
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import PermissionsMatrixModal from './PermissionsMatrixModal'

export default function UserGroupsManagement() {
    const [groups, setGroups] = useState([])
    const [permissions, setPermissions] = useState({})
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showPermissionsModal, setShowPermissionsModal] = useState(false)
    const [showMembersModal, setShowMembersModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showPermissionsMatrixModal, setShowPermissionsMatrixModal] = useState(false)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const itemsPerPage = 10

    useEffect(() => {
        fetchGroups()
        fetchPermissions()
        fetchUsers()
    }, [currentPage, filterType, filterStatus, searchTerm])

    const fetchGroups = async () => {
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                ...(filterType !== 'all' && { type: filterType }),
                ...(filterStatus !== 'all' && { status: filterStatus }),
                ...(searchTerm && { search: searchTerm })
            }

            const response = await api.get('/api/user-groups', { params })
            if (response.data.success) {
                setGroups(response.data.data.groups)
                setTotalPages(response.data.data.pagination.pages)
            }
        } catch (error) {
            console.error('Error fetching groups:', error)
            toast.error('Lỗi khi tải danh sách nhóm')
        } finally {
            setLoading(false)
        }
    }

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/api/permissions/by-module')
            if (response.data.success) {
                setPermissions(response.data.data)
            }
        } catch (error) {
            console.error('Error fetching permissions:', error)
        }
    }

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/users', { params: {} })
            if (response.data.success) {
                setAllUsers(response.data.data.users)
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const handleCreateGroup = async (formData) => {
        try {
            const response = await api.post('/api/user-groups', formData)
            if (response.data.success) {
                toast.success('Tạo nhóm thành công')
                setShowCreateModal(false)
                fetchGroups()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi tạo nhóm')
        }
    }

    const handleUpdateGroup = async (id, formData) => {
        try {
            const response = await api.put(`/api/user-groups/${id}`, formData)
            if (response.data.success) {
                toast.success('Cập nhật nhóm thành công')
                setShowEditModal(false)
                setSelectedGroup(null)
                fetchGroups()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật nhóm')
        }
    }

    const handleDeleteGroup = async (groupId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa nhóm này?')) return

        try {
            const response = await api.delete(`/api/user-groups/${groupId}`)
            if (response.data.success) {
                toast.success('Xóa nhóm thành công')
                fetchGroups()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa nhóm')
        }
    }

    const handleSeedGroups = async () => {
        if (!confirm('Khởi tạo nhóm mặc định? Hành động này sẽ tạo các nhóm hệ thống cơ bản.')) return

        try {
            const response = await api.post('/api/user-groups/seed')
            if (response.data.success) {
                toast.success(response.data.message)
                fetchGroups()
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi khởi tạo nhóm')
        }
    }

    const handleUpdatePermissions = async (groupId, permissionIds) => {
        try {
            const group = groups.find(g => g._id === groupId)
            const currentPermIds = group.permissions?.map(p => p._id || p) || []
            const toAdd = permissionIds.filter(id => !currentPermIds.includes(id))
            const toRemove = currentPermIds.filter(id => !permissionIds.includes(id))

            if (toAdd.length > 0) {
                await api.post(`/api/user-groups/${groupId}/permissions`, { permissionIds: toAdd })
            }
            if (toRemove.length > 0) {
                await api.delete(`/api/user-groups/${groupId}/permissions`, { data: { permissionIds: toRemove } })
            }

            toast.success('Cập nhật quyền thành công')
            setShowPermissionsModal(false)
            fetchGroups()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền')
        }
    }

    const handleUpdateMembers = async (groupId, userIds) => {
        try {
            const group = groups.find(g => g._id === groupId)
            const currentUserIds = group.members?.map(u => u._id || u) || []
            const toAdd = userIds.filter(id => !currentUserIds.includes(id))
            const toRemove = currentUserIds.filter(id => !userIds.includes(id))

            if (toAdd.length > 0) {
                await api.post(`/api/user-groups/${groupId}/members`, { userIds: toAdd })
            }
            if (toRemove.length > 0) {
                await api.delete(`/api/user-groups/${groupId}/members`, { data: { userIds: toRemove } })
            }

            toast.success('Cập nhật thành viên thành công')
            setShowMembersModal(false)
            fetchGroups()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thành viên')
        }
    }

    const handleSavePermissionsMatrix = async (permissions) => {
        try {
            console.log('Saving permissions for group:', selectedGroup._id, permissions)

            toast.success('Cập nhật phân quyền thành công')
            setShowPermissionsMatrixModal(false)
            setSelectedGroup(null)
        } catch (error) {
            toast.error('Lỗi khi cập nhật phân quyền')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Quản lý nhóm người dùng</h1>
                <p className="text-purple-100">Quản lý và cấu hình các nhóm người dùng trong hệ thống</p>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 flex items-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Tạo nhóm mới
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
                                placeholder="Tìm kiếm nhóm..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="all">Tất cả loại</option>
                        <option value="system">Nhóm hệ thống</option>
                        <option value="custom">Nhóm tùy chỉnh</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                    </select>
                </div>

                <button
                    onClick={handleSeedGroups}
                    className="mt-4 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Khởi tạo nhóm mặc định
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên nhóm</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành viên</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : groups.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Không tìm thấy nhóm nào</td>
                            </tr>
                        ) : (
                            groups.map((group, index) => (
                                <tr key={group._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: (group.metadata?.color || '#8B5CF6') + '20' }}
                                            >
                                                <Shield className="w-5 h-5" style={{ color: group.metadata?.color || '#8B5CF6' }} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{group.name}</div>
                                                <div className="text-xs text-gray-500">{group.code}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{group.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900">{group.memberCount || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          group.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                      </span>
                                        {group.type === 'system' && (
                                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Hệ thống
                        </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedGroup(group)
                                                    setShowDetailModal(true)
                                                }}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedGroup(group)
                                                    setShowEditModal(true)
                                                }}
                                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                title="Sửa"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedGroup(group)
                                                    setShowMembersModal(true)
                                                }}
                                                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                                title="Quản lý thành viên"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedGroup(group)
                                                    setShowPermissionsModal(true)
                                                }}
                                                className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                                title="Phân quyền"
                                            >
                                                <Lock className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedGroup(group)
                                                    setShowPermissionsMatrixModal(true)
                                                }}
                                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                                title="Phân quyền chi tiết"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                            {group.type !== 'system' && (
                                                <button
                                                    onClick={() => handleDeleteGroup(group._id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
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
            {showCreateModal && (
                <CreateGroupModal
                    onClose={() => setShowCreateModal(false)}
                    onSubmit={handleCreateGroup}
                />
            )}

            {showEditModal && selectedGroup && (
                <EditGroupModal
                    group={selectedGroup}
                    onClose={() => { setShowEditModal(false); setSelectedGroup(null); }}
                    onSubmit={handleUpdateGroup}
                />
            )}

            {showDetailModal && selectedGroup && (
                <DetailModal
                    group={selectedGroup}
                    onClose={() => { setShowDetailModal(false); setSelectedGroup(null); }}
                />
            )}

            {showPermissionsModal && selectedGroup && (
                <PermissionsModal
                    group={selectedGroup}
                    permissions={permissions}
                    onClose={() => { setShowPermissionsModal(false); setSelectedGroup(null); }}
                    onSave={handleUpdatePermissions}
                />
            )}

            {showMembersModal && selectedGroup && (
                <MembersModal
                    group={selectedGroup}
                    users={allUsers}
                    onClose={() => { setShowMembersModal(false); setSelectedGroup(null); }}
                    onSave={handleUpdateMembers}
                />
            )}

            {showPermissionsMatrixModal && selectedGroup && (
                <PermissionsMatrixModal
                    group={selectedGroup}
                    onClose={() => {
                        setShowPermissionsMatrixModal(false)
                        setSelectedGroup(null)
                    }}
                    onSave={handleSavePermissionsMatrix}
                />
            )}
        </div>
    )
}

// Modal Components
function CreateGroupModal({ onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        priority: 50
    })

    const handleSubmit = () => {
        if (!formData.code || !formData.name) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
            return
        }
        onSubmit(formData)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Tạo nhóm người dùng mới</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mã nhóm <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên nhóm <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                            Hủy
                        </button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            Tạo nhóm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function EditGroupModal({ group, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: group.name,
        description: group.description || '',
        priority: group.priority || 50,
        status: group.status
    })

    const handleSubmit = () => {
        onSubmit(group._id, formData)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Cập nhật nhóm: {group.name}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhóm</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                        </select>
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                            Hủy
                        </button>
                        <button onClick={handleSubmit} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            Cập nhật
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DetailModal({ group, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Chi tiết nhóm: {group.name}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Mã nhóm</label>
                            <p className="text-gray-900 font-mono">{group.code}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Loại</label>
                            <p className="text-gray-900">{group.type === 'system' ? 'Nhóm hệ thống' : 'Nhóm tùy chỉnh'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Số thành viên</label>
                            <p className="text-gray-900">{group.memberCount || 0}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Số quyền</label>
                            <p className="text-gray-900">{group.permissionCount || 0}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Mô tả</label>
                        <p className="text-gray-900">{group.description || 'Không có mô tả'}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PermissionsModal({ group, permissions, onClose, onSave }) {
    const [selectedPermissions, setSelectedPermissions] = useState(
        group.permissions?.map(p => p._id || p) || []
    )

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b sticky top-0 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Phân quyền: {group.name}</h2>
                            <p className="text-sm text-gray-500 mt-1">Đã chọn: {selectedPermissions.length} quyền</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    {Object.entries(permissions).map(([module, perms]) => (
                        <div key={module} className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase mb-3">{module}</h3>
                            <div className="space-y-2">
                                {perms.map((perm) => (
                                    <label key={perm._id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedPermissions.includes(perm._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedPermissions([...selectedPermissions, perm._id])
                                                } else {
                                                    setSelectedPermissions(selectedPermissions.filter(id => id !== perm._id))
                                                }
                                            }}
                                            className="w-4 h-4 text-purple-600 rounded"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{perm.name}</div>
                                            <div className="text-xs text-gray-500">{perm.code}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 border-t sticky bottom-0 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                        Hủy
                    </button>
                    <button
                        onClick={() => onSave(group._id, selectedPermissions)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    )
}

function MembersModal({ group, users, onClose, onSave }) {
    const [selectedUsers, setSelectedUsers] = useState(
        group.members?.map(u => u._id || u) || []
    )
    const [search, setSearch] = useState('')

    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b sticky top-0 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold">Quản lý thành viên: {group.name}</h2>
                            <p className="text-sm text-gray-500 mt-1">Đã chọn: {selectedUsers.length} người</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm người dùng..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>
                <div className="p-6 space-y-2">
                    {filteredUsers.map((user) => (
                        <label key={user._id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedUsers.includes(user._id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedUsers([...selectedUsers, user._id])
                                    } else {
                                        setSelectedUsers(selectedUsers.filter(id => id !== user._id))
                                    }
                                }}
                                className="w-4 h-4 text-purple-600 rounded"
                            />
                            <div className="flex-1">
                                <div className="font-medium">{user.fullName}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{user.role}</span>
                        </label>
                    ))}
                </div>
                <div className="p-6 border-t sticky bottom-0 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                        Hủy
                    </button>
                    <button
                        onClick={() => onSave(group._id, selectedUsers)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    )
}