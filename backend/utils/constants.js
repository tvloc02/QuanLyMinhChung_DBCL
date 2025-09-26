// User roles
const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff'
};

// User status
const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
};

// Evidence status
const EVIDENCE_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
    ARCHIVED: 'archived'
};

// Document types
const DOCUMENT_TYPES = {
    DECISION: 'Quyết định',
    CIRCULAR: 'Thông tư',
    DECREE: 'Nghị định',
    LAW: 'Luật',
    REPORT: 'Báo cáo',
    PLAN: 'Kế hoạch',
    OTHER: 'Khác'
};

// Program types
const PROGRAM_TYPES = {
    UNDERGRADUATE: 'undergraduate',
    GRADUATE: 'graduate',
    INSTITUTION: 'institution',
    OTHER: 'other'
};

// Program status
const PROGRAM_STATUS = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ARCHIVED: 'archived'
};

// Organization levels
const ORGANIZATION_LEVELS = {
    NATIONAL: 'national',
    INTERNATIONAL: 'international',
    REGIONAL: 'regional',
    INSTITUTIONAL: 'institutional'
};

// Organization types
const ORGANIZATION_TYPES = {
    GOVERNMENT: 'government',
    EDUCATION: 'education',
    PROFESSIONAL: 'professional',
    INTERNATIONAL: 'international',
    OTHER: 'other'
};

// File types and allowed extensions
const ALLOWED_FILE_TYPES = {
    DOCUMENTS: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
    ],
    IMAGES: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp'
    ],
    ARCHIVES: [
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ]
};

const FILE_EXTENSIONS = {
    PDF: '.pdf',
    DOC: '.doc',
    DOCX: '.docx',
    XLS: '.xls',
    XLSX: '.xlsx',
    PPT: '.ppt',
    PPTX: '.pptx',
    TXT: '.txt',
    JPG: '.jpg',
    JPEG: '.jpeg',
    PNG: '.png',
    GIF: '.gif'
};

// File size limits
const FILE_SIZE_LIMITS = {
    DOCUMENT: 50 * 1024 * 1024, // 50MB
    IMAGE: 10 * 1024 * 1024,    // 10MB
    ARCHIVE: 100 * 1024 * 1024, // 100MB
    IMPORT: 10 * 1024 * 1024    // 10MB for import files
};

// Validation patterns
const VALIDATION_PATTERNS = {
    EMAIL: /^[a-zA-Z0-9]+$/, // Email without domain
    PHONE: /^[0-9]{10,11}$/,
    EVIDENCE_CODE: /^H\d+\.\d{2}\.\d{2}\.\d{2}$/,
    STANDARD_CODE: /^\d{1,2}$/,
    CRITERIA_CODE: /^\d{1,2}$/,
    PROGRAM_CODE: /^[A-Z0-9\-_]+$/,
    ORGANIZATION_CODE: /^[A-Z0-9\-_]+$/,
    PASSWORD: /^.{6,}$/ // At least 6 characters
};

// Validation limits
const VALIDATION_LIMITS = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 300,
    DESCRIPTION_MAX_LENGTH: 3000,
    CODE_MAX_LENGTH: 20,
    PASSWORD_MIN_LENGTH: 6,
    NOTES_MAX_LENGTH: 1000,
    ADDRESS_MAX_LENGTH: 500,
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 11,
    IMPORT_MAX_ROWS: 1000
};

// Date formats
const DATE_FORMATS = {
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
    ISO: 'YYYY-MM-DD',
    ISO_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss'
};

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

// Sort orders
const SORT_ORDERS = {
    ASC: 'asc',
    DESC: 'desc'
};

// Cache durations (in seconds)
const CACHE_DURATION = {
    SHORT: 5 * 60,      // 5 minutes
    MEDIUM: 30 * 60,    // 30 minutes
    LONG: 2 * 60 * 60,  // 2 hours
    VERY_LONG: 24 * 60 * 60 // 24 hours
};

