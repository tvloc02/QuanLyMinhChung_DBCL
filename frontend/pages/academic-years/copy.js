import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
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
    Calendar,
    ArrowRight,
    Loader2,
    Zap
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
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            key: 'organizations',
            label: 'Tổ chức đánh giá',
            description: 'Sao chép danh sách tổ chức và thông tin liên hệ',
            icon: Building2,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            key: 'standards',
            label: 'Tiêu chuẩn',
            description: 'Sao chép các tiêu chuẩn đánh giá và hướng dẫn',
            icon: Target,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        },
        {
            key: 'criteria',
            label: 'Tiêu chí',
            description: 'Sao chép các tiêu chí đánh giá chi tiết',
            icon: CheckSquare,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        {
            key: 'evidenceTemplates',
            label: 'Mẫu minh chứng',
            description: 'Sao chép cấu trúc minh chứng (không bao gồm files)',
            icon: Folder,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200'
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
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
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
                {/* Header với gradient */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Copy className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Sao chép dữ liệu năm học</h1>
                                <p className="text-indigo-100">Sao chép cấu trúc và dữ liệu từ năm học khác</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/academic-years')}
                            className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Quay lại</span>
                        </button>
                    </div>
                </div>

                {/* Success Message */}
                {success && copyResult && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check className="w-7 h-7 text-green-600" />
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="text-green-900 font-bold text-lg mb-3">Sao chép dữ liệu thành công!</h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                                        <div className="text-xs text-gray-600 mb-1">Chương trình</div>
                                        <div className="text-2xl font-bold text-green-700">
                                            {copyResult.results?.programs || 0}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                                        <div className="text-xs text-gray-600 mb-1">Tổ chức</div>
                                        <div className="text-2xl font-bold text-green-700">
                                            {copyResult.results?.organizations || 0}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                                        <div className="text-xs text-gray-600 mb-1">Tiêu chuẩn</div>
                                        <div className="text-2xl font-bold text-green-700">
                                            {copyResult.results?.standards || 0}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                                        <div className="text-xs text-gray-600 mb-1">Tiêu chí</div>
                                        <div className="text-2xl font-bold text-green-700">
                                            {copyResult.results?.criteria || 0}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-green-800 text-sm">
                                        Đã sao chép từ <span className="font-semibold">"{copyResult.sourceYear?.name}"</span> sang <span className="font-semibold">"{copyResult.targetYear?.name}"</span>
                                    </p>
                                    <button
                                        onClick={() => router.push('/academic-years')}
                                        className="text-green-700 hover:text-green-800 text-sm font-semibold flex items-center space-x-1"
                                    >
                                        <span>Quay về danh sách</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                {copyResult.results?.errors?.length > 0 && (
                                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                        <h4 className="text-yellow-800 font-semibold mb-2 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            Có một số lỗi:
                                        </h4>
                                        <ul className="text-yellow-700 text-sm space-y-1">
                                            {copyResult.results.errors.map((error, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="mr-2">•</span>
                                                    <span>{error}</span>
                                                </li>
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
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                            <div>
                                <h3 className="text-red-800 font-semibold">Có lỗi xảy ra</h3>
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Year Selection */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Chọn năm học</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Source Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Năm học nguồn <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedSource}
                                    onChange={(e) => setSelectedSource(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    required
                                >
                                    <option value="">Chọn năm học nguồn</option>
                                    {academicYears.map(year => (
                                        <option key={year._id} value={year._id}>
                                            {year.name} ({year.code})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-gray-500 text-sm mt-2">
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
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                                <p className="text-gray-500 text-sm mt-2">
                                    Năm học sẽ nhận dữ liệu được sao chép
                                </p>
                            </div>
                        </div>

                        {/* Preview */}
                        {selectedSource && selectedTarget && (
                            <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                                <div className="flex items-center justify-center space-x-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                                            <Calendar className="w-8 h-8 text-indigo-600" />
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {getSelectedYearInfo(selectedSource, academicYears)?.name}
                                        </div>
                                        <div className="text-xs text-indigo-600 font-medium mt-1">Nguồn</div>
                                    </div>
                                    <div className="flex items-center">
                                        <ArrowRight className="w-8 h-8 text-indigo-600" />
                                    </div>
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                                            <Calendar className="w-8 h-8 text-purple-600" />
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {getSelectedYearInfo(selectedTarget, targetYears)?.name}
                                        </div>
                                        <div className="text-xs text-purple-600 font-medium mt-1">Đích</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Copy Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Cài đặt sao chép</h2>

                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
                            <div className="flex items-start">
                                <Info className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="text-yellow-900 font-semibold mb-2">Lưu ý quan trọng</h3>
                                    <ul className="text-yellow-800 text-sm space-y-1">
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
                                    <div key={option.key} className={`border rounded-xl p-4 transition-all cursor-pointer ${
                                        copySettings[option.key]
                                            ? `${option.bgColor} ${option.borderColor} shadow-sm`
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                        <label className="flex items-start cursor-pointer">
                                            <div className="flex items-center h-5 mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={copySettings[option.key]}
                                                    onChange={() => handleCopySettingChange(option.key)}
                                                    className="w-5 h-5 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500"
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

                        <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="text-sm text-gray-700">
                                Đã chọn <span className="font-semibold text-indigo-600">{Object.values(copySettings).filter(Boolean).length}</span> / {copyOptions.length} mục
                            </div>
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
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                {Object.values(copySettings).every(Boolean) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/academic-years')}
                            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedSource || !selectedTarget || success}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Đang sao chép...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
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