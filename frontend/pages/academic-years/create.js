import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { debounce } from '../../utils/debounce'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    ArrowLeft,
    Calendar,
    Save,
    AlertCircle,
    CheckCircle,
    Info
} from 'lucide-react'

const CreateAcademicYearPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const breadcrumbItems = [
        { name: 'Quản lý năm học', href: '/academic-years', icon: Calendar },
        { name: 'Tạo mới' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    const [formData, setFormData] = useState({
        name: '',
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 1,
        startDate: '',
        endDate: '',
        description: '',
        isCurrent: false,
        copySettings: {
            programs: true,
            organizations: true,
            standards: true,
            criteria: true,
            evidenceTemplates: false
        }
    })

    const [errors, setErrors] = useState({})

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

        if (formData.description && formData.description.length > 500) {
            newErrors.description = 'Mô tả không được quá 500 ký tự'
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
                setSuccess(true)
                setTimeout(() => {
                    router.push('/academic-years')
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tạo năm học mới</h1>
                        <p className="text-gray-600">Thiết lập thông tin cho năm học mới</p>
                    </div>
                    <button
                        onClick={() => router.push('/academic-years')}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Quay lại</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                                <div>
                                    <h3 className="text-green-800 font-medium">Tạo năm học thành công!</h3>
                                    <p className="text-green-700 text-sm">Đang chuyển hướng về danh sách năm học...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                                <div>
                                    <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Start Year */}
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
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.startYear ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="2024"
                                />
                                {errors.startYear && (
                                    <p className="text-red-600 text-sm mt-1">{errors.startYear}</p>
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
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.endYear ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="2025"
                                />
                                {errors.endYear && (
                                    <p className="text-red-600 text-sm mt-1">{errors.endYear}</p>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tên sẽ được tạo tự động từ năm bắt đầu và kết thúc"
                                />
                                <p className="text-gray-500 text-sm mt-1">
                                    Để trống để tự động tạo tên từ năm bắt đầu và kết thúc
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thời gian</h2>

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
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.startDate ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                />
                                {errors.startDate && (
                                    <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
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
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.endDate ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                />
                                {errors.endDate && (
                                    <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mô tả</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả năm học
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                maxLength="500"
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.description ? 'border-red-300' : 'border-gray-300'
                                }`}
                                placeholder="Mô tả chi tiết về năm học này..."
                            />
                            <div className="flex justify-between items-center mt-1">
                                {errors.description ? (
                                    <p className="text-red-600 text-sm">{errors.description}</p>
                                ) : (
                                    <div></div>
                                )}
                                <p className="text-gray-500 text-sm">
                                    {formData.description.length}/500
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt</h2>

                        <div className="space-y-4">
                            {/* Set as Current */}
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="isCurrent"
                                        checked={formData.isCurrent}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                </div>
                                <div className="ml-3">
                                    <label className="text-sm font-medium text-gray-900">
                                        Đặt làm năm học hiện tại
                                    </label>
                                    <p className="text-sm text-gray-500">
                                        Năm học này sẽ được đặt làm năm học mặc định trong hệ thống
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Cài đặt sao chép mặc định</h3>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start">
                                        <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-blue-800 text-sm">
                                                Các cài đặt này sẽ được sử dụng mặc định khi sao chép dữ liệu từ năm học khác
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="copySettings.programs"
                                                checked={formData.copySettings.programs}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label className="ml-2 text-sm text-gray-900">Chương trình đánh giá</label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="copySettings.organizations"
                                                checked={formData.copySettings.organizations}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label className="ml-2 text-sm text-gray-900">Tổ chức đánh giá</label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="copySettings.standards"
                                                checked={formData.copySettings.standards}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label className="ml-2 text-sm text-gray-900">Tiêu chuẩn</label>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="copySettings.criteria"
                                                checked={formData.copySettings.criteria}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label className="ml-2 text-sm text-gray-900">Tiêu chí</label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="copySettings.evidenceTemplates"
                                                checked={formData.copySettings.evidenceTemplates}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label className="ml-2 text-sm text-gray-900">Mẫu minh chứng</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                            disabled={loading}
                            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Đang tạo...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Tạo năm học</span>
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