'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    Calendar,
    ArrowLeftRight,
    Settings,
    Info,
    Copy,
    CheckCircle,
    Plus,
    X,
    AlertCircle
} from 'lucide-react'
import {
    useAcademicYearContext,
    formatAcademicYearName,
    getAcademicYearStatusColor,
    getAcademicYearStatusText,
    canSwitchAcademicYear,
    validateAcademicYearDates,
    generateAcademicYearCode,
    generateAcademicYearName,
    getNextAcademicYearSuggestion,
    academicYearAPI
} from '../utils/academicYear'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export const AcademicYearSelector = ({ showManagement = false, size = 'default' }) => {
    const { user } = useAuth()
    const {
        currentYear,
        selectedYear,
        availableYears,
        effectiveYear,
        switchYear,
        clearSelection
    } = useAcademicYearContext()

    const [managementVisible, setManagementVisible] = useState(false)

    const canSwitch = canSwitchAcademicYear(user)

    const handleYearChange = (e) => {
        const yearId = e.target.value
        if (!yearId || yearId === 'current') {
            clearSelection()
            return
        }

        const year = availableYears.find(y => y._id === yearId)
        if (year) {
            switchYear(year)
            toast.success(`Đã chuyển sang ${formatAcademicYearName(year)}`)
        }
    }

    const getSelectValue = () => {
        if (selectedYear) return selectedYear._id
        return 'current'
    }

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800'
            case 'draft':
                return 'bg-yellow-100 text-yellow-800'
            case 'archived':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-blue-100 text-blue-800'
        }
    }

    if (!effectiveYear) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                            Chưa có năm học nào được thiết lập
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>Vui lòng liên hệ quản trị viên để thiết lập năm học</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Năm học:</span>

                {canSwitch ? (
                    <div className="relative">
                        <select
                            value={getSelectValue()}
                            onChange={handleYearChange}
                            className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="current">
                                {formatAcademicYearName(currentYear)} (Hiện tại)
                            </option>
                            {availableYears
                                .filter(year => year._id !== currentYear?._id)
                                .map(year => (
                                    <option key={year._id} value={year._id}>
                                        {formatAcademicYearName(year)}
                                    </option>
                                ))}
                        </select>
                    </div>
                ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusBadgeClass(effectiveYear.status)
                    }`}>
                        {formatAcademicYearName(effectiveYear)}
                    </span>
                )}

                {selectedYear && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Đang xem năm khác
                    </span>
                )}
            </div>

            {showManagement && canSwitch && (
                <>
                    <button
                        onClick={() => setManagementVisible(true)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Settings size={14} className="mr-2" />
                        Quản lý
                    </button>

                    <AcademicYearManagement
                        visible={managementVisible}
                        onClose={() => setManagementVisible(false)}
                    />
                </>
            )}
        </div>
    )
}

/**
 * Academic Year Management Modal
 */
export const AcademicYearManagement = ({ visible, onClose }) => {
    const [academicYears, setAcademicYears] = useState([])
    const [loading, setLoading] = useState(false)
    const [createModalVisible, setCreateModalVisible] = useState(false)

    const loadAcademicYears = async () => {
        try {
            setLoading(true)
            const response = await academicYearAPI.getAll()
            setAcademicYears(response.data.academicYears)
        } catch (error) {
            toast.error('Lỗi khi tải danh sách năm học')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (visible) {
            loadAcademicYears()
        }
    }, [visible])

    const handleSetCurrent = async (yearId) => {
        try {
            await academicYearAPI.setCurrent(yearId)
            toast.success('Đã đặt làm năm học hiện tại')
            loadAcademicYears()
        } catch (error) {
            toast.error('Lỗi khi đặt năm học hiện tại')
        }
    }

    if (!visible) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">
                                Quản lý năm học
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white px-6 py-4">
                        <div className="mb-4">
                            <button
                                onClick={() => setCreateModalVisible(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus size={16} className="mr-2" />
                                Thêm năm học mới
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {academicYears.map(year => (
                                <div key={year._id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {formatAcademicYearName(year)}
                                            </h4>
                                            {year.isCurrent && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Hiện tại
                                                </span>
                                            )}
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                                            getStatusBadgeClass(year.status)
                                        }`}>
                                            {getAcademicYearStatusText(year.status)}
                                        </span>
                                    </div>

                                    <div className="px-4 py-3">
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Minh chứng</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {year.metadata?.totalEvidences || 0}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">File</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {year.metadata?.totalFiles || 0}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    title="Xem thống kê"
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <Info size={16} />
                                                </button>
                                                <button
                                                    title="Sao chép dữ liệu"
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                            {!year.isCurrent && (
                                                <button
                                                    onClick={() => handleSetCurrent(year._id)}
                                                    className="text-green-600 hover:text-green-800"
                                                    title="Đặt làm năm hiện tại"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <CreateAcademicYearModal
                            visible={createModalVisible}
                            onClose={() => setCreateModalVisible(false)}
                            onSuccess={() => {
                                loadAcademicYears()
                                setCreateModalVisible(false)
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-800'
        case 'draft':
            return 'bg-yellow-100 text-yellow-800'
        case 'archived':
            return 'bg-gray-100 text-gray-800'
        default:
            return 'bg-blue-100 text-blue-800'
    }
}

/**
 * Create Academic Year Modal
 */
export const CreateAcademicYearModal = ({ visible, onClose, onSuccess }) => {
    const { currentYear } = useAcademicYearContext()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        startYear: '',
        endYear: '',
        code: '',
        name: '',
        startDate: '',
        endDate: '',
        description: '',
        isCurrent: false
    })

    const nextYearSuggestion = getNextAcademicYearSuggestion(currentYear)

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))

        // Auto-generate code and name when years change
        if (name === 'startYear' || name === 'endYear') {
            const startYear = name === 'startYear' ? value : formData.startYear
            const endYear = name === 'endYear' ? value : formData.endYear

            if (startYear && endYear) {
                setFormData(prev => ({
                    ...prev,
                    code: generateAcademicYearCode(startYear, endYear),
                    name: generateAcademicYearName(startYear, endYear)
                }))
            }
        }
    }

    const fillSuggestion = () => {
        if (nextYearSuggestion) {
            setFormData(prev => ({
                ...prev,
                startYear: nextYearSuggestion.startYear,
                endYear: nextYearSuggestion.endYear,
                code: nextYearSuggestion.code,
                name: nextYearSuggestion.name
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            setLoading(true)

            const data = {
                ...formData,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate)
            }

            // Validate dates
            const errors = validateAcademicYearDates(
                data.startDate,
                data.endDate,
                parseInt(formData.startYear),
                parseInt(formData.endYear)
            )

            if (errors.length > 0) {
                toast.error(errors[0])
                return
            }

            await academicYearAPI.create(data)
            toast.success('Tạo năm học thành công')
            setFormData({
                startYear: '',
                endYear: '',
                code: '',
                name: '',
                startDate: '',
                endDate: '',
                description: '',
                isCurrent: false
            })
            onSuccess()
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Lỗi khi tạo năm học'
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    if (!visible) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Tạo năm học mới
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white px-6 py-4">
                            {nextYearSuggestion && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-blue-800">
                                                Gợi ý năm học tiếp theo: {nextYearSuggestion.name}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={fillSuggestion}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Sử dụng gợi ý
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Năm bắt đầu *
                                        </label>
                                        <input
                                            type="number"
                                            name="startYear"
                                            value={formData.startYear}
                                            onChange={handleInputChange}
                                            min="2020"
                                            max="2050"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="VD: 2024"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Năm kết thúc *
                                        </label>
                                        <input
                                            type="number"
                                            name="endYear"
                                            value={formData.endYear}
                                            onChange={handleInputChange}
                                            min="2021"
                                            max="2051"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="VD: 2025"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Mã năm học *
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        required
                                        pattern="^\d{4}-\d{4}$"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="VD: 2024-2025"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tên năm học *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="VD: Năm học 2024-2025"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Ngày bắt đầu *
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Ngày kết thúc *
                                        </label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Mô tả
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Mô tả năm học..."
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        id="isCurrent"
                                        name="isCurrent"
                                        type="checkbox"
                                        checked={formData.isCurrent}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="isCurrent" className="ml-2 block text-sm text-gray-900">
                                        Đặt làm năm học hiện tại
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Đang tạo...' : 'Tạo năm học'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AcademicYearSelector