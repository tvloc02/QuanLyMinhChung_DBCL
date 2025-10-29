import { useState, useEffect } from 'react'
import { X, Save, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function TaskModal({ task, onClose, onSuccess, criteriaId = null }) {
    const [loading, setLoading] = useState(false)
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])
    const [users, setUsers] = useState([])
    const [formData, setFormData] = useState({
        description: '',
        standardId: '',
        criteriaId: criteriaId || '',
        assignedTo: [],
        dueDate: ''
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        loadStandards()
        loadUsers()

        if (task) {
            setFormData({
                description: task.description || '',
                standardId: task.standardId?._id || task.standardId || '',
                criteriaId: task.criteriaId?._id || task.criteriaId || '',
                assignedTo: task.assignedTo?.map(u => u._id || u) || [],
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
            })
        }
    }, [task, criteriaId])

    useEffect(() => {
        if (formData.standardId) {
            loadCriteria(formData.standardId)
        }
    }, [formData.standardId])

    const loadStandards = async () => {
        try {
            const response = await apiMethods.standards.getAll({ status: 'active', limit: 100 })
            setStandards(response.data.data.standards || response.data.data || [])
        } catch (error) {
            console.error('Load standards error:', error)
        }
    }

    const loadCriteria = async (standardId) => {
        try {
            const response = await apiMethods.criteria.getByStandard?.(standardId) ||
                await apiMethods.criteria.getAll({ standardId, status: 'active', limit: 100 })
            const list = response.data.data.criteria || response.data.data || []
            setCriteria(list)
        } catch (error) {
            console.error('Load criteria error:', error)
        }
    }

    const loadUsers = async () => {
        try {
            const response = await apiMethods.users.getAll({ role: 'reporter', status: 'active', limit: 100 })
            setUsers(response.data.data || [])
        } catch (error) {
            console.error('Load users error:', error)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleAssignedToChange = (userId) => {
        setFormData(prev => ({
            ...prev,
            assignedTo: prev.assignedTo.includes(userId)
                ? prev.assignedTo.filter(id => id !== userId)
                : [...prev.assignedTo, userId]
        }))
        if (errors.assignedTo) {
            setErrors(prev => ({ ...prev, assignedTo: '' }))
        }
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.description.trim()) {
            newErrors.description = 'Mô tả là bắt buộc'
        }

        if (!formData.standardId) {
            newErrors.standardId = 'Tiêu chuẩn là bắt buộc'
        }

        if (!formData.criteriaId) {
            newErrors.criteriaId = 'Tiêu chí là bắt buộc'
        }

        if (formData.assignedTo.length === 0) {
            newErrors.assignedTo = 'Phải chọn ít nhất một người được giao'
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
                dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
            }

            if (task) {
                await apiMethods.tasks.update(task._id, submitData)
                toast.success('Cập nhật nhiệm vụ thành công')
            } else {
                await apiMethods.tasks.create(submitData)
                toast.success('Tạo nhiệm vụ thành công')
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <CheckSquare className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {task ? 'Chỉnh sửa nhiệm vụ' : 'Giao nhiệm vụ mới'}
                                </h2>
                                <p className="text-purple-100 text-sm">
                                    {task ? 'Cập nhật thông tin nhiệm vụ' : 'Giao việc báo cáo cho reporter'}
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

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-220px)]">
                    {/* Tiêu chuẩn */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Tiêu chuẩn <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="standardId"
                            value={formData.standardId}
                            onChange={handleChange}
                            disabled={!!task}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                                errors.standardId ? 'border-red-300 bg-red-50' : 'border-purple-200 bg-white'
                            } ${task ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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

                    {/* Tiêu chí */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Tiêu chí <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="criteriaId"
                            value={formData.criteriaId}
                            onChange={handleChange}
                            disabled={!!task || !formData.standardId}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                                errors.criteriaId ? 'border-red-300 bg-red-50' : 'border-purple-200 bg-white'
                            } ${task || !formData.standardId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                            <option value="">Chọn tiêu chí</option>
                            {criteria.map(c => (
                                <option key={c._id} value={c._id}>
                                    {c.code} - {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.criteriaId && <p className="mt-1 text-sm text-red-600">{errors.criteriaId}</p>}
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Mô tả <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none ${
                                errors.description ? 'border-red-300 bg-red-50' : 'border-purple-200 bg-white'
                            }`}
                            placeholder="Nhập mô tả chi tiết về nhiệm vụ"
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                    </div>

                    {/* Phân công */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Phân công cho <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-purple-200 rounded-xl p-4 bg-purple-50">
                            {users.length === 0 ? (
                                <p className="text-sm text-gray-500">Không có báo cáo viên nào</p>
                            ) : (
                                users.map(user => (
                                    <label key={user._id} className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.assignedTo.includes(user._id)}
                                            onChange={() => handleAssignedToChange(user._id)}
                                            className="w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">{user.fullName} ({user.email})</span>
                                    </label>
                                ))
                            )}
                        </div>
                        {errors.assignedTo && <p className="mt-1 text-sm text-red-600">{errors.assignedTo}</p>}
                    </div>

                    {/* Ngày hết hạn */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Ngày hết hạn
                        </label>
                        <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border-2 border-purple-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-4 p-6 border-t-2 border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-50 font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-medium"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang lưu...</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Lưu nhiệm vụ</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}