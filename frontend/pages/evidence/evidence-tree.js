import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { debounce } from '../../utils/debounce'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import EvidenceTree from '../../components/evidence/EvidenceTree'
import { FolderTree } from 'lucide-react'

export default function EvidenceTreePage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    const breadcrumbItems = [
        { name: 'Cây minh chứng', icon: FolderTree }
    ]

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
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <EvidenceTree />
        </Layout>
    )
}