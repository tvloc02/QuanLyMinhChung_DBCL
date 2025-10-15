import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import Breadcrumb from './Breadcrumb'
import AIChat from './AIChat';


export default function Layout({ children, title, breadcrumbItems }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [isDesktop, setIsDesktop] = useState(true)

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1024)
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const sidebarWidth = isDesktop ? (sidebarCollapsed ? 80 : 288) : 0

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header - Fixed at top, full width */}
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

            <div className="flex flex-1" style={{ marginTop: '80px' }}>
                {/* Sidebar - Fixed, under header */}
                <Sidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                {/* Main Content - PHÓNG TO THẬT SỰ */}
                <div
                    className="flex flex-col transition-all duration-300"
                    style={{
                        marginLeft: `${sidebarWidth}px`,
                        width: `calc(100% - ${sidebarWidth}px)`,
                        minHeight: 'calc(100vh - 80px)'
                    }}
                >
                    {/* BỎ max-w-7xl để content tự do kéo dãn toàn màn hình */}
                    <main className="flex-grow p-6 overflow-y-auto w-full">
                        <div className="w-full">
                            {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}

                            {title && (
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                </div>
                            )}

                            {/* Children sẽ tự động chiếm toàn bộ width */}
                            {children}

                        </div>
                    </main>

                    <Footer collapsed={sidebarCollapsed} isDesktop={isDesktop} />
                </div>
            </div>
        </div>
    )
}