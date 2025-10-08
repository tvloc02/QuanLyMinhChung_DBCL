import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import Breadcrumb from './Breadcrumb'

export default function Layout({ children, title, breadcrumbItems }) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <div className="flex flex-col flex-1">
                <Header />

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
    )
}
