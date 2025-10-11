// frontend/pages/reports/reports.js - UPDATED VERSION
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import { UserPlus, ChevronDown, ChevronRight } from 'lucide-react'
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
    CheckCircle,
    X,
    Loader2,
    BarChart3
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ReportsManagement() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/', icon: FileText },
        { name: 'Quản lý báo cáo' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

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

    useEffect(() => {
        if (user) {
            fetchPrograms()
            fetchOrganizations()
        }
    }, [user])

    useEffect(() => {
        if (user) {
            fetchReports()
        }
    }, [filters.page, filters.type, filters.status, filters.programId, filters.organizationId, filters.standardId, filters.criteriaId, user])

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

    const handleBulkAssign = () => {
        if (selectedItems.length === 0) {
            toast.error('Vui lòng chọn ít nhất một báo cáo')
            return
        }
        router.push(`/reports/assign-reviewers?reportIds=${selectedItems.join(',')}`)
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

    const handleBulkDelete = async () => {
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.length} báo cáo đã chọn?`)) return

        try {
            await Promise.all(selectedItems.map(id => apiMethods.reports.delete(id)))
            toast.success(`Đã xóa ${selectedItems.length} báo cáo`)
            setSelectedItems([])
            fetchReports()
        } catch (error) {
            console.error('Bulk delete error:', error)
            toast.error('Lỗi khi xóa báo cáo')
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

    const getTypeColor = (type) => {
        const colors = {
            criteria_analysis: 'bg-purple-100 text-purple-800 border-purple-200',
            standard_analysis: 'bg-blue-100 text-blue-800 border-blue-200',
            comprehensive_report: 'bg-green-100 text-green-800 border-green-200'
        }
        return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const hasActiveFilters = filters.search || filters.type || filters.status || filters.programId ||
        filters.organizationId || filters.standardId || filters.criteriaId

    if (isLoading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
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

                {/* Search & Filters - giữ nguyên code cũ */}
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

                    {/* Filter panel - giữ nguyên */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            {/* ... code filters giữ nguyên như cũ ... */}
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
                                    onClick={handleBulkAssign}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 font-medium transition-all"
                                >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Phân quyền đánh giá
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 font-medium transition-all"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Xóa
                                </button>
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
                                        <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 w-16">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.length === reports.length}
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                            />
                                        </th>
                                        <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 w-12">
                                            STT
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 w-40">
                                            Mã BC
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300">
                                            Tiêu đề báo cáo
                                        </th>
                                        <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 w-40">
                                            Loại
                                        </th>
                                        <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 w-32">
                                            Tiêu chuẩn
                                        </th>
                                        <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 w-32">
                                            Tiêu chí
                                        </th>
                                        <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 w-32">
                                            Người tạo
                                        </th>
                                        <th className="px-3 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b-2 border-gray-300 w-28">
                                            Ngày tạo
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-300 w-48">
                                            Thao tác
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                    {reports.map((report, index) => (
                                        <tr key={report._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                                            <td className="px-3 py-3 text-center border-r border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(report._id)}
                                                    onChange={() => toggleSelectItem(report._id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                                />
                                            </td>
                                            <td className="px-3 py-3 text-center border-r border-gray-200">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {(pagination.current - 1) * filters.limit + index + 1}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center border-r border-gray-200">
                                                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                                                    {report.code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-r border-gray-200">
                                                <div className="max-w-md">
                                                    <p className="text-sm font-medium text-gray-900 line-clamp-2" title={report.title}>
                                                        {report.title}
                                                    </p>
                                                    <div className="mt-1.5">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                                                            {getStatusLabel(report.status)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-center border-r border-gray-200">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(report.type)}`}>
                                                    {getTypeLabel(report.type)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                {report.standardId && (
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            onClick={() => toggleExpandRow(report._id, 'standard')}
                                                            className="flex items-center space-x-1 text-xs hover:text-blue-600 transition-colors"
                                                            title={`${report.standardId?.code} - ${report.standardId?.name}`}
                                                        >
                                                            {expandedRows[`${report._id}-standard`] ? (
                                                                <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                                            ) : (
                                                                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                                                            )}
                                                            <span className="font-semibold">{report.standardId?.code}</span>
                                                        </button>
                                                        {expandedRows[`${report._id}-standard`] && (
                                                            <div className="absolute mt-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-w-xs">
                                                                <p className="text-xs text-gray-700">{report.standardId?.name}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                {report.criteriaId && (
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            onClick={() => toggleExpandRow(report._id, 'criteria')}
                                                            className="flex items-center space-x-1 text-xs hover:text-blue-600 transition-colors"
                                                            title={`${report.criteriaId?.code} - ${report.criteriaId?.name}`}
                                                        >
                                                            {expandedRows[`${report._id}-criteria`] ? (
                                                                <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                                            ) : (
                                                                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                                                            )}
                                                            <span className="font-semibold">{report.criteriaId?.code}</span>
                                                        </button>
                                                        {expandedRows[`${report._id}-criteria`] && (
                                                            <div className="absolute mt-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-w-xs">
                                                                <p className="text-xs text-gray-700">{report.criteriaId?.name}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center border-r border-gray-200 text-xs text-gray-700">
                                                {report.createdBy?.fullName || 'N/A'}
                                            </td>
                                            <td className="px-3 py-3 text-center border-r border-gray-200 text-xs text-gray-500">
                                                {formatDate(report.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center space-x-1">
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
                                                    <button
                                                        onClick={() => router.push(`/reports/assign-reviewers?reportIds=${report._id}`)}
                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                        title="Phân quyền"
                                                    >
                                                        <UserPlus className="h-4 w-4" />
                                                    </button>
                                                    {report.status === 'draft' && (
                                                        <button
                                                            onClick={() => handlePublish(report._id)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title="Xuất bản"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                    )}
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

                            {/* Pagination */}
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
        </Layout>
    )
}