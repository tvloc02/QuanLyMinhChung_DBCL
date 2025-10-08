import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { getLocalStorage, setLocalStorage } from '../utils/helpers'

const AppContext = createContext()

export const APP_ACTIONS = {
    SET_THEME: 'SET_THEME',
    SET_SIDEBAR_COLLAPSED: 'SET_SIDEBAR_COLLAPSED',
    SET_LOADING: 'SET_LOADING',
    SET_BREADCRUMBS: 'SET_BREADCRUMBS',
    SET_PAGE_TITLE: 'SET_PAGE_TITLE',
    SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
    ADD_NOTIFICATION: 'ADD_NOTIFICATION',
    REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
    SET_FILTERS: 'SET_FILTERS',
    SET_SEARCH_HISTORY: 'SET_SEARCH_HISTORY',
    ADD_SEARCH_TERM: 'ADD_SEARCH_TERM',
    SET_PREFERENCES: 'SET_PREFERENCES',
    UPDATE_PREFERENCE: 'UPDATE_PREFERENCE',
    SET_STATISTICS: 'SET_STATISTICS'
}

const initialState = {
    theme: 'light',
    sidebarCollapsed: false,
    loading: false,
    pageTitle: '',
    breadcrumbs: [],
    notifications: [],
    filters: {
        evidence: {},
        standards: {},
        criteria: {},
        programs: {},
        organizations: {}
    },
    searchHistory: [],
    preferences: {
        itemsPerPage: 10,
        dateFormat: 'DD/MM/YYYY',
        language: 'vi',
        autoSave: true,
        showHelpTooltips: true,
        compactMode: false
    },
    statistics: {
        totalEvidences: 0,
        totalStandards: 0,
        totalCriteria: 0,
        totalPrograms: 0,
        recentActivities: []
    }
}

const appReducer = (state, action) => {
    switch (action.type) {
        case APP_ACTIONS.SET_THEME:
            return {
                ...state,
                theme: action.payload
            }

        case APP_ACTIONS.SET_SIDEBAR_COLLAPSED:
            return {
                ...state,
                sidebarCollapsed: action.payload
            }

        case APP_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload
            }

        case APP_ACTIONS.SET_PAGE_TITLE:
            return {
                ...state,
                pageTitle: action.payload
            }

        case APP_ACTIONS.SET_BREADCRUMBS:
            return {
                ...state,
                breadcrumbs: action.payload
            }

        case APP_ACTIONS.SET_NOTIFICATIONS:
            return {
                ...state,
                notifications: action.payload
            }

        case APP_ACTIONS.ADD_NOTIFICATION:
            return {
                ...state,
                notifications: [...state.notifications, {
                    id: Date.now() + Math.random(),
                    ...action.payload,
                    timestamp: new Date().toISOString()
                }]
            }

        case APP_ACTIONS.REMOVE_NOTIFICATION:
            return {
                ...state,
                notifications: state.notifications.filter(
                    notification => notification.id !== action.payload
                )
            }

        case APP_ACTIONS.SET_FILTERS:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    [action.payload.type]: action.payload.filters
                }
            }

        case APP_ACTIONS.SET_SEARCH_HISTORY:
            return {
                ...state,
                searchHistory: action.payload
            }

        case APP_ACTIONS.ADD_SEARCH_TERM:
            const newHistory = [action.payload, ...state.searchHistory.filter(term => term !== action.payload)]
            return {
                ...state,
                searchHistory: newHistory.slice(0, 10) // Keep only last 10 searches
            }

        case APP_ACTIONS.SET_PREFERENCES:
            return {
                ...state,
                preferences: {
                    ...state.preferences,
                    ...action.payload
                }
            }

        case APP_ACTIONS.UPDATE_PREFERENCE:
            return {
                ...state,
                preferences: {
                    ...state.preferences,
                    [action.payload.key]: action.payload.value
                }
            }

        case APP_ACTIONS.SET_STATISTICS:
            return {
                ...state,
                statistics: {
                    ...state.statistics,
                    ...action.payload
                }
            }

        default:
            return state
    }
}

