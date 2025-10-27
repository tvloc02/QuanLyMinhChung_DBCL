import { useState, useEffect } from 'react'
import { X, ArrowRightLeft, Sparkles, Loader2, Zap } from 'lucide-react'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                                <ArrowRightLeft className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">
                                Di chuyển minh chứng
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Current Evidence Info */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-2">
                                <Sparkles className="h-4 w-4 text-indigo-600" />
                            </div>
                            Minh chứng hiện tại
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">Mã minh chứng</p>
                                <p className="font-mono text-sm font-semibold text-indigo-600">
                                    {evidence.code}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">Tên</p>
                                <p className="text-sm text-gray-900 font-medium truncate">
                                    {evidence.name}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">Tiêu chuẩn</p>
                                <p className="text-sm text-gray-900 truncate">
                                    {evidence.standardId?.code} - {evidence.standardId?.name}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">Tiêu chí</p>
                                <p className="text-sm text-gray-900 truncate">
                                    {evidence.criteriaId?.code} - {evidence.criteriaId?.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Target Selection */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                                <ArrowRightLeft className="h-4 w-4 text-purple-600" />
                            </div>
                            Di chuyển đến
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu chuẩn đích <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="targetStandardId"
                                value={formData.targetStandardId}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all ${
                                    errors.targetStandardId ? 'border-red-500 bg-red-50' : 'border-gray-200'
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
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <X className="h-4 w-4 mr-1" />
                                    {errors.targetStandardId}
                                </p>
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
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all ${
                                    errors.targetCriteriaId ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                } ${!formData.targetStandardId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Chọn tiêu chí</option>
                                {criteria.map(criterion => (
                                    <option key={criterion._id} value={criterion._id}>
                                        {criterion.code} - {criterion.name}
                                    </option>
                                ))}
                            </select>
                            {errors.targetCriteriaId && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <X className="h-4 w-4 mr-1" />
                                    {errors.targetCriteriaId}
                                </p>
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
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all ${
                                    errors.newCode ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                } ${autoGenerateCode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            />
                            {errors.newCode && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <X className="h-4 w-4 mr-1" />
                                    {errors.newCode}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-yellow-900 mb-1">Lưu ý quan trọng</p>
                                <p className="text-sm text-yellow-800">
                                    Khi di chuyển minh chứng, mã minh chứng sẽ được thay đổi. Vui lòng kiểm tra kỹ trước khi thực hiện.
                                </p>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all font-medium"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Đang di chuyển...</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-5 h-5" />
                                <span>Di chuyển</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}