import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
    Activity,
    Archive,
    BarChart3,
    Bell,
    Book,
    BookOpen,
    Briefcase,
    Building2,
    Calendar,
    CheckSquare,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Eye,
    FileSignature,
    FileText,
    Folder,
    FolderTree,
    GraduationCap,
    Home,
    Lock,
    Mail,
    Play,
    Plus,
    Search,
    Settings,
    Shield,
    Target,
    TrendingUp,
    Upload,
    User,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react'


const ROLE_PERMISSIONS = {
    admin: [
        'dashboard',
        'academic_years',
        'academic_years_list',
        'academic_years_create',
        'academic_years_copy',
        'evaluation_structure',
        'programs', 'organizations', 'standards', 'criteria',
        'evidence', 'evidence_overview', 'evidence_tree', 'evidence_management', 'evidence_create',
        'evidence_tree_create',
        'reports', 'reports_list', 'reports_create', 'reports_request', 'reports_create_request',
        'assignments', 'evaluations', 'evaluations_supervised', 'evaluations_my', 'evaluations_approvals',
        'notifications', 'analytics', 'analytics_dashboard', 'analytics_comprehensive', 'analytics_logs',
        'analytics_view', 'system', 'system_settings', 'system_backup', 'system_restore', 'system_logs',
        'system_mail', 'users', 'users_list', 'users_create', 'users_experts', 'users_managers',
        'user_groups', 'permissions', 'departments'
    ],

    manager: [
        'dashboard',
        'academic_years_list',
        'evaluation_structure', 'programs', 'organizations', 'standards', 'criteria',
        'evidence', 'evidence_overview', 'evidence_tree', 'evidence_management', 'evidence_create',
        'task',
        'reports', 'reports_list', 'reports_create', 'reports_request', 'reports_create_request',
        'assignments',
        'evaluations', 'evaluations_supervised', 'evaluations_approvals',
        'notifications',
        'analytics', 'analytics_dashboard', 'analytics_comprehensive', 'analytics_logs',
        'users_list',
        'departments',
    ],

    reporter: [
        'dashboard',
        'evaluation_structure', 'programs', 'organizations', 'standards', 'criteria',
        'task',
        'evidence', 'evidence_overview', 'evidence_tree', 'evidence_management', 'evidence_create',
        'reports', 'reports_list', 'reports_request', 'reports_create',
        'evaluations', 'evaluations_supervised',
        'notifications',
    ],

    evaluator: [
        'dashboard',
        'evaluation_structure', 'programs', 'organizations', 'standards', 'criteria',
        'reports', 'reports_list',
        'assignments', // Xem phân quyền
        'evaluations', 'evaluations_my', // Đánh giá của tôi
        'notifications'
    ]
}

const getEffectiveRole = (role) => {
    switch (role) {
        case 'admin':
        case 'manager':
        case 'reporter':
            return role;
        case 'expert':
        case 'evaluator':
        case 'tdg':
            return 'evaluator';
        default:
            return 'reporter';
    }
}

