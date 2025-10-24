import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import { ActionButton } from '../../../components/ActionButtons'
import { apiMethods } from '../../../services/api'
import toast from 'react-hot-toast'
import {
    FileText,
    Loader2,
    ArrowLeft,
    Plus,
    Users,
    X,
    Eye,
    Send
} from 'lucide-react'
import { formatDate } from '../../../utils/helpers'

// Modal Thêm TDG
const AddTdgModal = ({ isOpen, onClose, requestId, onSuccess }) => {
    const [selectedTdg, setSelectedTdg] = useState('')
    const [tdgList, setTdgList] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchTdgList()
        }
    }, [isOpen])

    const fetchTdgList = async () => {
        try {
            setLoading(true)
            // API để lấy danh sách TDG - thay đổi theo API thực tế của bạn
            const response = await apiMethods.users.getByRole('tdg')
            setTdgList(response.data?.data || [])
        } catch (error) {
            console.error('Fetch TDG list error:', error)
            toast.error('Lỗi khi tải danh sách TDG')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!selectedTdg) {
            toast.error('Vui lòng chọn TDG')
            return
        }

        try {
            setLoading(true)
            // API cập nhật request - thay đổi theo API thực tế
            await apiMethods.reportRequests.update(requestId, {
                assignedTo: selectedTdg
            })
            toast.success('Thêm TDG thành công')
            setSelectedTdg('')
            onClose()
            onSuccess?.()
        } catch (error) {
            console.error('Add TDG error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi thêm TDG')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Thêm TDG viết báo cáo</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Chọn TDG
                        </label>
                        <select
                            value={selectedTdg}
                            onChange={(e) => setSelectedTdg(e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        >
                            <option value="">-- Chọn TDG --</option>
                            {tdgList.map(tdg => (
                                <option key={tdg._id} value={tdg._id}>
                                    {tdg.fullName} ({tdg.email})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedTdg}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// Modal Phân Quyền
const AssignmentModal = ({ isOpen, onClose, requestId, reportId, onSuccess }) => {
    const [formData, setFormData] = useState({
        expertId: '',
        deadline: '',
        priority: 'normal',
        assignmentNote: ''
    })
    const [expertList, setExpertList] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchExpertList()
        }
    }, [isOpen])

    const fetchExpertList = async () => {
        try {
            setLoading(true)
            // API để lấy danh sách chuyên gia
            const response = await apiMethods.users.getByRole('expert')
            setExpertList(response.data?.data || [])
        } catch (error) {
            console.error('Fetch expert list error:', error)
            toast.error('Lỗi khi tải danh sách chuyên gia')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async () => {
        if (!formData.expertId || !formData.deadline) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        try {
            setLoading(true)
            // API tạo phân quyền
            await apiMethods.assignments.create({
                reportId,
                expertId: formData.expertId,
                deadline: formData.deadline,
                priority: formData.priority,
                assignmentNote: formData.assignmentNote
            })
            toast.success('Tạo phân quyền thành công')
            setFormData({
                expertId: '',
                deadline: '',
                priority: 'normal',
                assignmentNote: ''
            })
            onClose()
            onSuccess?.()
        } catch (error) {
            console.error('Create assignment error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tạo phân quyền')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Phân quyền đánh giá</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Chuyên gia đánh giá *
                        </label>
                        <select
                            name="expertId"
                            value={formData.expertId}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        >
                            <option value="">-- Chọn chuyên gia --</option>
                            {expertList.map(expert => (
                                <option key={expert._id} value={expert._id}>
                                    {expert.fullName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Hạn chót *
                        </label>
                        <input
                            type="date"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Độ ưu tiên
                        </label>
                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        >
                            <option value="low">Thấp</option>
                            <option value="normal">Bình thường</option>
                            <option value="high">Cao</option>
                            <option value="urgent">Khẩn cấp</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Ghi chú
                        </label>
                        <textarea
                            name="assignmentNote"
                            value={formData.assignmentNote}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ghi chú thêm..."
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !formData.expertId || !formData.deadline}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Đang xử lý...' : 'Phân quyền'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ReportRequestDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const { user, isLoading: authLoading } = useAuth()

    const [request, setRequest] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showAddTdgModal, setShowAddTdgModal] = useState(false)
    const [showAssignmentModal, setShowAssignmentModal] = useState(false)

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports/reports', icon: FileText },
        { name: 'Yêu cầu viết báo cáo', href: '/reports/requests' },
        { name: 'Chi tiết' }
    ]

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (id) {
            fetchRequest()
        }
    }, [id])

    const fetchRequest = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.reportRequests.getById(id)
            setRequest(response.data?.data)
        } catch (error) {
            console.error('Fetch request error:', error)
            toast.error('Lỗi khi tải chi tiết yêu cầu')
            router.back()
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Chờ xử lý',
            accepted: 'Đã chấp nhận',
            in_progress: 'Đang thực hiện',
            completed: 'Hoàn thành',
            rejected: 'Từ chối'
        }
        return labels[status] || status
    }

    const getPriorityLabel = (priority) => {
        const labels = {
            low: 'Thấp',
            normal: 'Bình thường',
            high: 'Cao',
            urgent: 'Khẩn cấp'
        }
        return labels[priority] || priority
    }

    const handleCreateReport = () => {
        router.push(`/reports/create?requestId=${id}`)
    }

    if (authLoading || loading) {
        return (
            <Layout title="Chi tiết yêu cầu" breadcrumbItems={breadcrumbItems}>
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
            </Layout>
        )
    }

    if (!request) {
        return (
            <Layout title="Chi tiết yêu cầu" breadcrumbItems={breadcrumbItems}>
                <div className="text-center py-16">
                    <p className="text-gray-600">Không tìm thấy yêu cầu</p>
                </div>
            </Layout>
        )
    }

    const isManager = user?.role === 'manager'
    const isTdg = user?.role === 'tdg'
    const isCreasor = request.createdBy?._id === user?.id
    const isAssignee = request.assignedTo?._id === user?.id

    return (
        <Layout breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-300 via-blue-400 to-blue-300 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
                        >
                            <ArrowLeft size={20} />
                            Quay lại
                        </button>
                        <span className={`px-4 py-2 rounded-lg font-bold ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black mb-2">{request.title}</h1>
                    <p className="text-blue-100">Loại báo cáo: <span className="font-bold text-white">{request.type}</span></p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin yêu cầu</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Mô tả</label>
                                    <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Chương trình</label>
                                        <p className="text-gray-700">{request.programId?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tổ chức</label>
                                        <p className="text-gray-700">{request.organizationId?.name || 'N/A'}</p>
                                    </div>
                                </div>

                                {request.standardId && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu chuẩn</label>
                                        <p className="text-gray-700">{request.standardId?.name || 'N/A'}</p>
                                    </div>
                                )}

                                {request.criteriaId && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tiêu chí</label>
                                        <p className="text-gray-700">{request.criteriaId?.name || 'N/A'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Người tạo và giao cho */}
                        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Người liên quan</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Người tạo</label>
                                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                                        <p className="font-bold text-gray-900">{request.createdBy?.fullName}</p>
                                        <p className="text-xs text-gray-600">{request.createdBy?.email}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Người nhận</label>
                                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3">
                                        <p className="font-bold text-gray-900">{request.assignedTo?.fullName}</p>
                                        <p className="text-xs text-gray-600">{request.assignedTo?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Báo cáo liên kết */}
                        {request.reportId && (
                            <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Báo cáo liên kết</h2>
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                                    <p className="font-bold text-green-900">{request.reportId?.title}</p>
                                    <p className="text-sm text-green-700 mt-1">Mã: {request.reportId?.code}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-4">
                        {/* Thời hạn */}
                        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Hạn chót</h3>
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-red-600">{formatDate(request.deadline)}</p>
                                <p className="text-sm text-red-600 mt-1">
                                    {new Date(request.deadline) < new Date() ? '⚠️ Đã quá hạn' : '✓ Còn hạn'}
                                </p>
                            </div>
                        </div>

                        {/* Độ ưu tiên */}
                        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Độ ưu tiên</h3>
                            <div className="inline-flex px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-bold border-2 border-yellow-300">
                                {getPriorityLabel(request.priority)}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác</h3>
                            <div className="space-y-3">
                                {/* TDG: Xem + Tạo báo cáo */}
                                {isTdg && isAssignee && (
                                    <>
                                        <ActionButton
                                            icon={Eye}
                                            label="Xem chi tiết"
                                            variant="primary"
                                            size="sm"
                                            onClick={() => {}}
                                        />
                                        {!request.reportId && (
                                            <ActionButton
                                                icon={Plus}
                                                label="Tạo báo cáo"
                                                variant="success"
                                                size="sm"
                                                onClick={handleCreateReport}
                                            />
                                        )}
                                    </>
                                )}

                                {/* Manager: Thêm TDG */}
                                {isManager && isCreasor && (
                                    <>
                                        <ActionButton
                                            icon={Users}
                                            label="Thêm TDG"
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setShowAddTdgModal(true)}
                                        />
                                        {request.reportId && (
                                            <ActionButton
                                                icon={Send}
                                                label="Phân quyền"
                                                variant="purple"
                                                size="sm"
                                                onClick={() => setShowAssignmentModal(true)}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddTdgModal
                isOpen={showAddTdgModal}
                onClose={() => setShowAddTdgModal(false)}
                requestId={id}
                onSuccess={fetchRequest}
            />

            <AssignmentModal
                isOpen={showAssignmentModal}
                onClose={() => setShowAssignmentModal(false)}
                requestId={id}
                reportId={request?.reportId?._id}
                onSuccess={fetchRequest}
            />
        </Layout>
    )
}