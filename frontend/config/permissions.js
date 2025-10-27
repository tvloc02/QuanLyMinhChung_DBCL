// frontend/config/permissions.js
/**
 * CẤU HÌNH QUYỀN THEO VAI TRÒ
 * Tập trung quản lý quyền truy cập menu theo từng vai trò người dùng
 */

export const ROLE_PERMISSIONS = {
    // ============================================
    // ADMIN - Quản trị viên
    // ============================================
    admin: [
        // Trang chủ
        'dashboard',

        // Quản lý năm học
        'academic_years',
        'academic_years_list',
        'academic_years_create',
        'academic_years_copy',

        // Cấu trúc đánh giá
        'evaluation_structure',
        'programs',
        'organizations',
        'standards',
        'criteria',

        // Quản lý minh chứng
        'evidence',
        'evidence_overview',
        'evidence_tree',
        'evidence_management',
        'evidence_create',
        'evidence_tree_create',
        'evidence_batch',
        'evidence_batch_upload',
        'evidence_batch_assign',
        'evidence_batch_delete',

        // Báo cáo & Đánh giá
        'reports',
        'reports_list',
        'reports_create',
        'assignments',
        'evaluations',
        'evaluations_supervised',
        'evaluations_my',
        'evaluations_approvals',

        // Quản lý người dùng
        'users',
        'users_list',
        'users_create',
        'users_experts',
        'users_managers',
        'user_groups',
        'permissions',
        'departments',

        // Thông báo
        'notifications',

        // Thống kê & Báo cáo
        'analytics',
        'analytics_dashboard',
        'analytics_comprehensive',
        'analytics_logs',
        'analytics_view',

        // Cấu hình hệ thống
        'system',
        'system_settings',
        'system_backup',
        'system_restore',
        'system_logs',
        'system_mail'
    ],

    // ============================================
    // MANAGER - Cán bộ quản lý báo cáo TDG
    // ============================================
    manager: [
        // Trang chủ
        'dashboard',

        // Quản lý năm học
        'academic_years',
        'academic_years_list',
        'academic_years_create',
        'academic_years_copy',

        // Cấu trúc đánh giá (xem, sửa, xóa, tạo)
        'evaluation_structure',
        'programs',
        'organizations',
        'standards',
        'criteria',

        // Quản lý minh chứng (tất cả chức năng)
        'evidence',
        'evidence_overview',
        'evidence_tree',
        'evidence_management',
        'evidence_create',
        'evidence_tree_create',
        'evidence_batch',
        'evidence_batch_upload',
        'evidence_batch_assign',
        'evidence_batch_delete',

        // Báo cáo & Đánh giá (tất cả chức năng)
        'reports',
        'reports_list',
        'reports_create',
        'assignments',
        'evaluations',
        'evaluations_supervised',
        'evaluations_my',
        'evaluations_approvals',

        // Thông báo
        'notifications',

        // Thống kê & Báo cáo (xem dashboard và báo cáo tổng hợp)
        'analytics',
        'analytics_dashboard',
        'analytics_comprehensive',
        'analytics_logs'
    ],

    // ============================================
    // TDG - Trưởng ban, Trưởng khoa
    // ============================================
    tdg: [
        // Trang chủ
        'dashboard',

        // Quản lý minh chứng (xem, tạo, upload, phân quyền, xóa)
        'evidence',
        'evidence_overview',
        'evidence_tree',
        'evidence_management',
        'evidence_create',
        'evidence_tree_create',
        'evidence_batch',
        'evidence_batch_upload',
        'evidence_batch_assign',
        'evidence_batch_delete',

        // Báo cáo & Đánh giá (xem, phân quyền, tổng quan)
        'reports',
        'reports_list',
        'assignments',
        'evaluations',
        'evaluations_supervised',

        // Thông báo
        'notifications'
    ],

    // ============================================
    // EXPERT - Chuyên gia đánh giá
    // ============================================
    expert: [
        // Trang chủ
        'dashboard',

        // Báo cáo & Đánh giá (xem, đánh giá, phê duyệt)
        'reports',
        'reports_list',
        'evaluations',
        'evaluations_my',
        'evaluations_approvals',

        // Thông báo
        'notifications'
    ]
}

// ============================================
// MẪU CỤ THỂ TỪNG VAI TRÒ
// ============================================

export const ROLE_DESCRIPTIONS = {
    admin: {
        name: 'Quản trị viên',
        description: 'Có toàn bộ quyền truy cập hệ thống',
        capabilities: [
            'Quản lý năm học',
            'Quản lý cấu trúc đánh giá',
            'Quản lý minh chứng',
            'Quản lý báo cáo & đánh giá',
            'Quản lý người dùng',
            'Xem thống kê',
            'Cấu hình hệ thống'
        ]
    },
    manager: {
        name: 'Cán bộ quản lý báo cáo TDG',
        description: 'Quản lý cấu trúc đánh giá, minh chứng và báo cáo',
        capabilities: [
            'Quản lý năm học',
            'Quản lý cấu trúc đánh giá',
            'Quản lý minh chứng',
            'Quản lý báo cáo & đánh giá',
            'Xem thống kê'
        ]
    },
    tdg: {
        name: 'Trưởng ban / Trưởng khoa',
        description: 'Quản lý minh chứng và phân quyền báo cáo',
        capabilities: [
            'Quản lý minh chứng',
            'Phân quyền báo cáo',
            'Xem tổng quan báo cáo',
            'Xem kết quả đánh giá'
        ]
    },
    expert: {
        name: 'Chuyên gia đánh giá',
        description: 'Xem báo cáo, thực hiện đánh giá và phê duyệt',
        capabilities: [
            'Xem danh sách báo cáo',
            'Thực hiện đánh giá',
            'Phê duyệt báo cáo'
        ]
    }
}

