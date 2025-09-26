import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import Breadcrumb from './Breadcrumb'

export default function Layout({ children, title, breadcrumbItems }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
            />

            <div className="flex">
                <Sidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <main className="flex-1 lg:ml-0 min-h-screen">
                    <div className="p-6 max-w-7xl mx-auto">
                        {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}

                        {title && (
                            <div className="mb-8">
                                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            </div>
                        )}

                        {children}
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    )
}