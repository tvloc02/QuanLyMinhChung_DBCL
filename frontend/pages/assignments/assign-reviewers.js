import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import api, { apiMethods } from '../../services/api'
import {
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    FileText,
    Search,
    AlertCircle,
    Calendar,
    Users,
    X,
    Loader2,
    ChevronDown,
    ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AssignReviewersPage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { reportIds } = router.query

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [reports, setReports] = useState([])
    const [experts, setExperts] = useState([])
    const [assignments, setAssignments] = useState({})
    const [existingAssignments, setExistingAssignments] = useState({})
    const [existingActiveExperts, setExistingActiveExperts] = useState({})

    const [showExpertSearch, setShowExpertSearch] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredExperts, setFilteredExperts] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
    })
    const [expandedReports, setExpandedReports] = useState({})

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Phân quyền đánh giá', icon: Users }
    ]

    // ✅ HÀM CHUẨN HÓA ID: Đảm bảo reportIds luôn là một mảng các chuỗi ID
    const normalizeReportIds = useCallback(() => {
        if (!reportIds) return []
        if (Array.isArray(reportIds)) {
            // Xử lý trường hợp Next.js gửi tham số query nhiều lần
            return reportIds.flatMap(id => id.split(',')).filter(Boolean)
        }
        // Xử lý trường hợp chuỗi đơn lẻ (ID1,ID2,...)
        return reportIds.split(',').filter(Boolean)
    }, [reportIds])

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (router.isReady && user) {
            const ids = normalizeReportIds()

            if (ids.length === 0) {
                toast.error('Không có báo cáo nào được chọn để phân quyền.')
                setLoading(false)
                setTimeout(() => router.replace('/reports'), 1000)
                return
            }

            fetchReportsAndExperts(ids)
        }
    }, [router.isReady, user, normalizeReportIds]) // Dùng normalizeReportIds trong dependency

    useEffect(() => {
        if (!showExpertSearch) {
            setFilteredExperts([])
            return
        }

        const { reportId, assignmentIdx } = showExpertSearch
        const currentAssignment = assignments[reportId]?.[assignmentIdx]

        const alreadySelectedIds = new Set(currentAssignment?.selectedExperts?.map(e => e._id) || [])
        const existingActiveIds = existingActiveExperts[reportId] || new Set()

        const expertsToExclude = new Set([...alreadySelectedIds, ...existingActiveIds])

        const term = searchTerm.toLowerCase().trim()

        const filtered = experts.filter(expert => {
            if (expertsToExclude.has(expert._id)) return false

            if (term) {
                return (
                    expert.fullName?.toLowerCase().includes(term) ||
                    expert.email?.toLowerCase().includes(term) ||
                    expert.department?.toLowerCase().includes(term)
                )
            }
            return true
        })

        setFilteredExperts(filtered)
    }, [searchTerm, showExpertSearch, assignments, experts, existingActiveExperts])

    // ✅ SỬA: Cập nhật hàm nhận IDs
    const fetchReportsAndExperts = async (ids) => {
        try {
            setLoading(true)

            // Dùng IDs đã chuẩn hóa
            const reportsData = await Promise.all(
                ids.map(id => apiMethods.reports.getById(id).catch(error => {
                    // Log lỗi 400 nếu có ID không hợp lệ
                    console.warn(`Cannot fetch report ${id}:`, error.response?.status, error.message)
                    return null
                }))
            )

            const validReports = reportsData
                .map(res => res?.data?.data || res?.data)
                .filter(Boolean)

            setReports(validReports)

            const initialAssignments = {}
            validReports.forEach((report) => {
                initialAssignments[report._id] = []
            })
            setAssignments(initialAssignments)

            if (validReports.length === 0) {
                toast.error('Không tìm thấy báo cáo nào hợp lệ. Vui lòng chọn lại.')
                setTimeout(() => router.push('/reports'), 1000)
                return
            }

            await fetchExperts(1)
            await fetchExistingAssignments(validReports)

        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Lỗi khi tải dữ liệu ban đầu')
            setTimeout(() => router.push('/reports'), 1000)
        } finally {
            setLoading(false)
        }
    }


    const fetchExistingAssignments = async (reportsList) => {
        try {
            const assignmentPromises = reportsList.map(report =>
                apiMethods.assignments.getAll({
                    reportId: report._id,
                    limit: 100
                }).catch(err => {
                    console.warn(`Cannot fetch assignments for report ${report._id}:`, err.message)
                    return null
                })
            )

            const assignmentResponses = await Promise.all(assignmentPromises)

            const activeExpertsMap = {}
            const existingMap = {}

            assignmentResponses.forEach((res, index) => {
                const reportId = reportsList[index]._id

                if (!res || !res.data) {
                    activeExpertsMap[reportId] = new Set()
                    existingMap[reportId] = []
                    return
                }

                const assignmentsData = res.data?.data?.assignments || []

                const activeAssignments = assignmentsData.filter(a =>
                    a.status && ['pending', 'accepted', 'in_progress'].includes(a.status)
                )

                const expertIds = new Set(
                    activeAssignments
                        .map(a => a.expertId?._id || a.expertId)
                        .filter(Boolean)
                )

                activeExpertsMap[reportId] = expertIds
                existingMap[reportId] = activeAssignments
            })

            setExistingActiveExperts(activeExpertsMap)
            setExistingAssignments(existingMap)

        } catch (error) {
            console.error('Error fetching existing assignments:', error)
        }
    }

    const fetchExperts = async (page = pagination.current) => {
        try {
            setLoading(true)
            const params = {
                page: page,
                limit: 12,
                role: 'expert',
                status: 'active',
                sortBy: 'fullName',
                sortOrder: 'asc'
            }

            if (searchTerm) params.search = searchTerm

            const response = await api.get('/api/users', { params })

            if (response.data.success) {
                setExperts(response.data.data.users)
                setPagination(response.data.data.pagination)
            }
        } catch (error) {
            console.error('Error fetching experts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddAssignment = (reportId) => {
        setAssignments(prev => ({
            ...prev,
            [reportId]: [
                ...prev[reportId],
                {
                    selectedExperts: [],
                    deadline: '',
                    priority: 'normal',
                    assignmentNote: '',
                    evaluationCriteria: []
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

    const openExpertSearch = (reportId, assignmentIdx) => {
        setShowExpertSearch({ reportId, assignmentIdx })
        setSearchTerm('')
        fetchExperts(1)
    }

    const closeExpertSearch = () => {
        setShowExpertSearch(null)
        setSearchTerm('')
        setFilteredExperts([])
    }

    const addExpertToAssignment = (expert) => {
        if (!showExpertSearch) return

        const { reportId, assignmentIdx } = showExpertSearch

        const existingActiveIds = existingActiveExperts[reportId] || new Set()
        if (existingActiveIds.has(expert._id)) {
            toast.error('Chuyên gia này đã được phân quyền báo cáo này')
            return
        }

        setAssignments(prev => {
            const updated = { ...prev }
            const assignment = updated[reportId][assignmentIdx]

            if (assignment.selectedExperts.some(e => e._id === expert._id)) {
                toast.error('Chuyên gia này đã được chọn')
                return prev
            }

            assignment.selectedExperts.push(expert)
            return updated
        })

        toast.success(`Đã thêm ${expert.fullName}`)
        setSearchTerm('')
    }

    const removeExpertFromAssignment = (reportId, assignmentIdx, expertId) => {
        setAssignments(prev => {
            const updated = { ...prev }
            updated[reportId][assignmentIdx].selectedExperts =
                updated[reportId][assignmentIdx].selectedExperts.filter(e => e._id !== expertId)
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

        Object.entries(assignments).forEach(([reportId, reportsAssignments]) => {
            reportsAssignments.forEach((assignment) => {
                if (!assignment.selectedExperts || assignment.selectedExperts.length === 0) {
                    const report = reports.find(r => r._id === reportId)
                    toast.error(`Chọn chuyên gia cho báo cáo ${report?.code}`)
                    hasErrors = true
                }
                if (!assignment.deadline) {
                    const report = reports.find(r => r._id === reportId)
                    toast.error(`Chọn hạn chót cho báo cáo ${report?.code}`)
                    hasErrors = true
                }
            })
        })

        if (hasErrors) return

        try {
            setSaving(true)

            const finalAssignments = Object.entries(assignments)
                .flatMap(([reportId, reportsAssignments]) =>
                    reportsAssignments.flatMap(assignment => {
                        const deadline = new Date(assignment.deadline).toISOString()
                        return assignment.selectedExperts.map(expert => ({
                            reportId,
                            expertId: expert._id,
                            deadline,
                            priority: assignment.priority,
                            assignmentNote: assignment.assignmentNote,
                            evaluationCriteria: assignment.evaluationCriteria || []
                        }))
                    })
                )

            if (finalAssignments.length === 0) {
                toast.error('Không có phân quyền nào để tạo')
                setSaving(false)
                return
            }

            let successCount = 0
            let failCount = 0

            for (let i = 0; i < finalAssignments.length; i++) {
                const assignment = finalAssignments[i]
                try {
                    await apiMethods.assignments.create(assignment)
                    successCount++
                } catch (err) {
                    failCount++
                    console.error(`Failed: ${i + 1}`, err)
                }
            }

            if (successCount > 0) {
                toast.success(`Phân quyền ${successCount} đánh giá thành công`)
            }
            if (failCount > 0) {
                toast.error(`Có ${failCount} lỗi khi tạo phân quyền`)
            }

            if (successCount > 0) {
                await fetchExistingAssignments(reports)
                setAssignments(Object.fromEntries(
                    reports.map(r => [r._id, []])
                ))
                setTimeout(() => {
                    toast.success('Làm mới danh sách phân quyền')
                }, 500)
            }

        } catch (error) {
            console.error('Error during submission:', error)
            toast.error('Lỗi khi phân quyền: ' + (error.response?.data?.message || error.message))
        } finally {
            setSaving(false)
        }
    }

    const getTotalAssignments = () => {
        return Object.values(assignments).reduce(
            (sum, arr) => sum + arr.reduce((acc, item) => acc + (item.selectedExperts?.length || 0), 0),
            0
        )
    }

    const getTotalExistingAssignments = () => {
        return Object.values(existingAssignments).reduce((sum, arr) => sum + (arr?.length || 0), 0)
    }

    const getPriorityColor = (priority) => {
        const colors = {
            low: 'text-gray-600 bg-gray-100 border-gray-300',
            normal: 'text-blue-600 bg-blue-100 border-blue-300',
            high: 'text-orange-600 bg-orange-100 border-orange-300',
            urgent: 'text-red-600 bg-red-100 border-red-300'
        }
        return colors[priority] || 'text-gray-600 bg-gray-100 border-gray-300'
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
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user || user.role !== 'manager') {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
                    <h3 className="text-red-800 font-bold">Lỗi truy cập</h3>
                    <p className="text-red-600">Chỉ quản lý viên có thể phân quyền đánh giá</p>
                </div>
            </Layout>
        )
    }

    if (reports.length === 0 && normalizeReportIds().length > 0) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
                    <h3 className="text-red-800 font-bold">Lỗi dữ liệu</h3>
                    <p className="text-red-600">Không thể tải báo cáo nào với ID đã cung cấp. Vui lòng kiểm tra lại đường dẫn.</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Phân quyền đánh giá</h1>
                            <p className="text-blue-100">Giao báo cáo cho chuyên gia đánh giá</p>
                        </div>
                    </div>
                </div>

                {reports.length === 0 ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
                        <p className="text-yellow-800">Không có báo cáo để hiển thị</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            {/* Report Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-b-2 border-blue-200">
                                <button
                                    onClick={() => setExpandedReports(prev => ({
                                        ...prev,
                                        [report._id]: !prev[report._id]
                                    }))}
                                    className="w-full text-left flex items-start justify-between hover:bg-blue-100 p-3 rounded-lg transition-colors"
                                >
                                    <div className="flex items-start gap-3 flex-1">
                                        {expandedReports[report._id] ? (
                                            <ChevronDown className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                                        )}
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-gray-900">{report.title}</h2>
                                            <div className="flex items-center space-x-3 mt-2 flex-wrap gap-2">
                                                <span className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded border border-blue-300">
                                                    {report.code}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {report.typeText || report.type}
                                                </span>
                                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                    Người tạo: {report.createdBy?.fullName || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {expandedReports[report._id] && (
                                <div className="px-6 py-4">
                                    {/* Existing Assignments */}
                                    {existingAssignments[report._id]?.length > 0 && (
                                        <div className="mb-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                                                <p className="text-sm font-bold text-gray-900">
                                                    Phân quyền hiện tại ({existingAssignments[report._id]?.length || 0})
                                                </p>
                                            </div>
                                            <div className="space-y-2 bg-green-50 rounded-xl p-4 border border-green-200">
                                                {existingAssignments[report._id]?.map((assignment, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-300">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {assignment.expertId?.fullName || 'N/A'}
                                                            </p>
                                                            <p className="text-xs text-gray-600">
                                                                {assignment.expertId?.email}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(assignment.priority)}`}>
                                                                    {getPriorityLabel(assignment.priority)}
                                                                </span>
                                                                <span className="text-xs text-gray-600">
                                                                    Hạn: {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                                                                </span>
                                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                                                                    {assignment.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* New Assignments Form */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                            <p className="text-sm font-bold text-gray-900">
                                                Phân quyền mới ({assignments[report._id]?.length || 0})
                                            </p>
                                        </div>

                                        {assignments[report._id]?.length === 0 ? (
                                            <div className="bg-blue-50 rounded-lg p-6 text-center border-2 border-dashed border-blue-300">
                                                <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                                <p className="text-blue-600 text-sm">Chưa có phân quyền mới</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {assignments[report._id].map((assignment, idx) => (
                                                    <div key={idx} className="bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-200 rounded-xl p-4">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-gray-900 mb-3">
                                                                    Phân quyền #{idx + 1}
                                                                </p>

                                                                {/* Experts Selection */}
                                                                <div className="mb-3">
                                                                    <p className="text-xs font-semibold text-gray-700 mb-2">
                                                                        Chuyên gia <span className="text-red-500">*</span>
                                                                    </p>

                                                                    {assignment.selectedExperts.length === 0 ? (
                                                                        <div className="text-center py-3 border-2 border-dashed border-blue-300 rounded-lg bg-white">
                                                                            <p className="text-gray-500 text-xs">Chưa chọn chuyên gia</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {assignment.selectedExperts.map(expert => (
                                                                                <div
                                                                                    key={expert._id}
                                                                                    className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-blue-300 hover:border-blue-400 transition-colors"
                                                                                >
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                                                            {expert.fullName}
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-600 truncate">
                                                                                            {expert.email}
                                                                                        </p>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => removeExpertFromAssignment(report._id, idx, expert._id)}
                                                                                        className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                                                                    >
                                                                                        <X className="h-4 w-4" />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    <button
                                                                        onClick={() => openExpertSearch(report._id, idx)}
                                                                        className="w-full mt-2 px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center justify-center text-sm"
                                                                    >
                                                                        <Search className="h-4 w-4 mr-2" />
                                                                        {assignment.selectedExperts.length === 0 ? 'Tìm kiếm chuyên gia' : 'Thêm chuyên gia khác'}
                                                                    </button>
                                                                </div>

                                                                {/* Deadline */}
                                                                <div className="mb-3">
                                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                                        Hạn chót <span className="text-red-500">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="date"
                                                                        value={assignment.deadline}
                                                                        onChange={(e) => handleAssignmentChange(report._id, idx, 'deadline', e.target.value)}
                                                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                                    />
                                                                </div>

                                                                {/* Priority */}
                                                                <div className="mb-3">
                                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                                        Ưu tiên
                                                                    </label>
                                                                    <select
                                                                        value={assignment.priority}
                                                                        onChange={(e) => handleAssignmentChange(report._id, idx, 'priority', e.target.value)}
                                                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                                    >
                                                                        <option value="low">Thấp</option>
                                                                        <option value="normal">Bình thường</option>
                                                                        <option value="high">Cao</option>
                                                                        <option value="urgent">Khẩn cấp</option>
                                                                    </select>
                                                                </div>

                                                                {/* Note */}
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                                        Ghi chú
                                                                    </label>
                                                                    <textarea
                                                                        value={assignment.assignmentNote}
                                                                        onChange={(e) => handleAssignmentChange(report._id, idx, 'assignmentNote', e.target.value)}
                                                                        placeholder="Ghi chú cho chuyên gia..."
                                                                        rows={2}
                                                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => handleRemoveAssignment(report._id, idx)}
                                                                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0 transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleAddAssignment(report._id)}
                                        className="w-full mt-4 px-4 py-3 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center justify-center text-sm"
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Thêm phân quyền mới
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Expert Search Modal */}
                {showExpertSearch && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b-2 border-gray-200 flex-shrink-0">
                                <h3 className="text-lg font-bold text-gray-900">Tìm kiếm chuyên gia</h3>
                                <button onClick={closeExpertSearch} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>

                            <div className="p-4 border-b-2 border-gray-200 flex-shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Nhập tên hoặc email chuyên gia..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {filteredExperts.length} chuyên gia có sẵn
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {filteredExperts.length === 0 ? (
                                    <div className="text-center py-8">
                                        {searchTerm.trim() ? (
                                            <>
                                                <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-600 text-sm">
                                                    Không tìm thấy chuyên gia với từ "{searchTerm}"
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-600 text-sm">Tất cả chuyên gia đã được chọn</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredExperts.map(expert => (
                                            <button
                                                key={expert._id}
                                                onClick={() => addExpertToAssignment(expert)}
                                                className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all"
                                            >
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {expert.fullName}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {expert.email}
                                                    {expert.department && ` • ${expert.department}`}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {pagination.pages > 1 && (
                                <div className="p-3 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-between">
                                    <button
                                        onClick={() => fetchExperts(pagination.current - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="px-3 py-1 text-sm text-gray-700 bg-white border-2 border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors font-semibold"
                                    >
                                        Trước
                                    </button>
                                    <span className="text-sm text-gray-600 font-semibold">
                                        Trang {pagination.current} / {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => fetchExperts(pagination.current + 1)}
                                        disabled={!pagination.hasNext}
                                        className="px-3 py-1 text-sm text-gray-700 bg-white border-2 border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors font-semibold"
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}

                            <div className="p-4 border-t-2 border-gray-200 bg-gradient-to-r from-blue-50 to-sky-50 flex justify-end flex-shrink-0">
                                <button
                                    onClick={closeExpertSearch}
                                    className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold text-sm transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Action Bar */}
                <div className="sticky bottom-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-2xl shadow-xl p-6 flex items-center justify-between text-white">
                    <div className="flex items-center space-x-4">
                        <AlertCircle className="h-6 w-6 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold">
                                Phân quyền hiện tại: <span className="text-lg text-blue-900">{getTotalExistingAssignments()}</span> | Mới: <span className="text-lg text-blue-100">{getTotalAssignments()}</span>
                            </p>
                            <p className="text-xs text-blue-100">
                                {getTotalAssignments() === 0 ? 'Thêm phân quyền mới để tiếp tục' : 'Kiểm tra trước khi lưu'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-3 border-2 border-white rounded-lg hover:bg-white hover:text-blue-600 transition-all font-semibold text-sm"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || getTotalAssignments() === 0}
                            className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:shadow-lg transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Lưu ({getTotalAssignments()})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    )
}