// Academic Year Utilities for Frontend

import { api } from './api'
import { getLocalStorage, setLocalStorage, removeLocalStorage } from './helpers'

// Constants
export const ACADEMIC_YEAR_STORAGE_KEY = 'current_academic_year'
export const SELECTED_YEAR_STORAGE_KEY = 'selected_academic_year'

/**
 * Get current academic year from API
 */
export const getCurrentAcademicYear = async () => {
    try {
        const response = await api.get('/academic-years/current')
        return response.data
    } catch (error) {
        console.error('Error getting current academic year:', error)
        throw error
    }
}

/**
 * Get all academic years for dropdown
 */
export const getAllAcademicYears = async () => {
    try {
        const response = await api.get('/academic-years/all')
        return response.data
    } catch (error) {
        console.error('Error getting all academic years:', error)
        throw error
    }
}

/**
 * Set selected academic year (for admin/manager switching)
 */
export const setSelectedAcademicYear = (academicYear) => {
    setLocalStorage(SELECTED_YEAR_STORAGE_KEY, academicYear)

    // Add to request headers for API calls
    api.defaults.headers.common['switchToYearId'] = academicYear?._id || academicYear?.id
}

/**
 * Get selected academic year from storage
 */
export const getSelectedAcademicYear = () => {
    return getLocalStorage(SELECTED_YEAR_STORAGE_KEY)
}

/**
 * Clear selected academic year (revert to current)
 */
export const clearSelectedAcademicYear = () => {
    removeLocalStorage(SELECTED_YEAR_STORAGE_KEY)
    delete api.defaults.headers.common['switchToYearId']
}

/**
 * Check if user can switch academic years
 */
export const canSwitchAcademicYear = (user) => {
    return user && ['admin', 'manager'].includes(user.role)
}

/**
 * Get effective academic year (selected or current)
 */
export const getEffectiveAcademicYear = (currentYear) => {
    const selectedYear = getSelectedAcademicYear()
    return selectedYear || currentYear
}

/**
 * Format academic year display name
 */
export const formatAcademicYearName = (academicYear) => {
    if (!academicYear) return ''
    return `${academicYear.name} (${academicYear.code})`
}

/**
 * Check if academic year is current
 */
export const isCurrentAcademicYear = (academicYear) => {
    return academicYear?.isCurrent === true
}

/**
 * Check if academic year is active (within date range)
 */
export const isActiveAcademicYear = (academicYear) => {
    if (!academicYear?.startDate || !academicYear?.endDate) return false

    const now = new Date()
    const startDate = new Date(academicYear.startDate)
    const endDate = new Date(academicYear.endDate)

    return now >= startDate && now <= endDate
}

/**
 * Get academic year status display
 */
export const getAcademicYearStatusText = (status) => {
    const statusMap = {
        draft: 'Nháp',
        active: 'Đang hoạt động',
        completed: 'Đã hoàn thành',
        archived: 'Lưu trữ'
    }
    return statusMap[status] || status
}

/**
 * Get academic year status color
 */
export const getAcademicYearStatusColor = (status) => {
    const colorMap = {
        draft: 'gray',
        active: 'green',
        completed: 'blue',
        archived: 'orange'
    }
    return colorMap[status] || 'gray'
}

/**
 * Validate academic year dates
 */
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

/**
 * Generate academic year code from years
 */
export const generateAcademicYearCode = (startYear, endYear) => {
    if (!startYear || !endYear) return ''
    return `${startYear}-${endYear}`
}

/**
 * Generate academic year name from years
 */
export const generateAcademicYearName = (startYear, endYear) => {
    if (!startYear || !endYear) return ''
    return `Năm học ${startYear}-${endYear}`
}

/**
 * Parse academic year code to get years
 */
export const parseAcademicYearCode = (code) => {
    if (!code) return { startYear: null, endYear: null }

    const match = code.match(/^(\d{4})-(\d{4})$/)
    if (!match) return { startYear: null, endYear: null }

    return {
        startYear: parseInt(match[1]),
        endYear: parseInt(match[2])
    }
}

/**
 * Get available years for creating new academic year
 */
export const getAvailableYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []

    for (let year = 2020; year <= 2050; year++) {
        years.push(year)
    }

    return years
}

/**
 * Check if academic year can be deleted
 */
export const canDeleteAcademicYear = (academicYear) => {
    // Cannot delete current academic year
    if (academicYear?.isCurrent) return false

    // Cannot delete if has data (should be checked on backend)
    return true
}

/**
 * Get next academic year suggestion
 */
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

/**
 * Academic Year API functions
 */
export const academicYearAPI = {
    // Get all academic years
    getAll: async (params = {}) => {
        const response = await api.get('/academic-years', { params })
        return response.data
    },

    // Get academic year by ID
    getById: async (id) => {
        const response = await api.get(`/academic-years/${id}`)
        return response.data
    },

    // Create academic year
    create: async (data) => {
        const response = await api.post('/academic-years', data)
        return response.data
    },

    // Update academic year
    update: async (id, data) => {
        const response = await api.put(`/academic-years/${id}`, data)
        return response.data
    },

    // Delete academic year
    delete: async (id) => {
        const response = await api.delete(`/academic-years/${id}`)
        return response.data
    },

    // Set current academic year
    setCurrent: async (id) => {
        const response = await api.post(`/academic-years/${id}/set-current`)
        return response.data
    },

    // Copy data from another academic year
    copyData: async (id, sourceYearId, copySettings = {}) => {
        const response = await api.post(`/academic-years/${id}/copy-data`, {
            sourceYearId,
            copySettings
        })
        return response.data
    },

    // Get statistics
    getStatistics: async (id) => {
        const response = await api.get(`/academic-years/${id}/statistics`)
        return response.data
    },

    // Get available years for copying
    getAvailableForCopy: async (id) => {
        const response = await api.get(`/academic-years/${id}/available-for-copy`)
        return response.data
    }
}

/**
 * React hooks for academic year management
 */
export const useAcademicYear = () => {
    const [currentYear, setCurrentYear] = useState(null)
    const [selectedYear, setSelectedYear] = useState(null)
    const [availableYears, setAvailableYears] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Load current academic year
    const loadCurrentYear = useCallback(async () => {
        try {
            setLoading(true)
            const response = await getCurrentAcademicYear()
            setCurrentYear(response.data)

            // Load selected year from storage
            const stored = getSelectedAcademicYear()
            setSelectedYear(stored)
        } catch (err) {
            setError(err)
        } finally {
            setLoading(false)
        }
    }, [])

    // Load available years
    const loadAvailableYears = useCallback(async () => {
        try {
            const response = await getAllAcademicYears()
            setAvailableYears(response.data)
        } catch (err) {
            console.error('Error loading available years:', err)
        }
    }, [])

    // Switch academic year
    const switchYear = useCallback((year) => {
        setSelectedYear(year)
        setSelectedAcademicYear(year)
    }, [])

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedYear(null)
        clearSelectedAcademicYear()
    }, [])

    // Get effective year
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

// Context for academic year
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