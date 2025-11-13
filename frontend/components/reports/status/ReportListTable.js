import { useState } from 'react';
import { useRouter } from 'next/router';
import { ActionButton } from '../../ActionButtons';
import toast from 'react-hot-toast';
import { apiMethods } from '../../../services/api';
import { formatDate } from '../../../utils/helpers';
import {
    Eye, Edit2, Trash2, CheckCircle, XCircle, Send, RotateCcw, UserPlus,
    Loader2, ChevronDown, ChevronRight, MessageSquare, ListTodo
} from 'lucide-react';

function ReportListTable({ reports, loading, pagination, handlePageChange, userRole, userId, handleActionSuccess, isEvaluatorView }) {
    const router = useRouter();
    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
    const isReporter = userRole === 'reporter';
    const [expandedRows, setExpandedRows] = useState({});

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800 border-gray-200',
            public: 'bg-blue-100 text-blue-800 border-blue-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
            published: 'bg-purple-100 text-purple-800 border-purple-200',
            submitted: 'bg-cyan-100 text-cyan-800 border-cyan-200',
            in_evaluation: 'bg-sky-100 text-sky-800 border-sky-200',
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
                case 'assignReview':
                    // Chỉ cho phép phân quyền báo cáo Tổng hợp TĐG
                    if (report.type !== 'overall_tdg') {
                        toast.error('Chỉ có thể phân quyền đánh giá cho Báo cáo Tổng hợp TĐG.');
                        return;
                    }
                    await router.push(`/assignments/assign-reviewers?reportIds=${reportId}`);
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
                case 'evaluate':
                    // === LOGIC XỬ LÝ NÚT ĐÁNH GIÁ CHO EVALUATOR ===

                    // 1. Kiểm tra xem user đã có bài đánh giá nào cho báo cáo này chưa
                    const myEvaluation = report.evaluations?.find(e =>
                        String(e.evaluatorId?._id || e.evaluatorId) === String(userId)
                    );

                    // 2. Lấy thông tin Assignment ID từ backend (đã được populate vào evaluatorAssignment)
                    const assignmentId = report.evaluatorAssignment?.assignmentId;

                    if (myEvaluation) {
                        // Nếu ĐÃ CÓ bài đánh giá:
                        // - Nếu đang là bản nháp (draft): Chuyển đến trang chỉnh sửa
                        // - Nếu đã nộp/hoàn thành: Chuyển đến trang xem chi tiết
                        if (myEvaluation.status === 'draft') {
                            router.push(`/evaluations/${myEvaluation._id}/edit`);
                        } else {
                            router.push(`/evaluations/${myEvaluation._id}`);
                        }
                    } else if (assignmentId) {
                        // Nếu CHƯA CÓ bài đánh giá nhưng CÓ phân quyền:
                        // Chuyển đến trang TẠO MỚI với assignmentId và reportId
                        router.push(`/evaluations/create?assignmentId=${assignmentId}&reportId=${reportId}`);
                    } else {
                        toast.error('Không tìm thấy thông tin phân quyền hợp lệ để thực hiện đánh giá.');
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
        const userIdStr = String(userId);
        const createdByIdStr = String(report.createdBy?._id || report.createdBy);
        const isMyReport = createdByIdStr === userIdStr;
        const isOverallTdg = report.type === 'overall_tdg';

        // Lấy thông tin assignment từ backend (field 'evaluatorAssignment' được thêm trong controller)
        const evaluatorAssignment = report.evaluatorAssignment;

        // Lấy thông tin evaluation của user (nếu có)
        const myEvaluation = report.evaluations?.find(e =>
            String(e.evaluatorId?._id || e.evaluatorId) === userIdStr
        );

        // --- LOGIC CHO EVALUATOR ---
        if (isEvaluatorView && isOverallTdg) {
            // Luôn hiển thị nút xem chi tiết báo cáo
            actions.push({ icon: Eye, variant: "view", title: "Xem chi tiết", action: 'view' });

            // Kiểm tra nếu người dùng có phân quyền đánh giá báo cáo này
            if (evaluatorAssignment) {
                const evalStatus = myEvaluation?.status;

                if (!myEvaluation || evalStatus === 'draft' || evalStatus === 'rejected') {
                    // Trường hợp 1: Chưa đánh giá HOẶC đang viết dở (draft) HOẶC bị từ chối (cần sửa lại)
                    // -> Hiển thị nút "Đánh giá" (màu xanh)
                    actions.push({ icon: ListTodo, variant: "blue", title: "Đánh giá", action: 'evaluate' });
                } else if (evalStatus === 'submitted') {
                    // Trường hợp 2: Đã nộp bài đánh giá
                    // -> Hiển thị trạng thái "Đã nộp" (màu xám hoặc xanh nhạt, click để xem lại)
                    actions.push({ icon: CheckCircle, variant: "gray", title: "Đã nộp", action: 'evaluate' });
                } else if (['supervised', 'final'].includes(evalStatus)) {
                    // Trường hợp 3: Đã hoàn tất quy trình
                    // -> Hiển thị "Hoàn tất" (màu xanh lá)
                    actions.push({ icon: CheckCircle, variant: "success", title: "Hoàn tất", action: 'evaluate' });
                }
            }
            return actions.slice(0, 4);
        }

        // --- LOGIC CHO MANAGER / ADMIN / REPORTER ---
        actions.push({ icon: Eye, variant: "view", title: "Xem chi tiết", action: 'view' });

        // Quyền chỉnh sửa báo cáo (của chính mình và đang ở trạng thái nháp/từ chối)
        if (isMyReport && ['draft', 'rejected'].includes(status)) {
            actions.push({ icon: Edit2, variant: "edit", title: "Chỉnh sửa", action: 'edit' });
        }

        // Reporter công khai/rút lại báo cáo
        if (isMyReport && ['draft', 'rejected'].includes(status)) {
            actions.push({ icon: Send, variant: "blue", title: "Công khai", action: 'makePublic' });
        }

        if (isMyReport && status === 'public') {
            actions.push({ icon: RotateCcw, variant: "blue", title: "Rút lại", action: 'retractPublic' });
        }

        // Quyền quản lý (Manager/Admin)
        if (isManagerOrAdmin) {
            const hasEvaluations = report.evaluations && report.evaluations.length > 0;

            if (['submitted', 'public'].includes(status)) {
                actions.push({ icon: CheckCircle, variant: "success", title: "Phê duyệt", action: 'approve' });
                actions.push({ icon: XCircle, variant: "delete", title: "Từ chối", action: 'reject' });
            }

            // Nút Phân quyền: Chỉ cho báo cáo Tổng hợp TĐG đã được phê duyệt
            if (isOverallTdg && status === 'approved') {
                actions.push({ icon: UserPlus, variant: "blue", title: "Phân quyền", action: 'assignReview' });
            }

            if (status === 'in_evaluation' && hasEvaluations) {
                actions.push({ icon: Send, variant: "success", title: "Phát hành", action: 'publish' });
            }

            if (status === 'published') {
                actions.push({ icon: RotateCcw, variant: "warning", title: "Thu hồi", action: 'unpublish' });
            }
        }

        if (isMyReport && ['draft', 'rejected'].includes(status)) {
            actions.push({ icon: Trash2, variant: "delete", title: "Xóa", action: 'delete' });
        }

        return actions.slice(0, 4);
    };

    const toggleExpandRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Xác định các cột hiển thị
    const showStandardCriteriaCols = !isEvaluatorView && (reports.length === 0 || reports[0]?.type !== 'overall_tdg');
    let totalCols = 6;
    if (showStandardCriteriaCols) {
        totalCols = 10;
    } else {
        totalCols = 8;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[4%]">STT</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[7%]">Mã Task</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[7%]">Mã BC</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[18%]">Tiêu đề</th>

                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[8%]">Loại</th>

                    {showStandardCriteriaCols && (
                        <>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[10%]">Tiêu chuẩn</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[10%]">Tiêu chí</th>
                        </>
                    )}

                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[8%]">Trạng thái</th>
                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[10%]">Người tạo</th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-blue-200 w-[18%]">Hành động</th>
                </tr>
                </thead>
                <tbody className="bg-white">
                {loading ? (
                    <tr>
                        <td colSpan={totalCols} className="px-6 py-16 text-center">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                        </td>
                    </tr>
                ) : reports.length === 0 ? (
                    <tr>
                        <td colSpan={totalCols} className="px-6 py-16 text-center">
                            <p className="text-gray-500 font-medium">Không có báo cáo nào.</p>
                        </td>
                    </tr>
                ) : (
                    reports.map((report, index) => {
                        const actions = getReportActions(report);
                        const current = pagination.current || 1;
                        const limit = pagination.limit || 10;
                        const stt = (current - 1) * limit + index + 1;
                        const taskCode = report.taskId?.taskCode || '-';

                        return (
                            <tr key={report._id} className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                                <td className="px-4 py-3 text-center border-r border-gray-200">
                                    <span className="text-sm font-semibold text-gray-700">{stt}</span>
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-200">
                                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 whitespace-nowrap">{taskCode}</span>
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-200">
                                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 whitespace-nowrap">{report.code}</span>
                                </td>
                                <td className="px-4 py-3 border-r border-gray-200">
                                    <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={report.title}>{report.title}</p>
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-200">
                                    <span className="text-xs font-medium text-gray-700">{getTypeText(report.type)}</span>
                                </td>
                                {showStandardCriteriaCols && (
                                    <>
                                        <td className="px-3 py-3 border-r border-gray-200 text-xs">
                                            {report.standardId && (
                                                <button
                                                    onClick={() => toggleExpandRow(report.standardId._id)}
                                                    className="flex items-center space-x-1 hover:text-blue-600 transition-colors w-full text-left"
                                                >
                                                    {expandedRows[report.standardId._id] ? (
                                                        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                                                    ) : (
                                                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                                                    )}
                                                    <span className="font-bold text-blue-700">{report.standardId?.code}</span>
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 border-r border-gray-200 text-xs">
                                            {report.criteriaId && (
                                                <button
                                                    onClick={() => toggleExpandRow(report.criteriaId._id)}
                                                    className="flex items-center space-x-1 hover:text-blue-600 transition-colors w-full text-left"
                                                >
                                                    {expandedRows[report.criteriaId._id] ? (
                                                        <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                                                    ) : (
                                                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                                                    )}
                                                    <span className="font-bold text-blue-700">{report.criteriaId?.code}</span>
                                                </button>
                                            )}
                                        </td>
                                    </>
                                )}
                                <td className="px-3 py-3 text-center border-r border-gray-200">
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusColor(report.status)}`}>
                                            {report.statusText || report.status}
                                        </span>
                                </td>
                                <td className="px-3 py-3 text-center border-r border-gray-200 text-xs font-medium text-gray-700">
                                    {report.createdBy?.fullName || 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        {actions.map(btn => (
                                            <ActionButton
                                                key={btn.title}
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-t-2 border-blue-200">
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
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
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