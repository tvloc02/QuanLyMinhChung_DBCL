import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    FileText,
    Download,
    Upload,
    CheckCircle,
    X,
    Loader2,
    BarChart3
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ReportsManagement() {
    const router = useRouter()

    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0
    })

    const [filters, setFilters] = useState({
        search: '',
        type: '',
        status: '',
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    })

    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])

    const [selectedItems, setSelectedItems] = useState([])
    const [showFilters, setShowFilters] = useState(false)
    const [expandedRows, setExpandedRows] = useState({})
    const [columnWidths, setColumnWidths] = useState({
        checkbox: 60,
        code: 150,
        title: 300,
        type: 180,
        standard: 180,
        criteria: 180,
        creator: 150,
        date: 120,
        actions: 200
    })
    const [resizing, setResizing] = useState(null)

    useEffect(() => {
        fetchPrograms()
        fetchOrganizations()
    }, [])

    useEffect(() => {
        fetchReports()
    }, [filters.page, filters.type, filters.status, filters.programId, filters.organizationId, filters.standardId, filters.criteriaId])

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

    useEffect(() => {
        if (!resizing) return

        const handleMouseMove = (e) => {
            const diff = e.clientX - resizing.startX
            const newWidth = Math.max(60, resizing.startWidth + diff)
            setColumnWidths(prev => ({
                ...prev,
                [resizing.column]: newWidth
            }))
        }

        const handleMouseUp = () => {
            setResizing(null)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [resizing])

    const fetchReports = async () => {
        try {
            setLoading(true)

            const params = {
                page: filters.page,
                limit: filters.limit,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder
            }

            if (filters.search) params.search = filters.search
            if (filters.type) params.type = filters.type
            if (filters.status) params.status = filters.status
            if (filters.programId) params.programId = filters.programId
            if (filters.organizationId) params.organizationId = filters.organizationId
            if (filters.standardId) params.standardId = filters.standardId
            if (filters.criteriaId) params.criteriaId = filters.criteriaId

            const response = await apiMethods.reports.getAll(params)
            const data = response.data?.data || response.data

            setReports(data?.reports || [])
            setPagination(data?.pagination || { current: 1, pages: 1, total: 0 })
        } catch (error) {
            console.error('Fetch reports error:', error)
            toast.error('Lỗi khi tải danh sách báo cáo')
            setReports([])
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
        fetchReports()
    }

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }))
    }

    const handleViewDetail = (id) => {
        router.push(`/reports/${id}`)
    }

    const handleEdit = (id) => {
        router.push(`/reports/${id}/edit`)
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) return

        try {
            await apiMethods.reports.delete(id)
            toast.success('Xóa báo cáo thành công')
            fetchReports()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xóa báo cáo')
        }
    }

    const handlePublish = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xuất bản báo cáo này?')) return

        try {
            await apiMethods.reports.publish(id)
            toast.success('Xuất bản báo cáo thành công')
            fetchReports()
        } catch (error) {
            console.error('Publish error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi xuất bản báo cáo')
        }
    }

    const handleDownload = async (id, format = 'html') => {
        try {
            const response = await apiMethods.reports.download(id, format)
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `report-${id}.${format}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('Tải xuống báo cáo thành công')
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Lỗi khi tải xuống báo cáo')
        }
    }

    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedItems.length === reports.length) {
            setSelectedItems([])
        } else {
            setSelectedItems(reports.map(r => r._id))
        }
    }

    const toggleExpandRow = (id, field) => {
        setExpandedRows(prev => ({
            ...prev,
            [`${id}-${field}`]: !prev[`${id}-${field}`]
        }))
    }

    const handleMouseDown = (e, column) => {
        e.preventDefault()
        setResizing({ column, startX: e.clientX, startWidth: columnWidths[column] })
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            type: '',
            status: '',
            programId: '',
            organizationId: '',
            standardId: '',
            criteriaId: '',
            page: 1,
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        })
    }

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-800 border-gray-200',
            under_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            published: 'bg-green-100 text-green-800 border-green-200',
            archived: 'bg-blue-100 text-blue-800 border-blue-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            under_review: 'Đang xem xét',
            published: 'Đã xuất bản',
            archived: 'Lưu trữ'
        }
        return labels[status] || status
    }

    const getTypeLabel = (type) => {
        const labels = {
            criteria_analysis: 'Phân tích tiêu chí',
            standard_analysis: 'Phân tích tiêu chuẩn',
            comprehensive_report: 'Báo cáo tổng hợp'
        }
        return labels[type] || type
    }

    const hasActiveFilters = filters.search || filters.type || filters.status || filters.programId ||
        filters.organizationId || filters.standardId || filters.criteriaId

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Quản lý báo cáo</h1>
                            <p className="text-blue-100">
                                Quản lý và đánh giá các báo cáo trong hệ thống
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push('/reports/assignments')}
                            className="inline-flex items-center px-6 py-3 bg-white bg-opacity-20 text-white rounded-xl hover:bg-opacity-30 transition-all font-medium"
                        >
                            <BarChart3 className="h-5 w-5 mr-2" />
                            Phân công
                        </button>
                        <button
                            onClick={() => router.push('/reports/create')}
                            className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-medium shadow-lg"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Tạo báo cáo mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tiêu đề, mã báo cáo..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </form>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center px-4 py-3 rounded-xl transition-all font-medium ${
                                showFilters || hasActiveFilters
                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Filter className="h-5 w-5 mr-2" />
                            Bộ lọc
                            {hasActiveFilters && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                                    {[filters.type, filters.status, filters.programId, filters.organizationId,
                                        filters.standardId, filters.criteriaId].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={fetchReports}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                        >
                            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">Lọc nâng cao</h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Loại báo cáo
                                </label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả loại</option>
                                    <option value="criteria_analysis">Phân tích tiêu chí</option>
                                    <option value="standard_analysis">Phân tích tiêu chuẩn</option>
                                    <option value="comprehensive_report">Báo cáo tổng hợp</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="draft">Bản nháp</option>
                                    <option value="under_review">Đang xem xét</option>
                                    <option value="published">Đã xuất bản</option>
                                    <option value="archived">Lưu trữ</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chương trình
                                </label>
                                <select
                                    value={filters.programId}
                                    onChange={(e) => handleFilterChange('programId', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả chương trình</option>
                                    {programs.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tổ chức
                                </label>
                                <select
                                    value={filters.organizationId}
                                    onChange={(e) => handleFilterChange('organizationId', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tất cả tổ chức</option>
                                    {organizations.map(o => (
                                        <option key={o._id} value={o._id}>{o.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tiêu chuẩn
                                </label>
                                <select
                                    value={filters.standardId}
                                    onChange={(e) => handleFilterChange('standardId', e.target.value)}
                                    disabled={!filters.programId || !filters.organizationId}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">Tất cả tiêu chuẩn</option>
                                    {standards.map(s => (
                                        <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tiêu chí
                                </label>
                                <select
                                    value={filters.criteriaId}
                                    onChange={(e) => handleFilterChange('criteriaId', e.target.value)}
                                    disabled={!filters.standardId}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-900 font-medium">
                            Đã chọn <strong className="text-lg">{selectedItems.length}</strong> báo cáo
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setSelectedItems([])}
                                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 text-sm rounded-xl hover:bg-gray-50 border-2 border-gray-200 font-medium transition-all"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Hủy chọn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Danh sách báo cáo
                            <span className="ml-2 text-sm font-normal text-gray-500">
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
                ) : reports.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {hasActiveFilters ? 'Không tìm thấy kết quả' : 'Chưa có báo cáo nào'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {hasActiveFilters
                                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác'
                                : 'Bắt đầu bằng cách tạo báo cáo đầu tiên'
                            }
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all"
                            >
                                Xóa bộ lọc
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/reports/create')}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium transition-all"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Tạo báo cáo mới
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th
                                        className="px-4 py-4 text-left border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.checkbox }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.length === reports.length}
                                            onChange={toggleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                        />
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'checkbox')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.code }}
                                    >
                                        Mã BC
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'code')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.title }}
                                    >
                                        Tiêu đề báo cáo
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'title')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.type }}
                                    >
                                        Loại
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'type')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.standard }}
                                    >
                                        Tiêu chuẩn
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'standard')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.criteria }}
                                    >
                                        Tiêu chí
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'criteria')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.creator }}
                                    >
                                        Người tạo
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'creator')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 relative group"
                                        style={{ width: columnWidths.date }}
                                    >
                                        Ngày tạo
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 group-hover:bg-blue-300"
                                            onMouseDown={(e) => handleMouseDown(e, 'date')}
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-300"
                                        style={{ width: columnWidths.actions }}
                                    >
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white">
                                {reports.map((report) => (
                                    <tr key={report._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                        <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.checkbox }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(report._id)}
                                                onChange={() => toggleSelectItem(report._id)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                            />
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.code }}>
                                            <span className="text-sm font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                {report.code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.title }}>
                                            <div className="relative">
                                                <p
                                                    className={`text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 ${
                                                        expandedRows[`${report._id}-title`] ? '' : 'truncate'
                                                    }`}
                                                    onClick={() => toggleExpandRow(report._id, 'title')}
                                                    title={report.title}
                                                >
                                                    {report.title}
                                                </p>
                                                {report.summary && (
                                                    <p className="text-xs text-gray-500 mt-1 truncate" title={report.summary}>
                                                        {report.summary}
                                                    </p>
                                                )}
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                                                        {getStatusLabel(report.status)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-xs" style={{ width: columnWidths.type }}>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                {getTypeLabel(report.type)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.standard }}>
                                            <div
                                                className={`text-xs cursor-pointer hover:text-blue-600 ${
                                                    expandedRows[`${report._id}-standard`] ? '' : 'truncate'
                                                }`}
                                                onClick={() => toggleExpandRow(report._id, 'standard')}
                                                title={`${report.standardId?.code} - ${report.standardId?.name}`}
                                            >
                                                <span className="font-semibold">{report.standardId?.code}</span>
                                                {report.standardId?.name && ` - ${report.standardId?.name}`}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200" style={{ width: columnWidths.criteria }}>
                                            <div
                                                className={`text-xs cursor-pointer hover:text-blue-600 ${
                                                    expandedRows[`${report._id}-criteria`] ? '' : 'truncate'
                                                }`}
                                                onClick={() => toggleExpandRow(report._id, 'criteria')}
                                                title={`${report.criteriaId?.code} - ${report.criteriaId?.name}`}
                                            >
                                                <span className="font-semibold">{report.criteriaId?.code}</span>
                                                {report.criteriaId?.name && ` - ${report.criteriaId?.name}`}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-sm text-gray-700" style={{ width: columnWidths.creator }}>
                                            {report.createdBy?.fullName || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 border-r border-gray-200 text-sm text-gray-500" style={{ width: columnWidths.date }}>
                                            {formatDate(report.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right" style={{ width: columnWidths.actions }}>
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewDetail(report._id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(report._id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {report.status === 'draft' && (
                                                    <button
                                                        onClick={() => handlePublish(report._id)}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                        title="Xuất bản"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDownload(report._id)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Tải xuống"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(report._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {pagination.pages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Hiển thị <strong>{((pagination.current - 1) * filters.limit) + 1}</strong> đến{' '}
                                        <strong>{Math.min(pagination.current * filters.limit, pagination.total)}</strong> trong tổng số{' '}
                                        <strong>{pagination.total}</strong> kết quả
                                    </p>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handlePageChange(pagination.current - 1)}
                                            disabled={!pagination.hasPrev}
                                            className="px-4 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                        >
                                            Trước
                                        </button>
                                        {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                                            let pageNum;
                                            if (pagination.pages <= 7) {
                                                pageNum = i + 1;
                                            } else if (pagination.current <= 4) {
                                                pageNum = i + 1;
                                            } else if (pagination.current >= pagination.pages - 3) {
                                                pageNum = pagination.pages - 6 + i;
                                            } else {
                                                pageNum = pagination.current - 3 + i;
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-4 py-2 text-sm rounded-xl transition-all font-medium ${
                                                        pagination.current === pageNum
                                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                                            : 'border-2 border-gray-200 hover:bg-white'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => handlePageChange(pagination.current + 1)}
                                            disabled={!pagination.hasNext}
                                            className="px-4 py-2 text-sm border-2 border-gray-200 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
        </div>
    )
}