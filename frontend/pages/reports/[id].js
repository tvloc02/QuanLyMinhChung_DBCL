import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    Edit2, Trash2, Download, Lock, CheckCircle, XCircle, Share2,
    ArrowLeft, Eye, Send, RotateCcw, FileText, Loader2, AlertCircle
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ReportDetail() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { id } = router.query

    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState({})
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectReason, setRejectReason] = useState('')

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

    // Xác định quyền của user hiện tại
    const getPermissions = () => {
        if (!report || !user) return {}

        const isCreator = report.createdBy?._id === user._id
        const isAssignee = report.assignedReporters?.some(r => r._id === user._id)
        const isManager = user.role === 'manager'
        const isAdmin = user.role === 'admin'
        const isReporter = user.role === 'reporter'

        return {
            canView: true, // Tất cả đều có quyền xem
            canEdit: isCreator || isAssignee,
            canDelete: isCreator || isAssignee,
            canPublish: isCreator || isAssignee,
            canUnpublish: isCreator || isAssignee,
            canApproveReport: isManager && report.status !== 'approved' && report.status !== 'rejected',
            canRejectReport: isManager && report.status !== 'approved' && report.status !== 'rejected',
            canApproveEditRequest: (isCreator || isAssignee) && isReporter,
            canRejectEditRequest: (isCreator || isAssignee) && isReporter,
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

    const handlePublish = async () => {
        if (!confirm('Bạn có chắc chắn muốn xuất bản báo cáo này?')) return

        try {
            setActionLoading(prev => ({ ...prev, publish: true }))
            await apiMethods.reports.publish(id)
            toast.success('Xuất bản báo cáo thành công')
            fetchReport()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xuất bản báo cáo')
        } finally {
            setActionLoading(prev => ({ ...prev, publish: false }))
        }
    }

    const handleUnpublish = async () => {
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
            draft: 'bg-gray-100 text-gray-800',
            public: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            published: 'bg-purple-100 text-purple-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            public: 'Công khai',
            approved: 'Chấp thuận',
            rejected: 'Từ chối',
            published: 'Phát hành'
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

    return (
        <Layout title="Chi tiết báo cáo">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại
                    </button>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="space-y-6">
                        {/* Title & Status */}
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.title}</h1>
                                    <p className="text-gray-600">Mã: <span className="font-mono font-semibold text-blue-600">{report.code}</span></p>
                                </div>
                                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(report.status)}`}>
                                    {getStatusLabel(report.status)}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {report.standardId && (
                                    <span className="px-3 py-1 bg-sky-100 text-sky-800 text-sm rounded-full">
                                        Tiêu chuẩn: {report.standardId.code}
                                    </span>
                                )}
                                {report.criteriaId && (
                                    <span className="px-3 py-1 bg-cyan-100 text-cyan-800 text-sm rounded-full">
                                        Tiêu chí: {report.criteriaId.code}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Người tạo</p>
                                <p className="font-semibold text-gray-900">{report.createdBy?.fullName}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
                                <p className="font-semibold text-gray-900">{formatDate(report.createdAt)}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Người được giao</p>
                                <p className="font-semibold text-gray-900">{report.assignedReporters?.length || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Lượt xem</p>
                                <p className="font-semibold text-gray-900">{report.metadata?.viewCount || 0}</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="border-t pt-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Nội dung báo cáo</h2>
                            <div className="prose prose-sm max-w-none bg-gray-50 p-6 rounded-lg">
                                <div dangerouslySetInnerHTML={{ __html: report.content || '<p className="text-gray-500">Chưa có nội dung</p>' }} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t pt-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Thao tác</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Reporter/Creator Actions */}
                                {permissions.canEdit && (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                            Chỉnh sửa
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={actionLoading.delete}
                                            className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            Xóa
                                        </button>
                                    </>
                                )}

                                {/* Publish Actions */}
                                {permissions.canPublish && report.status === 'draft' && (
                                    <button
                                        onClick={handlePublish}
                                        disabled={actionLoading.publish}
                                        className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all font-medium"
                                    >
                                        <Send className="w-5 h-5" />
                                        Xuất bản
                                    </button>
                                )}

                                {permissions.canUnpublish && report.status === 'published' && (
                                    <button
                                        onClick={handleUnpublish}
                                        disabled={actionLoading.unpublish}
                                        className="flex items-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-all font-medium"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                        Thu hồi xuất bản
                                    </button>
                                )}

                                {/* Manager Actions */}
                                {permissions.canApproveReport && (
                                    <button
                                        onClick={handleApproveReport}
                                        disabled={actionLoading.approveReport}
                                        className="flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all font-medium"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Phê duyệt báo cáo
                                    </button>
                                )}

                                {permissions.canRejectReport && (
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={actionLoading.rejectReport}
                                        className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Từ chối báo cáo
                                    </button>
                                )}

                                {/* Request Edit Permission */}
                                {permissions.canRequestEditPermission && (
                                    <button
                                        onClick={handleRequestEditPermission}
                                        disabled={actionLoading.requestEdit}
                                        className="flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all font-medium"
                                    >
                                        <Share2 className="w-5 h-5" />
                                        Yêu cầu quyền sửa
                                    </button>
                                )}
                            </div>

                            {/* Info message */}
                            {!permissions.canEdit && !permissions.canApproveReport && !permissions.canRequestEditPermission && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                    <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800">Bạn chỉ có quyền xem báo cáo này</p>
                                </div>
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
            </div>
        </Layout>
    )
}