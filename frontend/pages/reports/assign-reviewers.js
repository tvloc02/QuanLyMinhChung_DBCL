import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import { UserPlus, X, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react'

export default function AssignReviewers() {
    const router = useRouter()
    const { user } = useAuth()
    const { reportIds } = router.query

    const [loading, setLoading] = useState(false)
    const [reports, setReports] = useState([])
    const [experts, setExperts] = useState([])
    const [advisors, setAdvisors] = useState([])
    const [selectedReviewers, setSelectedReviewers] = useState([])
    const [reviewerType, setReviewerType] = useState('expert')

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/' },
        { name: 'Quản lý báo cáo', href: '/reports' },
        { name: 'Phân quyền đánh giá' }
    ]

    useEffect(() => {
        if (reportIds) {
            fetchReports()
            fetchUsers()
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
            const response = await apiMethods.users.getAll({ role: 'expert,advisor' })
            const users = response.data?.data?.users || []
            setExperts(users.filter(u => u.role === 'expert'))
            setAdvisors(users.filter(u => u.role === 'advisor'))
        } catch (error) {
            console.error('Fetch users error:', error)
        }
    }

    const handleAddReviewer = (userId) => {
        if (!selectedReviewers.find(r => r.reviewerId === userId)) {
            setSelectedReviewers([...selectedReviewers, {
                reviewerId: userId,
                reviewerType: reviewerType
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

        try {
            setLoading(true)
            const ids = Array.isArray(reportIds) ? reportIds : reportIds.split(',')

            await apiMethods.reports.bulkAddReviewers({
                reportIds: ids,
                reviewers: selectedReviewers
            })

            toast.success('Phân quyền đánh giá thành công')
            router.push('/reports')
        } catch (error) {
            console.error('Assign reviewers error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi phân quyền')
        } finally {
            setLoading(false)
        }
    }

    const getUserName = (userId) => {
        const allUsers = [...experts, ...advisors]
        const user = allUsers.find(u => u._id === userId)
        return user ? `${user.fullName} (${user.email})` : 'N/A'
    }

    return (
        <Layout title="Phân quyền đánh giá" breadcrumbItems={breadcrumbItems}>
            <div className="max-w-5xl mx-auto">
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
                                        onClick={() => setReviewerType('expert')}
                                        className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                                            reviewerType === 'expert'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Chuyên gia đánh giá
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviewerType('advisor')}
                                        className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                                            reviewerType === 'advisor'
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
                                    Chọn {reviewerType === 'expert' ? 'chuyên gia' : 'cố vấn'}
                                </label>
                                <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                                    {(reviewerType === 'expert' ? experts : advisors).map(person => (
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
                                    ))}
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
                                            {selectedReviewers.map(reviewer => (
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
                                                            {getUserName(reviewer.reviewerId)}
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
                                            ))}
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