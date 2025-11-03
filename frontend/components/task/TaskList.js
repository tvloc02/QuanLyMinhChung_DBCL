import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Plus, Search, Trash2, Edit2, Eye, RefreshCw, Filter, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import TaskModal from './TaskModal'
import TaskDetail from './TaskDetail'
import { ActionButton } from '../ActionButtons'

export default function TaskList() {
    const router = useRouter()
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
    const [standards, setStandards] = useState([])
    const [criterias, setCriterias] = useState([])

    useEffect(() => {
        const role = localStorage.getItem('userRole') || ''
        setUserRole(role)
    }, [])

    useEffect(() => {
        if (pagination && pagination.current !== undefined) {
            loadTasks(pagination.current)
        }
    }, [pagination.current, search, status, standardId, criteriaId])

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

            const response = await apiMethods.tasks.getAll(params)

            if (response.data.success) {
                // ⭐️ SỬA LỖI: Đảm bảo tasks luôn là mảng, dùng optional chaining an toàn
                const loadedTasks = response.data.data?.tasks || []
                const newPagination = response.data.data?.pagination || { current: 1, pages: 1, total: 0, hasPrev: false, hasNext: false }

                setTasks(loadedTasks)
                setPagination(newPagination)
            } else {
                // Đảm bảo setTasks về mảng rỗng nếu phản hồi thành công nhưng không có dữ liệu
                setTasks([])
            }
        } catch (error) {
            toast.error('Không thể tải danh sách nhiệm vụ')
            setTasks([]) // ⭐️ SỬA LỖI: Luôn đặt tasks về mảng rỗng khi thất bại
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa nhiệm vụ này?')) return

        try {
            await apiMethods.tasks.delete(id)
            toast.success('Xóa thành công')
            loadTasks(pagination.current)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa thất bại')
        }
    }

    const handleWriteReport = (task) => {
        router.push({
            pathname: '/reports/create',
            query: {
                criteriaId: task.criteriaId?._id || task.criteriaId,
                standardId: task.standardId?._id || task.standardId,
                taskId: task._id
            }
        })
    }

    const getStatusIconComponent = (status) => {
        const icons = {
            pending: <Clock className="w-4 h-4 mr-2" />,
            in_progress: <Clock className="w-4 h-4 mr-2" />,
            submitted: <CheckCircle className="w-4 h-4 mr-2" />,
            approved: <CheckCircle className="w-4 h-4 mr-2" />,
            rejected: <AlertCircle className="w-4 h-4 mr-2" />,
            completed: <CheckCircle className="w-4 h-4 mr-2" />
        }
        return icons[status] || null
    }

    const getStatusLabel = (status) => {
        const statuses = {
            pending: 'Chờ xử lý',
            in_progress: 'Đang thực hiện',
            submitted: 'Đã nộp',
            approved: 'Được phê duyệt',
            rejected: 'Bị từ chối',
            completed: 'Hoàn thành'
        }
        return (
            <div className={`
                flex items-center justify-center 
                px-3 py-1.5 text-xs font-bold rounded-lg border 
                ${getStatusColor(status)}
                whitespace-nowrap
            `}>
                {getStatusIconComponent(status)}
                {statuses[status] || status}
            </div>
        )
    }

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
            in_progress: 'bg-blue-100 text-blue-700 border border-blue-300',
            submitted: 'bg-cyan-100 text-cyan-700 border border-cyan-300',
            approved: 'bg-green-100 text-green-700 border border-green-300',
            rejected: 'bg-red-100 text-red-700 border border-red-300',
            completed: 'bg-emerald-100 text-emerald-700 border border-emerald-300'
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
    }

    const canManage = userRole === 'admin' || userRole === 'manager'
    const isReporter = userRole === 'reporter'

    return (
        <div className="space-y-6 p-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-9 h-9 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Quản lý Nhiệm vụ</h1>
                            <p className="text-blue-100">Giao việc báo cáo minh chứng cho báo cáo viên</p>
                        </div>
                    </div>
                    {canManage && (
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nhiệm vụ..."
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
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                        <RefreshCw size={18} />
                        Reset
                    </button>

                    <button
                        onClick={() => loadTasks(1)}
                        className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                        <RefreshCw size={18} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gradient-to-r from-blue-50 to-sky-50">
                        <tr>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[50px]">STT</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[80px]">Mã</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 min-w-[180px] max-w-[250px]">Mô tả</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[100px]">Tiêu chuẩn</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[100px]">Tiêu chí</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[130px]">Trạng thái</th>
                            <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-[90px]">Hạn</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-blue-200 w-[200px]">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : tasks.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium text-lg">Không có dữ liệu</p>
                                        <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo nhiệm vụ mới</p>
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
                                    <td className="px-6 py-4 border-r border-gray-200">
                                        <div className="text-sm font-semibold text-gray-900 line-clamp-2">{item.description}</div>
                                    </td>
                                    <td className="px-3 py-4 border-r border-gray-200 text-center">
                                        <div className="text-sm text-gray-900">
                                            <span className="font-bold text-purple-600">{item.standardId?.code || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 border-r border-gray-200 text-center">
                                        <div className="text-sm text-gray-900">
                                            <span className="font-bold text-blue-600">{item.criteriaId?.code || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap border-r border-gray-200 text-center">
                                        {getStatusLabel(item.status)}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap border-r border-gray-200 text-sm text-gray-600 text-center">
                                        {item.dueDate ? formatDate(item.dueDate) : '-'}
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
                                            {isReporter && (
                                                <ActionButton
                                                    icon={FileText}
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleWriteReport(item)}
                                                    title="Viết báo cáo"
                                                />
                                            )}
                                            {canManage && (
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
                    <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-t-2 border-blue-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-bold text-blue-600">{tasks.length}</span> trong tổng số{' '}
                            <span className="font-bold text-blue-600">{pagination.total}</span> nhiệm vụ
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