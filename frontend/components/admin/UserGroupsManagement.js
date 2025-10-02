import { useState, useEffect } from 'react'
import {
    Users, Shield, Plus, Edit, Trash2, X, Search, UserPlus, UserMinus, Lock, RefreshCw
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function UserGroupsManagement() {
    const [groups, setGroups] = useState([])
    const [permissions, setPermissions] = useState({})
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showPermissionsModal, setShowPermissionsModal] = useState(false)
    const [showMembersModal, setShowMembersModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchGroups()
        fetchPermissions()
        fetchUsers()
    }, [])

    const fetchGroups = async () => {
        try {
            setLoading(true)
            const response = await api.get('/api/user-groups')
            if (response.data.success) {
                setGroups(response.data.data.groups)
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
            const response = await api.get('/api/users', { params: { limit: 1000 } })
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

    const handleUpdatePermissions = async (groupId, permissionIds) => {
        try {
            // Lấy nhóm hiện tại
            const group = groups.find(g => g._id === groupId)
            const currentPermIds = group.permissions?.map(p => p._id || p) || []

            // Tìm permissions cần thêm và xóa
            const toAdd = permissionIds.filter(id => !currentPermIds.includes(id))
            const toRemove = currentPermIds.filter(id => !permissionIds.includes(id))

            // Thêm permissions mới
            if (toAdd.length > 0) {
                await api.post(`/api/user-groups/${groupId}/permissions`, {
                    permissionIds: toAdd
                })
            }

            // Xóa permissions không còn
            if (toRemove.length > 0) {
                await api.delete(`/api/user-groups/${groupId}/permissions`, {
                    data: { permissionIds: toRemove }
                })
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
            // Lấy nhóm hiện tại
            const group = groups.find(g => g._id === groupId)
            const currentUserIds = group.members?.map(u => u._id || u) || []

            // Tìm users cần thêm và xóa
            const toAdd = userIds.filter(id => !currentUserIds.includes(id))
            const toRemove = currentUserIds.filter(id => !userIds.includes(id))

            // Thêm members mới
            if (toAdd.length > 0) {
                await api.post(`/api/user-groups/${groupId}/members`, {
                    userIds: toAdd
                })
            }

            // Xóa members không còn
            if (toRemove.length > 0) {
                await api.delete(`/api/user-groups/${groupId}/members`, {
                    data: { userIds: toRemove }
                })
            }

            toast.success('Cập nhật thành viên thành công')
            setShowMembersModal(false)
            fetchGroups()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thành viên')
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

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const GroupCard = ({ group }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: (group.metadata?.color || '#3B82F6') + '20' }}
                    >
                        <Shield
                            className="w-6 h-6"
                            style={{ color: group.metadata?.color || '#3B82F6' }}
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-500">{group.code}</p>
                    </div>
                </div>
                {group.type === 'system' && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            Hệ thống
          </span>
                )}
            </div>

            <p className="text-sm text-gray-600 mb-4">{group.description}</p>

            <div className="flex items-center gap-6 mb-4 text-sm">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{group.memberCount || 0} thành viên</span>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{group.permissionCount || 0} quyền</span>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => {
                        setSelectedGroup(group)
                        setShowMembersModal(true)
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Thành viên
                </button>
                <button
                    onClick={() => {
                        setSelectedGroup(group)
                        setShowPermissionsModal(true)
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                >
                    <Lock className="w-4 h-4" />
                    Phân quyền
                </button>
                {group.type !== 'system' && (
                    <button
                        onClick={() => handleDeleteGroup(group._id)}
                        className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )

    const CreateGroupModal = () => {
        const [formData, setFormData] = useState({
            code: '',
            name: '',
            description: '',
            priority: 50
        })

        const handleSubmit = (e) => {
            e.preventDefault()
            handleCreateGroup(formData)
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Tạo nhóm người dùng mới</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mã nhóm <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="VD: CUSTOM_GROUP_1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
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
                                placeholder="Nhóm người dùng tùy chỉnh"
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
                                placeholder="Mô tả về nhóm người dùng này..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Độ ưu tiên (0-100)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Tạo nhóm
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    const PermissionsModal = () => {
        const [selectedPermissions, setSelectedPermissions] = useState(
            selectedGroup?.permissions?.map(p => p._id || p) || []
        )

        const handleSave = () => {
            handleUpdatePermissions(selectedGroup._id, selectedPermissions)
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Phân quyền cho nhóm: {selectedGroup?.name}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Chọn các quyền để gán cho nhóm người dùng này
                                </p>
                            </div>
                            <button onClick={() => setShowPermissionsModal(false)} className="text-gray-400 hover:text-gray-600">
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
                                        <label
                                            key={perm._id}
                                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                        >
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
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">{perm.name}</div>
                                                <div className="text-xs text-gray-500">{perm.code}</div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded ${
                                                perm.action === 'manage' ? 'bg-red-100 text-red-800' :
                                                    perm.action === 'create' ? 'bg-green-100 text-green-800' :
                                                        perm.action === 'update' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'
                                            }`}>
                        {perm.action}
                      </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Đã chọn: <span className="font-semibold">{selectedPermissions.length}</span> quyền
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPermissionsModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const MembersModal = () => {
        const [selectedUsers, setSelectedUsers] = useState(
            selectedGroup?.members?.map(u => u._id || u) || []
        )
        const [userSearch, setUserSearch] = useState('')

        const filteredUsers = allUsers.filter(user =>
            user.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearch.toLowerCase())
        )

        const handleSave = () => {
            handleUpdateMembers(selectedGroup._id, selectedUsers)
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Quản lý thành viên: {selectedGroup?.name}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Thêm hoặc xóa thành viên khỏi nhóm
                                </p>
                            </div>
                            <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="Tìm kiếm người dùng..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredUsers.map((user) => (
                                <label
                                    key={user._id}
                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
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
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{user.fullName}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {user.role}
                  </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Đã chọn: <span className="font-semibold">{selectedUsers.length}</span> người dùng
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowMembersModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm nhóm..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSeedGroups}
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
                        Tạo nhóm mới
                    </button>
                </div>
            </div>

            {/* Groups Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : filteredGroups.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-500">Không tìm thấy nhóm nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGroups.map((group) => (
                        <GroupCard key={group._id} group={group} />
                    ))}
                </div>
            )}

            {/* Modals */}
            {showCreateModal && <CreateGroupModal />}
            {showPermissionsModal && selectedGroup && <PermissionsModal />}
            {showMembersModal && selectedGroup && <MembersModal />}
        </div>
    )
}