import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { debounce } from '../../utils/debounce'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    ArrowLeft,
    Copy,
    Check,
    AlertCircle,
    Info,
    BookOpen,
    Building2,
    Target,
    CheckSquare,
    Folder,
    FileText,
    Calendar,
    ArrowRight,
    Loader2,
    Plus
} from 'lucide-react'

const CopyAcademicYearPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { source } = router.query

    const breadcrumbItems = [
        { name: 'Quản lý năm học', href: '/academic-years', icon: Calendar },
        { name: 'Sao chép dữ liệu' }
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
    const [copyResult, setCopyResult] = useState(null)

    const [academicYears, setAcademicYears] = useState([])
    const [targetYears, setTargetYears] = useState([])
    const [selectedSource, setSelectedSource] = useState(source || '')
    const [selectedTarget, setSelectedTarget] = useState('')

    const [copySettings, setCopySettings] = useState({
        programs: true,
        organizations: true,
        standards: true,
        criteria: true,
        evidenceTemplates: false
    })

    const copyOptions = [
        {
            key: 'programs',
            label: 'Chương trình đánh giá',
            description: 'Sao chép các chương trình đánh giá và cấu hình',
            icon: BookOpen,
            color: 'text-blue-600'
        },
        {
            key: 'organizations',
            label: 'Tổ chức đánh giá',
            description: 'Sao chép danh sách tổ chức và thông tin liên hệ',
            icon: Building2,
            color: 'text-green-600'
        },
        {
            key: 'standards',
            label: 'Tiêu chuẩn',
            description: 'Sao chép các tiêu chuẩn đánh giá và hướng dẫn',
            icon: Target,
            color: 'text-orange-600'
        },
        {
            key: 'criteria',
            label: 'Tiêu chí',
            description: 'Sao chép các tiêu chí đánh giá chi tiết',
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

    useEffect(() => {
        fetchAcademicYears()
    }, [])

    useEffect(() => {
        if (selectedSource) {
            fetchTargetYears()
        }
    }, [selectedSource])

    const fetchAcademicYears = async () => {
        try {
            const response = await fetch('/api/academic-years/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setAcademicYears(result.data)
                    if (source) {
                        setSelectedSource(source)
                    }
                }
            }
        } catch (err) {
            setError('Không thể tải danh sách năm học')
        } finally {
            setFetchingData(false)
        }
    }

    const fetchTargetYears = async () => {
        if (!selectedSource) return

        try {
            const response = await fetch(`/api/academic-years/${selectedSource}/available-for-copy`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setTargetYears(result.data)
                }
            }
        } catch (err) {
            console.error('Error fetching target years:', err)
        }
    }

    const handleCopySettingChange = (key) => {
        setCopySettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!selectedSource || !selectedTarget) {
            setError('Vui lòng chọn năm học nguồn và đích')
            return
        }

        if (selectedSource === selectedTarget) {
            setError('Năm học nguồn và đích không thể giống nhau')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/academic-years/${selectedTarget}/copy-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    sourceYearId: selectedSource,
                    copySettings
                })
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setSuccess(true)
                setCopyResult(result.data)
            } else {
                setError(result.message || 'Có lỗi xảy ra khi sao chép dữ liệu')
            }
        } catch (err) {
            setError('Không thể kết nối đến server')
        } finally {
            setLoading(false)
        }
    }

    const getSelectedYearInfo = (yearId, yearsList) => {
        return yearsList.find(year => year._id === yearId)
    }

    if (fetchingData) {
        return (
            <Layout
                title="Sao chép dữ liệu năm học"
                breadcrumbItems={breadcrumbItems}
            >
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
        <Layout
            title="Sao chép dữ liệu năm học"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sao chép dữ liệu năm học</h1>
                        <p className="text-gray-600">Sao chép cấu trúc và dữ liệu từ năm học khác</p>
                    </div>
                    <button
                        onClick={() => router.push('/academic-years')}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Quay lại</span>
                    </button>
                </div>

                {/* Success Message */}
                {success && copyResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                        <div className="flex items-start">
                            <Check className="w-6 h-6 text-green-600 mr-3 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-green-800 font-semibold mb-2">Sao chép dữ liệu thành công!</h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-white rounded-lg p-3 border border-green-200">
                                        <div className="text-sm text-gray-600">Chương trình</div>
                                        <div className="text-lg font-semibold text-green-800">
                                            {copyResult.results?.programs || 0}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-green-200">
                                        <div className="text-sm text-gray-600">Tổ chức</div>
                                        <div className="text-lg font-semibold text-green-800">
                                            {copyResult.results?.organizations || 0}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-green-200">
                                        <div className="text-sm text-gray-600">Tiêu chuẩn</div>
                                        <div className="text-lg font-semibold text-green-800">
                                            {copyResult.results?.standards || 0}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-green-200">
                                        <div className="text-sm text-gray-600">Tiêu chí</div>
                                        <div className="text-lg font-semibold text-green-800">
                                            {copyResult.results?.criteria || 0}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <p className="text-green-700 text-sm">
                                        Đã sao chép từ "{copyResult.sourceYear?.name}" sang "{copyResult.targetYear?.name}"
                                    </p>
                                    <button
                                        onClick={() => router.push('/academic-years')}
                                        className="text-green-700 hover:text-green-800 text-sm font-medium"
                                    >
                                        Quay về danh sách →
                                    </button>
                                </div>

                                {copyResult.results?.errors?.length > 0 && (
                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                        <h4 className="text-yellow-800 font-medium mb-1">Có một số lỗi:</h4>
                                        <ul className="text-yellow-700 text-sm list-disc list-inside">
                                            {copyResult.results.errors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                            <div>
                                <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Year Selection */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chọn năm học</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Source Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Năm học nguồn <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedSource}
                                    onChange={(e) => setSelectedSource(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Chọn năm học nguồn</option>
                                    {academicYears.map(year => (
                                        <option key={year._id} value={year._id}>
                                            {year.name} ({year.code}) - {year.status === 'active' ? 'Hoạt động' :
                                            year.status === 'completed' ? 'Hoàn thành' :
                                                year.status === 'draft' ? 'Nháp' : 'Lưu trữ'}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-gray-500 text-sm mt-1">
                                    Năm học có dữ liệu để sao chép
                                </p>
                            </div>

                            {/* Target Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Năm học đích <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedTarget}
                                    onChange={(e) => setSelectedTarget(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={!selectedSource}
                                >
                                    <option value="">
                                        {selectedSource ? 'Chọn năm học đích' : 'Vui lòng chọn năm học nguồn trước'}
                                    </option>
                                    {targetYears.map(year => (
                                        <option key={year._id} value={year._id}>
                                            {year.name} ({year.code})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-gray-500 text-sm mt-1">
                                    Năm học sẽ nhận dữ liệu được sao chép
                                </p>
                            </div>
                        </div>

                        {/* Preview */}
                        {selectedSource && selectedTarget && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-center space-x-4">
                                    <div className="text-center">
                                        <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                        <div className="text-sm font-medium text-blue-900">
                                            {getSelectedYearInfo(selectedSource, academicYears)?.name}
                                        </div>
                                        <div className="text-xs text-blue-700">Nguồn</div>
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-blue-600" />
                                    <div className="text-center">
                                        <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                        <div className="text-sm font-medium text-blue-900">
                                            {getSelectedYearInfo(selectedTarget, targetYears)?.name}
                                        </div>
                                        <div className="text-xs text-blue-700">Đích</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Copy Settings */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt sao chép</h2>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <Info className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="text-yellow-800 font-medium mb-1">Lưu ý quan trọng</h3>
                                    <ul className="text-yellow-700 text-sm space-y-1">
                                        <li>• Dữ liệu được sao chép sẽ có trạng thái "Nháp"</li>
                                        <li>• Mẫu minh chứng được sao chép không bao gồm files đính kèm</li>
                                        <li>• Quá trình sao chép có thể mất vài phút tùy thuộc vào lượng dữ liệu</li>
                                        <li>• Nên sao lưu dữ liệu trước khi thực hiện</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {copyOptions.map(option => {
                                const Icon = option.icon
                                return (
                                    <div key={option.key} className="border border-gray-200 rounded-lg p-4">
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
                                                    <label className="text-sm font-medium text-gray-900">
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

                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Đã chọn {Object.values(copySettings).filter(Boolean).length} / {copyOptions.length} mục
                            </div>
                            <div className="space-x-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allSelected = Object.values(copySettings).every(Boolean)
                                        const newSettings = {}
                                        copyOptions.forEach(option => {
                                            newSettings[option.key] = !allSelected
                                        })
                                        setCopySettings(newSettings)
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    {Object.values(copySettings).every(Boolean) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/academic-years')}
                            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedSource || !selectedTarget || success}
                            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Đang sao chép...</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Bắt đầu sao chép</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}

export default CopyAcademicYearPage