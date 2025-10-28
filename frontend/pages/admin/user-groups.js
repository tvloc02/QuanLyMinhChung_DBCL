import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import UserGroupsManagement from '../../components/admin/UserGroupsManagement'
import { Users } from 'lucide-react'

export default function UserGroupsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
        // Chỉ admin mới có quyền quản lý user groups
        if (!isLoading && user && user.role !== 'admin') {
            router.replace('/dashboard')
        }
    }, [user, isLoading, router])

    const breadcrumbItems = [
        { name: 'Quản trị hệ thống', href: '/admin' },
        { name: 'Quản lý nhóm người dùng', icon: Users }
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
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <UserGroupsManagement />
        </Layout>
    )
}