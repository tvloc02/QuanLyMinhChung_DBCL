import { useState, useEffect } from 'react'
import { X, Save, CheckSquare, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { apiMethods } from '../../services/api'

// Khai báo các màu mới (Blue/Cyan/Indigo)
const PRIMARY_COLOR = 'indigo-600';
const SECONDARY_COLOR = 'blue-600';
const RING_COLOR = 'blue-500';
const BORDER_COLOR = 'blue-200';
const BG_LIGHT_COLOR = 'blue-50';
const TEXT_COLOR = 'blue-700';

export default function TaskModal({ task, onClose, onSuccess, criteriaId = null, standardId = null, programId = null, organizationId = null }) {
    const [loading, setLoading] = useState(false)
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])
    const [users, setUsers] = useState([])
    const [displayUsers, setDisplayUsers] = useState([])
    const [userSearch, setUserSearch] = useState('')
    const [formData, setFormData] = useState({
        description: '',
        programId: programId || '',
        organizationId: organizationId || '',
        standardId: standardId || '',
        criteriaId: criteriaId || '',
        assignedTo: [],
        dueDate: '',
        reportType: 'criteria'
    })
    const [errors, setErrors] = useState({})

    useEffect(() => {
        loadPrograms()
        loadOrganizations()
        loadUsers()

        if (task) {
            setFormData({
                description: task.description || '',
                programId: task.programId?._id || task.programId || '',
                organizationId: task.organizationId?._id || task.organizationId || '',
                standardId: task.standardId?._id || task.standardId || '',
                criteriaId: task.criteriaId?._id || task.criteriaId || '',
                assignedTo: task.assignedTo?.map(u => u._id || u) || [],
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                reportType: task.reportType || 'criteria'
            })
        }
    }, [task, criteriaId, standardId, programId, organizationId])

    useEffect(() => {
        // Tải Standards khi Program và Organization thay đổi
        if (formData.programId && formData.organizationId) {
            loadStandards()
        } else {
            setStandards([])
            setFormData(prev => ({ ...prev, standardId: '', criteriaId: '' }))
        }
    }, [formData.programId, formData.organizationId])

    useEffect(() => {
        // Tải Criteria khi Standard thay đổi
        if (formData.standardId) {
            loadCriteria(formData.standardId)
        } else {
            setCriteria([])
            setFormData(prev => ({ ...prev, criteriaId: '' }))
        }
    }, [formData.standardId])

    useEffect(() => {
        if (userSearch.trim()) {
            const filtered = users.filter(u =>
                u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.email.toLowerCase().includes(userSearch.toLowerCase())
            )
            setDisplayUsers(filtered.slice(0, 5))
        } else {
            setDisplayUsers(users.slice(0, 5))
        }
    }, [userSearch, users])

    const loadPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll({ limit: 100 })
            setPrograms(response.data.data.programs || response.data.data || [])
        } catch (error) {
            console.error('Load programs error:', error)
        }
    }

    const loadOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll({ limit: 100 })
            setOrganizations(response.data.data.organizations || response.data.data || [])
        } catch (error) {
            console.error('Load organizations error:', error)
        }
    }

    const loadStandards = async () => {
        try {
            const response = await apiMethods.standards.getAll({
                programId: formData.programId,
                organizationId: formData.organizationId,
                status: 'active',
                limit: 100
            })
            setStandards(response.data.data.standards || response.data.data || [])
        } catch (error) {
            console.error('Load standards error:', error)
        }
    }

    const loadCriteria = async (standardId) => {
        try {
            const response = await apiMethods.criteria.getAll({
                standardId,
                status: 'active',
                limit: 100
            })
            const list = response.data.data.criterias || response.data.data.criteria || response.data.data || []
            setCriteria(list)
        } catch (error) {
            console.error('Load criteria error:', error)
        }
    }

    const loadUsers = async () => {
        try {
            const response = await apiMethods.users.getAll({
                params: { limit: 100 }
            })
            let userList = response.data.data || []

            if (Array.isArray(userList) && userList.length > 0 && userList[0]?.users) {
                userList = userList[0].users
            } else if (userList && userList.users) {
                userList = userList.users
            }

            if (!Array.isArray(userList)) {
                userList = []
            }

            userList = userList.filter(u => u.role === 'reporter' && u.status === 'active')
            setUsers(userList)
            setDisplayUsers(userList.slice(0, 5))
        } catch (error) {
            console.error('Load users error:', error)
            setUsers([])
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target

        setFormData(prev => {
            const newState = { ...prev, [name]: value };

            if (name === 'programId' || name === 'organizationId') {
                newState.standardId = '';
                newState.criteriaId = '';
            } else if (name === 'standardId') {
                newState.criteriaId = '';
            }

            // Nếu chuyển loại báo cáo sang non-criteria, xóa criteriaId
            if (name === 'reportType') {
                if (value !== 'criteria') {
                    newState.criteriaId = '';
                }

                // Nếu chuyển sang overall_tdg, xóa standardId
                if (value === 'overall_tdg') {
                    newState.standardId = '';
                    newState.criteriaId = '';
                }
            }

            return newState;
        })

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

        // Kiểm tra Program/Org (Cấp 2)
        if (!formData.programId) {
            newErrors.programId = 'Chương trình là bắt buộc'
        }

        if (!formData.organizationId) {
            newErrors.organizationId = 'Tổ chức là bắt buộc'
        }

        if (formData.reportType !== 'overall_tdg') {
            // Kiểm tra Standard (Cấp 3 - Bắt buộc cho Standard/Criteria)
            if (!formData.standardId) {
                newErrors.standardId = 'Tiêu chuẩn là bắt buộc'
            }

            // Kiểm tra Criteria (Cấp 4 - Chỉ bắt buộc cho Criteria)
            if (formData.reportType === 'criteria' && !formData.criteriaId) {
                newErrors.criteriaId = 'Tiêu chí là bắt buộc'
            }
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
                description: formData.description,
                programId: formData.programId,
                organizationId: formData.organizationId,
                standardId: formData.reportType !== 'overall_tdg' ? formData.standardId : null,
                criteriaId: formData.reportType === 'criteria' ? formData.criteriaId : null,
                assignedTo: formData.assignedTo,
                reportType: formData.reportType,
                dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
            }

            if (task) {
                // Task update không cần gửi lại Program/Org ID, nhưng ở đây ta gửi để đảm bảo nhất quán nếu model yêu cầu
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

    const selectedUserNames = users
        .filter(u => formData.assignedTo.includes(u._id))
        .map(u => u.fullName)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className={`bg-gradient-to-r from-${SECONDARY_COLOR} to-${PRIMARY_COLOR} p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <CheckSquare className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {task ? 'Chỉnh sửa nhiệm vụ' : 'Giao nhiệm vụ mới'}
                                </h2>
                                <p className="text-blue-100 text-sm">
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

                    {/* Hàng 1: Loại báo cáo (Cao nhất) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Loại báo cáo <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="reportType"
                            value={formData.reportType}
                            onChange={handleChange}
                            disabled={!!task}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-${RING_COLOR} transition-all border-${BORDER_COLOR} ${task ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                            <option value="criteria">Báo cáo Tiêu chí</option>
                            <option value="standard">Báo cáo Tiêu chuẩn</option>
                            <option value="overall_tdg">Báo cáo Tổng hợp TĐG</option>
                        </select>
                    </div>

                    {/* Hàng 2: Chương trình & Tổ chức (Cấp 2 - Bắt buộc) */}
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Chương trình <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="programId"
                                value={formData.programId}
                                onChange={handleChange}
                                disabled={!!task}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-${RING_COLOR} transition-all ${
                                    errors.programId ? 'border-red-300 bg-red-50' : `border-${BORDER_COLOR} bg-white`
                                } ${task ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Chọn Chương trình</option>
                                {programs.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            {errors.programId && <p className="mt-1 text-sm text-red-600">{errors.programId}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Tổ chức <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="organizationId"
                                value={formData.organizationId}
                                onChange={handleChange}
                                disabled={!!task}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-${RING_COLOR} transition-all ${
                                    errors.organizationId ? 'border-red-300 bg-red-50' : `border-${BORDER_COLOR} bg-white`
                                } ${task ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Chọn Tổ chức</option>
                                {organizations.map(o => (
                                    <option key={o._id} value={o._id}>
                                        {o.name}
                                    </option>
                                ))}
                            </select>
                            {errors.organizationId && <p className="mt-1 text-sm text-red-600">{errors.organizationId}</p>}
                        </div>
                    </div>

                    {/* Hàng 3: Tiêu chuẩn (Cấp 3 - Ẩn nếu là Báo cáo TĐG tổng hợp) */}
                    {formData.reportType !== 'overall_tdg' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Tiêu chuẩn <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="standardId"
                                value={formData.standardId}
                                onChange={handleChange}
                                disabled={!!task || !formData.programId || !formData.organizationId}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-${RING_COLOR} transition-all ${
                                    errors.standardId ? 'border-red-300 bg-red-50' : `border-${BORDER_COLOR} bg-white`
                                } ${task || !formData.programId || !formData.organizationId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                    )}

                    {/* Hàng 4: Tiêu chí (Cấp 4 - Chỉ hiện khi chọn loại báo cáo Tiêu chí) */}
                    {formData.reportType === 'criteria' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                Tiêu chí <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="criteriaId"
                                value={formData.criteriaId}
                                onChange={handleChange}
                                disabled={!!task || !formData.standardId}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-${RING_COLOR} transition-all ${
                                    errors.criteriaId ? 'border-red-300 bg-red-50' : `border-${BORDER_COLOR} bg-white`
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
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Mô tả <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-${RING_COLOR} transition-all resize-none ${
                                errors.description ? 'border-red-300 bg-red-50' : `border-${BORDER_COLOR} bg-white`
                            }`}
                            placeholder="Nhập mô tả chi tiết về nhiệm vụ"
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Phân công cho <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm người được giao..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-2.5 border-2 border-${BORDER_COLOR} rounded-xl focus:ring-2 focus:ring-${RING_COLOR} focus:border-transparent transition-all`}
                                />
                            </div>

                            <div className={`border-2 border-${BORDER_COLOR} rounded-xl p-4 bg-${BG_LIGHT_COLOR} space-y-2 max-h-40 overflow-y-auto`}>
                                {displayUsers.length === 0 ? (
                                    <p className="text-sm text-gray-500">Không có báo cáo viên nào</p>
                                ) : (
                                    displayUsers.map(user => (
                                        <label key={user._id} className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedTo.includes(user._id)}
                                                onChange={() => handleAssignedToChange(user._id)}
                                                className={`w-4 h-4 text-${TEXT_COLOR} border-${BORDER_COLOR} rounded focus:ring-${RING_COLOR}`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>

                            {selectedUserNames.length > 0 && (
                                <div className={`bg-white p-3 rounded-lg border border-${BORDER_COLOR}`}>
                                    <p className="text-xs font-semibold text-gray-600 mb-2">Đã chọn ({selectedUserNames.length}):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUserNames.map(name => (
                                            <span key={name} className={`px-2 py-1 text-xs bg-${BG_LIGHT_COLOR} text-${TEXT_COLOR} rounded border border-${BORDER_COLOR}`}>
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {errors.assignedTo && <p className="mt-2 text-sm text-red-600">{errors.assignedTo}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Ngày hết hạn
                        </label>
                        <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border-2 border-${BORDER_COLOR} bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-${RING_COLOR} transition-all`}
                        />
                    </div>
                </form>

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
                        className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-${SECONDARY_COLOR} to-${PRIMARY_COLOR} text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all font-medium`}
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