import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function CriteriaModal({ criteria, standards, programs, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        standardId: '',
        order: 1,
        weight: '',
        type: 'mandatory',
        requirements: '',
        guidelines: '',
        indicators: [],
        status: 'draft'
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (criteria) {
            setFormData({
                name: criteria.name || '',
                code: criteria.code || '',
                description: criteria.description || '',
                standardId: criteria.standardId?._id || criteria.standardId || '',
                order: criteria.order || 1,
                weight: criteria.weight || '',
                type: criteria.type || 'mandatory',
                requirements: criteria.requirements || '',
                guidelines: criteria.guidelines || '',
                indicators: criteria.indicators || [],
                status: criteria.status || 'draft'
            })
        }
    }, [criteria])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const addIndicator = () => {
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
        setFormData(prev => ({
            ...prev,
            indicators: prev.indicators.filter((_, i) => i !== index)
        }))
    }

    const updateIndicator = (index, field, value) => {
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

        if (!formData.code.trim()) {
            newErrors.code = 'Mã tiêu chí là bắt buộc'
        } else if (!/^\d{1,2}$/.test(formData.code)) {
            newErrors.code = 'Mã phải là 1-2 chữ số'
        }

        if (!formData.standardId) {
            newErrors.standardId = 'Tiêu chuẩn là bắt buộc'
        }

        if (formData.weight && (formData.weight < 0 || formData.weight > 100)) {
            newErrors.weight = 'Trọng số phải từ 0-100'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) return

        try {
            setLoading(true)

            const submitData = {
                ...formData,
                code: formData.code.padStart(2, '0')
            }

            if (criteria) {
                await apiMethods.criteria.update(criteria._id, submitData)
                toast.success('Cập nhật tiêu chí thành công')
            } else {
                await apiMethods.criteria.create(submitData)
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        {criteria ? 'Chỉnh sửa tiêu chí' : 'Thêm tiêu chí mới'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã tiêu chí <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                disabled={!!criteria}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.code ? 'border-red-500' : 'border-gray-300'
                                } ${criteria ? 'bg-gray-100' : ''}`}
                                placeholder="VD: 1, 01"
                            />
                            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thứ tự
                            </label>
                            <input
                                type="number"
                                name="order"
                                value={formData.order}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trọng số (%)
                            </label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.weight ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0-100"
                            />
                            {errors.weight && <p className="mt-1 text-sm text-red-600">{errors.weight}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loại <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="mandatory">Bắt buộc</option>
                                <option value="optional">Tùy chọn</option>
                                <option value="conditional">Có điều kiện</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tên tiêu chí <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập tên tiêu chí"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mô tả
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập mô tả về tiêu chí"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu chuẩn <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="standardId"
                                value={formData.standardId}
                                onChange={handleChange}
                                disabled={!!criteria}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.standardId ? 'border-red-500' : 'border-gray-300'
                                } ${criteria ? 'bg-gray-100' : ''}`}
                            >
                                <option value="">Chọn tiêu chuẩn</option>
                                {standards.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.code} - {s.name}
                                    </option>
                                ))}
                            </select>
                            {errors.standardId && <p className="mt-1 text-sm text-red-600">{errors.standardId}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="draft">Nháp</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                                <option value="archived">Lưu trữ</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Yêu cầu
                        </label>
                        <textarea
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập yêu cầu của tiêu chí"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hướng dẫn đánh giá
                        </label>
                        <textarea
                            name="guidelines"
                            value={formData.guidelines}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập hướng dẫn đánh giá"
                        />
                    </div>

                    {/* Indicators */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Chỉ số đánh giá</h3>
                            <button
                                type="button"
                                onClick={addIndicator}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                            >
                                <Plus size={16} />
                                Thêm chỉ số
                            </button>
                        </div>

                        {formData.indicators.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">
                                Chưa có chỉ số đánh giá nào. Click "Thêm chỉ số" để thêm mới.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {formData.indicators.map((indicator, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-sm font-semibold text-gray-700">
                                                Chỉ số {index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeIndicator(index)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="md:col-span-2">
                                                <input
                                                    type="text"
                                                    value={indicator.name}
                                                    onChange={(e) => updateIndicator(index, 'name', e.target.value)}
                                                    placeholder="Tên chỉ số"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <input
                                                    type="text"
                                                    value={indicator.description}
                                                    onChange={(e) => updateIndicator(index, 'description', e.target.value)}
                                                    placeholder="Mô tả chỉ số"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <input
                                                    type="text"
                                                    value={indicator.measurementMethod}
                                                    onChange={(e) => updateIndicator(index, 'measurementMethod', e.target.value)}
                                                    placeholder="Phương pháp đo"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={indicator.targetValue}
                                                    onChange={(e) => updateIndicator(index, 'targetValue', e.target.value)}
                                                    placeholder="Giá trị mục tiêu"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={indicator.unit}
                                                    onChange={(e) => updateIndicator(index, 'unit', e.target.value)}
                                                    placeholder="Đơn vị"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                <span>Đang lưu...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Lưu</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}