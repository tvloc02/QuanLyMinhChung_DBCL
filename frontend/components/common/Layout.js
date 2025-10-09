import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import Breadcrumb from './Breadcrumb'

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

    // Tính toán margin và width để content kéo dãn
    const getContentStyles = () => {
        if (!isDesktop) {
            return {
                marginLeft: '0',
                width: '100%'
            }
        }

        const sidebarWidth = sidebarCollapsed ? 80 : 288
        return {
            marginLeft: `${sidebarWidth}px`,
            width: `calc(100% - ${sidebarWidth}px)`
        }
    }

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

                {/* Main Content - Kéo dãn theo sidebar */}
                <div
                    className="flex flex-col flex-1 transition-all duration-300"
                    style={getContentStyles()}
                >
                    <main className="flex-grow p-6 overflow-y-auto w-full">
                        <div className="max-w-7xl mx-auto w-full">
                            {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}

                            {title && (
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                                </div>
                            )}

                            {children}
                        </div>
                    </main>

                    <Footer collapsed={sidebarCollapsed} isDesktop={isDesktop} />
                </div>
            </div>
        </div>
    )
}