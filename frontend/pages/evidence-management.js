import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import EvidenceList from '../components/evidence/EvidenceList'
import EvidenceSearch from '../components/evidence/EvidenceSearch'
import BulkActions from '../components/evidence/BulkActions'
import { FileText } from 'lucide-react'

export default function EvidenceManagementPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [selectedEvidences, setSelectedEvidences] = useState([])
    const [filters, setFilters] = useState({})
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    const breadcrumbItems = [
        { name: 'Quản lý minh chứng', icon: FileText }
    ]

    const handleSearch = (query, searchFilters = {}) => {
        setSearchQuery(query)
        setFilters(searchFilters)
    }

    const handleSelectEvidence = (evidenceId) => {
        setSelectedEvidences(prev => {
            if (prev.includes(evidenceId)) {
                return prev.filter(id => id !== evidenceId)
            } else {
                return [...prev, evidenceId]
            }
        })
    }

    const handleSelectAll = (evidenceIds) => {
        setSelectedEvidences(evidenceIds)
    }

    const handleClearSelection = () => {
        setSelectedEvidences([])
    }

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
            title="Quản lý minh chứng"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <EvidenceSearch
                        onSearch={handleSearch}
                        defaultFilters={filters}
                    />
                </div>

                {selectedEvidences.length > 0 && (
                    <BulkActions
                        selectedCount={selectedEvidences.length}
                        selectedIds={selectedEvidences}
                        onClearSelection={handleClearSelection}
                    />
                )}

                <div className="bg-white rounded-lg shadow">
                    <EvidenceList
                        filters={filters}
                        searchQuery={searchQuery}
                        selectedEvidences={selectedEvidences}
                        onSelectEvidence={handleSelectEvidence}
                        onSelectAll={handleSelectAll}
                    />
                </div>
            </div>
        </Layout>
    )
}