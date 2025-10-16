import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import {
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    FileText,
    User,
    AlertCircle,
    CheckCircle,
    Calendar,
    Zap,
    Users,
    X
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function AssignReviewersPage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { reportIds } = router.query

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [reports, setReports] = useState([])
    const [experts, setExperts] = useState([])
    const [assignments, setAssignments] = useState([])

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Phân quyền đánh giá', icon: Users }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (router.isReady && reportIds && user) {
            fetchReports()
            fetchExperts()
        }
    }, [router.isReady, reportIds, user])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const ids = Array.isArray(reportIds) ? reportIds : [reportIds]

            const reportsData = await Promise.all(
                ids.map(id => apiMethods.reports.getById(id))
            )

            setReports(
                reportsData.map(res => res.data?.data || res.data).filter(Boolean)
            )

            const initialAssignments = {}
            reportsData.forEach((res, idx) => {
                const report = res.data?.data || res.data
                initialAssignments[report._id] = []
            })
            setAssignments(initialAssignments)
        } catch (error) {
            console.error('Error fetching reports:', error)
            toast.error('Lỗi khi tải báo cáo')
            router.push('/reports')
        } finally {
            setLoading(false)
        }
    }

    const fetchExperts = async () => {
        try {
            console.log('Fetching experts...')

            const token = localStorage.getItem('token')
            const response = await fetch('/api/users?status=active&limit=100&role=expert', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const data = await response.json()
            console.log('Response:', data)

            let expertsList = []

            if (data?.data?.users) {
                expertsList = data.data.users
            } else if (data?.data && Array.isArray(data.data)) {
                expertsList = data.data
            } else if (Array.isArray(data?.users)) {
                expertsList = data.users
            }

            console.log('Total experts:', expertsList.length)
            setExperts(expertsList)

            if (expertsList.length === 0) {
                toast.warning('Không tìm thấy chuyên gia nào trong hệ thống')
            }

        } catch (error) {
            console.error('Error fetching experts:', error)
            toast.error('Lỗi khi tải danh sách chuyên gia: ' + error.message)
            setExperts([])
        }
    }

    const handleAddAssignment = (reportId) => {
        setAssignments(prev => ({
            ...prev,
            [reportId]: [
                ...prev[reportId],
                {
                    expertIds: [],
                    deadline: '',
                    priority: 'normal',
                    assignmentNote: ''
                }
            ]
        }))
    }

    const handleRemoveAssignment = (reportId, index) => {
        setAssignments(prev => ({
            ...prev,
            [reportId]: prev[reportId].filter((_, i) => i !== index)
        }))
    }

    const handleToggleExpert = (reportId, assignmentIndex, expertId) => {
        setAssignments(prev => {
            const updated = { ...prev }
            const assignment = updated[reportId][assignmentIndex]

            if (assignment.expertIds.includes(expertId)) {
                assignment.expertIds = assignment.expertIds.filter(id => id !== expertId)
            } else {
                assignment.expertIds.push(expertId)
            }

            return updated
        })
    }

    const handleAssignmentChange = (reportId, index, field, value) => {
        setAssignments(prev => {
            const updated = { ...prev }
            updated[reportId][index] = {
                ...updated[reportId][index],
                [field]: value
            }
            return updated
        })
    }

    const handleSubmit = async () => {
        let hasErrors = false
        let totalAssignments = 0

        Object.entries(assignments).forEach(([reportId, reportsAssignments]) => {
            reportsAssignments.forEach((assignment, idx) => {
                if (!assignment.expertIds || assignment.expertIds.length === 0) {
                    toast.error(`Vui lòng chọn ít nhất một chuyên gia cho báo cáo: ${reportId}`)
                    hasErrors = true
                }
                if (!assignment.deadline) {
                    toast.error(`Vui lòng chọn hạn chót cho báo cáo: ${reportId}`)
                    hasErrors = true
                }
                if (!hasErrors) {
                    totalAssignments += assignment.expertIds.length
                }
            })
        })

        if (hasErrors) return

        try {
            setSaving(true)

            const allAssignments = Object.entries(assignments)
                .flatMap(([reportId, reportsAssignments]) =>
                    reportsAssignments.flatMap(assignment =>
                        assignment.expertIds.map(expertId => ({
                            reportId,
                            expertId,
                            deadline: assignment.deadline,
                            priority: assignment.priority,
                            assignmentNote: assignment.assignmentNote
                        }))
                    )
                )

            console.log('Creating assignments:', allAssignments)

            try {
                const response = await apiMethods.assignments.bulkCreate(allAssignments)
                console.log('Bulk create response:', response)

                if (response.data?.success) {
                    const created = response.data?.data?.summary?.success || 0
                    toast.success(`Đã phân quyền ${created} thành công`)
                    router.push('/reports')
                    return
                }
            } catch (bulkError) {
                console.log('Bulk create not available, trying individual creates...')
            }

            let successCount = 0
            let failCount = 0

            for (const assignment of allAssignments) {
                try {
                    await apiMethods.assignments.create(assignment)
                    successCount++
                } catch (err) {
                    console.error('Failed to create assignment:', err)
                    failCount++
                }
            }

            if (successCount > 0) {
                toast.success(`Đã phân quyền ${successCount} đánh giá thành công`)
            }
            if (failCount > 0) {
                toast.warning(`${failCount} lượt thất bại`)
            }

            router.push('/reports')

        } catch (error) {
            console.error('Error creating assignments:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi phân quyền')
        } finally {
            setSaving(false)
        }
    }

    const getTotalAssignments = () => {
        return Object.values(assignments).reduce(
            (sum, arr) => sum + arr.reduce((acc, item) => acc + (item.expertIds?.length || 0), 0),
            0
        )
    }

    const getExpertName = (expertId) => {
        const expert = experts.find(e => e._id === expertId)
        return expert?.fullName || 'N/A'
    }

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'text-gray-600 bg-gray-100',
            normal: 'text-blue-600 bg-blue-100',
            high: 'text-orange-600 bg-orange-100',
            urgent: 'text-red-600 bg-red-100'
        }
        return colors[priority] || 'text-gray-600 bg-gray-100'
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

    if (isLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'manager') {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-red-800 font-semibold">Lỗi truy cập</h3>
                    <p className="text-red-600">Chỉ người quản lý mới có thể phân quyền đánh giá</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Phân quyền đánh giá" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Phân quyền đánh giá</h1>
                        <p className="text-gray-600 mt-1">
                            Giao báo cáo cho chuyên gia để đánh giá
                        </p>
                    </div>
                </div>

                {reports.map((report) => (
                    <div key={report._id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{report.title}</h2>
                                    <div className="flex items-center space-x-3 mt-2">
                                        <span className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                            {report.code}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Loại: {report.typeText || report.type}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Trạng thái: {report.statusText || report.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Người tạo</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {report.createdBy?.fullName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-900 mb-3">
                                    Phân quyền đánh giá ({assignments[report._id]?.length || 0})
                                </p>

                                {assignments[report._id]?.length === 0 ? (
                                    <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
                                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600 text-sm">Chưa có phân quyền nào</p>
                                        <p className="text-gray-500 text-xs mt-1">
                                            Nhấn "Thêm phân quyền" để bắt đầu
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {assignments[report._id].map((assignment, idx) => (
                                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-700 mb-2">
                                                            Phân quyền #{idx + 1}
                                                        </p>

                                                        <div className="mb-3">
                                                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                                Chuyên gia <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
                                                                {experts.length === 0 ? (
                                                                    <p className="text-gray-500 text-sm col-span-2 text-center py-4">
                                                                        Không có chuyên gia nào
                                                                    </p>
                                                                ) : (
                                                                    experts.map(expert => (
                                                                        <label
                                                                            key={expert._id}
                                                                            className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={assignment.expertIds.includes(expert._id)}
                                                                                onChange={() => handleToggleExpert(report._id, idx, expert._id)}
                                                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                            <span className="text-sm text-gray-700 flex-1">
                                                                                {expert.fullName}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {expert.email}
                                                                            </span>
                                                                        </label>
                                                                    ))
                                                                )}
                                                            </div>
                                                            {assignment.expertIds.length > 0 && (
                                                                <div className="mt-2 flex flex-wrap gap-1">
                                                                    {assignment.expertIds.map(expertId => (
                                                                        <span
                                                                            key={expertId}
                                                                            className="inline-flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                                                                        >
                                                                            <span>{getExpertName(expertId)}</span>
                                                                            <button
                                                                                onClick={() => handleToggleExpert(report._id, idx, expertId)}
                                                                                className="hover:text-blue-900"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                                Hạn chót <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="date"
                                                                value={assignment.deadline}
                                                                onChange={(e) => handleAssignmentChange(report._id, idx, 'deadline', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            />
                                                        </div>

                                                        <div className="mb-3">
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                                Ưu tiên
                                                            </label>
                                                            <select
                                                                value={assignment.priority}
                                                                onChange={(e) => handleAssignmentChange(report._id, idx, 'priority', e.target.value)}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            >
                                                                <option value="low">Thấp</option>
                                                                <option value="normal">Bình thường</option>
                                                                <option value="high">Cao</option>
                                                                <option value="urgent">Khẩn cấp</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                                Ghi chú
                                                            </label>
                                                            <textarea
                                                                value={assignment.assignmentNote}
                                                                onChange={(e) => handleAssignmentChange(report._id, idx, 'assignmentNote', e.target.value)}
                                                                placeholder="Nhập ghi chú cho chuyên gia..."
                                                                maxLength={1000}
                                                                rows={2}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                                            />
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemoveAssignment(report._id, idx)}
                                                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {assignment.expertIds.length > 0 && assignment.deadline && (
                                                    <div className="bg-white rounded p-3 border border-gray-200 text-xs">
                                                        <div className="flex flex-wrap items-center space-x-3 gap-2">
                                                            <div className="flex items-center space-x-1 text-gray-600">
                                                                <Users className="h-3.5 w-3.5" />
                                                                <span>{assignment.expertIds.length} chuyên gia</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1 text-gray-600">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                <span>{assignment.deadline}</span>
                                                            </div>
                                                            <div className={`px-2 py-0.5 rounded-full font-semibold ${getPriorityColor(assignment.priority)}`}>
                                                                {getPriorityLabel(assignment.priority)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleAddAssignment(report._id)}
                                className="w-full mt-4 px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center justify-center"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Thêm phân quyền
                            </button>
                        </div>
                    </div>
                ))}

                <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-6 py-4 flex items-center justify-between rounded-lg shadow-lg">
                    <div className="flex items-center space-x-4">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Tổng phân quyền: <span className="text-lg text-blue-600">{getTotalAssignments()}</span>
                            </p>
                            <p className="text-xs text-gray-600">
                                {getTotalAssignments() === 0
                                    ? 'Thêm ít nhất một phân quyền để tiếp tục'
                                    : 'Kiểm tra tất cả thông tin trước khi lưu'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || getTotalAssignments() === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Lưu phân quyền ({getTotalAssignments()})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    )
}