// API response messages
const MESSAGES = {
    // Success messages
    SUCCESS: {
        LOGIN: 'Đăng nhập thành công',
        LOGOUT: 'Đăng xuất thành công',
        CREATED: 'Tạo mới thành công',
        UPDATED: 'Cập nhật thành công',
        DELETED: 'Xóa thành công',
        UPLOADED: 'Upload thành công',
        IMPORTED: 'Import thành công',
        EXPORTED: 'Export thành công',
        PASSWORD_CHANGED: 'Thay đổi mật khẩu thành công',
        PASSWORD_RESET: 'Reset mật khẩu thành công'
    },

    // Error messages
    ERROR: {
        SYSTEM: 'Lỗi hệ thống',
        NOT_FOUND: 'Không tìm thấy dữ liệu',
        UNAUTHORIZED: 'Không có quyền truy cập',
        FORBIDDEN: 'Truy cập bị từ chối',
        VALIDATION: 'Dữ liệu không hợp lệ',
        DUPLICATE: 'Dữ liệu đã tồn tại',
        INVALID_CREDENTIALS: 'Thông tin đăng nhập không chính xác',
        TOKEN_INVALID: 'Token không hợp lệ',
        TOKEN_EXPIRED: 'Token đã hết hạn',
        FILE_TOO_LARGE: 'File quá lớn',
        FILE_TYPE_NOT_SUPPORTED: 'Loại file không được hỗ trợ',
        PASSWORD_TOO_SHORT: 'Mật khẩu quá ngắn',
        EMAIL_ALREADY_EXISTS: 'Email đã tồn tại',
        CODE_ALREADY_EXISTS: 'Mã đã tồn tại',
        CANNOT_DELETE_IN_USE: 'Không thể xóa dữ liệu đang được sử dụng',
        IMPORT_FAILED: 'Import thất bại',
        EXPORT_FAILED: 'Export thất bại'
    }
};

// Email templates
const EMAIL_TEMPLATES = {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password_reset',
    PASSWORD_CHANGED: 'password_changed',
    IMPORT_RESULT: 'import_result',
    WEEKLY_REPORT: 'weekly_report'
};

// Cron job schedules
const CRON_SCHEDULES = {
    DAILY_CLEANUP: '0 2 * * *',        // 2 AM daily
    WEEKLY_REPORT: '0 9 * * 1',        // 9 AM every Monday
    MONTHLY_BACKUP: '0 3 1 * *',       // 3 AM on 1st of every month
    TEMP_FILE_CLEANUP: '0 */4 * * *'   // Every 4 hours
};

// Database indexes
const DB_INDEXES = {
    TEXT_SEARCH: 'text',
    COMPOUND: 'compound',
    UNIQUE: 'unique',
    SPARSE: 'sparse'
};

// Logging levels
const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    VERBOSE: 'verbose'
};

// Environment variables
const ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
    STAGING: 'staging'
};

// HTTP status codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

// Rate limiting
const RATE_LIMITS = {
    GENERAL: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 100
    },
    LOGIN: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 5
    },
    FILE_UPLOAD: {
        WINDOW_MS: 60 * 1000, // 1 minute
        MAX_REQUESTS: 10
    },
    API_HEAVY: {
        WINDOW_MS: 60 * 1000, // 1 minute
        MAX_REQUESTS: 20
    }
};

// Default configurations
const DEFAULTS = {
    TIMEZONE: 'Asia/Ho_Chi_Minh',
    LANGUAGE: 'vi',
    DATE_FORMAT: 'DD/MM/YYYY',
    CURRENCY: 'VND',
    PAGE_SIZE: 20,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    JWT_EXPIRE: '30d',
    BCRYPT_ROUNDS: 10
};

// System configurations
const SYSTEM_CONFIG = {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_TIME: 30 * 60 * 1000, // 30 minutes
    PASSWORD_RESET_EXPIRE: 10 * 60 * 1000, // 10 minutes
    TEMP_FILE_CLEANUP_AGE: 24 * 60 * 60 * 1000, // 24 hours
    LOG_RETENTION_DAYS: 30,
    BACKUP_RETENTION_DAYS: 90
};

// Feature flags
const FEATURES = {
    EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL === 'true',
    FILE_COMPRESSION: process.env.ENABLE_COMPRESSION === 'true',
    VIRUS_SCANNING: process.env.ENABLE_VIRUS_SCAN === 'true',
    AUDIT_LOGGING: process.env.ENABLE_AUDIT === 'true',
    SEARCH_ANALYTICS: process.env.ENABLE_SEARCH_ANALYTICS === 'true'
};

module.exports = {
    USER_ROLES,
    USER_STATUS,
    EVIDENCE_STATUS,
    DOCUMENT_TYPES,
    PROGRAM_TYPES,
    PROGRAM_STATUS,
    ORGANIZATION_LEVELS,
    ORGANIZATION_TYPES,
    ALLOWED_FILE_TYPES,
    FILE_EXTENSIONS,
    FILE_SIZE_LIMITS,
    VALIDATION_PATTERNS,
    VALIDATION_LIMITS,
    DATE_FORMATS,
    PAGINATION,
    SORT_ORDERS,
    CACHE_DURATION,
    MESSAGES,
    EMAIL_TEMPLATES,
    CRON_SCHEDULES,
    DB_INDEXES,
    LOG_LEVELS,
    ENVIRONMENTS,
    HTTP_STATUS,
    RATE_LIMITS,
    DEFAULTS,
    SYSTEM_CONFIG,
    FEATURES
};