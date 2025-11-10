import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, FileText, Eye, ChevronRight, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import { useRouter } from 'next/router'

export default function TaskReview({ task, onClose, onSuccess }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [reports, setReports] = useState([])
    const [selectedReport, setSelectedReport] = useState(null)
    const [evidences, setEvidences] = useState([])
    const [currentPage, setCurrentPage] = useState(0)
    const [selectedFile, setSelectedFile] = useState(null)
    const [rejectMode, setRejectMode] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [reviewLoading, setReviewLoading] = useState(false)
    const [reviewApproved, setReviewApproved] = useState(false)

    const itemsPerPage = 1

    useEffect(() => {
        loadTaskData()
        const criteriaId = task.criteriaId?._id || task.criteriaId
        if (criteriaId) {
            loadEvidences(criteriaId)
        } else {
            setEvidences([])
        }
    }, [task])

    const loadTaskData = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.reports.getByTask({
                taskId: task._id,
                reportType: task.reportType,
                isTaskCreator: true,
            })

            const reportsData = response.data.data.reports || []
            setReports(reportsData)

            if (reportsData.length > 0) {
                const primaryReport = reportsData.find(r => String(r._id) === String(task.reportId));
                setSelectedReport(primaryReport || reportsData[0]);
            } else {
                setSelectedReport(null);
            }
        } catch (error) {
            console.error('Load task data error:', error)
            toast.error('Lỗi khi tải dữ liệu nhiệm vụ')
            setReports([])
            setSelectedReport(null)
        } finally {
            setLoading(false)
        }
    }

    const loadEvidences = async (criteriaId) => {
        try {
            if (!criteriaId) {
                setEvidences([])
                return
            }
            const evidenceData = await apiMethods.evidences.getAll({ criteriaId })
            setEvidences(evidenceData.data.data.evidences || [])
            setCurrentPage(0)
        } catch (error) {
            console.error('Load evidences error:', error)
            setEvidences([])
        }
    }

    const handleApprove = async () => {
        if (!selectedReport) return

        if (!confirm('Bạn có chắc chắn muốn phê duyệt báo cáo này?')) return

        try {
            setReviewLoading(true)

            await apiMethods.reports.approve(selectedReport._id)
            await apiMethods.tasks.reviewReport(task._id, { status: 'completed' })

            toast.success('Phê duyệt báo cáo thành công')
            setReviewApproved(true)
            loadTaskData()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Phê duyệt thất bại')
        } finally {
            setReviewLoading(false)
        }
    }

    const handleReject = async () => {
        if (!selectedReport) return

        if (!rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        if (!confirm('Bạn có chắc chắn muốn từ chối báo cáo này?')) return

        try {
            setReviewLoading(true)

            await apiMethods.reports.reject(selectedReport._id, {
                feedback: rejectionReason
            })

            await apiMethods.tasks.reviewReport(task._id, { status: 'rejected', rejectionReason })

            toast.success('Từ chối báo cáo thành công')
            onSuccess()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Từ chối thất bại')
        } finally {
            setReviewLoading(false)
            setRejectionReason('')
            setRejectMode(false)
        }
    }

    const handleDownloadReportFile = async (report) => {
        if (report.contentMethod === 'file_upload' && report.attachedFile) {
            try {
                const response = await apiMethods.reports.downloadFile(report._id)

                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', report.attachedFile.originalName || 'report-file.pdf')
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
                toast.success('Tải file thành công')

            } catch (error) {
                console.error('Download error:', error)
                toast.error(error.response?.data?.message || 'Lỗi khi tải file báo cáo')
            }
        } else {
            toast.error('Báo cáo không có file đính kèm hoặc được soạn trực tuyến')
        }
    }

    const handleAssignReviewers = () => {
        if (!selectedReport) return
        router.push(`/assignments/assign-reviewers?reportId=${selectedReport._id}`)
        onClose()
    }

    const paginatedEvidences = evidences.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    )
    const totalPages = Math.ceil(evidences.length / itemsPerPage)

    const getStatusBadgeColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800',
            public: 'bg-blue-100 text-blue-800',
            published: 'bg-purple-100 text-purple-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            submitted: 'bg-cyan-100 text-cyan-800',
            in_progress: 'bg-sky-100 text-sky-800',
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            public: 'Công khai',
            published: 'Phát hành',
            approved: 'Chấp thuận',
            rejected: 'Từ chối',
            submitted: 'Đã nộp chờ duyệt',
            in_progress: 'Đang thực hiện',
        }
        return labels[status] || status
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">{task.taskCode}</h2>
                            <p className="text-blue-100 text-sm">Duyệt báo cáo và minh chứng</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all flex items-center justify-center"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50 p-4 space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 px-2 mb-3">Danh sách báo cáo ({reports.length})</h3>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-xs text-gray-500 mt-2">Đang tải...</p>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs text-gray-500">Task chưa có báo cáo</p>
                            </div>
                        ) : (
                            reports.map((report) => (
                                <button
                                    key={report._id}
                                    onClick={() => setSelectedReport(report)}
                                    className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                                        selectedReport?._id === report._id
                                            ? 'bg-blue-100 border-2 border-blue-500'
                                            : 'bg-white border border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 truncate">
                                                {report.title}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {report.code}
                                            </p>
                                            <div className="mt-1 flex items-center gap-1">
                                                <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${getStatusBadgeColor(report.status)}`}>
                                                    {getStatusLabel(report.status)}
                                                </span>
                                                {String(report._id) === String(task.reportId) && (
                                                    <span className="text-xs text-green-700 font-bold bg-green-200 px-2 py-0.5 rounded-full">
                                                        CHÍNH
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {selectedReport?._id === report._id && (
                                            <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="flex-1 border-r border-gray-200 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                                </div>
                            </div>
                        ) : selectedReport ? (
                            <div className="space-y-6">
                                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin báo cáo</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Mã báo cáo</label>
                                            <p className="text-gray-900 font-medium">{selectedReport.code}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Tiêu đề</label>
                                            <p className="text-gray-900 font-medium">{selectedReport.title}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Trạng thái</label>
                                            <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${getStatusBadgeColor(selectedReport.status)}`}>
                                                {getStatusLabel(selectedReport.status)}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Người tạo</label>
                                            <p className="text-gray-900 font-medium">{selectedReport.createdBy?.fullName}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Ngày tạo</label>
                                            <p className="text-gray-900 font-medium">{formatDate(selectedReport.createdAt)}</p>
                                        </div>
                                        {selectedReport.contentMethod === 'file_upload' && (
                                            <div>
                                                <label className="text-sm font-semibold text-gray-600">File đính kèm</label>
                                                <button
                                                    onClick={() => handleDownloadReportFile(selectedReport)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mt-1"
                                                    disabled={!selectedReport.attachedFile}
                                                >
                                                    <Download className="w-4 h-4" />
                                                    {selectedReport.attachedFile?.originalName || 'Tải xuống'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-5 border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Nội dung báo cáo</h3>
                                    <div className="prose prose-sm max-w-none">
                                        {selectedReport.content ? (
                                            <div
                                                dangerouslySetInnerHTML={{ __html: selectedReport.content }}
                                                className="text-gray-700"
                                            />
                                        ) : (
                                            <p className="text-gray-500 italic">Chưa có nội dung</p>
                                        )}
                                    </div>
                                </div>

                                {selectedReport.status === 'rejected' && selectedReport.rejectionFeedback && (
                                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                                        <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                                            <XCircle size={20} />
                                            Lý do từ chối
                                        </h3>
                                        <p className="text-red-800">{selectedReport.rejectionFeedback}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center">
                                <div>
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Chưa có báo cáo liên kết với Task này</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-80 border-l border-gray-200 overflow-y-auto p-6 bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Minh chứng</h3>

                        {evidences.length === 0 ? (
                            <div className="text-center py-8">
                                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">Không có minh chứng nào</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {paginatedEvidences.map((evidence) => (
                                    <div key={evidence._id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                                        <h4 className="font-semibold text-gray-900 text-sm mb-3 line-clamp-2">
                                            {evidence.name}
                                        </h4>
                                        <div className="space-y-2">
                                            {evidence.files && evidence.files.length > 0 ? (
                                                evidence.files.map((file) => (
                                                    <button
                                                        key={file._id}
                                                        onClick={() => setSelectedFile(file)}
                                                        className="w-full text-left text-xs px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors truncate border border-blue-200"
                                                    >
                                                        📄 {file.originalName}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-500 italic">Không có file</p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {totalPages > 1 && (
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                            disabled={currentPage === 0}
                                            className="flex-1 px-2 py-2 text-xs border-2 border-blue-300 text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 rounded-lg transition-all"
                                        >
                                            ← Trước
                                        </button>
                                        <span className="flex items-center justify-center text-xs text-gray-600 px-3 py-2">
                                            {currentPage + 1}/{totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                            disabled={currentPage >= totalPages - 1}
                                            className="flex-1 px-2 py-2 text-xs border-2 border-blue-300 text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 rounded-lg transition-all"
                                        >
                                            Sau →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-blue-100">
                    {rejectMode && (
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Nhập lý do từ chối"
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none mb-4"
                        />
                    )}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all font-medium"
                        >
                            Đóng
                        </button>
                        {!reviewApproved && (
                            <>
                                {rejectMode && (
                                    <button
                                        onClick={() => {
                                            setRejectMode(false)
                                            setRejectionReason('')
                                        }}
                                        className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all font-medium"
                                    >
                                        Hủy
                                    </button>
                                )}
                                <button
                                    onClick={() => setRejectMode(!rejectMode)}
                                    disabled={reviewLoading}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
                                >
                                    <XCircle size={18} />
                                    {rejectMode ? 'Xác nhận từ chối' : 'Từ chối'}
                                </button>
                                {rejectMode && (
                                    <button
                                        onClick={handleReject}
                                        disabled={reviewLoading}
                                        className="px-6 py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 disabled:opacity-50 transition-all font-medium"
                                    >
                                        Gửi
                                    </button>
                                )}
                                {!rejectMode && (
                                    <button
                                        onClick={handleApprove}
                                        disabled={reviewLoading}
                                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all font-medium"
                                    >
                                        <CheckCircle size={18} />
                                        Phê duyệt
                                    </button>
                                )}
                            </>
                        )}
                        {reviewApproved && (
                            <button
                                onClick={handleAssignReviewers}
                                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium"
                            >
                                Phân quyền đánh giá
                            </button>
                        )}
                    </div>
                </div>

                {selectedFile && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-900">{selectedFile.originalName}</h3>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="w-10 h-10 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
                                {selectedFile.fileType?.startsWith('image/') ? (
                                    <img
                                        src={selectedFile.path}
                                        alt={selectedFile.originalName}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 mb-4">{selectedFile.originalName}</p>
                                        <a
                                            href={selectedFile.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
                                        >
                                            Tải xuống
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}