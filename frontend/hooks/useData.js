import { useState, useEffect, useCallback, useRef } from 'react'
import { apiMethods } from '../services/api'
import toast from 'react-hot-toast'

// Generic data fetching hook
export const useData = (fetchFunction, dependencies = [], options = {}) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastFetch, setLastFetch] = useState(null)

    const {
        initialData = null,
        onSuccess,
        onError,
        transform,
        cache = false,
        retryCount = 0,
        retryDelay = 1000
    } = options

    const retryCountRef = useRef(0)

    const fetchData = useCallback(async (showLoading = true, forceRefetch = false) => {
        // Skip if cache is enabled and data exists and not forcing refetch
        if (cache && data && !forceRefetch) {
            return data
        }

        try {
            if (showLoading) setLoading(true)
            setError(null)

            const result = await fetchFunction()
            let processedData = result.data

            // Transform data if transformer provided
            if (transform && typeof transform === 'function') {
                processedData = transform(processedData)
            }

            setData(processedData)
            setLastFetch(new Date())
            retryCountRef.current = 0

            if (onSuccess) onSuccess(processedData)

            return processedData
        } catch (err) {
            console.error('Data fetch error:', err)
            setError(err)

            // Retry logic
            if (retryCountRef.current < retryCount) {
                retryCountRef.current++
                setTimeout(() => {
                    fetchData(showLoading, forceRefetch)
                }, retryDelay * retryCountRef.current)
            } else {
                if (onError) onError(err)
            }

            throw err
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [fetchFunction, cache, data, transform, onSuccess, onError, retryCount, retryDelay])

    // Initial fetch
    useEffect(() => {
        if (initialData) {
            setData(initialData)
            setLoading(false)
        } else {
            fetchData()
        }
    }, dependencies)

    const refetch = useCallback(() => fetchData(true, true), [fetchData])
    const refresh = useCallback(() => fetchData(false, true), [fetchData])

    return {
        data,
        loading,
        error,
        lastFetch,
        refetch,
        refresh,
        setData
    }
}

// Paginated data hook
export const usePaginatedData = (fetchFunction, dependencies = [], options = {}) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    })

    const {
        initialPage = 1,
        initialLimit = 10,
        onSuccess,
        onError,
        transform
    } = options

    const fetchData = useCallback(async (page = pagination.page, limit = pagination.limit, showLoading = true) => {
        try {
            if (showLoading) setLoading(true)
            setError(null)

            const result = await fetchFunction({
                page,
                limit,
                ...options.params
            })

            let processedData = result.data.data || result.data
            const meta = result.data.pagination || result.data.meta || {}

            if (transform && typeof transform === 'function') {
                processedData = transform(processedData)
            }

            setData(processedData)
            setPagination({
                page: meta.page || page,
                limit: meta.limit || limit,
                total: meta.total || processedData.length,
                totalPages: meta.totalPages || Math.ceil((meta.total || processedData.length) / limit)
            })

            if (onSuccess) onSuccess(processedData, meta)
        } catch (err) {
            console.error('Paginated fetch error:', err)
            setError(err)
            if (onError) onError(err)
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [fetchFunction, pagination.page, pagination.limit, transform, onSuccess, onError, options.params])

    useEffect(() => {
        fetchData(initialPage, initialLimit)
    }, dependencies)

    const goToPage = useCallback((page) => {
        fetchData(page, pagination.limit)
    }, [fetchData, pagination.limit])

    const changeLimit = useCallback((limit) => {
        fetchData(1, limit)
    }, [fetchData])

    const refetch = useCallback(() => {
        fetchData(pagination.page, pagination.limit, true)
    }, [fetchData, pagination.page, pagination.limit])

    return {
        data,
        loading,
        error,
        pagination,
        goToPage,
        changeLimit,
        refetch,
        setData
    }
}

// Mutation hook for create/update/delete operations
export const useMutation = (mutationFunction, options = {}) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const {
        onSuccess,
        onError,
        successMessage,
        errorMessage
    } = options

    const mutate = useCallback(async (variables) => {
        try {
            setLoading(true)
            setError(null)

            const result = await mutationFunction(variables)

            if (onSuccess) onSuccess(result.data, variables)
            if (successMessage) toast.success(successMessage)

            return result.data
        } catch (err) {
            console.error('Mutation error:', err)
            setError(err)

            const message = err.response?.data?.message || errorMessage || 'Có lỗi xảy ra'
            toast.error(message)

            if (onError) onError(err, variables)
            throw err
        } finally {
            setLoading(false)
        }
    }, [mutationFunction, onSuccess, onError, successMessage, errorMessage])

    return {
        mutate,
        loading,
        error
    }
}

