import axios from 'axios'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    Search, Plus, Edit, Trash2, Lock, Unlock,
    ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Users,
    Key, Eye, EyeOff, X, Check, Filter
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { ActionButton } from '../ActionButtons'


export default function UsersListPage() {
    const router = useRouter()
    const { user: currentUser } = useAuth()

    // Phân quyền
    const isAdmin = currentUser?.role === 'admin'
    const isManager = currentUser?.role === 'manager'
    const userDepartmentId = currentUser?.department

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
    const [showFilters, setShowFilters] = useState(false)

    const roleLabels = {
        admin: { label: 'Quản trị viên', icon: '', color: 'from-red-600 to-pink-600' },
        manager: { label: 'Cán bộ quản lý', icon: '', color: 'from-indigo-600 to-purple-600' },
        tdg: { label: 'Thành viên đóng góp', icon: '', color: 'from-emerald-600 to-teal-600' },
        expert: { label: 'Chuyên gia', icon: '', color: 'from-yellow-600 to-orange-600' }
    }

    const statusLabels = {
        active: 'Hoạt động',
        inactive: 'Không hoạt động',
        suspended: 'Bị khóa',
        pending: 'Chờ xác nhận'
    }

    const statusColors = {
        active: 'bg-green-100 text-green-700 border-green-200',
        inactive: 'bg-gray-100 text-gray-700 border-gray-200',
        suspended: 'bg-red-100 text-red-700 border-red-200',
        pending: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }

    useEffect(() => {
        // Chỉ fetch nếu currentUser đã load xong
        if (currentUser) {
            fetchUsers()
        }
    }, [pagination.current, searchTerm, roleFilter, statusFilter, currentUser])

    const fetchUsers = async () => {
        try {
            setLoading(true)

            // 1. Cấu hình base params
            const params = {
                page: pagination.current,
                limit: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            }

            // 2. Thêm filters chung
            if (searchTerm) params.search = searchTerm
            if (roleFilter) params.role = roleFilter
            if (statusFilter) params.status = statusFilter

            // 3. Áp dụng giới hạn phòng ban cho Manager
            if (isManager && userDepartmentId) {
                params.departmentId = userDepartmentId
            } else if (isManager && !userDepartmentId) {
                // Nếu là Manager mà chưa được gán phòng ban, không load ai
                setUsers([]);
                setPagination(prev => ({ ...prev, total: 0, pages: 1 }));
                setLoading(false);
                return;
            }

            const response = await api.get('/api/users', { params })

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
        if (!isAdmin) {
            setMessage({ type: 'error', text: 'Bạn không có quyền thực hiện thao tác này.' });
            setShowDeleteModal(false);
            return;
        }

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
        if (!isAdmin) {
            setMessage({ type: 'error', text: 'Bạn không có quyền thực hiện thao tác này.' });
            setShowLockModal(false);
            return;
        }

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
        if (!isAdmin) {
            setMessage({ type: 'error', text: 'Bạn không có quyền thực hiện thao tác này.' });
            setShowUnlockModal(false);
            return;
        }

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
        if (!isAdmin) {
            setMessage({ type: 'error', text: 'Bạn không có quyền thực hiện thao tác này.' });
            setShowResetPasswordModal(false);
            return;
        }

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
        if (!isAdmin) {
            setMessage({ type: 'error', text: 'Bạn không có quyền chỉnh sửa người dùng.' });
            return;
        }
        router.push(`/users/${user._id}/edit`)
    }

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(newPassword);
        setMessage({ type: 'success', text: 'Đã sao chép mật khẩu vào clipboard!' });
    }

    // Nếu chưa load xong currentUser (auth context) hoặc Manager chưa có departmentId
    if (loading && !currentUser) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Nếu là Manager nhưng chưa được gán phòng ban
    if (isManager && !userDepartmentId && users.length === 0 && !loading) {
        return (
            <div className="p-8 bg-white rounded-xl shadow-lg border border-red-200 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Không có quyền truy cập dữ liệu</h3>
                <p className="text-gray-600">
                    Bạn là cán bộ quản lý nhưng chưa được gán phòng ban. Vui lòng liên hệ Admin để được cấp quyền.
                </p>
            </div>
        );
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

            {/* Header - Màu xanh lam */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Danh sách người dùng</h1>
                            <p className="text-blue-100">Quản lý người dùng hệ thống</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => router.push('/users/create')}
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-lg transition-all font-semibold"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Thêm người dùng</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                        <option value="">Tất cả vai trò</option>
                        {Object.keys(roleLabels).map(role => (
                            <option key={role} value={role}>{roleLabels[role].label}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                        <option value="">Tất cả trạng thái</option>
                        {Object.keys(statusLabels).map(status => (
                            <option key={status} value={status}>{statusLabels[status]}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => {
                            setPagination(prev => ({ ...prev, current: 1 }));
                            fetchUsers();
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                        <RefreshCw className="w-5 h-5" />
                        <span>Làm mới</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-blue-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-16 text-center">
                        <Users className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy người dùng nào</h3>
                        <p className="text-gray-500">
                            Hãy thử thay đổi bộ lọc hoặc {isAdmin ? 'thêm người dùng mới' : 'liên hệ Admin để kiểm tra dữ liệu.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-blue-100">
                                <tr className="border-b-2 border-blue-200">
                                    <th className="px-4 py-3 text-center font-bold text-gray-700 w-16 uppercase border-r border-blue-200">STT</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-700 min-w-[150px] uppercase border-r border-blue-200">Người dùng</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-700 min-w-[200px] uppercase border-r border-blue-200">Email</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-700 min-w-[200px] uppercase border-r border-blue-200">Vai trò</th>
                                    <th className="px-4 py-3 text-left font-bold text-gray-700 min-w-[150px] uppercase border-r border-blue-200">Phòng ban</th>
                                    <th className="px-4 py-3 text-center font-bold text-gray-700 w-32 uppercase border-r border-blue-200">Trạng thái</th>
                                    <th className="px-4 py-3 text-center font-bold text-gray-700 w-48 uppercase">Thao tác</th>
                                </tr>
                                </thead>
                                <tbody>
                                {users.map((user, index) => (
                                    <tr key={user._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors border-b border-blue-200`}>
                                        <td className="px-4 py-3 text-center text-gray-600 font-medium border-r border-blue-200">
                                            {(pagination.current - 1) * 10 + index + 1}
                                        </td>
                                        <td className="px-4 py-3 border-r border-blue-200">
                                            <div className="font-semibold text-gray-900">{user.fullName}</div>
                                            <div className="text-xs text-gray-500">{user.position || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 border-r border-blue-200">{user.email}</td>
                                        <td className="px-4 py-3 border-r border-blue-200">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles && user.roles.map(r => (
                                                    <span key={r} className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r ${roleLabels[r]?.color} text-white shadow-md`}>
                                                        {roleLabels[r]?.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 border-r border-blue-200">
                                            <div className="font-medium text-gray-700">{user.department?.name || '-'}</div>
                                            <div className="text-xs text-gray-500">{user.department?.code || ''}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center border-r border-blue-200">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-lg border ${statusColors[user.status]}`}>
                                                    {statusLabels[user.status]}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {isAdmin ? (
                                                    <>
                                                        <ActionButton
                                                            icon={Edit}
                                                            onClick={() => handleEdit(user)}
                                                            variant="edit"
                                                            size="sm"
                                                            title="Chỉnh sửa người dùng"
                                                        />
                                                        <ActionButton
                                                            icon={Key}
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
                                                            onClick={() => {
                                                                setSelectedUser(user)
                                                                setShowDeleteModal(true)
                                                            }}
                                                            variant="delete"
                                                            size="sm"
                                                            title="Xóa người dùng"
                                                        />
                                                    </>
                                                ) : (
                                                    // Các vai trò khác không có quyền thao tác trực tiếp
                                                    <span className="text-gray-400 text-sm italic">Chỉ xem</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-t-2 border-blue-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Hiển thị <span className="font-bold text-blue-600">{users.length}</span> trên tổng số{' '}
                                <span className="font-bold text-blue-600">{pagination.total}</span> người dùng
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                                    disabled={!pagination.hasPrev}
                                    className="px-4 py-2 border-2 border-blue-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-medium text-gray-700">
                                    Trang <span className="font-semibold text-blue-600">{pagination.current}</span> / <span className="font-semibold text-blue-600">{pagination.pages}</span>
                                </span>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                                    disabled={!pagination.hasNext}
                                    className="px-4 py-2 border-2 border-blue-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-red-700 flex items-center">
                            <Trash2 className="w-6 h-6 mr-2" /> Xác nhận xóa
                        </h2>
                        <p className="text-gray-700 mb-6">
                            Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser.fullName}</strong>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={actionLoading}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
                            >
                                {actionLoading ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lock Modal */}
            {showLockModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-red-700 flex items-center">
                            <Lock className="w-6 h-6 mr-2" /> Khóa người dùng
                        </h2>
                        <p className="text-gray-700 mb-4">Khóa người dùng <strong>{selectedUser.fullName}</strong></p>
                        <textarea
                            value={lockReason}
                            onChange={(e) => setLockReason(e.target.value)}
                            placeholder="Lý do khóa..."
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 transition-all"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowLockModal(false)}
                                disabled={actionLoading}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleLock}
                                disabled={actionLoading || !lockReason.trim()}
                                className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
                            >
                                {actionLoading ? 'Đang khóa...' : 'Khóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unlock Modal */}
            {showUnlockModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-green-700 flex items-center">
                            <Unlock className="w-6 h-6 mr-2" /> Mở khóa người dùng
                        </h2>
                        <p className="text-gray-700 mb-6">
                            Bạn có chắc chắn muốn mở khóa người dùng <strong>{selectedUser.fullName}</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowUnlockModal(false)}
                                disabled={actionLoading}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUnlock}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all font-medium"
                            >
                                {actionLoading ? 'Đang mở khóa...' : 'Mở khóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-blue-700 flex items-center">
                            <Key className="w-6 h-6 mr-2" /> Reset mật khẩu
                        </h2>
                        {!newPassword ? (
                            <>
                                <p className="text-gray-700 mb-6">
                                    Xác nhận reset mật khẩu cho người dùng <strong>{selectedUser.fullName}</strong>?
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setShowResetPasswordModal(false)
                                            setSelectedUser(null)
                                        }}
                                        disabled={actionLoading}
                                        className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleResetPassword}
                                        disabled={actionLoading}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
                                    >
                                        {actionLoading ? 'Đang reset...' : 'Reset'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-700 mb-4">Mật khẩu mới đã được tạo:</p>
                                <div className="flex items-center gap-2 mb-6 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                    <code className="flex-1 font-mono text-sm font-semibold text-blue-900 overflow-x-auto whitespace-nowrap">
                                        {newPassword}
                                    </code>
                                    <button
                                        onClick={handleCopyPassword}
                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all flex-shrink-0"
                                        title="Sao chép"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowResetPasswordModal(false)
                                        setNewPassword('')
                                        setSelectedUser(null)
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-medium"
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