import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import UserPermissions from '../../components/users/UserPermissions'
import { Shield } from 'lucide-react'

export default function PermissionsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { id } = router.query

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
        // Chỉ admin mới có quyền phân quyền
        if (!isLoading && user && user.role !== 'admin') {
            router.replace('/users')
        }
    }, [user, isLoading, router])

    const breadcrumbItems = [
        { name: 'Quản lý người dùng', href: '/users' },
        { name: 'Phân quyền', icon: Shield }
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin' || !id) {
        return null
    }

    return (
        <Layout
            title="Phân quyền người dùng"
            breadcrumbItems={breadcrumbItems}
        >
            <UserPermissions userId={id} />
        </Layout>
    )
}