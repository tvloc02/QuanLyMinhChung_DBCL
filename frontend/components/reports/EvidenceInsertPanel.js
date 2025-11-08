// frontend/components/reports/EvidenceInsertPanel.js
import { useState, useEffect } from 'react'
import { FileText, Search, ChevronDown, Plus, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function EvidenceInsertPanel({ criteriaId, standardId, onInsert, disabled }) {
    const [evidences, setEvidences] = useState([])
    const [filteredEvidences, setFilteredEvidences] = useState([])
    const [searchText, setSearchText] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (criteriaId) {
            fetchEvidences()
        }
    }, [criteriaId])

    useEffect(() => {
        const filtered = evidences.filter(e =>
            e.code?.toLowerCase().includes(searchText.toLowerCase()) ||
            e.name?.toLowerCase().includes(searchText.toLowerCase())
        )
        setFilteredEvidences(filtered)
    }, [searchText, evidences])

    const fetchEvidences = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.evidences.getAll({
                criteriaId: criteriaId,
                status: 'approved'
            })
            setEvidences(response.data.data.evidences || [])
        } catch (error) {
            console.error('Error fetching evidences:', error)
            toast.error('Lỗi khi tải danh sách minh chứng')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                Chèn Minh Chứng
            </h3>

            <input
                type="text"
                placeholder="Tìm kiếm theo mã hoặc tên..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-4 py-2 border-2 border-sky-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            <div className="bg-sky-50 border-2 border-sky-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader className="w-5 h-5 text-sky-600 animate-spin" />
                    </div>
                ) : filteredEvidences.length > 0 ? (
                    filteredEvidences.map(evidence => (
                        <div
                            key={evidence._id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-sky-100 hover:border-sky-300 transition-all group"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-sky-700">{evidence.code}</p>
                                <p className="text-xs text-gray-600 truncate">{evidence.name}</p>
                            </div>
                            <button
                                onClick={() => {
                                    onInsert(evidence.code)
                                    toast.success(`Đã chèn ${evidence.code}`)
                                }}
                                className="ml-2 p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-gray-500 text-center py-4">
                        {searchText ? 'Không tìm thấy minh chứng' : 'Chưa có minh chứng nào'}
                    </p>
                )}
            </div>
        </div>
    )
}

