import { useState, useEffect } from 'react'
import { X, Plus, FileText, Edit, Eye, AlertCircle, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function ReportSelectionModal({
                                                 isOpen,
                                                 taskId,
                                                 reportType,
                                                 standardId,
                                                 criteriaId,
                                                 onCreateNew,
                                                 onSelectExisting,
                                                 onClose
                                             }) {
    const [loading, setLoading] = useState(false)
    const [reports, setReports] = useState([])
    const [canCreateNew, setCanCreateNew] = useState(false)
    const [task, setTask] = useState(null)

    useEffect(() => {
        if (isOpen && taskId) {
            fetchReports()
        }
    }, [isOpen, taskId])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.reports.getByTask({
                taskId,
                reportType,
                standardId,
                criteriaId
            })

            setReports(response.data.data.reports || [])
            setCanCreateNew(response.data.data.canCreateNew)
            setTask(response.data.data.task)
        } catch (error) {
            console.error('Fetch reports error:', error)
            toast.error('Lỗi khi tải danh sách báo cáo')
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Báo cáo từ nhiệm vụ</h2>
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
                                Tạo báo cáo mới cho nhiệm vụ này
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
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            Các báo cáo dưới đây là từ cùng nhiệm vụ
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Bạn có thể tiếp tục sửa báo cáo đang viết hoặc tạo báo cáo mới
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {reports.map(report => (
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
                                            {report.assignedReporters && report.assignedReporters.length > 1 && (
                                                <p className="text-xs text-gray-500">
                                                    Người có quyền sửa: {report.assignedReporters.map(r => r.fullName).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleSelectReport(report._id)}
                                            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm flex items-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Sửa
                                        </button>
                                    </div>
                                </div>
                            ))}
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