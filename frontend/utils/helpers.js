// Date utilities
export const formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date) return ''

    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    switch (format) {
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`
        case 'DD/MM/YYYY HH:mm':
            return `${day}/${month}/${year} ${hours}:${minutes}`
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`
        default:
            return d.toLocaleDateString('vi-VN')
    }
}

export const getRelativeTime = (date) => {
    if (!date) return ''

    const now = new Date()
    const diff = now - new Date(date)
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`

    return formatDate(date)
}

// String utilities
export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

export const capitalizeFirstLetter = (string) => {
    if (!string) return ''
    return string.charAt(0).toUpperCase() + string.slice(1)
}

export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
}

// Number utilities
export const formatNumber = (number) => {
    if (number == null) return '0'
    return new Intl.NumberFormat('vi-VN').format(number)
}

export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Array utilities
export const groupBy = (array, key) => {
    return array.reduce((result, currentValue) => {
        const groupKey = currentValue[key]
        if (!result[groupKey]) {
            result[groupKey] = []
        }
        result[groupKey].push(currentValue)
        return result
    }, {})
}

export const sortBy = (array, key, order = 'asc') => {
    return array.sort((a, b) => {
        const valueA = a[key]
        const valueB = b[key]

        if (order === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0
        }
    })
}

export const removeDuplicates = (array, key = null) => {
    if (!key) {
        return [...new Set(array)]
    }

    const seen = new Set()
    return array.filter(item => {
        const keyValue = item[key]
        if (seen.has(keyValue)) {
            return false
        }
        seen.add(keyValue)
        return true
    })
}

// Object utilities
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => deepClone(item))
    if (typeof obj === 'object') {
        const clonedObj = {}
        for (const key in obj) {
            clonedObj[key] = deepClone(obj[key])
        }
        return clonedObj
    }
}

export const omit = (obj, keys) => {
    const result = { ...obj }
    keys.forEach(key => delete result[key])
    return result
}

export const pick = (obj, keys) => {
    const result = {}
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key]
        }
    })
    return result
}

// URL utilities
export const buildQueryString = (params) => {
    const queryString = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            queryString.append(key, value)
        }
    })

    return queryString.toString()
}

export const parseQueryString = (queryString) => {
    const params = new URLSearchParams(queryString)
    const result = {}

    for (const [key, value] of params.entries()) {
        result[key] = value
    }

    return result
}

// File utilities
export const getFileExtension = (filename) => {
    if (!filename) return ''
    return filename.split('.').pop().toLowerCase()
}

export const getFileIcon = (filename) => {
    const extension = getFileExtension(filename)

    switch (extension) {
        case 'pdf':
            return 'FileText'
        case 'doc':
        case 'docx':
            return 'FileText'
        case 'xls':
        case 'xlsx':
            return 'FileSpreadsheet'
        case 'ppt':
        case 'pptx':
            return 'FileBarChart'
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return 'Image'
        case 'zip':
        case 'rar':
        case '7z':
            return 'Archive'
        default:
            return 'File'
    }
}

// Validation utilities
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/
    return phoneRegex.test(phone)
}

export const isValidPassword = (password) => {
    return password && password.length >= 6
}

export const isValidEvidenceCode = (code) => {
    const codeRegex = /^H\d+\.\d+\.\d+\.\d+$/
    return codeRegex.test(code)
}

// DOM utilities
export const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

export const scrollToElement = (elementId) => {
    const element = document.getElementById(elementId)
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
    }
}

export const getLocalStorage = (key, defaultValue = null) => {
    if (typeof window === 'undefined') return defaultValue

    try {
        const item = window.localStorage.getItem(key)
        if (!item) return defaultValue

        try {
            return JSON.parse(item)
        } catch {
            return item
        }
    } catch (error) {
        console.error(`Error getting localStorage key "${key}":`, error)
        return defaultValue
    }
}


export const setLocalStorage = (key, value) => {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
    }
}

export const removeLocalStorage = (key) => {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.removeItem(key)
    } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error)
    }
}

// Color utilities
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

export const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// Debounce utility
export const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// Throttle utility
export const throttle = (func, limit) => {
    let inThrottle
    return function() {
        const args = arguments
        const context = this
        if (!inThrottle) {
            func.apply(context, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

// Generate random string
export const generateRandomString = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

// Generate UUID
export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

// Error handling utilities
export const getErrorMessage = (error) => {
    if (typeof error === 'string') return error
    if (error?.response?.data?.message) return error.response.data.message
    if (error?.message) return error.message
    return 'Có lỗi xảy ra'
}

export const isNetworkError = (error) => {
    return !error.response && error.request
}

// Evidence code utilities
export const generateEvidenceCode = (boxNumber, standardCode, criteriaCode, sequence) => {
    return `H${boxNumber}.${standardCode.padStart(2, '0')}.${criteriaCode.padStart(2, '0')}.${sequence.toString().padStart(2, '0')}`
}

export const parseEvidenceCode = (code) => {
    const match = code.match(/^H(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (!match) return null

    return {
        boxNumber: parseInt(match[1]),
        standardCode: parseInt(match[2]),
        criteriaCode: parseInt(match[3]),
        sequence: parseInt(match[4])
    }
}

// Export utilities
export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

export const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header]
                return typeof value === 'string' && value.includes(',')
                    ? `"${value}"`
                    : value
            }).join(',')
        )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, filename)
}

// ===============================================
// ADDITIONAL UTILITIES - Bổ sung các hàm mới
// ===============================================

// Additional Date utilities
export const formatDateTime = (date) => {
    return formatDate(date, 'DD/MM/YYYY HH:mm')
}

export const formatDateTimeFull = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

// Additional Number utilities
export const formatCurrency = (amount, currency = 'VND') => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0'

    const formatted = Number(amount).toLocaleString('vi-VN')

    switch (currency) {
        case 'VND':
            return `${formatted} ₫`
        case 'USD':
            return `$${formatted}`
        case 'EUR':
            return `€${formatted}`
        default:
            return formatted
    }
}

export const formatPercent = (value, decimals = 0) => {
    if (value === null || value === undefined || isNaN(value)) return '0%'
    return `${formatNumber(value)}%`
}

// Additional Validation utilities
export const isURL = (url) => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

export const isEmpty = (value) => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
}

// Copy to clipboard utility
export const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text)
            return true
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea')
            textarea.value = text
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
            return true
        }
    } catch (error) {
        console.error('Copy to clipboard failed:', error)
        return false
    }
}

// Download file utility (alternative to downloadBlob)
export const downloadFile = (data, filename, mimeType = 'text/plain') => {
    const blob = new Blob([data], { type: mimeType })
    downloadBlob(blob, filename)
}

// Status utilities
export const getStatusColor = (status) => {
    const colors = {
        // General statuses
        draft: 'bg-gray-100 text-gray-700',
        pending: 'bg-yellow-100 text-yellow-700',
        active: 'bg-green-100 text-green-700',
        inactive: 'bg-red-100 text-red-700',
        archived: 'bg-gray-100 text-gray-500',
        completed: 'bg-blue-100 text-blue-700',
        cancelled: 'bg-red-100 text-red-700',
        suspended: 'bg-yellow-100 text-yellow-700',

        // Assignment statuses
        accepted: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        in_progress: 'bg-blue-100 text-blue-700',
        overdue: 'bg-red-100 text-red-700',

        // Evaluation statuses
        submitted: 'bg-blue-100 text-blue-700',
        reviewed: 'bg-green-100 text-green-700',
        final: 'bg-purple-100 text-purple-700',
        under_review: 'bg-yellow-100 text-yellow-700',
        published: 'bg-green-100 text-green-700',

        // Notification statuses
        sent: 'bg-blue-100 text-blue-700',
        delivered: 'bg-green-100 text-green-700',
        read: 'bg-gray-100 text-gray-700',
        clicked: 'bg-blue-100 text-blue-700',
        dismissed: 'bg-gray-100 text-gray-500',

        // Default
        default: 'bg-gray-100 text-gray-700'
    }

    return colors[status] || colors.default
}

export const getStatusBadge = (status, label) => {
    const color = getStatusColor(status)
    return `<span class="px-2 py-1 text-xs font-semibold rounded-full ${color}">${label}</span>`
}

// Additional Color utility
export const randomColor = () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}