import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import api, { apiMethods } from '../../services/api'
import {
    Plus,
    Trash2,
    Save,
    Search,
    AlertCircle,
    Users,
    X,
    Loader2,
    ChevronDown,
    ChevronRight,
    FileText,
    ExternalLink,
    Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

// Helper function để tạo assignment object trống
const createEmptyAssignment = () => ({
    selectedEvaluators: [],
    deadline: '',
    priority: 'normal',
    assignmentNote: '',
    evaluationCriteria: []
})

export default function AssignReviewersPage() {
    const router = useRouter()
    const { user, isLoading } = useAuth()
    const { reportIds } = router.query
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [reports, setReports] = useState([])
    const [evaluators, setEvaluators] = useState([])
    const [assignments, setAssignments] = useState({})
    const [existingAssignments, setExistingAssignments] = useState({})
    const [existingActiveEvaluators, setExistingActiveEvaluators] = useState({})
    const [showEvaluatorSearch, setShowEvaluatorSearch] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredEvaluators, setFilteredEvaluators] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
    })
    // Mặc định tất cả các báo cáo được mở rộng
    const [expandedReports, setExpandedReports] = useState({})
    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Phân quyền đánh giá', icon: Users }
    ]
    const normalizeReportIds = useCallback(() => {
        if (!reportIds) return []
        if (Array.isArray(reportIds)) {
            return reportIds.flatMap(id => id.split(',')).filter(Boolean)
        }
        return reportIds.split(',').filter(Boolean)
    }, [reportIds])
    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
        if (!isLoading && user && !['admin', 'manager'].includes(user.role)) {
            toast.error('Bạn không có quyền truy cập trang phân quyền đánh giá.')
            setTimeout(() => router.replace('/reports'), 1500)
        }
    }, [user, isLoading, router])
    useEffect(() => {
        if (router.isReady && user && ['admin', 'manager'].includes(user.role)) {
            const ids = normalizeReportIds()
            if (ids.length === 0) {
                toast.error('Không có báo cáo nào được chọn để phân quyền.')
                setLoading(false)
                setTimeout(() => router.replace('/reports'), 1000)
                return
            }
            fetchReportsAndEvaluators(ids)
        }
    }, [router.isReady, user, normalizeReportIds])
    useEffect(() => {
        if (!showEvaluatorSearch) {
            setFilteredEvaluators([])
            return
        }
        const { reportId, assignmentIdx } = showEvaluatorSearch
        const currentAssignment = assignments[reportId]?.[assignmentIdx]
        const alreadySelectedIds = new Set(currentAssignment?.selectedEvaluators?.map(e => e._id) || [])
        const existingActiveIds = existingActiveEvaluators[reportId] || new Set()
        const evaluatorsToExclude = new Set([...alreadySelectedIds, ...existingActiveIds])
        const term = searchTerm.toLowerCase().trim()
        const filtered = evaluators.filter(evaluator => {
            if (evaluatorsToExclude.has(evaluator._id)) return false
            if (term) {
                return (
                    evaluator.fullName?.toLowerCase().includes(term) ||
                    evaluator.email?.toLowerCase().includes(term) ||
                    evaluator.department?.toLowerCase().includes(term)
                )
            }
            return true
        })
        setFilteredEvaluators(filtered)
    }, [searchTerm, showEvaluatorSearch, assignments, evaluators, existingActiveEvaluators])
    const fetchReportsAndEvaluators = async (ids) => {
        try {
            setLoading(true)
            const reportsData = await Promise.all(
                ids.map(id => apiMethods.reports.getById(id).catch(error => {
                    console.warn(`Cannot fetch report ${id}:`, error.response?.status, error.message)
                    return null
                }))
            )
            const validReports = reportsData
                .map(res => res?.data?.data || res?.data)
                .filter(Boolean)
                .filter(report => {
                    if (!['approved', 'published'].includes(report.status)) {
                        console.warn(`Report ${report.code} status is ${report.status}, skipping assignment.`)
                        return false
                    }
                    return true
                })
            setReports(validReports)

            const initialAssignments = {}
            const initialExpanded = {}
            validReports.forEach((report) => {
                // Đảm bảo luôn có 1 form assignment trống khi khởi tạo (yêu cầu của bạn)
                initialAssignments[report._id] = [createEmptyAssignment()]
                initialExpanded[report._id] = true // Mặc định mở rộng
            })
            setAssignments(initialAssignments)
            setExpandedReports(initialExpanded)

            if (validReports.length === 0 && normalizeReportIds().length > 0) {
                toast.error('Các báo cáo được chọn không hợp lệ (Cần trạng thái Đã Phê duyệt/Phát hành).')
                setTimeout(() => router.push('/reports'), 1000)
                return
            }
            if (validReports.length === 0) {
                toast.error('Không tìm thấy báo cáo nào hợp lệ.')
                setTimeout(() => router.push('/reports'), 1000)
                return
            }
            await fetchEvaluators(1)
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
            const activeEvaluatorsMap = {}
            const existingMap = {}
            assignmentResponses.forEach((res, index) => {
                const reportId = reportsList[index]._id
                if (!res || !res.data) {
                    activeEvaluatorsMap[reportId] = new Set()
                    existingMap[reportId] = []
                    return
                }
                const assignmentsData = res.data?.data?.assignments || []
                const activeAssignments = assignmentsData.filter(a =>
                    a.status && ['accepted', 'in_progress'].includes(a.status)
                )
                const evaluatorIds = new Set(
                    activeAssignments
                        .map(a => a.evaluatorId?._id || a.evaluatorId)
                        .filter(Boolean)
                )
                activeEvaluatorsMap[reportId] = evaluatorIds
                existingMap[reportId] = assignmentsData // Hiển thị tất cả, không chỉ active
            })
            setExistingActiveEvaluators(activeEvaluatorsMap)
            setExistingAssignments(existingMap)
        } catch (error) {
            console.error('Error fetching existing assignments:', error)
        }
    }
    const fetchEvaluators = async (page = 1) => {
        try {
            setLoading(true)
            const params = {
                page: page,
                limit: 12,
                role: 'evaluator',
                status: 'active',
                sortBy: 'fullName',
                sortOrder: 'asc'
            }
            if (searchTerm) {
                params.search = searchTerm
            }
            const response = await api.get('/api/users', { params })
            if (response.data.success) {
                setEvaluators(response.data.data.users.filter(u => u.role === 'evaluator'))
                setPagination(response.data.data.pagination)
            }
        } catch (error) {
            console.error('Error fetching evaluators:', error)
        } finally {
            setLoading(false)
        }
    }
    const handleAddAssignment = (reportId) => {
        setAssignments(prev => ({
            ...prev,
            [reportId]: [
                ...prev[reportId].filter(a => a.selectedEvaluators.length > 0 || a.deadline !== ''), // Loại bỏ các form trống hoàn toàn, giữ lại form đang điền dở
                createEmptyAssignment()
            ]
        }))
    }
    const handleRemoveAssignment = (reportId, index) => {
        setAssignments(prev => {
            const currentAssignments = prev[reportId]
            const updatedAssignments = currentAssignments.filter((_, i) => i !== index)
            // Đảm bảo luôn có ít nhất một form trống nếu danh sách trống (chỉ khi danh sách ban đầu không rỗng)
            if (updatedAssignments.length === 0 && reports.find(r => r._id === reportId)) {
                return {
                    ...prev,
                    [reportId]: [createEmptyAssignment()]
                }
            }
            return {
                ...prev,
                [reportId]: updatedAssignments
            }
        })
    }
    const openEvaluatorSearch = (reportId, assignmentIdx) => {
        setShowEvaluatorSearch({ reportId, assignmentIdx })
        setSearchTerm('')
        fetchEvaluators(1)
    }
    const closeEvaluatorSearch = () => {
        setShowEvaluatorSearch(null)
        setSearchTerm('')
        setFilteredEvaluators([])
    }
    const addEvaluatorToAssignment = (evaluator) => {
        if (!showEvaluatorSearch) return
        const { reportId, assignmentIdx } = showEvaluatorSearch
        const existingActiveIds = existingActiveEvaluators[reportId] || new Set()
        if (existingActiveIds.has(evaluator._id)) {
            toast.error('Người đánh giá này đã được phân quyền báo cáo này')
            return
        }
        setAssignments(prev => {
            const updated = { ...prev }
            const assignment = updated[reportId][assignmentIdx]
            if (assignment.selectedEvaluators.some(e => e._id === evaluator._id)) {
                return prev
            }
            assignment.selectedEvaluators.push(evaluator)
            return updated
        })
        toast.success(`Đã thêm ${evaluator.fullName}`)
        setSearchTerm('')
    }
    const removeEvaluatorFromAssignment = (reportId, assignmentIdx, evaluatorId) => {
        setAssignments(prev => {
            const updated = { ...prev }
            updated[reportId][assignmentIdx].selectedEvaluators =
                updated[reportId][assignmentIdx].selectedEvaluators.filter(e => e._id !== evaluatorId)
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
            // Lọc bỏ form trống hoàn toàn trước khi kiểm tra (Chỉ giữ lại form đang điền dở hoặc đã hoàn thành)
            reportsAssignments.filter(a => a.selectedEvaluators.length > 0 || a.deadline !== '').forEach((assignment) => {
                if (!assignment.selectedEvaluators || assignment.selectedEvaluators.length === 0) {
                    const report = reports.find(r => r._id === reportId)
                    toast.error(`Chọn người đánh giá cho báo cáo ${report?.code}`)
                    hasErrors = true
                }
                if (!assignment.deadline) {
                    const report = reports.find(r => r._id === reportId)
                    toast.error(`Chọn hạn chót cho báo cáo ${report?.code}`)
                    hasErrors = true
                } else if (new Date(assignment.deadline) <= new Date()) {
                    const report = reports.find(r => r._id === reportId)
                    toast.error(`Hạn chót cho báo cáo ${report?.code} phải lớn hơn ngày hiện tại.`)
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
                        // Lọc bỏ assignment trống hoàn toàn trước khi gửi
                        if (assignment.selectedEvaluators.length === 0 && !assignment.deadline) {
                            return []
                        }
                        const deadline = new Date(assignment.deadline).toISOString()
                        return assignment.selectedEvaluators.map(evaluator => {
                            const assignmentData = {
                                reportId,
                                evaluatorId: evaluator._id,
                                deadline,
                                priority: assignment.priority || 'normal'
                            }
                            if (assignment.assignmentNote && assignment.assignmentNote.trim()) {
                                assignmentData.assignmentNote = assignment.assignmentNote.trim()
                            }
                            if (assignment.evaluationCriteria && assignment.evaluationCriteria.length > 0) {
                                const validCriteria = assignment.evaluationCriteria.filter(c => c.name && c.name.trim())
                                if (validCriteria.length > 0) {
                                    assignmentData.evaluationCriteria = validCriteria
                                }
                            }
                            return assignmentData
                        })
                    })
                )
            if (finalAssignments.length === 0) {
                toast.error('Không có phân quyền nào để tạo')
                setSaving(false)
                return
            }
            const response = await apiMethods.assignments.bulkCreate({ assignments: finalAssignments })
            const { created, skipped, skippedDetails } = response.data.data
            if (created > 0) {
                toast.success(`Đã tạo ${created} phân quyền thành công.`)
            }
            if (skipped > 0) {
                toast.error(`Có ${skipped} phân quyền bị bỏ qua do trùng lặp hoặc lỗi. Vui lòng kiểm tra console.`, { duration: 6000 })
                console.warn("CHI TIẾT PHÂN QUYỀN BỊ BỎ QUA:", skippedDetails)
            }
            if (response.data.success && created === 0 && skipped === 0 && finalAssignments.length > 0) {
                toast.error('Không có phân quyền nào được tạo. Vui lòng kiểm tra lại dữ liệu.')
            }
            if (created > 0) {
                await fetchExistingAssignments(reports)
                // Reset assignments, chỉ giữ lại 1 form trống
                setAssignments(Object.fromEntries(
                    reports.map(r => [r._id, [createEmptyAssignment()]])
                ))
                setTimeout(() => {
                    toast.success('Làm mới danh sách phân quyền')
                }, 500)
            }
        } catch (error) {
            console.error('Error during submission:', error)
            const apiMessage = error.response?.data?.message || error.message
            toast.error('Lỗi khi phân quyền: ' + apiMessage)
        } finally {
            setSaving(false)
        }
    }
    const getTotalAssignments = () => {
        // Chỉ tính các assignment mới có dữ liệu hợp lệ
        return Object.values(assignments).reduce(
            (sum, arr) => sum + arr.filter(a => a.selectedEvaluators.length > 0 && a.deadline !== '').reduce((acc, item) => acc + (item.selectedEvaluators?.length || 0), 0),
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
    if (!user || !['admin', 'manager'].includes(user.role)) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
                    <h3 className="text-red-800 font-bold">Lỗi truy cập</h3>
                    <p className="text-red-600">Chỉ Admin hoặc Quản lý viên có thể phân quyền đánh giá</p>
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
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Phân quyền đánh giá</h1>
                                <p className="text-blue-100">Giao {reports.length} báo cáo cho người đánh giá (Evaluator)</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-blue-900 bg-white bg-opacity-70 backdrop-blur-sm px-4 py-2 rounded-lg">
                                Tổng cộng: {getTotalExistingAssignments()} phân quyền
                            </p>
                        </div>
                    </div>
                </div>
                {reports.map((report) => (
                    <div key={report._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
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
                                        <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{report.title}</h2>
                                        <div className="flex items-center space-x-3 mt-2 flex-wrap gap-2">
                                            <span className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded border border-blue-300">
                                                {report.code}
                                            </span>
                                            <span className="text-sm font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">
                                                {report.status}
                                            </span>
                                            <a
                                                href={`/reports/${report._id}`}
                                                onClick={(e) => { e.stopPropagation(); router.push(`/reports/${report._id}`) }}
                                                className="text-xs text-indigo-600 hover:underline flex items-center cursor-pointer"
                                            >
                                                Xem chi tiết <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                        {expandedReports[report._id] && (
                            <div className="p-6 grid lg:grid-cols-2 gap-8">
                                {/* CỘT TRÁI: PHÂN QUYỀN HIỆN TẠI */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                                        <p className="text-lg font-bold text-gray-900">
                                            Phân quyền Hiện tại ({existingAssignments[report._id]?.length || 0})
                                        </p>
                                    </div>
                                    {existingAssignments[report._id]?.length > 0 ? (
                                        <div className="space-y-3 bg-green-50 rounded-xl p-4 border border-green-200 max-h-[500px] overflow-y-auto">
                                            {existingAssignments[report._id]?.map((assignment, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-300 shadow-sm">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {assignment.evaluatorId?.fullName || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            {assignment.evaluatorId?.email}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className={`text-xs px-2 py-1 rounded border font-medium ${getPriorityColor(assignment.priority)}`}>
                                                                {getPriorityLabel(assignment.priority)}
                                                            </span>
                                                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                                                                {assignment.statusText || assignment.status}
                                                            </span>
                                                            <span className="text-xs text-gray-600 flex items-center gap-1">
                                                                <Clock className="w-3 h-3"/> Hạn: {new Date(assignment.deadline).toLocaleDateString('vi-VN')}
                                                            </span>
                                                            <a
                                                                href={`/assignments/${assignment._id}`}
                                                                onClick={(e) => { e.stopPropagation(); router.push(`/assignments/${assignment._id}`) }}
                                                                className="text-xs text-blue-600 hover:underline flex items-center cursor-pointer"
                                                            >
                                                                Xem <ExternalLink className="w-3 h-3 ml-1" />
                                                            </a>
                                                        </div>
                                                        {assignment.assignmentNote && (
                                                            <p className="text-xs text-gray-500 mt-2 italic border-t pt-1 line-clamp-2">
                                                                Ghi chú: {assignment.assignmentNote}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 rounded-lg p-6 text-center border-2 border-dashed border-green-300">
                                            <FileText className="h-8 w-8 text-green-400 mx-auto mb-2" />
                                            <p className="text-green-600 text-sm">Chưa có phân quyền nào cho báo cáo này.</p>
                                        </div>
                                    )}
                                </div>

                                {/* CỘT PHẢI: PHÂN QUYỀN MỚI */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                            <p className="text-lg font-bold text-gray-900">
                                                Phân quyền Mới ({assignments[report._id]?.length || 0})
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleAddAssignment(report._id)}
                                            className="px-3 py-1 border border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center text-sm"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Thêm
                                        </button>
                                    </div>

                                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                                        {assignments[report._id]?.map((assignment, idx) => (
                                            <div
                                                key={idx}
                                                className={`bg-white border-2 rounded-xl p-4 shadow-md transition-all ${
                                                    assignment.selectedEvaluators.length > 0 || assignment.deadline ? 'border-blue-300' : 'border-gray-200 opacity-75'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <p className="text-base font-bold text-gray-900 flex-1">
                                                        Phân quyền #{idx + 1}
                                                    </p>
                                                    {(assignments[report._id].length > 1 || existingAssignments[report._id]?.length > 0) && (
                                                        <button
                                                            onClick={() => handleRemoveAssignment(report._id, idx)}
                                                            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0 transition-colors"
                                                            title="Xóa phân quyền này"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="border-t pt-3">
                                                        <p className="text-xs font-semibold text-gray-700 mb-2">
                                                            Người đánh giá <span className="text-red-500">*</span>
                                                        </p>
                                                        {assignment.selectedEvaluators.length > 0 && (
                                                            <div className="space-y-2 mb-2">
                                                                {assignment.selectedEvaluators.map(evaluator => (
                                                                    <div
                                                                        key={evaluator._id}
                                                                        className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-blue-200"
                                                                    >
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                                                {evaluator.fullName}
                                                                            </p>
                                                                            <p className="text-xs text-gray-600 truncate">
                                                                                {evaluator.email}
                                                                            </p>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => removeEvaluatorFromAssignment(report._id, idx, evaluator._id)}
                                                                            className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => openEvaluatorSearch(report._id, idx)}
                                                            className="w-full px-3 py-2 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center justify-center text-sm"
                                                        >
                                                            <Search className="h-4 w-4 mr-2" />
                                                            {assignment.selectedEvaluators.length === 0 ? 'Tìm kiếm người đánh giá' : 'Thêm người đánh giá khác'}
                                                        </button>
                                                    </div>

                                                    <div>
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

                                                    <div>
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

                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                            Ghi chú
                                                        </label>
                                                        <textarea
                                                            value={assignment.assignmentNote}
                                                            onChange={(e) => handleAssignmentChange(report._id, idx, 'assignmentNote', e.target.value)}
                                                            placeholder="Ghi chú cho người đánh giá..."
                                                            rows={2}
                                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {showEvaluatorSearch && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b-2 border-gray-200 flex-shrink-0">
                                <h3 className="text-lg font-bold text-gray-900">Tìm kiếm người đánh giá</h3>
                                <button onClick={closeEvaluatorSearch} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="p-4 border-b-2 border-gray-200 flex-shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Nhập tên hoặc email người đánh giá..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {filteredEvaluators.length} người đánh giá có sẵn
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {filteredEvaluators.length === 0 ? (
                                    <div className="text-center py-8">
                                        {searchTerm.trim() ? (
                                            <>
                                                <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-600 text-sm">
                                                    Không tìm thấy người đánh giá với từ "{searchTerm}"
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-600 text-sm">Tất cả người đánh giá đã được chọn</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredEvaluators.map(evaluator => (
                                            <button
                                                key={evaluator._id}
                                                onClick={() => addEvaluatorToAssignment(evaluator)}
                                                className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all"
                                            >
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {evaluator.fullName}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {evaluator.email}
                                                    {evaluator.department && ` • ${evaluator.department}`}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {pagination.pages > 1 && (
                                <div className="p-3 border-t-2 border-gray-200 bg-gray-50 flex items-center justify-between">
                                    <button
                                        onClick={() => fetchEvaluators(pagination.current - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="px-3 py-1 text-sm text-gray-700 bg-white border-2 border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors font-semibold"
                                    >
                                        Trước
                                    </button>
                                    <span className="text-sm text-gray-600 font-semibold">
                                        Trang {pagination.current} / {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => fetchEvaluators(pagination.current + 1)}
                                        disabled={!pagination.hasNext}
                                        className="px-3 py-1 text-sm text-gray-700 bg-white border-2 border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors font-semibold"
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}
                            <div className="p-4 border-t-2 border-gray-200 bg-gradient-to-r from-blue-50 to-sky-50 flex justify-end flex-shrink-0">
                                <button
                                    onClick={closeEvaluatorSearch}
                                    className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold text-sm transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="sticky bottom-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-2xl p-6 flex items-center justify-between text-white">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="h-6 w-6" />
                        <span className="font-semibold">
                            Sẽ tạo: <span className="text-lg text-blue-100">{getTotalAssignments()}</span> phân quyền mới
                        </span>
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