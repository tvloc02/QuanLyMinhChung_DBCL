import axios from 'axios'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    Search, Plus, Edit, Trash2, Lock, Unlock, Shield,
    ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Users,
    Key, Eye, EyeOff, X, Send // Đã thêm Send vào import
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

// GIẢ ĐỊNH: Import component ActionButton từ đường dẫn tương đối
// Đảm bảo file ActionButtons.js nằm trong thư mục components
import { ActionButton } from '../../components/ActionButtons'


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
        expert: { label: 'Chuyên gia', icon: '', color: 'from-green-500 to-emerald-500' },
        advisor: { label: 'Tư vấn', icon: '', color: 'from-purple-500 to-violet-500' }
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
        if (!selectedUser) return

        try {
            setActionLoading(true)
            await api.delete(`/users/${selectedUser._id}`)

            setMessage({
                type: 'success',
                text: 'Xóa người dùng thành công'
            })
            setShowDeleteModal(false)
            setSelectedUser(null)
            fetchUsers()
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi xóa người dùng'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleLock = async () => {
        if (!selectedUser) return

        try {
            setActionLoading(true)
            await api.post(`/users/${selectedUser._id}/lock`, {
                reason: lockReason || 'Không có lý do cụ thể'
            })

            setMessage({
                type: 'success',
                text: 'Khóa tài khoản thành công'
            })
            setShowLockModal(false)
            setSelectedUser(null)
            setLockReason('')
            fetchUsers()
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi khóa tài khoản'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleUnlock = async () => {
        if (!selectedUser) return

        try {
            setActionLoading(true)
            await api.post(`/users/${selectedUser._id}/unlock`)

            setMessage({
                type: 'success',
                text: 'Mở khóa tài khoản thành công'
            })
            setShowUnlockModal(false)
            setSelectedUser(null)
            fetchUsers()
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi mở khóa tài khoản'
            })
        } finally {
            setActionLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (!selectedUser) return

        try {
            setActionLoading(true)
            const response = await api.post(`/users/${selectedUser._id}/reset-password`)

            if (response.data.success) {
                setNewPassword(response.data.data.newPassword)
                setMessage({
                    type: 'success',
                    text: 'Reset mật khẩu thành công'
                })
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Lỗi khi reset mật khẩu'
            })
            setShowResetPasswordModal(false)
            setSelectedUser(null)
        } finally {
            setActionLoading(false)
        }
    }

    const closeResetPasswordModal = () => {
        setShowResetPasswordModal(false)
        setSelectedUser(null)
        setNewPassword('')
        setShowNewPassword(false)
    }

    const canManageUsers = currentUser?.role === 'admin' || currentUser?.roles?.includes('admin')

    const renderRoles = (userRoles) => {
        if (!userRoles || userRoles.length === 0) return null

        return (
            <div className="flex flex-wrap gap-1.5">
                {userRoles.map((role, index) => {
                    const roleInfo = roleLabels[role]
                    if (!roleInfo) return null

                    return (
                        <span
                            key={index}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${roleInfo.color} text-white shadow-sm`}
                        >
                            <span>{roleInfo.icon}</span>
                            <span>{roleInfo.label}</span>
                        </span>
                    )
                })}
            </div>
        )
    }

    return (
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
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Quản lý người dùng</h1>
                            <p className="text-indigo-100">Quản lý tất cả người dùng trong hệ thống</p>
                        </div>
                    </div>
                    {canManageUsers && (
                        <button
                            onClick={() => router.push('/users/create')}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:shadow-xl transition-all font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Thêm người dùng</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, email..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value)
                                setPagination(prev => ({ ...prev, current: 1 }))
                            }}
                            className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            <option value="">Tất cả vai trò</option>
                            <option value="admin">Quản trị viên</option>
                            <option value="manager">Cán bộ quản lý</option>
                            <option value="expert">Chuyên gia</option>
                            <option value="advisor">Tư vấn</option>
                        </select>

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
                            <option value="suspended">Bị khóa</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">Không tìm thấy người dùng nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Người dùng</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Liên hệ</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Vai trò</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Trạng thái</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Phòng ban</th>
                                {canManageUsers && (
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Thao tác</th>
                                )}
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
                                                    <span className="text-white font-bold text-base">
                                                        {user.fullName?.charAt(0).toUpperCase()}
                                                    </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-semibold text-gray-900">{user.fullName}</div>
                                                <div className="text-sm text-gray-500">{user.position || 'Chưa cập nhật'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">{user.email}</div>
                                        <div className="text-sm text-gray-500">{user.phoneNumber || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {renderRoles(user.roles || [user.role])}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[user.status]}`}>
                                                {statusLabels[user.status]}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                        {user.department || 'N/A'}
                                    </td>
                                    {canManageUsers && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ActionButton
                                                    icon={Edit}
                                                    variant="edit"
                                                    size="sm"
                                                    onClick={() => router.push(`/users/${user._id}/edit`)}
                                                    title="Chỉnh sửa thông tin"
                                                />
                                                <ActionButton
                                                    icon={Key}
                                                    variant="warning"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setShowResetPasswordModal(true)
                                                    }}
                                                    title="Đổi mật khẩu"
                                                />
                                                {user.isLockedByAdmin ? (
                                                    <ActionButton
                                                        icon={Unlock}
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUser(user)
                                                            setShowUnlockModal(true)
                                                        }}
                                                        title="Mở khóa tài khoản"
                                                    />
                                                ) : (
                                                    <ActionButton
                                                        icon={Lock}
                                                        variant="purple"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedUser(user)
                                                            setShowLockModal(true)
                                                        }}
                                                        title="Khóa tài khoản"
                                                    />
                                                )}
                                                <ActionButton
                                                    icon={Trash2}
                                                    variant="delete"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setShowDeleteModal(true)
                                                    }}
                                                    title="Xóa người dùng"
                                                />
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && users.length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t-2 border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Hiển thị <span className="font-semibold text-indigo-600">{(pagination.current - 1) * 10 + 1}</span> đến{' '}
                                <span className="font-semibold text-indigo-600">{Math.min(pagination.current * 10, pagination.total)}</span>{' '}
                                trong tổng số <span className="font-semibold text-indigo-600">{pagination.total}</span> người dùng
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                                    disabled={!pagination.hasPrev}
                                    className="p-3 border-2 border-indigo-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 text-indigo-600" />
                                </button>
                                <span className="text-sm font-semibold text-gray-700 px-4 py-2 bg-white rounded-xl border-2 border-indigo-200 shadow-md">
                                        Trang {pagination.current} / {pagination.pages}
                                    </span>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                                    disabled={!pagination.hasNext}
                                    className="p-3 border-2 border-indigo-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-5 h-5 text-indigo-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start space-x-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-7 h-7 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
                                <p className="text-gray-600">
                                    Bạn có chắc chắn muốn xóa người dùng <strong className="text-gray-900">{selectedUser?.fullName}</strong>?
                                    Hành động này không thể hoàn tác.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setSelectedUser(null)
                                }}
                                disabled={actionLoading}
                                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                            >
                                {actionLoading ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lock Modal */}
            {showLockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start space-x-4 mb-6">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Lock className="w-7 h-7 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Khóa tài khoản</h3>
                                <p className="text-gray-600 mb-4">
                                    Khóa tài khoản <strong className="text-gray-900">{selectedUser?.fullName}</strong>?
                                    Người dùng sẽ không thể đăng nhập.
                                </p>
                                <textarea
                                    value={lockReason}
                                    onChange={(e) => setLockReason(e.target.value)}
                                    placeholder="Lý do khóa (tùy chọn)"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowLockModal(false)
                                    setSelectedUser(null)
                                    setLockReason('')
                                }}
                                disabled={actionLoading}
                                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleLock}
                                disabled={actionLoading}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                            >
                                {actionLoading ? 'Đang khóa...' : 'Khóa tài khoản'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unlock Modal */}
            {showUnlockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start space-x-4 mb-6">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Unlock className="w-7 h-7 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Mở khóa tài khoản</h3>
                                <p className="text-gray-600">
                                    Mở khóa tài khoản <strong className="text-gray-900">{selectedUser?.fullName}</strong>?
                                    Người dùng sẽ có thể đăng nhập lại.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowUnlockModal(false)
                                    setSelectedUser(null)
                                }}
                                disabled={actionLoading}
                                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUnlock}
                                disabled={actionLoading}
                                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                            >
                                {actionLoading ? 'Đang mở khóa...' : 'Mở khóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start space-x-4 mb-6">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Key className="w-7 h-7 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Đổi mật khẩu</h3>
                                <p className="text-gray-600">
                                    {newPassword ? (
                                        <>Mật khẩu mới cho <strong className="text-gray-900">{selectedUser?.fullName}</strong>:</>
                                    ) : (
                                        <>Đổi mật khẩu cho <strong className="text-gray-900">{selectedUser?.fullName}</strong>?</>
                                    )}
                                </p>
                                {newPassword && (
                                    <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <code className="text-lg font-mono font-bold text-orange-900">
                                                {showNewPassword ? newPassword : '••••••••'}
                                            </code>
                                            <button
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-all"
                                            >
                                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            {newPassword ? (
                                <button
                                    onClick={closeResetPasswordModal}
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                                >
                                    Đóng
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={closeResetPasswordModal}
                                        disabled={actionLoading}
                                        className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleResetPassword}
                                        disabled={actionLoading}
                                        className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                                    >
                                        {actionLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}