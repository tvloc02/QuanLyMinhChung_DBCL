import { useState, useEffect } from 'react'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    X,
    Loader2,
    Folder,
    Edit2,
    Trash2,
    ChevronRight
} from 'lucide-react'

const MoveEvidenceModal = ({ evidence, onClose, onSuccess }) => {
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])
    const [selectedStandard, setSelectedStandard] = useState('')
    const [selectedCriteria, setSelectedCriteria] = useState('')
    const [newCode, setNewCode] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchStandards()
    }, [])

    useEffect(() => {
        if (selectedStandard) {
            fetchCriteria(selectedStandard)
        } else {
            setCriteria([])
            setSelectedCriteria('')
        }
    }, [selectedStandard])

    const fetchStandards = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.standards.getAll({
                programId: evidence.programId._id,
                organizationId: evidence.organizationId._id
            })
            setStandards(response.data?.data?.standards || response.data?.data || [])
        } catch (error) {
            console.error('Fetch standards error:', error)
            toast.error('Lỗi khi tải tiêu chuẩn')
        } finally {
            setLoading(false)
        }
    }

    const fetchCriteria = async (standardId) => {
        try {
            const response = await apiMethods.criteria.getAll({
                standardId
            })
            const criteriaData = response.data?.data?.criterias ||
                response.data?.data?.criteria ||
                response.data?.data || []
            setCriteria(criteriaData)
        } catch (error) {
            console.error('Fetch criteria error:', error)
            setCriteria([])
        }
    }

    const handleMove = async () => {
        if (!selectedStandard || !selectedCriteria || !newCode.trim()) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        try {
            setSubmitting(true)
            await apiMethods.evidences.move(evidence._id, {
                targetStandardId: selectedStandard,
                targetCriteriaId: selectedCriteria,
                newCode: newCode.trim()
            })
            toast.success('Di chuyển minh chứng thành công')
            onSuccess()
        } catch (error) {
            console.error('Move error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi di chuyển minh chứng')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                <div className="px-6 py-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-2xl text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center"><ChevronRight className="h-6 w-6 mr-2" /> Di Chuyển Minh Chứng</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"><X className="h-6 w-6" /></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                        <p className="text-sm font-semibold text-purple-900">Minh chứng hiện tại:</p>
                        <p className="text-lg font-bold text-purple-700 mt-1">{evidence.code} - {evidence.name}</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tiêu chuẩn đích <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        value={selectedStandard}
                                        onChange={(e) => setSelectedStandard(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="">Chọn tiêu chuẩn...</option>
                                        {standards.map(s => (
                                            <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tiêu chí đích <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        value={selectedCriteria}
                                        onChange={(e) => setSelectedCriteria(e.target.value)}
                                        disabled={!selectedStandard}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                                    >
                                        <option value="">Chọn tiêu chí...</option>
                                        {criteria.map(c => (
                                            <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Mã minh chứng mới <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                    placeholder="VD: A1.01.02.04"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                                />
                                <p className="text-xs text-gray-500 mt-1">Format: A1.01.02.04</p>
                            </div>
                        </>
                    )}

                    <div className="flex items-center justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleMove}
                            disabled={submitting || !selectedStandard || !selectedCriteria || !newCode.trim()}
                            className="inline-flex items-center px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-xl"
                        >
                            {submitting ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Đang di chuyển...</> : 'Di Chuyển'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const RenameFolderModal = ({ folder, onClose, onSuccess }) => {
    const [newName, setNewName] = useState(folder.originalName)
    const [submitting, setSubmitting] = useState(false)

    const handleRename = async () => {
        const trimmedName = newName.trim()

        if (!trimmedName) {
            toast.error('Vui lòng nhập tên thư mục')
            return
        }

        if (trimmedName === folder.originalName) {
            toast.error('Tên mới phải khác tên cũ')
            return
        }

        if (trimmedName.length > 255) {
            toast.error('Tên thư mục không được quá 255 ký tự')
            return
        }

        try {
            setSubmitting(true)
            await apiMethods.files.renameFolder(folder._id, { newName: trimmedName })
            toast.success('Đổi tên thư mục thành công')
            onSuccess()
        } catch (error) {
            console.error('Rename error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi đổi tên thư mục')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center"><Edit2 className="h-6 w-6 mr-2" /> Đổi Tên Thư Mục</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Tên thư mục mới <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            maxLength={255}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={submitting}
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-1">{newName.length}/255</p>
                    </div>
                    <div className="flex items-center justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleRename}
                            disabled={submitting || !newName.trim() || newName === folder.originalName}
                            className="inline-flex items-center px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl"
                        >
                            {submitting ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Đang lưu...</> : 'Lưu'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const DeleteFolderModal = ({ folder, onClose, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false)

    const handleDelete = async () => {
        try {
            setSubmitting(true)
            await apiMethods.files.deleteFile(folder._id)
            toast.success('Xóa thư mục thành công')
            onSuccess()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xóa thư mục')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                <div className="px-6 py-5 bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center"><Trash2 className="h-6 w-6 mr-2" /> Xóa Thư Mục</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"><X className="h-6 w-6" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <p className="text-sm font-semibold text-red-900">Cảnh báo:</p>
                        <p className="text-red-800 mt-2">
                            Bạn sắp xóa thư mục "<strong>{folder.originalName}</strong>".
                            Hành động này không thể hoàn tác.
                        </p>
                    </div>
                    <div className="flex items-center justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={submitting}
                            className="inline-flex items-center px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl"
                        >
                            {submitting ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Đang xóa...</> : 'Xóa'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const FolderActions = ({ folder, onRenameClick, onDeleteClick }) => {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onRenameClick(folder)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Đổi tên"
            >
                <Edit2 className="h-5 w-5" />
            </button>
            <button
                onClick={() => onDeleteClick(folder)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Xóa"
            >
                <Trash2 className="h-5 w-5" />
            </button>
        </div>
    )
}

export { MoveEvidenceModal, RenameFolderModal, DeleteFolderModal, FolderActions }