import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, Info, CheckSquare, Sparkles, FolderOpen, Code, FileText, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function CriteriaModal({ criteria, standards, programs, onClose, onSuccess }) {
    const isViewMode = criteria?.isViewMode || false;
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        standardId: '',
        requirements: '',
        guidelines: '',
        indicators: [],
        status: 'active',
        autoGenerateCode: true
    })
    const [errors, setErrors] = useState({})
    const [selectedStandard, setSelectedStandard] = useState(null)

    useEffect(() => {
        if (criteria) {
            setFormData({
                name: criteria.name || '',
                code: criteria.code || '',
                standardId: criteria.standardId?._id || criteria.standardId || '',
                requirements: criteria.requirements || '',
                guidelines: criteria.guidelines || '',
                indicators: criteria.indicators || [],
                status: criteria.status || 'active',
                autoGenerateCode: false
            })

            if (criteria.standardId) {
                const standard = standards.find(s =>
                    s._id === (criteria.standardId?._id || criteria.standardId)
                )
                setSelectedStandard(standard)
            }
        }
    }, [criteria, standards])

    const handleChange = (e) => {
        if (isViewMode) return;
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleStandardChange = (e) => {
        if (isViewMode) return;
        const standardId = e.target.value
        const standard = standards.find(s => s._id === standardId)

        setSelectedStandard(standard)
        setFormData(prev => ({
            ...prev,
            standardId,
            code: criteria ? prev.code : ''
        }))

        if (errors.standardId) {
            setErrors(prev => ({ ...prev, standardId: '' }))
        }
    }

    const handleCodeChange = (e) => {
        if (isViewMode) return;
        let value = e.target.value
        value = value.replace(/[^\d]/g, '')
        if (value.length > 2) {
            value = value.slice(0, 2)
        }
        setFormData(prev => ({ ...prev, code: value }))
        if (errors.code) {
            setErrors(prev => ({ ...prev, code: '' }))
        }
    }

    const addIndicator = () => {
        if (isViewMode) return;
        setFormData(prev => ({
            ...prev,
            indicators: [
                ...prev.indicators,
                {
                    name: '',
                    description: '',
                    measurementMethod: '',
                    targetValue: '',
                    unit: ''
                }
            ]
        }))
    }

    const removeIndicator = (index) => {
        if (isViewMode) return;
        setFormData(prev => ({
            ...prev,
            indicators: prev.indicators.filter((_, i) => i !== index)
        }))
    }

    const updateIndicator = (index, field, value) => {
        if (isViewMode) return;
        setFormData(prev => ({
            ...prev,
            indicators: prev.indicators.map((ind, i) =>
                i === index ? { ...ind, [field]: value } : ind
            )
        }))
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Tên tiêu chí là bắt buộc'
        }

        if (!formData.standardId) {
            newErrors.standardId = 'Tiêu chuẩn là bắt buộc'
        }

        if (!formData.autoGenerateCode && formData.code && !/^\d{1,2}$/.test(formData.code)) {
            newErrors.code = 'Mã phải là số từ 1-99'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (isViewMode) {
            onClose();
            return;
        }

        if (!validate()) return

        try {
            setLoading(true)

            if (criteria && !criteria.isViewMode) {
                await apiMethods.criteria.update(criteria._id, formData)
                toast.success('Cập nhật tiêu chí thành công')
            } else {
                await apiMethods.criteria.create(formData)
                toast.success('Tạo tiêu chí thành công')
            }

            onSuccess()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header với gradient - Xanh Lam */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <CheckSquare className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {isViewMode ? 'Chi tiết tiêu chí' : (criteria ? 'Chỉnh sửa tiêu chí' : 'Thêm tiêu chí mới')}
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    {isViewMode ? 'Thông tin chi tiết tiêu chí đánh giá' : (criteria ? 'Cập nhật thông tin tiêu chí đánh giá' : 'Tạo tiêu chí đánh giá mới')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all flex items-center justify-center text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                    {/* Tiêu chuẩn - Gradient Blue/Indigo */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                                <span className="text-white text-xs">1</span>
                            </div>
                            Tiêu chuẩn <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                            name="standardId"
                            value={formData.standardId}
                            onChange={handleStandardChange}
                            disabled={!!criteria || isViewMode}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                errors.standardId ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-white'
                            } ${criteria || isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                            <option value="">Chọn tiêu chuẩn</option>
                            {standards.map(s => (
                                <option key={s._id} value={s._id}>
                                    {s.code} - {s.name}
                                </option>
                            ))}
                        </select>
                        {errors.standardId && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <Info size={14} className="mr-1" />
                                {errors.standardId}
                            </p>
                        )}
                    </div>

                    {/* Mã tiêu chí - Gradient Indigo/Purple */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center mr-2">
                                <span className="text-white text-xs">2</span>
                            </div>
                            Mã tiêu chí {!formData.autoGenerateCode && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {!criteria && !isViewMode && (
                            <div className="flex items-center gap-3 mb-3 p-3 bg-white rounded-lg border border-indigo-200">
                                <input
                                    type="checkbox"
                                    id="autoGenerateCode"
                                    checked={formData.autoGenerateCode}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        autoGenerateCode: e.target.checked,
                                        code: e.target.checked ? '' : prev.code
                                    }))}
                                    className="w-5 h-5 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="autoGenerateCode" className="text-sm text-gray-700 cursor-pointer flex items-center">
                                    <Sparkles size={16} className="mr-2 text-indigo-500" />
                                    Tự động tạo mã tiêu chí
                                </label>
                            </div>
                        )}

                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleCodeChange}
                            disabled={!!criteria || formData.autoGenerateCode || isViewMode}
                            readOnly={isViewMode}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                errors.code ? 'border-red-300 bg-red-50' : 'border-indigo-200 bg-white'
                            } ${criteria || formData.autoGenerateCode || isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder={formData.autoGenerateCode ? "Sẽ tự động tạo" : "VD: 1, 01, 12"}
                        />
                        {errors.code && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <Info size={14} className="mr-1" />
                                {errors.code}
                            </p>
                        )}
                        {formData.autoGenerateCode && !criteria && !isViewMode && (
                            <p className="mt-2 text-sm text-indigo-600 flex items-center bg-indigo-100 p-2 rounded-lg">
                                <Info size={14} className="mr-2 flex-shrink-0" />
                                Mã sẽ tự động tăng dần dựa trên tiêu chí cuối cùng của tiêu chuẩn đã chọn
                            </p>
                        )}
                    </div>

                    {/* Tên tiêu chí - Gradient Purple/Pink */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mr-2">
                                <span className="text-white text-xs">3</span>
                            </div>
                            Tên tiêu chí <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isViewMode}
                            readOnly={isViewMode}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                                errors.name ? 'border-red-300 bg-red-50' : 'border-purple-200 bg-white'
                            } ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Nhập tên tiêu chí"
                        />
                        {errors.name && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <Info size={14} className="mr-1" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Yêu cầu - Gradient Teal/Cyan */}
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <FileText className="w-5 h-5 text-teal-500 mr-2" />
                            Yêu cầu
                        </label>
                        <textarea
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleChange}
                            rows={3}
                            disabled={isViewMode}
                            readOnly={isViewMode}
                            className={`w-full px-4 py-3 border-2 border-teal-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Nhập yêu cầu của tiêu chí"
                        />
                    </div>

                    {/* Hướng dẫn - Gradient Amber/Orange */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <Globe className="w-5 h-5 text-amber-500 mr-2" />
                            Hướng dẫn
                        </label>
                        <textarea
                            name="guidelines"
                            value={formData.guidelines}
                            onChange={handleChange}
                            rows={3}
                            disabled={isViewMode}
                            readOnly={isViewMode}
                            className={`w-full px-4 py-3 border-2 border-amber-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Nhập hướng dẫn đánh giá tiêu chí"
                        />
                    </div>

                    {/* Trạng thái - Gradient Gray */}
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <div className="w-6 h-6 bg-gray-500 rounded-lg flex items-center justify-center mr-2">
                                <span className="text-white text-xs">4</span>
                            </div>
                            Trạng thái
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled={isViewMode}
                            className={`w-full px-4 py-3 border-2 border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                            <option value="active">✅ Hoạt động</option>
                            <option value="draft">📝 Nháp</option>
                            <option value="inactive">⏸️ Không hoạt động</option>
                            <option value="archived">📦 Lưu trữ</option>
                        </select>
                    </div>

                    {/* Indicators */}
                    <div className="border-t-2 border-dashed border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                                    <CheckSquare className="w-5 h-5 text-white" />
                                </div>
                                Chỉ số đánh giá
                            </h3>
                            {!isViewMode && (
                                <button
                                    type="button"
                                    onClick={addIndicator}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium"
                                >
                                    <Plus size={18} />
                                    Thêm chỉ số
                                </button>
                            )}
                        </div>

                        {formData.indicators.length === 0 ? (
                            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-dashed border-gray-300">
                                <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-sm">
                                    Chưa có chỉ số đánh giá nào.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.indicators.map((indicator, index) => (
                                    <div key={index} className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">{index + 1}</span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-800">
                                                    Chỉ số {index + 1}
                                                </span>
                                            </div>
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeIndicator(index)}
                                                    className="w-8 h-8 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-all flex items-center justify-center"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <input
                                                    type="text"
                                                    value={indicator.name}
                                                    onChange={(e) => updateIndicator(index, 'name', e.target.value)}
                                                    placeholder="Tên chỉ số"
                                                    disabled={isViewMode}
                                                    readOnly={isViewMode}
                                                    className={`w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm bg-white ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <input
                                                    type="text"
                                                    value={indicator.description}
                                                    onChange={(e) => updateIndicator(index, 'description', e.target.value)}
                                                    placeholder="Mô tả chỉ số"
                                                    disabled={isViewMode}
                                                    readOnly={isViewMode}
                                                    className={`w-full px-4 py-2.5 border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <input
                                                    type="text"
                                                    value={indicator.measurementMethod}
                                                    onChange={(e) => updateIndicator(index, 'measurementMethod', e.target.value)}
                                                    placeholder="Phương pháp đo"
                                                    disabled={isViewMode}
                                                    readOnly={isViewMode}
                                                    className={`w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm bg-white ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={indicator.targetValue}
                                                    onChange={(e) => updateIndicator(index, 'targetValue', e.target.value)}
                                                    placeholder="Giá trị mục tiêu"
                                                    disabled={isViewMode}
                                                    readOnly={isViewMode}
                                                    className={`w-full px-4 py-2.5 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm bg-white ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={indicator.unit}
                                                    onChange={(e) => updateIndicator(index, 'unit', e.target.value)}
                                                    placeholder="Đơn vị"
                                                    disabled={isViewMode}
                                                    readOnly={isViewMode}
                                                    className={`w-full px-4 py-2.5 border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm bg-white ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-4 p-6 border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-50 font-medium"
                    >
                        {isViewMode ? 'Đóng' : 'Hủy'}
                    </button>
                    {!isViewMode && (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-medium"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Đang lưu...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>Lưu tiêu chí</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}