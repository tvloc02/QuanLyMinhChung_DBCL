import { ChevronRight, Home } from 'lucide-react'
import { useRouter } from 'next/router'

export default function Breadcrumb({ items = [] }) {
    const router = useRouter()

    const defaultItems = [
        { name: 'Trang chủ', href: '/dashboard', icon: Home }
    ]

    const breadcrumbItems = [...defaultItems, ...items]

    return (
        <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
                {breadcrumbItems.map((item, index) => (
                    <li key={index} className="flex items-center">
                        {index > 0 && (
                            <ChevronRight className="flex-shrink-0 h-4 w-4 mx-2" style={{ color: '#94A3B8' }} />
                        )}
                        {index === breadcrumbItems.length - 1 ? (
                            <span className="flex items-center text-sm font-semibold" style={{ color: '#1D4ED8' }}>
                                {item.icon && <item.icon className="flex-shrink-0 h-4 w-4 mr-1.5" />}
                                {item.name}
                            </span>
                        ) : (
                            <button
                                onClick={() => router.push(item.href)}
                                className="flex items-center text-sm font-medium hover:text-blue-600 transition-colors rounded-lg px-2 py-1 hover:bg-gray-50"
                                style={{ color: '#64748B' }}
                            >
                                {item.icon && <item.icon className="flex-shrink-0 h-4 w-4 mr-1.5" />}
                                {item.name}
                            </button>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}