import React, { useState, useEffect } from 'react'
import {
    Calendar,
    ChevronDown,
    CheckCircle,
    AlertCircle,
    Settings
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
    useAcademicYearContext,
    formatAcademicYearName,
    canSwitchAcademicYear
} from '../utils/academicYear'
import toast from 'react-hot-toast'

const AcademicYearSelector = ({ showManagement = false, size = 'default' }) => {
    const { user } = useAuth()
    const {
        currentYear,
        selectedYear,
        availableYears,
        effectiveYear,
        switchYear,
        clearSelection,
        loading
    } = useAcademicYearContext()

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const canSwitch = canSwitchAcademicYear(user)

    const handleYearSelect = (year) => {
        if (year._id === currentYear?._id) {
            clearSelection()
            toast.success(`Đã chuyển về năm học hiện tại`)
        } else {
            switchYear(year)
            toast.success(`Đã chuyển sang ${formatAcademicYearName(year)}`)
        }
        setDropdownOpen(false)
    }

    const getStatusBadgeClass = (status, isCurrent) => {
        if (isCurrent) return 'bg-green-100 text-green-800'

        switch (status) {
            case 'active':
                return 'bg-blue-100 text-blue-800'
            case 'draft':
                return 'bg-yellow-100 text-yellow-800'
            case 'completed':
                return 'bg-gray-100 text-gray-800'
            case 'archived':
                return 'bg-orange-100 text-orange-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center space-x-2 px-3 py-2">
                <Calendar className="h-4 w-4 text-gray-400 animate-pulse" />
                <span className="text-sm text-gray-400">Đang tải...</span>
            </div>
        )
    }

    if (!effectiveYear) {
        return (
            <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">Chưa có năm học</span>
            </div>
        )
    }

    return (
        <div className="relative">
            {canSwitch ? (
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className={`
                            flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                            bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            ${size === 'small' ? 'text-xs' : 'text-sm'}
                        `}
                    >
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                            {formatAcademicYearName(effectiveYear)}
                        </span>
                        {selectedYear && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Đang xem
                            </span>
                        )}
                        <ChevronDown className={`h-4 w-4 text-gray-500 transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setDropdownOpen(false)}
                            />
                            <div className="absolute right-0 z-20 mt-2 w-72 bg-white rounded-md shadow-lg border border-gray-200">
                                <div className="py-2">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <h3 className="text-sm font-medium text-gray-900">Chọn năm học</h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Chuyển đổi giữa các năm học trong hệ thống
                                        </p>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto">
                                        {availableYears.map((year) => (
                                            <button
                                                key={year._id}
                                                onClick={() => handleYearSelect(year)}
                                                className={`
                                                    w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between
                                                    ${effectiveYear._id === year._id ? 'bg-blue-50' : ''}
                                                `}
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {formatAcademicYearName(year)}
                                                        </span>
                                                        {year.isCurrent && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Hiện tại
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(year.startDate).toLocaleDateString('vi-VN')} - {new Date(year.endDate).toLocaleDateString('vi-VN')}
                                                        </span>
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(year.status, year.isCurrent)}`}>
                                                            {year.status === 'active' ? 'Hoạt động' :
                                                                year.status === 'draft' ? 'Nháp' :
                                                                    year.status === 'completed' ? 'Hoàn thành' : 'Lưu trữ'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {effectiveYear._id === year._id && (
                                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {showManagement && user && ['admin', 'manager'].includes(user.role) && (
                                        <>
                                            <div className="border-t border-gray-100 mx-4 my-2" />
                                            <button
                                                onClick={() => {
                                                    setDropdownOpen(false)
                                                    // Navigate to academic year management page
                                                    window.location.href = '/configuration/academic-years'
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-sm text-gray-700"
                                            >
                                                <Settings className="h-4 w-4" />
                                                <span>Quản lý năm học</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                // Read-only display for users without permission
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className={`font-medium text-gray-900 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
                        {formatAcademicYearName(effectiveYear)}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Hiện tại
                    </span>
                </div>
            )}
        </div>
    )
}

export default AcademicYearSelector