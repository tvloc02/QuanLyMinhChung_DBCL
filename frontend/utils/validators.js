import { VALIDATION_RULES, SUPPORTED_FILE_TYPES } from './constants'

// Basic validation utilities
export const isEmpty = (value) => {
    if (value == null) return true
    if (typeof value === 'string') return value.trim().length === 0
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
}

export const isNotEmpty = (value) => !isEmpty(value)

// String validation
export const isString = (value) => typeof value === 'string'

export const hasMinLength = (value, minLength) => {
    return isString(value) && value.length >= minLength
}

export const hasMaxLength = (value, maxLength) => {
    return isString(value) && value.length <= maxLength
}

export const isLength = (value, min, max) => {
    if (!isString(value)) return false
    return value.length >= min && value.length <= max
}

export const matches = (value, pattern) => {
    if (!isString(value)) return false
    if (typeof pattern === 'string') {
        return value.includes(pattern)
    }
    if (pattern instanceof RegExp) {
        return pattern.test(value)
    }
    return false
}

// Email validation
export const isEmail = (email) => {
    if (!isString(email)) return false
    return VALIDATION_RULES.EMAIL.test(email.trim().toLowerCase())
}
// Phone validation
export const isPhone = (phone) => {
    if (!isString(phone)) return false
    const cleaned = phone.replace(/\D/g, '')
    return VALIDATION_RULES.PHONE.test(cleaned)
}

export const isValidPhone = (phone) => isPhone(phone)

// Number validation
export const isNumber = (value) => {
    return typeof value === 'number' && !isNaN(value)
}
export const isNegative = (value) => {
    return isNumber(value) && value < 0
}

export const isZero = (value) => {
    return isNumber(value) && value === 0
}

export const isInRange = (value, min, max) => {
    return isNumber(value) && value >= min && value <= max
}

export const isMin = (value, min) => {
    return isNumber(value) && value >= min
}

export const isMax = (value, max) => {
    return isNumber(value) && value <= max
}

// Date validation
export const isDate = (value) => {
    return value instanceof Date && !isNaN(value.getTime())
}

export const isValidDate = (dateString) => {
    if (!dateString) return false
    const date = new Date(dateString)
    return isDate(date)
}

export const isAfter = (date, compareDate) => {
    const d1 = new Date(date)
    const d2 = new Date(compareDate)
    return isDate(d1) && isDate(d2) && d1 > d2
}

export const isBefore = (date, compareDate) => {
    const d1 = new Date(date)
    const d2 = new Date(compareDate)
    return isDate(d1) && isDate(d2) && d1 < d2
}

export const isToday = (date) => {
    const d = new Date(date)
    const today = new Date()
    return isDate(d) &&
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
}

export const isFutureDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    return isDate(d) && d > now
}

export const isPastDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    return isDate(d) && d < now
}

