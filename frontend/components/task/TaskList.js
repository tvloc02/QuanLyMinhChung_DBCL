import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Plus, Search, Trash2, Edit2, Eye, RefreshCw, Filter, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import TaskModal from './TaskModal'
import TaskDetail from './TaskDetail'
import { ActionButton } from '../ActionButtons'
import ReportSelectionModal from '../reports/ReportSelectionModal'

export default function TaskList() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('created')
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0, hasPrev: false, hasNext: false })
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [standardId, setStandardId] = useState('')
    const [criteriaId, setCriteriaId] = useState('')
    const [showTaskModal, setShowTaskModal] = useState(false)
    const [showTaskDetail, setShowTaskDetail] = useState(false)
    const [selectedTask, setSelectedTask] = useState(null)
    const [userRole, setUserRole] = useState('')
    const [userId, setUserId] = useState('')
    const [standards, setStandards] = useState([])
    const [criterias, setCriterias] = useState([])
    const [showReportSelection, setShowReportSelection] = useState(false)
    const [reportContext, setReportContext] = useState(null)

    useEffect(() => {
        const role = localStorage.getItem('userRole') || ''
        const id = localStorage.getItem('userId') || ''
        setUserRole(role)
        setUserId(id)
    }, [])

    useEffect(() => {
        if (pagination && pagination.current !== undefined) {
            loadTasks(pagination.current)
        }
    }, [activeTab, pagination.current, search, status, standardId, criteriaId])

    useEffect(() => {
        fetchStandardsAndCriteria()
    }, [])

    const fetchStandardsAndCriteria = async () => {
        try {
            const [standardsRes, criteriasRes] = await Promise.all([
                apiMethods.standards.getAll({ limit: 100 }),
                apiMethods.criteria.getAll({ limit: 100 })
            ])
            setStandards(standardsRes.data.data.standards || standardsRes.data.data || [])
            const criteriaData = criteriasRes.data.data.criterias || criteriasRes.data.data || []
            setCriterias(Array.isArray(criteriaData) ? criteriaData : [])
        } catch (error) {
            console.error('Fetch standards/criteria error:', error)
        }
    }

    const loadTasks = async (page = 1) => {
        try {
            setLoading(true)
            const params = {
                page: page,
                limit: 10,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            }

            if (search) params.search = search
            if (status) params.status = status
            if (standardId) params.standardId = standardId
            if (criteriaId) params.criteriaId = criteriaId

            let response
            if (activeTab === 'created') {
                response = await apiMethods.tasks.getCreatedTasks(params)
            } else {
                response = await apiMethods.tasks.getAssignedTasks(params)
            }

            if (response.data.success) {
                const loadedTasks = response.data.data || []
                const newPagination = {
                    current: response.data.page || 1,
                    pages: Math.ceil(response.data.total / (response.data.limit || 10)),
                    total: response.data.total || 0,
                    hasPrev: response.data.page > 1,
                    hasNext: response.data.page < Math.ceil(response.data.total / (response.data.limit || 10))
                }

                setTasks(loadedTasks)
                setPagination(newPagination)
            } else {
                setTasks([])
            }
        } catch (error) {
            toast.error('Không thể tải danh sách nhiệm vụ')
            setTasks([])
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa nhiệm vụ này? Hành động này cũng sẽ xóa báo cáo liên quan.')) return

        try {
            await apiMethods.tasks.delete(id)
            toast.success('Xóa thành công')
            if (tasks.length === 1 && pagination.current > 1) {
                loadTasks(pagination.current - 1)
            } else {
                loadTasks(pagination.current)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa thất bại')
        }
    }

    const handleWriteReport = (task) => {
        setReportContext({
            taskId: task._id,
            reportType: task.reportType,
            standardId: task.standardId?._id || task.standardId,
            criteriaId: task.criteriaId?._id || task.criteriaId,
            programId: task.programId?._id || task.programId,
            organizationId: task.organizationId?._id || task.organizationId
        })
        setShowReportSelection(true)
    }

    const handleCreateNewReport = () => {
        router.push({
            pathname: '/reports/create',
            query: {
                taskId: reportContext.taskId,
                reportType: reportContext.reportType,
                standardId: reportContext.standardId,
                criteriaId: reportContext.criteriaId,
                programId: reportContext.programId,
                organizationId: reportContext.organizationId,
                forceModal: true
            }
        })
        setShowReportSelection(false)
        setReportContext(null)
    }

    const handleSelectExistingReport = (reportId) => {
        router.push(`/reports/${reportId}`)
        setShowReportSelection(false)
        setReportContext(null)
    }

    const getStatusLabel = (status) => {
        const icons = {
            pending: <Clock className="w-4 h-4 mr-2" />,
            in_progress: <Clock className="w-4 h-4 mr-2" />,
            submitted: <CheckCircle className="w-4 h-4 mr-2" />,
            approved: <CheckCircle className="w-4 h-4 mr-2" />,
            rejected: <AlertCircle className="w-4 h-4 mr-2" />,
            completed: <CheckCircle className="w-4 h-4 mr-2" />
        }
        const statuses = {
            pending: 'Chờ xử lý',
            in_progress: 'Đang thực hiện',
            submitted: 'Đã nộp',
            approved: 'Được phê duyệt',
            rejected: 'Bị từ chối',
            completed: 'Hoàn thành'
        }
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
            in_progress: 'bg-sky-100 text-sky-700 border border-sky-300',
            submitted: 'bg-cyan-100 text-cyan-700 border border-cyan-300',
            approved: 'bg-green-100 text-green-700 border border-green-300',
            rejected: 'bg-red-100 text-red-700 border border-red-300',
            completed: 'bg-emerald-100 text-emerald-700 border border-emerald-300'
        }
        return (
            <div className={`flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg border whitespace-nowrap ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
                {icons[status]}
                {statuses[status] || status}
            </div>
        )
    }

    const isReporter = userRole === 'reporter'
    const isCreatedTab = activeTab === 'created'

    return (
        <div className="space-y-6">
            {showReportSelection && reportContext && (
                <ReportSelectionModal
                    isOpen={showReportSelection}
                    taskId={reportContext.taskId}
                    reportType={reportContext.reportType}
                    standardId={reportContext.standardId}
                    criteriaId={reportContext.criteriaId}
                    programId={reportContext.programId}
                    organizationId={reportContext.organizationId}
                    onCreateNew={handleCreateNewReport}
                    onSelectExisting={handleSelectExistingReport}
                    onClose={() => {
                        setShowReportSelection(false)
                        setReportContext(null)
                    }}
                />
            )}

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-9 h-9 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Quản lý Nhiệm vụ</h1>
                            <p className="text-blue-100">
                                {isCreatedTab ? 'Những nhiệm vụ bạn đã giao cho người khác' : 'Những nhiệm vụ được giao cho bạn để thực hiện'}
                            </p>
                        </div>
                    </div>
                    {isCreatedTab && (
                        <button
                            onClick={() => {
                                setSelectedTask(null)
                                setShowTaskModal(true)
                            }}
                            className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold text-lg"
                        >
                            <Plus size={24} />
                            Thêm Nhiệm vụ
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => {
                            setActiveTab('created')
                            setPagination({ current: 1, pages: 1, total: 0, hasPrev: false, hasNext: false })
                        }}
                        className={`flex-1 px-6 py-4 font-semibold transition-all ${
                            isCreatedTab
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Nhiệm vụ tôi giao
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('assigned')
                            setPagination({ current: 1, pages: 1, total: 0, hasPrev: false, hasNext: false })
                        }}
                        className={`flex-1 px-6 py-4 font-semibold transition-all ${
                            !isCreatedTab
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Nhiệm vụ của tôi
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending">Chờ xử lý</option>
                            <option value="in_progress">Đang thực hiện</option>
                            <option value="submitted">Đã nộp</option>
                            <option value="approved">Được phê duyệt</option>
                            <option value="rejected">Bị từ chối</option>
                            <option value="completed">Hoàn thành</option>
                        </select>

                        <select
                            value={standardId}
                            onChange={(e) => setStandardId(e.target.value)}
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="">Tất cả tiêu chuẩn</option>
                            {standards.map(std => (
                                <option key={std._id} value={std._id}>
                                    {std.code} - {std.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={criteriaId}
                            onChange={(e) => setCriteriaId(e.target.value)}
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="">Tất cả tiêu chí</option>
                            {criterias.map(crit => (
                                <option key={crit._id} value={crit._id}>
                                    {crit.code} - {crit.name}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() => {
                                setSearch('')
                                setStatus('')
                                setStandardId('')
                                setCriteriaId('')
                            }}
                            className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <RefreshCw size={18} />
                            Reset
                        </button>

                        <button
                            onClick={() => loadTasks(1)}
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <RefreshCw size={18} />
                            Làm mới
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                        <tr>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-300 w-[50px]">STT</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-300 w-[80px]">Mã</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-300 w-[100px]">Loại báo cáo</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-300 w-[100px]">Người giao</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-300 w-[100px]">Thời gian giao</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-300 w-[100px]">Hạn</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-300 w-[120px]">Người được giao</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-300 w-[130px]">Trạng thái</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-blue-300 w-[180px]">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : tasks.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium text-lg">Không có dữ liệu</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            tasks.map((item, index) => (
                                <tr key={item._id} className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200 text-center">
                                        {((pagination.current - 1) * 10) + index + 1}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap border-r border-gray-200 text-center">
                                            <span className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-lg border border-blue-200">
                                                {item.taskCode}
                                            </span>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap border-r border-gray-200 text-center text-sm text-gray-600">
                                        {item.reportType === 'overall_tdg' ? 'Tổng hợp TĐG' : item.reportType === 'standard' ? 'Tiêu chuẩn' : 'Tiêu chí'}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap border-r border-gray-200 text-center text-sm text-gray-600">
                                        {item.createdBy?.fullName || '-'}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap border-r border-gray-200 text-center text-sm text-gray-600">
                                        {formatDate(item.createdAt)}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap border-r border-gray-200 text-center text-sm text-gray-600">
                                        {item.dueDate ? formatDate(item.dueDate) : '-'}
                                    </td>
                                    <td className="px-3 py-4 border-r border-gray-200 text-center text-sm">
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {item.assignedTo?.map(user => (
                                                <span key={user._id} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded border border-purple-200">
                                                        {user.fullName?.split(' ').pop()}
                                                    </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap border-r border-gray-200 text-center">
                                        {getStatusLabel(item.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <div className="flex items-center justify-center gap-2">
                                            <ActionButton
                                                icon={Eye}
                                                variant="view"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedTask(item)
                                                    setShowTaskDetail(true)
                                                }}
                                                title="Xem chi tiết"
                                            />
                                            {!isCreatedTab && isReporter && (
                                                <ActionButton
                                                    icon={FileText}
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleWriteReport(item)}
                                                    title="Viết báo cáo"
                                                />
                                            )}
                                            {isCreatedTab && (
                                                <>
                                                    <ActionButton
                                                        icon={Edit2}
                                                        variant="edit"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedTask(item)
                                                            setShowTaskModal(true)
                                                        }}
                                                        title="Chỉnh sửa"
                                                    />
                                                    <ActionButton
                                                        icon={Trash2}
                                                        variant="delete"
                                                        size="sm"
                                                        onClick={() => handleDelete(item._id)}
                                                        title="Xóa"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {!loading && tasks.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-t-2 border-blue-300 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-bold text-blue-600">{tasks.length}</span> trong tổng số{' '}
                            <span className="font-bold text-blue-600">{pagination.total}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                                disabled={!pagination.hasPrev}
                                className="px-4 py-2 border-2 border-blue-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                                disabled={!pagination.hasNext}
                                className="px-4 py-2 border-2 border-blue-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showTaskModal && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => {
                        setShowTaskModal(false)
                        setSelectedTask(null)
                    }}
                    onSuccess={() => {
                        loadTasks(pagination.current)
                        setShowTaskModal(false)
                        setSelectedTask(null)
                    }}
                />
            )}

            {showTaskDetail && (
                <TaskDetail
                    task={selectedTask}
                    onClose={() => {
                        setShowTaskDetail(false)
                        setSelectedTask(null)
                    }}
                    onSuccess={() => {
                        loadTasks(pagination.current)
                        setShowTaskDetail(false)
                        setSelectedTask(null)
                    }}
                />
            )}
        </div>
    )
}