export const useApp = () => {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useApp must be used within an AppProvider')
    }
    return context
}

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState)

    useEffect(() => {
        const savedTheme = getLocalStorage('theme', 'light')
        const savedSidebarCollapsed = getLocalStorage('sidebarCollapsed', false)
        const savedSearchHistory = getLocalStorage('searchHistory', [])
        const savedPreferences = getLocalStorage('preferences', {})

        dispatch({ type: APP_ACTIONS.SET_THEME, payload: savedTheme })
        dispatch({ type: APP_ACTIONS.SET_SIDEBAR_COLLAPSED, payload: savedSidebarCollapsed })
        dispatch({ type: APP_ACTIONS.SET_SEARCH_HISTORY, payload: savedSearchHistory })
        dispatch({
            type: APP_ACTIONS.SET_PREFERENCES,
            payload: { ...initialState.preferences, ...savedPreferences }
        })
    }, [])

    useEffect(() => {
        setLocalStorage('theme', state.theme)
        if (state.theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [state.theme])

    useEffect(() => {
        setLocalStorage('sidebarCollapsed', state.sidebarCollapsed)
    }, [state.sidebarCollapsed])

    useEffect(() => {
        setLocalStorage('searchHistory', state.searchHistory)
    }, [state.searchHistory])

    useEffect(() => {
        setLocalStorage('preferences', state.preferences)
    }, [state.preferences])

    const actions = {
        setTheme: (theme) => {
            dispatch({ type: APP_ACTIONS.SET_THEME, payload: theme })
        },

        toggleTheme: () => {
            const newTheme = state.theme === 'light' ? 'dark' : 'light'
            dispatch({ type: APP_ACTIONS.SET_THEME, payload: newTheme })
        },

        setSidebarCollapsed: (collapsed) => {
            dispatch({ type: APP_ACTIONS.SET_SIDEBAR_COLLAPSED, payload: collapsed })
        },

        toggleSidebar: () => {
            dispatch({ type: APP_ACTIONS.SET_SIDEBAR_COLLAPSED, payload: !state.sidebarCollapsed })
        },

        setLoading: (loading) => {
            dispatch({ type: APP_ACTIONS.SET_LOADING, payload: loading })
        },

        setPageTitle: (title) => {
            dispatch({ type: APP_ACTIONS.SET_PAGE_TITLE, payload: title })
            if (typeof window !== 'undefined') {
                document.title = title ? `${title} - Hệ thống quản lý minh chứng` : 'Hệ thống quản lý minh chứng'
            }
        },

        setBreadcrumbs: (breadcrumbs) => {
            dispatch({ type: APP_ACTIONS.SET_BREADCRUMBS, payload: breadcrumbs })
        },

        addNotification: (notification) => {
            dispatch({ type: APP_ACTIONS.ADD_NOTIFICATION, payload: notification })
        },

        removeNotification: (id) => {
            dispatch({ type: APP_ACTIONS.REMOVE_NOTIFICATION, payload: id })
        },

        clearNotifications: () => {
            dispatch({ type: APP_ACTIONS.SET_NOTIFICATIONS, payload: [] })
        },

        setFilters: (type, filters) => {
            dispatch({
                type: APP_ACTIONS.SET_FILTERS,
                payload: { type, filters }
            })
        },

        clearFilters: (type) => {
            dispatch({
                type: APP_ACTIONS.SET_FILTERS,
                payload: { type, filters: {} }
            })
        },

        addSearchTerm: (term) => {
            if (term && term.trim()) {
                dispatch({ type: APP_ACTIONS.ADD_SEARCH_TERM, payload: term.trim() })
            }
        },

        clearSearchHistory: () => {
            dispatch({ type: APP_ACTIONS.SET_SEARCH_HISTORY, payload: [] })
        },

        updatePreference: (key, value) => {
            dispatch({
                type: APP_ACTIONS.UPDATE_PREFERENCE,
                payload: { key, value }
            })
        },

        setPreferences: (preferences) => {
            dispatch({ type: APP_ACTIONS.SET_PREFERENCES, payload: preferences })
        },

        resetPreferences: () => {
            dispatch({ type: APP_ACTIONS.SET_PREFERENCES, payload: initialState.preferences })
        },

        setStatistics: (statistics) => {
            dispatch({ type: APP_ACTIONS.SET_STATISTICS, payload: statistics })
        },

        updateStatistic: (key, value) => {
            dispatch({
                type: APP_ACTIONS.SET_STATISTICS,
                payload: { [key]: value }
            })
        }
    }

    const helpers = {
        getFilter: (type) => state.filters[type] || {},

        hasActiveFilters: (type) => {
            const filters = state.filters[type] || {}
            return Object.keys(filters).some(key => filters[key] !== '' && filters[key] !== null && filters[key] !== undefined)
        },

        getActiveFiltersCount: (type) => {
            const filters = state.filters[type] || {}
            return Object.keys(filters).filter(key => filters[key] !== '' && filters[key] !== null && filters[key] !== undefined).length
        },

        isCompactMode: () => state.preferences.compactMode,

        getItemsPerPage: () => state.preferences.itemsPerPage,

        getDateFormat: () => state.preferences.dateFormat,

        shouldShowHelpTooltips: () => state.preferences.showHelpTooltips,

        isAutoSaveEnabled: () => state.preferences.autoSave
    }

    const value = {
        state,
        dispatch,
        actions,
        helpers
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export default AppContext