// ============================================
// HÀM HELPER
// ============================================

/**
 * Kiểm tra người dùng có quyền truy cập menu item không
 * @param {string} userRole - Vai trò người dùng (admin, manager, tdg, expert)
 * @param {string} permissionKey - Key quyền của menu item
 * @returns {boolean} true nếu có quyền, false nếu không
 */
export const hasPermission = (userRole, permissionKey) => {
    if (!userRole || !permissionKey) return false

    const permissions = ROLE_PERMISSIONS[userRole]
    if (!permissions) {
        console.warn(`Role "${userRole}" không tồn tại`)
        return false
    }

    return permissions.includes(permissionKey)
}

/**
 * Lấy tất cả quyền của một vai trò
 * @param {string} userRole - Vai trò người dùng
 * @returns {array} Mảng các quyền
 */
export const getPermissionsByRole = (userRole) => {
    return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.expert
}

/**
 * Lọc menu items theo quyền của người dùng
 * @param {array} menuItems - Danh sách menu items
 * @param {string} userRole - Vai trò người dùng
 * @returns {array} Danh sách menu items được phép
 */
export const filterMenuByRole = (menuItems, userRole) => {
    return menuItems
        .filter(item => {
            if (!item.permissionKey) return true
            return hasPermission(userRole, item.permissionKey)
        })
        .map(item => {
            if (item.submenu && Array.isArray(item.submenu)) {
                return {
                    ...item,
                    submenu: item.submenu.filter(sub => {
                        if (!sub.permissionKey) return true
                        return hasPermission(userRole, sub.permissionKey)
                    })
                }
            }
            return item
        })
        .filter(item => {
            // Ẩn menu nếu không có submenu nào được phép
            if (item.hasSubmenu && item.submenu && item.submenu.length === 0) {
                return false
            }
            return true
        })
}

/**
 * Lấy thông tin chi tiết về vai trò
 * @param {string} userRole - Vai trò người dùng
 * @returns {object} Thông tin vai trò
 */
export const getRoleInfo = (userRole) => {
    return ROLE_DESCRIPTIONS[userRole] || ROLE_DESCRIPTIONS.expert
}

/**
 * Kiểm tra vai trò có quyền admin không
 * @param {string} userRole - Vai trò người dùng
 * @returns {boolean}
 */
export const isAdmin = (userRole) => userRole === 'admin'

/**
 * Kiểm tra vai trò có quyền manager không
 * @param {string} userRole - Vai trò người dùng
 * @returns {boolean}
 */
export const isManager = (userRole) => userRole === 'manager'

/**
 * Kiểm tra vai trò có quyền quản lý (admin hoặc manager)
 * @param {string} userRole - Vai trò người dùng
 * @returns {boolean}
 */
export const isManagementRole = (userRole) => ['admin', 'manager'].includes(userRole)

/**
 * Lấy danh sách tất cả các vai trò
 * @returns {array} Mảng các vai trò
 */
export const getAllRoles = () => Object.keys(ROLE_PERMISSIONS)

// ============================================
// BẢNG QUYỀN CHI TIẾT
// ============================================

export const PERMISSION_MATRIX = {
    dashboard: {
        admin: true,
        manager: true,
        tdg: true,
        expert: true
    },
    academic_years: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    academic_years_list: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    academic_years_create: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    academic_years_copy: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    evaluation_structure: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    programs: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    organizations: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    standards: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    criteria: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    evidence: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    evidence_overview: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    evidence_tree: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    evidence_management: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    evidence_create: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    evidence_tree_create: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    evidence_batch_upload: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    evidence_batch_assign: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    evidence_batch_delete: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    reports: {
        admin: true,
        manager: true,
        tdg: true,
        expert: true
    },
    reports_list: {
        admin: true,
        manager: true,
        tdg: true,
        expert: true
    },
    reports_create: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    assignments: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    evaluations: {
        admin: true,
        manager: true,
        tdg: true,
        expert: true
    },
    evaluations_supervised: {
        admin: true,
        manager: true,
        tdg: true,
        expert: false
    },
    evaluations_my: {
        admin: true,
        manager: true,
        tdg: false,
        expert: true
    },
    evaluations_approvals: {
        admin: true,
        manager: true,
        tdg: false,
        expert: true
    },
    users: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    users_list: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    users_create: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    users_experts: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    users_managers: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    user_groups: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    permissions: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    departments: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    notifications: {
        admin: true,
        manager: true,
        tdg: true,
        expert: true
    },
    analytics: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    analytics_dashboard: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    analytics_comprehensive: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    analytics_logs: {
        admin: true,
        manager: true,
        tdg: false,
        expert: false
    },
    analytics_view: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    system: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    system_settings: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    system_backup: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    system_restore: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    system_logs: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    },
    system_mail: {
        admin: true,
        manager: false,
        tdg: false,
        expert: false
    }
}