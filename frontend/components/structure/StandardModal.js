import { useState, useEffect } from 'react'
import { X, Save, Target, BookOpen, Building2, Info, ListOrdered, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function StandardModal({ standard, programs, organizations, departments, onClose, onSuccess }) {
    const isViewMode = standard?.isViewMode || false;
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        programId: '',
        organizationId: '',
        departmentId: '',
        order: 1,
        objectives: '',
        status: 'active'
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (standard) {
            setFormData({
                name: standard.name || '',
                code: standard.code || '',
                programId: standard.programId?._id || standard.programId || '',
                organizationId: standard.organizationId?._id || standard.organizationId || '',
                departmentId: standard.departmentId?._id || standard.departmentId || '',
                order: standard.order || 1,
                objectives: standard.objectives || '',
                status: standard.status || 'active'
            })
        }
    }, [standard])

    const handleChange = (e) => {
        if (isViewMode) return;
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

        if (!formData.departmentId) {
            newErrors.departmentId = 'Phòng ban là bắt buộc'
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

            const submitData = {
                ...formData,
                code: formData.code.padStart(2, '0')
            }

            if (standard && !standard.isViewMode) {
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Target className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {isViewMode ? 'Chi tiết tiêu chuẩn' : (standard ? 'Chỉnh sửa tiêu chuẩn' : 'Thêm tiêu chuẩn mới')}
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    {isViewMode ? 'Thông tin chi tiết tiêu chuẩn đánh giá' : (standard ? 'Cập nhật thông tin tiêu chuẩn đánh giá' : 'Tạo tiêu chuẩn đánh giá mới')}
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
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                                <span className="text-white text-xs">1</span>
                            </div>
                            Mã tiêu chuẩn <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            disabled={!!standard || isViewMode}
                            readOnly={isViewMode}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                errors.code ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-white'
                            } ${standard || isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="VD: 1, 01"
                        />
                        {errors.code && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <Info size={14} className="mr-1" />
                                {errors.code}
                            </p>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-100 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <div className="w-6 h-6 bg-sky-500 rounded-lg flex items-center justify-center mr-2">
                                <span className="text-white text-xs">2</span>
                            </div>
                            Tên tiêu chuẩn <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={isViewMode}
                            readOnly={isViewMode}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                                errors.name ? 'border-red-300 bg-red-50' : 'border-sky-200 bg-white'
                            } ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Nhập tên tiêu chuẩn"
                        />
                        {errors.name && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <Info size={14} className="mr-1" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                                <BookOpen className="w-5 h-5 text-indigo-500 mr-2" />
                                Chương trình <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                name="programId"
                                value={formData.programId}
                                onChange={handleChange}
                                disabled={!!standard || isViewMode}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                    errors.programId ? 'border-red-300 bg-red-50' : 'border-indigo-200 bg-white'
                                } ${standard || isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Chọn chương trình</option>
                                {programs.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                            {errors.programId && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <Info size={14} className="mr-1" />
                                    {errors.programId}
                                </p>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-teal-50 to-green-50 border border-teal-100 rounded-xl p-5">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                                <Building2 className="w-5 h-5 text-teal-500 mr-2" />
                                Tổ chức <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                name="organizationId"
                                value={formData.organizationId}
                                onChange={handleChange}
                                disabled={!!standard || isViewMode}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                                    errors.organizationId ? 'border-red-300 bg-red-50' : 'border-teal-200 bg-white'
                                } ${standard || isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Chọn tổ chức</option>
                                {organizations.map(o => (
                                    <option key={o._id} value={o._id}>{o.name}</option>
                                ))}
                            </select>
                            {errors.organizationId && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <Info size={14} className="mr-1" />
                                    {errors.organizationId}
                                </p>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-5">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                                <Briefcase className="w-5 h-5 text-gray-500 mr-2" />
                                Phòng ban <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                name="departmentId"
                                value={formData.departmentId}
                                onChange={handleChange}
                                disabled={!!standard || isViewMode}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all ${
                                    errors.departmentId ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                } ${standard || isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Chọn phòng ban</option>
                                {departments.map(d => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                            </select>
                            {errors.departmentId && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <Info size={14} className="mr-1" />
                                    {errors.departmentId}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 rounded-xl p-5">
                        <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                            <Target className="w-5 h-5 text-cyan-500 mr-2" />
                            Mục tiêu
                        </label>
                        <textarea
                            name="objectives"
                            value={formData.objectives}
                            onChange={handleChange}
                            rows={4}
                            disabled={isViewMode}
                            readOnly={isViewMode}
                            className={`w-full px-4 py-3 border-2 border-cyan-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all resize-none ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Nhập mục tiêu của tiêu chuẩn"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                                <ListOrdered className="w-5 h-5 text-indigo-500 mr-2" />
                                Thứ tự
                            </label>
                            <input
                                type="number"
                                name="order"
                                value={formData.order}
                                onChange={handleChange}
                                min="1"
                                disabled={isViewMode}
                                readOnly={isViewMode}
                                className={`w-full px-4 py-3 border-2 border-indigo-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            />
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-5">
                            <label className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                                <div className="w-6 h-6 bg-gray-500 rounded-lg flex items-center justify-center mr-2">
                                    <span className="text-white text-xs">3</span>
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
                                <option value="inactive">⏸️ Không hoạt lập</option>
                                <option value="archived">📦 Lưu trữ</option>
                            </select>
                        </div>
                    </div>
                </form>

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
                                    <span>Lưu tiêu chuẩn</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}