const getAllMenuItems = (router) => [
    {
        name: 'Trang chủ',
        icon: Home,
        path: '/dashboard',
        permissionKey: 'dashboard',
        active: () => router.pathname === '/dashboard'
    },
    {
        name: 'Quản lý năm học',
        icon: Calendar,
        path: '/academic-years', // Mục cha không có path, nhưng để đánh dấu active
        permissionKey: 'academic_years',
        hasSubmenu: true,
        active: () => router.pathname.includes('/academic-years'),
        submenu: [
            {
                name: 'Danh sách năm học',
                icon: Calendar,
                path: '/academic-years/academic-years',
                permissionKey: 'academic_years_list',
                active: () => router.pathname === '/academic-years/academic-years'
            },
            {
                name: 'Tạo năm học mới',
                icon: UserPlus,
                path: '/academic-years/create',
                permissionKey: 'academic_years_create',
                active: () => router.pathname === '/academic-years/create'
            },
            {
                name: 'Sao chép năm học',
                icon: Archive,
                path: '/academic-years/copy',
                permissionKey: 'academic_years_copy',
                active: () => router.pathname === '/academic-years/copy'
            }
        ]
    },
    {
        name: 'Cấu trúc đánh giá',
        icon: Briefcase,
        path: '/evaluation-structure',
        permissionKey: 'evaluation_structure',
        hasSubmenu: true,
        active: () => router.pathname.includes('/evaluation-structure'),
        submenu: [
            {
                name: 'Chương trình đánh giá',
                icon: BookOpen,
                path: '/evaluation-structure/programs',
                permissionKey: 'programs',
                active: () => router.pathname === '/evaluation-structure/programs'
            },
            {
                name: 'Tổ chức đánh giá',
                icon: Building2,
                path: '/evaluation-structure/organizations',
                permissionKey: 'organizations',
                active: () => router.pathname === '/evaluation-structure/organizations'
            },
            {
                name: 'Tiêu chuẩn',
                icon: Target,
                path: '/evaluation-structure/standards',
                permissionKey: 'standards',
                active: () => router.pathname === '/evaluation-structure/standards'
            },
            {
                name: 'Tiêu chí',
                icon: CheckSquare,
                path: '/evaluation-structure/criteria',
                permissionKey: 'criteria',
                active: () => router.pathname === '/evaluation-structure/criteria'
            }
        ]
    },
    {
        name: 'Quản lý minh chứng',
        icon: FolderTree,
        path: '/evidence',
        permissionKey: 'evidence',
        hasSubmenu: true,
        active: () => router.pathname.includes('/evidence'),
        submenu: [
            {
                name: 'Tổng quan minh chứng',
                icon: Folder,
                path: '/evidence/evidence',
                permissionKey: 'evidence_overview',
                active: () => router.pathname === '/evidence/evidence'
            },
            {
                name: 'Cây minh chứng',
                icon: FolderTree,
                path: '/evidence/evidence-tree',
                permissionKey: 'evidence_tree',
                active: () => router.pathname === '/evidence/evidence-tree'
            },
            {
                name: 'Danh sách minh chứng',
                icon: Book,
                path: '/evidence/evidence-management',
                permissionKey: 'evidence_management',
                active: () => router.pathname === '/evidence/evidence-management'
            },
            {
                name: 'Thêm minh chứng mới',
                icon: Plus,
                path: '/evidence/create',
                permissionKey: 'evidence_create',
                active: () => router.pathname === '/evidence/create'
            },
            {
                name: 'Tạo/Chỉnh sửa cây minh chứng',
                icon: FolderTree,
                path: '/evidence/evidence-tree-create',
                permissionKey: 'evidence_tree_create',
                active: () => router.pathname === '/evidence/evidence-tree-create'
            },
            {
                name: 'Nhập batch minh chứng',
                icon: Upload,
                path: '/evidence/batch-upload',
                permissionKey: 'evidence_batch_upload',
                active: () => router.pathname === '/evidence/batch-upload'
            },
            {
                name: 'Phân quyền batch minh chứng',
                icon: Shield,
                path: '/evidence/batch-assign',
                permissionKey: 'evidence_batch_assign',
                active: () => router.pathname === '/evidence/batch-assign'
            },
            {
                name: 'Xóa batch minh chứng',
                icon: Archive,
                path: '/evidence/batch-delete',
                permissionKey: 'evidence_batch_delete',
                active: () => router.pathname === '/evidence/batch-delete'
            }
        ]
    },
    {
        name: 'Nhiệm vụ được giao',
        icon: CheckSquare,
        path: '/task/Task',
        permissionKey: 'task',
        hasSubmenu: false,
        active: () => router.pathname === '/task/Task'
    },
    {
        name: 'Báo cáo & Đánh giá',
        icon: FileSignature,
        path: '/reports',
        permissionKey: 'reports',
        hasSubmenu: true,
        active: () => router.pathname.includes('/reports') || router.pathname.includes('/assignments') || router.pathname.includes('/evaluations'),
        submenu: [
            {
                name: 'Danh sách báo cáo',
                icon: FileText,
                path: '/reports/reports',
                permissionKey: 'reports_list',
                active: () => router.pathname === '/reports/reports'
            },
            {
                name: 'Danh sách nhiệm vụ',
                icon: Target,
                path: '/reports/requests',
                permissionKey: 'reports_request',
                active: () => router.pathname === '/reports/requests'
            },
            {
                name: 'Tạo báo cáo mới',
                icon: Plus,
                path: '/reports/create',
                permissionKey: 'reports_create',
                active: () => router.pathname === '/reports/create'
            },
            {
                name: 'Tạo yêu cầu mới',
                icon: UserPlus,
                path: '/reports/create-request',
                permissionKey: 'reports_create_request',
                active: () => router.pathname === '/reports/create-request'
            },
            {
                name: 'Quản lý Phân quyền',
                icon: Shield,
                path: '/assignments/assignments-management',
                permissionKey: 'assignments',
                active: () => router.pathname === '/assignments/assignments-management'
            },
            {
                name: 'Phân quyền của tôi',
                icon: ClipboardCheck,
                path: '/assignments/my-assignments',
                permissionKey: 'assignments',
                active: () => router.pathname === '/assignments/my-assignments'
            },
            {
                name: 'Kết quả đánh giá báo cáo',
                icon: ClipboardCheck,
                path: '/evaluations/supervised-reports',
                permissionKey: 'evaluations_supervised',
                active: () => router.pathname === '/evaluations/supervised-reports'
            },
            {
                name: 'Đánh giá của tôi',
                icon: GraduationCap,
                path: '/evaluations/my-evaluations',
                permissionKey: 'evaluations_my',
                active: () => router.pathname === '/evaluations/my-evaluations'
            },
            {
                name: 'Phê duyệt báo cáo',
                icon: ClipboardCheck,
                path: '/evaluations/final-approvals',
                permissionKey: 'evaluations_approvals',
                active: () => router.pathname === '/evaluations/final-approvals'
            }
        ]
    },
    {
        name: 'Quản lý người dùng',
        icon: Users,
        path: '/users',
        permissionKey: 'users',
        hasSubmenu: true,
        active: () => router.pathname.includes('/users') || router.pathname.includes('/admin'),
        submenu: [
            {
                name: 'Danh sách người dùng',
                icon: Users,
                path: '/users/users',
                permissionKey: 'users_list',
                active: () => router.pathname === '/users/users'
            },
            {
                name: 'Thêm người dùng',
                icon: UserPlus,
                path: '/users/create',
                permissionKey: 'users_create',
                active: () => router.pathname === '/users/create'
            },
            {
                name: 'Chuyên gia đánh giá',
                icon: User,
                path: '/users/experts',
                permissionKey: 'users_experts',
                active: () => router.pathname === '/users/experts'
            },
            {
                name: 'Cán bộ quản lý',
                icon: UserCheck,
                path: '/users/managers',
                permissionKey: 'users_managers',
                active: () => router.pathname === '/users/managers'
            },
            {
                name: 'Nhóm người dùng',
                icon: Users,
                path: '/admin/user-groups',
                permissionKey: 'user_groups',
                active: () => router.pathname === '/admin/user-groups'
            },
            {
                name: 'Phân quyền',
                icon: Shield,
                path: '/admin/permissions',
                permissionKey: 'permissions',
                active: () => router.pathname === '/admin/permissions'
            },
            {
                name: 'Phòng ban',
                icon: Building2,
                path: '/users/departments',
                permissionKey: 'departments',
                active: () => router.pathname === '/users/departments'
            }
        ]
    },
    {
        name: 'Thông báo',
        icon: Bell,
        path: '/notifications/notifications',
        permissionKey: 'notifications',
        hasSubmenu: false,
        active: () => router.pathname === '/notifications/notifications'
    },
    {
        name: 'Thống kê & Báo cáo',
        icon: TrendingUp,
        path: '/analytics',
        permissionKey: 'analytics',
        hasSubmenu: true,
        active: () => router.pathname.includes('/analytics') || router.pathname.includes('/logs'),
        submenu: [
            {
                name: 'Dashboard thống kê',
                icon: BarChart3,
                path: '/analytics/dashboard',
                permissionKey: 'analytics_dashboard',
                active: () => router.pathname === '/analytics/dashboard'
            },
            {
                name: 'Báo cáo tổng hợp',
                icon: FileText,
                path: '/analytics/comprehensive',
                permissionKey: 'analytics_comprehensive',
                active: () => router.pathname === '/analytics/comprehensive'
            },
            {
                name: 'Nhật ký hoạt động',
                icon: Activity,
                path: '/analytics/logs',
                permissionKey: 'analytics_logs',
                active: () => router.pathname === '/analytics/logs'
            },
            {
                name: 'Xem hoạt động',
                icon: Eye,
                path: '/analytics/view',
                permissionKey: 'analytics_view',
                active: () => router.pathname === '/analytics/view'
            }
        ]
    },
    {
        name: 'Cấu hình hệ thống',
        icon: Settings,
        path: '/system',
        permissionKey: 'system',
        hasSubmenu: true,
        active: () => router.pathname.includes('/system'),
        submenu: [
            {
                name: 'Cài đặt chung',
                icon: Settings,
                path: '/system/system',
                permissionKey: 'system_settings',
                active: () => router.pathname === '/system/system'
            },
            {
                name: 'Sao lưu dữ liệu',
                icon: Archive,
                path: '/system/backup',
                permissionKey: 'system_backup',
                active: () => router.pathname === '/system/backup'
            },
            {
                name: 'Khôi phục dữ liêu',
                icon: Play,
                path: '/system/general',
                permissionKey: 'system_restore',
                active: () => router.pathname === '/system/general'
            },
            {
                name: 'Nhật ký hệ thống',
                icon: Activity,
                path: '/system/logs',
                permissionKey: 'system_logs',
                active: () => router.pathname === '/system/logs'
            },
            {
                name: 'Cấu hình mail',
                icon: Mail,
                path: '/system/mail',
                permissionKey: 'system_mail',
                active: () => router.pathname === '/system/mail'
            }
        ]
    }
]

