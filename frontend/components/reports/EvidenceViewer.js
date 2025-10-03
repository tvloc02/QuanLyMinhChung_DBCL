import { useState, useEffect } from 'react'
import { X, FileText, Calendar, Building, Download, ExternalLink, File } from 'lucide-react'
import evidenceService from '../../services/evidenceService'
import toast from 'react-hot-toast'

export default function EvidenceViewer({ evidenceCode, onClose, onInsert }) {
    const [evidence, setEvidence] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (evidenceCode) {
            fetchEvidence()
        }
    }, [evidenceCode])

    const fetchEvidence = async () => {
        try {
            setLoading(true)
            // Search by code
            const response = await evidenceService.getEvidences({
                search: evidenceCode,
                limit: 1
            })

            if (response.data?.evidences?.length > 0) {
                const found = response.data.evidences.find(e => e.code === evidenceCode)
                if (found) {
                    // Get full details
                    const detailResponse = await evidenceService.getEvidenceById(found._id)
                    setEvidence(detailResponse.data)
                } else {
                    toast.error('Không tìm thấy minh chứng')
                }
            } else {
                toast.error('Không tìm thấy minh chứng')
            }
        } catch (error) {
            console.error('Fetch evidence error:', error)
            toast.error('Lỗi khi tải thông tin minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('vi-VN')
    }

    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase()
        if (['pdf'].includes(ext)) return '📄'
        if (['doc', 'docx'].includes(ext)) return '📝'
        if (['xls', 'xlsx'].includes(ext)) return '📊'
        if (['ppt', 'pptx'].includes(ext)) return '📊'
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️'
        return '📎'
    }

    const handleDownloadFile = async (fileId, fileName) => {
        try {
            toast.success('Bắt đầu tải xuống...')
            // Implement download logic
        } catch (error) {
            toast.error('Lỗi khi tải file')
        }
    }

    if (loading) {
        return (
            <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
                <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        )
    }

    if (!evidence) {
        return null
    }

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Chi tiết minh chứng
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Evidence Code */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-900">MÃ MINH CHỨNG</span>
                        {onInsert && (
                            <button
                                onClick={() => onInsert(evidence.code)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Chèn vào báo cáo
                            </button>
                        )}
                    </div>
                    <p className="font-mono text-lg font-bold text-blue-700">
                        {evidence.code}
                    </p>
                </div>

                {/* Evidence Name */}
                <div>
                    <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                        Tên minh chứng
                    </label>
                    <p className="text-sm text-gray-900 font-medium">{evidence.name}</p>
                </div>

                {/* Description */}
                {evidence.description && (
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                            Mô tả
                        </label>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {evidence.description}
                        </p>
                    </div>
                )}

                {/* Metadata */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                    {evidence.programId && (
                        <div className="flex items-start">
                            <Building className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Chương trình</p>
                                <p className="text-sm text-gray-900">
                                    {evidence.programId.name}
                                </p>
                            </div>
                        </div>
                    )}

                    {evidence.organizationId && (
                        <div className="flex items-start">
                            <Building className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Tổ chức</p>
                                <p className="text-sm text-gray-900">
                                    {evidence.organizationId.name}
                                </p>
                            </div>
                        </div>
                    )}

                    {evidence.standardId && (
                        <div className="flex items-start">
                            <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Tiêu chuẩn</p>
                                <p className="text-sm text-gray-900">
                                    {evidence.standardId.name}
                                </p>
                            </div>
                        </div>
                    )}

                    {evidence.criteriaId && (
                        <div className="flex items-start">
                            <FileText className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500">Tiêu chí</p>
                                <p className="text-sm text-gray-900">
                                    {evidence.criteriaId.name}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Document Info */}
                {(evidence.documentNumber || evidence.documentType || evidence.issueDate) && (
                    <div className="border-t border-gray-200 pt-4 space-y-3">
                        <label className="text-xs font-medium text-gray-500 uppercase block">
                            Thông tin văn bản
                        </label>

                        {evidence.documentNumber && (
                            <div>
                                <p className="text-xs text-gray-500">Số hiệu</p>
                                <p className="text-sm text-gray-900 font-medium">
                                    {evidence.documentNumber}
                                </p>
                            </div>
                        )}

                        {evidence.documentType && (
                            <div>
                                <p className="text-xs text-gray-500">Loại văn bản</p>
                                <p className="text-sm text-gray-900">{evidence.documentType}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {evidence.issueDate && (
                                <div>
                                    <p className="text-xs text-gray-500">Ngày ban hành</p>
                                    <p className="text-sm text-gray-900">
                                        {formatDate(evidence.issueDate)}
                                    </p>
                                </div>
                            )}

                            {evidence.effectiveDate && (
                                <div>
                                    <p className="text-xs text-gray-500">Ngày hiệu lực</p>
                                    <p className="text-sm text-gray-900">
                                        {formatDate(evidence.effectiveDate)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {evidence.issuingAgency && (
                            <div>
                                <p className="text-xs text-gray-500">Cơ quan ban hành</p>
                                <p className="text-sm text-gray-900">{evidence.issuingAgency}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Files */}
                {evidence.files && evidence.files.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                            Files đính kèm ({evidence.files.length})
                        </label>
                        <div className="space-y-2">
                            {evidence.files.map((file) => (
                                <div
                                    key={file._id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center min-w-0 flex-1">
                                        <span className="text-xl mr-2">
                                            {getFileIcon(file.originalName)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-900 font-medium truncate">
                                                {file.originalName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownloadFile(file._id, file.originalName)}
                                        className="ml-2 p-1 text-blue-600 hover:text-blue-700"
                                        title="Tải xuống"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {evidence.tags && evidence.tags.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {evidence.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {evidence.notes && (
                    <div className="border-t border-gray-200 pt-4">
                        <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                            Ghi chú
                        </label>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {evidence.notes}
                        </p>
                    </div>
                )}

                {/* Status */}
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Trạng thái</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            evidence.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}>
                            {evidence.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                    </div>
                </div>

                {/* View Full Details */}
                <div className="border-t border-gray-200 pt-4">
                    <a
                        href={`/evidence-management/${evidence._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Xem chi tiết đầy đủ
                    </a>
                </div>
            </div>
        </div>
    )
}