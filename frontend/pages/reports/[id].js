// fileName: [id].js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    Edit2, Trash2, Download, CheckCircle, XCircle, Share2,
    ArrowLeft, Eye, Send, RotateCcw, FileText, Loader2, Lock, User,
    Users, Calendar, Clock, FilePlus, MessageSquare, AlertCircle
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

// Component Modal cho danh sách Người được giao
const AssignedReportersModal = ({ isOpen, reporters, onClose }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-600" />
                        Danh sách Người được giao
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="h-6 w-6" />
                    </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {reporters?.length > 0 ? (
                        reporters.map(r => (
                            <div key={r._id} className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <User className="w-5 h-5 text-blue-600 mr-3" />
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

// Component Modal cho Từ chối
const RejectModal = ({ isOpen, reason, setReason, onConfirm, onCancel, loading }) => {
    if (!isOpen) return null
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Từ chối báo cáo</h3>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!reason.trim() || loading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang xử lý
                            </>
                        ) : (
                            'Xác nhận từ chối'
                        )}
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

        // Sử dụng canEdit từ model (Admin/Manager hoặc người được giao/người tạo)
        const canEdit = report.canEdit(user._id, user.role)

        // Reporter chỉ được Xóa khi là người tạo VÀ trạng thái draft/in_progress/rejected
        const canDelete = (isCreator || isAdmin) && ['draft', 'in_progress', 'rejected'].includes(report.status)

        const canMakePublic = canEdit && ['draft', 'in_progress', 'rejected'].includes(report.status)
        const canRetractPublic = canEdit && report.status === 'public'

        const canPublish = (isManager || isAdmin) && report.status === 'approved'
        const canUnpublish = (isManager || isAdmin) && report.status === 'published'

        // Quyền duyệt
        const canApproveOrRejectReport = (isManager || isAdmin) && ['submitted', 'public'].includes(report.status)

        // Cần có Task ID để điều hướng phân công đánh giá
        const canNavigateToAssignment = (isManager || isAdmin) && report.status === 'approved'

        const canRequestEditPermission = !canEdit && report.status !== 'approved' && report.status !== 'published' && !report.editRequests?.some(r => String(r.requesterId) === String(user._id) && r.status === 'pending');

        return {
            canView: true,
            canEdit: canEdit,
            canDelete: canDelete,
            canMakePublic: canMakePublic,
            canRetractPublic: canRetractPublic,
            canPublish: canPublish,
            canUnpublish: canUnpublish,
            canApproveReport: canApproveOrRejectReport,
            canRejectReport: canApproveOrRejectReport,
            canRequestEditPermission: canRequestEditPermission,
            canNavigateToAssignment: canNavigateToAssignment,
            isCreator,
            isAssignee,
            isManager,
            isAdmin
        }
    }

    const permissions = getPermissions()

    const handleEdit = () => {
        // Chuyển hướng đến trang edit/tạo mới với ID báo cáo hiện tại
        router.push(`/reports/${id}/edit`)
    }

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa báo cáo này? Thao tác này KHÔNG thể hoàn tác.')) return

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
        if (!confirm('Bạn có chắc chắn muốn công khai/nộp báo cáo này?')) return

        try {
            setActionLoading(prev => ({ ...prev, makePublic: true }))
            // API makePublic sẽ xử lý logic chuyển sang 'submitted' nếu có TaskID, hoặc 'public' nếu không.
            await apiMethods.reports.makePublic(id)
            toast.success('Công khai/Nộp báo cáo thành công')
            fetchReport()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi công khai/nộp báo cáo')
        } finally {
            setActionLoading(prev => ({ ...prev, makePublic: false }))
        }
    }

    const handleRetractPublic = async () => {
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
        if (!confirm('Bạn có chắc chắn muốn PHÁT HÀNH (PUBLISH) báo cáo này?')) return

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
        if (!confirm('Bạn có chắc chắn muốn THU HỒI PHÁT HÀNH báo cáo này?')) return

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
        if (!confirm('Bạn có chắc chắn muốn PHÊ DUYỆT báo cáo này?')) return

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

    const handleRejectReportConfirm = async () => {
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
        if (!confirm('Bạn có muốn gửi yêu cầu cấp quyền chỉnh sửa tới người tạo báo cáo?')) return

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

    const handleDownloadReport = async (format = 'html') => {
        try {
            setActionLoading(prev => ({ ...prev, download: true }))
            const response = await apiMethods.reports.download(id, format)

            // Lấy tên file từ header (nếu có) hoặc mặc định
            const contentDisposition = response.headers['content-disposition'];
            let filename = `${report.code}-report.${format}`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;"\r\n]*)['"]?/i);
                if (filenameMatch && filenameMatch[1]) {
                    filename = decodeURIComponent(filenameMatch[1].replace(/\"/g, ''));
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success(`Tải xuống thành công định dạng ${format.toUpperCase()}`)
        } catch (error) {
            console.error('Download error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải xuống')
        } finally {
            setActionLoading(prev => ({ ...prev, download: false }))
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800 border-gray-300',
            in_progress: 'bg-sky-100 text-sky-800 border-sky-300',
            submitted: 'bg-cyan-100 text-cyan-800 border-cyan-300',
            public: 'bg-blue-100 text-blue-800 border-blue-300',
            approved: 'bg-green-100 text-green-800 border-green-300',
            rejected: 'bg-red-100 text-red-800 border-red-300',
            published: 'bg-purple-100 text-purple-800 border-purple-300',
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            in_progress: 'Đang thực hiện',
            submitted: 'Đã nộp chờ duyệt',
            public: 'Công khai',
            approved: 'Chấp thuận',
            rejected: 'Từ chối',
            published: 'Phát hành',
        }
        return labels[status] || status
    }

    // Kiểm tra xem người dùng có pending request nào không
    const pendingRequest = report.editRequests?.find(r => String(r.requesterId) === String(user._id) && r.status === 'pending');

    return (
        <Layout title={`Chi tiết báo cáo: ${report.code}`}>
            <div className="space-y-6">

                {/* Header & Status */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold mb-1">{report.title}</h1>
                            <div className="flex items-center space-x-3">
                                <p className="text-blue-100">Mã: <span className="font-mono font-semibold">{report.code}</span></p>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border border-white border-opacity-50 ${getStatusColor(report.status)} bg-opacity-90`}>
                                    {getStatusLabel(report.status)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-xl hover:bg-gray-200 transition-all text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </button>
                    </div>
                </div>

                {/* Alert cho Rejected hoặc Pending Request */}
                {report.status === 'rejected' && report.rejectionFeedback && (
                    <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-800">Báo cáo bị Từ chối:</p>
                            <p className="text-sm text-red-700 italic">{report.rejectionFeedback}</p>
                            <p className="text-xs text-red-500 mt-1">
                                (Bị từ chối bởi: {report.rejectedBy?.fullName} - {formatDate(report.rejectedAt)})
                            </p>
                        </div>
                    </div>
                )}

                {pendingRequest && (
                    <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-orange-800">Yêu cầu chỉnh sửa đang chờ:</p>
                            <p className="text-sm text-orange-700 italic">Bạn đã gửi yêu cầu chỉnh sửa báo cáo này. Vui lòng chờ người tạo duyệt.</p>
                        </div>
                    </div>
                )}


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Content & Metadata (Lớp 1) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <div className="pb-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600"/> Nội dung & Ngữ cảnh
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full font-medium">
                                        {report.typeText}
                                    </span>
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
                                    {report.contentMethod === 'file_upload' && (
                                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                                            File đính kèm
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    {report.contentMethod === 'file_upload' ? 'Thông tin file đính kèm' : 'Nội dung báo cáo'}
                                </h3>
                                {report.contentMethod === 'file_upload' ? (
                                    <div className="bg-gray-100 p-6 rounded-xl border border-gray-200">
                                        <p className="text-gray-700 font-medium flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                            {report.attachedFile?.originalName || 'Không tìm thấy file'}
                                        </p>
                                        <p className="text-sm text-gray-500 ml-7">
                                            Kích thước: {(report.attachedFile?.size / 1024 / 1024).toFixed(2) || 0} MB
                                        </p>
                                        <button
                                            onClick={() => handleDownloadReport('file')}
                                            disabled={actionLoading.download || !report.attachedFile}
                                            className="mt-4 flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium disabled:opacity-50"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Tải file gốc
                                        </button>
                                    </div>
                                ) : (
                                    <div className="prose prose-lg max-w-none bg-gray-50 p-6 rounded-xl border border-gray-200 min-h-[300px]">
                                        <div dangerouslySetInnerHTML={{ __html: report.content || '<p class="text-gray-500 italic">Báo cáo này chưa có nội dung chi tiết.</p>' }} />
                                    </div>
                                )}
                            </div>

                            {(report.summary || report.keywords?.length > 0) && (
                                <div className="pt-6 mt-6 border-t border-gray-200 space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-800">Tóm tắt & Từ khóa</h3>
                                    {report.summary && (
                                        <p className="text-gray-700 italic border-l-4 border-gray-400 pl-4 py-2 mb-3">
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
                    </div>

                    {/* Sidebar: Actions & Info */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Action Panel */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
                            <h3 className="text-xl font-bold text-gray-900 border-b pb-3 mb-3">Thao tác Nhanh</h3>

                            {/* CÁC THAO TÁC CƠ BẢN */}
                            <div className="grid grid-cols-2 gap-3">
                                {permissions.canEdit ? (
                                    <button
                                        onClick={handleEdit}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Chỉnh sửa
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRequestEditPermission}
                                        disabled={!permissions.canRequestEditPermission || actionLoading.requestEdit}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all font-medium text-sm"
                                        title={pendingRequest ? 'Đã gửi yêu cầu' : 'Yêu cầu quyền chỉnh sửa'}
                                    >
                                        <Share2 className="w-4 h-4" />
                                        {pendingRequest ? 'Đã yêu cầu' : 'Yêu cầu sửa'}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDownloadReport('html')}
                                    disabled={actionLoading.download}
                                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-sm text-gray-800 disabled:opacity-50"
                                >
                                    <Download className="w-4 h-4" />
                                    Tải xuống
                                </button>
                            </div>

                            <hr className="border-gray-200" />

                            {/* CÁC THAO TÁC CỦA REPORTER/WRITER */}
                            {permissions.canMakePublic && (
                                <button
                                    onClick={handleMakePublic}
                                    disabled={actionLoading.makePublic}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-all font-medium text-sm"
                                >
                                    <Send className="w-4 h-4" />
                                    Nộp/Công khai
                                </button>
                            )}

                            {permissions.canRetractPublic && (
                                <button
                                    onClick={handleRetractPublic}
                                    disabled={actionLoading.retractPublic}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-all font-medium text-sm"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Thu hồi công khai
                                </button>
                            )}

                            {permissions.canDelete && (
                                <button
                                    onClick={handleDelete}
                                    disabled={actionLoading.delete}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium text-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Xóa báo cáo
                                </button>
                            )}

                            {/* CÁC THAO TÁC CỦA MANAGER/ADMIN */}
                            {(permissions.canApproveReport || permissions.canPublish || permissions.canUnpublish) && (
                                <hr className="border-gray-200" />
                            )}

                            {permissions.canApproveReport && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleApproveReport}
                                        disabled={actionLoading.approveReport}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all font-medium text-sm"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Phê duyệt
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={actionLoading.rejectReport}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium text-sm"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Từ chối
                                    </button>
                                </div>
                            )}

                            {permissions.canPublish && (
                                <button
                                    onClick={handlePublish}
                                    disabled={actionLoading.publish}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all font-medium text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Phát hành
                                </button>
                            )}

                            {permissions.canUnpublish && (
                                <button
                                    onClick={handleUnpublish}
                                    disabled={actionLoading.unpublish}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-all font-medium text-sm"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Thu hồi Phát hành
                                </button>
                            )}

                            {permissions.canNavigateToAssignment && (
                                <button
                                    onClick={handleNavigateToReviewAssignment}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-medium text-sm"
                                >
                                    <FilePlus className="w-4 h-4" />
                                    Phân công đánh giá
                                </button>
                            )}

                        </div>

                        {/* General Info */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-3">Thông tin Chung</h3>
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
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Xem tất cả ({report.assignedReporters?.length || 0})
                                        </button>
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
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Eye className="w-4 h-4" /> Lượt xem:
                                    </p>
                                    <p className="text-sm font-semibold text-gray-800">{report.metadata?.viewCount || 0}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <RejectModal
                    isOpen={showRejectModal}
                    reason={rejectReason}
                    setReason={setRejectReason}
                    onConfirm={handleRejectReportConfirm}
                    onCancel={() => { setShowRejectModal(false); setRejectReason('') }}
                    loading={actionLoading.rejectReport}
                />

                <AssignedReportersModal
                    isOpen={showReportersModal}
                    reporters={report?.assignedReporters}
                    onClose={() => setShowReportersModal(false)}
                />

            </div>
        </Layout>
    )
}