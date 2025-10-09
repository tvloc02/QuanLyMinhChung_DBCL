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

    const getMarginLeft = () => {
        if (!isDesktop) return '0'
        return sidebarCollapsed ? '80px' : '288px'
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

                {/* Main Content */}
                <div
                    className="flex flex-col flex-1 transition-all duration-300"
                    style={{
                        marginLeft: getMarginLeft()
                    }}
                >
                    <main className="flex-grow p-6 overflow-y-auto max-w-7xl mx-auto w-full">
                        {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}

                        {title && (
                            <div className="mb-8">
                                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            </div>
                        )}

                        {children}
                    </main>

                    <Footer />
                </div>
            </div>
        </div>
    )
}