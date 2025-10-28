const yup = require('yup');
const { VALIDATION_PATTERNS, VALIDATION_LIMITS } = require('./constants');

// Academic Year validation schema
const academicYearSchema = yup.object({
    name: yup
        .string()
        .max(100, 'Tên năm học không được quá 100 ký tự'),
    code: yup
        .string()
        .matches(VALIDATION_PATTERNS.ACADEMIC_YEAR_CODE, 'Mã năm học phải có định dạng YYYY-YYYY (VD: 2024-2025)'),
    startYear: yup
        .number()
        .required('Năm bắt đầu là bắt buộc')
        .min(2020, 'Năm bắt đầu không được nhỏ hơn 2020')
        .max(2100, 'Năm bắt đầu không được lớn hơn 2100'),
    endYear: yup
        .number()
        .required('Năm kết thúc là bắt buộc')
        .min(2021, 'Năm kết thúc không được nhỏ hơn 2021')
        .max(2100, 'Năm kết thúc không được lớn hơn 2100')
        .test('end-after-start', 'Năm kết thúc phải lớn hơn năm bắt đầu', function(value) {
            return value > this.parent.startYear;
        }),
    startDate: yup
        .date()
        .required('Ngày bắt đầu là bắt buộc'),
    endDate: yup
        .date()
        .required('Ngày kết thúc là bắt buộc')
        .min(yup.ref('startDate'), 'Ngày kết thúc phải sau ngày bắt đầu'),
    description: yup
        .string()
        .max(500, 'Mô tả không được quá 500 ký tự'),
    isCurrent: yup
        .boolean(),
    copySettings: yup
        .object()
});

// Common validation schemas
const loginSchema = yup.object({
    email: yup
        .string()
        .required('Email không được để trống')
        .email('Email không hợp lệ'),
    password: yup
        .string()
        .required('Mật khẩu không được để trống')
        .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH, `Mật khẩu phải có ít nhất ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} ký tự`)
});

const evidenceSchema = yup.object({
    name: yup
        .string()
        .required('Tên minh chứng không được để trống')
        .max(500, 'Tên minh chứng không được quá 500 ký tự'),
    code: yup
        .string()
        .matches(VALIDATION_PATTERNS.EVIDENCE_CODE, 'Mã minh chứng không hợp lệ (VD: H1.01.02.04)'),
    description: yup
        .string()
        .max(2000, 'Mô tả không được quá 2000 ký tự'),
    programId: yup
        .string()
        .required('Chương trình đánh giá không được để trống'),
    organizationId: yup
        .string()
        .required('Tổ chức - Cấp đánh giá không được để trống'),
    standardId: yup
        .string()
        .required('Tiêu chuẩn không được để trống'),
    criteriaId: yup
        .string()
        .required('Tiêu chí không được để trống'),
    documentNumber: yup
        .string()
        .max(100, 'Số hiệu văn bản không được quá 100 ký tự'),
    issueDate: yup
        .date()
        .nullable(),
    effectiveDate: yup
        .date()
        .nullable(),
    issuingAgency: yup
        .string()
        .max(200, 'Cơ quan ban hành không được quá 200 ký tự'),
    notes: yup
        .string()
        .max(1000, 'Ghi chú không được quá 1000 ký tự')
});

const userSchema = yup.object({
    fullName: yup
        .string()
        .required('Họ và tên không được để trống')
        .max(100, 'Họ và tên không được quá 100 ký tự'),
    email: yup
        .string()
        .required('Email không được để trống')
        .matches(VALIDATION_PATTERNS.EMAIL, 'Email không hợp lệ (chỉ nhập phần trước @)')
        .max(255, 'Email không được quá 255 ký tự'),
    phoneNumber: yup
        .string()
        .nullable()
        .matches(VALIDATION_PATTERNS.PHONE, 'Số điện thoại không hợp lệ'),
    role: yup
        .string()
        .required('Vai trò không được để trống')
        .oneOf(['admin', 'manager', 'staff'], 'Vai trò không hợp lệ'),
    department: yup
        .string()
        .max(100, 'Phòng ban không được quá 100 ký tự'),
    position: yup
        .string()
        .max(100, 'Chức vụ không được quá 100 ký tự')
});

const changePasswordSchema = yup.object({
    currentPassword: yup
        .string()
        .required('Mật khẩu hiện tại không được để trống'),
    newPassword: yup
        .string()
        .required('Mật khẩu mới không được để trống')
        .min(VALIDATION_LIMITS.PASSWORD_MIN_LENGTH, `Mật khẩu phải có ít nhất ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} ký tự`)
        .notOneOf([yup.ref('currentPassword')], 'Mật khẩu mới phải khác mật khẩu hiện tại'),
    confirmPassword: yup
        .string()
        .required('Xác nhận mật khẩu không được để trống')
        .oneOf([yup.ref('newPassword')], 'Xác nhận mật khẩu không khớp')
});

