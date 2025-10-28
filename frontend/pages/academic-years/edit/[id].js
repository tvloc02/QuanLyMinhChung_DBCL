import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import {
    ArrowLeft,
    Save,
    AlertCircle,
    CheckCircle,
    Info,
    Loader2,
    Calendar,
    Eye,
    Settings // Đã thêm Settings
} from 'lucide-react'

const EditAcademicYearPage = () => {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { id } = router.query

    const breadcrumbItems = [
        { name: 'Quản lý năm học', href: '/academic-years', icon: Calendar },
        { name: 'Chỉnh sửa' }
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

    const [originalData, setOriginalData] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        startYear: '',
        endYear: '',
        startDate: '',
        endDate: '',
        description: '',
        status: 'draft',
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
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (id) {
            fetchAcademicYear()
        }
    }, [id])

    useEffect(() => {
        if (originalData) {
            checkForChanges()
        }
    }, [formData, originalData])

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
                    const academicYear = result.data
                    const data = {
                        name: academicYear.name,
                        startYear: academicYear.startYear,
                        endYear: academicYear.endYear,
                        // Input type="date" yêu cầu YYYY-MM-DD
                        startDate: new Date(academicYear.startDate).toISOString().split('T')[0],
                        endDate: new Date(academicYear.endDate).toISOString().split('T')[0],
                        description: academicYear.description || '',
                        status: academicYear.status,
                        isCurrent: academicYear.isCurrent,
                        copySettings: academicYear.copySettings || formData.copySettings
                    }
                    setFormData(data)
                    setOriginalData(data)
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

    const checkForChanges = () => {
        if (!originalData) return
        const changed = JSON.stringify(formData) !== JSON.stringify(originalData)
        setHasChanges(changed)
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.name?.trim()) {
            newErrors.name = 'Tên năm học là bắt buộc'
        } else if (formData.name.length > 100) {
            newErrors.name = 'Tên năm học không được quá 100 ký tự'
        }

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
            const response = await fetch(`/api/academic-years/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (response.ok && result.success) {
                setSuccess(true)
                setOriginalData({ ...formData })
                setHasChanges(false)
                setTimeout(() => {
                    router.push(`/academic-years/${id}`)
                }, 2000)
            } else {
                setError(result.message || 'Có lỗi xảy ra khi cập nhật năm học')
            }
        } catch (err) {
            setError('Không thể kết nối đến server')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        if (hasChanges) {
            const confirmLeave = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời khỏi trang này?')
            if (!confirmLeave) return
        }
        router.push(`/academic-years/${id}`)
    }

    if (fetchingData) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải thông tin năm học...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user || !originalData) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-red-200 mx-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy năm học</h2>
                    <p className="text-gray-600 mb-4">Năm học không tồn tại hoặc đã bị xóa</p>
                    <button
                        onClick={() => router.push('/academic-years')}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                        Quay về danh sách
                    </button>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header - Màu xanh lam đồng bộ */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-1">Chỉnh sửa năm học</h1>
                            <p className="text-blue-100">{originalData.name} ({formData.startYear}-{formData.endYear})</p>
                        </div>
                        {/* Nút thao tác trên Header - Giữ nguyên kiểu dáng */}
                        <div className="flex items-center space-x-2">
                            {hasChanges && (
                                <div className="px-3 py-2 bg-orange-500 bg-opacity-20 backdrop-blur-sm rounded-xl text-sm font-medium">
                                    Có thay đổi chưa lưu
                                </div>
                            )}
                            <button
                                onClick={() => router.push(`/academic-years/${id}`)}
                                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all text-white font-medium"
                            >
                                <Eye className="w-4 h-4" />
                                <span>Xem</span>
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all text-white font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Quay lại</span>
                            </button>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                                <div>
                                    <h3 className="text-green-800 font-medium">Cập nhật năm học thành công!</h3>
                                    <p className="text-green-700 text-sm">Đang chuyển hướng về trang chi tiết...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                                <div>
                                    <h3 className="text-red-800 font-medium">Có lỗi xảy ra</h3>
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Basic Information - Màu xanh nhạt cho container */}
                    <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Info className='w-5 h-5 mr-2 text-blue-600'/>
                            Thông tin cơ bản
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên năm học <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    maxLength="100"
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                        errors.name ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                    }`}
                                    placeholder="Nhập tên năm học"
                                />
                                {errors.name && (
                                    <p className="text-red-600 text-sm mt-1 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

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
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                        errors.startYear ? 'border-red-300 bg-red-50' : 'border-blue-200'
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

                            {/* End Year */}
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
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                        errors.endYear ? 'border-red-300 bg-red-50' : 'border-blue-200'
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
                        </div>
                    </div>

                    {/* Duration - Màu xanh nhạt cho container */}
                    <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Calendar className='w-5 h-5 mr-2 text-blue-600'/>
                            Thời gian
                        </h2>

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
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                        errors.startDate ? 'border-red-300 bg-red-50' : 'border-blue-200'
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
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                        errors.endDate ? 'border-red-300 bg-red-50' : 'border-blue-200'
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

                    {/* Description - Màu xanh nhạt cho container */}
                    <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Info className='w-5 h-5 mr-2 text-blue-600'/>
                            Mô tả
                        </h2>

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
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                    errors.description ? 'border-red-300 bg-red-50' : 'border-blue-200'
                                }`}
                                placeholder="Mô tả chi tiết về năm học này..."
                            />
                            <div className="flex justify-between items-center mt-2">
                                {errors.description ? (
                                    <p className="text-red-600 text-sm flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {errors.description}
                                    </p>
                                ) : (
                                    <div></div>
                                )}
                                <p className="text-gray-500 text-sm">
                                    {formData.description.length}/500
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status & Settings - Màu xanh nhạt cho container */}
                    <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Settings className='w-5 h-5 mr-2 text-blue-600'/>
                            Trạng thái & Cài đặt
                        </h2>

                        <div className="space-y-6">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    <option value="draft">Nháp</option>
                                    <option value="active">Hoạt động</option>
                                    <option value="completed">Hoàn thành</option>
                                    <option value="archived">Lưu trữ</option>
                                </select>
                            </div>

                            {/* Set as Current */}
                            <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="isCurrent"
                                        checked={formData.isCurrent}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500"
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

                            {/* Copy Settings */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Cài đặt sao chép mặc định</h3>
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                    <div className="flex items-start">
                                        <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                        <p className="text-blue-800 text-sm">
                                            Các cài đặt này sẽ được sử dụng mặc định khi sao chép dữ liệu từ năm học này
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {['programs', 'organizations', 'standards', 'criteria', 'evidenceTemplates'].map(key => (
                                        <label key={key} className="flex items-center p-3 border border-blue-200 bg-white rounded-xl hover:bg-blue-50 cursor-pointer transition-all">
                                            <input
                                                type="checkbox"
                                                name={`copySettings.${key}`}
                                                checked={formData.copySettings[key]}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-blue-600 bg-white border-blue-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-sm text-gray-900">
                                                {key === 'programs' ? 'Chương trình đánh giá' :
                                                    key === 'organizations' ? 'Tổ chức đánh giá' :
                                                        key === 'standards' ? 'Tiêu chuẩn' :
                                                            key === 'criteria' ? 'Tiêu chí' :
                                                                'Mẫu minh chứng'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-medium"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !hasChanges}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Đang lưu...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Lưu thay đổi</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}

export default EditAcademicYearPage