// Academic Years hooks
export const useAcademicYears = (options = {}) => {
    return usePaginatedData(
        (params) => apiMethods.academicYears.getAll(params),
        [],
        { ...options, initialLimit: 20 }
    )
}

export const useCurrentAcademicYear = () => {
    return useData(
        () => apiMethods.academicYears.getCurrent(),
        [],
        { cache: true }
    )
}

export const useAcademicYear = (id) => {
    return useData(
        () => apiMethods.academicYears.getById(id),
        [id],
        { cache: true }
    )
}

// Users hooks
export const useUsers = (options = {}) => {
    return usePaginatedData(
        (params) => apiMethods.users.getAll(params),
        [],
        options
    )
}

export const useUser = (id) => {
    return useData(
        () => apiMethods.users.getById(id),
        [id],
        { cache: true }
    )
}

// Programs hooks
export const usePrograms = (academicYearId, options = {}) => {
    return useData(
        () => academicYearId ?
            apiMethods.programs.getByAcademicYear(academicYearId) :
            apiMethods.programs.getAll(),
        [academicYearId],
        options
    )
}

export const useProgram = (id) => {
    return useData(
        () => apiMethods.programs.getById(id),
        [id],
        { cache: true }
    )
}

// Organizations hooks
export const useOrganizations = (academicYearId, options = {}) => {
    return useData(
        () => academicYearId ?
            apiMethods.organizations.getByAcademicYear(academicYearId) :
            apiMethods.organizations.getAll(),
        [academicYearId],
        options
    )
}

export const useOrganization = (id) => {
    return useData(
        () => apiMethods.organizations.getById(id),
        [id],
        { cache: true }
    )
}

// Standards hooks
export const useStandards = (academicYearId, programId, organizationId, options = {}) => {
    return useData(
        () => {
            if (programId && organizationId) {
                return apiMethods.standards.getByProgram(programId, organizationId)
            } else if (academicYearId) {
                return apiMethods.standards.getByAcademicYear(academicYearId)
            }
            return apiMethods.standards.getAll()
        },
        [academicYearId, programId, organizationId],
        options
    )
}

export const useStandard = (id) => {
    return useData(
        () => apiMethods.standards.getById(id),
        [id],
        { cache: true }
    )
}

// Criteria hooks
export const useCriteria = (academicYearId, standardId, programId, organizationId, options = {}) => {
    return useData(
        () => {
            if (standardId) {
                return apiMethods.criteria.getByStandard(standardId)
            } else if (programId && organizationId) {
                return apiMethods.criteria.getByProgram(programId, organizationId)
            } else if (academicYearId) {
                return apiMethods.criteria.getByAcademicYear(academicYearId)
            }
            return apiMethods.criteria.getAll()
        },
        [academicYearId, standardId, programId, organizationId],
        options
    )
}

export const useCriterion = (id) => {
    return useData(
        () => apiMethods.criteria.getById(id),
        [id],
        { cache: true }
    )
}

// Evidences hooks
export const useEvidences = (options = {}) => {
    const { filters = {}, ...restOptions } = options

    return usePaginatedData(
        (params) => apiMethods.evidences.getAll({ ...params, ...filters }),
        [JSON.stringify(filters)],
        restOptions
    )
}

export const useEvidence = (id) => {
    return useData(
        () => apiMethods.evidences.getById(id),
        [id],
        { cache: true }
    )
}

export const useEvidenceTree = (programId, organizationId) => {
    return useData(
        () => apiMethods.evidences.getTree(programId, organizationId),
        [programId, organizationId],
        { cache: true }
    )
}

export const useEvidenceSearch = (searchParams) => {
    return useData(
        () => apiMethods.evidences.search(searchParams),
        [JSON.stringify(searchParams)]
    )
}

// Files hooks
export const useFiles = (evidenceId) => {
    return useData(
        () => apiMethods.files.getByEvidence(evidenceId),
        [evidenceId]
    )
}

// Reports hooks
export const useReports = (options = {}) => {
    return usePaginatedData(
        (params) => apiMethods.reports.getAll(params),
        [],
        options
    )
}

export const useReport = (id) => {
    return useData(
        () => apiMethods.reports.getById(id),
        [id],
        { cache: true }
    )
}

