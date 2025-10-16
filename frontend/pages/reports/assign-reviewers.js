import { useState, useEffect } from 'react'
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
    Loader2
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
    // State này chứa Set các ID chuyên gia đang hoạt động cho từng reportId
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
            fetchReportsAndExperts()
        }
    }, [router.isReady, reportIds, user])

    // Logic lọc chuyên gia trong modal tìm kiếm
    useEffect(() => {
        if (!showExpertSearch) {
            setFilteredExperts([])
            return
        }

        const { reportId, assignmentIdx } = showExpertSearch
        const currentAssignment = assignments[reportId]?.[assignmentIdx]

        // 1. Lấy ID chuyên gia đã được chọn trong assignment hiện tại
        const alreadySelectedIds = new Set(currentAssignment?.selectedExperts?.map(e => e._id) || [])
        // 2. Lấy ID chuyên gia đã được phân quyền (đang active/pending) cho báo cáo này
        const existingActiveIds = existingActiveExperts[reportId] || new Set()

        const expertsToExclude = new Set([...alreadySelectedIds, ...existingActiveIds])

        // Lọc theo search term
        const term = searchTerm.toLowerCase().trim()

        const filtered = experts.filter(expert => {
            // Loại trừ chuyên gia đã được phân quyền hoặc đã được chọn trong form
            if (expertsToExclude.has(expert._id)) return false

            // Lọc theo search term nếu có
            if (term) {
                return (
                    expert.fullName?.toLowerCase().includes(term) ||
                    expert.email?.toLowerCase().includes(term) ||
                    expert.department?.toLowerCase().includes(term)
                )
            }
            // Nếu không có search term, hiển thị tất cả chuyên gia hợp lệ
            return true
        })

        setFilteredExperts(filtered)
    }, [searchTerm, showExpertSearch, assignments, experts, existingActiveExperts])

    const fetchReportsAndExperts = async () => {
        try {
            setLoading(true)

            const ids = Array.isArray(reportIds) ? reportIds : [reportIds]
            const reportsData = await Promise.all(
                ids.map(id => apiMethods.reports.getById(id))
            )

            const validReports = reportsData
                .map(res => res.data?.data || res.data)
                .filter(Boolean)

            setReports(validReports)

            const initialAssignments = {}
            validReports.forEach((report) => {
                initialAssignments[report._id] = []
            })
            setAssignments(initialAssignments)

            if (validReports.length === 0) {
                toast.error('Không tìm thấy báo cáo nào hợp lệ')
                setTimeout(() => router.push('/reports'), 1000)
                return
            }

            await fetchExperts(1)

            // GỌI HÀM LẤY DANH SÁCH CHUYÊN GIA ĐÃ PHÂN QUYỀN
            await fetchExistingAssignments(validReports)

        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Lỗi khi tải dữ liệu ban đầu')
            setTimeout(() => router.push('/reports'), 1000)
        } finally {
            setLoading(false)
        }
    }

    // SỬA ĐỔI: Đảm bảo trích xuất assignments từ response.data.data.assignments
    const fetchExistingAssignments = async (reportsList) => {
        try {
            const assignmentPromises = reportsList.map(report =>
                apiMethods.assignments.getAll({
                    reportId: report._id,
                    status: 'pending,accepted,in_progress', // Lọc các trạng thái đang hoạt động
                    limit: 100 // Lấy số lượng lớn để bao quát
                }).catch(err => {
                    console.warn(`Cannot fetch assignments for report ${report._id}:`, err.message)
                    return null
                })
            )

            const assignmentResponses = await Promise.all(assignmentPromises)

            const activeExpertsMap = {}

            assignmentResponses.forEach((res, index) => {
                if (!res || !res.data) {
                    activeExpertsMap[reportsList[index]._id] = new Set()
                    return
                }

                const reportId = reportsList[index]._id

                // CÁCH TRÍCH XUẤT ĐÚNG DỰA TRÊN assignmentController.js: response.data.data.assignments
                const assignmentsData = res.data?.data?.assignments || res.data?.assignments || []

                const expertIds = new Set(
                    assignmentsData
                        .map(a => a.expertId?._id || a.expertId) // Lấy ID của chuyên gia
                        .filter(Boolean)
                )

                // Lưu Set ID của các chuyên gia đang hoạt động cho báo cáo này
                activeExpertsMap[reportId] = expertIds
            })

            // Cập nhật state để loại trừ trong modal search
            setExistingActiveExperts(activeExpertsMap)

        } catch (error) {
            console.error('Error fetching existing assignments:', error)
        }
    }

    // GIỮ NGUYÊN LOGIC CŨ CỦA BẠN CHO fetchExperts
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
                setTimeout(() => router.push('/reports/reports'), 1500)
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
                        <p className="text-gray-600 mt-1">Giao báo cáo cho chuyên gia đánh giá</p>
                    </div>
                </div>

                {reports.length === 0 ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
                        <p className="text-yellow-800">Không có báo cáo để hiển thị</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report._id} className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{report.title}</h2>
                                        <div className="flex items-center space-x-3 mt-2 flex-wrap gap-2">
                                            <span className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                {report.code}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {report.typeText || report.type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Người tạo</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {report.createdBy?.fullName || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4">
                                <div className="mb-4">
                                    <p className="text-sm font-semibold text-gray-900 mb-3">
                                        Phân quyền ({assignments[report._id]?.length || 0})
                                    </p>

                                    {assignments[report._id]?.length === 0 ? (
                                        <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
                                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-600 text-sm">Chưa có phân quyền</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {assignments[report._id].map((assignment, idx) => (
                                                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-gray-700 mb-3">
                                                                Phân quyền #{idx + 1}
                                                            </p>

                                                            <div className="mb-3">
                                                                <p className="text-xs font-semibold text-gray-600 mb-2">
                                                                    Chuyên gia <span className="text-red-500">*</span>
                                                                </p>

                                                                {assignment.selectedExperts.length === 0 ? (
                                                                    <div className="text-center py-3 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                                                                        <p className="text-gray-500 text-xs">Chưa chọn chuyên gia</p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {assignment.selectedExperts.map(expert => (
                                                                            <div
                                                                                key={expert._id}
                                                                                className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200"
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
                                                                    placeholder="Ghi chú cho chuyên gia..."
                                                                    rows={2}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                                                />
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => handleRemoveAssignment(report._id, idx)}
                                                            className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
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
                                    className="w-full mt-4 px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center justify-center"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Thêm phân quyền
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {showExpertSearch && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                                <h3 className="text-lg font-bold text-gray-900">Tìm kiếm chuyên gia</h3>
                                <button onClick={closeExpertSearch} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <X className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>

                            <div className="p-4 border-b border-gray-200 flex-shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Nhập tên hoặc email chuyên gia..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    {filteredExperts.length} chuyên gia
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
                                                className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-400 transition-colors"
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

                            {/* PHÂN TRANG */}
                            {pagination.pages > 1 && (
                                <div className="p-3 border-t border-gray-200 flex items-center justify-between">
                                    <button
                                        onClick={() => fetchExperts(pagination.current - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded disabled:opacity-50"
                                    >
                                        Trang trước
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Trang {pagination.current} / {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => fetchExperts(pagination.current + 1)}
                                        disabled={!pagination.hasNext}
                                        className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded disabled:opacity-50"
                                    >
                                        Trang sau
                                    </button>
                                </div>
                            )}

                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0">
                                <button
                                    onClick={closeExpertSearch}
                                    className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold text-sm"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-6 py-4 flex items-center justify-between rounded-lg shadow-lg">
                    <div className="flex items-center space-x-4">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Tổng phân quyền: <span className="text-lg text-blue-600">{getTotalAssignments()}</span>
                            </p>
                            <p className="text-xs text-gray-600">
                                {getTotalAssignments() === 0 ? 'Thêm phân quyền để tiếp tục' : 'Kiểm tra trước khi lưu'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || getTotalAssignments() === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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