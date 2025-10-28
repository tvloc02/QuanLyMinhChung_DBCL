import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { debounce } from '../../utils/debounce'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { Plus, Upload } from 'lucide-react'
import AddEvidenceManual from '../../components/evidence/AddEvidenceManual'

export default function AddEvidencePage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    // Đã xóa state activeTab

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    const breadcrumbItems = [
        { name: 'Quản lý minh chứng', href: '/evidence/evidence-management', icon: Plus },
        { name: 'Thêm minh chứng', icon: Plus }
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6">
                        <AddEvidenceManual />
                    </div>
                </div>
            </div>
        </Layout>
    )
}