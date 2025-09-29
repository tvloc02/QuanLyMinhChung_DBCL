import { handleError, parseError } from './errorHandler'
import toast from 'react-hot-toast'

/**
 * Standard response structure từ backend:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any,
 *   pagination?: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number
 *   },
 *   meta?: any
 * }
 */

/**
 * Handle successful API response
 */
export const handleSuccessResponse = (response, options = {}) => {
    const {
        showSuccessToast = false,
        successMessage,
        onSuccess,
        transform
    } = options

    if (!response || !response.data) {
        console.warn('Invalid response structure:', response)
        return null
    }

    const { success, message, data, pagination, meta } = response.data

    // Check if response indicates success
    if (success === false) {
        // Backend returned error in success response
        handleError(new Error(message || 'Operation failed'), {
            customMessage: message,
            showToast: true
        })
        return null
    }

    let processedData = data

    // Transform data if transformer provided
    if (transform && typeof transform === 'function') {
        try {
            processedData = transform(data)
        } catch (transformError) {
            console.error('Data transformation error:', transformError)
            processedData = data
        }
    }

    // Show success toast if requested
    if (showSuccessToast) {
        const toastMessage = successMessage || message || 'Thao tác thành công'
        toast.success(toastMessage)
    }

    // Call success callback
    if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(processedData, { pagination, meta, message })
    }

    return {
        data: processedData,
        pagination,
        meta,
        message,
        success: true
    }
}

/**
 * Handle paginated response
 */
export const handlePaginatedResponse = (response, options = {}) => {
    const result = handleSuccessResponse(response, options)

    if (!result) return null

    const { data, pagination } = result

    // Ensure pagination object exists with defaults
    const paginationInfo = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        ...pagination
    }

    // If data is array and no pagination info, calculate from data
    if (Array.isArray(data) && !pagination) {
        paginationInfo.total = data.length
        paginationInfo.totalPages = Math.ceil(data.length / paginationInfo.limit)
    }

    return {
        ...result,
        pagination: paginationInfo,
        hasNextPage: paginationInfo.page < paginationInfo.totalPages,
        hasPrevPage: paginationInfo.page > 1,
        startItem: (paginationInfo.page - 1) * paginationInfo.limit + 1,
        endItem: Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)
    }
}

/**
 * Handle API response with automatic error handling
 */
export const handleApiResponse = async (apiCall, options = {}) => {
    const {
        showLoading = false,
        loadingMessage = 'Đang xử lý...',
        showSuccessToast = false,
        successMessage,
        showErrorToast = true,
        errorMessage,
        onSuccess,
        onError,
        transform,
        context = 'API Call'
    } = options

    let loadingToast = null

    try {
        // Show loading toast if requested
        if (showLoading) {
            loadingToast = toast.loading(loadingMessage)
        }

        // Execute API call
        const response = await apiCall()

        // Dismiss loading toast
        if (loadingToast) {
            toast.dismiss(loadingToast)
        }

        // Handle successful response
        return handleSuccessResponse(response, {
            showSuccessToast,
            successMessage,
            onSuccess,
            transform
        })

    } catch (error) {
        // Dismiss loading toast
        if (loadingToast) {
            toast.dismiss(loadingToast)
        }

        // Handle error
        const parsedError = handleError(error, {
            showToast: showErrorToast,
            customMessage: errorMessage,
            onError,
            context
        })

        return {
            error: parsedError,
            success: false,
            data: null
        }
    }
}

/**
 * Handle mutation response (for create/update/delete operations)
 */
export const handleMutationResponse = async (mutationCall, options = {}) => {
    const {
        showLoading = true,
        loadingMessage,
        showSuccessToast = true,
        successMessage,
        showErrorToast = true,
        errorMessage,
        onSuccess,
        onError,
        context
    } = options

    // Determine default messages based on context
    let defaultLoadingMessage = 'Đang xử lý...'
    let defaultSuccessMessage = 'Thao tác thành công'

    if (context) {
        switch (context.toLowerCase()) {
            case 'create':
                defaultLoadingMessage = 'Đang tạo...'
                defaultSuccessMessage = 'Tạo thành công'
                break
            case 'update':
                defaultLoadingMessage = 'Đang cập nhật...'
                defaultSuccessMessage = 'Cập nhật thành công'
                break
            case 'delete':
                defaultLoadingMessage = 'Đang xóa...'
                defaultSuccessMessage = 'Xóa thành công'
                break
            case 'upload':
                defaultLoadingMessage = 'Đang tải lên...'
                defaultSuccessMessage = 'Tải lên thành công'
                break
            case 'download':
                defaultLoadingMessage = 'Đang tải xuống...'
                defaultSuccessMessage = 'Tải xuống thành công'
                break
            case 'import':
                defaultLoadingMessage = 'Đang import...'
                defaultSuccessMessage = 'Import thành công'
                break
            case 'export':
                defaultLoadingMessage = 'Đang export...'
                defaultSuccessMessage = 'Export thành công'
                break
        }
    }

    return handleApiResponse(mutationCall, {
        showLoading,
        loadingMessage: loadingMessage || defaultLoadingMessage,
        showSuccessToast,
        successMessage: successMessage || defaultSuccessMessage,
        showErrorToast,
        errorMessage,
        onSuccess,
        onError,
        context: context || 'Mutation'
    })
}

/**
 * Handle form submission response
 */
