import axios from 'axios'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    Search, Plus, Edit, Trash2, Lock, Unlock,
    ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Users,
    Key, Eye, EyeOff, X, Check
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { ActionButton } from '../ActionButtons'


export default function UsersListPage() {
    const router = useRouter()
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
    })

    // Modals
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showLockModal, setShowLockModal] = useState(false)
    const [showUnlockModal, setShowUnlockModal] = useState(false)
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)

    const [selectedUser, setSelectedUser] = useState(null)
    const [lockReason, setLockReason] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [newPassword, setNewPassword] = useState('')
    const [showNewPassword, setShowNewPassword] = useState(false)

    const roleLabels = {
        admin: { label: 'Quản trị viên', icon: '', color: 'from-red-500 to-pink-500' },
        manager: { label: 'Cán bộ quản lý', icon: '', color: 'from-blue-500 to-indigo-500' },
        tdg: { label: 'Cán bộ TĐG', icon: '', color: 'from-sky-500 to-blue-500' },
        expert: { label: 'Chuyên gia', icon: '', color: 'from-green-500 to-emerald-500' }
    }

    const statusLabels = {
        active: 'Hoạt động',
        inactive: 'Không hoạt động',
        suspended: 'Bị khóa',
        pending: 'Chờ xác nhận'
    }

    const statusColors = {
        active: 'bg-green-100 text-green-800 border-green-200',
        inactive: 'bg-gray-100 text-gray-800 border-gray-200',
        suspended: 'bg-red-100 text-red-800 border-red-200',
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }

    useEffect(() => {
        fetchUsers()
    }, [pagination.current, searchTerm, roleFilter, statusFilter])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const params = {
                page: pagination.current,
                limit: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            }

            if (searchTerm) params.search = searchTerm
            if (roleFilter) params.role = roleFilter
            if (statusFilter) params.status = statusFilter

            const response = await axios.get('http://localhost:5000/api/users', { params })

            if (response.data.success) {
                setUsers(response.data.data.users)
                setPagination(response.data.data.pagination)
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            setMessage({
                type: 'error',
                text: 'Lỗi khi tải danh sách người dùng'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (value) => {
        setSearchTerm(value)
        setPagination(prev => ({ ...prev, current: 1 }))
    }

    const handleDelete = async () => {
        try {
            setActionLoading(true)
            await api.delete(`/api/users/${selectedUser._id}`)
            setMessage({
                type: 'success',
                text: 'Xóa người dùng thành công'
            })
            setShowDeleteModal(false)
            setSelectedUser(null)
            fetchUsers()
        } catch (error) {
            console.error('Error deleting user:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi xóa người dùng'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleLock = async () => {
        try {
            setActionLoading(true)
            await api.post(`/api/users/${selectedUser._id}/lock`, { reason: lockReason })
            setMessage({
                type: 'success',
                text: 'Khóa người dùng thành công'
            })
            setShowLockModal(false)
            setLockReason('')
            setSelectedUser(null)
            fetchUsers()
        } catch (error) {
            console.error('Error locking user:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi khóa người dùng'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleUnlock = async () => {
        try {
            setActionLoading(true)
            await api.post(`/api/users/${selectedUser._id}/unlock`)
            setMessage({
                type: 'success',
                text: 'Mở khóa người dùng thành công'
            })
            setShowUnlockModal(false)
            setSelectedUser(null)
            fetchUsers()
        } catch (error) {
            console.error('Error unlocking user:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi mở khóa người dùng'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleResetPassword = async () => {
        try {
            setActionLoading(true)
            const response = await api.post(`/api/users/${selectedUser._id}/reset-password`)
            setNewPassword(response.data.data?.defaultPassword || '')
            setMessage({
                type: 'success',
                text: 'Reset mật khẩu thành công'
            })
        } catch (error) {
            console.error('Error resetting password:', error)
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi reset mật khẩu'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleEdit = (user) => {
        router.push(`/users/${user._id}/edit`)
    }

    return (
        <div className="space-y-6">
            {message.text && (
                <div className={`rounded-xl border p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                    message.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                }`}>
                    <div className="flex items-start gap-3">
                        {message.type === 'success' ? (
                            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                                {message.text}
                            </p>
                        </div>
                        <button
                            onClick={() => setMessage({ type: '', text: '' })}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Users className="w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold">Danh sách người dùng</h1>
                            <p className="text-blue-100">Quản lý người dùng hệ thống</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/users/create')}
                        className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Thêm người dùng</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả vai trò</option>
                        <option value="admin">Quản trị viên</option>
                        <option value="manager">Cán bộ quản lý</option>
                        <option value="tdg">Cán bộ TĐG</option>
                        <option value="expert">Chuyên gia</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                        <option value="suspended">Bị khóa</option>
                    </select>

                    <button
                        onClick={fetchUsers}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-4 py-3 text-center font-semibold text-gray-700 w-12">STT</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Người dùng</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Vai trò</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Phòng ban</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Thao tác</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.map((user, index) => (
                                    <tr key={user._id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                        <td className="px-4 py-3 text-center text-gray-600 font-medium">
                                            {(pagination.current - 1) * 10 + index + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{user.fullName}</div>
                                            <div className="text-xs text-gray-500">{user.position || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles && user.roles.map(r => (
                                                    <span key={r} className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${roleLabels[r]?.color} text-white`}>
                                                        {roleLabels[r]?.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            <div className="font-medium">{user.department?.name || '-'}</div>
                                            <div className="text-xs text-gray-500">{user.department?.code || ''}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColors[user.status]}`}>
                                                    {statusLabels[user.status]}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <ActionButton
                                                    icon={Edit}
                                                    label=""
                                                    onClick={() => handleEdit(user)}
                                                    variant="edit"
                                                    size="sm"
                                                    title="Chỉnh sửa người dùng"
                                                />
                                                <ActionButton
                                                    icon={Key}
                                                    label=""
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setShowResetPasswordModal(true)
                                                    }}
                                                    variant="warning"
                                                    size="sm"
                                                    title="Reset mật khẩu"
                                                />
                                                {user.status === 'active' ? (
                                                    <ActionButton
                                                        icon={Lock}
                                                        label=""
                                                        onClick={() => {
                                                            setSelectedUser(user)
                                                            setShowLockModal(true)
                                                        }}
                                                        variant="lock"
                                                        size="sm"
                                                        title="Khóa người dùng"
                                                    />
                                                ) : (
                                                    <ActionButton
                                                        icon={Unlock}
                                                        label=""
                                                        onClick={() => {
                                                            setSelectedUser(user)
                                                            setShowUnlockModal(true)
                                                        }}
                                                        variant="success"
                                                        size="sm"
                                                        title="Mở khóa người dùng"
                                                    />
                                                )}
                                                <ActionButton
                                                    icon={Trash2}
                                                    label=""
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setShowDeleteModal(true)
                                                    }}
                                                    variant="delete"
                                                    size="sm"
                                                    title="Xóa người dùng"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-gray-600">
                                Hiển thị {users.length} trên {pagination.total} người dùng
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                                    disabled={!pagination.hasPrev}
                                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-medium">
                                    Trang {pagination.current} / {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                                    disabled={!pagination.hasNext}
                                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md">
                        <h2 className="text-lg font-bold mb-4">Xác nhận xóa</h2>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser.fullName}</strong>?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={actionLoading}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
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

            {/* Lock Modal */}
            {showLockModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md">
                        <h2 className="text-lg font-bold mb-4">Khóa người dùng</h2>
                        <p className="text-gray-600 mb-4">Khóa người dùng <strong>{selectedUser.fullName}</strong></p>
                        <textarea
                            value={lockReason}
                            onChange={(e) => setLockReason(e.target.value)}
                            placeholder="Lý do khóa..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowLockModal(false)}
                                disabled={actionLoading}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleLock}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Đang khóa...' : 'Khóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unlock Modal */}
            {showUnlockModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md">
                        <h2 className="text-lg font-bold mb-4">Mở khóa người dùng</h2>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn mở khóa người dùng <strong>{selectedUser.fullName}</strong>?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowUnlockModal(false)}
                                disabled={actionLoading}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUnlock}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Đang mở khóa...' : 'Mở khóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md">
                        <h2 className="text-lg font-bold mb-4">Reset mật khẩu</h2>
                        {!newPassword ? (
                            <>
                                <p className="text-gray-600 mb-6">
                                    Reset mật khẩu cho người dùng <strong>{selectedUser.fullName}</strong>?
                                </p>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setShowResetPasswordModal(false)
                                            setSelectedUser(null)
                                        }}
                                        disabled={actionLoading}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleResetPassword}
                                        disabled={actionLoading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Đang reset...' : 'Reset'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-600 mb-4">Mật khẩu mới:</p>
                                <div className="flex items-center gap-2 mb-6">
                                    <code className="flex-1 px-3 py-2 bg-blue-50 rounded-lg font-mono text-sm font-semibold text-blue-900 border border-blue-200">
                                        {newPassword}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(newPassword)
                                            alert('Đã sao chép!')
                                        }}
                                        className="px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowResetPasswordModal(false)
                                        setNewPassword('')
                                        setSelectedUser(null)
                                    }}
                                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Đóng
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}