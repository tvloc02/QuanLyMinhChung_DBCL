import { useState } from 'react'
import { useRouter } from 'next/router'
import {
    BarChart3,
    FileText,
    Search,
    BookOpen,
    Stamp,
    Send,
    Target,
    CheckSquare,
    User,
    TrendingUp,
    Settings,
    Shield,
    Users,
    FileSignature,
    Database,
    GraduationCap,
    Building2,
    UserCheck,
    ChevronDown,
    ChevronRight,
    Menu,
    X
} from 'lucide-react'

export default function Sidebar({ open, onClose }) {
    const router = useRouter()
    const [collapsed, setCollapsed] = useState(false)
    const [expandedMenus, setExpandedMenus] = useState({})

    const sidebarItems = [
        {
            name: 'Trang chủ',
            icon: BarChart3,
            path: '/dashboard',
            active: router.pathname === '/dashboard'
        },
        {
            name: 'Trình ký minh chứng',
            icon: FileSignature,
            path: '/evidence-signing',
            active: router.pathname.includes('/evidence-signing')
        },
        {
            name: 'Tra cứu minh chứng',
            icon: Search,
            path: '/evidence-lookup',
            active: router.pathname.includes('/evidence-lookup')
        },
        {
            name: 'Chương trình đánh giá',
            icon: BookOpen,
            path: '/assessment-program',
            active: router.pathname.includes('/assessment-program')
        },
        {
            name: 'Đóng dấu',
            icon: Stamp,
            path: '/stamping',
            active: router.pathname.includes('/stamping')
        },
        {
            name: 'Ban hành',
            icon: Send,
            path: '/publishing',
            active: router.pathname.includes('/publishing')
        },
        {
            name: 'Tiêu chuẩn',
            icon: Target,
            path: '/standards',
            active: router.pathname.includes('/standards')
        },
        {
            name: 'Tiêu chí',
            icon: CheckSquare,
            path: '/criteria',
            active: router.pathname.includes('/criteria')
        },
        {
            name: 'Chuyên gia',
            icon: User,
            path: '/experts',
            active: router.pathname.includes('/experts')
        },
        {
            name: 'Báo cáo',
            icon: TrendingUp,
            path: '/reports',
            active: router.pathname.includes('/reports')
        },
        {
            name: 'Cấu hình',
            icon: Settings,
            path: '/configuration',
            hasSubmenu: true,
            active: router.pathname.includes('/configuration'),
            submenu: [
                { name: 'Phân quyền', icon: Shield, path: '/configuration/authorization' },
                { name: 'Nhóm người dùng', icon: Users, path: '/configuration/user-groups' },
                { name: 'Thông tin ký', icon: FileSignature, path: '/configuration/signing-info' }
            ]
        },
        {
            name: 'Dữ liệu đơn vị',
            icon: Database,
            path: '/unit-data',
            hasSubmenu: true,
            active: router.pathname.includes('/unit-data'),
            submenu: [
                { name: 'Khoa', icon: GraduationCap, path: '/unit-data/faculties' },
                { name: 'Ngành', icon: Building2, path: '/unit-data/departments' },
                { name: 'Nhân sự', icon: UserCheck, path: '/unit-data/personnel' }
            ]
        },
        {
            name: 'Lịch sử sử dụng',
            icon: TrendingUp,
            path: '/history',
            active: router.pathname.includes('/history')
        }
    ]

    const handleNavigation = (path) => {
        router.push(path)
        onClose && onClose()
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

    return (
        <>
            {/* Overlay for mobile */}
            {open && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`${
                open ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 ${
                collapsed ? 'w-16' : 'w-64'
            } bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:transform-none`}>
                <div className="flex flex-col h-full">
                    {/* Header with toggle button */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        {!collapsed && (
                            <h2 className="text-lg font-semibold text-gray-800">Thao tác</h2>
                        )}
                        <button
                            onClick={toggleCollapse}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors hidden lg:block"
                        >
                            {collapsed ? <ChevronRight className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                        {sidebarItems.map((item, index) => {
                            if (item.type === 'divider') {
                                return null; // Remove the old divider logic
                            }

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
                                        className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors group ${
                                            item.active
                                                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                        title={collapsed ? item.name : ''}
                                    >
                                        <item.icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 text-left">{item.name}</span>
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
                                        <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                                            {item.submenu.map((subItem, subIndex) => (
                                                <button
                                                    key={subIndex}
                                                    onClick={() => handleNavigation(subItem.path)}
                                                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                                        router.pathname === subItem.path
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <subItem.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                                                    {subItem.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Divider after each main menu item (except last and submenu items) */}
                                    {index < sidebarItems.length - 1 && !collapsed && (
                                        <div className="my-2">
                                            <hr className="border-gray-200" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200">
                        {!collapsed && (
                            <p className="text-xs text-gray-500 text-center">
                                © 2025 CMC University
                            </p>
                        )}
                    </div>
                </div>
            </aside>
        </>
    )
}