export const handleFormResponse = async (submitCall, options = {}) => {
    const {
        form,
        resetOnSuccess = false,
        closeOnSuccess = false,
        onClose,
        ...restOptions
    } = options

    const result = await handleMutationResponse(submitCall, {
        ...restOptions,
        onSuccess: (data, meta) => {
            // Reset form if requested
            if (resetOnSuccess && form && form.resetFields) {
                form.resetFields()
            }

            // Close form/modal if requested
            if (closeOnSuccess && onClose) {
                onClose()
            }

            // Call custom success handler
            if (restOptions.onSuccess) {
                restOptions.onSuccess(data, meta)
            }
        },
        onError: (error) => {
            // Handle validation errors for form
            if (form && error.type === 'VALIDATION_ERROR' && error.details) {
                const formErrors = []

                if (typeof error.details === 'object') {
                    Object.keys(error.details).forEach(field => {
                        const fieldError = error.details[field]
                        formErrors.push({
                            name: field,
                            errors: Array.isArray(fieldError) ? fieldError : [fieldError]
                        })
                    })

                    if (form.setFields && formErrors.length > 0) {
                        form.setFields(formErrors)
                    }
                }
            }

            // Call custom error handler
            if (restOptions.onError) {
                restOptions.onError(error)
            }
        }
    })

    return result
}

/**
 * Handle file download response
 */
export const handleDownloadResponse = async (downloadCall, filename, options = {}) => {
    const {
        showLoading = true,
        onSuccess,
        onError
    } = options

    try {
        if (showLoading) {
            const loadingToast = toast.loading('Đang tải xuống...')
        }

        const response = await downloadCall()

        if (showLoading) {
            toast.dismiss()
        }

        // Create blob and download
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename || 'file')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.success('Tải xuống thành công')

        if (onSuccess) {
            onSuccess()
        }

        return { success: true }

    } catch (error) {
        if (showLoading) {
            toast.dismiss()
        }

        handleError(error, {
            context: 'Download',
            onError
        })

        return { success: false, error }
    }
}

/**
 * Handle file upload with progress
 */
export const handleUploadResponse = async (uploadCall, options = {}) => {
    const {
        onProgress,
        onSuccess,
        onError,
        showSuccessToast = true
    } = options

    try {
        const response = await uploadCall({
            onUploadProgress: (progressEvent) => {
                const progress = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                )
                if (onProgress) {
                    onProgress(progress)
                }
            }
        })

        const result = handleSuccessResponse(response, {
            showSuccessToast,
            successMessage: 'Tải lên thành công',
            onSuccess
        })

        return result

    } catch (error) {
        handleError(error, {
            context: 'Upload',
            onError
        })

        return { success: false, error }
    }
}

/**
 * Handle batch/bulk operations
 */
export const handleBatchResponse = async (batchCall, options = {}) => {
    const {
        itemName = 'items',
        showProgress = true,
        onProgress,
        onSuccess,
        onError
    } = options

    let progressToast = null

    try {
        if (showProgress) {
            progressToast = toast.loading(`Đang xử lý ${itemName}...`)
        }

        const response = await batchCall({
            onProgress: (current, total) => {
                if (progressToast && showProgress) {
                    toast.loading(`Đang xử lý ${itemName}... (${current}/${total})`, {
                        id: progressToast
                    })
                }
                if (onProgress) {
                    onProgress(current, total)
                }
            }
        })

        if (progressToast) {
            toast.dismiss(progressToast)
        }

        const result = handleSuccessResponse(response, {
            showSuccessToast: true,
            successMessage: `Xử lý ${itemName} thành công`,
            onSuccess
        })

        return result

    } catch (error) {
        if (progressToast) {
            toast.dismiss(progressToast)
        }

        handleError(error, {
            context: 'Batch Operation',
            onError
        })

        return { success: false, error }
    }
}

/**
 * Response transformer utilities
 */
export const responseTransformers = {
    // Transform paginated list response
    paginatedList: (response) => {
        const { data, pagination } = response
        return {
            items: Array.isArray(data) ? data : [],
            pagination: pagination || {}
        }
    },

    // Transform single item response
    singleItem: (response) => {
        return response.data || null
    },

    // Transform statistics response
    statistics: (response) => {
        const data = response.data || {}
        return {
            ...data,
            formattedData: Object.keys(data).reduce((acc, key) => {
                const value = data[key]
                if (typeof value === 'number') {
                    acc[key] = {
                        raw: value,
                        formatted: new Intl.NumberFormat('vi-VN').format(value)
                    }
                } else {
                    acc[key] = value
                }
                return acc
            }, {})
        }
    },

    // Transform tree structure response
    tree: (response) => {
        const data = response.data || {}
        return {
            tree: data,
            flatList: flattenTree(data),
            nodeCount: countTreeNodes(data)
        }
    }
}

/**
 * Helper functions
 */
const flattenTree = (tree, parent = null) => {
    const result = []

    Object.keys(tree).forEach(key => {
        const node = tree[key]
        result.push({
            id: key,
            parent,
            ...node
        })

        if (node.children && typeof node.children === 'object') {
            result.push(...flattenTree(node.children, key))
        }
    })

    return result
}

const countTreeNodes = (tree) => {
    let count = 0

    Object.keys(tree).forEach(key => {
        count++
        const node = tree[key]
        if (node.children && typeof node.children === 'object') {
            count += countTreeNodes(node.children)
        }
    })

    return count
}

export default {
    handleSuccessResponse,
    handlePaginatedResponse,
    handleApiResponse,
    handleMutationResponse,
    handleFormResponse,
    handleDownloadResponse,
    handleUploadResponse,
    handleBatchResponse,
    responseTransformers
}