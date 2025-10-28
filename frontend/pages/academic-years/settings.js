import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    ArrowLeft,
    Settings,
    Save,
    RefreshCw,
    BookOpen,
    Building2,
    Target,
    CheckSquare,
    Folder,
    Calendar,
    AlertCircle,
    CheckCircle,
    Info,
    Eye,
    Edit,
    TrendingUp,
    Activity,
    Loader2
} from 'lucide-react'

const AcademicYearSettingsPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { id } = router.query

    const breadcrumbItems = [
        { name: 'Quản lý năm học', href: '/academic-years', icon: Calendar },
        { name: 'Cài đặt' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    const [loading, setLoading] = useState(false)
    const [fetchingData, setFetchingData] = useState(true)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const [academicYear, setAcademicYear] = useState(null)
    const [statistics, setStatistics] = useState(null)
    const [copySettings, setCopySettings] = useState({
        programs: true,
        organizations: true,
        standards: true,
        criteria: true,
        evidenceTemplates: false
    })

    useEffect(() => {
        if (id) {
            fetchAcademicYear()
            fetchStatistics()
        }
    }, [id])

    const fetchAcademicYear = async () => {
        try {
            const response = await fetch(`/api/academic-years/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setAcademicYear(result.data)
                    setCopySettings(result.data.copySettings || copySettings)
                }
            } else {
                setError('Không thể tải thông tin năm học')
            }
        } catch (err) {
            setError('Không thể kết nối đến server')
        } finally {
            setFetchingData(false)
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

    const handleCopySettingChange = (key) => {
        setCopySettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const handleSaveSettings = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/academic-years/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    copySettings
                })
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setSuccess(true)
                setAcademicYear(result.data)
                setTimeout(() => setSuccess(false), 3000)
            } else {
                setError(result.message || 'Có lỗi xảy ra khi lưu cài đặt')
            }
        } catch (err) {
            setError('Không thể kết nối đến server')
        } finally {
            setLoading(false)
        }
    }

    const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${bgColor}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{value || 0}</h3>
            <p className="text-sm text-gray-600">{title}</p>
        </div>
    )

    const copyOptions = [
        {
            key: 'programs',
            label: 'Chương trình đánh giá',
            description: 'Sao chép cấu trúc chương trình và thiết lập',
            icon: BookOpen,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            key: 'organizations',
            label: 'Tổ chức đánh giá',
            description: 'Sao chép thông tin tổ chức và liên hệ',
            icon: Building2,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            key: 'standards',
            label: 'Tiêu chuẩn',
            description: 'Sao chép các tiêu chuẩn và hướng dẫn đánh giá',
            icon: Target,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
        },
        {
            key: 'criteria',
            label: 'Tiêu chí đánh giá',
            description: 'Sao chép tiêu chí chi tiết và yêu cầu',
            icon: CheckSquare,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            key: 'evidenceTemplates',
            label: 'Mẫu minh chứng',
            description: 'Sao chép cấu trúc minh chứng (không bao gồm files)',
            icon: Folder,
            color: 'text-red-600',
            bgColor: 'bg-red-50'
        }
    ]

    if (fetchingData) {
        return (
            <Layout title="Cài đặt năm học" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải cài đặt...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user || !academicYear) {
        return (
            <Layout title="Cài đặt năm học" breadcrumbItems={breadcrumbItems}>
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy năm học</h2>
                    <p className="text-gray-600 mb-4">Năm học không tồn tại hoặc đã bị xóa</p>
                    <button
                        onClick={() => router.push('/academic-years')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                        Quay về danh sách
                    </button>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Cài đặt năm học" breadcrumbItems={breadcrumbItems}>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header với gradient */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Settings className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Cài đặt năm học</h1>
                                <div className="flex items-center space-x-3 text-indigo-100">
                                    <span>{academicYear.name}</span>
                                    <span>•</span>
                                    <span>{academicYear.code}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {academicYear.isCurrent && (
                                <div className="px-3 py-1 bg-green-500 bg-opacity-20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Hiện tại
                                </div>
                            )}
                            <button
                                onClick={() => router.push('/academic-years')}
                                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Quay lại</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            <p className="text-green-800 font-medium">Cài đặt đã được lưu thành công</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Statistics Overview */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                    <Activity className="w-6 h-6 mr-2 text-indigo-600" />
                                    Thống kê tổng quan
                                </h2>
                                <button
                                    onClick={fetchStatistics}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="Làm mới thống kê"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard
                                    title="Chương trình"
                                    value={statistics?.programs || academicYear.metadata?.totalPrograms}
                                    icon={BookOpen}
                                    color="text-blue-600"
                                    bgColor="bg-blue-50"
                                />
                                <StatCard
                                    title="Tiêu chuẩn"
                                    value={statistics?.standards || academicYear.metadata?.totalStandards}
                                    icon={Target}
                                    color="text-orange-600"
                                    bgColor="bg-orange-50"
                                />
                                <StatCard
                                    title="Tiêu chí"
                                    value={statistics?.criteria || academicYear.metadata?.totalCriteria}
                                    icon={CheckSquare}
                                    color="text-purple-600"
                                    bgColor="bg-purple-50"
                                />
                                <StatCard
                                    title="Minh chứng"
                                    value={statistics?.evidences || academicYear.metadata?.totalEvidences}
                                    icon={Folder}
                                    color="text-green-600"
                                    bgColor="bg-green-50"
                                />
                            </div>

                            {/* Completion Progress */}
                            <div className="mt-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-700 flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" />
                                        Tiến độ hoàn thành
                                    </span>
                                    <span className="text-2xl font-bold text-indigo-600">
                                        {academicYear.metadata?.completionRate || 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-white rounded-full h-3 overflow-hidden shadow-inner">
                                    <div
                                        className="h-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                                        style={{ width: `${academicYear.metadata?.completionRate || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Copy Settings */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Cài đặt sao chép mặc định</h2>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                                <div className="flex items-start">
                                    <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-blue-900 font-semibold mb-1">Về cài đặt sao chép</h3>
                                        <p className="text-blue-800 text-sm">
                                            Các cài đặt này sẽ được sử dụng mặc định khi sao chép dữ liệu từ năm học này sang năm học khác.
                                            Bạn có thể thay đổi các cài đặt này trong quá trình sao chép.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {copyOptions.map(option => {
                                    const Icon = option.icon
                                    return (
                                        <div
                                            key={option.key}
                                            className={`border rounded-xl p-4 transition-all cursor-pointer ${
                                                copySettings[option.key]
                                                    ? `${option.bgColor} border-${option.color.split('-')[1]}-200 shadow-sm`
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <label className="flex items-start cursor-pointer">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        type="checkbox"
                                                        checked={copySettings[option.key]}
                                                        onChange={() => handleCopySettingChange(option.key)}
                                                        className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                                                    />
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Icon className={`w-5 h-5 ${option.color}`} />
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {option.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-700">
                                    Đã chọn <span className="font-semibold text-indigo-600">{Object.values(copySettings).filter(Boolean).length}</span> / {copyOptions.length} mục
                                </div>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={loading}
                                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Đang lưu...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Lưu cài đặt</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push(`/academic-years/${id}`)}
                                    className="w-full flex items-center space-x-3 p-3 text-left rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:shadow-md transition-all"
                                >
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <Eye className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">Xem chi tiết</span>
                                </button>

                                <button
                                    onClick={() => router.push(`/academic-years/${id}/edit`)}
                                    className="w-full flex items-center space-x-3 p-3 text-left rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:shadow-md transition-all"
                                >
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                        <Edit className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">Chỉnh sửa</span>
                                </button>
                            </div>
                        </div>

                        {/* Year Information */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin năm học</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Mã năm học:</span>
                                    <span className="font-semibold text-gray-900">{academicYear.code}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Thời gian:</span>
                                    <span className="font-semibold text-gray-900">
                                        {academicYear.startYear} - {academicYear.endYear}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Ngày bắt đầu:</span>
                                    <span className="font-semibold text-gray-900">
                                        {new Date(academicYear.startDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Ngày kết thúc:</span>
                                    <span className="font-semibold text-gray-900">
                                        {new Date(academicYear.endDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600">Người tạo:</span>
                                    <span className="font-semibold text-gray-900">
                                        {academicYear.createdBy?.fullName || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600">Ngày tạo:</span>
                                    <span className="font-semibold text-gray-900">
                                        {new Date(academicYear.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>

                            {academicYear.description && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Mô tả</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{academicYear.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default AcademicYearSettingsPage