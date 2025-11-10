// fileName: [id].js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    Edit2, Trash2, Download, CheckCircle, XCircle, Share2,
    ArrowLeft, Eye, Send, RotateCcw, FileText, Loader2, AlertCircle,
    Users, Calendar, Clock, Lock, User, TrendingUp, Link, FilePlus
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

const AssignedReportersModal = ({ isOpen, reporters, onClose }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-purple-600" />
                        Danh sách Người được giao
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="h-6 w-6" />
                    </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {reporters?.length > 0 ? (
                        reporters.map(r => (
                            <div key={r._id} className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <User className="w-5 h-5 text-purple-600 mr-3" />
                                <span className="font-medium text-gray-900">{r.fullName}</span>
                                <span className="ml-auto text-sm text-gray-600">{r.email}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">Không có người được giao.</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    )
}


export default function ReportDetail() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { id } = router.query

    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState({})
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [showReportersModal, setShowReportersModal] = useState(false)


    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (id && user) {
            fetchReport()
        }
    }, [id, user])

    const fetchReport = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.reports.getById(id)
            setReport(response.data.data)
        } catch (error) {
            console.error('Fetch report error:', error)
            toast.error('Lỗi khi tải báo cáo')
            router.replace('/reports')
        } finally {
            setLoading(false)
        }
    }

    const getPermissions = () => {
        if (!report || !user) return {}

        const isCreator = String(report.createdBy?._id) === String(user._id)
        const isAssignee = report.assignedReporters?.some(r => String(r._id) === String(user._id))
        const isManager = user.role === 'manager'
        const isAdmin = user.role === 'admin'

        const canEdit = isCreator || isAssignee || isManager || isAdmin

        const canMakePublic = canEdit && ['draft', 'in_progress'].includes(report.status)
        const canRetractPublic = canEdit && report.status === 'public'

        const canPublish = (isManager || isAdmin) && report.status === 'approved'
        const canUnpublish = (isManager || isAdmin) && report.status === 'published'

        const canApproveOrRejectReport = (isManager || isAdmin) && ['submitted', 'public'].includes(report.status)

        return {
            canView: true,
            canEdit: canEdit,
            canDelete: isCreator || isAdmin,
            canMakePublic: canMakePublic,
            canRetractPublic: canRetractPublic,
            canPublish: canPublish,
            canUnpublish: canUnpublish,
            canApproveReport: canApproveOrRejectReport,
            canRejectReport: canApproveOrRejectReport,
            canRequestEditPermission: !isAssignee && report.status === 'draft',
            isCreator,
            isAssignee,
            isManager,
            isAdmin
        }
    }

    const permissions = getPermissions()

    const handleEdit = () => {
        router.push(`/reports/${id}/edit`)
    }

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) return

        try {
            setActionLoading(prev => ({ ...prev, delete: true }))
            await apiMethods.reports.delete(id)
            toast.success('Xóa báo cáo thành công')
            router.replace('/reports')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa báo cáo')
        } finally {
            setActionLoading(prev => ({ ...prev, delete: false }))
        }
    }

    const handleMakePublic = async () => {
        if (report.status !== 'draft' && report.status !== 'in_progress') {
            toast.error('Chỉ có thể công khai báo cáo ở trạng thái Nháp hoặc Đang thực hiện.')
            return
        }
        if (!confirm('Bạn có chắc chắn muốn công khai báo cáo này? Người giao Task sẽ thấy báo cáo này để duyệt.')) return

        try {
            setActionLoading(prev => ({ ...prev, makePublic: true }))
            await apiMethods.reports.makePublic(id)
            toast.success('Công khai báo cáo thành công')
            fetchReport()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi công khai báo cáo')
        } finally {
            setActionLoading(prev => ({ ...prev, makePublic: false }))
        }
    }

    const handleRetractPublic = async () => {
        if (report.status !== 'public') {
            toast.error('Chỉ có thể thu hồi công khai báo cáo ở trạng thái Công khai.')
            return
        }
        if (!confirm('Bạn có chắc chắn muốn thu hồi công khai báo cáo này về trạng thái Draft?')) return

        try {
            setActionLoading(prev => ({ ...prev, retractPublic: true }))
            await apiMethods.reports.retractPublic(id)
            toast.success('Thu hồi công khai báo cáo thành công')
            fetchReport()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi thu hồi công khai báo cáo')
        } finally {
            setActionLoading(prev => ({ ...prev, retractPublic: false }))
        }
    }

    const handlePublish = async () => {
        if (report.status !== 'approved') {
            toast.error('Chỉ có thể phát hành (publish) báo cáo đã được Chấp thuận (approved).')
            return
        }
        if (!confirm('Bạn có chắc chắn muốn phát hành báo cáo này?')) return

        try {
            setActionLoading(prev => ({ ...prev, publish: true }))
            await apiMethods.reports.publish(id)
            toast.success('Phát hành báo cáo thành công')
            fetchReport()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi phát hành báo cáo')
        } finally {
            setActionLoading(prev => ({ ...prev, publish: false }))
        }
    }

    const handleUnpublish = async () => {
        if (report.status !== 'published') {
            toast.error('Chỉ có thể thu hồi xuất bản báo cáo đã phát hành.')
            return
        }
        if (!confirm('Bạn có chắc chắn muốn thu hồi xuất bản báo cáo này?')) return

        try {
            setActionLoading(prev => ({ ...prev, unpublish: true }))
            await apiMethods.reports.unpublish(id)
            toast.success('Thu hồi xuất bản báo cáo thành công')
            fetchReport()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi thu hồi báo cáo')
        } finally {
            setActionLoading(prev => ({ ...prev, unpublish: false }))
        }
    }

    const handleApproveReport = async () => {
        if (!confirm('Bạn có chắc chắn muốn phê duyệt báo cáo này?')) return

        try {
            setActionLoading(prev => ({ ...prev, approveReport: true }))
            await apiMethods.reports.approve(id)
            toast.success('Phê duyệt báo cáo thành công')
            fetchReport()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi phê duyệt báo cáo')
        } finally {
            setActionLoading(prev => ({ ...prev, approveReport: false }))
        }
    }

    const handleRejectReport = async () => {
        if (!rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối.')
            return
        }
        try {
            setActionLoading(prev => ({ ...prev, rejectReport: true }))
            await apiMethods.reports.reject(id, { feedback: rejectReason })
            toast.success('Từ chối báo cáo thành công')
            setShowRejectModal(false)
            setRejectReason('')
            fetchReport()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi từ chối báo cáo')
        } finally {
            setActionLoading(prev => ({ ...prev, rejectReport: false }))
        }
    }

    const handleNavigateToReviewAssignment = () => {
        router.push(`/assignments/assign-reviewers?reportId=${report._id}`)
    }

    const handleRequestEditPermission = async () => {
        try {
            setActionLoading(prev => ({ ...prev, requestEdit: true }))
            await apiMethods.reports.requestEditPermission(id)
            toast.success('Yêu cầu cấp quyền đã được gửi')
            fetchReport()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi yêu cầu quyền')
        } finally {
            setActionLoading(prev => ({ ...prev, requestEdit: false }))
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800 border-gray-300',
            public: 'bg-blue-100 text-blue-800 border-blue-300',
            approved: 'bg-green-100 text-green-800 border-green-300',
            rejected: 'bg-red-100 text-red-800 border-red-300',
            published: 'bg-purple-100 text-purple-800 border-purple-300',
            submitted: 'bg-cyan-100 text-cyan-800 border-cyan-300',
            in_progress: 'bg-sky-100 text-sky-800 border-sky-300',
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            public: 'Công khai',
            approved: 'Chấp thuận',
            rejected: 'Từ chối',
            published: 'Phát hành',
            submitted: 'Đã nộp chờ duyệt',
            in_progress: 'Đang thực hiện',
        }
        return labels[status] || status
    }

    if (isLoading || loading) {
        return (
            <Layout title="Chi tiết báo cáo">
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải báo cáo...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!report) {
        return (
            <Layout title="Chi tiết báo cáo">
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Báo cáo không tồn tại</p>
                        <button
                            onClick={() => router.push('/reports')}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </Layout>
        )
    }

    const isApprovedButNotPublished = report.status === 'approved'

    return (
        <Layout title={`Chi tiết báo cáo: ${report.code}`}>
            <div className="space-y-6">

                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold mb-1">{report.title}</h1>
                            <p className="text-blue-100">Mã: <span className="font-mono font-semibold">{report.code}</span></p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Quay lại
                            </button>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border border-white border-opacity-50 ${getStatusColor(report.status)} bg-opacity-90`}>
                                {getStatusLabel(report.status)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <div className="pb-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600"/> Nội dung chi tiết
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {report.standardId && (
                                        <span className="px-3 py-1 bg-sky-100 text-sky-800 text-sm rounded-full font-medium">
                                            Tiêu chuẩn: {report.standardId.code}
                                        </span>
                                    )}
                                    {report.criteriaId && (
                                        <span className="px-3 py-1 bg-cyan-100 text-cyan-800 text-sm rounded-full font-medium">
                                            Tiêu chí: {report.criteriaId.code}
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full font-medium">
                                        {report.typeText}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-6">
                                <div className="prose prose-lg max-w-none bg-gray-50 p-6 rounded-xl border border-gray-200 min-h-[300px]">
                                    <div dangerouslySetInnerHTML={{ __html: report.content || '<p className="text-gray-500 italic">Báo cáo này chưa có nội dung chi tiết.</p>' }} />
                                </div>
                            </div>
                        </div>

                        {(report.summary || report.keywords?.length > 0) && (
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Link className="w-5 h-5 text-green-600" />
                                    Tóm tắt & Từ khóa
                                </h3>
                                {report.summary && (
                                    <p className="text-gray-700 italic border-l-4 border-green-400 pl-4 py-2 mb-3">
                                        {report.summary}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {report.keywords?.map((keyword, index) => (
                                        <span key={index} className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1 space-y-6">

                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-600" />
                                Thông tin Phân công
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1"><User className="w-4 h-4"/> Người tạo:</p>
                                    <p className="text-sm font-bold text-gray-900">{report.createdBy?.fullName}</p>
                                </div>
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-600 flex items-center gap-1"><Users className="w-4 h-4"/> Người được giao:</p>
                                        <button
                                            onClick={() => setShowReportersModal(true)}
                                            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                                        >
                                            Xem tất cả ({report.assignedReporters?.length || 0})
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {report.assignedReporters?.slice(0, 3).map(r => (
                                            <span key={r._id} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                                                {r.fullName}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Ngày tạo:
                                    </p>
                                    <p className="text-sm font-semibold text-gray-800">{formatDate(report.createdAt)}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Clock className="w-4 h-4" /> Cập nhật cuối:
                                    </p>
                                    <p className="text-sm font-semibold text-gray-800">{formatDate(report.updatedAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-3">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Thao tác</h3>

                            {(permissions.canEdit || permissions.canDelete) && (
                                <div className="flex gap-3">
                                    {permissions.canEdit && (
                                        <button
                                            onClick={handleEdit}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Chỉnh sửa
                                        </button>
                                    )}
                                    {permissions.canDelete && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={actionLoading.delete}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Xóa
                                        </button>
                                    )}
                                </div>
                            )}

                            {permissions.canMakePublic && (
                                <button
                                    onClick={handleMakePublic}
                                    disabled={actionLoading.makePublic}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all font-medium text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Công khai báo cáo
                                </button>
                            )}

                            {permissions.canRetractPublic && (
                                <button
                                    onClick={handleRetractPublic}
                                    disabled={actionLoading.retractPublic}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all font-medium text-sm"
                                >
                                    <Lock className="w-4 h-4" />
                                    Thu hồi công khai
                                </button>
                            )}

                            {isApprovedButNotPublished && (permissions.isManager || permissions.isAdmin) && (
                                <button
                                    onClick={handleNavigateToReviewAssignment}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium text-sm"
                                >
                                    <FilePlus className="w-4 h-4" />
                                    Phân quyền đánh giá
                                </button>
                            )}

                            {permissions.canPublish && (
                                <button
                                    onClick={handlePublish}
                                    disabled={actionLoading.publish}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all font-medium text-sm"
                                >
                                    <Send className="w-4 h-4" />
                                    Phát hành (Public)
                                </button>
                            )}

                            {permissions.canUnpublish && (
                                <button
                                    onClick={handleUnpublish}
                                    disabled={actionLoading.unpublish}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-all font-medium text-sm"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Thu hồi phát hành
                                </button>
                            )}

                            {permissions.canApproveReport && (
                                <>
                                    <button
                                        onClick={handleApproveReport}
                                        disabled={actionLoading.approveReport}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all font-medium text-sm"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Phê duyệt
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={actionLoading.rejectReport}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium text-sm"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Từ chối
                                    </button>
                                </>
                            )}

                            {permissions.canRequestEditPermission && (
                                <button
                                    onClick={handleRequestEditPermission}
                                    disabled={actionLoading.requestEdit}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all font-medium text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Yêu cầu quyền sửa
                                </button>
                            )}

                        </div>
                    </div>
                </div>

                {/* Reject Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Từ chối báo cáo</h3>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Nhập lý do từ chối..."
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false)
                                        setRejectReason('')
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRejectReport}
                                    disabled={!rejectReason.trim() || actionLoading.rejectReport}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
                                >
                                    Xác nhận từ chối
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <AssignedReportersModal
                    isOpen={showReportersModal}
                    reporters={report?.assignedReporters}
                    onClose={() => setShowReportersModal(false)}
                />

            </div>
        </Layout>
    )
}