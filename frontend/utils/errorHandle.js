import toast from 'react-hot-toast'

// Error types
export const ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    AUTHORIZATION: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND_ERROR',
    SERVER: 'SERVER_ERROR',
    BUSINESS_LOGIC: 'BUSINESS_LOGIC_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
}

// Error severity levels
export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
}

// Standard error messages (phù hợp với backend response)
export const ERROR_MESSAGES = {
    NETWORK: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
    SERVER: 'Có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau.',
    AUTHENTICATION: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    AUTHORIZATION: 'Bạn không có quyền thực hiện hành động này.',
    NOT_FOUND: 'Không tìm thấy dữ liệu yêu cầu.',
    VALIDATION: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
    BUSINESS_LOGIC: 'Không thể thực hiện thao tác này.',
    UNKNOWN: 'Có lỗi không xác định xảy ra.',
    FILE_TOO_LARGE: 'File quá lớn. Vui lòng chọn file nhỏ hơn.',
    FILE_TYPE_NOT_SUPPORTED: 'Loại file không được hỗ trợ.',
    DUPLICATE_DATA: 'Dữ liệu đã tồn tại trong hệ thống.',
    INVALID_CREDENTIALS: 'Thông tin đăng nhập không chính xác.',
    TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn.',
    CANNOT_DELETE_IN_USE: 'Không thể xóa dữ liệu đang được sử dụng.',
    IMPORT_FAILED: 'Import dữ liệu thất bại.',
    EXPORT_FAILED: 'Export dữ liệu thất bại.'
}

/**
 * Parse error from API response
 */
export const parseError = (error) => {
    if (!error) {
        return {
            type: ERROR_TYPES.UNKNOWN,
            message: ERROR_MESSAGES.UNKNOWN,
            details: null,
            statusCode: null,
            severity: ERROR_SEVERITY.LOW
        }
    }

    // Network error (no response)
    if (!error.response) {
        return {
            type: ERROR_TYPES.NETWORK,
            message: ERROR_MESSAGES.NETWORK,
            details: error.message,
            statusCode: null,
            severity: ERROR_SEVERITY.HIGH
        }
    }

    const {status, data} = error.response
    let errorType = ERROR_TYPES.UNKNOWN
    let message = ERROR_MESSAGES.UNKNOWN
    let severity = ERROR_SEVERITY.MEDIUM

    // Determine error type based on status code
    switch (status) {
        case 400:
            errorType = ERROR_TYPES.VALIDATION
            message = data?.message || ERROR_MESSAGES.VALIDATION
            severity = ERROR_SEVERITY.LOW
            break
        case 401:
            errorType = ERROR_TYPES.AUTHENTICATION
            message = data?.message || ERROR_MESSAGES.AUTHENTICATION
            severity = ERROR_SEVERITY.HIGH
            break
        case 403:
            errorType = ERROR_TYPES.AUTHORIZATION
            message = data?.message || ERROR_MESSAGES.AUTHORIZATION
            severity = ERROR_SEVERITY.MEDIUM
            break
        case 404:
            errorType = ERROR_TYPES.NOT_FOUND
            message = data?.message || ERROR_MESSAGES.NOT_FOUND
            severity = ERROR_SEVERITY.LOW
            break
        case 409:
            errorType = ERROR_TYPES.BUSINESS_LOGIC
            message = data?.message || ERROR_MESSAGES.DUPLICATE_DATA
            severity = ERROR_SEVERITY.MEDIUM
            break
        case 422:
            errorType = ERROR_TYPES.VALIDATION
            message = data?.message || ERROR_MESSAGES.VALIDATION
            severity = ERROR_SEVERITY.LOW
            break
        case 429:
            errorType = ERROR_TYPES.BUSINESS_LOGIC
            message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
            severity = ERROR_SEVERITY.MEDIUM
            break
        case 500:
        case 502:
        case 503:
        case 504:
            errorType = ERROR_TYPES.SERVER
            message = ERROR_MESSAGES.SERVER
            severity = ERROR_SEVERITY.CRITICAL
            break
        default:
            errorType = ERROR_TYPES.UNKNOWN
            message = data?.message || ERROR_MESSAGES.UNKNOWN
            severity = ERROR_SEVERITY.MEDIUM
    }

    return {
        type: errorType,
        message,
        details: data?.details || data?.errors || error.message,
        statusCode: status,
        severity,
        originalError: error,
        timestamp: new Date().toISOString()
    }
}

/**
 * Handle error with appropriate action
 */
export const handleError = (error, options = {}) => {
    const {
        showToast = true,
        showConsoleError = true,
        onError,
        customMessage,
        context = 'Unknown'
    } = options

    const parsedError = parseError(error)

    // Log to console in development
    if (showConsoleError && process.env.NODE_ENV !== 'production') {
        console.error(`[${context}] Error:`, {
            ...parsedError,
            originalError: error
        })
    }

    // Show toast notification
    if (showToast) {
        const message = customMessage || parsedError.message

        switch (parsedError.severity) {
            case ERROR_SEVERITY.LOW:
                toast.error(message, {duration: 3000})
                break
            case ERROR_SEVERITY.MEDIUM:
                toast.error(message, {duration: 4000})
                break
            case ERROR_SEVERITY.HIGH:
            case ERROR_SEVERITY.CRITICAL:
                toast.error(message, {duration: 6000})
                break
            default:
                toast.error(message)
        }
    }

    // Call custom error handler if provided
    if (onError && typeof onError === 'function') {
        onError(parsedError, error)
    }

    return parsedError
}

/**
 * Handle validation errors specifically
 */