const programSchema = yup.object({
    name: yup
        .string()
        .required('Tên chương trình không được để trống')
        .max(300, 'Tên chương trình không được quá 300 ký tự'),
    code: yup
        .string()
        .required('Mã chương trình không được để trống')
        .max(20, 'Mã chương trình không được quá 20 ký tự')
        .matches(VALIDATION_PATTERNS.PROGRAM_CODE, 'Mã chương trình chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới'),
    description: yup
        .string()
        .max(2000, 'Mô tả không được quá 2000 ký tự'),
    type: yup
        .string()
        .oneOf(['undergraduate', 'graduate', 'institution', 'other'], 'Loại chương trình không hợp lệ'),
    version: yup
        .string()
        .max(10, 'Phiên bản không được quá 10 ký tự'),
    applicableYear: yup
        .number()
        .min(2000, 'Năm áp dụng phải từ 2000')
        .max(2100, 'Năm áp dụng không được lớn hơn 2100'),
    effectiveDate: yup
        .date()
        .nullable(),
    expiryDate: yup
        .date()
        .nullable()
        .min(yup.ref('effectiveDate'), 'Ngày hết hạn phải sau ngày hiệu lực'),
    objectives: yup
        .string()
        .max(2000, 'Mục tiêu không được quá 2000 ký tự'),
    guidelines: yup
        .string()
        .max(3000, 'Hướng dẫn không được quá 3000 ký tự')
});

const organizationSchema = yup.object({
    name: yup
        .string()
        .required('Tên tổ chức không được để trống')
        .max(300, 'Tên tổ chức không được quá 300 ký tự'),
    code: yup
        .string()
        .required('Mã tổ chức không được để trống')
        .max(20, 'Mã tổ chức không được quá 20 ký tự')
        .matches(VALIDATION_PATTERNS.ORGANIZATION_CODE, 'Mã tổ chức chỉ được chứa chữ hoa, số, dấu gạch ngang và gạch dưới'),
    description: yup
        .string()
        .max(2000, 'Mô tả không được quá 2000 ký tự'),
    level: yup
        .string()
        .oneOf(['national', 'international', 'regional', 'institutional'], 'Cấp độ không hợp lệ'),
    type: yup
        .string()
        .oneOf(['government', 'education', 'professional', 'international', 'other'], 'Loại tổ chức không hợp lệ'),
    website: yup
        .string()
        .url('Website không hợp lệ')
        .nullable(),
    contactEmail: yup
        .string()
        .email('Email liên hệ không hợp lệ')
        .nullable(),
    contactPhone: yup
        .string()
        .matches(/^[\d\s\-\+\(\)]+$/, 'Số điện thoại không hợp lệ')
        .nullable(),
    address: yup
        .string()
        .max(500, 'Địa chỉ không được quá 500 ký tự'),
    country: yup
        .string()
        .max(100, 'Tên quốc gia không được quá 100 ký tự')
});

const standardSchema = yup.object({
    name: yup
        .string()
        .required('Tên tiêu chuẩn không được để trống')
        .max(500, 'Tên tiêu chuẩn không được quá 500 ký tự'),
    code: yup
        .string()
        .required('Mã tiêu chuẩn không được để trống')
        .matches(VALIDATION_PATTERNS.STANDARD_CODE, 'Mã tiêu chuẩn phải là 1-2 chữ số'),
    description: yup
        .string()
        .max(3000, 'Mô tả không được quá 3000 ký tự'),
    programId: yup
        .string()
        .required('Chương trình không được để trống'),
    organizationId: yup
        .string()
        .required('Tổ chức không được để trống'),
    order: yup
        .number()
        .min(1, 'Thứ tự phải lớn hơn 0'),
    weight: yup
        .number()
        .min(0, 'Trọng số không được âm')
        .max(100, 'Trọng số không được vượt quá 100'),
    objectives: yup
        .string()
        .max(2000, 'Mục tiêu không được quá 2000 ký tự'),
    guidelines: yup
        .string()
        .max(3000, 'Hướng dẫn không được quá 3000 ký tự')
});

const criteriaSchema = yup.object({
    name: yup
        .string()
        .required('Tên tiêu chí không được để trống')
        .max(500, 'Tên tiêu chí không được quá 500 ký tự'),
    code: yup
        .string()
        .required('Mã tiêu chí không được để trống')
        .matches(VALIDATION_PATTERNS.CRITERIA_CODE, 'Mã tiêu chí phải là 1-2 chữ số'),
    description: yup
        .string()
        .max(3000, 'Mô tả không được quá 3000 ký tự'),
    standardId: yup
        .string()
        .required('Tiêu chuẩn không được để trống'),
    order: yup
        .number()
        .min(1, 'Thứ tự phải lớn hơn 0'),
    weight: yup
        .number()
        .min(0, 'Trọng số không được âm')
        .max(100, 'Trọng số không được vượt quá 100'),
    type: yup
        .string()
        .oneOf(['mandatory', 'optional', 'conditional'], 'Loại tiêu chí không hợp lệ'),
    requirements: yup
        .string()
        .max(2000, 'Yêu cầu không được quá 2000 ký tự'),
    guidelines: yup
        .string()
        .max(3000, 'Hướng dẫn không được quá 3000 ký tự')
});

