import { useState, useCallback, useRef, useEffect } from 'react'
import { apiMethods } from '../services/api'
//import { useData, usePaginatedData, useMutation } from './useData'
import { errorHandlers } from './errorHandle'
//import { useAuth } from './useAuth'
import { useAcademicYearContext } from './academicYear'
import toast from 'react-hot-toast'

// Evidence Hooks
export const useEvidenceManagement = (options = {}) => {
    const { effectiveYear } = useAcademicYearContext()
    const [filters, setFilters] = useState({})
    const [selectedItems, setSelectedItems] = useState([])

    const {
        data: evidences,
        loading,
        error,
        pagination,
        goToPage,
        changeLimit,
        refetch
    } = usePaginatedData(
        (params) => apiMethods.evidences.getAll({
            ...params,
            ...filters,
            academicYearId: effectiveYear?._id
        }),
        [JSON.stringify(filters), effectiveYear?._id],
        {
            initialLimit: options.pageSize || 10,
            onError: (error) => errorHandlers.evidence(error)
        }
    )

    const createEvidence = useMutation(
        (data) => apiMethods.evidences.create({
            ...data,
            academicYearId: effectiveYear?._id
        }),
        {
            onSuccess: () => {
                refetch()
                toast.success('Tạo minh chứng thành công')
            },
            onError: (error) => errorHandlers.evidence(error)
        }
    )

    const updateEvidence = useMutation(
        ({ id, data }) => apiMethods.evidences.update(id, data),
        {
            onSuccess: () => {
                refetch()
                toast.success('Cập nhật minh chứng thành công')
            },
            onError: (error) => errorHandlers.evidence(error)
        }
    )

    const deleteEvidence = useMutation(
        (id) => apiMethods.evidences.delete(id),
        {
            onSuccess: () => {
                refetch()
                toast.success('Xóa minh chứng thành công')
            },
            onError: (error) => errorHandlers.evidence(error)
        }
    )

    const bulkDeleteEvidences = useMutation(
        (ids) => apiMethods.evidences.bulkDelete(ids),
        {
            onSuccess: (result) => {
                refetch()
                setSelectedItems([])
                toast.success(`Xóa thành công ${result.deleted || ids.length} minh chứng`)
            },
            onError: (error) => errorHandlers.evidence(error)
        }
    )

    const generateCode = useMutation(
        ({ standardCode, criteriaCode }) =>
            apiMethods.evidences.generateCode(standardCode, criteriaCode),
        {
            onError: (error) => errorHandlers.evidence(error)
        }
    )

    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }))
    }, [])

    const clearFilters = useCallback(() => {
        setFilters({})
    }, [])

    const toggleSelection = useCallback((id) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        )
    }, [])

    const selectAll = useCallback(() => {
        const allIds = evidences.map(item => item._id)
        setSelectedItems(allIds)
    }, [evidences])

    const clearSelection = useCallback(() => {
        setSelectedItems([])
    }, [])

    return {
        // Data
        evidences,
        loading,
        error,
        pagination,
        filters,
        selectedItems,

        // Actions
        createEvidence,
        updateEvidence,
        deleteEvidence,
        bulkDeleteEvidences,
        generateCode,

        // Pagination
        goToPage,
        changeLimit,
        refetch,

        // Filters
        updateFilters,
        clearFilters,

        // Selection
        toggleSelection,
        selectAll,
        clearSelection,
        hasSelection: selectedItems.length > 0,
        selectedCount: selectedItems.length,
        totalCount: evidences?.length || 0
    }
}

