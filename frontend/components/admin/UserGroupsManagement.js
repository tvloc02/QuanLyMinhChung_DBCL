import { useState, useEffect } from 'react'
import {
    Users, Shield, Plus, Edit, Trash2, X, Search, UserPlus, Eye, RefreshCw, Lock, Settings
} from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import PermissionsMatrixModal from './PermissionsMatrixModal' // Import modal mới

export default function UserGroupsManagement() {
    const [groups, setGroups] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showPermissionsModal, setShowPermissionsModal] = useState(false)
    const [showMembersModal, setShowMembersModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showPermissionsMatrixModal, setShowPermissionsMatrixModal] = useState(false) // Modal mới

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

    const handleUpdateMembers = async (groupId, userIds) => {
        try {
            const group = groups.find(g => g._id === groupId)
            const currentUserIds = group.members?.map(u => u._id || u) || []
            const toAdd = userIds.filter(id => !currentUserIds.includes(id))
            const toRemove = currentUserIds.filter(id => !userIds.includes(id))

            if (toAdd.length > 0) {
                await api.post(`/user-groups/${groupId}/members`, { userIds: toAdd })
            }
            if (toRemove.length > 0) {
                await api.delete(`/user-groups/${groupId}/members`, { data: { userIds: toRemove } })
            }

            toast.success('Cập nhật thành viên thành công')
            setShowMembersModal(false)
            fetchGroups()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thành viên')
        }
    }

    // Handler cho Permissions Matrix Modal
    const handleSavePermissionsMatrix = async (permissions) => {
        try {
            // TODO: Call API để lưu permissions matrix
            // Format: { menuId: { view: true, create: true, update: false, delete: false } }

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
                                                    setShowPermissionsMatrixModal(true)
                                                }}
                                                className="p-1 text-orange-600 hover:bg-orange-50 rounded"
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

            {/* Other modals can be added here: Create, Edit, Members, Detail */}
        </div>
    )
}