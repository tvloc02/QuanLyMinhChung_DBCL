import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function ProgramModal({ program, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        applicableYear: new Date().getFullYear(),
        effectiveDate: '',
        expiryDate: '',
        objectives: '',
        status: 'draft'
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (program) {
            setFormData({
                name: program.name || '',
                code: program.code || '',
                applicableYear: program.applicableYear || new Date().getFullYear(),
                effectiveDate: program.effectiveDate ? program.effectiveDate.split('T')[0] : '',
                expiryDate: program.expiryDate ? program.expiryDate.split('T')[0] : '',
                objectives: program.objectives || '',
                status: program.status || 'draft'
            })
        }
    }, [program])

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
            newErrors.name = 'Tên chương trình là bắt buộc'
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Mã chương trình là bắt buộc'
        } else if (!/^[A-Z0-9\-_]+$/.test(formData.code)) {
            newErrors.code = 'Mã chỉ được chứa chữ hoa, số, gạch ngang và gạch dưới'
        }

        if (formData.effectiveDate && formData.expiryDate) {
            if (new Date(formData.expiryDate) <= new Date(formData.effectiveDate)) {
                newErrors.expiryDate = 'Ngày hết hạn phải sau ngày hiệu lực'
            }
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
                code: formData.code.toUpperCase()
            }

            if (program) {
                await apiMethods.programs.update(program._id, submitData)
                toast.success('Cập nhật chương trình thành công')
            } else {
                await apiMethods.programs.create(submitData)
                toast.success('Tạo chương trình thành công')
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
                        {program ? 'Chỉnh sửa chương trình' : 'Thêm chương trình mới'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã chương trình <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                disabled={!!program}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.code ? 'border-red-500' : 'border-gray-300'
                                } ${program ? 'bg-gray-100' : ''}`}
                                placeholder="VD: DGCL-DH"
                            />
                            {errors.code && (
                                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Năm áp dụng
                            </label>
                            <input
                                type="number"
                                name="applicableYear"
                                value={formData.applicableYear}
                                onChange={handleChange}
                                min="2000"
                                max="2100"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tên chương trình <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập tên chương trình"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày hiệu lực
                            </label>
                            <input
                                type="date"
                                name="effectiveDate"
                                value={formData.effectiveDate}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày hết hạn
                            </label>
                            <input
                                type="date"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.expiryDate && (
                                <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                            )}
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
                            placeholder="Nhập mục tiêu của chương trình"
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