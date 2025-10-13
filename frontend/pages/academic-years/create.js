import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    ArrowLeft,
    Calendar,
    Save,
    AlertCircle,
    CheckCircle,
    Info,
    Sparkles,
    Copy,
    FileText,
    BookOpen,
    Building2,
    Target,
    CheckSquare,
    Folder,
    Loader2
} from 'lucide-react'

const CreateAcademicYearPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [creationMode, setCreationMode] = useState('new')
    const [availableYears, setAvailableYears] = useState([])
    const [loadingYears, setLoadingYears] = useState(false)

    const breadcrumbItems = [
        { name: 'Quản lý năm học', href: '/academic-years', icon: Calendar },
        { name: 'Tạo mới' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (creationMode === 'copy') {
            fetchAvailableYears()
        }
    }, [creationMode])

    const [formData, setFormData] = useState({
        name: '',
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 1,
        startDate: '',
        endDate: '',
        description: '',
        status: 'active',
        isCurrent: false,
        sourceYearId: '',
        copySettings: {
            programs: true,
            organizations: true,
            standards: true,
            criteria: true,
            evidenceTemplates: false
        }
    })

    const [errors, setErrors] = useState({})

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

    const fetchAvailableYears = async () => {
        try {
            setLoadingYears(true)
            const response = await fetch('/api/academic-years/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setAvailableYears(result.data)
                }
            }
        } catch (err) {
            console.error('Error fetching years:', err)
        } finally {
            setLoadingYears(false)
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.startYear) {
            newErrors.startYear = 'Năm bắt đầu là bắt buộc'
        } else if (formData.startYear < 2020 || formData.startYear > 2050) {
            newErrors.startYear = 'Năm bắt đầu phải từ 2020-2050'
        }

        if (!formData.endYear) {
            newErrors.endYear = 'Năm kết thúc là bắt buộc'
        } else if (formData.endYear <= formData.startYear) {
            newErrors.endYear = 'Năm kết thúc phải lớn hơn năm bắt đầu'
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc'
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc'
        } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
        }

        if (creationMode === 'copy' && !formData.sourceYearId) {
            newErrors.sourceYearId = 'Vui lòng chọn năm học nguồn'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        if (name.includes('.')) {
            const [parent, child] = name.split('.')
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || '' : value
            }))
        }

        if (name === 'startYear' || name === 'endYear') {
            const startYear = name === 'startYear' ? (parseInt(value) || '') : formData.startYear
            const endYear = name === 'endYear' ? (parseInt(value) || '') : formData.endYear

            if (startYear && endYear && endYear > startYear) {
                setFormData(prev => ({
                    ...prev,
                    [name]: parseInt(value) || '',
                    name: `Năm học ${startYear}-${endYear}`
                }))
            }
        }

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }
    }

    const handleCopySettingChange = (key) => {
        setFormData(prev => ({
            ...prev,
            copySettings: {
                ...prev.copySettings,
                [key]: !prev.copySettings[key]
            }
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/academic-years', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (response.ok && result.success) {
                const newYearId = result.data._id

                if (creationMode === 'copy' && formData.sourceYearId) {
                    const copyResponse = await fetch(`/api/academic-years/${newYearId}/copy-data`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            sourceYearId: formData.sourceYearId,
                            copySettings: formData.copySettings
                        })
                    })

                    const copyResult = await copyResponse.json()

                    if (!copyResponse.ok || !copyResult.success) {
                        setError('Tạo năm học thành công nhưng có lỗi khi sao chép dữ liệu: ' + (copyResult.message || 'Lỗi không xác định'))
                        setLoading(false)
                        return
                    }
                }

                setSuccess(true)
                setTimeout(() => {
                    router.push('/academic-years/academic-years')
                }, 2000)
            } else {
                setError(result.message || 'Có lỗi xảy ra khi tạo năm học')
            }
        } catch (err) {
            setError('Không thể kết nối đến server')
        } finally {
            setLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Tạo năm học mới</h1>
                                <p className="text-indigo-100">Thiết lập thông tin cho năm học mới</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/academic-years/academic-years')}
                            className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Quay lại</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-green-800 font-semibold">Tạo năm học thành công!</h3>
                                    <p className="text-green-700 text-sm mt-1">Đang chuyển hướng về danh sách năm học...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <AlertCircle className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-red-800 font-semibold">Có lỗi xảy ra</h3>
                                    <p className="text-red-700 text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Chọn phương thức tạo</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setCreationMode('new')}
                                className={`p-6 border-2 rounded-xl transition-all text-left ${
                                    creationMode === 'new'
                                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className={`p-3 rounded-xl ${
                                        creationMode === 'new' ? 'bg-indigo-100' : 'bg-gray-100'
                                    }`}>
                                        <FileText className={`w-6 h-6 ${
                                            creationMode === 'new' ? 'text-indigo-600' : 'text-gray-600'
                                        }`} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">Tạo mới hoàn toàn</h3>
                                        <p className="text-sm text-gray-600">Tạo năm học mới không có dữ liệu từ năm trước</p>
                                    </div>
                                    {creationMode === 'new' && (
                                        <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                                    )}
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCreationMode('copy')}
                                className={`p-6 border-2 rounded-xl transition-all text-left ${
                                    creationMode === 'copy'
                                        ? 'border-purple-500 bg-purple-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className={`p-3 rounded-xl ${
                                        creationMode === 'copy' ? 'bg-purple-100' : 'bg-gray-100'
                                    }`}>
                                        <Copy className={`w-6 h-6 ${
                                            creationMode === 'copy' ? 'text-purple-600' : 'text-gray-600'
                                        }`} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">Sao chép từ năm trước</h3>
                                        <p className="text-sm text-gray-600">Tạo năm học mới và sao chép dữ liệu từ năm học khác</p>
                                    </div>
                                    {creationMode === 'copy' && (
                                        <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0" />
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>

                    {creationMode === 'copy' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Chọn năm học nguồn</h2>

                            {loadingYears ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                                    <span className="ml-2 text-gray-600">Đang tải danh sách năm học...</span>
                                </div>
                            ) : (
                                <div>
                                    <select
                                        name="sourceYearId"
                                        value={formData.sourceYearId}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                            errors.sourceYearId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    >
                                        <option value="">Chọn năm học nguồn</option>
                                        {availableYears.map(year => (
                                            <option key={year._id} value={year._id}>
                                                {year.name} ({year.code})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.sourceYearId && (
                                        <p className="text-red-600 text-sm mt-1 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-1" />
                                            {errors.sourceYearId}
                                        </p>
                                    )}
                                    <p className="text-gray-500 text-sm mt-2">
                                        Chọn năm học có dữ liệu để sao chép sang năm học mới
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Thông tin cơ bản</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Năm bắt đầu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="startYear"
                                    value={formData.startYear}
                                    onChange={handleChange}
                                    min="2020"
                                    max="2050"
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                        errors.startYear ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="2024"
                                />
                                {errors.startYear && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.startYear}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Năm kết thúc <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="endYear"
                                    value={formData.endYear}
                                    onChange={handleChange}
                                    min="2021"
                                    max="2051"
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                        errors.endYear ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="2025"
                                />
                                {errors.endYear && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.endYear}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên năm học
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    maxLength="100"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Tên sẽ được tạo tự động từ năm bắt đầu và kết thúc"
                                />
                                <p className="text-gray-500 text-sm mt-2 flex items-center">
                                    <Info className="w-4 h-4 mr-1" />
                                    Để trống để tự động tạo tên từ năm bắt đầu và kết thúc
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Thời gian</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày bắt đầu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                        errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                />
                                {errors.startDate && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.startDate}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày kết thúc <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                        errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                />
                                {errors.endDate && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.endDate}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Trạng thái</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái năm học <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            >
                                <option value="draft">Nháp</option>
                                <option value="active">Hoạt động</option>
                                <option value="completed">Hoàn thành</option>
                                <option value="archived">Lưu trữ</option>
                            </select>
                            <p className="text-gray-500 text-sm mt-2 flex items-center">
                                <Info className="w-4 h-4 mr-1" />
                                Trạng thái mặc định là "Hoạt động"
                            </p>
                        </div>
                    </div>

                    {creationMode === 'copy' && (
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
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {copyOptions.map(option => {
                                    const Icon = option.icon
                                    return (
                                        <div key={option.key} className={`border rounded-xl p-4 transition-all cursor-pointer ${
                                            formData.copySettings[option.key]
                                                ? `${option.bgColor} ${option.borderColor} shadow-sm`
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}>
                                            <label className="flex items-start cursor-pointer">
                                                <div className="flex items-center h-5 mt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.copySettings[option.key]}
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
                                    Đã chọn <span className="font-semibold text-indigo-600">{Object.values(formData.copySettings).filter(Boolean).length}</span> / {copyOptions.length} mục
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allSelected = Object.values(formData.copySettings).every(Boolean)
                                        const newSettings = {}
                                        copyOptions.forEach(option => {
                                            newSettings[option.key] = !allSelected
                                        })
                                        setFormData(prev => ({
                                            ...prev,
                                            copySettings: newSettings
                                        }))
                                    }}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    {Object.values(formData.copySettings).every(Boolean) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Cài đặt</h2>

                        <div className="space-y-6">
                            <div className="flex items-start p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="isCurrent"
                                        checked={formData.isCurrent}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="ml-3">
                                    <label className="text-sm font-medium text-gray-900">
                                        Đặt làm năm học hiện tại
                                    </label>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Năm học này sẽ được đặt làm năm học mặc định trong hệ thống
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/academic-years/academic-years')}
                            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Đang {creationMode === 'copy' ? 'tạo và sao chép' : 'tạo'}...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>{creationMode === 'copy' ? 'Tạo và sao chép' : 'Tạo năm học'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}

export default CreateAcademicYearPage