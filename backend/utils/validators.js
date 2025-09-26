import * as yup from 'yup'
import { VALIDATION_RULES } from './constants'

// Common validation schemas
export const loginSchema = yup.object({
    email: yup
        .string()
        .required('Email không được để trống')
        .email('Email không hợp lệ'),
    password: yup
        .string()
        .required('Mật khẩu không được để trống')
        .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Mật khẩu phải có ít nhất ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} ký tự`)
})

export const evidenceSchema = yup.object({
    name: yup
        .string()
        .required('Tên minh chứng không được để trống')
        .max(255, 'Tên minh chứng không được quá 255 ký tự'),
    code: yup
        .string()
        .required('Mã minh chứng không được để trống')
        .matches(VALIDATION_RULES.CODE_PATTERN, 'Mã minh chứng không hợp lệ'),
    description: yup
        .string()
        .max(1000, 'Mô tả không được quá 1000 ký tự'),
    program: yup
        .string()
        .required('Chương trình đánh giá không được để trống'),
    organization: yup
        .string()
        .required('Tổ chức - Cấp đánh giá không được để trống'),
    standard: yup
        .string()
        .required('Tiêu chuẩn không được để trống'),
    criteria: yup
        .string()
        .required('Tiêu chí không được để trống'),
    documentNumber: yup
        .string()
        .max(50, 'Số hiệu văn bản không được quá 50 ký tự'),
    issueDate: yup
        .date()
        .nullable(),
    effectiveDate: yup
        .date()
        .nullable(),
    summary: yup
        .string()
        .max(500, 'Tóm tắt nội dung không được quá 500 ký tự')
})

export const userSchema = yup.object({
    name: yup
        .string()
        .required('Họ và tên không được để trống')
        .max(100, 'Họ và tên không được quá 100 ký tự'),
    email: yup
        .string()
        .required('Email không được để trống')
        .email('Email không hợp lệ')
        .max(255, 'Email không được quá 255 ký tự'),
    phone: yup
        .string()
        .matches(VALIDATION_RULES.PHONE, 'Số điện thoại không hợp lệ'),
    role: yup
        .string()
        .required('Vai trò không được để trống')
        .oneOf(['admin', 'manager', 'staff', 'viewer'], 'Vai trò không hợp lệ'),
    department: yup
        .string()
        .max(100, 'Phòng ban không được quá 100 ký tự'),
    position: yup
        .string()
        .max(100, 'Chức vụ không được quá 100 ký tự')
})

export const changePasswordSchema = yup.object({
    currentPassword: yup
        .string()
        .required('Mật khẩu hiện tại không được để trống'),
    newPassword: yup
        .string()
        .required('Mật khẩu mới không được để trống')
        .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `Mật khẩu phải có ít nhất ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} ký tự`)
        .notOneOf([yup.ref('currentPassword')], 'Mật khẩu mới phải khác mật khẩu hiện tại'),
    confirmPassword: yup
        .string()
        .required('Xác nhận mật khẩu không được để trống')
        .oneOf([yup.ref('newPassword')], 'Xác nhận mật khẩu không khớp')
})

export const programSchema = yup.object({
    name: yup
        .string()
        .required('Tên chương trình không được để trống')
        .max(255, 'Tên chương trình không được quá 255 ký tự'),
    code: yup
        .string()
        .required('Mã chương trình không được để trống')
        .max(50, 'Mã chương trình không được quá 50 ký tự'),
    description: yup
        .string()
        .max(1000, 'Mô tả không được quá 1000 ký tự'),
    startDate: yup
        .date()
        .nullable(),
    endDate: yup
        .date()
        .nullable()
        .min(yup.ref('startDate'), 'Ngày kết thúc phải sau ngày bắt đầu')
})

export const standardSchema = yup.object({
    name: yup
        .string()
        .required('Tên tiêu chuẩn không được để trống')
        .max(255, 'Tên tiêu chuẩn không được quá 255 ký tự'),
    code: yup
        .string()
        .required('Mã tiêu chuẩn không được để trống')
        .max(20, 'Mã tiêu chuẩn không được quá 20 ký tự'),
    description: yup
        .string()
        .max(1000, 'Mô tả không được quá 1000 ký tự'),
    program: yup
        .string()
        .required('Chương trình không được để trống')
})

export const criteriaSchema = yup.object({
    name: yup
        .string()
        .required('Tên tiêu chí không được để trống')
        .max(255, 'Tên tiêu chí không được quá 255 ký tự'),
    code: yup
        .string()
        .required('Mã tiêu chí không được để trống')
        .max(20, 'Mã tiêu chí không được quá 20 ký tự'),
    description: yup
        .string()
        .max(1000, 'Mô tả không được quá 1000 ký tự'),
    standard: yup
        .string()
        .required('Tiêu chuẩn không được để trống')
})

// File validation
export const fileSchema = yup.object({
    name: yup
        .string()
        .required('Tên file không được để trống'),
    size: yup
        .number()
        .max(VALIDATION_RULES.FILE_MAX_SIZE, `Kích thước file không được quá ${VALIDATION_RULES.FILE_MAX_SIZE / (1024 * 1024)}MB`),
    type: yup
        .string()
        .required('Loại file không được để trống')
})

// Custom validators
export const validateEvidenceCode = (code) => {
    if (!code) return 'Mã minh chứng không được để trống'
    if (!VALIDATION_RULES.CODE_PATTERN.test(code)) {
        return 'Mã minh chứng không đúng định dạng (VD: H1.01.02.04)'
    }
    return null
}

export const validateEmail = (email) => {
    if (!email) return 'Email không được để trống'
    if (!VALIDATION_RULES.EMAIL.test(email)) {
        return 'Email không hợp lệ'
    }
    return null
}

export const validatePhone = (phone) => {
    if (!phone) return null // Phone is optional
    if (!VALIDATION_RULES.PHONE.test(phone)) {
        return 'Số điện thoại không hợp lệ (10-11 chữ số)'
    }
    return null
}

export const validatePassword = (password) => {
    if (!password) return 'Mật khẩu không được để trống'
    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
        return `Mật khẩu phải có ít nhất ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} ký tự`
    }
    return null
}

export const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `${fieldName} không được để trống`
    }
    return null
}

export const validateMaxLength = (value, maxLength, fieldName) => {
    if (value && value.length > maxLength) {
        return `${fieldName} không được quá ${maxLength} ký tự`
    }
    return null
}

export const validateMinLength = (value, minLength, fieldName) => {
    if (value && value.length < minLength) {
        return `${fieldName} phải có ít nhất ${minLength} ký tự`
    }
    return null
}

export const validateFileType = (file, allowedTypes) => {
    if (!allowedTypes.includes(file.type)) {
        return `Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`
    }
    return null
}

export const validateFileSize = (file, maxSize = VALIDATION_RULES.FILE_MAX_SIZE) => {
    if (file.size > maxSize) {
        return `Kích thước file không được quá ${maxSize / (1024 * 1024)}MB`
    }
    return null
}

// Validation helper functions
export const getFieldError = (errors, fieldName) => {
    return errors[fieldName]?.message || null
}

export const hasError = (errors, fieldName) => {
    return !!errors[fieldName]
}

export const validateForm = async (schema, data) => {
    try {
        await schema.validate(data, { abortEarly: false })
        return { isValid: true, errors: {} }
    } catch (error) {
        const errors = {}
        error.inner.forEach(err => {
            errors[err.path] = { message: err.message }
        })
        return { isValid: false, errors }
    }
}

export const validateField = async (schema, fieldName, value) => {
    try {
        await schema.validateAt(fieldName, { [fieldName]: value })
        return null
    } catch (error) {
        return error.message
    }
}