// File validation
const fileSchema = yup.object({
    originalName: yup
        .string()
        .required('Tên file không được để trống'),
    size: yup
        .number()
        .max(50 * 1024 * 1024, 'Kích thước file không được quá 50MB'), // 50MB default
    mimeType: yup
        .string()
        .required('Loại file không được để trống')
});

// Custom validators
const validateEvidenceCode = (code) => {
    if (!code) return 'Mã minh chứng không được để trống'
    if (!VALIDATION_PATTERNS.EVIDENCE_CODE.test(code)) {
        return 'Mã minh chứng không đúng định dạng (VD: H1.01.02.04)'
    }
    return null
}

const validateAcademicYearCode = (code) => {
    if (!code) return 'Mã năm học không được để trống'
    if (!VALIDATION_PATTERNS.ACADEMIC_YEAR_CODE.test(code)) {
        return 'Mã năm học không đúng định dạng (VD: 2024-2025)'
    }
    return null
}

const validateEmail = (email) => {
    if (!email) return 'Email không được để trống'
    if (!VALIDATION_PATTERNS.EMAIL.test(email)) {
        return 'Email không hợp lệ'
    }
    return null
}

const validatePhone = (phone) => {
    if (!phone) return null // Phone is optional
    if (!VALIDATION_PATTERNS.PHONE.test(phone)) {
        return 'Số điện thoại không hợp lệ (10-11 chữ số)'
    }
    return null
}

const validatePassword = (password) => {
    if (!password) return 'Mật khẩu không được để trống'
    if (password.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
        return `Mật khẩu phải có ít nhất ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} ký tự`
    }
    return null
}

const validateRequired = (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `${fieldName} không được để trống`
    }
    return null
}

const validateMaxLength = (value, maxLength, fieldName) => {
    if (value && value.length > maxLength) {
        return `${fieldName} không được quá ${maxLength} ký tự`
    }
    return null
}

const validateMinLength = (value, minLength, fieldName) => {
    if (value && value.length < minLength) {
        return `${fieldName} phải có ít nhất ${minLength} ký tự`
    }
    return null
}

const validateFileType = (file, allowedTypes) => {
    if (!allowedTypes.includes(file.mimeType || file.type)) {
        return `Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`
    }
    return null
}

const validateFileSize = (file, maxSize = 50 * 1024 * 1024) => { // 50MB default
    if (file.size > maxSize) {
        return `Kích thước file không được quá ${maxSize / (1024 * 1024)}MB`
    }
    return null
}

const validateDateRange = (startDate, endDate, startFieldName = 'Ngày bắt đầu', endFieldName = 'Ngày kết thúc') => {
    if (!startDate || !endDate) return null

    if (new Date(endDate) <= new Date(startDate)) {
        return `${endFieldName} phải sau ${startFieldName.toLowerCase()}`
    }
    return null
}

const validateYearRange = (startYear, endYear) => {
    if (!startYear || !endYear) return null

    if (endYear <= startYear) {
        return 'Năm kết thúc phải lớn hơn năm bắt đầu'
    }
    return null
}

// Validation helper functions
const getFieldError = (errors, fieldName) => {
    return errors[fieldName]?.message || null
}

const hasError = (errors, fieldName) => {
    return !!errors[fieldName]
}

const validateForm = async (schema, data) => {
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

const validateField = async (schema, fieldName, value) => {
    try {
        await schema.validateAt(fieldName, { [fieldName]: value })
        return null
    } catch (error) {
        return error.message
    }
}

// Sanitization functions
const sanitizeString = (str) => {
    if (!str) return ''
    return str.toString().trim()
}

const sanitizeHtml = (str) => {
    if (!str) return ''
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
}

const sanitizeNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value)
    return isNaN(num) ? defaultValue : num
}

const sanitizeBoolean = (value, defaultValue = false) => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1'
    }
    return defaultValue
}

module.exports = {
    academicYearSchema,
    loginSchema,
    evidenceSchema,
    userSchema,
    changePasswordSchema,
    programSchema,
    organizationSchema,
    standardSchema,
    criteriaSchema,
    fileSchema,
    validateEvidenceCode,
    validateAcademicYearCode,
    validateEmail,
    validatePhone,
    validatePassword,
    validateRequired,
    validateMaxLength,
    validateMinLength,
    validateFileType,
    validateFileSize,
    validateDateRange,
    validateYearRange,
    getFieldError,
    hasError,
    validateForm,
    validateField,
    sanitizeString,
    sanitizeHtml,
    sanitizeNumber,
    sanitizeBoolean
};