import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import ProgramList from '../components/structure/ProgramList'
import StandardList from '../components/structure/StandardList'
import CriteriaList from '../components/structure/CriteriaList'
import {
    BookOpen,
    Building,
    FileText,
    Settings,
    BarChart3
} from 'lucide-react'

const TABS = {
    PROGRAMS: 'programs',
    STANDARDS: 'standards',
    CRITERIA: 'criteria'
}

export default function ProgramManagementPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState(TABS.PROGRAMS)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        // Get active tab from URL query if available
        const { tab } = router.query
        if (tab && Object.values(TABS).includes(tab)) {
            setActiveTab(tab)
        }
    }, [router.query])

    const handleTabChange = (tab) => {
        setActiveTab(tab)
        // Update URL without triggering a page reload
        router.push({
            pathname: router.pathname,
            query: { ...router.query, tab }
        }, undefined, { shallow: true })
    }

    const breadcrumbItems = [
        { name: 'Cấu trúc chương trình', icon: Settings }
    ]

    const tabs = [
        {
            key: TABS.PROGRAMS,
            label: 'Chương trình đánh giá',
            icon: BookOpen,
            description: 'Quản lý các chương trình đánh giá chất lượng'
        },
        {
            key: TABS.STANDARDS,
            label: 'Tiêu chuẩn',
            icon: BarChart3,
            description: 'Quản lý các tiêu chuẩn đánh giá'
        },
        {
            key: TABS.CRITERIA,
            label: 'Tiêu chí',
            icon: FileText,
            description: 'Quản lý các tiêu chí chi tiết'
        }
    ]

    const renderTabContent = () => {
        switch (activeTab) {
            case TABS.PROGRAMS:
                return <ProgramList />
            case TABS.STANDARDS:
                return <StandardList />
            case TABS.CRITERIA:
                return <CriteriaList />
            default:
                return <ProgramList />
        }
    }

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
            title="Cấu trúc chương trình"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Page Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Cấu trúc chương trình đánh giá
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Quản lý cấu trúc phân cấp: Chương trình → Tiêu chuẩn → Tiêu chí
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Building className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.key

                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={`${
                                            isActive
                                                ? 'border-blue-500 text-blue-600 bg-blue-50'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } flex items-center whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors duration-200 rounded-t-lg`}
                                    >
                                        <Icon className={`${
                                            isActive ? 'text-blue-500' : 'text-gray-400'
                                        } -ml-0.5 mr-2 h-4 w-4`} />
                                        <span>{tab.label}</span>
                                    </button>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Tab Description */}
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                        <p className="text-sm text-gray-600">
                            {tabs.find(tab => tab.key === activeTab)?.description}
                        </p>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {renderTabContent()}
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-medium text-blue-900 mb-3">
                        Hướng dẫn sử dụng
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                Chương trình đánh giá
                            </h4>
                            <ul className="space-y-1 text-xs">
                                <li>• Tạo và quản lý chương trình đánh giá</li>
                                <li>• Thiết lập thông tin cơ bản</li>
                                <li>• Phân quyền và gán tổ chức</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center">
                                <BarChart3 className="h-4 w-4 mr-1" />
                                Tiêu chuẩn
                            </h4>
                            <ul className="space-y-1 text-xs">
                                <li>• Định nghĩa tiêu chuẩn cho chương trình</li>
                                <li>• Thiết lập yêu cầu và kết quả mong đợi</li>
                                <li>• Sắp xếp thứ tự ưu tiên</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                Tiêu chí
                            </h4>
                            <ul className="space-y-1 text-xs">
                                <li>• Chi tiết hóa các tiêu chí đánh giá</li>
                                <li>• Liên kết với tiêu chuẩn tương ứng</li>
                                <li>• Quản lý minh chứng theo tiêu chí</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}