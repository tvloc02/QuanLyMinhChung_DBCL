import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {UserPlus, X, CheckCircle, Loader2, FileText, ClipboardCheck} from 'lucide-react'

const REVIEWER_TYPE = {
    EXPERT: 'expert',
    ADVISOR: 'advisor'
}

export default function AssignReviewers() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { reportIds } = router.query

    const [loading, setLoading] = useState(false)
    const [reports, setReports] = useState([])
    const [allUsers, setAllUsers] = useState([])
    const [selectedReviewers, setSelectedReviewers] = useState([])
    const [reviewerTypeFilter, setReviewerTypeFilter] = useState(REVIEWER_TYPE.EXPERT)

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
            setReports(responses.map(r => r.data?.data || r.data).filter(r => r))
        } catch (error) {
            console.error('Fetch reports error:', error)
            toast.error('Lỗi khi tải thông tin báo cáo')
        }
    }

    const fetchUsers = async () => {
        try {
            let usersData = []
            const response = await apiMethods.users.getAll({ limit: 5000 })
            usersData = response.data?.data?.users || response.data?.users || []

            if (usersData.length === 0) {
                try {
                    const [expertsRes, advisorsRes] = await Promise.all([
                        fetch('/api/users?role=expert&limit=5000', {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        }),
                        fetch('/api/users?role=advisor&limit=5000', {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        })
                    ])

                    const expertsData = await expertsRes.json()
                    const advisorsData = await advisorsRes.json()

                    usersData = [
                        ...(expertsData.data?.users || []),
                        ...(advisorsData.data?.users || [])
                    ]
                } catch(e) {
                    console.error('Fallback fetch users failed:', e)
                }
            }

            const relevantRoles = ['expert', 'advisor', 'manager', 'admin'];
            const filteredAndActiveUsers = usersData.filter(u =>
                u.status === 'active' && relevantRoles.includes(u.role)
            );

            setAllUsers(filteredAndActiveUsers)

            if (filteredAndActiveUsers.length === 0) {
                toast.warning('Không tìm thấy người dùng có vai trò liên quan')
            }

        } catch (error) {
            console.error('Fetch users error:', error)
            toast.error('Lỗi khi tải danh sách người đánh giá')
        }
    }

    const handleAddReviewer = (userId) => {
        const userToAdd = allUsers.find(u => u._id === userId)
        if (!userToAdd) return toast.error('Không tìm thấy người dùng này.')

        const type = userToAdd.role === REVIEWER_TYPE.EXPERT ? REVIEWER_TYPE.EXPERT : REVIEWER_TYPE.ADVISOR;

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

            const response = await apiMethods.reports.bulkAddReviewers(bulkPayload)

            const results = response.data?.data || {};

            if (results.success > 0) {
                toast.success(`Phân quyền thành công cho ${results.success}/${ids.length} báo cáo`);
            }

            if (results.failed > 0) {
                toast.error(`Phân quyền thất bại cho ${results.failed} báo cáo. Vui lòng kiểm tra lỗi chi tiết.`);
            }

            router.push('/reports')

        } catch (error) {
            console.error('❌ Assign reviewers error:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi phân quyền'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const getUserDetails = (userId) => {
        return allUsers.find(u => u._id === userId) || { fullName: 'N/A', email: 'N/A' };
    }

    const filteredUsers = allUsers.filter(u => {
        if (reviewerTypeFilter === REVIEWER_TYPE.EXPERT) {
            return u.role === REVIEWER_TYPE.EXPERT;
        } else {
            return u.role !== REVIEWER_TYPE.EXPERT;
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
                                Phân quyền cho **{reports.length}** báo cáo đã chọn
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Chọn người đánh giá</h2>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Vai trò phân quyền
                                </label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setReviewerTypeFilter(REVIEWER_TYPE.EXPERT)}
                                        className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                                            reviewerTypeFilter === REVIEWER_TYPE.EXPERT
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Chuyên gia đánh giá
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviewerTypeFilter(REVIEWER_TYPE.ADVISOR)}
                                        className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                                            reviewerTypeFilter === REVIEWER_TYPE.ADVISOR
                                                ? 'bg-purple-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Cố vấn/Giám sát
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Lưu ý: Chuyên gia được phân quyền đánh giá. Cố vấn/Giám sát được phân quyền xem và bình luận.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Chọn **{reviewerTypeFilter === REVIEWER_TYPE.EXPERT ? 'chuyên gia' : 'cố vấn/giám sát'}**
                                    <span className="ml-2 text-gray-500">({filteredUsers.length} người)</span>
                                </label>
                                <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                                    {filteredUsers.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            Không có {reviewerTypeFilter === REVIEWER_TYPE.EXPERT ? 'chuyên gia' : 'cố vấn/giám sát'} nào
                                        </div>
                                    ) : (
                                        filteredUsers.map(person => {
                                            const isSelected = selectedReviewers.find(r => r.reviewerId === person._id)
                                            return (
                                                <div key={person._id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                            {person.fullName.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {person.fullName}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">{person.email} ({person.roleText || person.role})</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddReviewer(person._id)}
                                                        disabled={isSelected}
                                                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex-shrink-0"
                                                    >
                                                        {isSelected ? 'Đã chọn' : 'Chọn'}
                                                    </button>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {selectedReviewers.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Đã chọn ({selectedReviewers.length})
                                    </label>
                                    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                                        <div className="space-y-2">
                                            {selectedReviewers.map(reviewer => {
                                                const userDetails = getUserDetails(reviewer.reviewerId)
                                                return (
                                                    <div key={reviewer.reviewerId} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                        <div className="flex items-center space-x-3 min-w-0">
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                                                                reviewer.reviewerType === REVIEWER_TYPE.EXPERT
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-purple-100 text-purple-800'
                                                            }`}>
                                                                {reviewer.reviewerType === REVIEWER_TYPE.EXPERT ? 'Chuyên gia' : 'Cố vấn/GS'}
                                                            </span>
                                                            <span className="text-sm text-gray-900 font-medium truncate">
                                                                {userDetails.fullName} ({userDetails.email})
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveReviewer(reviewer.reviewerId)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-all flex-shrink-0"
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