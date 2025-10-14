import { useState, useEffect } from 'react'
import { Search, Plus, FileText, Filter } from 'lucide-react'
import evidenceService from '../../services/evidenceService'
import toast from 'react-hot-toast'

export default function EvidencePicker({
                                           standardId,
                                           criteriaId,
                                           onSelect,
                                           onViewEvidence,
                                           programId,
                                           organizationId
                                       }) {
    const [evidences, setEvidences] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState('all') // all, standard, criteria

    useEffect(() => {
        if (standardId || criteriaId) {
            fetchEvidences()
        }
    }, [standardId, criteriaId, filter, programId, organizationId])

    const fetchEvidences = async () => {
        try {
            setLoading(true)

            const allowedStatuses = ['new', 'in_progress', 'completed', 'approved'];
            const params = {
                limit: 100,
                statuses: allowedStatuses.join(',')
            }

            if (programId) params.programId = programId;
            if (organizationId) params.organizationId = organizationId;

            if (filter === 'criteria' && criteriaId) {
                params.criteriaId = criteriaId
            } else if (filter === 'standard' && standardId) {
                params.standardId = standardId
            } else if (standardId) {
                // Get all evidences from this standard
                params.standardId = standardId
            }

            const response = await evidenceService.getEvidences(params)
            setEvidences(response.data?.evidences || [])
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

    if (!standardId && !criteriaId) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                Vui lòng chọn Tiêu chuẩn hoặc Tiêu chí để xem danh sách minh chứng
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Minh chứng tham chiếu
                </h4>
                <span className="text-xs text-gray-500">
                    {filteredEvidences.length} minh chứng
                </span>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2">
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

                {standardId && criteriaId && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`flex-1 px-3 py-1 text-xs rounded ${
                                filter === 'all'
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            Tất cả tiêu chuẩn
                        </button>
                        <button
                            onClick={() => setFilter('criteria')}
                            className={`flex-1 px-3 py-1 text-xs rounded ${
                                filter === 'criteria'
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            Chỉ tiêu chí này
                        </button>
                    </div>
                )}
            </div>

            {/* Evidence List */}
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
                        <div
                            key={evidence._id}
                            className="group border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                            onClick={() => onViewEvidence && onViewEvidence(evidence.code)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm font-semibold text-blue-600">
                                            {evidence.code}
                                        </span>
                                        {evidence.criteriaId && (
                                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                                Tiêu chí {evidence.criteriaId.code}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-900 font-medium mb-1 line-clamp-2">
                                        {evidence.name}
                                    </p>
                                    {evidence.description && (
                                        <p className="text-xs text-gray-600 line-clamp-1">
                                            {evidence.description}
                                        </p>
                                    )}
                                    {evidence.files && evidence.files.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            📎 {evidence.files.length} file(s)
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onSelect(evidence.code)
                                    }}
                                    className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                    title="Chèn vào báo cáo"
                                >
                                    <Plus className="h-3 w-3" />
                                    Chèn
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-medium mb-1">💡 Hướng dẫn:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                    <li>Click vào minh chứng để xem chi tiết</li>
                    <li>Click nút "Chèn" để thêm mã minh chứng vào báo cáo</li>
                    <li>Mã minh chứng sẽ hiển thị màu xanh trong báo cáo</li>
                </ul>
            </div>
        </div>
    )
}