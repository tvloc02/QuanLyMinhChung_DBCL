export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        ME: '/api/auth/me',
        CHANGE_PASSWORD: '/api/auth/change-password',
        FORGOT_PASSWORD: '/api/auth/forgot-password'
    },
    EVIDENCES: {
        LIST: '/api/evidences',
        CREATE: '/api/evidences',
        DETAIL: (id) => `/api/evidences/${id}`,
        UPDATE: (id) => `/api/evidences/${id}`,
        DELETE: (id) => `/api/evidences/${id}`,
        BULK_DELETE: '/api/evidences/bulk'
    },
    FILES: {
        UPLOAD: '/api/files/upload',
        DOWNLOAD: (id) => `/api/files/${id}/download`
    },
    STRUCTURE: {
        PROGRAMS: '/api/programs',
        ORGANIZATIONS: '/api/organizations',
        STANDARDS: '/api/standards',
        CRITERIA: '/api/criteria'
    },
    REPORTS: {
        STATISTICS: '/api/reports/statistics',
        EXPORT: '/api/reports/export'
    }
}

export const EVIDENCE_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
}

export const EVIDENCE_STATUS_LABELS = {
    [EVIDENCE_STATUS.DRAFT]: 'Nháp',
    [EVIDENCE_STATUS.PENDING]: 'Chờ xử lý',
    [EVIDENCE_STATUS.APPROVED]: 'Đã phê duyệt',
    [EVIDENCE_STATUS.REJECTED]: 'Từ chối'
}

export const EVIDENCE_STATUS_COLORS = {
    [EVIDENCE_STATUS.DRAFT]: {
        bg: 'bg-gray-100',
        text: 'text-gray-800'
    },
    [EVIDENCE_STATUS.PENDING]: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800'
    },
    [EVIDENCE_STATUS.APPROVED]: {
        bg: 'bg-green-100',
        text: 'text-green-800'
    },
    [EVIDENCE_STATUS.REJECTED]: {
        bg: 'bg-red-100',
        text: 'text-red-800'
    }
}

export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    VIEWER: 'viewer'
}

export const USER_ROLE_LABELS = {
    [USER_ROLES.ADMIN]: 'Quản trị viên',
    [USER_ROLES.MANAGER]: 'Quản lý',
    [USER_ROLES.STAFF]: 'Nhân viên',
    [USER_ROLES.VIEWER]: 'Người xem'
}

export const SUPPORTED_FILE_TYPES = {
    DOCUMENTS: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    IMAGES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ],
    ARCHIVES: [
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
    ]
}

export const FILE_TYPE_LABELS = {
    'application/pdf': 'PDF',
    'application/msword': 'Word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.ms-powerpoint': 'PowerPoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'application/zip': 'ZIP',
    'application/x-rar-compressed': 'RAR',
    'application/x-7z-compressed': '7Z'
}

export const PAGINATION_DEFAULTS = {
    ITEMS_PER_PAGE: 10,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
}

export const DATE_FORMATS = {
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
    API: 'YYYY-MM-DD',
    API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss'
}

export const STORAGE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    THEME: 'theme',
    LANGUAGE: 'language'
}

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    EVIDENCE_MANAGEMENT: '/evidence-management',
    EVIDENCE_TREE: '/evidence-tree',
    IMPORT_EVIDENCE: '/import-evidence',
    USER_MANAGEMENT: '/user-management',
    PROGRAM_MANAGEMENT: '/program-management',
    REPORTS: '/reports'
}

export const THEME_COLORS = {
    PRIMARY: '#2563eb',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    DANGER: '#ef4444',
    INFO: '#06b6d4',
    GRAY: '#6b7280'
}

export const TOAST_OPTIONS = {
    DURATION: 4000,
    SUCCESS_DURATION: 3000,
    ERROR_DURATION: 5000
}

export const VALIDATION_RULES = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[0-9]{10,11}$/,
    PASSWORD_MIN_LENGTH: 6,
    FILE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    CODE_PATTERN: /^[A-Z0-9.-]+$/
}

export const EVIDENCE_CODE_FORMAT = {
    PATTERN: /^H\d+\.\d+\.\d+\.\d+$/,
    EXAMPLE: 'H1.01.02.04',
    DESCRIPTION: 'Định dạng: H{Số hộp}.{Mã tiêu chuẩn}.{Mã tiêu chí}.{STT minh chứng}'
}