import { useState, useEffect } from 'react'
import { X, ArrowRightLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function MoveEvidenceModal({ evidence, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        targetStandardId: '',
        targetCriteriaId: '',
        newCode: ''
    })
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])
    const [errors, setErrors] = useState({})
    const [autoGenerateCode, setAutoGenerateCode] = useState(true)

    useEffect(() => {
        fetchStandards()
    }, [])

    useEffect(() => {
        if (formData.targetStandardId) {
            fetchCriteria()
        }
    }, [formData.targetStandardId])

    useEffect(() => {
        if (autoGenerateCode && formData.targetStandardId && formData.targetCriteriaId) {
            generateNewCode()
        }
    }, [formData.targetStandardId, formData.targetCriteriaId, autoGenerateCode])

    const fetchStandards = async () => {
        try {
            const response = await apiMethods.standards.getAll({
                programId: evidence.programId?._id || evidence.programId,
                organizationId: evidence.organizationId?._id || evidence.organizationId,
                status: 'active'
            })
            setStandards(response.data?.data?.standards || response.data?.data || [])
        } catch (error) {
            console.error('Fetch standards error:', error)
            toast.error('Lỗi khi tải danh sách tiêu chuẩn')
        }
    }

    const fetchCriteria = async () => {
        try {
            const response = await apiMethods.criteria.getAll({
                standardId: formData.targetStandardId,
                status: 'active'
            })
            const criteriaData = response.data?.data?.criterias ||
                response.data?.data?.criteria ||
                response.data?.data || []
            setCriteria(criteriaData)
        } catch (error) {
            console.error('Fetch criteria error:', error)
            toast.error('Lỗi khi tải danh sách tiêu chí')
        }
    }

    const generateNewCode = async () => {
        try {
            const standard = standards.find(s => s._id === formData.targetStandardId)
            const criterion = criteria.find(c => c._id === formData.targetCriteriaId)

            if (!standard || !criterion) return

            const response = await apiMethods.evidences.generateCode(
                standard.code,
                criterion.code
            )

            setFormData(prev => ({
                ...prev,
                newCode: response.data?.data?.code || response.data?.data
            }))
        } catch (error) {
            console.error('Generate code error:', error)
            // Fallback: tự generate
            const standard = standards.find(s => s._id === formData.targetStandardId)
            const criterion = criteria.find(c => c._id === formData.targetCriteriaId)
            if (standard && criterion) {
                const code = `H1.${standard.code.padStart(2, '0')}.${criterion.code.padStart(2, '0')}.01`
                setFormData(prev => ({ ...prev, newCode: code }))
            }
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.targetStandardId) {
            newErrors.targetStandardId = 'Vui lòng chọn tiêu chuẩn đích'
        }

        if (!formData.targetCriteriaId) {
            newErrors.targetCriteriaId = 'Vui lòng chọn tiêu chí đích'
        }

        if (!formData.newCode.trim()) {
            newErrors.newCode = 'Mã minh chứng mới là bắt buộc'
        } else if (!/^H\d+\.\d{2}\.\d{2}\.\d{2}$/.test(formData.newCode)) {
            newErrors.newCode = 'Mã minh chứng không đúng định dạng (VD: H1.01.02.04)'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) return

        try {
            setLoading(true)

            const response = await apiMethods.evidences.move(
                evidence._id,
                formData.targetStandardId,
                formData.targetCriteriaId,
                formData.newCode
            )

            if (response.data?.success) {
                toast.success('Di chuyển minh chứng thành công')
                onSuccess()
            }
        } catch (error) {
            console.error('Move evidence error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi di chuyển minh chứng')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        <ArrowRightLeft className="h-5 w-5 inline mr-2" />
                        Di chuyển minh chứng
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Current Evidence Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Minh chứng hiện tại</h3>
                        <div className="space-y-1 text-sm">
                            <p>
                                <span className="text-gray-600">Mã:</span>{' '}
                                <span className="font-mono text-blue-600">{evidence.code}</span>
                            </p>
                            <p>
                                <span className="text-gray-600">Tên:</span>{' '}
                                <span className="text-gray-900">{evidence.name}</span>
                            </p>
                            <p>
                                <span className="text-gray-600">Tiêu chuẩn:</span>{' '}
                                <span className="text-gray-900">
                                    {evidence.standardId?.code} - {evidence.standardId?.name}
                                </span>
                            </p>
                            <p>
                                <span className="text-gray-600">Tiêu chí:</span>{' '}
                                <span className="text-gray-900">
                                    {evidence.criteriaId?.code} - {evidence.criteriaId?.name}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Target Selection */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">Di chuyển đến</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu chuẩn đích <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="targetStandardId"
                                value={formData.targetStandardId}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.targetStandardId ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Chọn tiêu chuẩn</option>
                                {standards.map(standard => (
                                    <option key={standard._id} value={standard._id}>
                                        {standard.code} - {standard.name}
                                    </option>
                                ))}
                            </select>
                            {errors.targetStandardId && (
                                <p className="mt-1 text-sm text-red-600">{errors.targetStandardId}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu chí đích <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="targetCriteriaId"
                                value={formData.targetCriteriaId}
                                onChange={handleChange}
                                disabled={!formData.targetStandardId}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.targetCriteriaId ? 'border-red-500' : 'border-gray-300'
                                } ${!formData.targetStandardId ? 'bg-gray-100' : ''}`}
                            >
                                <option value="">Chọn tiêu chí</option>
                                {criteria.map(criterion => (
                                    <option key={criterion._id} value={criterion._id}>
                                        {criterion.code} - {criterion.name}
                                    </option>
                                ))}
                            </select>
                            {errors.targetCriteriaId && (
                                <p className="mt-1 text-sm text-red-600">{errors.targetCriteriaId}</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Mã minh chứng mới <span className="text-red-500">*</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={autoGenerateCode}
                                        onChange={(e) => setAutoGenerateCode(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <span>Tự động tạo mã</span>
                                </label>
                            </div>
                            <input
                                type="text"
                                name="newCode"
                                value={formData.newCode}
                                onChange={handleChange}
                                disabled={autoGenerateCode}
                                placeholder="VD: H1.01.02.04"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.newCode ? 'border-red-500' : 'border-gray-300'
                                } ${autoGenerateCode ? 'bg-gray-100' : ''}`}
                            />
                            {errors.newCode && (
                                <p className="mt-1 text-sm text-red-600">{errors.newCode}</p>
                            )}
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Lưu ý:</strong> Khi di chuyển minh chứng, mã minh chứng sẽ được thay đổi.
                            Vui lòng kiểm tra kỹ trước khi thực hiện.
                        </p>
                    </div>
                </form>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang di chuyển...</span>
                            </>
                        ) : (
                            <>
                                <ArrowRightLeft size={18} />
                                <span>Di chuyển</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}