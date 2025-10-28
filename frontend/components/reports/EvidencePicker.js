import { useState, useEffect } from 'react'
import { Search, Plus, FileText, Filter, File, Check } from 'lucide-react'
import { apiMethods } from '../../services/api'
import evidenceService from '../../services/evidenceService'
import toast from 'react-hot-toast'

export default function EvidencePicker({
                                           reportType,
                                           programId,
                                           organizationId,
                                           onSelectEvidence,
                                           selectedEvidences = []
                                       }) {
    const [evidences, setEvidences] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [standardId, setStandardId] = useState('')
    const [criteriaId, setCriteriaId] = useState('')
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])
    const [expandedEvidence, setExpandedEvidence] = useState(null)
    const [selectedFiles, setSelectedFiles] = useState({})

    useEffect(() => {
        if (programId && organizationId) {
            fetchStandards()
        }
    }, [programId, organizationId])

    useEffect(() => {
        if (standardId) {
            fetchCriteria()
        }
    }, [standardId])

    useEffect(() => {
        if (programId && organizationId) {
            if (reportType === 'comprehensive_report') {
                fetchEvidences()
            } else if (standardId || criteriaId) {
                fetchEvidences()
            }
        }
    }, [programId, organizationId, standardId, criteriaId, reportType])

    const fetchStandards = async () => {
        try {
            const response = await apiMethods.standards.getAll({ programId, organizationId })
            setStandards(response.data?.data?.standards || response.data?.data || [])
        } catch (error) {
            console.error('Fetch standards error:', error)
        }
    }

    const fetchCriteria = async () => {
        try {
            const response = await apiMethods.criteria.getAll({ standardId })
            setCriteria(response.data?.data?.criterias || response.data?.data?.criteria || response.data?.data || [])
        } catch (error) {
            console.error('Fetch criteria error:', error)
        }
    }

    const fetchEvidences = async () => {
        try {
            setLoading(true)
            const allowedStatuses = ['new', 'in_progress', 'completed', 'approved']
            const params = {
                limit: 100,
                statuses: allowedStatuses.join(','),
                programId,
                organizationId
            }

            if (reportType === 'comprehensive_report') {
            } else if (criteriaId) {
                params.criteriaId = criteriaId
            } else if (standardId) {
                params.standardId = standardId
            }

            const response = await evidenceService.getEvidences(params)
            setEvidences(response.data?.evidences || response.evidences || [])
        } catch (error) {
            console.error('Fetch evidences error:', error)
            toast.error('Lỗi khi tải danh sách minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const filteredEvidences = evidences.filter(evidence => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            evidence.code.toLowerCase().includes(search) ||
            evidence.name.toLowerCase().includes(search) ||
            evidence.description?.toLowerCase().includes(search)
        )
    })

    const handleSelectEvidence = (evidence) => {
        const selectedFileIds = selectedFiles[evidence._id] || []
        const fileIds = selectedFileIds.length > 0 ? selectedFileIds : evidence.files?.map(f => f._id) || []

        onSelectEvidence({
            evidenceId: evidence._id,
            code: evidence.code,
            name: evidence.name,
            selectedFileIds: fileIds
        })

        setExpandedEvidence(null)
        setSelectedFiles(prev => {
            const newState = { ...prev }
            delete newState[evidence._id]
            return newState
        })
    }

    const toggleFileSelection = (evidenceId, fileId) => {
        setSelectedFiles(prev => {
            const currentFiles = prev[evidenceId] || []
            const newFiles = currentFiles.includes(fileId)
                ? currentFiles.filter(id => id !== fileId)
                : [...currentFiles, fileId]
            return {
                ...prev,
                [evidenceId]: newFiles
            }
        })
    }

    const isEvidenceSelected = (evidenceId) => {
        return selectedEvidences.some(e => e.evidenceId === evidenceId)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Danh sách minh chứng
                </h4>
                <span className="text-xs text-gray-500">
                    {filteredEvidences.length} minh chứng
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiêu chuẩn
                    </label>
                    <select
                        value={standardId}
                        onChange={(e) => setStandardId(e.target.value)}
                        disabled={reportType === 'comprehensive_report'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">Tất cả tiêu chuẩn</option>
                        {standards.map(s => (
                            <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiêu chí
                    </label>
                    <select
                        value={criteriaId}
                        onChange={(e) => setCriteriaId(e.target.value)}
                        disabled={!standardId || reportType === 'comprehensive_report'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">Tất cả tiêu chí</option>
                        {criteria.map(c => (
                            <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm minh chứng..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredEvidences.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                    Không có minh chứng nào
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredEvidences.map((evidence) => (
                        <div key={evidence._id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className={`p-3 hover:bg-blue-50 transition-all cursor-pointer ${isEvidenceSelected(evidence._id) ? 'bg-green-50' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0" onClick={() => setExpandedEvidence(expandedEvidence === evidence._id ? null : evidence._id)}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-sm font-semibold text-blue-600">
                                                {evidence.code}
                                            </span>
                                            {isEvidenceSelected(evidence._id) && (
                                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-1">
                                                    <Check className="h-3 w-3" />
                                                    Đã chọn
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium mb-1 line-clamp-2">
                                            {evidence.name}
                                        </p>
                                        {evidence.files && evidence.files.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                📎 {evidence.files.length} file(s)
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (isEvidenceSelected(evidence._id)) {
                                                return
                                            }
                                            if (evidence.files && evidence.files.length > 0) {
                                                setExpandedEvidence(evidence._id)
                                            } else {
                                                handleSelectEvidence(evidence)
                                            }
                                        }}
                                        disabled={isEvidenceSelected(evidence._id)}
                                        className={`ml-2 px-3 py-1.5 text-white rounded text-xs font-medium transition-all flex items-center gap-1 ${
                                            isEvidenceSelected(evidence._id)
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                        title={isEvidenceSelected(evidence._id) ? "Đã chọn" : "Chọn minh chứng"}
                                    >
                                        {isEvidenceSelected(evidence._id) ? (
                                            <>
                                                <Check className="h-3 w-3" />
                                                Đã chọn
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-3 w-3" />
                                                Chọn
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {expandedEvidence === evidence._id && evidence.files && evidence.files.length > 0 && (
                                <div className="border-t border-gray-200 bg-gray-50 p-3">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">
                                        Chọn file để đính kèm (hoặc bỏ trống để chọn tất cả):
                                    </p>
                                    <div className="space-y-1 mb-3">
                                        {evidence.files.map(file => (
                                            <label key={file._id} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={(selectedFiles[evidence._id] || []).includes(file._id)}
                                                    onChange={() => toggleFileSelection(evidence._id, file._id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                                                />
                                                <File className="h-4 w-4 text-gray-400 mr-2" />
                                                <span className="text-sm text-gray-700">{file.originalName}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleSelectEvidence(evidence)}
                                        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
                                    >
                                        Xác nhận chọn
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-medium mb-1">💡 Hướng dẫn:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                    <li>Click "Chọn" để thêm minh chứng vào báo cáo</li>
                    <li>Nếu minh chứng có file, bạn có thể chọn file cụ thể hoặc chọn tất cả</li>
                    <li>Mã minh chứng sẽ tự động chèn vào nội dung báo cáo</li>
                </ul>
            </div>
        </div>
    )
}