// ============================================
// COMPONENT SIDEBAR
// ============================================
export default function Sidebar({ open, onClose, collapsed, onToggleCollapse, userRole = 'expert' }) {
    const router = useRouter()
    const [expandedMenus, setExpandedMenus] = useState({})
    const [searchQuery, setSearchQuery] = useState('')
    const [userPermissions, setUserPermissions] = useState([])
    const [debugInfo, setDebugInfo] = useState({})

    useEffect(() => {
        const effectiveRole = getEffectiveRole(userRole);
        const permissions = ROLE_PERMISSIONS[effectiveRole] || [];

        setUserPermissions(permissions)

        const menuItems = getAllMenuItems(router);
        const initialExpanded = {};
        menuItems.forEach((item, index) => {
            if (item.hasSubmenu && item.submenu && item.submenu.some(sub => sub.active())) {
                initialExpanded[index] = true;
            }
        });
        setExpandedMenus(initialExpanded);


        // DEBUG: Cập nhật thông tin gỡ lỗi
        setDebugInfo({
            userRole,
            normalizedRole: effectiveRole,
            permissionsCount: permissions.length,
            timestamp: new Date().toLocaleTimeString()
        })
    }, [userRole, router.pathname]) // Quan trọng: Re-run khi userRole hoặc route thay đổi

    const isMenuItemVisible = (permissionKey) => {
        // Nếu không có permission key, mặc định hiển thị
        if (!permissionKey) {
            return true
        }

        // Kiểm tra quyền
        return userPermissions.includes(permissionKey)
    }

    // Lọc các mục menu theo quyền
    const filterMenuItems = (items) => {
        return items
            // Bước 1: Lọc top-level items theo permissionKey của chính nó
            .filter(item => isMenuItemVisible(item.permissionKey))
            .map(item => {
                // Bước 2: Lọc submenu
                if (item.submenu) {
                    return {
                        ...item,
                        // Thêm hàm active cho submenu items để giữ tính nhất quán
                        submenu: item.submenu.map(sub => ({
                            ...sub,
                            active: () => router.pathname === sub.path
                        })).filter(sub => isMenuItemVisible(sub.permissionKey))
                    }
                }
                return item
            })
            // Bước 3: Lọc bỏ các top-level items không có submenu nào còn lại
            .filter(item => {
                if (item.hasSubmenu && item.submenu) {
                    return item.submenu.length > 0
                }
                return true
            })
    }

    const allMenuItems = getAllMenuItems(router)
    const filteredItems = filterMenuItems(allMenuItems).filter(item => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return item.name.toLowerCase().includes(query) ||
            (item.submenu && item.submenu.some(sub => sub.name.toLowerCase().includes(query)))
    })

    const handleNavigation = (path) => {
        router.push(path)
        if (window.innerWidth < 1024) {
            onClose && onClose()
        }
    }

    const toggleSubmenu = (index) => {
        setExpandedMenus(prev => ({
            ...prev,
            [index]: !prev[index]
        }))
    }

    // Logic ẩn/hiện sidebar khi click ra ngoài màn hình mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (window.innerWidth < 1024 && open) {
                const sidebar = document.getElementById('sidebar')
                const isToggleClick = document.getElementById('sidebar-toggle')?.contains(event.target);

                if (sidebar && !sidebar.contains(event.target) && !isToggleClick) {
                    onClose && onClose()
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open, onClose])


    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-30 lg:hidden transition-all duration-300"
                    onClick={onClose}
                    style={{
                        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                        opacity: 0.1,
                        backdropFilter: 'blur(8px)',
                        top: '80px'
                    }}
                />
            )}

            <aside
                id="sidebar"
                className={`${
                    open ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 fixed lg:fixed z-40 ${
                    collapsed ? 'w-20' : 'w-72'
                } bg-white shadow-2xl transform transition-all duration-300 ease-in-out border-r-2 flex flex-col`}
                style={{
                    top: '80px',
                    height: 'calc(100vh - 80px)',
                    borderColor: '#E5E7EB',
                    left: 0,
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)'
                }}
            >
                {/* DEBUG INFO - Chỉ hiện khi collapsed */}
                {collapsed && !searchQuery && (
                    <div className="p-2 text-xs text-gray-500 border-b text-center whitespace-nowrap overflow-hidden" title={JSON.stringify(debugInfo)}>
                        {debugInfo.normalizedRole}
                    </div>
                )}

                {/* SEARCH BAR */}
                {!collapsed && (
                    <div className="p-4 border-b-2 bg-white flex-shrink-0" style={{ borderColor: '#E5E7EB' }}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 text-sm border-2 rounded-xl focus:outline-none transition-all text-gray-700 font-medium bg-gray-50"
                                style={{ borderColor: '#E5E7EB' }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#1D4ED8'
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)'
                                    e.target.style.background = '#FFFFFF'
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#E5E7EB'
                                    e.target.style.boxShadow = 'none'
                                    e.target.style.background = '#F9FAFB'
                                }}
                            />
                        </div>
                    </div>
                )}

                {collapsed && (
                    <div className="p-4 border-b-2 bg-white flex-shrink-0 flex justify-center" style={{ borderColor: '#E5E7EB' }}>
                        <div className="p-2 rounded-xl bg-blue-50">
                            <Search className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                )}

                {/* NAVIGATION MENU */}
                <nav
                    className="flex-1 px-3 py-4 space-y-2 overflow-y-auto"
                    style={{
                        maxHeight: 'calc(100vh - 240px)',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#d5d8db #F1F5F9'
                    }}
                >
                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Lock className="h-8 w-8 text-gray-300 mb-3" />
                            <p className="text-gray-500 text-sm font-medium">Không có mục menu nào</p>
                            <p className="text-gray-400 text-xs mt-2">Role: {userRole}</p>
                        </div>
                    ) : (
                        filteredItems.map((item, index) => {
                            // Kiểm tra xem mục cha này có active không
                            const isParentActive = item.active();
                            const isChildActive = item.submenu?.some(sub => router.pathname === sub.path) || false;
                            const isActive = isParentActive || isChildActive;

                            // Xác định xem mục submenu có nên mở ra không
                            const shouldExpand = expandedMenus[index] || isChildActive;

                            return (
                                <div key={index}>
                                    {/* MAIN MENU ITEM */}
                                    <button
                                        onClick={() => {
                                            if (item.hasSubmenu) {
                                                toggleSubmenu(index)
                                            } else if (item.path) {
                                                handleNavigation(item.path)
                                            }
                                        }}
                                        className={`w-full flex items-center px-4 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 group ${
                                            isActive
                                                ? 'text-white shadow-xl'
                                                : 'hover:bg-blue-50'
                                        }`}
                                        style={isActive ? {
                                            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)'
                                        } : {
                                            color: '#4B5563'
                                        }}
                                        title={collapsed ? item.name : ''}
                                    >
                                        <item.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0 ${
                                            isActive ? 'text-white' : 'text-blue-600'
                                        }`} />
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 text-left truncate">{item.name}</span>
                                                {item.hasSubmenu && (
                                                    <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${
                                                        isActive ? 'text-white' : 'text-gray-500'
                                                    } ${shouldExpand ? 'rotate-180' : ''}`} />
                                                )}
                                            </>
                                        )}
                                    </button>

                                    {/* SUBMENU ITEMS */}
                                    {item.hasSubmenu && !collapsed && shouldExpand && (
                                        <div
                                            className="ml-4 mt-2 space-y-1 border-l-2 pl-4"
                                            style={{ borderColor: '#93C5FD' }}
                                        >
                                            {item.submenu && item.submenu.map((subItem, subIndex) => (
                                                <button
                                                    key={subIndex}
                                                    onClick={() => handleNavigation(subItem.path)}
                                                    className={`w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                                        router.pathname === subItem.path
                                                            ? 'text-blue-700 bg-blue-100'
                                                            : 'text-gray-600 hover:bg-blue-50'
                                                    }`}
                                                    title={subItem.name}
                                                >
                                                    <subItem.icon className={`h-4 w-4 mr-3 flex-shrink-0 ${
                                                        router.pathname === subItem.path ? 'text-blue-600' : 'text-gray-500'
                                                    }`} />
                                                    <span className="truncate text-left flex-1">{subItem.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </nav>

                {/* FOOTER COLLAPSE BUTTON */}
                <div className="p-4 border-t-2 bg-white flex-shrink-0" style={{ borderColor: '#E5E7EB' }}>
                    <button
                        onClick={onToggleCollapse}
                        className={`w-full flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
                            collapsed ? 'bg-blue-50' : 'bg-gradient-to-r from-blue-50 to-sky-50'
                        } hover:shadow-md`}
                        style={{ color: '#2563EB' }}
                        title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-5 w-5" />
                        ) : (
                            <>
                                <ChevronLeft className="h-5 w-5 mr-2" />
                                Thu gọn
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </>
    )
}