// Evidence Tree Hook
export const useEvidenceTree = (programId, organizationId) => {
    const { effectiveYear } = useAcademicYearContext()

    const {
        data: tree,
        loading,
        error,
        refetch
    } = useData(
        () => apiMethods.evidences.getTree(programId, organizationId),
        [programId, organizationId, effectiveYear?._id],
        {
            onError: (error) => errorHandlers.evidence(error)
        }
    )

    const [expandedKeys, setExpandedKeys] = useState([])
    const [selectedKeys, setSelectedKeys] = useState([])

    const expandAll = useCallback(() => {
        if (!tree) return
        const keys = []
        Object.keys(tree).forEach(standardKey => {
            keys.push(standardKey)
            Object.keys(tree[standardKey].criteria).forEach(criteriaKey => {
                keys.push(`${standardKey}-${criteriaKey}`)
            })
        })
        setExpandedKeys(keys)
    }, [tree])

    const collapseAll = useCallback(() => {
        setExpandedKeys([])
    }, [])

    return {
        tree,
        loading,
        error,
        refetch,
        expandedKeys,
        selectedKeys,
        setExpandedKeys,
        setSelectedKeys,
        expandAll,
        collapseAll
    }
}

// User Management Hook
export const useUserManagement = (options = {}) => {
    const { user: currentUser } = useAuth()
    const [filters, setFilters] = useState({})

    const {
        data: users,
        loading,
        error,
        pagination,
        goToPage,
        changeLimit,
        refetch
    } = usePaginatedData(
        (params) => apiMethods.users.getAll({ ...params, ...filters }),
        [JSON.stringify(filters)],
        {
            initialLimit: options.pageSize || 10,
            onError: (error) => errorHandlers.user(error)
        }
    )

    const createUser = useMutation(
        (data) => apiMethods.users.create(data),
        {
            onSuccess: () => {
                refetch()
                toast.success('Tạo người dùng thành công')
            },
            onError: (error) => errorHandlers.user(error)
        }
    )

    const updateUser = useMutation(
        ({ id, data }) => apiMethods.users.update(id, data),
        {
            onSuccess: () => {
                refetch()
                toast.success('Cập nhật người dùng thành công')
            },
            onError: (error) => errorHandlers.user(error)
        }
    )

    const deleteUser = useMutation(
        (id) => apiMethods.users.delete(id),
        {
            onSuccess: () => {
                refetch()
                toast.success('Xóa người dùng thành công')
            },
            onError: (error) => errorHandlers.user(error)
        }
    )

    const changeUserStatus = useMutation(
        ({ id, status }) => apiMethods.users.changeStatus(id, status),
        {
            onSuccess: () => {
                refetch()
                toast.success('Thay đổi trạng thái thành công')
            },
            onError: (error) => errorHandlers.user(error)
        }
    )

    const resetPassword = useMutation(
        (id) => apiMethods.users.resetPassword(id),
        {
            onSuccess: () => {
                toast.success('Reset mật khẩu thành công')
            },
            onError: (error) => errorHandlers.user(error)
        }
    )

    const bulkImport = useMutation(
        (file) => apiMethods.users.bulkImport(file),
        {
            onSuccess: (result) => {
                refetch()
                toast.success(`Import thành công ${result.success || 0} người dùng`)
            },
            onError: (error) => errorHandlers.user(error)
        }
    )

    const canManageUser = useCallback((targetUser) => {
        if (!currentUser || !targetUser) return false
        if (currentUser.role === 'admin') return true
        if (currentUser._id === targetUser._id) return true // Can edit self
        return false
    }, [currentUser])

    return {
        // Data
        users,
        loading,
        error,
        pagination,
        filters,

        // Actions
        createUser,
        updateUser,
        deleteUser,
        changeUserStatus,
        resetPassword,
        bulkImport,

        // Pagination
        goToPage,
        changeLimit,
        refetch,

        // Filters
        setFilters,

        // Permissions
        canManageUser
    }
}

