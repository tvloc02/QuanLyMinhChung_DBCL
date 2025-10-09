import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { debounce } from '../../utils/debounce'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { Plus, Upload } from 'lucide-react'
import AddEvidenceManual from '../../components/evidence/AddEvidenceManual'
import AddEvidenceImport from '../../components/evidence/AddEvidenceImport'

export default function AddEvidencePage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('manual')

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
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('manual')}
                                className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'manual'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Plus className="h-5 w-5" />
                                <span>Thêm thủ công</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('import')}
                                className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'import'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Upload className="h-5 w-5" />
                                <span>Import từ Excel</span>
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'manual' ? (
                            <AddEvidenceManual />
                        ) : (
                            <AddEvidenceImport />
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    )
}