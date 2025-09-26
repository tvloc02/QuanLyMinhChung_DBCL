import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import { Users, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react'
import Pagination from '../components/common/Pagination'
import { ConfirmModal } from '../components/common/Modal'
import toast from 'react-hot-toast'

export default function UserManagementPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterRole, setFilterRole] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [deleteModal, setDeleteModal] = useState({ show: false, userId: null })

    const itemsPerPage = 10

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
        if (!isLoading && user && user.role !== 'admin') {
            router.replace('/dashboard')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchUsers()
        }
    }, [user, searchQuery, filterRole, currentPage])

    const breadcrumbItems = [
        { name: 'Quản lý người dùng', icon: Users }
    ]

    const fetchUsers = async () => {
        try {
            setLoading(true)
            // Mock API call - replace with actual service
            const mockUsers = [
                {
                    id: 1,
                    name: 'Admin User',
                    email: 'admin@vnua.edu.vn',
                    role: 'admin',
                    department: 'IT',
                    position: 'Quản trị hệ thống',
                    status: 'active',
                    lastLogin: '2024-12-25T10:00:00Z',
                    createdAt: '2024-01-01T00:00:00Z'
                },
                {
                    id: 2,
                    name: 'Manager User',
                    email: 'manager@vnua.edu.vn',
                    role: 'manager',
                    department: 'Đảm bảo chất lượng',
                    position: 'Trưởng phòng',
                    status: 'active',
                    lastLogin: '2024-12-24T15:30:00Z',
                    createdAt: '2024-02-01T00:00:00Z'
                },
                {
                    id: 3,
                    name: 'Staff User',
                    email: 'staff@vnua.edu.vn',
                    role: 'staff',
                    department: 'Đảm bảo chất lượng',
                    position: 'Chuyên viên',
                    status: 'active',
                    lastLogin: '2024-12-23T09:15:00Z',
                    createdAt: '2024-03-01T00:00:00Z'
                }
            ]

            // Apply filters
            let filteredUsers = mockUsers.filter(u => {
                const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                const matchesRole = !filterRole || u.role === filterRole
                return matchesSearch && matchesRole
            })

            // Pagination
            const startIndex = (currentPage - 1) * itemsPerPage
            const endIndex = startIndex + itemsPerPage
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

            setUsers(paginatedUsers)
            setTotalItems(filteredUsers.length)
            setTotalPages(Math.ceil(filteredUsers.length / itemsPerPage))
        } catch (error) {
            toast.error('Lỗi tải danh sách người dùng')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteUser = async (userId) => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('Xóa người dùng thành công')
            fetchUsers()
        } catch (error) {
            toast.error('Lỗi xóa người dùng')
        }
        setDeleteModal({ show: false, userId: null })
    }

    const getRoleBadge = (role) => {
        const roleConfig = {
            admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Quản trị viên' },
            manager: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Quản lý' },
            staff: { bg: 'bg-green-100', text: 'text-green-800', label: 'Nhân viên' },
            viewer: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Người xem' }
        }

        const config = roleConfig[role] || roleConfig.viewer

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    const getStatusBadge = (status) => {
        return status === 'active' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Hoạt động
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Vô hiệu hóa
            </span>
        )
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    return (
        <Layout
            title="Quản lý người dùng"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm theo tên, email..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="sm:w-48">
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Tất cả vai trò</option>
                                <option value="admin">Quản trị viên</option>
                                <option value="manager">Quản lý</option>
                                <option value="staff">Nhân viên</option>
                                <option value="viewer">Người xem</option>
                            </select>
                        </div>

                        {/* Add User Button */}
                        <button
                            onClick={() => router.push('/user-management/create')}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm người dùng
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Danh sách người dùng ({totalItems})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="loading-spinner mx-auto"></div>
                            <p className="text-gray-500 mt-2">Đang tải...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Không tìm thấy người dùng
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Không có người dùng nào phù hợp với bộ lọc hiện tại.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người dùng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vai trò
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phòng ban
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Đăng nhập cuối
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((userData) => (
                                    <tr key={userData.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {userData.name.charAt(0).toUpperCase()}
                                                            </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {userData.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {userData.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(userData.role)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{userData.department}</div>
                                            <div className="text-sm text-gray-500">{userData.position}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(userData.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(userData.lastLogin)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => router.push(`/user-management/${userData.id}`)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {userData.role !== 'admin' && (
                                                    <button
                                                        onClick={() => setDeleteModal({ show: true, userId: userData.id })}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, userId: null })}
                    onConfirm={() => handleDeleteUser(deleteModal.userId)}
                    title="Xác nhận xóa người dùng"
                    message="Bạn có chắc chắn muốn xóa người dùng này? Thao tác này không thể hoàn tác."
                    confirmText="Xóa"
                    type="danger"
                />
            </div>
        </Layout>
    )
}