// Program Management Hook
export const useProgramManagement = () => {
    const { effectiveYear } = useAcademicYearContext()

    const {
        data: programs,
        loading,
        error,
        refetch
    } = useData(
        () => effectiveYear?._id ?
            apiMethods.programs.getByAcademicYear(effectiveYear._id) :
            apiMethods.programs.getAll(),
        [effectiveYear?._id],
        {
            onError: (error) => errorHandlers.program(error)
        }
    )

    const createProgram = useMutation(
        (data) => apiMethods.programs.create({
            ...data,
            academicYearId: effectiveYear?._id
        }),
        {
            onSuccess: () => {
                refetch()
                toast.success('Tạo chương trình thành công')
            },
            onError: (error) => errorHandlers.program(error)
        }
    )

    const updateProgram = useMutation(
        ({ id, data }) => apiMethods.programs.update(id, data),
        {
            onSuccess: () => {
                refetch()
                toast.success('Cập nhật chương trình thành công')
            },
            onError: (error) => errorHandlers.program(error)
        }
    )

    const deleteProgram = useMutation(
        (id) => apiMethods.programs.delete(id),
        {
            onSuccess: () => {
                refetch()
                toast.success('Xóa chương trình thành công')
            },
            onError: (error) => errorHandlers.program(error)
        }
    )

    return {
        programs,
        loading,
        error,
        refetch,
        createProgram,
        updateProgram,
        deleteProgram
    }
}

// Organization Management Hook
export const useOrganizationManagement = () => {
    const { effectiveYear } = useAcademicYearContext()

    const {
        data: organizations,
        loading,
        error,
        refetch
    } = useData(
        () => effectiveYear?._id ?
            apiMethods.organizations.getByAcademicYear(effectiveYear._id) :
            apiMethods.organizations.getAll(),
        [effectiveYear?._id],
        {
            onError: (error) => errorHandlers.organization(error)
        }
    )

    const createOrganization = useMutation(
        (data) => apiMethods.organizations.create({
            ...data,
            academicYearId: effectiveYear?._id
        }),
        {
            onSuccess: () => {
                refetch()
                toast.success('Tạo tổ chức thành công')
            },
            onError: (error) => errorHandlers.organization(error)
        }
    )

    const updateOrganization = useMutation(
        ({ id, data }) => apiMethods.organizations.update(id, data),
        {
            onSuccess: () => {
                refetch()
                toast.success('Cập nhật tổ chức thành công')
            },
            onError: (error) => errorHandlers.organization(error)
        }
    )

    const deleteOrganization = useMutation(
        (id) => apiMethods.organizations.delete(id),
        {
            onSuccess: () => {
                refetch()
                toast.success('Xóa tổ chức thành công')
            },
            onError: (error) => errorHandlers.organization(error)
        }
    )

    return {
        organizations,
        loading,
        error,
        refetch,
        createOrganization,
        updateOrganization,
        deleteOrganization
    }
}

// Standard Management Hook
export const useStandardManagement = (programId, organizationId) => {
    const { effectiveYear } = useAcademicYearContext()

    const {
        data: standards,
        loading,
        error,
        refetch
    } = useData(
        () => {
            if (programId && organizationId) {
                return apiMethods.standards.getByProgram(programId, organizationId)
            } else if (effectiveYear?._id) {
                return apiMethods.standards.getByAcademicYear(effectiveYear._id)
            }
            return apiMethods.standards.getAll()
        },
        [programId, organizationId, effectiveYear?._id],
        {
            onError: (error) => errorHandlers.standard(error)
        }
    )

    const createStandard = useMutation(
        (data) => apiMethods.standards.create({
            ...data,
            academicYearId: effectiveYear?._id,
            programId,
            organizationId
        }),
        {
            onSuccess: () => {
                refetch()
                toast.success('Tạo tiêu chuẩn thành công')
            },
            onError: (error) => errorHandlers.standard(error)
        }
    )

    const updateStandard = useMutation(
        ({ id, data }) => apiMethods.standards.update(id, data),
        {
            onSuccess: () => {
                refetch()
                toast.success('Cập nhật tiêu chuẩn thành công')
            },
            onError: (error) => errorHandlers.standard(error)
        }
    )

    const deleteStandard = useMutation(
        (id) => apiMethods.standards.delete(id),
        {
            onSuccess: () => {
                refetch()
                toast.success('Xóa tiêu chuẩn thành công')
            },
            onError: (error) => errorHandlers.standard(error)
        }
    )

    return {
        standards,
        loading,
        error,
        refetch,
        createStandard,
        updateStandard,
        deleteStandard
    }
}

