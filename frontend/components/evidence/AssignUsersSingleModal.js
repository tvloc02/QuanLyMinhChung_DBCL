import { useState, useEffect } from 'react'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import { X, Loader2, Check } from 'lucide-react'

export default function AssignUsersSingleModal({ evidence, onClose, onSuccess }) {
    const [users, setUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.users.getAll({
                role: 'tdg',
                status: 'active'
            })
            setUsers(response.data?.data?.users || response.data?.data || [])
        } catch (error) {
            console.error('Fetch users error:', error)
            toast.error('Lỗi khi tải danh sách người dùng')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleUser = (userId) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(filteredUsers.map(u => u._id))
        }
    }

    const handleSubmit = async () => {
        if (selectedUsers.length === 0) {
            toast.error('Vui lòng chọn ít nhất một người dùng')
            return
        }

        try {
            setSubmitting(true)

            await apiMethods.evidences.assignUsers(evidence._id, {
                userIds: selectedUsers
            })

            toast.success(`Đã phân quyền cho ${selectedUsers.length} người dùng`)
            onSuccess()
        } catch (error) {
            console.error('Assign users error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi phân quyền')
        } finally {
            setSubmitting(false)
        }
    }

    const filteredUsers = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Phân Quyền Nộp File</h2>
                        <p className="text-indigo-100 text-sm">
                            Minh chứng: <strong>{evidence.code}</strong> - {evidence.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all disabled:opacity-50"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Tìm kiếm người dùng
                        </label>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Users List */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải danh sách người dùng...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 font-medium">Không tìm thấy người dùng nào</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All */}
                            <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="ml-3 text-sm font-semibold text-gray-700">
                                        Chọn tất cả ({filteredUsers.length})
                                    </span>
                                </label>
                            </div>

                            {/* User Items */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredUsers.map(user => (
                                    <div
                                        key={user._id}
                                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer"
                                        onClick={() => handleToggleUser(user._id)}
                                    >
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.includes(user._id)}
                                                onChange={() => handleToggleUser(user._id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <div className="ml-3 flex-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {user.fullName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {user.email}
                                                </p>
                                            </div>
                                            {selectedUsers.includes(user._id) && (
                                                <Check className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                                            )}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected Count */}
                    {selectedUsers.length > 0 && (
                        <div className="p-4 bg-indigo-100 border-2 border-indigo-300 rounded-xl">
                            <p className="text-sm font-semibold text-indigo-900">
                                Đã chọn <span className="text-lg text-indigo-600">{selectedUsers.length}</span> người dùng
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 p-6 flex gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || selectedUsers.length === 0}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                        Phân Quyền
                    </button>
                </div>
            </div>
        </div>
    )
}