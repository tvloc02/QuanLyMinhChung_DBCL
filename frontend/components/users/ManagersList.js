import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    Search, Mail, Phone, Briefcase, ChevronLeft,
    ChevronRight, RefreshCw, Calendar
} from 'lucide-react'
import api from '../../services/api'

export default function ManagersList() {
    const router = useRouter()
    const [managers, setManagers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
    })

    useEffect(() => {
        fetchManagers()
    }, [pagination.current, searchTerm])

    const fetchManagers = async () => {
        try {
            setLoading(true)
            const params = {
                page: pagination.current,
                limit: 12,
                role: 'manager',
                status: 'active',
                sortBy: 'fullName',
                sortOrder: 'asc'
            }

            if (searchTerm) params.search = searchTerm

            const response = await api.get('/api/users', { params })

            if (response.data.success) {
                setManagers(response.data.data.users)
                setPagination(response.data.data.pagination)
            }
        } catch (error) {
            console.error('Error fetching managers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (value) => {
        setSearchTerm(value)
        setPagination(prev => ({ ...prev, current: 1 }))
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa đăng nhập'
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Danh sách cán bộ quản lý báo cáo TĐG</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Tổng số: <span className="font-semibold">{pagination.total}</span> cán bộ
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email, phòng ban..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Managers Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            ) : managers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <p className="text-gray-500">Không tìm thấy cán bộ quản lý nào</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {managers.map((manager) => (
                            <div
                                key={manager._id}
                                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/users/${manager._id}`)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-white font-bold text-xl">
                                                {manager.fullName?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                            {manager.fullName}
                                        </h3>
                                        <p className="text-sm text-gray-600 truncate">
                                            {manager.position || 'Cán bộ quản lý'}
                                        </p>
                                        {manager.department && (
                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                {manager.department}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{manager.email}@cmcu.edu.vn</span>
                                    </div>
                                    {manager.phoneNumber && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 flex-shrink-0" />
                                            <span>{manager.phoneNumber}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Access Summary */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                        <Briefcase className="w-3 h-3" />
                                        <span>Phạm vi quản lý:</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {manager.academicYearAccess?.length > 0 && (
                                            <div className="text-xs">
                                                <span className="text-gray-600">Năm học:</span>
                                                <span className="ml-1 font-semibold text-blue-600">
                                                    {manager.academicYearAccess.length}
                                                </span>
                                            </div>
                                        )}
                                        {manager.programAccess?.length > 0 && (
                                            <div className="text-xs">
                                                <span className="text-gray-600">Chương trình:</span>
                                                <span className="ml-1 font-semibold text-green-600">
                                                    {manager.programAccess.length}
                                                </span>
                                            </div>
                                        )}
                                        {manager.organizationAccess?.length > 0 && (
                                            <div className="text-xs">
                                                <span className="text-gray-600">Tổ chức:</span>
                                                <span className="ml-1 font-semibold text-purple-600">
                                                    {manager.organizationAccess.length}
                                                </span>
                                            </div>
                                        )}
                                        {manager.standardAccess?.length > 0 && (
                                            <div className="text-xs">
                                                <span className="text-gray-600">Tiêu chuẩn:</span>
                                                <span className="ml-1 font-semibold text-orange-600">
                                                    {manager.standardAccess.length}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="text-lg font-semibold text-gray-900">
                                            {manager.metadata?.totalReports || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">Báo cáo</div>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="text-lg font-semibold text-gray-900">
                                            {manager.loginCount || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">Đăng nhập</div>
                                    </div>
                                </div>

                                {/* Last Login */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        <span>Đăng nhập gần nhất:</span>
                                    </div>
                                    <p className="text-xs text-gray-700 mt-1">
                                        {formatDate(manager.lastLogin)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="bg-white rounded-lg shadow-sm px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Hiển thị <span className="font-medium">{(pagination.current - 1) * 12 + 1}</span> đến{' '}
                                    <span className="font-medium">
                                        {Math.min(pagination.current * 12, pagination.total)}
                                    </span>{' '}
                                    trong tổng số <span className="font-medium">{pagination.total}</span> cán bộ
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                                        disabled={!pagination.hasPrev}
                                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm text-gray-700">
                                        Trang {pagination.current} / {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                                        disabled={!pagination.hasNext}
                                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}