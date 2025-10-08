import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    Search, Mail, Phone, Briefcase, ChevronLeft,
    ChevronRight, RefreshCw, Calendar, UserCog
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
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <UserCog className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Danh sách cán bộ quản lý báo cáo TĐG</h1>
                            <p className="text-purple-100">Quản lý cán bộ quản lý trong hệ thống</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email, phòng ban..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                    </div>
                    {pagination.total > 0 && (
                        <div className="mt-3 text-sm text-gray-600">
                            Tổng số: <span className="font-semibold text-purple-600">{pagination.total}</span> cán bộ
                        </div>
                    )}
                </div>
            </div>

            {/* Managers Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            ) : managers.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCog className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">Không tìm thấy cán bộ quản lý nào</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {managers.map((manager) => (
                            <div
                                key={manager._id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer"
                                onClick={() => router.push(`/users/${manager._id}`)}
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                            <span className="text-white font-bold text-xl">
                                                {manager.fullName?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
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

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="w-4 h-4 flex-shrink-0 text-purple-500" />
                                        <span className="truncate">{manager.email}@cmcu.edu.vn</span>
                                    </div>
                                    {manager.phoneNumber && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 flex-shrink-0 text-green-500" />
                                            <span>{manager.phoneNumber}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Access Summary */}
                                <div className="pt-4 border-t border-gray-100 mb-4">
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                                        <Briefcase className="w-3 h-3 text-orange-500" />
                                        <span className="font-semibold">Phạm vi quản lý:</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {manager.academicYearAccess?.length > 0 && (
                                            <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                                <span className="text-xs text-gray-600 block mb-1">Năm học:</span>
                                                <span className="text-sm font-bold text-blue-600">
                                                    {manager.academicYearAccess.length}
                                                </span>
                                            </div>
                                        )}
                                        {manager.programAccess?.length > 0 && (
                                            <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                                <span className="text-xs text-gray-600 block mb-1">Chương trình:</span>
                                                <span className="text-sm font-bold text-green-600">
                                                    {manager.programAccess.length}
                                                </span>
                                            </div>
                                        )}
                                        {manager.organizationAccess?.length > 0 && (
                                            <div className="p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                                                <span className="text-xs text-gray-600 block mb-1">Tổ chức:</span>
                                                <span className="text-sm font-bold text-purple-600">
                                                    {manager.organizationAccess.length}
                                                </span>
                                            </div>
                                        )}
                                        {manager.standardAccess?.length > 0 && (
                                            <div className="p-2 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                                                <span className="text-xs text-gray-600 block mb-1">Tiêu chuẩn:</span>
                                                <span className="text-sm font-bold text-orange-600">
                                                    {manager.standardAccess.length}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                        <div className="text-lg font-bold text-gray-900">
                                            {manager.metadata?.totalReports || 0}
                                        </div>
                                        <div className="text-xs text-gray-600 font-medium">Báo cáo</div>
                                    </div>
                                    <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                        <div className="text-lg font-bold text-gray-900">
                                            {manager.loginCount || 0}
                                        </div>
                                        <div className="text-xs text-gray-600 font-medium">Đăng nhập</div>
                                    </div>
                                </div>

                                {/* Last Login */}
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                        <Calendar className="w-3 h-3 text-indigo-500" />
                                        <span className="font-semibold">Đăng nhập gần nhất:</span>
                                    </div>
                                    <p className="text-xs text-gray-700 font-medium">
                                        {formatDate(manager.lastLogin)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Hiển thị <span className="font-semibold text-purple-600">{(pagination.current - 1) * 12 + 1}</span> đến{' '}
                                    <span className="font-semibold text-purple-600">
                                        {Math.min(pagination.current * 12, pagination.total)}
                                    </span>{' '}
                                    trong tổng số <span className="font-semibold text-purple-600">{pagination.total}</span> cán bộ
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                                        disabled={!pagination.hasPrev}
                                        className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-semibold text-gray-700 px-4 py-2 bg-gray-50 rounded-lg border-2 border-gray-200">
                                        Trang {pagination.current} / {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                                        disabled={!pagination.hasNext}
                                        className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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