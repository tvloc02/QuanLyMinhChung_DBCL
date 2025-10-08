import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import PermissionsManagement from '../../components/admin/PermissionsManagement'
import { Shield } from 'lucide-react'

export default function PermissionsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
        // Chỉ admin mới có quyền quản lý permissions
        if (!isLoading && user && user.role !== 'admin') {
            router.replace('/dashboard')
        }
    }, [user, isLoading, router])

    const breadcrumbItems = [
        { name: 'Quản trị hệ thống', href: '/admin' },
        { name: 'Quản lý quyền', icon: Shield }
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    return (
        <Layout
            title="Quản lý quyền hệ thống"
            breadcrumbItems={breadcrumbItems}
        >
            <PermissionsManagement />
        </Layout>
    )
}