import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, Send, FileText, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { formatDate } from '../../utils/helpers'

export default function TaskDetail({ task, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)
    const [evidences, setEvidences] = useState([])
    const [currentPage, setCurrentPage] = useState(0)
    const [selectedFile, setSelectedFile] = useState(null)
    const [userRole, setUserRole] = useState('')
    const [reviewMode, setReviewMode] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [reviewLoading, setReviewLoading] = useState(false)

    const itemsPerPage = 1

    useEffect(() => {
        const role = localStorage.getItem('userRole') || ''
        setUserRole(role)
    }, [])

    useEffect(() => {
        loadTaskData()
    }, [task])

    const loadTaskData = async () => {
        try {
            setLoading(true)
            const detailedTask = await apiMethods.tasks.getById(task._id)

            if (detailedTask.data.data.reportId) {
                const reportData = await apiMethods.reports.getById(detailedTask.data.data.reportId)
                setReport(reportData.data.data)

                const evidenceData = await apiMethods.evidences.getAll({
                    criteriaId: task.criteriaId,
                    limit: 1000
                })
                setEvidences(evidenceData.data.data.evidences || [])
            }
        } catch (error) {
            console.error('Load task data error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        try {
            setReviewLoading(true)
            await apiMethods.tasks.reviewReport(task._id, { approved: true })
            toast.success('Phê duyệt báo cáo thành công')
            onSuccess()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Phê duyệt thất bại')
        } finally {
            setReviewLoading(false)
        }
    }

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        try {
            setReviewLoading(true)
            await apiMethods.tasks.reviewReport(task._id, {
                approved: false,
                rejectionReason
            })
            toast.success('Từ chối báo cáo thành công')
            onSuccess()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Từ chối thất bại')
        } finally {
            setReviewLoading(false)
        }
    }

    const canReview = (userRole === 'admin' || userRole === 'manager') && task.status === 'submitted'

    const paginatedEvidences = evidences.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    )
    const totalPages = Math.ceil(evidences.length / itemsPerPage)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">{task.taskCode}</h2>
                            <p className="text-purple-100 text-sm">Xem báo cáo và minh chứng</p>
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
                    <div className="flex-1 border-r border-gray-200 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                                </div>
                            </div>
                        ) : report ? (
                            <div className="space-y-6">
                                <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin báo cáo</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Mã báo cáo</label>
                                            <p className="text-gray-900 font-medium">{report.reportCode}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Trạng thái</label>
                                            <p className="text-gray-900 font-medium">{report.status}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-600">Ngày nộp</label>
                                            <p className="text-gray-900 font-medium">{formatDate(report.submittedAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-5 border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Nội dung báo cáo</h3>
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap">{report.content}</p>
                                    </div>
                                </div>

                                {task.status === 'rejected' && task.rejectionReason && (
                                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                                        <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                                            <XCircle size={20} />
                                            Lý do từ chối
                                        </h3>
                                        <p className="text-red-800">{task.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center">
                                <div>
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Chưa có báo cáo được nộp</p>
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
                                            className="flex-1 px-2 py-2 text-xs border-2 border-purple-300 text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 rounded-lg transition-all"
                                        >
                                            ← Trước
                                        </button>
                                        <span className="flex items-center justify-center text-xs text-gray-600 px-3 py-2">
                                            {currentPage + 1}/{totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                            disabled={currentPage >= totalPages - 1}
                                            className="flex-1 px-2 py-2 text-xs border-2 border-purple-300 text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 rounded-lg transition-all"
                                        >
                                            Sau →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-slate-50">
                    {canReview ? (
                        <div className="space-y-4">
                            {reviewMode && (
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Nhập lý do từ chối (nếu từ chối)"
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                                />
                            )}
                            <div className="flex gap-3 justify-end">
                                {!reviewMode ? (
                                    <>
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all font-medium"
                                        >
                                            Đóng
                                        </button>
                                        <button
                                            onClick={() => setReviewMode(true)}
                                            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium"
                                        >
                                            <Send size={18} />
                                            Duyệt báo cáo
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setReviewMode(false)}
                                            className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all font-medium"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={reviewLoading}
                                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
                                        >
                                            <XCircle size={18} />
                                            Từ chối
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={reviewLoading}
                                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all font-medium"
                                        >
                                            <CheckCircle size={18} />
                                            Phê duyệt
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    )}
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
                                            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-medium"
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