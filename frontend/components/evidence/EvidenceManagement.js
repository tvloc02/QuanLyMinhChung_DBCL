import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
import { ActionButton } from '../ActionButtons'
import toast from 'react-hot-toast'
import {
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Upload,
    RefreshCw,
    FileText,
    ArrowRightLeft,
    Trash,
    X,
    Loader2,
    ChevronDown,
    ChevronRight,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Square,
    CheckSquare,
    UserPlus
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import MoveEvidenceModal from './MoveEvidenceModal.js'
import ApproveFilesModal from './ApproveFilesModal.js'
import AssignUsersModal from './AssignUsersModal.js'
import { useAuth } from '../../contexts/AuthContext'
import AssignUsersSingleModal from "./AssignUsersSingleModal";
import UploadEvidenceFile from '../file/UploadEvidenceFile';

const ITEMS_PER_PAGE = 20;

export default function EvidenceManagement() {
    const router = useRouter()
    const { user, isLoading: isAuthLoading } = useAuth()
    const isAdmin = user?.role === 'admin'
    const isManager = user?.role === 'manager'
    const isTDG = user?.role === 'tdg'
    const userDepartmentId = user?.department;

    const [evidences, setEvidences] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
    })

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        page: 1,
        limit: ITEMS_PER_PAGE,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    })

    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])

    const [selectedEvidence, setSelectedEvidence] = useState(null)
    const [showMoveModal, setShowMoveModal] = useState(false)
    const [showApproveModal, setShowApproveModal] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [selectedItems, setSelectedItems] = useState([])
    const [showAssignSingleModal, setShowAssignSingleModal] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [expandedRows, setExpandedRows] = useState({})

    useEffect(() => {
        fetchPrograms()
        fetchOrganizations()
    }, [])

    useEffect(() => {
        if (!isAuthLoading) {
            fetchEvidences()
        }
    }, [isAuthLoading, filters.page, filters.status, filters.programId, filters.organizationId, filters.standardId, filters.criteriaId])

    useEffect(() => {
        if (filters.programId && filters.organizationId) {
            fetchStandards()
        } else {
            setStandards([])
            setFilters(prev => ({ ...prev, standardId: '', criteriaId: '' }))
        }
    }, [filters.programId, filters.organizationId])

    useEffect(() => {
        if (filters.standardId) {
            fetchCriteria()
        } else {
            setCriteria([])
            setFilters(prev => ({ ...prev, criteriaId: '' }))
        }
    }, [filters.standardId])

    const fetchEvidences = async () => {
        try {
            setLoading(true)

            const params = {
                page: filters.page,
                limit: filters.limit,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder
            }

            if (filters.search) params.search = filters.search
            if (filters.status) params.status = filters.status
            if (filters.programId) params.programId = filters.programId
            if (filters.organizationId) params.organizationId = filters.organizationId
            if (filters.standardId) params.standardId = filters.standardId
            if (filters.criteriaId) params.criteriaId = filters.criteriaId

            const response = await apiMethods.evidences.getAll(params)
            const data = response.data?.data || response.data

            setEvidences(data?.evidences || [])
            setPagination(data?.pagination || { current: 1, pages: 1, total: 0, hasNext: false, hasPrev: false })
        } catch (error) {
            console.error('Fetch evidences error:', error)
            toast.error('Lỗi khi tải danh sách minh chứng')
            setEvidences([])
        } finally {
            setLoading(false)
        }
    }

    const fetchPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll()
            setPrograms(response.data?.data?.programs || [])
        } catch (error) {
            console.error('Fetch programs error:', error)
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll()
            setOrganizations(response.data?.data?.organizations || [])
        } catch (error) {
            console.error('Fetch organizations error:', error)
        }
    }

    const fetchStandards = async () => {
        try {
            const response = await apiMethods.standards.getAll({
                programId: filters.programId,
                organizationId: filters.organizationId
            })
            setStandards(response.data?.data?.standards || response.data?.data || [])
        } catch (error) {
            console.error('Fetch standards error:', error)
            setStandards([])
        }
    }

    const fetchCriteria = async () => {
        try {
            const response = await apiMethods.criteria.getAll({
                standardId: filters.standardId
            })
            const criteriaData = response.data?.data?.criterias ||
                response.data?.data?.criteria ||
                response.data?.data || []
            setCriteria(criteriaData)
        } catch (error) {
            console.error('Fetch criteria error:', error)
            setCriteria([])
        }
    }

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1
        }))
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setFilters(prev => ({ ...prev, page: 1 }));
        if(filters.page === 1) fetchEvidences();
    }

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }))
    }

    const handleViewDetail = (id) => {
        router.push(`/evidence/files?evidenceId=${id}`)
    }

    const handleEdit = (evidence) => {
        router.push(`/evidence/edit/${evidence._id}`)
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa minh chứng này? Hành động này sẽ xóa vĩnh viễn tất cả file đính kèm.')) return

        try {
            await apiMethods.evidences.delete(id)
            toast.success('Xóa minh chứng thành công')
            fetchEvidences()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xóa minh chứng')
        }
    }

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) {
            toast.error('Vui lòng chọn minh chứng để xóa')
            return
        }

        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.length} minh chứng đã chọn? Hành động này sẽ xóa vĩnh viễn tất cả file đính kèm.`)) return

        try {
            for (const id of selectedItems) {
                await apiMethods.evidences.delete(id)
            }
            toast.success(`Đã xóa ${selectedItems.length} minh chứng`)
            setSelectedItems([])
            fetchEvidences()
        } catch (error) {
            console.error('Bulk delete error:', error)
            toast.error('Lỗi khi xóa minh chứng')
        }
    }

    const handleMove = (evidence) => {
        setSelectedEvidence(evidence)
        setShowMoveModal(true)
    }

    const handleMoveSuccess = () => {
        setShowMoveModal(false)
        setSelectedEvidence(null)
        fetchEvidences()
    }

    const handleBulkApprove = () => {
        if (selectedItems.length === 0) {
            toast.error('Vui lòng chọn minh chứng để duyệt file')
            return
        }
        setShowApproveModal(true)
    }

    const handleApproveSuccess = () => {
        setShowApproveModal(false)
        setSelectedItems([])
        fetchEvidences()
    }

    const handleBulkAssign = () => {
        if (selectedItems.length === 0) {
            toast.error('Vui lòng chọn minh chứng để phân quyền')
            return
        }
        setShowAssignModal(true)
    }

    const handleAssignSuccess = () => {
        setShowAssignModal(false)
        setSelectedItems([])
        fetchEvidences()
    }

    const handleSingleAssign = (evidence) => {
        setSelectedEvidence(evidence)
        setShowAssignSingleModal(true)
    }

    const handleSingleAssignSuccess = () => {
        setShowAssignSingleModal(false)
        setSelectedEvidence(null)
        fetchEvidences()
    }

    const handleUploadFiles = (evidence) => {
        setSelectedEvidence(evidence)
        setShowUploadModal(true)
    }

    const handleUploadSuccess = () => {
        setShowUploadModal(false)
        setSelectedEvidence(null)
        fetchEvidences()
    }

    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedItems.length === evidences.length) {
            setSelectedItems([])
        } else {
            setSelectedItems(evidences.map(e => e._id))
        }
    }

    const toggleExpandRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            programId: '',
            organizationId: '',
            standardId: '',
            criteriaId: '',
            page: 1,
            limit: ITEMS_PER_PAGE,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        })
    }

    const hasActiveFilters = filters.search || filters.status || filters.programId ||
        filters.organizationId || filters.standardId || filters.criteriaId

    const getEvidenceStatusDisplay = (status, files) => {
        const fileCount = files?.length || 0;
        const approvedCount = files?.filter(f => f.approvalStatus === 'approved').length || 0;
        const pendingCount = files?.filter(f => f.approvalStatus === 'pending').length || 0;
        const rejectedCount = files?.filter(f => f.approvalStatus === 'rejected').length || 0;

        switch (status) {
            case 'new':
                return { status: 'new', text: 'Mới', color: 'gray', icon: FileText };
            case 'assigned':
                return { status: 'assigned', text: 'ĐãPQ', color: 'yellow', icon: AlertCircle };
            case 'in_progress':
                if (fileCount > 0 && pendingCount > 0) {
                    return { status: 'pending_approval', text: 'ChờD', color: 'purple', icon: Clock };
                }
                return { status: 'in_progress', text: 'ĐangTH', color: 'blue', icon: Clock };
            case 'pending_approval':
                return { status: 'pending_approval', text: 'ChờD', color: 'purple', icon: Clock };
            case 'approved':
                return { status: 'approved', text: 'ĐãD', color: 'green', icon: CheckCircle };
            case 'rejected':
                return { status: 'rejected', text: 'ĐãTC', color: 'red', icon: XCircle };
            default:
                if (fileCount === 0) {
                    return { status: 'no_files', text: 'Chưa có file', color: 'gray', icon: FileText };
                }
                return { status: 'unknown', text: 'Trạng thái không rõ', color: 'gray', icon: AlertCircle };
        }
    }

    const ApprovalStatusBadge = ({ evidence }) => {
        const statusDisplay = getEvidenceStatusDisplay(evidence.status, evidence.files);
        const Icon = statusDisplay.icon;

        const colorClasses = {
            gray: 'bg-gray-100 text-gray-700 border-gray-200',
            yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            green: 'bg-green-100 text-green-700 border-green-200',
            red: 'bg-red-100 text-red-700 border-red-200',
            blue: 'bg-blue-100 text-blue-700 border-blue-200',
            teal: 'bg-teal-100 text-teal-700 border-teal-200',
            new: 'bg-gray-100 text-gray-700 border-gray-200',
            assigned: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
            pending_approval: 'bg-purple-100 text-purple-700 border-purple-200',
            unknown: 'bg-red-100 text-red-700 border-red-200'
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${colorClasses[statusDisplay.status] || colorClasses['unknown']}`}>
                {Icon && <Icon className="h-3.5 w-3.5 mr-1" />}
                {statusDisplay.text}
            </span>
        )
    }

    const canEditEvidence = (evidence) => {
        if (isAdmin) return true;
        return !!((isManager || isTDG) && userDepartmentId && evidence.departmentId?._id?.toString() === userDepartmentId);

    }

    const getActionButtons = (evidence) => {
        const buttons = [];

        buttons.push({
            icon: Eye,
            title: 'Xem minh chứng',
            onClick: () => handleViewDetail(evidence._id),
            variant: 'view',
            show: true
        });

        if (isAdmin) {
            buttons.push({
                icon: Edit,
                title: 'Chỉnh sửa minh chứng',
                onClick: () => handleEdit(evidence),
                variant: 'edit',
                show: true
            });

            buttons.push({
                icon: ArrowRightLeft,
                title: 'Di chuyển minh chứng',
                onClick: () => handleMove(evidence),
                variant: 'primary',
                show: true
            });

            buttons.push({
                icon: Trash2,
                title: 'Xóa minh chứng',
                onClick: () => handleDelete(evidence._id),
                variant: 'delete',
                show: true
            });
        } else if (isManager && canEditEvidence(evidence)) {
            // MANAGER: xem, sửa, phân quyền, chuyển, xóa
            buttons.push({
                icon: Edit,
                title: 'Chỉnh sửa minh chứng',
                onClick: () => handleEdit(evidence),
                variant: 'edit',
                show: true
            });

            buttons.push({
                icon: UserPlus,
                title: 'Phân quyền nộp file',
                onClick: () => handleSingleAssign(evidence),
                variant: 'purple',
                show: true
            });

            buttons.push({
                icon: ArrowRightLeft,
                title: 'Di chuyển minh chứng',
                onClick: () => handleMove(evidence),
                variant: 'primary',
                show: true
            });

            buttons.push({
                icon: Trash2,
                title: 'Xóa minh chứng',
                onClick: () => handleDelete(evidence._id),
                variant: 'delete',
                show: true
            });
        } else if (isTDG) {
            // TDG: xem, upload file (chỉ nếu được phân quyền)
            const isAssignedToThisUser = evidence.assignedTo?.some(user => user._id?.toString() === user?.id);

            buttons.push({
                icon: Upload,
                title: isAssignedToThisUser
                    ? 'Thêm file minh chứng'
                    : 'Bạn chưa được phân quyền upload file',
                onClick: isAssignedToThisUser ? () => handleUploadFiles(evidence) : undefined,
                variant: isAssignedToThisUser ? 'success' : 'disabled',
                show: true,
                disabled: !isAssignedToThisUser
            });
        }

        return buttons.filter(b => b.show);
    }

    const ActionMenu = ({ evidence }) => {
        const buttons = getActionButtons(evidence);

        return (
            <div className="flex items-center justify-center gap-3 flex-wrap">
                {buttons.map((btn, idx) => (
                    <ActionButton
                        key={idx}
                        icon={btn.icon}
                        title={btn.title}
                        onClick={btn.onClick}
                        variant={btn.variant}
                        size="sm"
                        disabled={btn.disabled}
                    />
                ))}
            </div>
        );
    }

    const getColumnWidths = () => {

        return {
            standard: 'w-28',
            criteria: 'w-28',
            status: 'w-24',
            action: 'w-72'  // Hẹp lại, vừa đủ cho 5 button
        };
    };

    const columnWidths = getColumnWidths();

    if (isAuthLoading) {
        return (
            <div className="flex flex-col justify-center items-center py-16 min-h-[500px]">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Đang tải dữ liệu người dùng...</p>
            </div>
        )
    }

    if (!isAdmin && !userDepartmentId) {
        return (
            <div className="p-16 text-center bg-white rounded-2xl shadow-lg">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Không có quyền truy cập</h3>
                <p className="text-gray-500">
                    Bạn không phải là Admin và chưa được gán vào phòng ban nào.
                    Vui lòng liên hệ Admin để được gán phòng ban.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Quản lý minh chứng</h1>
                            <p className="text-blue-100">
                                Quản lý và tổ chức các minh chứng trong hệ thống
                            </p>
                        </div>
                    </div>
                    {(isAdmin || isManager) && (
                        <button
                            onClick={() => router.push('/evidence/create')}
                            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-xl transition-all font-semibold"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Tạo minh chứng mới
                        </button>
                    )}
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên, mã, số hiệu văn bản..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </form>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center px-4 py-3 rounded-xl transition-all font-semibold ${
                                showFilters || hasActiveFilters
                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Filter className="h-5 w-5 mr-2" />
                            Bộ lọc
                            {hasActiveFilters && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                                    {[filters.status, filters.programId, filters.organizationId,
                                        filters.standardId, filters.criteriaId].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={fetchEvidences}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-semibold"
                        >
                            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-900">Lọc nâng cao</h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Chương trình
                                </label>
                                <select
                                    value={filters.programId}
                                    onChange={(e) => handleFilterChange('programId', e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Tất cả chương trình</option>
                                    {programs.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tổ chức
                                </label>
                                <select
                                    value={filters.organizationId}
                                    onChange={(e) => handleFilterChange('organizationId', e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Tất cả tổ chức</option>
                                    {organizations.map(o => (
                                        <option key={o._id} value={o._id}>{o.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tiêu chuẩn
                                </label>
                                <select
                                    value={filters.standardId}
                                    onChange={(e) => handleFilterChange('standardId', e.target.value)}
                                    disabled={!filters.programId || !filters.organizationId}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">Tất cả tiêu chuẩn</option>
                                    {standards.map(s => (
                                        <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tiêu chí
                                </label>
                                <select
                                    value={filters.criteriaId}
                                    onChange={(e) => handleFilterChange('criteriaId', e.target.value)}
                                    disabled={!filters.standardId}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">Tất cả tiêu chí</option>
                                    {criteria.map(c => (
                                        <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-2 border-blue-200 rounded-xl p-4 shadow-md">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-900 font-semibold">
                            Đã chọn <strong className="text-lg text-blue-600">{selectedItems.length}</strong> minh chứng
                        </span>
                        <div className="flex space-x-3 flex-wrap">
                            <button
                                onClick={() => setSelectedItems([])}
                                className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 text-sm rounded-xl hover:bg-gray-50 border-2 border-gray-300 font-semibold transition-all shadow-md"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Hủy chọn
                            </button>

                            {isManager && (
                                <button
                                    onClick={handleBulkAssign}
                                    className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 font-semibold transition-all shadow-md hover:shadow-lg"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Phân Quyền Nộp File
                                </button>
                            )}

                            {isAdmin && (
                                <button
                                    onClick={handleBulkApprove}
                                    className="inline-flex items-center px-5 py-2.5 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 font-semibold transition-all shadow-md hover:shadow-lg"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Duyệt File Hàng Loạt
                                </button>
                            )}

                            {(isAdmin || isManager) && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 font-semibold transition-all shadow-md hover:shadow-lg"
                                >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Xóa tất cả
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">
                            Danh sách minh chứng
                            <span className="ml-2 text-sm font-semibold text-blue-600">
                                ({pagination.total} kết quả)
                            </span>
                        </h2>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : evidences.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-10 w-10 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có minh chứng nào'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {hasActiveFilters
                                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác'
                                : 'Bắt đầu bằng cách tạo minh chứng đầu tiên'
                            }
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
                            >
                                Xóa bộ lọc
                            </button>
                        ) : (isAdmin || isManager) && (
                            <button
                                onClick={() => router.push('/evidence/create')}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Tạo minh chứng mới
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gradient-to-r from-blue-50 to-sky-50">
                                <tr>
                                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.length === evidences.length}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                        />
                                    </th>
                                    <th className="px-2 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-12">
                                        STT
                                    </th>
                                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-28">
                                        Mã MC
                                    </th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200">
                                        Tên minh chứng
                                    </th>
                                    <th className={`px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 ${columnWidths.standard}`}>
                                        Tiêu chuẩn
                                    </th>
                                    <th className={`px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 ${columnWidths.criteria}`}>
                                        Tiêu chí
                                    </th>
                                    <th className="px-2 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-16">
                                        Files
                                    </th>
                                    <th className={`px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 ${columnWidths.status}`}>
                                        Trạng thái
                                    </th>
                                    <th className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-24">
                                        Ngày tạo
                                    </th>
                                    <th className={`px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-blue-200 ${columnWidths.action}`}>
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white">
                                {evidences.map((evidence, index) => {
                                    return (
                                        <tr key={evidence._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                            <td className="px-3 py-3 text-center border-r border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(evidence._id)}
                                                    onChange={() => toggleSelectItem(evidence._id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                                />
                                            </td>
                                            <td className="px-2 py-3 text-center border-r border-gray-200">
                                            <span className="text-sm font-semibold text-gray-700">
                                                {((pagination.current - 1) * filters.limit) + index + 1}
                                            </span>
                                            </td>
                                            <td className="px-3 py-3 text-center border-r border-gray-200">
                                            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                                                {evidence.code}
                                            </span>
                                            </td>
                                            <td className="px-4 py-3 border-r border-gray-200">
                                                <div className="max-w-md">
                                                    <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={evidence.name}>
                                                        {evidence.name}
                                                    </p>
                                                    {evidence.documentNumber && (
                                                        <p className="text-xs text-gray-500 mt-1 truncate" title={`Số: ${evidence.documentNumber}`}>
                                                            Số: {evidence.documentNumber}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                {evidence.standardId && (
                                                    <div>
                                                        <button
                                                            onClick={() => toggleExpandRow(evidence._id)}
                                                            className="flex items-start space-x-1 text-xs hover:text-blue-600 transition-colors w-full text-left"
                                                        >
                                                            {expandedRows[evidence._id] ? (
                                                                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
                                                            ) : (
                                                                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-gray-500" />
                                                            )}
                                                            <div className="flex-1">
                                                                <span className="font-bold text-blue-700">{evidence.standardId?.code}</span>
                                                                {expandedRows[evidence._id] && evidence.standardId?.name && (
                                                                    <p className="mt-1 text-gray-600 leading-relaxed">
                                                                        {evidence.standardId?.name}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                {evidence.criteriaId && (
                                                    <div>
                                                        <button
                                                            onClick={() => toggleExpandRow(evidence._id)}
                                                            className="flex items-start space-x-1 text-xs hover:text-blue-600 transition-colors w-full text-left"
                                                        >
                                                            {expandedRows[evidence._id] ? (
                                                                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
                                                            ) : (
                                                                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-gray-500" />
                                                            )}
                                                            <div className="flex-1">
                                                                <span className="font-bold text-blue-700">{evidence.criteriaId?.code}</span>
                                                                {expandedRows[evidence._id] && evidence.criteriaId?.name && (
                                                                    <p className="mt-1 text-gray-600 leading-relaxed">
                                                                        {evidence.criteriaId?.name}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-2 py-3 text-center border-r border-gray-200">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                                {evidence.files?.length || 0}
                                            </span>
                                            </td>
                                            <td className="px-3 py-3 text-center border-r border-gray-200">
                                                <ApprovalStatusBadge evidence={evidence} />
                                            </td>
                                            <td className="px-3 py-3 text-center border-r border-gray-200 text-xs font-medium text-gray-600">
                                                {formatDate(evidence.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <ActionMenu evidence={evidence} />
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>

                        {pagination.pages > 1 && (
                            <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-t-2 border-blue-200">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <p className="text-sm text-gray-700">
                                        Hiển thị <strong className="text-blue-600">{((pagination.current - 1) * filters.limit) + 1}</strong> đến{' '}
                                        <strong className="text-blue-600">{Math.min(pagination.current * filters.limit, pagination.total)}</strong> trong tổng số{' '}
                                        <strong className="text-blue-600">{pagination.total}</strong> kết quả
                                    </p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => handlePageChange(pagination.current - 1)}
                                            disabled={!pagination.hasPrev}
                                            className="px-4 py-2 text-sm border-2 border-blue-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
                                        >
                                            Trước
                                        </button>
                                        {[...Array(pagination.pages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            if (
                                                pagination.pages <= 7 ||
                                                pageNum === 1 || pageNum === pagination.pages ||
                                                (pageNum >= pagination.current - 2 && pageNum <= pagination.current + 2)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-4 py-2 text-sm rounded-xl transition-all font-semibold ${
                                                            pagination.current === pageNum
                                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                                                : 'border-2 border-blue-200 hover:bg-white text-gray-700'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if ((pageNum === pagination.current - 3 && pagination.current > 4) || (pageNum === pagination.current + 3 && pagination.current < pagination.pages - 3)) {
                                                return <span key={pageNum} className="px-2 py-2 text-sm">...</span>;
                                            }
                                            return null;
                                        })}
                                        <button
                                            onClick={() => handlePageChange(pagination.current + 1)}
                                            disabled={!pagination.hasNext}
                                            className="px-4 py-2 text-sm border-2 border-blue-300 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-gray-700"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {showMoveModal && selectedEvidence && (
                <MoveEvidenceModal
                    evidence={selectedEvidence}
                    onClose={() => {
                        setShowMoveModal(false)
                        setSelectedEvidence(null)
                    }}
                    onSuccess={handleMoveSuccess}
                />
            )}

            {showApproveModal && (
                <ApproveFilesModal
                    evidenceIds={selectedItems}
                    onClose={() => setShowApproveModal(false)}
                    onSuccess={handleApproveSuccess}
                />
            )}

            {showAssignModal && (
                <AssignUsersModal
                    evidenceIds={selectedItems}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={handleAssignSuccess}
                />
            )}

            {showAssignSingleModal && selectedEvidence && (
                <AssignUsersSingleModal
                    evidence={selectedEvidence}
                    onClose={() => {
                        setShowAssignSingleModal(false)
                        setSelectedEvidence(null)
                    }}
                    onSuccess={handleSingleAssignSuccess}
                />
            )}

            {showUploadModal && selectedEvidence && (
                <UploadEvidenceFile
                    evidence={selectedEvidence}
                    onClose={() => {
                        setShowUploadModal(false)
                        setSelectedEvidence(null)
                    }}
                    onSuccess={handleUploadSuccess}
                />
            )}

        </div>
    )
}