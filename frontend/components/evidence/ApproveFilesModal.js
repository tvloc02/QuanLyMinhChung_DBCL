import { useState, useEffect } from 'react'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    X,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    File,
    FileText
} from 'lucide-react'

export default function ApproveFilesModal({ evidenceIds, onClose, onSuccess }) {
    const [loading, setLoading] = useState(true)
    const [evidences, setEvidences] = useState([])
    const [selectedFiles, setSelectedFiles] = useState([])
    const [selectAll, setSelectAll] = useState(false)
    const [approvalAction, setApprovalAction] = useState('approve') // 'approve' or 'reject'
    const [rejectionReason, setRejectionReason] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchEvidences()
    }, [])

    const fetchEvidences = async () => {
        try {
            setLoading(true)
            const promises = evidenceIds.map(id => apiMethods.evidences.getById(id))
            const responses = await Promise.all(promises)

            const evidenceData = responses.map(response => response.data?.data || response.data)
            setEvidences(evidenceData)

            // Tự động chọn tất cả files có trạng thái pending
            const allPendingFiles = []
            evidenceData.forEach(evidence => {
                if (evidence.files) {
                    evidence.files.forEach(file => {
                        if (file.approvalStatus === 'pending') {
                            allPendingFiles.push(file._id)
                        }
                    })
                }
            })
            setSelectedFiles(allPendingFiles)
            setSelectAll(allPendingFiles.length > 0)
        } catch (error) {
            console.error('Fetch evidences error:', error)
            toast.error('Lỗi khi tải thông tin minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const toggleFileSelection = (fileId) => {
        setSelectedFiles(prev =>
            prev.includes(fileId)
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        )
    }

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedFiles([])
        } else {
            const allFileIds = []
            evidences.forEach(evidence => {
                if (evidence.files) {
                    evidence.files.forEach(file => {
                        if (file.approvalStatus === 'pending') {
                            allFileIds.push(file._id)
                        }
                    })
                }
            })
            setSelectedFiles(allFileIds)
        }
        setSelectAll(!selectAll)
    }

    const handleSubmit = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Vui lòng chọn ít nhất một file')
            return
        }

        if (approvalAction === 'reject' && !rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối')
            return
        }

        if (!confirm(`Bạn có chắc chắn muốn ${approvalAction === 'approve' ? 'duyệt' : 'từ chối'} ${selectedFiles.length} file đã chọn?`)) {
            return
        }

        try {
            setSubmitting(true)
            let successCount = 0
            let failCount = 0

            for (const fileId of selectedFiles) {
                try {
                    await apiMethods.files.approve(fileId, {
                        status: approvalAction === 'approve' ? 'approved' : 'rejected',
                        rejectionReason: approvalAction === 'reject' ? rejectionReason : undefined
                    })
                    successCount++
                } catch (error) {
                    console.error('Approve file error:', fileId, error)
                    failCount++
                }
            }

            if (failCount === 0) {
                toast.success(`${approvalAction === 'approve' ? 'Duyệt' : 'Từ chối'} thành công ${successCount} file`)
                onSuccess()
            } else {
                toast.success(`${approvalAction === 'approve' ? 'Duyệt' : 'Từ chối'} thành công ${successCount} file, thất bại ${failCount} file`)
                onSuccess()
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error('Lỗi khi xử lý file')
        } finally {
            setSubmitting(false)
        }
    }

    const totalFiles = evidences.reduce((sum, ev) => sum + (ev.files?.length || 0), 0)
    const pendingFiles = evidences.reduce((sum, ev) =>
        sum + (ev.files?.filter(f => f.approvalStatus === 'pending')?.length || 0), 0
    )

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Duyệt files minh chứng</h2>
                                <p className="text-green-100 text-sm">
                                    {evidenceIds.length} minh chứng - {totalFiles} files
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* Content */}
                        <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                    <div className="text-sm text-blue-700 font-medium mb-1">Tổng files</div>
                                    <div className="text-2xl font-bold text-blue-900">{totalFiles}</div>
                                </div>
                                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                                    <div className="text-sm text-yellow-700 font-medium mb-1">Chờ duyệt</div>
                                    <div className="text-2xl font-bold text-yellow-900">{pendingFiles}</div>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                    <div className="text-sm text-green-700 font-medium mb-1">Đã chọn</div>
                                    <div className="text-2xl font-bold text-green-900">{selectedFiles.length}</div>
                                </div>
                            </div>

                            {/* Select All */}
                            {pendingFiles > 0 && (
                                <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={toggleSelectAll}
                                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                        />
                                        <span className="ml-3 text-sm font-semibold text-gray-900">
                                            Chọn tất cả files chờ duyệt ({pendingFiles} files)
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Files List */}
                            <div className="space-y-4">
                                {evidences.map(evidence => {
                                    const pendingFilesInEvidence = evidence.files?.filter(f => f.approvalStatus === 'pending') || []

                                    if (pendingFilesInEvidence.length === 0) return null

                                    return (
                                        <div key={evidence._id} className="border border-gray-200 rounded-xl overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                                            {evidence.code}
                                                        </span>
                                                        <h3 className="text-sm font-semibold text-gray-900 mt-1">
                                                            {evidence.name}
                                                        </h3>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {pendingFilesInEvidence.length} file chờ duyệt
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-2">
                                                {pendingFilesInEvidence.map(file => (
                                                    <label
                                                        key={file._id}
                                                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedFiles.includes(file._id)}
                                                            onChange={() => toggleFileSelection(file._id)}
                                                            className="mt-0.5 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2">
                                                                <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                                    {file.originalName}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                                <span>•</span>
                                                                <span>{file.uploadedBy?.fullName || 'N/A'}</span>
                                                                <span>•</span>
                                                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">
                                                                    Chờ duyệt
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {pendingFiles === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Không có file nào chờ duyệt
                                    </h3>
                                    <p className="text-gray-500">
                                        Tất cả files trong các minh chứng đã chọn đều đã được xử lý
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {pendingFiles > 0 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                {/* Action Type */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Hành động
                                    </label>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                value="approve"
                                                checked={approvalAction === 'approve'}
                                                onChange={(e) => setApprovalAction(e.target.value)}
                                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                                            />
                                            <CheckCircle className="h-5 w-5 ml-2 mr-1 text-green-600" />
                                            <span className="text-sm font-medium text-gray-900">Duyệt</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                value="reject"
                                                checked={approvalAction === 'reject'}
                                                onChange={(e) => setApprovalAction(e.target.value)}
                                                className="w-4 h-4 text-red-600 focus:ring-red-500"
                                            />
                                            <XCircle className="h-5 w-5 ml-2 mr-1 text-red-600" />
                                            <span className="text-sm font-medium text-gray-900">Từ chối</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Rejection Reason */}
                                {approvalAction === 'reject' && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Lý do từ chối <span className="text-red-600">*</span>
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Nhập lý do từ chối..."
                                            rows={3}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        />
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="flex items-center justify-end space-x-3">
                                    <button
                                        onClick={onClose}
                                        disabled={submitting}
                                        className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || selectedFiles.length === 0}
                                        className={`inline-flex items-center px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                                            approvalAction === 'approve'
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-xl'
                                                : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-xl'
                                        }`}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                {approvalAction === 'approve' ? (
                                                    <>
                                                        <CheckCircle className="h-5 w-5 mr-2" />
                                                        Duyệt {selectedFiles.length} file
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="h-5 w-5 mr-2" />
                                                        Từ chối {selectedFiles.length} file
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}