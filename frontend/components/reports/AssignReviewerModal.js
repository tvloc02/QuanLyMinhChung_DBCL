import { useState, useEffect } from 'react'
import { X, UserPlus, Users, Search, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AssignReviewerModal({ report, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [experts, setExperts] = useState([])
    const [advisors, setAdvisors] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState('expert')
    const [selectedUserId, setSelectedUserId] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [selectedType])

    const fetchUsers = async () => {
        try {
            if (selectedType === 'expert') {
                const response = await assessmentService.getAvailableExperts()
                setExperts(response.data.data || [])
            } else {
                const response = await assessmentService.getAvailableAdvisors()
                setAdvisors(response.data.data || [])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Lỗi tải danh sách người dùng')
        }
    }

    const handleAssign = async () => {
        if (!selectedUserId) {
            toast.error('Vui lòng chọn người dùng')
            return
        }

        try {
            setLoading(true)

            await assessmentService.addReviewer(
                report._id,
                selectedUserId,
                selectedType
            )

            toast.success('Phân quyền đánh giá thành công')
            onSuccess()
        } catch (error) {
            console.error('Error assigning reviewer:', error)
            toast.error(error.response?.data?.message || 'Lỗi phân quyền đánh giá')
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (reviewerId, reviewerType) => {
        if (!confirm('Bạn có chắc muốn xóa quyền đánh giá này?')) return

        try {
            await assessmentService.removeReviewer(
                report._id,
                reviewerId,
                reviewerType
            )

            toast.success('Xóa quyền đánh giá thành công')
            onSuccess()
        } catch (error) {
            console.error('Error removing reviewer:', error)
            toast.error(error.response?.data?.message || 'Lỗi xóa quyền đánh giá')
        }
    }

    const users = selectedType === 'expert' ? experts : advisors
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Lọc người dùng đã được phân quyền
    const assignedExpertIds = report.experts.map(e => e.id)
    const assignedAdvisorIds = report.advisors.map(a => a.id)
    const assignedIds = selectedType === 'expert' ? assignedExpertIds : assignedAdvisorIds

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Phân quyền đánh giá
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {report.code} - {report.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Danh sách hiện tại */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Chuyên gia đánh giá */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <UserPlus className="h-5 w-5 text-green-500 mr-2" />
                                    Chuyên gia đánh giá ({report.experts.length})
                                </h3>
                                <div className="space-y-2">
                                    {report.experts.length === 0 ? (
                                        <p className="text-sm text-gray-500">Chưa có chuyên gia</p>
                                    ) : (
                                        report.experts.map((expert) => (
                                            <div
                                                key={expert.id}
                                                className="flex items-center justify-between p-2 bg-green-50 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {expert.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {expert.email}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(expert.id, 'expert')}
                                                    className="text-red-600 hover:text-red-700 text-sm"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Giám sát */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <Users className="h-5 w-5 text-blue-500 mr-2" />
                                    Giám sát ({report.advisors.length})
                                </h3>
                                <div className="space-y-2">
                                    {report.advisors.length === 0 ? (
                                        <p className="text-sm text-gray-500">Chưa có người giám sát</p>
                                    ) : (
                                        report.advisors.map((advisor) => (
                                            <div
                                                key={advisor.id}
                                                className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {advisor.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {advisor.email}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(advisor.id, 'advisor')}
                                                    className="text-red-600 hover:text-red-700 text-sm"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Thêm mới */}
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="font-medium text-gray-900 mb-4">
                                Thêm người đánh giá mới
                            </h3>

                            {/* Type Selection */}
                            <div className="flex space-x-4 mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="expert"
                                        checked={selectedType === 'expert'}
                                        onChange={(e) => {
                                            setSelectedType(e.target.value)
                                            setSelectedUserId('')
                                        }}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Chuyên gia đánh giá</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="advisor"
                                        checked={selectedType === 'advisor'}
                                        onChange={(e) => {
                                            setSelectedType(e.target.value)
                                            setSelectedUserId('')
                                        }}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Giám sát</span>
                                </label>
                            </div>

                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm người dùng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* User List */}
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {filteredUsers.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        Không tìm thấy người dùng
                                    </p>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const isAssigned = assignedIds.includes(user.id)
                                        return (
                                            <label
                                                key={user.id}
                                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                                    isAssigned
                                                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                                        : selectedUserId === user.id
                                                            ? 'bg-blue-50 border-blue-500'
                                                            : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    value={user.id}
                                                    checked={selectedUserId === user.id}
                                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                                    disabled={isAssigned}
                                                    className="mr-3"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {user.name}
                                                        </p>
                                                        {isAssigned && (
                                                            <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </label>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedUserId || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Đang xử lý...' : 'Phân quyền'}
                    </button>
                </div>
            </div>
        </div>
    )
}