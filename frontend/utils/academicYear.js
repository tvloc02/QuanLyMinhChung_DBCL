import React, { useState, useCallback, useMemo, useEffect, useContext } from 'react'
import  api  from '../services/api'
import { getLocalStorage, setLocalStorage, removeLocalStorage } from './helpers'

export const ACADEMIC_YEAR_STORAGE_KEY = 'current_academic_year'
export const SELECTED_YEAR_STORAGE_KEY = 'selected_academic_year'

export const getCurrentAcademicYear = async () => {
    try {
        const response = await api.get('/api/academic-years/current')
        return response.data
    } catch (error) {
        console.error('Error getting current academic year:', error)
        throw error
    }
}

export const getAllAcademicYears = async () => {
    try {
        const response = await api.get('/api/academic-years/all');
        return response.data
    } catch (error) {
        console.error('Error getting all academic years:', error)
        throw error
    }
}

export const setSelectedAcademicYear = (academicYear) => {
    setLocalStorage(SELECTED_YEAR_STORAGE_KEY, academicYear)
    api.defaults.headers.common['switchToYearId'] = academicYear?._id || academicYear?.id
}

export const getSelectedAcademicYear = () => {
    return getLocalStorage(SELECTED_YEAR_STORAGE_KEY)
}

export const clearSelectedAcademicYear = () => {
    removeLocalStorage(SELECTED_YEAR_STORAGE_KEY)
    delete api.defaults.headers.common['switchToYearId']
}

export const canSwitchAcademicYear = (user) => {
    return user && ['admin', 'manager'].includes(user.role)
}

export const getEffectiveAcademicYear = (currentYear) => {
    const selectedYear = getSelectedAcademicYear()
    return selectedYear || currentYear
}

export const formatAcademicYearName = (academicYear) => {
    if (!academicYear) return ''
    return `${academicYear.name} (${academicYear.code})`
}

export const isCurrentAcademicYear = (academicYear) => {
    return academicYear?.isCurrent === true
}

export const isActiveAcademicYear = (academicYear) => {
    if (!academicYear?.startDate || !academicYear?.endDate) return false

    const now = new Date()
    const startDate = new Date(academicYear.startDate)
    const endDate = new Date(academicYear.endDate)

    return now >= startDate && now <= endDate
}

export const getAcademicYearStatusText = (status) => {
    const statusMap = {
        draft: 'Nháp',
        active: 'Đang hoạt động',
        completed: 'Đã hoàn thành',
        archived: 'Lưu trữ'
    }
    return statusMap[status] || status
}

export const getAcademicYearStatusColor = (status) => {
    const colorMap = {
        draft: 'gray',
        active: 'green',
        completed: 'blue',
        archived: 'orange'
    }
    return colorMap[status] || 'gray'
}

export const validateAcademicYearDates = (startDate, endDate, startYear, endYear) => {
    const errors = []

    if (!startDate) {
        errors.push('Ngày bắt đầu là bắt buộc')
    }

    if (!endDate) {
        errors.push('Ngày kết thúc là bắt buộc')
    }

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
        errors.push('Ngày kết thúc phải sau ngày bắt đầu')
    }

    if (!startYear) {
        errors.push('Năm bắt đầu là bắt buộc')
    }

    if (!endYear) {
        errors.push('Năm kết thúc là bắt buộc')
    }

    if (startYear && endYear && endYear <= startYear) {
        errors.push('Năm kết thúc phải lớn hơn năm bắt đầu')
    }

    if (startYear && (startYear < 2020 || startYear > 2050)) {
        errors.push('Năm bắt đầu phải từ 2020-2050')
    }

    if (endYear && (endYear < 2021 || endYear > 2051)) {
        errors.push('Năm kết thúc phải từ 2021-2051')
    }

    return errors
}

export const generateAcademicYearCode = (startYear, endYear) => {
    if (!startYear || !endYear) return ''
    return `${startYear}-${endYear}`
}

export const generateAcademicYearName = (startYear, endYear) => {
    if (!startYear || !endYear) return ''
    return `Năm học ${startYear}-${endYear}`
}