// Assignments hooks
export const useAssignments = (options = {}) => {
    return usePaginatedData(
        (params) => apiMethods.assignments.getAll(params),
        [],
        options
    )
}

export const useAssignment = (id) => {
    return useData(
        () => apiMethods.assignments.getById(id),
        [id]
    )
}

export const useAssignmentsByExpert = (expertId, options = {}) => {
    return usePaginatedData(
        (params) => apiMethods.assignments.getByExpert(expertId, params),
        [expertId],
        options
    )
}

// Evaluations hooks
export const useEvaluations = (options = {}) => {
    return usePaginatedData(
        (params) => apiMethods.evaluations.getAll(params),
        [],
        options
    )
}

export const useEvaluation = (id) => {
    return useData(
        () => apiMethods.evaluations.getById(id),
        [id]
    )
}

export const useEvaluationsByEvaluator = (evaluatorId, options = {}) => {
    return usePaginatedData(
        (params) => apiMethods.evaluations.getByEvaluator(evaluatorId, params),
        [evaluatorId],
        options
    )
}

// Notifications hooks
export const useNotifications = (options = {}) => {
    return usePaginatedData(
        (params) => apiMethods.notifications.getAll(params),
        [],
        options
    )
}

export const useUnreadNotifications = () => {
    return useData(
        () => apiMethods.notifications.getUnreadCount(),
        [],
        { cache: false }
    )
}

// Activity logs hooks
export const useActivityLogs = (options = {}) => {
    return usePaginatedData(
        (params) => apiMethods.activityLogs.getAll(params),
        [],
        options
    )
}

export const useUserActivity = (userId, options = {}) => {
    return usePaginatedData(
        (params) => apiMethods.activityLogs.getUserActivity(userId, params),
        [userId],
        options
    )
}

// System hooks
export const useSystemStats = () => {
    return useData(
        () => apiMethods.system.getStats(),
        [],
        { cache: true }
    )
}

export const useDashboard = () => {
    return useData(
        () => apiMethods.system.getDashboard(),
        []
    )
}

// Mutation hooks
export const useCreateAcademicYear = (options = {}) => {
    return useMutation(
        (data) => apiMethods.academicYears.create(data),
        { successMessage: 'Tạo năm học thành công', ...options }
    )
}

export const useUpdateAcademicYear = (options = {}) => {
    return useMutation(
        ({ id, data }) => apiMethods.academicYears.update(id, data),
        { successMessage: 'Cập nhật năm học thành công', ...options }
    )
}

export const useDeleteAcademicYear = (options = {}) => {
    return useMutation(
        (id) => apiMethods.academicYears.delete(id),
        { successMessage: 'Xóa năm học thành công', ...options }
    )
}

export const useCreateUser = (options = {}) => {
    return useMutation(
        (data) => apiMethods.users.create(data),
        { successMessage: 'Tạo người dùng thành công', ...options }
    )
}

export const useUpdateUser = (options = {}) => {
    return useMutation(
        ({ id, data }) => apiMethods.users.update(id, data),
        { successMessage: 'Cập nhật người dùng thành công', ...options }
    )
}

export const useDeleteUser = (options = {}) => {
    return useMutation(
        (id) => apiMethods.users.delete(id),
        { successMessage: 'Xóa người dùng thành công', ...options }
    )
}

export const useCreateEvidence = (options = {}) => {
    return useMutation(
        (data) => apiMethods.evidences.create(data),
        { successMessage: 'Tạo minh chứng thành công', ...options }
    )
}

export const useUpdateEvidence = (options = {}) => {
    return useMutation(
        ({ id, data }) => apiMethods.evidences.update(id, data),
        { successMessage: 'Cập nhật minh chứng thành công', ...options }
    )
}

export const useDeleteEvidence = (options = {}) => {
    return useMutation(
        (id) => apiMethods.evidences.delete(id),
        { successMessage: 'Xóa minh chứng thành công', ...options }
    )
}

export const useUploadFile = (options = {}) => {
    return useMutation(
        ({ file, evidenceId }) => apiMethods.files.upload(file, evidenceId),
        { successMessage: 'Tải file thành công', ...options }
    )
}

export default {
    useData,
    usePaginatedData,
    useMutation,
    useAcademicYears,
    useCurrentAcademicYear,
    useUsers,
    usePrograms,
    useOrganizations,
    useStandards,
    useCriteria,
    useEvidences,
    useReports,
    useAssignments,
    useEvaluations,
    useNotifications,
    useActivityLogs,
    useSystemStats,
    useDashboard
}