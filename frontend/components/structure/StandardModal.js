import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function StandardModal({ standard, programs, organizations, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        programId: '',
        organizationId: '',
        order: 1,
        weight: '',
        objectives: '',
        guidelines: '',
        status: 'draft'
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (standard) {
            setFormData({
                name: standard.name || '',
                code: standard.code || '',
                description: standard.description || '',
                programId: standard.programId?._id || standard.programId || '',
                organizationId: standard.organizationId?._id || standard.organizationId || '',
                order: standard.order || 1,
                weight: standard.weight || '',
                objectives: standard.objectives || '',
                guidelines: standard.guidelines || '',
                status: standard.status || 'draft'
            })
        }
    }, [standard])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Tên tiêu chuẩn là bắt buộc'
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Mã tiêu chuẩn là bắt buộc'
        } else if (!/^\d{1,2}$/.test(formData.code)) {
            newErrors.code = 'Mã phải là 1-2 chữ số'
        }

        if (!formData.programId) {
            newErrors.programId = 'Chương trình là bắt buộc'
        }

        if (!formData.organizationId) {
            newErrors.organizationId = 'Tổ chức là bắt buộc'
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

            if (standard) {
                await apiMethods.standards.update(standard._id, submitData)
                toast.success('Cập nhật tiêu chuẩn thành công')
            } else {
                await apiMethods.standards.create(submitData)
                toast.success('Tạo tiêu chuẩn thành công')
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
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        {standard ? 'Chỉnh sửa tiêu chuẩn' : 'Thêm tiêu chuẩn mới'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã tiêu chuẩn <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                disabled={!!standard}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.code ? 'border-red-500' : 'border-gray-300'
                                } ${standard ? 'bg-gray-100' : ''}`}
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tên tiêu chuẩn <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập tên tiêu chuẩn"
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
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập mô tả về tiêu chuẩn"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chương trình <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="programId"
                                value={formData.programId}
                                onChange={handleChange}
                                disabled={!!standard}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.programId ? 'border-red-500' : 'border-gray-300'
                                } ${standard ? 'bg-gray-100' : ''}`}
                            >
                                <option value="">Chọn chương trình</option>
                                {programs.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                            {errors.programId && <p className="mt-1 text-sm text-red-600">{errors.programId}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tổ chức <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="organizationId"
                                value={formData.organizationId}
                                onChange={handleChange}
                                disabled={!!standard}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.organizationId ? 'border-red-500' : 'border-gray-300'
                                } ${standard ? 'bg-gray-100' : ''}`}
                            >
                                <option value="">Chọn tổ chức</option>
                                {organizations.map(o => (
                                    <option key={o._id} value={o._id}>{o.name}</option>
                                ))}
                            </select>
                            {errors.organizationId && <p className="mt-1 text-sm text-red-600">{errors.organizationId}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mục tiêu
                        </label>
                        <textarea
                            name="objectives"
                            value={formData.objectives}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập mục tiêu của tiêu chuẩn"
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
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập hướng dẫn đánh giá"
                        />
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