export const parseAcademicYearCode = (code) => {
    if (!code) return { startYear: null, endYear: null }

    const match = code.match(/^(\d{4})-(\d{4})$/)
    if (!match) return { startYear: null, endYear: null }

    return {
        startYear: parseInt(match[1]),
        endYear: parseInt(match[2])
    }
}

export const getAvailableYears = () => {
    const years = []
    for (let year = 2020; year <= 2050; year++) {
        years.push(year)
    }
    return years
}

export const canDeleteAcademicYear = (academicYear) => {
    if (academicYear?.isCurrent) return false
    return true
}

export const getNextAcademicYearSuggestion = (currentYear) => {
    if (!currentYear) return null

    const { startYear, endYear } = parseAcademicYearCode(currentYear.code)
    if (!startYear || !endYear) return null

    const nextStartYear = endYear
    const nextEndYear = endYear + 1

    return {
        startYear: nextStartYear,
        endYear: nextEndYear,
        code: generateAcademicYearCode(nextStartYear, nextEndYear),
        name: generateAcademicYearName(nextStartYear, nextEndYear)
    }
}

export const academicYearAPI = {
    getAll: async (params = {}) => {
        const response = await api.get('/academic-years', { params })
        return response.data
    },

    getById: async (id) => {
        const response = await api.get(`/academic-years/${id}`)
        return response.data
    },

    create: async (data) => {
        const response = await api.post('/academic-years', data)
        return response.data
    },

    update: async (id, data) => {
        const response = await api.put(`/academic-years/${id}`, data)
        return response.data
    },

    delete: async (id) => {
        const response = await api.delete(`/academic-years/${id}`)
        return response.data
    },

    setCurrent: async (id) => {
        const response = await api.post(`/academic-years/${id}/set-current`)
        return response.data
    },

    copyData: async (id, sourceYearId, copySettings = {}) => {
        const response = await api.post(`/academic-years/${id}/copy-data`, {
            sourceYearId,
            copySettings
        })
        return response.data
    },

    getStatistics: async (id) => {
        const response = await api.get(`/academic-years/${id}/statistics`)
        return response.data
    },

    getAvailableForCopy: async (id) => {
        const response = await api.get(`/academic-years/${id}/available-for-copy`)
        return response.data
    }
}

export const useAcademicYear = () => {
    const [currentYear, setCurrentYear] = useState(null)
    const [selectedYear, setSelectedYear] = useState(null)
    const [availableYears, setAvailableYears] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadCurrentYear = useCallback(async () => {
        try {
            setLoading(true)
            const response = await getCurrentAcademicYear()
            setCurrentYear(response.data)

            const stored = getSelectedAcademicYear()
            setSelectedYear(stored)
        } catch (err) {
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [])

    const loadAvailableYears = useCallback(async () => {
        try {
            const response = await getAllAcademicYears()
            setAvailableYears(response.data)
        } catch (err) {
            console.error('Error loading available years:', err)
        }
    }, [])

    const switchYear = useCallback((year) => {
        setSelectedYear(year)
        setSelectedAcademicYear(year)
    }, [])

    const clearSelection = useCallback(() => {
        setSelectedYear(null)
        clearSelectedAcademicYear()
    }, [])

    const effectiveYear = useMemo(() => {
        return selectedYear || currentYear
    }, [selectedYear, currentYear])

    useEffect(() => {
        loadCurrentYear()
        loadAvailableYears()
    }, [loadCurrentYear, loadAvailableYears])

    return {
        currentYear,
        selectedYear,
        availableYears,
        effectiveYear,
        loading,
        error,
        switchYear,
        clearSelection,
        reload: loadCurrentYear
    }
}

export const AcademicYearContext = React.createContext(null)

export const AcademicYearProvider = ({ children }) => {
    const academicYearData = useAcademicYear()

    return (
        <AcademicYearContext.Provider value={academicYearData}>
            {children}
        </AcademicYearContext.Provider>
    )
}

export const useAcademicYearContext = () => {
    const context = useContext(AcademicYearContext)
    if (!context) {
        throw new Error('useAcademicYearContext must be used within AcademicYearProvider')
    }
    return context
}