import { useState } from 'react';
import { useRouter } from 'next/router';
import { ActionButton } from '../../ActionButtons';
import toast from 'react-hot-toast';
import { apiMethods } from '../../../services/api';
import { formatDate } from '../../../utils/helpers';
import {
    Eye, Edit2, Trash2, CheckCircle, XCircle, Send, RotateCcw, UserPlus,
    Loader2, Upload, ChevronDown, ChevronRight
} from 'lucide-react';

function ReportListTable({ reports, loading, pagination, handlePageChange, userRole, handleActionSuccess }) {
    const router = useRouter();
    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
    const [expandedRows, setExpandedRows] = useState({});

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800 border-gray-200',
            public: 'bg-blue-100 text-blue-800 border-blue-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
            published: 'bg-purple-100 text-purple-800 border-purple-200',
            submitted: 'bg-cyan-100 text-cyan-800 border-cyan-200',
            in_progress: 'bg-sky-100 text-sky-800 border-sky-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const getTypeText = (type) => {
        const labels = {
            'criteria': 'Tiêu chí',
            'standard': 'Tiêu chuẩn',
            'overall_tdg': 'Tổng hợp'
        };
        return labels[type] || type;
    }

    const handleAction = async (reportId, action) => {
        try {
            const report = reports.find(r => r._id === reportId);
            if (!report) return;

            switch (action) {
                case 'view':
                    router.push(`/reports/${reportId}`);
                    break;
                case 'edit':
                    router.push(`/reports/${reportId}/edit`);
                    break;
                case 'delete':
                    if (confirm('Bạn có chắc chắn muốn xóa?')) {
                        await apiMethods.reports.delete(reportId);
                        toast.success('Xóa thành công');
                        handleActionSuccess();
                    }
                    break;
                case 'approve':
                    if (confirm('Xác nhận phê duyệt báo cáo này?')) {
                        await apiMethods.reports.approve(reportId);
                        toast.success('Phê duyệt thành công');
                        handleActionSuccess();
                    }
                    break;
                case 'reject':
                    const reason = prompt('Nhập lý do từ chối:');
                    if (reason) {
                        await apiMethods.reports.reject(reportId, { feedback: reason });
                        toast.success('Từ chối thành công');
                        handleActionSuccess();
                    }
                    break;
                case 'makePublic':
                    if (confirm('Bạn có chắc chắn muốn công khai báo cáo này?')) {
                        await apiMethods.reports.makePublic(reportId);
                        toast.success('Công khai thành công');
                        handleActionSuccess();
                    }
                    break;
                case 'retractPublic':
                    if (confirm('Bạn có chắc chắn muốn thu hồi công khai báo cáo này?')) {
                        await apiMethods.reports.retractPublic(reportId);
                        toast.success('Thu hồi công khai thành công');
                        handleActionSuccess();
                    }
                    break;
                case 'submitToTask':
                    if (confirm('Bạn có chắc chắn muốn nộp báo cáo này cho Task?')) {
                        await apiMethods.reports.submitReportToTask(reportId, { taskId: report.taskId });
                        toast.success('Nộp Task thành công');
                        handleActionSuccess();
                    }
                    break;
                case 'assignReview':
                    router.push(`/reports/assign-reviewers?reportIds=${reportId}`);
                    break;
                case 'publish':
                    if (confirm('Xác nhận Phát hành báo cáo này?')) {
                        await apiMethods.reports.publish(reportId);
                        toast.success('Phát hành thành công');
                        handleActionSuccess();
                    }
                    break;
                case 'unpublish':
                    if (confirm('Xác nhận thu hồi Phát hành báo cáo này?')) {
                        await apiMethods.reports.unpublish(reportId);
                        toast.success('Thu hồi Phát hành thành công');
                        handleActionSuccess();
                    }
                    break;
                default:
                    toast.error(`Hành động ${action} chưa được hỗ trợ.`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Lỗi khi thực hiện ${action}`);
        }
    };

    const getReportActions = (report) => {
        const actions = [];
        const status = report.status;
        const isMyReport = String(report.createdBy?._id) === String(localStorage.getItem('userId'));
        const canEdit = report.canEdit;
        const hasEvaluations = report.evaluations && report.evaluations.length > 0;

        actions.push({ icon: Eye, variant: "view", title: "Xem chi tiết", action: 'view' });

        if (canEdit && ['draft', 'in_progress', 'rejected'].includes(status)) {
            actions.push({ icon: Edit2, variant: "edit", title: "Chỉnh sửa", action: 'edit' });
        }

        if (canEdit && ['draft', 'in_progress', 'rejected'].includes(status)) {
            actions.push({ icon: Send, variant: "blue", title: "Công khai", action: 'makePublic' });
        }
        if (canEdit && status === 'public') {
            actions.push({ icon: RotateCcw, variant: "blue", title: "Rút lại Công khai", action: 'retractPublic' });
        }

        if (isMyReport && report.taskId && ['draft', 'in_progress', 'rejected', 'public'].includes(status) && status !== 'submitted') {
            actions.push({ icon: Upload, variant: "blue", title: "Nộp Task", action: 'submitToTask' });
        }

        if (isManagerOrAdmin && ['submitted', 'public'].includes(status)) {
            actions.push({ icon: CheckCircle, variant: "success", title: "Phê duyệt", action: 'approve' });
            actions.push({ icon: XCircle, variant: "delete", title: "Từ chối", action: 'reject' });
        }

        if (isManagerOrAdmin && status === 'approved' && !hasEvaluations) {
            actions.push({ icon: UserPlus, variant: "blue", title: "Phân quyền Đánh giá", action: 'assignReview' });
        }

        if (isManagerOrAdmin && status === 'approved' && hasEvaluations) {
            actions.push({ icon: Send, variant: "success", title: "Phát hành", action: 'publish' });
        }

        if (isManagerOrAdmin && status === 'published') {
            actions.push({ icon: RotateCcw, variant: "warning", title: "Thu hồi Phát hành", action: 'unpublish' });
        }

        if (['draft', 'rejected'].includes(status) && (isMyReport || isManagerOrAdmin)) {
            actions.push({ icon: Trash2, variant: "delete", title: "Xóa", action: 'delete' });
        }

        return actions.slice(0, 5);
    };

    const toggleExpandRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };


    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-blue-50 to-sky-50">
                <tr>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[4%]">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 w-4 h-4" />
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[5%]">STT</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[8%]">Mã Task</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[9%]">Mã BC</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[18%]">Tiêu đề báo cáo</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[8%]">Loại BC</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[10%]">Tiêu chuẩn</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[10%]">Tiêu chí</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[8%]">Người tạo</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-blue-200 w-[20%]">Thao tác</th>
                </tr>
                </thead>
                <tbody className="bg-white">
                {loading ? (
                    <tr>
                        <td colSpan="10" className="px-6 py-16 text-center">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                        </td>
                    </tr>
                ) : reports.length === 0 ? (
                    <tr>
                        <td colSpan="10" className="px-6 py-16 text-center">
                            <p className="text-gray-500 font-medium">Không có báo cáo nào trong trạng thái này.</p>
                        </td>
                    </tr>
                ) : (
                    reports.map((report, index) => {
                        const actions = getReportActions(report);

                        // SỬA LỖI STT NaN: Đảm bảo pagination.current/limit là số (hoặc mặc định là 1/10)
                        const current = pagination.current || 1;
                        const limit = pagination.limit || 10;
                        const stt = (current - 1) * limit + index + 1;

                        const taskCode = report.taskId?.taskCode || '-';

                        return (
                            <tr key={report._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                <td className="px-4 py-3 text-center border-r border-gray-200">
                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 w-4 h-4" />
                                </td>
                                <td className="px-4 py-3 text-center border-r border-gray-200">
                                        <span className="text-sm font-semibold text-gray-700">
                                            {stt}
                                        </span>
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-200">
                                        <span className="text-xs font-medium text-gray-700">
                                            {taskCode}
                                        </span>
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-200">
                                         <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 whitespace-nowrap">
                                            {report.code}
                                        </span>
                                </td>
                                <td className="px-6 py-3 border-r border-gray-200">
                                    <div className="max-w-xs">
                                        <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={report.title}>
                                            {report.title}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center border-r border-gray-200">
                                        <span className="text-xs font-medium text-gray-700">
                                            {getTypeText(report.type)}
                                        </span>
                                </td>
                                {/* Cột Tiêu chuẩn */}
                                <td className="px-4 py-3 border-r border-gray-200 text-xs">
                                    {report.standardId && (
                                        <div>
                                            <button
                                                onClick={() => toggleExpandRow(report.standardId._id)}
                                                className="flex items-start space-x-1 hover:text-blue-600 transition-colors w-full text-left"
                                            >
                                                {expandedRows[report.standardId._id] ? (
                                                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-gray-500" />
                                                )}
                                                <div className="flex-1">
                                                    <span className="font-bold text-blue-700">{report.standardId?.code}</span>
                                                    {expandedRows[report.standardId._id] && report.standardId?.name && (
                                                        <p className="mt-1 text-gray-600 leading-relaxed truncate">
                                                            {report.standardId?.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </td>
                                {/* Cột Tiêu chí */}
                                <td className="px-4 py-3 border-r border-gray-200 text-xs">
                                    {report.criteriaId && (
                                        <div>
                                            <button
                                                onClick={() => toggleExpandRow(report.criteriaId._id)}
                                                className="flex items-start space-x-1 hover:text-blue-600 transition-colors w-full text-left"
                                            >
                                                {expandedRows[report.criteriaId._id] ? (
                                                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-gray-500" />
                                                )}
                                                <div className="flex-1">
                                                    <span className="font-bold text-blue-700">{report.criteriaId?.code}</span>
                                                    {expandedRows[report.criteriaId._id] && report.criteriaId?.name && (
                                                        <p className="mt-1 text-gray-600 leading-relaxed truncate">
                                                            {report.criteriaId?.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center border-r border-gray-200 text-xs font-medium text-gray-700">
                                    {report.createdBy?.fullName || 'N/A'}
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        {actions.map(btn => (
                                            <ActionButton
                                                key={btn.action}
                                                icon={btn.icon}
                                                variant={btn.variant}
                                                size="sm"
                                                onClick={() => handleAction(report._id, btn.action)}
                                                title={btn.title}
                                            />
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        );
                    })
                )}
                </tbody>
            </table>
            {pagination.pages > 1 && (
                <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-t-2 border-blue-200">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-700">
                            Hiển thị <strong className="text-blue-600">{(pagination.current - 1) * pagination.limit + 1}</strong> đến{' '}
                            <strong className="text-blue-600">{Math.min(pagination.current * pagination.limit, pagination.total)}</strong> trong tổng số{' '}
                            <strong className="text-blue-600">{pagination.total}</strong> kết quả
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.current - 1)}
                                disabled={!pagination.hasPrev}
                                className="px-4 py-2 text-sm border-2 border-blue-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
                            >
                                Trước
                            </button>
                            {[...Array(pagination.pages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`px-4 py-2 text-sm rounded-xl transition-all font-semibold ${
                                        pagination.current === i + 1
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                            : 'border-2 border-blue-200 hover:bg-white text-gray-700'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(pagination.current + 1)}
                                disabled={!pagination.hasNext}
                                className="px-4 py-2 text-sm border-2 border-blue-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportListTable;