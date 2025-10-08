/*import { useState, useEffect, useCallback, useRef } from 'react'
import {
    getCurrentAcademicYear,
    getAllAcademicYears,
    getAcademicYears,
    getAcademicYearById,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setCurrentAcademicYear,
    copyDataFromYear,
    getAcademicYearStatistics,
    getAvailableYearsForCopy
} from '../utils/academicYear'

// Utility function để show toast (fallback nếu react-hot-toast không có)
const showToast = (message, type = 'success') => {
    if (typeof window !== 'undefined') {
        try {
            // Thử import react-hot-toast
            import('react-hot-toast').then(toast => {
                if (type === 'success') {
                    toast.default.success(message)
                } else if (type === 'error') {
                    toast.default.error(message)
                } else {
                    toast.default(message)
                }
            }).catch(() => {
                // Fallback: sử dụng console hoặc alert
                console.log(`Toast ${type}:`, message)
                // Hoặc có thể sử dụng browser alert
                // alert(message)
            })
        } catch (error) {
            console.log(`Toast ${type}:`, message)
        }
    }
}

export const useAcademicYear = () => {
    const [currentYear, setCurrentYear] = useState(null)
    const [allYears, setAllYears] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Ref để track component mount state
    const isMountedRef = useRef(true)

    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    // Safe state update - chỉ update nếu component vẫn mounted
    const safeSetState = useCallback((setter, value) => {
        if (isMountedRef.current) {
            setter(value)
        }
    }, [])

    // Load current academic year
    const loadCurrentYear = useCallback(async () => {
        try {
            safeSetState(setLoading, true)
            safeSetState(setError, null)

            const result = await getCurrentAcademicYear()

            if (result && result.success) {
                safeSetState(setCurrentYear, result.data)
            } else {
                throw new Error(result?.message || 'Không thể tải năm học hiện tại')
            }
        } catch (err) {
            console.error('Error loading current year:', err)
            safeSetState(setError, err.message || 'Lỗi khi tải năm học hiện tại')
        } finally {
            safeSetState(setLoading, false)
        }
    }, [safeSetState])

    // Load all academic years
    const loadAllYears = useCallback(async () => {
        try {
            safeSetState(setLoading, true)
            safeSetState(setError, null)

            const result = await getAllAcademicYears()

            if (result && result.success) {
                const years = result.data || []
                safeSetState(setAllYears, years)

                // Update current year if exists in the list
                const current = years.find(year => year.isCurrent)
                if (current) {
                    safeSetState(setCurrentYear, current)
                }
            } else {
                throw new Error(result?.message || 'Không thể tải danh sách năm học')
            }
        } catch (err) {
            console.error('Error loading all years:', err)
            safeSetState(setError, err.message || 'Lỗi khi tải danh sách năm học')
        } finally {
            safeSetState(setLoading, false)
        }
    }, [safeSetState])

    // Change current academic year
    const changeCurrentYear = useCallback(async (yearId) => {
        if (!yearId) {
            const errorMsg = 'ID năm học không hợp lệ'
            safeSetState(setError, errorMsg)
            showToast(errorMsg, 'error')
            return { success: false, error: errorMsg }
        }

        try {
            safeSetState(setLoading, true)
            safeSetState(setError, null)

            const result = await setCurrentAcademicYear(yearId)

            if (result && result.success) {
                // Update local state
                safeSetState(setAllYears, years =>
                    years.map(year => ({
                        ...year,
                        isCurrent: year._id === yearId
                    }))
                )

                // Find and update current year
                const newCurrentYear = allYears.find(year => year._id === yearId)
                if (newCurrentYear) {
                    safeSetState(setCurrentYear, { ...newCurrentYear, isCurrent: true })
                }

                showToast('Đã chuyển năm học thành công!', 'success')
                return { success: true }
            } else {
                throw new Error(result?.message || 'Có lỗi xảy ra khi chuyển năm học')
            }
        } catch (err) {
            console.error('Error changing current year:', err)
            const errorMsg = err.message || 'Lỗi khi chuyển năm học'
            safeSetState(setError, errorMsg)
            showToast(errorMsg, 'error')
            return { success: false, error: errorMsg }
        } finally {
            safeSetState(setLoading, false)
        }
    }, [allYears, safeSetState])

    // Refresh data
    const refresh = useCallback(async () => {
        try {
            await loadAllYears()
        } catch (error) {
            console.error('Error refreshing data:', error)
        }
    }, [loadAllYears])

    // Load initial data
    useEffect(() => {
        loadAllYears()
    }, [loadAllYears])

    return {
        // State
        currentYear,
        allYears,
        loading,
        error,

        // Actions
        loadCurrentYear,
        loadAllYears,
        changeCurrentYear,
        refresh,

        // Utilities
        setCurrentYear: (year) => safeSetState(setCurrentYear, year),
        setAllYears: (years) => safeSetState(setAllYears, years),
        setLoading: (loading) => safeSetState(setLoading, loading),
        setError: (error) => safeSetState(setError, error)
    }
}

// Hook for academic year CRUD operations
export const useAcademicYearCRUD = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const isMountedRef = useRef(true)

    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    const safeSetState = useCallback((setter, value) => {
        if (isMountedRef.current) {
            setter(value)
        }
    }, [])

    const handleOperation = useCallback(async (operation, successMessage) => {
        try {
            safeSetState(setLoading, true)
            safeSetState(setError, null)

            const result = await operation()

            if (result && result.success) {
                showToast(successMessage, 'success')
                return result
            } else {
                throw new Error(result?.message || 'Có lỗi xảy ra')
            }
        } catch (err) {
            console.error('Operation error:', err)
            const errorMsg = err.message || 'Có lỗi xảy ra'
            safeSetState(setError, errorMsg)
            showToast(errorMsg, 'error')
            throw err
        } finally {
            safeSetState(setLoading, false)
        }
    }, [safeSetState])

    const createYear = useCallback(async (data) => {
        if (!data) {
            throw new Error('Dữ liệu năm học là bắt buộc')
        }
        return handleOperation(
            () => createAcademicYear(data),
            'Tạo năm học thành công!'
        )
    }, [handleOperation])

    const updateYear = useCallback(async (id, data) => {
        if (!id || !data) {
            throw new Error('ID và dữ liệu năm học là bắt buộc')
        }
        return handleOperation(
            () => updateAcademicYear(id, data),
            'Cập nhật năm học thành công!'
        )
    }, [handleOperation])

    const deleteYear = useCallback(async (id) => {
        if (!id) {
            throw new Error('ID năm học là bắt buộc')
        }
        return handleOperation(
            () => deleteAcademicYear(id),
            'Xóa năm học thành công!'
        )
    }, [handleOperation])

    const copyYear = useCallback(async (targetId, sourceId, settings = {}) => {
        if (!targetId || !sourceId) {
            throw new Error('ID năm học nguồn và đích là bắt buộc')
        }
        return handleOperation(
            () => copyDataFromYear(targetId, sourceId, settings),
            'Sao chép dữ liệu thành công!'
        )
    }, [handleOperation])

    return {
        loading,
        error,
        createYear,
        updateYear,
        deleteYear,
        copyYear,
        setError: (error) => safeSetState(setError, error)
    }
}

// Hook for academic year details
export const useAcademicYearDetails = (yearId) => {
    const [year, setYear] = useState(null)
    const [statistics, setStatistics] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const isMountedRef = useRef(true)

    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    const safeSetState = useCallback((setter, value) => {
        if (isMountedRef.current) {
            setter(value)
        }
    }, [])

    const loadYear = useCallback(async () => {
        if (!yearId) return

        try {
            safeSetState(setLoading, true)
            safeSetState(setError, null)

            const result = await getAcademicYearById(yearId)

            if (result && result.success) {
                safeSetState(setYear, result.data)
            } else {
                throw new Error(result?.message || 'Không thể tải thông tin năm học')
            }
        } catch (err) {
            console.error('Error loading year details:', err)
            safeSetState(setError, err.message || 'Lỗi khi tải thông tin năm học')
        } finally {
            safeSetState(setLoading, false)
        }
    }, [yearId, safeSetState])

    const loadStatistics = useCallback(async () => {
        if (!yearId) return

        try {
            const result = await getAcademicYearStatistics(yearId)
            if (result && result.success) {
                safeSetState(setStatistics, result.data)
            }
        } catch (err) {
            console.error('Error loading statistics:', err)
            // Không set error cho statistics vì đây là optional data
        }
    }, [yearId, safeSetState])

    const refresh = useCallback(async () => {
        await Promise.all([
            loadYear(),
            loadStatistics()
        ])
    }, [loadYear, loadStatistics])

    useEffect(() => {
        if (yearId) {
            loadYear()
            loadStatistics()
        }
    }, [loadYear, loadStatistics, yearId])

    return {
        year,
        statistics,
        loading,
        error,
        loadYear,
        loadStatistics,
        refresh
    }
}*/