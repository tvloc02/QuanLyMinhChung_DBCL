import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import {
    BarChart3,
    FileText,
    Search,
    BookOpen,
    Building2,
    Target,
    CheckSquare,
    User,
    TrendingUp,
    Settings,
    Shield,
    Users,
    Database,
    GraduationCap,
    UserCheck,
    ChevronDown,
    ChevronRight,
    Menu,
    X,
    FolderTree,
    Upload,
    Calendar,
    ClipboardCheck,
    FileSignature,
    UserPlus,
    Bell,
    Activity,
    Archive,
    Home,
    Briefcase,
    Award,
    MessageSquare,
    Download,
    Eye,
    Folder
} from 'lucide-react'

export default function Sidebar({ open, onClose }) {
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [expandedMenus, setExpandedMenus] = useState({})

    // Auto-collapse trên màn hình nhỏ
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setCollapsed(true)
            } else {
                setCollapsed(false)
            }
        }

        // Set initial state
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const sidebarItems = [
        {
            name: 'Trang chủ',
            icon: Home,
            path: '/dashboard',
            active: router.pathname === '/dashboard'
        },

        // Quản lý năm học
        {
            name: 'Quản lý năm học',
            icon: Calendar,
            path: '/academic-years',
            hasSubmenu: true,
            active: router.pathname.includes('/academic-years'),
            submenu: [
                { name: 'Danh sách năm học', icon: Calendar, path: '/academic-years/academic-years' },
                { name: 'Tạo năm học mới', icon: UserPlus, path: '/academic-years/create' },
                { name: 'Sao chép năm học', icon: Archive, path: '/academic-years/copy' },
                { name: 'Cài đặt năm học', icon: Settings, path: '/academic-years/settings' }
            ]
        },

        // Cấu trúc đánh giá
        {
            name: 'Cấu trúc đánh giá',
            icon: Briefcase,
            path: '/evaluation-structure',
            hasSubmenu: true,
            active: router.pathname.includes('/programs') ||
                router.pathname.includes('/organizations') ||
                router.pathname.includes('/standards') ||
                router.pathname.includes('/criteria'),
            submenu: [
                { name: 'Chương trình đánh giá', icon: BookOpen, path: '/programs' },
                { name: 'Tổ chức đánh giá', icon: Building2, path: '/organizations' },
                { name: 'Tiêu chuẩn', icon: Target, path: '/standards' },
                { name: 'Tiêu chí', icon: CheckSquare, path: '/criteria' }
            ]
        },

        // Quản lý minh chứng
        {
            name: 'Quản lý minh chứng',
            icon: FolderTree,
            path: '/evidence',
            hasSubmenu: true,
            active: router.pathname.includes('/evidence') || router.pathname.includes('/files'),
            submenu: [
                { name: 'Cây minh chứng', icon: FolderTree, path: '/evidence/tree' },
                { name: 'Danh sách minh chứng', icon: Folder, path: '/evidence' },
                { name: 'Tìm kiếm minh chứng', icon: Search, path: '/evidence/search' },
                { name: 'Import minh chứng', icon: Upload, path: '/evidence/import' },
                { name: 'Quản lý files', icon: FileText, path: '/files' }
            ]
        },

        // Báo cáo và đánh giá
        {
            name: 'Báo cáo & Đánh giá',
            icon: FileSignature,
            path: '/reports',
            hasSubmenu: true,
            active: router.pathname.includes('/reports') ||
                router.pathname.includes('/assignments') ||
                router.pathname.includes('/evaluations'),
            submenu: [
                { name: 'Danh sách báo cáo', icon: FileText, path: '/reports' },
                { name: 'Tạo báo cáo mới', icon: UserPlus, path: '/reports/create' },
                { name: 'Phân công đánh giá', icon: ClipboardCheck, path: '/assignments' },
                { name: 'Kết quả đánh giá', icon: Award, path: '/evaluations' },
                { name: 'Xuất báo cáo', icon: Download, path: '/reports/export' }
            ]
        },

        // Quản lý người dùng
        {
            name: 'Quản lý người dùng',
            icon: Users,
            path: '/users',
            hasSubmenu: true,
            active: router.pathname.includes('/users'),
            submenu: [
                { name: 'Danh sách người dùng', icon: Users, path: '/users' },
                { name: 'Thêm người dùng', icon: UserPlus, path: '/users/create' },
                { name: 'Chuyên gia đánh giá', icon: User, path: '/users/experts' },
                { name: 'Cán bộ quản lý', icon: UserCheck, path: '/users/managers' },
                { name: 'Phân quyền', icon: Shield, path: '/users/permissions' }
            ]
        },

        // Thông báo
        {
            name: 'Thông báo',
            icon: Bell,
            path: '/notifications',
            active: router.pathname.includes('/notifications')
        },

        // Thống kê & Báo cáo
        {
            name: 'Thống kê & Báo cáo',
            icon: TrendingUp,
            path: '/analytics',
            hasSubmenu: true,
            active: router.pathname.includes('/analytics') || router.pathname.includes('/logs'),
            submenu: [
                { name: 'Dashboard thống kê', icon: BarChart3, path: '/analytics/dashboard' },
                { name: 'Báo cáo tổng hợp', icon: FileText, path: '/analytics/comprehensive' },
                { name: 'Nhật ký hoạt động', icon: Activity, path: '/logs' },
                { name: 'Xem hoạt động', icon: Eye, path: '/logs/view' }
            ]
        },

        // Dữ liệu đơn vị
        {
            name: 'Dữ liệu đơn vị',
            icon: Database,
            path: '/unit-data',
            hasSubmenu: true,
            active: router.pathname.includes('/unit-data'),
            submenu: [
                { name: 'Khoa', icon: GraduationCap, path: '/unit-data/faculties' },
                { name: 'Ngành học', icon: BookOpen, path: '/unit-data/majors' },
                { name: 'Nhân sự', icon: UserCheck, path: '/unit-data/personnel' },
                { name: 'Phòng ban', icon: Building2, path: '/unit-data/departments' }
            ]
        },

        // Cấu hình hệ thống
        {
            name: 'Cấu hình hệ thống',
            icon: Settings,
            path: '/system',
            hasSubmenu: true,
            active: router.pathname.includes('/system'),
            submenu: [
                { name: 'Cài đặt chung', icon: Settings, path: '/system/general' },
                { name: 'Sao lưu & Phục hồi', icon: Archive, path: '/system/backup' },
                { name: 'Nhật ký hệ thống', icon: Activity, path: '/system/logs' },
                { name: 'Bảo trì', icon: Settings, path: '/system/maintenance' }
            ]
        }
    ]

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

    const toggleCollapse = () => {
        setCollapsed(!collapsed)
    }

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (window.innerWidth < 1024 && open) {
                const sidebar = document.getElementById('sidebar')
                if (sidebar && !sidebar.contains(event.target)) {
                    onClose && onClose()
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open, onClose])

    return (
        <>
            {/* Overlay for mobile */}
            {open && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                id="sidebar"
                className={`${
                    open ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 ${
                    collapsed ? 'w-16' : 'w-72'
                } bg-white shadow-xl transform transition-all duration-300 ease-in-out lg:transform-none border-r border-gray-200 flex flex-col`}
                style={{ height: '100vh' }}
            >
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
                    {!collapsed && (
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">HỆ THỐNG TĐG</h2>
                            <p className="text-xs text-gray-500">CMC University</p>
                        </div>
                    )}
                    {collapsed && (
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                            <span className="text-white font-bold text-sm">TĐG</span>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleCollapse}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors hidden lg:block"
                            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                        >
                            {collapsed ? <ChevronRight className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
                            title="Đóng menu"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                    {sidebarItems.map((item, index) => {
                        return (
                            <div key={index} className="mb-1">
                                <button
                                    onClick={() => {
                                        if (item.hasSubmenu) {
                                            toggleSubmenu(index)
                                        } else {
                                            handleNavigation(item.path)
                                        }
                                    }}
                                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                                        item.active
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                    title={collapsed ? item.name : ''}
                                >
                                    <item.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0 ${
                                        item.active ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                                    }`} />
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1 text-left truncate">{item.name}</span>
                                            {item.hasSubmenu && (
                                                <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${
                                                    expandedMenus[index] ? 'rotate-180' : ''
                                                }`} />
                                            )}
                                        </>
                                    )}
                                </button>

                                {/* Submenu */}
                                {item.hasSubmenu && !collapsed && expandedMenus[index] && (
                                    <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                                        {item.submenu.map((subItem, subIndex) => (
                                            <button
                                                key={subIndex}
                                                onClick={() => handleNavigation(subItem.path)}
                                                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                                    router.pathname === subItem.path
                                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                                title={subItem.name}
                                            >
                                                <subItem.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                                                <span className="truncate">{subItem.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Divider between main groups */}
                                {!item.hasSubmenu && index < sidebarItems.length - 1 && !collapsed && (
                                    <div className="my-3">
                                        <hr className="border-gray-200" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* Footer - Fixed */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    {!collapsed ? (
                        <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">
                                Phiên bản 2.0.0
                            </p>
                            <p className="text-xs text-gray-400">
                                © 2025 CMC University
                            </p>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Hệ thống hoạt động bình thường"></div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    )
}