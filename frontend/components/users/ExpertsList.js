import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    Search, Mail, Phone, Award, ChevronLeft,
    ChevronRight, RefreshCw, Shield
} from 'lucide-react'
import api from '../../services/api'

export default function ExpertsList() {
    const router = useRouter()
    const [experts, setExperts] = useState([])
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
        fetchExperts()
    }, [pagination.current, searchTerm])

    const fetchExperts = async () => {
        try {
            setLoading(true)
            const params = {
                page: pagination.current,
                limit: 12,
                role: 'expert',
                status: 'active',
                sortBy: 'fullName',
                sortOrder: 'asc'
            }

            if (searchTerm) params.search = searchTerm

            const response = await api.get('/users', { params })

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

    const handleSearch = (value) => {
        setSearchTerm(value)
        setPagination(prev => ({ ...prev, current: 1 }))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Danh sách chuyên gia đánh giá</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Tổng số: <span className="font-semibold">{pagination.total}</span> chuyên gia
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="mt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email, chuyên môn..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Experts Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            ) : experts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <p className="text-gray-500">Không tìm thấy chuyên gia nào</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {experts.map((expert) => (
                            <div
                                key={expert._id}
                                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/users/${expert._id}`)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                            <span className="text-white font-bold text-xl">
                                                {expert.fullName?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                            {expert.fullName}
                                        </h3>
                                        <p className="text-sm text-gray-600 truncate">
                                            {expert.position || 'Chuyên gia'}
                                        </p>
                                        {expert.department && (
                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                {expert.department}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{expert.email}@cmcu.edu.vn</span>
                                    </div>
                                    {expert.phoneNumber && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 flex-shrink-0" />
                                            <span>{expert.phoneNumber}</span>
                                        </div>
                                    )}
                                </div>

                                {expert.expertise && expert.expertise.length > 0 && (
                                    <div className="mt-4">
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                            <Award className="w-3 h-3" />
                                            <span>Chuyên môn:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {expert.expertise.slice(0, 3).map((item, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                            {expert.expertise.length > 3 && (
                                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                                    +{expert.expertise.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Access Info */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            <span>Quyền truy cập</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {expert.standardAccess?.length > 0 && (
                                                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                                                    {expert.standardAccess.length} TC
                                                </span>
                                            )}
                                            {expert.criteriaAccess?.length > 0 && (
                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                                                    {expert.criteriaAccess.length} TI
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="text-lg font-semibold text-gray-900">
                                            {expert.metadata?.totalEvaluations || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">Đánh giá</div>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="text-lg font-semibold text-gray-900">
                                            {expert.metadata?.totalReports || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">Báo cáo</div>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <div className="text-lg font-semibold text-gray-900">
                                            {expert.metadata?.totalAssignments || 0}
                                        </div>
                                        <div className="text-xs text-gray-600">Phân công</div>
                                    </div>
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
                                    trong tổng số <span className="font-medium">{pagination.total}</span> chuyên gia
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