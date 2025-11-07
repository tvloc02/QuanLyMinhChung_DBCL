import { useState, useEffect } from 'react'
import { X, Plus, FileText, Edit, Eye, AlertCircle, Loader2, Check, Send, Lock, Clock, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

const normalizeParam = (value) => {
    return (value === '' || value === undefined) ? null : value;
};

const useAuth = () => {
    const [user, setUser] = useState({ _id: 'temp-user-id-reporter', role: 'reporter', fullName: 'User A' });
    useEffect(() => {
    }, []);
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
    const [requestedReports, setRequestedReports] = useState(new Map())
    const [showEditRequestsModal, setShowEditRequestsModal] = useState(false)
    const [selectedReportForRequests, setSelectedReportForRequests] = useState(null)
    const [editRequests, setEditRequests] = useState([])
    const [editRequestsLoading, setEditRequestsLoading] = useState(false)
    const [respondingTo, setRespondingTo] = useState({})

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
        setRequestedReports(new Map());

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
                const assignedReporters = report.assignedReporters || [];
                const isCreatedByMe = report.createdBy?._id === currentUserId;
                const isAssignedToMe = assignedReporters.some(r => r._id === currentUserId);
                let canEdit = isCreatedByMe || isAssignedToMe || user.role === 'admin' || user.role === 'manager';

                if (report.isPendingMyRequest) {
                    setRequestedReports(prev => new Map(prev).set(report._id, 'pending'));
                }

                return {
                    ...report,
                    canEdit,
                    isCreatedByMe,
                    isAssignedToMe,
                    pendingEditRequests: report.editRequests?.filter(r => r.status === 'pending') || []
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

        setRequestedReports(prev => new Map(prev).set(reportId, 'requesting'));

        try {
            await apiMethods.reports.requestEditPermission(reportId)
            toast.success('Yêu cầu cấp quyền đã được gửi, đang chờ duyệt.')
            setRequestedReports(prev => new Map(prev).set(reportId, 'pending'));
            fetchReports();
        } catch (error) {
            console.error('Request edit permission error:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi gửi yêu cầu'
            toast.error(errorMessage)
            setRequestedReports(prev => new Map(prev).set(reportId, 'none'));
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
            toast.error('Lỗi khi tải danh sách yêu cầu')
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
        try {
            setRespondingTo(prev => ({ ...prev, [requesterId]: 'rejecting' }))
            await apiMethods.reports.rejectEditRequest(selectedReportForRequests._id, {
                requesterId,
                reason: 'Yêu cầu bị từ chối'
            })
            toast.success('Đã từ chối yêu cầu')
            setEditRequests(prev => prev.map(r =>
                r.requesterId._id === requesterId ? { ...r, status: 'rejected' } : r
            ))
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
            'public': 'bg-blue-100 text-blue-700 border-blue-300',
            'approved': 'bg-green-100 text-green-700 border-green-300',
            'rejected': 'bg-red-100 text-red-700 border-red-300',
            'published': 'bg-purple-100 text-purple-700 border-purple-300'
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
        // Nếu là người viết → luôn có nút sửa
        if (report.isCreatedByMe) {
            return {
                label: 'Tiếp tục sửa',
                icon: Edit,
                onClick: () => handleSelectReport(report._id),
                disabled: false,
                className: 'bg-indigo-600 hover:bg-indigo-700'
            };
        }

        // Nếu đã được giao → nút sửa
        if (report.isAssignedToMe) {
            return {
                label: 'Tiếp tục sửa',
                icon: Edit,
                onClick: () => handleSelectReport(report._id),
                disabled: false,
                className: 'bg-indigo-600 hover:bg-indigo-700'
            };
        }

        // Nếu có quyền edit nhưng không phải trường hợp trên
        if (report.canEdit) {
            return {
                label: 'Tiếp tục sửa',
                icon: Edit,
                onClick: () => handleSelectReport(report._id),
                disabled: false,
                className: 'bg-indigo-600 hover:bg-indigo-700'
            };
        }

        // Nếu không có quyền sửa và báo cáo không phải nháp → chỉ xem
        if (report.status !== 'draft' && !report.canEdit) {
            return {
                label: 'Xem',
                icon: Eye,
                onClick: () => handleSelectReport(report._id),
                disabled: false,
                className: 'bg-gray-500 hover:bg-gray-600'
            };
        }

        // Kiểm tra trạng thái yêu cầu
        const requestStatus = requestedReports.get(report._id) || (report.isPendingMyRequest ? 'pending' : 'none');

        if (requestStatus === 'pending') {
            return {
                label: 'Đã yêu cầu',
                icon: Clock,
                disabled: true,
                className: 'bg-yellow-600 disabled:opacity-80'
            };
        }

        if (requestStatus === 'requesting') {
            return {
                label: 'Đang gửi...',
                icon: Loader2,
                disabled: true,
                className: 'bg-blue-600 disabled:opacity-80'
            };
        }

        // Cho phép yêu cầu sửa cho báo cáo nháp của người khác
        return {
            label: 'Yêu cầu sửa',
            icon: Lock,
            onClick: () => handleRequestEditPermission(report._id),
            disabled: requestedReports.get(report._id) === 'requesting',
            className: 'bg-blue-600 hover:bg-blue-700'
        };
    };

    if (!isOpen) return null

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Báo cáo từ {taskId ? 'nhiệm vụ' : 'yêu cầu'}</h2>
                            <p className="text-indigo-100 text-sm mt-1">{getReportTypeText()}</p>
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
                                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-600">Đang tải báo cáo...</p>
                                </div>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có báo cáo nào</h3>
                                <p className="text-gray-500 mb-6">Tạo báo cáo mới cho yêu cầu này</p>
                                {canCreateNew && (
                                    <button
                                        onClick={handleCreateNew}
                                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
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
                                                        Báo cáo nháp - Có thể tiếp tục sửa hoặc yêu cầu quyền sửa
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
                                                                    Tác giả: {report.createdBy?.fullName || 'N/A'} {report.isCreatedByMe && <span className='font-bold text-indigo-600'>(Tôi)</span>}
                                                                </p>
                                                                {report.assignedReporters && report.assignedReporters.length > 0 && (
                                                                    <p className="text-xs text-gray-500">
                                                                        Được giao: {report.assignedReporters.map(r => r.fullName).join(', ')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="ml-4 flex gap-2 flex-wrap justify-end">
                                                                {/* Nếu là người viết + có yêu cầu chờ → nút duyệt */}
                                                                {report.isCreatedByMe && report.pendingEditRequests?.length > 0 && (
                                                                    <button
                                                                        onClick={() => handleOpenEditRequests(report)}
                                                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                        Duyệt yêu cầu ({report.pendingEditRequests.length})
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
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-blue-900">
                                                        Báo cáo đã hoàn thành
                                                    </p>
                                                    <p className="text-xs text-blue-700 mt-1">
                                                        Xem hoặc tạo báo cáo mới
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {finishedReports.map(report => (
                                                <div
                                                    key={report._id}
                                                    className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
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
                                                            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap"
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
                                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2"
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
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                Yêu cầu cấp quyền sửa báo cáo
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
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
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
                                        className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                                    >
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
                                        <div className="flex gap-2">
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
                                                onClick={() => handleRejectEditRequest(request.requesterId._id)}
                                                disabled={respondingTo[request.requesterId._id] === 'rejecting'}
                                                className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-medium flex items-center gap-2"
                                            >
                                                {respondingTo[request.requesterId._id] === 'rejecting' ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <XCircle className="w-4 h-4" />
                                                )}
                                                Từ chối
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Approved Requests */}
                        {editRequests.filter(r => r.status === 'approved').length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Đã phê duyệt</h4>
                                <div className="space-y-2">
                                    {editRequests.filter(r => r.status === 'approved').map(request => (
                                        <div
                                            key={request.requesterId._id}
                                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {request.requesterId.fullName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Đã phê duyệt vào {new Date(request.respondedAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            <Check className="w-5 h-5 text-green-600" />
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