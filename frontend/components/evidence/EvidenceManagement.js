import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    FileText,
    Plus,
    Search,
    Filter,
    Download,
    Upload,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    Loader2,
    X,
    ChevronLeft,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    Check,
    AlertCircle
} from 'lucide-react'

export default function EvidenceManagement() {
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [evidences, setEvidences] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false
    })

    const [filters, setFilters] = useState({
        search: '',
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        status: '',
        page: 1,
        limit: 10
    })

    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        fetchPrograms()
        fetchOrganizations()
    }, [])

    useEffect(() => {
        if (filters.programId) {
            fetchStandards()
        } else {
            setStandards([])
        }
    }, [filters.programId])

    useEffect(() => {
        if (filters.standardId) {
            fetchCriteria()
        } else {
            setCriteria([])
        }
    }, [filters.standardId])

    useEffect(() => {
        fetchEvidences()
    }, [filters.page, filters.limit])

    const fetchPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll()
            setPrograms(response.data.data.programs || [])
        } catch (error) {
            console.error('Fetch programs error:', error)
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll()
            setOrganizations(response.data.data.organizations || [])
        } catch (error) {
            console.error('Fetch organizations error:', error)
        }
    }

    const fetchStandards = async () => {
        try {
            const response = await apiMethods.standards.getAll({
                programId: filters.programId,
                status: 'active'
            })
            setStandards(response.data.data.standards || response.data.data || [])
        } catch (error) {
            console.error('Fetch standards error:', error)
        }
    }

    const fetchCriteria = async () => {
        try {
            const response = await apiMethods.criteria.getAll({
                standardId: filters.standardId,
                status: 'active'
            })
            const criteriaData = response.data.data.criterias || response.data.data.criteria || response.data.data || []
            setCriteria(criteriaData)
        } catch (error) {
            console.error('Fetch criteria error:', error)
        }
    }

    const fetchEvidences = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.evidences.getAll(filters)
            setEvidences(response.data.data.evidences || [])
            setPagination(response.data.data.pagination || {})
        } catch (error) {
            console.error('Fetch evidences error:', error)
            toast.error('Lỗi khi tải danh sách minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1
        }))
    }

    const handleSearch = () => {
        fetchEvidences()
    }

    const handleClearFilters = () => {
        setFilters({
            search: '',
            programId: '',
            organizationId: '',
            standardId: '',
            criteriaId: '',
            status: '',
            page: 1,
            limit: 10
        })
        setTimeout(() => fetchEvidences(), 100)
    }

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }))
    }

    const handleViewEvidence = (id) => {
        router.push(`/evidence/files?evidenceId=${id}`)
    }

    const handleEditEvidence = (id) => {
        router.push(`/evidence/edit/${id}`)
    }

    const handleDeleteEvidence = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa minh chứng này?')) return

        try {
            await apiMethods.evidences.delete(id)
            toast.success('Xóa minh chứng thành công')
            fetchEvidences()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Lỗi khi xóa minh chứng')
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'new':
                return <Clock className="h-4 w-4 text-gray-500" />
            case 'in_progress':
                return <Clock className="h-4 w-4 text-blue-500" />
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'approved':
                return <Check className="h-4 w-4 text-emerald-500" />
            case 'rejected':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'active':
                return <Check className="h-4 w-4 text-green-500" />
            case 'inactive':
                return <XCircle className="h-4 w-4 text-gray-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusLabel = (status) => {
        const labels = {
            'new': 'Mới',
            'in_progress': 'Đang thực hiện',
            'completed': 'Hoàn thành',
            'approved': 'Đã duyệt',
            'rejected': 'Từ chối',
            'active': 'Hoạt động',
            'inactive': 'Không hoạt động'
        }
        return labels[status] || status
    }

    const getStatusColor = (status) => {
        const colors = {
            'new': 'bg-gray-100 text-gray-700 border-gray-300',
            'in_progress': 'bg-blue-100 text-blue-700 border-blue-300',
            'completed': 'bg-green-100 text-green-700 border-green-300',
            'approved': 'bg-emerald-100 text-emerald-700 border-emerald-300',
            'rejected': 'bg-red-100 text-red-700 border-red-300',
            'active': 'bg-green-100 text-green-700 border-green-300',
            'inactive': 'bg-gray-100 text-gray-700 border-gray-300'
        }
        return colors[status] || colors['new']
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Quản lý minh chứng</h1>
                            <p className="text-indigo-100">Quản lý tất cả minh chứng trong hệ thống</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/evidence/add')}
                        className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-medium shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Thêm minh chứng</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Tổng</p>
                            <p className="text-2xl font-bold text-gray-900">{pagination.total || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Mới</p>
                            <p className="text-2xl font-bold text-gray-700">
                                {evidences.filter(e => e.status === 'new').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Hoàn thành</p>
                            <p className="text-2xl font-bold text-green-700">
                                {evidences.filter(e => e.status === 'completed').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Đã duyệt</p>
                            <p className="text-2xl font-bold text-emerald-700">
                                {evidences.filter(e => e.status === 'approved').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Check className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Từ chối</p>
                            <p className="text-2xl font-bold text-red-700">
                                {evidences.filter(e => e.status === 'rejected').length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã, tên minh chứng..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium inline-flex items-center justify-center"
                    >
                        <Filter className="h-5 w-5 mr-2" />
                        Lọc
                    </button>
                    <button
                        onClick={handleSearch}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium inline-flex items-center justify-center"
                    >
                        <Search className="h-5 w-5 mr-2" />
                        Tìm kiếm
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chương trình
                                </label>
                                <select
                                    value={filters.programId}
                                    onChange={(e) => handleFilterChange('programId', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Tất cả</option>
                                    {programs.map(program => (
                                        <option key={program._id} value={program._id}>
                                            {program.name}
                                        </option>
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
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Tất cả</option>
                                    {organizations.map(org => (
                                        <option key={org._id} value={org._id}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="new">Mới</option>
                                    <option value="in_progress">Đang thực hiện</option>
                                    <option value="completed">Hoàn thành</option>
                                    <option value="approved">Đã duyệt</option>
                                    <option value="rejected">Từ chối</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tiêu chuẩn
                                </label>
                                <select
                                    value={filters.standardId}
                                    onChange={(e) => handleFilterChange('standardId', e.target.value)}
                                    disabled={!filters.programId}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                                >
                                    <option value="">Tất cả</option>
                                    {standards.map(standard => (
                                        <option key={standard._id} value={standard._id}>
                                            {standard.code} - {standard.name}
                                        </option>
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
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                                >
                                    <option value="">Tất cả</option>
                                    {criteria.map(criterion => (
                                        <option key={criterion._id} value={criterion._id}>
                                            {criterion.code} - {criterion.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleClearFilters}
                                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium inline-flex items-center justify-center"
                                >
                                    <X className="h-5 w-5 mr-2" />
                                    Xóa bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <button
                    onClick={fetchEvidences}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                >
                    <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>

                <div className="flex space-x-3">
                    <button
                        onClick={() => router.push('/evidence/evidence-tree')}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                        <FileText className="h-5 w-5 mr-2" />
                        Cây minh chứng
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                    </div>
                ) : evidences.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có minh chứng</h3>
                        <p className="text-gray-500 mb-6">Chưa có minh chứng nào được tạo</p>
                        <button
                            onClick={() => router.push('/evidence/add')}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Thêm minh chứng đầu tiên
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mã MC
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tên minh chứng
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tiêu chuẩn
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tiêu chí
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Files
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {evidences.map((evidence) => (
                                    <tr key={evidence._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                    {evidence.code}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {evidence.name}
                                            </div>
                                            {evidence.description && (
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {evidence.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {evidence.standardId?.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {evidence.criteriaId?.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                    {evidence.files?.length || 0} files
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(evidence.status)}`}>
                                                    {getStatusIcon(evidence.status)}
                                                    <span className="ml-1">{getStatusLabel(evidence.status)}</span>
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewEvidence(evidence._id)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Xem files"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditEvidence(evidence._id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEvidence(evidence._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Hiển thị <span className="font-medium">{((pagination.current - 1) * filters.limit) + 1}</span> đến{' '}
                                    <span className="font-medium">
                                        {Math.min(pagination.current * filters.limit, pagination.total)}
                                    </span>{' '}
                                    trong tổng số <span className="font-medium">{pagination.total}</span> kết quả
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.current - 1)}
                                        disabled={!pagination.hasPrev}
                                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    {[...Array(pagination.pages)].map((_, index) => {
                                        const pageNum = index + 1
                                        if (
                                            pageNum === 1 ||
                                            pageNum === pagination.pages ||
                                            (pageNum >= pagination.current - 1 && pageNum <= pagination.current + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-4 py-2 rounded-lg transition-all ${
                                                        pageNum === pagination.current
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'border border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        } else if (
                                            pageNum === pagination.current - 2 ||
                                            pageNum === pagination.current + 2
                                        ) {
                                            return <span key={pageNum} className="px-2">...</span>
                                        }
                                        return null
                                    })}
                                    <button
                                        onClick={() => handlePageChange(pagination.current + 1)}
                                        disabled={!pagination.hasNext}
                                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}