// URL validation
export const isUrl = (url) => {
    if (!isString(url)) return false
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

export const isValidUrl = (url) => isUrl(url)

export const isHttpUrl = (url) => {
    if (!isUrl(url)) return false
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
}

// Password validation
export const isValidPassword = (password) => {
    if (!isString(password)) return false
    return password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH
}

export const isStrongPassword = (password) => {
    if (!isString(password)) return false

    const minLength = password.length >= 8
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return minLength && hasLower && hasUpper && hasNumber && hasSpecial
}

export const getPasswordStrength = (password) => {
    if (!isString(password)) return { score: 0, feedback: [] }

    let score = 0
    const feedback = []

    if (password.length < 6) {
        feedback.push('Mật khẩu quá ngắn (tối thiểu 6 ký tự)')
    } else if (password.length < 8) {
        score += 1
        feedback.push('Nên sử dụng ít nhất 8 ký tự')
    } else {
        score += 2
    }

    if (!/[a-z]/.test(password)) {
        feedback.push('Nên có ít nhất một chữ cái thường')
    } else {
        score += 1
    }

    if (!/[A-Z]/.test(password)) {
        feedback.push('Nên có ít nhất một chữ cái hoa')
    } else {
        score += 1
    }

    if (!/\d/.test(password)) {
        feedback.push('Nên có ít nhất một chữ số')
    } else {
        score += 1
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        feedback.push('Nên có ít nhất một ký tự đặc biệt')
    } else {
        score += 1
    }

    return { score, feedback }
}

// File validation
export const isValidFileType = (file, allowedTypes = []) => {
    if (!file || !file.type) return false
    if (allowedTypes.length === 0) return true

    return allowedTypes.some(type => {
        if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        if (type.includes('*')) {
            const baseType = type.split('/')[0]
            return file.type.startsWith(baseType)
        }
        return file.type === type
    })
}

export const isValidFileSize = (file, maxSize = VALIDATION_RULES.FILE_MAX_SIZE) => {
    return file && file.size <= maxSize
}

export const isImageFile = (file) => {
    return file && file.type.startsWith('image/')
}

export const isDocumentFile = (file) => {
    if (!file) return false
    return SUPPORTED_FILE_TYPES.DOCUMENTS.includes(file.type)
}

export const isArchiveFile = (file) => {
    if (!file) return false
    return SUPPORTED_FILE_TYPES.ARCHIVES.includes(file.type)
}

// Code validation
export const isValidEvidenceCode = (code) => {
    if (!isString(code)) return false
    return VALIDATION_RULES.CODE_PATTERN.test(code)
}

export const isValidCode = (code, pattern = /^[A-Z0-9.-]+$/) => {
    if (!isString(code)) return false
    return pattern.test(code)
}

// Array validation
export const isArray = (value) => Array.isArray(value)

export const hasMinItems = (array, min) => {
    return isArray(array) && array.length >= min
}

export const hasMaxItems = (array, max) => {
    return isArray(array) && array.length <= max
}

export const isUniqueArray = (array) => {
    if (!isArray(array)) return false
    return new Set(array).size === array.length
}

// Object validation
export const isObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export const hasProperty = (obj, property) => {
    return isObject(obj) && Object.prototype.hasOwnProperty.call(obj, property)
}

export const hasRequiredProperties = (obj, properties) => {
    if (!isObject(obj)) return false
    return properties.every(prop => hasProperty(obj, prop))
}

// Custom validation functions
export const isValidJson = (str) => {
    try {
        JSON.parse(str)
        return true
    } catch {
        return false
    }
}

export const isAlphanumeric = (value) => {
    return isString(value) && /^[a-zA-Z0-9]+$/.test(value)
}

export const isAlpha = (value) => {
    return isString(value) && /^[a-zA-Z]+$/.test(value)
}

export const isNumeric = (value) => {
    return isString(value) && /^[0-9]+$/.test(value)
}

export const isHexColor = (value) => {
    return isString(value) && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)
}

export const isCreditCard = (value) => {
    if (!isString(value)) return false
    const cleaned = value.replace(/\s/g, '')
    return /^[0-9]{13,19}$/.test(cleaned)
}

