import { useState, useEffect } from 'react'
import { X, FileText, Loader2, Edit, PlusCircle, AlertCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'

const REPORT_TYPES_DISPLAY = {
    'overall_tdg': 'Báo cáo Tự đánh giá (TĐG)',
    'standard': 'Báo cáo Tiêu chuẩn',
    'criteria': 'Báo cáo Tiêu chí',
}

export default function ReportSelectionModal({ target, onClose, onSelectReport }) {
    const { user } = useAuth()
    const [existingReports, setExistingReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [requestEditReason, setRequestEditReason] = useState('')

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true)
            try {
                // Giả định có API mới: apiMethods.reports.getReportsByStandardCriteria
                const params = {
                    reportType: target.reportType,
                    standardId: target.standardId,
                    criteriaId: target.criteriaId
                }
                const response = await apiMethods.reports.getReportsByStandardCriteria(params)
                setExistingReports(response.data.data || [])
            } catch (error) {
                console.error('Fetch existing reports error:', error)
                setExistingReports([])
                toast.error('Lỗi khi tải báo cáo hiện có.')
            } finally {
                setLoading(false)
            }
        }

        if (target) {
            fetchReports()
        }
    }, [target])

    const handleCreateNew = () => {
        onSelectReport({
            reportType: target.reportType,
            standardId: target.standardId,
            criteriaId: target.criteriaId,
            reportId: null // Tạo mới
        })
    }

    const handleSelectExisting = (report) => {
        // Chỉ người tạo báo cáo mới có thể sửa trực tiếp
        if (report.createdBy === user?._id) {
            onSelectReport({
                reportType: target.reportType,
                standardId: target.standardId,
                criteriaId: target.criteriaId,
                reportId: report._id
            })
        } else {
            // Hiển thị form yêu cầu sửa
            document.getElementById('request-edit-form').scrollIntoView({ behavior: 'smooth' });
        }
    }

    const handleRequestEdit = async (reportId) => {
        if (!requestEditReason.trim()) {
            toast.error('Vui lòng nhập lý do yêu cầu sửa.')
            return
        }

        setSubmitting(true)
        try {
            // Giả định có API yêu cầu quyền sửa
            await apiMethods.reports.requestEditPermission(reportId, { reason: requestEditReason })
            toast.success('Yêu cầu quyền sửa báo cáo đã được gửi!')
            onClose()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gửi yêu cầu thất bại.')
        } finally {
            setSubmitting(false)
        }
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                        Chọn Báo cáo: <span className="text-blue-600">{REPORT_TYPES_DISPLAY[target.reportType]}</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm font-semibold text-gray-800 mb-1">Đối tượng:</p>
                        <p className="text-sm text-gray-700">
                            {target.criteriaId ? 'Tiêu chí' : 'Tiêu chuẩn'}: <span className="font-bold">{target.code}</span>
                        </p>
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 border-b pb-2">1. Báo cáo hiện có</h4>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : existingReports.length === 0 ? (
                        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="text-sm font-medium">Chưa có báo cáo nào được viết cho yêu cầu này.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {existingReports.map(report => (
                                <div
                                    key={report._id}
                                    className={`p-4 rounded-xl border-2 transition-all ${report.createdBy === user?._id ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <p className="font-semibold text-gray-900 mb-1">Tên báo cáo: {report.title}</p>
                                    <p className="text-xs text-gray-600">Trạng thái: <span className="font-medium text-blue-600">{report.status}</span></p>
                                    <p className="text-xs text-gray-600">Người viết: {report.authorName} {report.createdBy === user?._id && '(Bạn)'}</p>

                                    <div className="mt-3 flex space-x-2">
                                        <button
                                            onClick={() => handleSelectExisting(report)}
                                            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                                report.createdBy === user?._id ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                            }`}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            {report.createdBy === user?._id ? 'Sửa báo cáo' : 'Yêu cầu quyền sửa'}
                                        </button>

                                        <button
                                            onClick={() => toast.info('Xem báo cáo: ' + report.title)}
                                            className="flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition-all"
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Xem
                                        </button>
                                    </div>

                                    {/* Form Yêu cầu sửa chỉ hiện khi người dùng không phải người tạo */}
                                    {report.createdBy !== user?._id && (
                                        <div id="request-edit-form" className="mt-4 pt-4 border-t border-gray-100">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Lý do yêu cầu sửa:</label>
                                            <textarea
                                                value={requestEditReason}
                                                onChange={(e) => setRequestEditReason(e.target.value)}
                                                rows={2}
                                                placeholder="Giải thích tại sao bạn cần chỉnh sửa báo cáo này..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button
                                                onClick={() => handleRequestEdit(report._id)}
                                                disabled={submitting || !requestEditReason.trim()}
                                                className="mt-2 w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                                            >
                                                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                                Gửi yêu cầu
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <h4 className="text-lg font-bold text-gray-900 border-b pb-2 pt-4">2. Tạo Báo cáo mới</h4>

                    <div className="flex space-x-3 pt-2">
                        <button
                            onClick={handleCreateNew}
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-medium inline-flex items-center justify-center"
                        >
                            <PlusCircle className="h-5 w-5 mr-2" />
                            Tạo Báo cáo mới
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}