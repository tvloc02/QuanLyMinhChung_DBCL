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
    Info,
    Loader2
} from 'lucide-react'
import { ActionButton } from '../../components/ActionButtons'

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

    // Đã thay đổi màu sắc và icon để đồng bộ với tông xanh lam
    const StatCard = ({ title, value, icon: Icon, colorClass, trend }) => (
        <div className="bg-white rounded-xl border border-blue-200 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorClass.bg}`}>
                    <Icon className={`w-6 h-6 ${colorClass.text}`} />
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

    // Component hiển thị trường thông tin chi tiết dạng box
    const DetailBox = ({ label, value, icon: Icon, span = 1, small = false }) => (
        <div className={`col-span-1 bg-white rounded-xl border border-blue-200 p-4 ${small ? 'h-full' : ''}`}>
            <label className="flex items-center text-sm font-medium text-gray-500 mb-1">
                <Icon className='w-4 h-4 mr-1 text-blue-400'/>
                {label}
            </label>
            <p className={`font-semibold text-gray-900 ${small ? 'text-base' : 'text-lg'}`}>
                {value || '-'}
            </p>
        </div>
    );

    if (loading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            </Layout>
        )
    }

    if (!user || !academicYear) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-red-200 mx-4">
                    <Calendar className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy năm học</h2>
                    <p className="text-gray-600 mb-6">Năm học không tồn tại hoặc đã bị xóa</p>
                    <button
                        onClick={() => router.push('/academic-years')}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                        <ArrowLeft className='w-4 h-4 mr-2' /> Quay về danh sách
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
                {/* Header - Màu xanh lam */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
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
                            <div className="flex items-center space-x-4 text-blue-100">
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

                        {/* Nút thao tác trên Header (Giữ nguyên phong cách ban đầu) */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => router.push(`/academic-years/edit/${id}`)}
                                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all text-white font-medium"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span>Chỉnh sửa</span>
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all text-white font-medium"
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
                        colorClass={{ text: "text-blue-600", bg: "bg-blue-100" }}
                    />
                    <StatCard
                        title="Tiêu chuẩn đánh giá"
                        value={statistics?.standards || academicYear.metadata?.totalStandards}
                        icon={Target}
                        colorClass={{ text: "text-orange-600", bg: "bg-orange-100" }}
                    />
                    <StatCard
                        title="Tiêu chí chi tiết"
                        value={statistics?.criteria || academicYear.metadata?.totalCriteria}
                        icon={CheckSquare}
                        colorClass={{ text: "text-purple-600", bg: "bg-purple-100" }}
                    />
                    <StatCard
                        title="Minh chứng"
                        value={statistics?.evidences || academicYear.metadata?.totalEvidences}
                        icon={Folder}
                        colorClass={{ text: "text-green-600", bg: "bg-green-100" }}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Thông tin chi tiết - Kẻ thành từng box */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Info className="w-5 h-5 mr-2 text-blue-600" />
                                Thông tin chi tiết
                            </h2>

                            {/* Grid container cho các DetailBox */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailBox
                                    label="Tên năm học"
                                    value={academicYear.name}
                                    icon={FileText}
                                />
                                <DetailBox
                                    label="Mã năm học"
                                    value={academicYear.code}
                                    icon={Calendar}
                                />
                                <DetailBox
                                    label="Năm bắt đầu"
                                    value={academicYear.startYear}
                                    icon={Clock}
                                />
                                <DetailBox
                                    label="Năm kết thúc"
                                    value={academicYear.endYear}
                                    icon={Clock}
                                />
                                <DetailBox
                                    label="Ngày bắt đầu"
                                    value={formatDate(academicYear.startDate)}
                                    icon={Calendar}
                                />
                                <DetailBox
                                    label="Ngày kết thúc"
                                    value={formatDate(academicYear.endDate)}
                                    icon={Calendar}
                                />

                                {/* Mô tả - Cần tùy chỉnh để chiếm toàn bộ chiều rộng */}
                                {academicYear.description && (
                                    <div className="col-span-1 md:col-span-2 bg-white rounded-xl border border-blue-200 p-4">
                                        <label className="flex items-center text-sm font-medium text-gray-500 mb-1">
                                            <Info className='w-4 h-4 mr-1 text-blue-400'/>
                                            Mô tả
                                        </label>
                                        <p className="text-base text-gray-700 mt-1 leading-relaxed">{academicYear.description}</p>
                                    </div>
                                )}

                                {/* Audit Info - Sử dụng DetailBox nhỏ */}
                                <DetailBox
                                    label="Người tạo"
                                    value={academicYear.createdBy?.fullName || 'N/A'}
                                    icon={Users}
                                    small
                                />
                                <DetailBox
                                    label="Ngày tạo"
                                    value={formatDate(academicYear.createdAt)}
                                    icon={Calendar}
                                    small
                                />
                                {academicYear.updatedBy && (
                                    <>
                                        <DetailBox
                                            label="Người cập nhật"
                                            value={academicYear.updatedBy?.fullName || 'N/A'}
                                            icon={Users}
                                            small
                                        />
                                        <DetailBox
                                            label="Cập nhật lần cuối"
                                            value={formatDate(academicYear.updatedAt)}
                                            icon={Calendar}
                                            small
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Tiến độ */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                                Tiến độ hoàn thành
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Tổng quan</span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {academicYear.metadata?.completionRate || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                                            style={{ width: `${academicYear.metadata?.completionRate || 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                                        <div className="text-2xl font-bold text-blue-600">{statistics?.programs || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">Chương trình</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                                        <div className="text-2xl font-bold text-green-600">{statistics?.evidences || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">Minh chứng</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions - Đã chuyển sang màu xanh nhạt */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>

                            <div className="space-y-3">
                                {!academicYear.isCurrent && (
                                    <button
                                        onClick={handleSetCurrent}
                                        className="w-full flex items-center space-x-3 p-3 text-left rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all"
                                    >
                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">Đặt làm năm học hiện tại</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => router.push(`/academic-years/copy?source=${id}`)}
                                    className="w-full flex items-center space-x-3 p-3 text-left rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all"
                                >
                                    <Copy className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">Sao chép dữ liệu</span>
                                </button>

                                {!academicYear.isCurrent && (
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="w-full flex items-center space-x-3 p-3 text-left rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">Xóa năm học</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Cài đặt sao chép */}
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Xác nhận xóa năm học</h3>
                            <p className="text-gray-600 mb-6 text-center">
                                Bạn có chắc chắn muốn xóa năm học <strong className="text-gray-900">{academicYear.name}</strong>?
                                Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold"
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