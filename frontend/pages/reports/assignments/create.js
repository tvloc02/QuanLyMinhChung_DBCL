import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {UserPlus, X, CheckCircle, Loader2, FileText, ClipboardCheck} from 'lucide-react'

export default function AssignReviewers() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { reportIds } = router.query

    const [loading, setLoading] = useState(false)
    const [reports, setReports] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [selectedReviewers, setSelectedReviewers] = useState([])
    const [reviewerTypeFilter, setReviewerTypeFilter] = useState('expert')

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/', icon: FileText },
        { name: 'Quản lý báo cáo', href: '/reports', icon: ClipboardCheck },
        { name: 'Phân quyền đánh giá' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (reportIds) {
            setLoading(true);
            Promise.all([
                fetchReports(),
                fetchUsers()
            ]).finally(() => setLoading(false));
        }
    }, [reportIds])

    const fetchReports = async () => {
        try {
            const ids = Array.isArray(reportIds) ? reportIds : reportIds.split(',')
            const promises = ids.map(id => apiMethods.reports.getById(id))
            const responses = await Promise.all(promises)
            setReports(responses.map(r => r.data?.data || r.data))
        } catch (error) {
            console.error('Fetch reports error:', error)
            toast.error('Lỗi khi tải thông tin báo cáo')
        }
    }

    const fetchUsers = async () => {
        try {
            let usersData = []

            // Khôi phục logic gọi API nhiều bước để đảm bảo hoạt động
            try {
                const response = await apiMethods.users.getAll()
                usersData = response.data?.data?.users || response.data?.users || []
            } catch (err) {
                try {
                    const response = await apiMethods.users.getAll({ limit: 1000 })
                    usersData = response.data?.data?.users || response.data?.users || []
                } catch (err2) {
                    // FALLBACK DÙNG FETCH
                    const [expertsRes, advisorsRes] = await Promise.all([
                        fetch('/api/users?role=expert', {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        }),
                        fetch('/api/users?role=advisor', {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        })
                    ])

                    const expertsData = await expertsRes.json()
                    const advisorsData = await advisorsRes.json()

                    usersData = [
                        ...(expertsData.data?.users || []),
                        ...(advisorsData.data?.users || [])
                    ]
                }
            }

            usersData = usersData.filter(u => u.status === 'active')

            setAllUsers(usersData)

            if (usersData.length === 0) {
                toast.warning('Không tìm thấy người dùng nào trong hệ thống')
            }

        } catch (error) {
            console.error('Fetch users error:', error)
            toast.error('Lỗi khi tải danh sách người đánh giá')

            // Xử lý Fallback cuối cùng
            try {
                const response = await fetch('/api/users', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                const data = await response.json()
                const users = data.data?.users || data.users || []
                setAllUsers(users.filter(u => u.status === 'active'))
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError)
            }
        }
    }

    // SỬA: Lấy vai trò thực tế để gán reviewerType
    const handleAddReviewer = (userId) => {
        const userToAdd = allUsers.find(u => u._id === userId)
        if (!userToAdd) return toast.error('Không tìm thấy người dùng này.')

        // Dùng role thực tế (expert) hoặc gán tất cả role khác (advisor, manager, admin) thành advisor
        const type = userToAdd.role === 'expert' ? 'expert' : 'advisor';

        if (!selectedReviewers.find(r => r.reviewerId === userId)) {
            setSelectedReviewers(prev => [...prev, {
                reviewerId: userId,
                reviewerType: type
            }])
        }
    }

    const handleRemoveReviewer = (userId) => {
        setSelectedReviewers(selectedReviewers.filter(r => r.reviewerId !== userId))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (selectedReviewers.length === 0) {
            toast.error('Vui lòng chọn ít nhất một người đánh giá')
            return
        }

        if (loading) return;

        try {
            setLoading(true)
            const ids = Array.isArray(reportIds) ? reportIds : reportIds.split(',')

            const bulkPayload = {
                reportIds: ids,
                reviewers: selectedReviewers
            }

            // GỌI BULK API
            const response = await apiMethods.reports.bulkAddReviewers(bulkPayload)

            const results = response.data?.data || {};

            if (results.success > 0) {
                toast.success(`Phân quyền đánh giá thành công`);
            } else {
                toast.error(`Phân quyền thất bại. Vui lòng kiểm tra các lỗi chi tiết.`);
            }

            router.push('/reports/reports')

        } catch (error) {
            console.error('❌ Assign reviewers error:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi phân quyền'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const getUserName = (userId) => {
        const user = allUsers.find(u => u._id === userId)
        return user ? `${user.fullName} (${user.email})` : 'N/A'
    }

    // Filter users theo type filter
    const filteredUsers = allUsers.filter(u => {
        if (reviewerTypeFilter === 'expert') {
            return u.role === 'expert';
        } else {
            // Bao gồm advisor, manager, admin làm cố vấn
            return u.role === 'advisor' || u.role === 'manager' || u.role === 'admin';
        }
    })

    if (isLoading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="max-w-8xl mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <UserPlus className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Phân quyền đánh giá báo cáo</h1>
                            <p className="text-blue-100">
                                Phân quyền cho {reports.length} báo cáo đã chọn
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Danh sách báo cáo */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                                Báo cáo được chọn
                            </h2>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {reports.map((report, index) => (
                                    <div key={report._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-start space-x-2">
                                            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-mono text-blue-600 font-semibold mb-1">
                                                    {report.code}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                                    {report.title}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Form phân quyền */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Chọn người đánh giá</h2>

                            {/* Loại người đánh giá */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Vai trò
                                </label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setReviewerTypeFilter('expert')}
                                        className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                                            reviewerTypeFilter === 'expert'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Chuyên gia đánh giá
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviewerTypeFilter('advisor')}
                                        className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                                            reviewerTypeFilter === 'advisor'
                                                ? 'bg-purple-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Cố vấn/Giám sát
                                    </button>
                                </div>
                            </div>

                            {/* Danh sách người đánh giá */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Chọn {reviewerTypeFilter === 'expert' ? 'chuyên gia' : 'cố vấn'}
                                    <span className="ml-2 text-gray-500">({filteredUsers.length} người)</span>
                                </label>
                                <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                                    {filteredUsers.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            Không có {reviewerTypeFilter === 'expert' ? 'chuyên gia' : 'cố vấn'} nào
                                        </div>
                                    ) : (
                                        filteredUsers.map(person => (
                                            <div key={person._id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {person.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {person.fullName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{person.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddReviewer(person._id)}
                                                    disabled={selectedReviewers.find(r => r.reviewerId === person._id)}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                                                >
                                                    {selectedReviewers.find(r => r.reviewerId === person._id) ? 'Đã chọn' : 'Chọn'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Danh sách đã chọn */}
                            {selectedReviewers.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Đã chọn ({selectedReviewers.length})
                                    </label>
                                    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                                        <div className="space-y-2">
                                            {selectedReviewers.map(reviewer => {
                                                const user = allUsers.find(u => u._id === reviewer.reviewerId)
                                                return (
                                                    <div key={reviewer.reviewerId} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                reviewer.reviewerType === 'expert'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-purple-100 text-purple-800'
                                                            }`}>
                                                                {reviewer.reviewerType === 'expert' ? 'Chuyên gia' : 'Cố vấn'}
                                                            </span>
                                                            <span className="text-sm text-gray-900">
                                                                {user ? user.fullName : getUserName(reviewer.reviewerId)}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveReviewer(reviewer.reviewerId)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || selectedReviewers.length === 0}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all inline-flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                            Phân quyền cho {reports.length} báo cáo
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    )
}