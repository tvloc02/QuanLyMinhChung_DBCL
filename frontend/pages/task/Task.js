import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import TaskList from '../../components/task/TaskList'
import { getLocalStorage } from '../../utils/helpers'
import Layout from '../../components/common/Layout'
import {FolderTree} from "lucide-react";


export default function TasksPage() {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = getLocalStorage('token')

        if (!token) {
            router.push('/login')
            return
        }

        // ✅ Tất cả roles (admin, manager, reporter, evaluator) đều có quyền xem
        // Chỉ cần token là được, không check role
        setIsAuthenticated(true)
        setLoading(false)
    }, [router])

    const breadcrumbItems = [
        { name: 'Nhiệm vụ được giao', icon: FolderTree }
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Đang tải trang...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <TaskList />
        </Layout>
    )
}