export const handleValidationError = (error, formRef = null) => {
    const parsedError = parseError(error)

    if (parsedError.type === ERROR_TYPES.VALIDATION && parsedError.details) {
        const validationErrors = {}

        // Backend trả về validation errors dưới dạng object
        if (typeof parsedError.details === 'object') {
            Object.keys(parsedError.details).forEach(field => {
                const fieldError = parsedError.details[field]
                validationErrors[field] = Array.isArray(fieldError) ? fieldError[0] : fieldError
            })
        }

        // Set errors to form if form reference provided
        if (formRef && formRef.current && formRef.current.setFields) {
            const formFields = Object.keys(validationErrors).map(field => ({
                name: field,
                errors: [validationErrors[field]]
            }))
            formRef.current.setFields(formFields)
        }

        return validationErrors
    }

    // Show general error message for non-validation errors
    handleError(error, {context: 'Validation'})
    return {}
}

/**
 * Create error handler for specific contexts
 */
export const createErrorHandler = (context, defaultOptions = {}) => {
    return (error, options = {}) => {
        const mergedOptions = {
            context,
            ...defaultOptions,
            ...options
        }
        return handleError(error, mergedOptions)
    }
}

/**
 * Specific error handlers for different entities
 */
export const errorHandlers = {
    auth: createErrorHandler('Authentication', {
        showToast: true,
        showConsoleError: true
    }),

    academicYear: createErrorHandler('Academic Year', {
        showToast: true
    }),

    user: createErrorHandler('User Management', {
        showToast: true
    }),

    evidence: createErrorHandler('Evidence Management', {
        showToast: true
    }),

    program: createErrorHandler('Program Management', {
        showToast: true
    }),

    organization: createErrorHandler('Organization Management', {
        showToast: true
    }),

    standard: createErrorHandler('Standard Management', {
        showToast: true
    }),

    criteria: createErrorHandler('Criteria Management', {
        showToast: true
    }),

    file: createErrorHandler('File Management', {
        showToast: true
    }),

    report: createErrorHandler('Report Management', {
        showToast: true
    }),

    assignment: createErrorHandler('Assignment Management', {
        showToast: true
    }),

    evaluation: createErrorHandler('Evaluation Management', {
        showToast: true
    }),

    notification: createErrorHandler('Notification', {
        showToast: false, // Notifications usually don't need toast
        showConsoleError: false
    }),

    system: createErrorHandler('System', {
        showToast: true,
        severity: ERROR_SEVERITY.HIGH
    })
}

/**
 * Check if error is recoverable
 */
export const isRecoverableError = (error) => {
    const parsedError = parseError(error)

    const recoverableTypes = [
        ERROR_TYPES.VALIDATION,
        ERROR_TYPES.BUSINESS_LOGIC,
        ERROR_TYPES.NOT_FOUND
    ]

    const recoverableStatusCodes = [400, 404, 409, 422, 429]

    return recoverableTypes.includes(parsedError.type) ||
        recoverableStatusCodes.includes(parsedError.statusCode)
}

/**
 * Should retry request
 */
export const shouldRetryRequest = (error, retryCount = 0, maxRetries = 3) => {
    if (retryCount >= maxRetries) return false

    const parsedError = parseError(error)

    // Retry for network errors and server errors
    const retryableTypes = [ERROR_TYPES.NETWORK, ERROR_TYPES.SERVER]
    const retryableStatusCodes = [500, 502, 503, 504, 429]

    return retryableTypes.includes(parsedError.type) ||
        retryableStatusCodes.includes(parsedError.statusCode)
}

/**
 * Get retry delay with exponential backoff
 */
export const getRetryDelay = (retryCount, baseDelay = 1000, maxDelay = 10000) => {
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay)

    // Add random jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay

    return delay + jitter
}

/**
 * Format error for display
 */
export const formatErrorForDisplay = (error, includeDetails = false) => {
    const parsedError = parseError(error)

    let formatted = {
        title: 'Lỗi',
        message: parsedError.message,
        type: parsedError.type,
        severity: parsedError.severity
    }

    if (includeDetails && parsedError.details) {
        formatted.details = parsedError.details
    }

    // Add user-friendly titles based on error type
    switch (parsedError.type) {
        case ERROR_TYPES.NETWORK:
            formatted.title = 'Lỗi kết nối'
            break
        case ERROR_TYPES.VALIDATION:
            formatted.title = 'Dữ liệu không hợp lệ'
            break
        case ERROR_TYPES.AUTHENTICATION:
            formatted.title = 'Lỗi xác thực'
            break
        case ERROR_TYPES.AUTHORIZATION:
            formatted.title = 'Không có quyền'
            break
        case ERROR_TYPES.NOT_FOUND:
            formatted.title = 'Không tìm thấy'
            break
        case ERROR_TYPES.SERVER:
            formatted.title = 'Lỗi máy chủ'
            break
        case ERROR_TYPES.BUSINESS_LOGIC:
            formatted.title = 'Lỗi nghiệp vụ'
            break
    }

    return formatted
}

/**
 * Global error boundary helper
 */
export const logError = (error, errorInfo = {}) => {
    const parsedError = parseError(error)

    // Log to console
    console.error('Global Error:', {
        ...parsedError,
        errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
    })

    // In production, could send to error tracking service
    if (process.env.NODE_ENV === 'production') {
        // Example: Send to error tracking service
        // errorTrackingService.captureException(error, {
        //     extra: { ...parsedError, errorInfo }
        // })
    }
}

export default {
    parseError,
    handleError,
    handleValidationError,
    createErrorHandler,
    errorHandlers,
    isRecoverableError,
    shouldRetryRequest,
    getRetryDelay,
    formatErrorForDisplay,
    logError,
    ERROR_TYPES,
    ERROR_SEVERITY,
    ERROR_MESSAGES
}