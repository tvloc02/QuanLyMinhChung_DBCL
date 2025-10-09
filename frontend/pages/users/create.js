import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import CreateUserForm from '../../components/users/CreateUserForm'
import { UserPlus } from 'lucide-react'

export default function CreateUserPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
        // Chỉ admin mới có quyền tạo user
        if (!isLoading && user && user.role !== 'admin') {
            router.replace('/users')
        }
    }, [user, isLoading, router])

    const breadcrumbItems = [
        { name: 'Quản lý người dùng', href: '/users' },
        { name: 'Thêm người dùng mới', icon: UserPlus }
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
            <CreateUserForm />
        </Layout>
    )
}