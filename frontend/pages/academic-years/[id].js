import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    ArrowLeft,
    Calendar,
    Edit3,
    Trash2,
    Copy,
    Settings,
    CheckCircle,
    Clock,
    Archive,
    FileText,
    BookOpen,
    Target,
    CheckSquare,
    Folder,
    Users,
    TrendingUp,
    Activity,
    Info
} from 'lucide-react'

const AcademicYearDetailPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { id } = router.query

    const [academicYear, setAcademicYear] = useState(null)
    const [statistics, setStatistics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const breadcrumbItems = [
        { name: 'Quản lý năm học', href: '/academic-years', icon: Calendar },
        { name: 'Chi tiết' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (id) {
            fetchAcademicYear()
            fetchStatistics()
        }
    }, [id])

    const fetchAcademicYear = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/academic-years/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setAcademicYear(result.data)
                }
            } else {
                setError('Không thể tải thông tin năm học')
            }
        } catch (err) {
            setError('Không thể kết nối đến server')
        } finally {
            setLoading(false)
        }
    }

    const fetchStatistics = async () => {
        try {
            const response = await fetch(`/api/academic-years/statistics/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setStatistics(result.data)
                }
            }
        } catch (err) {
            console.error('Error fetching statistics:', err)
        }
    }

    const handleSetCurrent = async () => {
        try {
            const response = await fetch(`/api/academic-years/${id}/set-current`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                await fetchAcademicYear()
                alert('Đã đặt làm năm học hiện tại thành công')
            } else {
                const error = await response.json()
                alert(error.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            alert('Có lỗi xảy ra khi đặt năm học hiện tại')
        }
    }

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/academic-years/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                router.push('/academic-years/academic-years')
            } else {
                const error = await response.json()
                alert(error.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            alert('Có lỗi xảy ra khi xóa năm học')
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const statusConfig = {
        draft: { label: 'Nháp', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: FileText },
        active: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
        completed: { label: 'Đã hoàn thành', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
        archived: { label: 'Đã lưu trữ', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Archive }
    }

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                {trend && (
                    <div className="flex items-center text-green-600 text-sm font-medium">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {trend}%
                    </div>
                )}
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{value || 0}</h3>
            <p className="text-sm text-gray-600">{title}</p>
        </div>
    )

    if (loading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        )
    }

    if (!user || !academicYear) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy năm học</h2>
                    <p className="text-gray-600 mb-6">Năm học không tồn tại hoặc đã bị xóa</p>
                    <button
                        onClick={() => router.push('/academic-years/academic-years')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                        Quay về danh sách
                    </button>
                </div>
            </Layout>
        )
    }

    const statusInfo = statusConfig[academicYear.status] || statusConfig.draft
    const StatusIcon = statusInfo.icon

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header với gradient */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                                <h1 className="text-3xl font-bold">{academicYear.name}</h1>
                                {academicYear.isCurrent && (
                                    <div className="relative">
                                        <div className="px-3 py-1 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center">
                                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                                            Năm học hiện tại
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-4 text-indigo-100">
                                <div className="flex items-center space-x-2">
                                    <Calendar className="w-5 h-5" />
                                    <span className="font-medium">{academicYear.code}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{academicYear.startYear} - {academicYear.endYear}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => router.push(`/academic-years/${id}/edit`)}
                                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span>Chỉnh sửa</span>
                            </button>
                            <button
                                onClick={() => router.push('/academic-years/academic-years')}
                                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Quay lại</span>
                            </button>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                        <StatusIcon className="w-4 h-4 mr-2" />
                        <span className="font-medium">{statusInfo.label}</span>
                    </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Chương trình đánh giá"
                        value={statistics?.programs || academicYear.metadata?.totalPrograms}
                        icon={BookOpen}
                        color="text-blue-600"
                    />
                    <StatCard
                        title="Tiêu chuẩn đánh giá"
                        value={statistics?.standards || academicYear.metadata?.totalStandards}
                        icon={Target}
                        color="text-orange-600"
                    />
                    <StatCard
                        title="Tiêu chí chi tiết"
                        value={statistics?.criteria || academicYear.metadata?.totalCriteria}
                        icon={CheckSquare}
                        color="text-purple-600"
                    />
                    <StatCard
                        title="Minh chứng"
                        value={statistics?.evidences || academicYear.metadata?.totalEvidences}
                        icon={Folder}
                        color="text-green-600"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Thông tin chi tiết */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Info className="w-5 h-5 mr-2 text-indigo-600" />
                                Thông tin chi tiết
                            </h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Năm bắt đầu</label>
                                        <p className="text-lg font-semibold text-gray-900 mt-1">{academicYear.startYear}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Năm kết thúc</label>
                                        <p className="text-lg font-semibold text-gray-900 mt-1">{academicYear.endYear}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Ngày bắt đầu</label>
                                        <p className="text-base text-gray-900 mt-1">{formatDate(academicYear.startDate)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Ngày kết thúc</label>
                                        <p className="text-base text-gray-900 mt-1">{formatDate(academicYear.endDate)}</p>
                                    </div>
                                </div>

                                {academicYear.description && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Mô tả</label>
                                        <p className="text-base text-gray-700 mt-2 leading-relaxed">{academicYear.description}</p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <div>
                                            <span className="text-gray-500">Người tạo: </span>
                                            <span className="font-medium text-gray-900">{academicYear.createdBy?.fullName || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Ngày tạo: </span>
                                            <span className="font-medium text-gray-900">{formatDate(academicYear.createdAt)}</span>
                                        </div>
                                    </div>
                                    {academicYear.updatedBy && (
                                        <div className="flex items-center justify-between text-sm mt-2">
                                            <div>
                                                <span className="text-gray-500">Người cập nhật: </span>
                                                <span className="font-medium text-gray-900">{academicYear.updatedBy?.fullName || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Cập nhật lần cuối: </span>
                                                <span className="font-medium text-gray-900">{formatDate(academicYear.updatedAt)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tiến độ */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                                Tiến độ hoàn thành
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Tổng quan</span>
                                        <span className="text-2xl font-bold text-indigo-600">
                                            {academicYear.metadata?.completionRate || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                                            style={{ width: `${academicYear.metadata?.completionRate || 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                                        <div className="text-2xl font-bold text-blue-600">{statistics?.programs || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">Chương trình</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-xl">
                                        <div className="text-2xl font-bold text-green-600">{statistics?.evidences || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">Minh chứng</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>

                            <div className="space-y-3">
                                {!academicYear.isCurrent && (
                                    <button
                                        onClick={handleSetCurrent}
                                        className="w-full flex items-center space-x-3 p-3 text-left rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:shadow-md transition-all"
                                    >
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-gray-900">Đặt làm năm học hiện tại</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => router.push(`/academic-years/copy?source=${id}`)}
                                    className="w-full flex items-center space-x-3 p-3 text-left rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:shadow-md transition-all"
                                >
                                    <Copy className="w-5 h-5 text-indigo-600" />
                                    <span className="text-sm font-medium text-gray-900">Sao chép dữ liệu</span>
                                </button>

                                <button
                                    onClick={() => router.push(`/academic-years/settings?id=${id}`)}
                                    className="w-full flex items-center space-x-3 p-3 text-left rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 hover:shadow-md transition-all"
                                >
                                    <Settings className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">Cài đặt</span>
                                </button>

                                {!academicYear.isCurrent && (
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="w-full flex items-center space-x-3 p-3 text-left rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 hover:shadow-md transition-all"
                                    >
                                        <Trash2 className="w-5 h-5 text-red-600" />
                                        <span className="text-sm font-medium text-red-900">Xóa năm học</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Cài đặt sao chép */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Cài đặt sao chép</h3>

                            <div className="space-y-2 text-sm">
                                {academicYear.copySettings?.programs && (
                                    <div className="flex items-center space-x-2 text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Chương trình</span>
                                    </div>
                                )}
                                {academicYear.copySettings?.organizations && (
                                    <div className="flex items-center space-x-2 text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Tổ chức</span>
                                    </div>
                                )}
                                {academicYear.copySettings?.standards && (
                                    <div className="flex items-center space-x-2 text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Tiêu chuẩn</span>
                                    </div>
                                )}
                                {academicYear.copySettings?.criteria && (
                                    <div className="flex items-center space-x-2 text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Tiêu chí</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa năm học</h3>
                            <p className="text-gray-600 mb-6">
                                Bạn có chắc chắn muốn xóa năm học <strong className="text-gray-900">{academicYear.name}</strong>?
                                Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
                                >
                                    Xóa năm học
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}

export default AcademicYearDetailPage