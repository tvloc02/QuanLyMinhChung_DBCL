import React, { useState, useCallback, useMemo, useEffect, useContext } from 'react'
import  api  from '../services/api'
import { getLocalStorage, setLocalStorage, removeLocalStorage } from './helpers'
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