// Vietnamese specific validation
export const isVietnamesePhoneNumber = (phone) => {
    if (!isString(phone)) return false
    const cleaned = phone.replace(/\D/g, '')

    // Mobile: 0 + 9xx xxx xxx hoặc 0 + 3xx xxx xxx hoặc 0 + 7xx xxx xxx hoặc 0 + 8xx xxx xxx hoặc 0 + 5xx xxx xxx
    // Landline: 0 + area code (2-3 digits) + number (7-8 digits)
    return /^0(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/.test(cleaned) || // Mobile
        /^0[2-8][0-9]{8,9}$/.test(cleaned) // Landline
}

export const isVietnameseIdCard = (id) => {
    if (!isString(id)) return false
    const cleaned = id.replace(/\s/g, '')

    // Old format: 9 digits
    // New format: 12 digits
    return /^[0-9]{9}$/.test(cleaned) || /^[0-9]{12}$/.test(cleaned)
}

// Validation composer
export const createValidator = (rules) => {
    return (value) => {
        const errors = []

        for (const rule of rules) {
            const { validator, message, condition } = rule

            // Skip validation if condition is not met
            if (condition && !condition(value)) continue

            if (typeof validator === 'function') {
                if (!validator(value)) {
                    errors.push(message || 'Validation failed')
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }
}

// Form validation helpers
export const validateField = (value, rules) => {
    const errors = []

    for (const rule of rules) {
        const { type, params = {}, message } = rule
        let isValid = true

        switch (type) {
            case 'required':
                isValid = isNotEmpty(value)
                break
            case 'email':
                if (isNotEmpty(value)) isValid = isEmail(value)
                break
            case 'phone':
                if (isNotEmpty(value)) isValid = isPhone(value)
                break
            case 'minLength':
                if (isNotEmpty(value)) isValid = hasMinLength(value, params.min)
                break
            case 'maxLength':
                if (isNotEmpty(value)) isValid = hasMaxLength(value, params.max)
                break
            case 'pattern':
                if (isNotEmpty(value)) isValid = matches(value, params.pattern)
                break
            case 'min':
                if (isNotEmpty(value)) isValid = isMin(Number(value), params.min)
                break
            case 'max':
                if (isNotEmpty(value)) isValid = isMax(Number(value), params.max)
                break
            case 'url':
                if (isNotEmpty(value)) isValid = isUrl(value)
                break
            case 'custom':
                if (typeof params.validator === 'function') {
                    isValid = params.validator(value)
                }
                break
            default:
                isValid = true
        }

        if (!isValid) {
            errors.push(message || `Validation failed for ${type}`)
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export const validateForm = (formData, schema) => {
    const errors = {}
    let isValid = true

    for (const [fieldName, rules] of Object.entries(schema)) {
        const fieldValue = formData[fieldName]
        const fieldValidation = validateField(fieldValue, rules)

        if (!fieldValidation.isValid) {
            errors[fieldName] = fieldValidation.errors
            isValid = false
        }
    }

    return {
        isValid,
        errors
    }
}

// Pre-defined validation rules
export const commonRules = {
    required: {
        type: 'required',
        message: 'Trường này không được để trống'
    },
    email: {
        type: 'email',
        message: 'Email không hợp lệ'
    },
    phone: {
        type: 'phone',
        message: 'Số điện thoại không hợp lệ'
    },
    url: {
        type: 'url',
        message: 'URL không hợp lệ'
    },
    minLength: (min) => ({
        type: 'minLength',
        params: { min },
        message: `Tối thiểu ${min} ký tự`
    }),
    maxLength: (max) => ({
        type: 'maxLength',
        params: { max },
        message: `Tối đa ${max} ký tự`
    }),
    pattern: (pattern, message) => ({
        type: 'pattern',
        params: { pattern },
        message: message || 'Định dạng không hợp lệ'
    })
}

// Evidence specific validation
export const evidenceValidation = {
    code: [
        commonRules.required,
        commonRules.pattern(VALIDATION_RULES.CODE_PATTERN, 'Mã minh chứng không đúng định dạng')
    ],
    name: [
        commonRules.required,
        commonRules.minLength(3),
        commonRules.maxLength(200)
    ],
    description: [
        commonRules.maxLength(1000)
    ]
}

// User validation
export const userValidation = {
    email: [
        commonRules.required,
        commonRules.email
    ],
    password: [
        commonRules.required,
        commonRules.minLength(VALIDATION_RULES.PASSWORD_MIN_LENGTH)
    ],
    name: [
        commonRules.required,
        commonRules.minLength(2),
        commonRules.maxLength(100)
    ],
    phone: [
        commonRules.phone
    ]
}

export default {
    // Basic validators
    isEmpty,
    isNotEmpty,
    isString,
    isNumber,
    isArray,
    isObject,
    isDate,

    // Specific validators
    isEmail,
    isPhone,
    isUrl,
    isValidPassword,
    isValidEvidenceCode,

    // Form validation
    validateField,
    validateForm,
    createValidator,

    // Pre-defined rules
    commonRules,
    evidenceValidation,
    userValidation
}