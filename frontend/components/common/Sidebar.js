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
    ChevronLeft,
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
    Folder,
    Mail,
    Plus,
    Book,
    Play
} from 'lucide-react'

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }) {
    const router = useRouter()
    const [expandedMenus, setExpandedMenus] = useState({})
    const [searchQuery, setSearchQuery] = useState('')

    const sidebarItems = [
        {
            name: 'Trang chủ',
            icon: Home,
            path: '/dashboard',
            active: router.pathname === '/dashboard'
        },
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
            ]
        },
        {
            name: 'Cấu trúc đánh giá',
            icon: Briefcase,
            path: '/evaluation-structure',
            hasSubmenu: true,
            active: router.pathname.includes('/evaluation-structure/programs') ||
                router.pathname.includes('/evaluation-structure/organizations') ||
                router.pathname.includes('/evaluation-structure/standards') ||
                router.pathname.includes('/evaluation-structure/criteria'),
            submenu: [
                { name: 'Chương trình đánh giá', icon: BookOpen, path: '/evaluation-structure/programs' },
                { name: 'Tổ chức đánh giá', icon: Building2, path: '/evaluation-structure/organizations' },
                { name: 'Tiêu chuẩn', icon: Target, path: '/evaluation-structure/standards' },
                { name: 'Tiêu chí', icon: CheckSquare, path: '/evaluation-structure/criteria' }
            ]
        },
        {
            name: 'Quản lý minh chứng',
            icon: FolderTree,
            path: '/evidence',
            hasSubmenu: true,
            active: router.pathname.includes('/evidence') || router.pathname.includes('/files'),
            submenu: [
                { name: 'Tổng quan minh chứng', icon: Folder, path: '/evidence/evidence' },
                { name: 'Cây minh chứng', icon: FolderTree, path: '/evidence/evidence-tree' },
                { name: 'Danh sách minh chứng', icon: Book, path: '/evidence/evidence-management' },
                { name: 'Thêm minh chứng mới', icon: Plus, path: '/evidence/create' },
            ]
        },
        {
            name: 'Báo cáo & Đánh giá',
            icon: FileSignature,
            path: '/reports',
            hasSubmenu: true,
            active: router.pathname.includes('/reports') ||
                router.pathname.includes('/assignments') ||
                router.pathname.includes('/evaluations'),
            submenu: [
                { name: 'Danh sách báo cáo', icon: FileText, path: '/reports/reports' },
                { name: 'Tạo báo cáo mới', icon: UserPlus, path: '/reports/create' },
                { name: 'Tổng quan báo cáo', icon: ClipboardCheck, path: '/reports/expert-assignments' },
                { name: 'Đánh giá báo cáo', icon: Award, path: '/reports/evaluations/index' },
                { name: 'Xuất báo cáo', icon: Download, path: '/reports/export' },
                { name: 'Đánh giá của tôi', icon: Download, path: '/reports/evaluations' },
            ]
        },
        {
            name: 'Quản lý người dùng',
            icon: Users,
            path: '/users',
            hasSubmenu: true,
            active: router.pathname.includes('/users'),
            submenu: [
                { name: 'Danh sách người dùng', icon: Users, path: '/users/users' },
                { name: 'Thêm người dùng', icon: UserPlus, path: '/users/create' },
                { name: 'Chuyên gia đánh giá', icon: User, path: '/users/experts' },
                { name: 'Cán bộ quản lý', icon: UserCheck, path: '/users/managers' },
                { name: 'Nhóm người dùng', icon: Users, path: '/admin/user-groups' },
                { name: 'Phân quyền', icon: Shield, path: '/admin/permissions' }
            ]
        },
        {
            name: 'Thông báo',
            icon: Bell,
            path: '/notifications/notifications',
            active: router.pathname.includes('/notifications/notifications')
        },
        {
            name: 'Thống kê & Báo cáo',
            icon: TrendingUp,
            path: '/analytics',
            hasSubmenu: true,
            active: router.pathname.includes('/analytics') || router.pathname.includes('/logs'),
            submenu: [
                { name: 'Dashboard thống kê', icon: BarChart3, path: '/analytics/dashboard' },
                { name: 'Báo cáo tổng hợp', icon: FileText, path: '/analytics/comprehensive' },
                { name: 'Nhật ký hoạt động', icon: Activity, path: '/analytics/logs' },
                { name: 'Xem hoạt động', icon: Eye, path: '/analytics/view' }
            ]
        },
        {
            name: 'Cấu hình hệ thống',
            icon: Settings,
            path: '/system',
            hasSubmenu: true,
            active: router.pathname.includes('/system/system'),
            submenu: [
                { name: 'Cài đặt chung', icon: Settings, path: '/system/system' },
                { name: 'Sao lưu dữ liệu', icon: Archive, path: '/system/backup' },
                { name: 'Khôi phục dữ liêu', icon: Play, path: '/system/general' },
                { name: 'Nhật ký hệ thống', icon: Activity, path: '/system/logs' },
                { name: 'Cấu hình mail', icon: Mail, path: '/system/mail' }
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

    const filteredItems = sidebarItems.filter(item => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return item.name.toLowerCase().includes(query) ||
            (item.submenu && item.submenu.some(sub => sub.name.toLowerCase().includes(query)))
    })

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-30 lg:hidden transition-all duration-300"
                    onClick={onClose}
                    style={{
                        // Đã đổi từ tím/indigo sang xanh lam
                        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
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
                                    // Đã đổi từ tím/indigo sang xanh lam
                                    e.target.style.borderColor = '#1D4ED8' // Blue 800
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)' // Blue 500 opacity
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
                        {/* Đã đổi từ indigo-50 sang blue-50, indigo-600 sang blue-600 */}
                        <div className="p-2 rounded-xl bg-blue-50">
                            <Search className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                )}

                <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto"
                     style={{
                         maxHeight: 'calc(100vh - 240px)',
                         scrollbarWidth: 'thin',
                         scrollbarColor: '#d5d8db #F1F5F9'
                     }}>
                    {filteredItems.map((item, index) => {
                        return (
                            <div key={index}>
                                <button
                                    onClick={() => {
                                        if (item.hasSubmenu) {
                                            toggleSubmenu(index)
                                        } else {
                                            handleNavigation(item.path)
                                        }
                                    }}
                                    className={`w-full flex items-center px-4 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 group ${
                                        item.active
                                            ? 'text-white shadow-xl'
                                            : 'hover:bg-blue-50' // Đã đổi từ indigo-50 sang blue-50
                                    }`}
                                    style={item.active ? {
                                        // Đã đổi từ Indigo 500/Purple 500 sang Blue 500/Blue 600
                                        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                        // Đã đổi từ rgba(99, 102, 241, 0.4) sang Blue 500 opacity
                                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)'
                                    } : {
                                        color: '#4B5563'
                                    }}
                                    title={collapsed ? item.name : ''}
                                >
                                    <item.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0 ${
                                        item.active ? 'text-white' : 'text-blue-600' // Đã đổi từ indigo-600 sang blue-600
                                    }`} />
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1 text-left truncate">{item.name}</span>
                                            {item.hasSubmenu && (
                                                <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${
                                                    item.active ? 'text-white' : 'text-gray-500' // Giữ màu cho icon Chevron
                                                } ${expandedMenus[index] ? 'rotate-180' : ''}`} />
                                            )}
                                        </>
                                    )}
                                </button>

                                {item.hasSubmenu && !collapsed && expandedMenus[index] && (
                                    <div className="ml-4 mt-2 space-y-1 border-l-2 pl-4"
                                        // Đã đổi từ C7D2FE (Indigo 200) sang 93C5FD (Blue 300)
                                         style={{ borderColor: '#93C5FD' }}>
                                        {item.submenu.map((subItem, subIndex) => (
                                            <button
                                                key={subIndex}
                                                onClick={() => handleNavigation(subItem.path)}
                                                className={`w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                                    router.pathname === subItem.path
                                                        ? 'text-blue-700 bg-blue-100' // Đã đổi từ indigo-700/indigo-100 sang blue-700/blue-100
                                                        : 'text-gray-600 hover:bg-blue-50' // Đã đổi từ indigo-50 sang blue-50
                                                }`}
                                                title={subItem.name}
                                            >
                                                <subItem.icon className={`h-4 w-4 mr-3 flex-shrink-0 ${
                                                    router.pathname === subItem.path ? 'text-blue-600' : 'text-gray-500' // Đã đổi từ indigo-600 sang blue-600
                                                }`} />
                                                <span className="truncate">{subItem.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                <div className="p-4 border-t-2 bg-white flex-shrink-0" style={{ borderColor: '#E5E7EB' }}>
                    <button
                        onClick={onToggleCollapse}
                        className={`w-full flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
                            collapsed ? 'bg-blue-50' : 'bg-gradient-to-r from-blue-50 to-sky-50' // Đã đổi từ indigo-50/purple-50 sang blue-50/sky-50
                        } hover:shadow-md`}
                        // Đã đổi từ #496ced sang Blue 600
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