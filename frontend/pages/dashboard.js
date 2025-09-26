import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import Dashboard from '../components/reports/Dashboard'

export default function DashboardPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout>
            <Dashboard />
        </Layout>
    )
}