import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Plus,
    FileText,
    Loader2,
    BarChart3
} from 'lucide-react'
import ReportsStatusTabs from '../../components/reports/status/ReportsStatusTabs'

export default function ReportsManagement() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    const userRole = user?.role
    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin'

    const statusTabs = [
        { id: 'my_reports', label: 'Báo cáo của tôi', roles: ['reporter', 'manager', 'admin'], statusQuery: 'createdBy=me&status=' },
        { id: 'needs_review', label: 'Chờ duyệt', roles: ['manager', 'admin'], statusQuery: 'status=submitted,public' },
        { id: 'approved', label: 'Đã duyệt', roles: ['manager', 'admin'], statusQuery: 'status=approved' },
        { id: 'rejected', label: 'Đã từ chối', roles: ['manager', 'admin'], statusQuery: 'status=rejected' },
        { id: 'assigned_review', label: 'Đã phân quyền đánh giá', roles: ['manager', 'admin'], statusQuery: 'evaluations=assigned' },
        { id: 'evaluated', label: 'Đã đánh giá', roles: ['manager', 'admin'], statusQuery: 'evaluations=completed' },
        { id: 'published', label: 'Đã Phát hành', roles: ['manager', 'admin', 'reporter'], statusQuery: 'status=published' },
        { id: 'all_reports', label: 'Tất cả Báo cáo', roles: ['manager', 'admin'], statusQuery: 'status=' },
    ].filter(tab => tab.roles.includes(userRole))

    const [activeTab, setActiveTab] = useState(statusTabs[0]?.id || 'my_reports')

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (statusTabs.length > 0 && activeTab !== statusTabs[0].id) {
            setActiveTab(statusTabs[0].id);
        }
    }, [userRole, statusTabs.length])


    const breadcrumbItems = [
        { name: 'Trang chủ', href: '/', icon: FileText },
        { name: 'Quản lý báo cáo' }
    ]


    if (isLoading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Quản lý báo cáo</h1>
                                <p className="text-blue-100">
                                    Quản lý và đánh giá các báo cáo trong hệ thống
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {isManagerOrAdmin && (
                                <button
                                    onClick={() => router.push('/reports/evaluations')}
                                    className="inline-flex items-center px-6 py-3 bg-white bg-opacity-20 text-white rounded-xl hover:bg-opacity-30 transition-all font-semibold"
                                >
                                    <BarChart3 className="h-5 w-5 mr-2" />
                                    Đánh giá
                                </button>
                            )}
                            <button
                                onClick={() => router.push('/reports/create')}
                                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-xl transition-all font-semibold"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Tạo báo cáo mới
                            </button>
                        </div>
                    </div>
                </div>

                <ReportsStatusTabs
                    statusTabs={statusTabs}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    userRole={userRole}
                    userId={user._id}
                />

            </div>
        </Layout>
    )
}