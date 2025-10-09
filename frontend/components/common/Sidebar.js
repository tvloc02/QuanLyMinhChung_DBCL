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
    Folder,
    Mail,
    Plus, Book
} from 'lucide-react'

export default function Sidebar({ open, onClose }) {
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [expandedMenus, setExpandedMenus] = useState({})

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setCollapsed(true)
            } else {
                setCollapsed(false)
            }
        }

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
                { name: 'Import minh chứng', icon: Upload, path: '/evidence/import-evidence' }
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
                { name: 'Phân công đánh giá', icon: ClipboardCheck, path: '/reports/assignments' },
                { name: 'Kết quả đánh giá', icon: Award, path: '/reports/evaluations' },
                { name: 'Xuất báo cáo', icon: Download, path: '/reports/export' }
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
                { name: 'Phân quyền', icon: Shield, path: '/users/permissions' },
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
                { name: 'Sao lưu & Phục hồi', icon: Archive, path: '/system/backup' },
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

    const toggleCollapse = () => {
        setCollapsed(!collapsed)
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

    return (
        <>
            {/* Overlay for mobile */}
            {open && (
                <div
                    className="fixed inset-0 z-30 lg:hidden transition-opacity"
                    onClick={onClose}
                    style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(4px)'
                    }}
                />
            )}

            <aside
                id="sidebar"
                className={`${
                    open ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 ${
                    collapsed ? 'w-20' : 'w-72'
                } bg-white shadow-xl transform transition-all duration-300 ease-in-out lg:transform-none border-r flex flex-col`}
                style={{
                    height: '100vh',
                    borderColor: '#E2E8F0'
                }}
            >
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-5 border-b bg-white flex-shrink-0"
                     style={{ borderColor: '#E2E8F0' }}>
                    {!collapsed && (
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: '#1E293B' }}>HỆ THỐNG TĐG</h2>
                            <p className="text-xs" style={{ color: '#64748B' }}>CMC University</p>
                        </div>
                    )}
                    {collapsed && (
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl"
                             style={{ background: 'linear-gradient(135deg, #5B52E1 0%, #3B82F6 100%)' }}>
                            <span className="text-white font-bold text-sm">TĐG</span>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleCollapse}
                            className="p-2 rounded-xl hover:bg-gray-50 transition-colors hidden lg:block"
                            style={{ color: '#64748B' }}
                            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                        >
                            {collapsed ? <ChevronRight className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-gray-50 transition-colors lg:hidden"
                            style={{ color: '#64748B' }}
                            title="Đóng menu"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto"
                     style={{ maxHeight: 'calc(100vh - 140px)' }}>
                    {sidebarItems.map((item, index) => {
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
                                    className={`w-full flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                                        item.active
                                            ? 'text-white shadow-lg'
                                            : 'hover:bg-gray-50'
                                    }`}
                                    style={item.active ? {
                                        background: 'linear-gradient(135deg, #5B52E1 0%, #3B82F6 100%)',
                                        boxShadow: '0 4px 12px rgba(91, 82, 225, 0.25)'
                                    } : {
                                        color: '#64748B'
                                    }}
                                    title={collapsed ? item.name : ''}
                                >
                                    <item.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0 ${
                                        item.active ? 'text-white' : ''
                                    }`} style={!item.active ? { color: '#94A3B8' } : {}} />
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
                                    <div className="ml-4 mt-1.5 space-y-1 border-l-2 pl-4"
                                         style={{ borderColor: '#E2E8F0' }}>
                                        {item.submenu.map((subItem, subIndex) => (
                                            <button
                                                key={subIndex}
                                                onClick={() => handleNavigation(subItem.path)}
                                                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                                                    router.pathname === subItem.path
                                                        ? 'font-semibold'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                                style={router.pathname === subItem.path ? {
                                                    background: 'rgba(91, 82, 225, 0.08)',
                                                    color: '#5B52E1'
                                                } : {
                                                    color: '#64748B'
                                                }}
                                                title={subItem.name}
                                            >
                                                <subItem.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                                                <span className="truncate">{subItem.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>
            </aside>
        </>
    )
}