// Criteria Management Hook
export const useCriteriaManagement = (standardId, programId, organizationId) => {
    const { effectiveYear } = useAcademicYearContext()

    const {
        data: criteria,
        loading,
        error,
        refetch
    } = useData(
        () => {
            if (standardId) {
                return apiMethods.criteria.getByStandard(standardId)
            } else if (programId && organizationId) {
                return apiMethods.criteria.getByProgram(programId, organizationId)
            } else if (effectiveYear?._id) {
                return apiMethods.criteria.getByAcademicYear(effectiveYear._id)
            }
            return apiMethods.criteria.getAll()
        },
        [standardId, programId, organizationId, effectiveYear?._id],
        {
            onError: (error) => errorHandlers.criteria(error)
        }
    )

    const createCriterion = useMutation(
        (data) => apiMethods.criteria.create({
            ...data,
            academicYearId: effectiveYear?._id,
            standardId,
            programId,
            organizationId
        }),
        {
            onSuccess: () => {
                refetch()
                toast.success('Tạo tiêu chí thành công')
            },
            onError: (error) => errorHandlers.criteria(error)
        }
    )

    const updateCriterion = useMutation(
        ({ id, data }) => apiMethods.criteria.update(id, data),
        {
            onSuccess: () => {
                refetch()
                toast.success('Cập nhật tiêu chí thành công')
            },
            onError: (error) => errorHandlers.criteria(error)
        }
    )

    const deleteCriterion = useMutation(
        (id) => apiMethods.criteria.delete(id),
        {
            onSuccess: () => {
                refetch()
                toast.success('Xóa tiêu chí thành công')
            },
            onError: (error) => errorHandlers.criteria(error)
        }
    )

    return {
        criteria,
        loading,
        error,
        refetch,
        createCriterion,
        updateCriterion,
        deleteCriterion
    }
}

// File Management Hook
export const useFileManagement = (evidenceId) => {
    const {
        data: files,
        loading,
        error,
        refetch
    } = useData(
        () => apiMethods.files.getByEvidence(evidenceId),
        [evidenceId],
        {
            onError: (error) => errorHandlers.file(error)
        }
    )

    const uploadFile = useMutation(
        ({ file, onProgress }) => {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('evidenceId', evidenceId)

            return apiMethods.files.upload(file, evidenceId, {
                onUploadProgress: onProgress
            })
        },
        {
            onSuccess: () => {
                refetch()
                toast.success('Tải file thành công')
            },
            onError: (error) => errorHandlers.file(error)
        }
    )

    const deleteFile = useMutation(
        (id) => apiMethods.files.delete(id),
        {
            onSuccess: () => {
                refetch()
                toast.success('Xóa file thành công')
            },
            onError: (error) => errorHandlers.file(error)
        }
    )

    const downloadFile = useCallback(async (fileId, filename) => {
        try {
            const response = await apiMethods.files.download(fileId)

            // Create blob and download
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename || 'file')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success('Tải file thành công')
        } catch (error) {
            errorHandlers.file(error)
        }
    }, [])

    return {
        files,
        loading,
        error,
        refetch,
        uploadFile,
        deleteFile,
        downloadFile
    }
}

