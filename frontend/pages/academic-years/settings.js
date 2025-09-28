import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import Link from 'next/link'
import {
    ArrowLeft,
    Settings,
    Save,
    RefreshCw,
    BarChart3,
    BookOpen,
    Building2,
    Target,
    CheckSquare,
    Folder,
    FileText,
    Users,
    Calendar,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Info,
    Eye,
    Download,
    Upload
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

    const StatCard = ({ title, value, icon: Icon, color, description }) => (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
                <div className={`p-3 rounded-lg ${color} bg-opacity-10 mr-4`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">{value || 0}</h3>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {description && (
                        <p className="text-xs text-gray-500 mt-1">{description}</p>
                    )}
                </div>
            </div>
        </div>
    )

    const copyOptions = [
        {
            key: 'programs',
            label: 'Chương trình đánh giá',
            description: 'Sao chép cấu trúc chương trình và thiết lập',
            icon: BookOpen,
            color: 'text-blue-600'
        },
        {
            key: 'organizations',
            label: 'Tổ chức đánh giá',
            description: 'Sao chép thông tin tổ chức và liên hệ',
            icon: Building2,
            color: 'text-green-600'
        },
        {
            key: 'standards',
            label: 'Tiêu chuẩn',
            description: 'Sao chép các tiêu chuẩn và hướng dẫn đánh giá',
            icon: Target,
            color: 'text-orange-600'
        },
        {
            key: 'criteria',
            label: 'Tiêu chí đánh giá',
            description: 'Sao chép tiêu chí chi tiết và yêu cầu',
            icon: CheckSquare,
            color: 'text-purple-600'
        },
        {
            key: 'evidenceTemplates',
            label: 'Mẫu minh chứng',
            description: 'Sao chép cấu trúc minh chứng (không bao gồm files)',
            icon: Folder,
            color: 'text-red-600'
        }
    ]

    if (fetchingData) {
        return (
            <Layout
                title="Cài đặt năm học"
                breadcrumbItems={breadcrumbItems}
            >
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải cài đặt...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user) {
        return null
    }

    if (!academicYear) {
        return (
            <Layout
                title="Cài đặt năm học"
                breadcrumbItems={breadcrumbItems}
            >
                <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy năm học</h2>
                    <p className="text-gray-600 mb-4">Năm học không tồn tại hoặc đã bị xóa</p>
                    <Link href="/academic-years">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Quay về danh sách
                        </button>
                    </Link>
                </div>
            </Layout>
        )
    }

    return (
        <Layout
            title="Cài đặt năm học"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">Cài đặt năm học</h1>
                        <p className="text-gray-600">{academicYear.name} ({academicYear.code})</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {academicYear.isCurrent && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Hiện tại
                            </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            academicYear.status === 'active' ? 'bg-green-100 text-green-800' :
                                academicYear.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    academicYear.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                        }`}>
                            {academicYear.status === 'active' ? 'Hoạt động' :
                                academicYear.status === 'completed' ? 'Hoàn thành' :
                                    academicYear.status === 'draft' ? 'Nháp' : 'Lưu trữ'}
                        </span>
                        <Link href="/academic-years">
                            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                <span>Quay lại</span>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            <p className="text-green-800">Cài đặt đã được lưu thành công</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Statistics Overview */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">Thống kê tổng quan</h2>
                                <button
                                    onClick={fetchStatistics}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                    title="Làm mới thống kê"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard
                                    title="Chương trình"
                                    value={statistics?.programs || academicYear.metadata?.totalPrograms}
                                    icon={BookOpen}
                                    color="text-blue-600"
                                    description="Chương trình đánh giá"
                                />
                                <StatCard
                                    title="Tiêu chuẩn"
                                    value={statistics?.standards || academicYear.metadata?.totalStandards}
                                    icon={Target}
                                    color="text-orange-600"
                                    description="Tiêu chuẩn đánh giá"
                                />
                                <StatCard
                                    title="Tiêu chí"
                                    value={statistics?.criteria || academicYear.metadata?.totalCriteria}
                                    icon={CheckSquare}
                                    color="text-purple-600"
                                    description="Tiêu chí chi tiết"
                                />
                                <StatCard
                                    title="Minh chứng"
                                    value={statistics?.evidences || academicYear.metadata?.totalEvidences}
                                    icon={Folder}
                                    color="text-green-600"
                                    description="Minh chứng đã tạo"
                                />
                            </div>

                            {/* Completion Progress */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Tiến độ hoàn thành</span>
                                    <span className="text-sm text-gray-600">
                                        {academicYear.metadata?.completionRate || 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${academicYear.metadata?.completionRate || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Copy Settings */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt sao chép mặc định</h2>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start">
                                    <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="text-blue-800 font-medium mb-1">Về cài đặt sao chép</h3>
                                        <p className="text-blue-700 text-sm">
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
                                        <div key={option.key} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                            <div className="flex items-start">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        type="checkbox"
                                                        checked={copySettings[option.key]}
                                                        onChange={() => handleCopySettingChange(option.key)}
                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Icon className={`w-4 h-4 ${option.color}`} />
                                                        <label className="text-sm font-medium text-gray-900 cursor-pointer">
                                                            {option.label}
                                                        </label>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Đã chọn {Object.values(copySettings).filter(Boolean).length} / {copyOptions.length} mục
                                </div>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={loading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
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
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>

                            <div className="space-y-3">
                                <Link href={`/academic-years/${id}`}>
                                    <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <Eye className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">Xem chi tiết</span>
                                    </button>
                                </Link>

                                <Link href={`/academic-years/${id}/edit`}>
                                    <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <Settings className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">Chỉnh sửa</span>
                                    </button>
                                </Link>

                                <Link href={`/academic-years/copy?source=${id}`}>
                                    <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <Upload className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">Sao chép dữ liệu</span>
                                    </button>
                                </Link>

                                <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                    <Download className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900">Xuất báo cáo</span>
                                </button>
                            </div>
                        </div>

                        {/* Year Information */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin năm học</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Mã năm học:</span>
                                    <span className="font-medium text-gray-900">{academicYear.code}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Thời gian:</span>
                                    <span className="font-medium text-gray-900">
                                        {academicYear.startYear} - {academicYear.endYear}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ngày bắt đầu:</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(academicYear.startDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ngày kết thúc:</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(academicYear.endDate).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Người tạo:</span>
                                    <span className="font-medium text-gray-900">
                                        {academicYear.createdBy?.fullName || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ngày tạo:</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(academicYear.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>

                            {academicYear.description && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Mô tả</h4>
                                    <p className="text-sm text-gray-600">{academicYear.description}</p>
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