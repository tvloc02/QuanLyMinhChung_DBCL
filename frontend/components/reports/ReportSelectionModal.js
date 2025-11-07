import { useState, useEffect } from 'react'
import { X, Plus, FileText, Edit, Eye, AlertCircle, Loader2, Check, Send, Lock, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

const normalizeParam = (value) => {
    return (value === '' || value === undefined) ? null : value;
};

// Giả định hàm useAuth để lấy thông tin người dùng hiện tại
const useAuth = () => {
    // THAY THẾ bằng logic lấy user ID thực tế của bạn
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
    // Lấy thông tin user
    const { user } = useAuth();
    const currentUserId = user?._id;

    const [loading, setLoading] = useState(false)
    const [reports, setReports] = useState([])
    const [canCreateNew, setCanCreateNew] = useState(false)
    const [task, setTask] = useState(null)
    const [requestingEdit, setRequestingEdit] = useState({})

    // Đã thay đổi thành Map<reportId, status> để quản lý trạng thái pending/requesting của từng báo cáo
    const [requestedReports, setRequestedReports] = useState(new Map());


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
        setRequestedReports(new Map()); // Reset trạng thái yêu cầu

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
                // Luồng 1: Từ Task (Gọi API getByTask)
                response = await apiMethods.reports.getByTask({
                    taskId: normalizedTaskId,
                    ...params
                })
                reportsData = response.data.data.reports || []
                canCreate = response.data.data.canCreateNew;
                currentTask = response.data.data.task;

            } else if (params.standardId && params.reportType) {
                // Luồng 2: Từ Cây Minh chứng (Chủ động gọi API mới)
                response = await apiMethods.reports.getReportsByStandardCriteria(params)
                reportsData = response.data.data.reports || []
                canCreate = response.data.data.canWriteReport || false;
                currentTask = null;
            } else {
                return;
            }

            const newReports = reportsData.map(report => {
                const assignedReporters = report.assignedReporters || [];

                // SỬA LỖI: So sánh qua _id thay vì fullName = 'Bạn'
                const isCreatedByMe = report.createdBy?._id === currentUserId;
                const isAssignedToMe = assignedReporters.some(r => r._id === currentUserId);

                // Logic canEdit: Admin/Manager hoặc người được giao/người tạo
                let canEdit = isCreatedByMe || isAssignedToMe || user.role === 'admin' || user.role === 'manager';

                // Kiểm tra trạng thái yêu cầu đang chờ duyệt từ Backend (isPendingMyRequest)
                if (report.isPendingMyRequest) {
                    setRequestedReports(prev => new Map(prev).set(report._id, 'pending'));
                }

                return {
                    ...report,
                    canEdit,
                    isCreatedByMe,
                    isAssignedToMe
                };
            });

            // Sắp xếp: Ưu tiên nháp của tôi, sau đó là nháp (của người khác), sau đó là công khai/phát hành
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

    // Cập nhật logic yêu cầu cấp quyền để sử dụng trạng thái Map
    const handleRequestEditPermission = async (reportId) => {
        if (!currentUserId) {
            toast.error('Vui lòng đăng nhập để thực hiện chức năng này.');
            return;
        }

        setRequestedReports(prev => new Map(prev).set(reportId, 'requesting'));
        setRequestingEdit(prev => ({ ...prev, [reportId]: true }))

        try {
            const response = await apiMethods.reports.requestEditPermission(reportId)

            toast.success(response.data.message || 'Yêu cầu cấp quyền đã được gửi, đang chờ duyệt.')

            // Cập nhật trạng thái thành 'pending' (chờ duyệt)
            setRequestedReports(prev => new Map(prev).set(reportId, 'pending'));

        } catch (error) {
            console.error('Request edit permission error:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi gửi yêu cầu'
            toast.error(errorMessage)

            // Đặt lại trạng thái nếu có lỗi (trừ khi lỗi báo đã yêu cầu, nhưng Backend Controller đã xử lý)
            setRequestedReports(prev => new Map(prev).set(reportId, 'none'));

        } finally {
            setRequestingEdit(prev => ({ ...prev, [reportId]: false }))
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

    // Phân loại báo cáo
    const draftReports = reports.filter(r => r.status === 'draft')
    const finishedReports = reports.filter(r => r.status !== 'draft')

    const getActionForReport = (report) => {
        const requestStatus = requestedReports.get(report._id) || (report.isPendingMyRequest ? 'pending' : 'none');

        if (report.canEdit) {
            return {
                label: 'Tiếp tục sửa',
                icon: Edit,
                onClick: () => handleSelectReport(report._id),
                disabled: false,
                className: 'bg-indigo-600 hover:bg-indigo-700'
            };
        }

        if (report.status !== 'draft' && !report.canEdit) {
            return {
                label: 'Xem',
                icon: Eye,
                onClick: () => handleSelectReport(report._id),
                disabled: false,
                className: 'bg-gray-500 hover:bg-gray-600'
            };
        }

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

        // Báo cáo nháp của người khác, tôi không có quyền, và chưa gửi yêu cầu
        return {
            label: 'Yêu cầu sửa',
            icon: Lock,
            onClick: () => handleRequestEditPermission(report._id),
            disabled: requestingEdit[report._id],
            className: 'bg-blue-600 hover:bg-blue-700'
        };
    };

    if (!isOpen) return null

    return (
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
                            <p className="text-gray-500 mb-6">
                                Tạo báo cáo mới cho yêu cầu này
                            </p>
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
                            {/* Báo cáo nháp */}
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
                                                                <h3 className="text-sm font-semibold text-gray-900 truncate" title={report.title}>
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
                                                        <div className="ml-4 flex gap-2">
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

                            {/* Báo cáo đã công khai */}
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
    )
}