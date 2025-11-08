import { useState, useEffect } from 'react'
import { X, Plus, FileText, Edit, Eye, AlertCircle, Loader2, Check, Lock, Clock, CheckCircle2, XCircle, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

const normalizeParam = (value) => {
    return (value === '' || value === undefined) ? null : value;
};

// Giả định userAuth được lấy từ context/localStorage
const useAuth = () => {
    const [user, setUser] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                // Giả định ID user hiện tại được lấy từ localStorage
                const userId = localStorage.getItem('userId') || 'temp-user-id-reporter';
                const userRole = localStorage.getItem('userRole') || 'reporter';
                // Đảm bảo ID là chuỗi để so sánh
                return { _id: String(userId), role: userRole, fullName: 'Current User' };
            } catch (error) {
                return { _id: 'temp-user-id-reporter', role: 'reporter', fullName: 'Current User' };
            }
        }
        return { _id: 'temp-user-id-reporter', role: 'reporter', fullName: 'Current User' };
    });
    return { user };
};


export default function ReportSelectionModal({
                                                 isOpen,
                                                 taskId,
                                                 reportType,
                                                 standardId,
                                                 criteriaId,
                                                 programId,
                                                 organizationId,
                                                 onCreateNew,
                                                 onSelectExisting,
                                                 onClose
                                             }) {
    const { user } = useAuth();
    const currentUserId = user?._id;

    const [loading, setLoading] = useState(false)
    const [reports, setReports] = useState([])
    const [canCreateNew, setCanCreateNew] = useState(false)
    const [task, setTask] = useState(null)
    const [showEditRequestsModal, setShowEditRequestsModal] = useState(false)
    const [selectedReportForRequests, setSelectedReportForRequests] = useState(null)
    const [editRequests, setEditRequests] = useState([])
    const [editRequestsLoading, setEditRequestsLoading] = useState(false)
    const [respondingTo, setRespondingTo] = useState({})
    const [rejectReason, setRejectReason] = useState('')
    const [showRejectInput, setShowRejectInput] = useState(null) // Stores requesterId to show reject input

    useEffect(() => {
        const normalizedTaskId = normalizeParam(taskId);
        const normalizedStandardId = normalizeParam(standardId);

        if (isOpen && currentUserId && (normalizedTaskId || (normalizedStandardId && reportType))) {
            fetchReports()
        }
    }, [isOpen, taskId, standardId, criteriaId, reportType, programId, organizationId, currentUserId])

    const fetchReports = async () => {
        if (!currentUserId) return;
        setLoading(true)

        try {
            let response;
            let reportsData = [];
            let canCreate = false;
            let currentTask = null;

            const params = {
                reportType: normalizeParam(reportType),
                standardId: normalizeParam(standardId),
                criteriaId: normalizeParam(criteriaId),
                programId: normalizeParam(programId),
                organizationId: normalizeParam(organizationId)
            };

            const normalizedTaskId = normalizeParam(taskId);

            if (normalizedTaskId) {
                response = await apiMethods.reports.getByTask({
                    taskId: normalizedTaskId,
                    ...params
                })
                reportsData = response.data.data.reports || []
                canCreate = response.data.data.canCreateNew;
                currentTask = response.data.data.task;
            } else if (params.standardId && params.reportType) {
                response = await apiMethods.reports.getByStandardCriteria(params)
                reportsData = response.data.data.reports || []
                canCreate = response.data.data.canWriteReport || false;
                currentTask = null;
            } else {
                return;
            }

            const newReports = reportsData.map(report => {
                // Các trường này đã được tính toán chính xác ở Controller (backend)
                const isCreatedByMe = report.isCreatedByMe;
                const isAssignedToMe = report.isAssignedToMe;
                const canEdit = report.canEdit;

                return {
                    ...report,
                    canEdit,
                    isCreatedByMe,
                    isAssignedToMe,
                    myEditRequestStatus: report.myEditRequestStatus || 'none',
                    pendingEditRequests: report.pendingEditRequests || []
                };
            });

            newReports.sort((a, b) => {
                if (a.status === 'draft' && b.status !== 'draft') return -1;
                if (a.status !== 'draft' && b.status === 'draft') return 1;
                if (a.isCreatedByMe && !b.isCreatedByMe) return -1;
                if (!a.isCreatedByMe && b.isCreatedByMe) return 1;
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });

            setReports(newReports)
            setCanCreateNew(canCreate)
            setTask(currentTask)

        } catch (error) {
            console.error('Fetch reports error:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi khi tải danh sách báo cáo'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateNew = () => {
        onCreateNew()
        onClose()
    }

    const handleSelectReport = (reportId) => {
        onSelectExisting(reportId)
        onClose()
    }

    const handleRequestEditPermission = async (reportId) => {
        if (!currentUserId) {
            toast.error('Vui lòng đăng nhập để thực hiện chức năng này.');
            return;
        }

        const report = reports.find(r => r._id === reportId);

        // 🚨 SỬA LỖI: Nếu canEdit là TRUE, KHÔNG gửi request. Chặn ngay tại Frontend.
        if (report.canEdit) {
            toast.error('Bạn đã có quyền chỉnh sửa báo cáo này. Vui lòng bấm "Tiếp tục sửa".');

            // Sau khi toast, buộc cập nhật UI để chuyển nút về "Tiếp tục sửa"
            setReports(prev => prev.map(r => r._id === reportId ? { ...r, canEdit: true } : r));

            return;
        }

        if (report && (report.myEditRequestStatus === 'pending' || report.myEditRequestStatus === 'requesting')) {
            toast.error('Bạn đã gửi yêu cầu và đang chờ duyệt.');
            return;
        }

        const initialStatus = report ? report.myEditRequestStatus : 'none';
        setReports(prev => prev.map(r => r._id === reportId ? { ...r, myEditRequestStatus: 'requesting' } : r));

        try {
            await apiMethods.reports.requestEditPermission(reportId)
            toast.success('Yêu cầu cấp quyền đã được gửi, đang chờ duyệt.')
            setReports(prev => prev.map(r => r._id === reportId ? { ...r, myEditRequestStatus: 'pending' } : r));
        } catch (error) {
            console.error('Request edit permission error:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi gửi yêu cầu'
            toast.error(errorMessage)
            setReports(prev => prev.map(r => r._id === reportId ? { ...r, myEditRequestStatus: initialStatus } : r));
        }
    }

    const handleOpenEditRequests = async (report) => {
        setSelectedReportForRequests(report)
        setEditRequestsLoading(true)

        try {
            const response = await apiMethods.reports.getEditRequests(report._id)
            setEditRequests(response.data.data || [])
            setShowEditRequestsModal(true)
        } catch (error) {
            console.error('Get edit requests error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách yêu cầu')
        } finally {
            setEditRequestsLoading(false)
        }
    }

    const handleApproveEditRequest = async (requesterId) => {
        try {
            setRespondingTo(prev => ({ ...prev, [requesterId]: 'approving' }))
            await apiMethods.reports.approveEditRequest(selectedReportForRequests._id, { requesterId })
            toast.success('Đã phê duyệt yêu cầu')
            setEditRequests(prev => prev.map(r =>
                r.requesterId._id === requesterId ? { ...r, status: 'approved' } : r
            ))
            fetchReports()
        } catch (error) {
            console.error('Approve edit request error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi phê duyệt yêu cầu')
        } finally {
            setRespondingTo(prev => ({ ...prev, [requesterId]: null }))
        }
    }

    const handleRejectEditRequest = async (requesterId) => {
        if (!rejectReason) {
            toast.error('Vui lòng nhập lý do từ chối.');
            return;
        }
        try {
            setRespondingTo(prev => ({ ...prev, [requesterId]: 'rejecting' }))
            await apiMethods.reports.rejectEditRequest(selectedReportForRequests._id, {
                requesterId,
                reason: rejectReason
            })
            toast.success('Đã từ chối yêu cầu')
            setEditRequests(prev => prev.map(r =>
                r.requesterId._id === requesterId ? { ...r, status: 'rejected', rejectReason: rejectReason } : r
            ))
            setRejectReason('')
            setShowRejectInput(null)
            fetchReports()
        } catch (error) {
            console.error('Reject edit request error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi từ chối yêu cầu')
        } finally {
            setRespondingTo(prev => ({ ...prev, [requesterId]: null }))
        }
    }

    const getReportTypeText = () => {
        const typeMap = {
            'criteria': 'Báo cáo tiêu chí',
            'standard': 'Báo cáo tiêu chuẩn',
            'overall_tdg': 'Báo cáo tổng hợp TĐG'
        }
        return typeMap[reportType] || reportType
    }

    const getStatusColor = (status) => {
        const colors = {
            'draft': 'bg-gray-100 text-gray-700 border-gray-300',
            'public': 'bg-sky-100 text-sky-700 border-sky-300',
            'approved': 'bg-green-100 text-green-700 border-green-300',
            'rejected': 'bg-red-100 text-red-700 border-red-300',
            'published': 'bg-blue-100 text-blue-700 border-blue-300'
        }
        return colors[status] || colors['draft']
    }

    const getStatusLabel = (status) => {
        const labels = {
            'draft': 'Bản nháp',
            'public': 'Công khai',
            'approved': 'Chấp thuận',
            'rejected': 'Từ chối',
            'published': 'Phát hành'
        }
        return labels[status] || status
    }

    const draftReports = reports.filter(r => r.status === 'draft')
    const finishedReports = reports.filter(r => r.status !== 'draft')

    const getActionForReport = (report) => {
        const myRequestStatus = report.myEditRequestStatus;
        const hasPendingRequest = report.pendingEditRequests?.length > 0;

        // 1. NGƯỜI CÓ QUYỀN CHỈNH SỬA (Tác giả, Được giao, Admin/Manager)
        if (report.canEdit) {
            return {
                label: 'Tiếp tục sửa',
                icon: Edit,
                onClick: () => handleSelectReport(report._id),
                disabled: false,
                className: 'bg-blue-600 hover:bg-blue-700',
                // Chỉ người tạo báo cáo mới có nút Phân quyền
                showGrantPermission: report.isCreatedByMe && hasPendingRequest,
                grantPermissionLabel: `Phân quyền (${report.pendingEditRequests.length})`
            };
        }

        // 2. NGƯỜI KHÔNG CÓ QUYỀN CHỈNH SỬA

        // 2a. Báo cáo đã hoàn thành/Phát hành -> chỉ xem
        if (report.status !== 'draft') {
            return {
                label: 'Xem',
                icon: Eye,
                onClick: () => handleSelectReport(report._id),
                disabled: false,
                className: 'bg-gray-500 hover:bg-gray-600'
            };
        }

        // 2b. Báo cáo nháp nhưng không có quyền

        // Đã gửi yêu cầu và đang chờ duyệt
        if (myRequestStatus === 'pending' || myRequestStatus === 'requesting') {
            return {
                label: myRequestStatus === 'pending' ? 'Đã yêu cầu' : 'Đang gửi...',
                icon: myRequestStatus === 'pending' ? Clock : Loader2,
                disabled: true,
                className: 'bg-amber-600 disabled:opacity-80'
            };
        }

        // Yêu cầu đã bị từ chối
        if (myRequestStatus === 'rejected') {
            return {
                label: 'Bị từ chối',
                icon: XCircle,
                disabled: true,
                className: 'bg-red-600 disabled:opacity-80'
            };
        }

        // Chưa có yêu cầu
        return {
            label: 'Yêu cầu sửa',
            icon: Lock,
            onClick: () => handleRequestEditPermission(report._id),
            disabled: false,
            className: 'bg-sky-600 hover:bg-sky-700'
        };
    };

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6 text-white flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Báo cáo từ {taskId ? 'nhiệm vụ' : 'yêu cầu'}</h2>
                            <p className="text-blue-100 text-sm mt-1">{getReportTypeText()}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-600">Đang tải báo cáo...</p>
                                </div>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có báo cáo nào</h3>
                                <p className="text-gray-500 mb-6">Tạo báo cáo mới cho yêu cầu này</p>
                                {canCreateNew && (
                                    <button
                                        onClick={handleCreateNew}
                                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Tạo báo cáo mới
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Draft Reports */}
                                {draftReports.length > 0 && (
                                    <div>
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-amber-900">
                                                        Báo cáo nháp - Có thể tiếp tục sửa, yêu cầu quyền sửa, hoặc phân quyền
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {draftReports.map(report => {
                                                const action = getActionForReport(report);
                                                return (
                                                    <div
                                                        key={report._id}
                                                        className="border border-amber-200 bg-amber-50 rounded-xl p-4"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                                        {report.title}
                                                                    </h3>
                                                                    <span className={`text-xs px-2 py-1 rounded-full border font-medium whitespace-nowrap ${getStatusColor(report.status)}`}>
                                                                        {getStatusLabel(report.status)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500">
                                                                    Mã: <span className="font-mono font-semibold">{report.code}</span>
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Tác giả: {report.createdBy?.fullName || 'N/A'} {report.isCreatedByMe && <span className='font-bold text-blue-600'>(Bạn)</span>}
                                                                </p>
                                                                {report.assignedReporters && report.assignedReporters.length > 0 && (
                                                                    <p className="text-xs text-gray-500">
                                                                        Được giao: {report.assignedReporters.map(r => r.fullName).join(', ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="ml-4 flex gap-2 flex-wrap justify-end">
                                                                {/* Nút Phân quyền / Duyệt yêu cầu */}
                                                                {action.showGrantPermission && (
                                                                    <button
                                                                        onClick={() => handleOpenEditRequests(report)}
                                                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap"
                                                                    >
                                                                        <Users className="w-4 h-4" />
                                                                        {action.grantPermissionLabel}
                                                                    </button>
                                                                )}
                                                                {/* Nút chính */}
                                                                <button
                                                                    onClick={action.onClick}
                                                                    disabled={action.disabled}
                                                                    className={`px-4 py-2 ${action.className} text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap`}
                                                                >
                                                                    {action.icon && <action.icon className={`w-4 h-4 ${action.label === 'Đang gửi...' ? 'animate-spin' : ''}`} />}
                                                                    {action.label}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Finished Reports */}
                                {finishedReports.length > 0 && (
                                    <div>
                                        {draftReports.length > 0 && <div className="border-t border-gray-200 my-6"></div>}
                                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-sky-900">
                                                        Báo cáo đã hoàn thành
                                                    </p>
                                                    <p className="text-xs text-sky-700 mt-1">
                                                        Xem hoặc tạo báo cáo mới
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {finishedReports.map(report => (
                                                <div
                                                    key={report._id}
                                                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-all"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                                    {report.title}
                                                                </h3>
                                                                <span className={`text-xs px-2 py-1 rounded-full border font-medium whitespace-nowrap ${getStatusColor(report.status)}`}>
                                                                    {getStatusLabel(report.status)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                Mã: <span className="font-mono font-semibold">{report.code}</span>
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Tác giả: {report.createdBy?.fullName}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleSelectReport(report._id)}
                                                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Xem
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 bg-gray-50 px-8 py-6 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            {reports.length > 0 ? `${reports.length} báo cáo` : 'Tạo báo cáo mới'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium"
                            >
                                Hủy
                            </button>
                            {canCreateNew && (
                                <button
                                    onClick={handleCreateNew}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tạo mới
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Requests Modal */}
            {showEditRequestsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                Yêu cầu cấp quyền sửa báo cáo: {selectedReportForRequests?.title}
                            </h3>
                            <button
                                onClick={() => setShowEditRequestsModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {editRequestsLoading ? (
                            <div className="py-8 text-center">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                                <p className="text-gray-600">Đang tải danh sách yêu cầu...</p>
                            </div>
                        ) : editRequests.filter(r => r.status === 'pending').length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-gray-600">Không có yêu cầu nào chưa xử lý</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {editRequests.filter(r => r.status === 'pending').map(request => (
                                    <div
                                        key={request.requesterId._id}
                                        className="p-4 border border-blue-200 rounded-lg bg-blue-50 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">
                                                    {request.requesterId.fullName}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {request.requesterId.email}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Yêu cầu lúc: {new Date(request.requestedAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleApproveEditRequest(request.requesterId._id)}
                                                    disabled={respondingTo[request.requesterId._id] === 'approving'}
                                                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all font-medium flex items-center gap-2"
                                                >
                                                    {respondingTo[request.requesterId._id] === 'approving' ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                    Duyệt
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowRejectInput(request.requesterId._id);
                                                        setRejectReason(''); // Reset reason for new rejection
                                                    }}
                                                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-all font-medium flex items-center gap-2"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Từ chối
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reject reason input */}
                                        {showRejectInput === request.requesterId._id && (
                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <textarea
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    placeholder="Nhập lý do từ chối (bắt buộc)"
                                                    className="w-full p-2 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                                                    rows="2"
                                                ></textarea>
                                                <button
                                                    onClick={() => handleRejectEditRequest(request.requesterId._id)}
                                                    disabled={!rejectReason || respondingTo[request.requesterId._id] === 'rejecting'}
                                                    className="mt-2 px-3 py-1.5 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 disabled:opacity-50 transition-all font-medium flex items-center gap-1.5"
                                                >
                                                    {respondingTo[request.requesterId._id] === 'rejecting' ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4" />
                                                    )}
                                                    Xác nhận Từ chối
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Approved/Rejected Requests History */}
                        {(editRequests.filter(r => r.status !== 'pending').length > 0) && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Lịch sử yêu cầu</h4>
                                <div className="space-y-2">
                                    {editRequests.filter(r => r.status === 'approved').map(request => (
                                        <div
                                            key={request.requesterId._id + 'a'}
                                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {request.requesterId.fullName} - <span className="text-green-600 font-bold">Đã Phê duyệt</span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Phản hồi lúc: {new Date(request.respondedAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            <Check className="w-5 h-5 text-green-600" />
                                        </div>
                                    ))}
                                    {editRequests.filter(r => r.status === 'rejected').map(request => (
                                        <div
                                            key={request.requesterId._id + 'r'}
                                            className="flex items-start justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                                        >
                                            <div className='flex-1'>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {request.requesterId.fullName} - <span className="text-red-600 font-bold">Đã Từ chối</span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Phản hồi lúc: {new Date(request.respondedAt).toLocaleString('vi-VN')}
                                                </p>
                                                {request.rejectReason && (
                                                    <p className="text-xs text-red-700 mt-1 italic">
                                                        Lý do: {request.rejectReason}
                                                    </p>
                                                )}
                                            </div>
                                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-4" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        <div className="mt-6 pt-6 border-t flex justify-end">
                            <button
                                onClick={() => setShowEditRequestsModal(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}