const formatDate = (date, format = 'DD/MM/YYYY') => {
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

const getRelativeTime = (date) => {
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
const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

const capitalizeFirstLetter = (string) => {
    if (!string) return ''
    return string.charAt(0).toUpperCase() + string.slice(1)
}

const slugify = (text) => {
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
const formatNumber = (number) => {
    if (number == null) return '0'
    return new Intl.NumberFormat('vi-VN').format(number)
}

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Array utilities
const groupBy = (array, key) => {
    return array.reduce((result, currentValue) => {
        const groupKey = currentValue[key]
        if (!result[groupKey]) {
            result[groupKey] = []
        }
        result[groupKey].push(currentValue)
        return result
    }, {})
}

const sortBy = (array, key, order = 'asc') => {
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

const removeDuplicates = (array, key = null) => {
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
const deepClone = (obj) => {
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

const omit = (obj, keys) => {
    const result = { ...obj }
    keys.forEach(key => delete result[key])
    return result
}

const pick = (obj, keys) => {
    const result = {}
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key]
        }
    })
    return result
}

// URL utilities
const buildQueryString = (params) => {
    const queryString = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            queryString.append(key, value)
        }
    })

    return queryString.toString()
}

const parseQueryString = (queryString) => {
    const params = new URLSearchParams(queryString)
    const result = {}

    for (const [key, value] of params.entries()) {
        result[key] = value
    }

    return result
}

// File utilities
const getFileExtension = (filename) => {
    if (!filename) return ''
    return filename.split('.').pop().toLowerCase()
}

const getFileIcon = (filename) => {
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
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/
    return phoneRegex.test(phone)
}

const isValidPassword = (password) => {
    return password && password.length >= 6
}

const isValidEvidenceCode = (code) => {
    const codeRegex = /^H\d+\.\d+\.\d+\.\d+$/
    return codeRegex.test(code)
}

const isValidAcademicYearCode = (code) => {
    const codeRegex = /^\d{4}-\d{4}$/
    return codeRegex.test(code)
}

// Academic Year utilities
const generateAcademicYearCode = (startYear, endYear) => {
    return `${startYear}-${endYear}`
}

const parseAcademicYearCode = (code) => {
    const match = code.match(/^(\d{4})-(\d{4})$/)
    if (!match) return null

    return {
        startYear: parseInt(match[1]),
        endYear: parseInt(match[2])
    }
}

const getCurrentAcademicYear = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 0-indexed

    // Academic year typically starts in September
    if (currentMonth >= 9) {
        return {
            startYear: currentYear,
            endYear: currentYear + 1,
            code: generateAcademicYearCode(currentYear, currentYear + 1)
        }
    } else {
        return {
            startYear: currentYear - 1,
            endYear: currentYear,
            code: generateAcademicYearCode(currentYear - 1, currentYear)
        }
    }
}

const isAcademicYearActive = (academicYear) => {
    if (!academicYear.startDate || !academicYear.endDate) return false

    const now = new Date()
    return academicYear.startDate <= now && now <= academicYear.endDate
}

const formatAcademicYearDisplay = (academicYear) => {
    if (!academicYear) return ''
    return `${academicYear.name || academicYear.code} (${academicYear.code})`
}

// Error handling utilities
const getErrorMessage = (error) => {
    if (typeof error === 'string') return error
    if (error?.response?.data?.message) return error.response.data.message
    if (error?.message) return error.message
    return 'Có lỗi xảy ra'
}

const isNetworkError = (error) => {
    return !error.response && error.request
}

// Evidence code utilities
const generateEvidenceCode = (boxNumber, standardCode, criteriaCode, sequence) => {
    return `H${boxNumber}.${standardCode.padStart(2, '0')}.${criteriaCode.padStart(2, '0')}.${sequence.toString().padStart(2, '0')}`
}

const parseEvidenceCode = (code) => {
    const match = code.match(/^H(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (!match) return null

    return {
        boxNumber: parseInt(match[1]),
        standardCode: parseInt(match[2]),
        criteriaCode: parseInt(match[3]),
        sequence: parseInt(match[4])
    }
}

// Generate random string
const generateRandomString = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

// Generate UUID
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

// Debounce utility
const debounce = (func, wait) => {
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
const throttle = (func, limit) => {
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

// Status text utilities
const getStatusText = (status, type = 'evidence') => {
    const statusMaps = {
        evidence: {
            'active': 'Đang hoạt động',
            'inactive': 'Ngừng hoạt động',
            'pending': 'Chờ duyệt',
            'archived': 'Lưu trữ'
        },
        academicYear: {
            'draft': 'Bản nháp',
            'active': 'Đang hoạt động',
            'completed': 'Đã hoàn thành',
            'archived': 'Lưu trữ'
        },
        program: {
            'draft': 'Bản nháp',
            'active': 'Đang hoạt động',
            'inactive': 'Ngừng hoạt động',
            'archived': 'Lưu trữ'
        },
        user: {
            'active': 'Hoạt động',
            'inactive': 'Không hoạt động',
            'suspended': 'Tạm khóa'
        }
    }

    return statusMaps[type]?.[status] || status
}

const getRoleText = (role) => {
    const roleMap = {
        'admin': 'Quản trị viên',
        'manager': 'Quản lý',
        'staff': 'Nhân viên'
    }
    return roleMap[role] || role
}

// Export all utilities
module.exports = {
    formatDate,
    getRelativeTime,
    truncateText,
    capitalizeFirstLetter,
    slugify,
    formatNumber,
    formatBytes,
    groupBy,
    sortBy,
    removeDuplicates,
    deepClone,
    omit,
    pick,
    buildQueryString,
    parseQueryString,
    getFileExtension,
    getFileIcon,
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidEvidenceCode,
    isValidAcademicYearCode,
    generateAcademicYearCode,
    parseAcademicYearCode,
    getCurrentAcademicYear,
    isAcademicYearActive,
    formatAcademicYearDisplay,
    getErrorMessage,
    isNetworkError,
    generateEvidenceCode,
    parseEvidenceCode,
    generateRandomString,
    generateUUID,
    debounce,
    throttle,
    getStatusText,
    getRoleText
};