// Assignment Management Hook
export const useAssignmentManagement = (options = {}) => {
    const { user } = useAuth()
    const [filters, setFilters] = useState({})

    const {
        data: assignments,
        loading,
        error,
        pagination,
        goToPage,
        changeLimit,
        refetch
    } = usePaginatedData(
        (params) => {
            if (options.expertId) {
                return apiMethods.assignments.getByExpert(options.expertId, { ...params, ...filters })
            }
            return apiMethods.assignments.getAll({ ...params, ...filters })
        },
        [JSON.stringify(filters), options.expertId],
        {
            initialLimit: options.pageSize || 10,
            onError: (error) => errorHandlers.assignment(error)
        }
    )

    const createAssignment = useMutation(
        (data) => apiMethods.assignments.create(data),
        {
            onSuccess: () => {
                refetch()
                toast.success('Tạo phân công thành công')
            },
            onError: (error) => errorHandlers.assignment(error)
        }
    )

    const acceptAssignment = useMutation(
        ({ id, responseNote }) => apiMethods.assignments.accept(id, responseNote),
        {
            onSuccess: () => {
                refetch()
                toast.success('Chấp nhận phân công thành công')
            },
            onError: (error) => errorHandlers.assignment(error)
        }
    )

    const rejectAssignment = useMutation(
        ({ id, responseNote }) => apiMethods.assignments.reject(id, responseNote),
        {
            onSuccess: () => {
                refetch()
                toast.success('Từ chối phân công thành công')
            },
            onError: (error) => errorHandlers.assignment(error)
        }
    )

    const cancelAssignment = useMutation(
        ({ id, reason }) => apiMethods.assignments.cancel(id, reason),
        {
            onSuccess: () => {
                refetch()
                toast.success('Hủy phân công thành công')
            },
            onError: (error) => errorHandlers.assignment(error)
        }
    )

    return {
        assignments,
        loading,
        error,
        pagination,
        filters,
        goToPage,
        changeLimit,
        refetch,
        setFilters,
        createAssignment,
        acceptAssignment,
        rejectAssignment,
        cancelAssignment
    }
}

// Notification Management Hook
export const useNotificationManagement = (options = {}) => {
    const {
        data: notifications,
        loading,
        error,
        pagination,
        goToPage,
        changeLimit,
        refetch
    } = usePaginatedData(
        (params) => apiMethods.notifications.getAll({ ...params, ...options.filters }),
        [JSON.stringify(options.filters)],
        {
            initialLimit: options.pageSize || 20,
            onError: (error) => errorHandlers.notification(error, { showToast: false })
        }
    )

    const {
        data: unreadCount,
        refetch: refetchUnreadCount
    } = useData(
        () => apiMethods.notifications.getUnreadCount(),
        [],
        {
            cache: false,
            onError: (error) => errorHandlers.notification(error, { showToast: false })
        }
    )

    const markAsRead = useMutation(
        (id) => apiMethods.notifications.markAsRead(id),
        {
            onSuccess: () => {
                refetch()
                refetchUnreadCount()
            },
            onError: (error) => errorHandlers.notification(error)
        }
    )

    const markAllAsRead = useMutation(
        () => apiMethods.notifications.markAllAsRead(),
        {
            onSuccess: () => {
                refetch()
                refetchUnreadCount()
                toast.success('Đã đánh dấu tất cả thông báo là đã đọc')
            },
            onError: (error) => errorHandlers.notification(error)
        }
    )

    const deleteNotification = useMutation(
        (id) => apiMethods.notifications.delete(id),
        {
            onSuccess: () => {
                refetch()
                refetchUnreadCount()
            },
            onError: (error) => errorHandlers.notification(error)
        }
    )

    return {
        notifications,
        loading,
        error,
        pagination,
        unreadCount: unreadCount?.data || 0,
        goToPage,
        changeLimit,
        refetch,
        refetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
    }
}

export default {
    useEvidenceManagement,
    useEvidenceTree,
    useUserManagement,
    useProgramManagement,
    useOrganizationManagement,
    useStandardManagement,
    useCriteriaManagement,
    useFileManagement,
    useAssignmentManagement,
    useNotificationManagement
}