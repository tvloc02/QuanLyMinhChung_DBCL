import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Plus,
    FileText,
    Loader2,
    BarChart3,
    ClipboardCheck,
    ListTodo
} from 'lucide-react'
import ReportsStatusTabs from '../../components/reports/status/ReportsStatusTabs'

// Định nghĩa cấu trúc tabs cho từng loại báo cáo
const overallTdgTabs = [
    { id: 'my_reports', label: 'Báo cáo của tôi', roles: ['reporter', 'manager', 'admin'], statusQuery: 'type=overall_tdg&createdBy=me&status=' },
    { id: 'tdg_needs_review', label: 'Chờ duyệt', roles: ['manager', 'admin'], statusQuery: 'type=overall_tdg&status=submitted,public' },
    { id: 'tdg_approved', label: 'Đã duyệt', roles: ['manager', 'admin'], statusQuery: 'type=overall_tdg&status=approved' },
    { id: 'tdg_evaluated', label: 'Đang/Đã đánh giá', roles: ['manager', 'admin'], statusQuery: 'type=overall_tdg&status=in_evaluation,published' },
    { id: 'tdg_published', label: 'Đã Phát hành', roles: ['manager', 'admin', 'reporter'], statusQuery: 'type=overall_tdg&status=published' },
    { id: 'tdg_all', label: 'Tất cả Báo cáo TĐG', roles: ['manager', 'admin'], statusQuery: 'type=overall_tdg&status=' },
];

const standardCriteriaTabs = [
    { id: 'my_reports_sc', label: 'Báo cáo của tôi', roles: ['reporter', 'manager', 'admin'], statusQuery: 'type=standard,criteria&createdBy=me&status=' },
    { id: 'sc_needs_review', label: 'Chờ duyệt', roles: ['manager', 'admin'], statusQuery: 'type=standard,criteria&status=submitted,public' },
    { id: 'sc_approved', label: 'Đã duyệt', roles: ['manager', 'admin'], statusQuery: 'type=standard,criteria&status=approved' },
    { id: 'sc_rejected', label: 'Đã từ chối', roles: ['manager', 'admin', 'reporter'], statusQuery: 'type=standard,criteria&status=rejected' },
    { id: 'sc_published', label: 'Đã Phát hành', roles: ['manager', 'admin', 'reporter'], statusQuery: 'type=standard,criteria&status=published' },
    { id: 'sc_all', label: 'Tất cả Tiêu chuẩn/Tiêu chí', roles: ['manager', 'admin'], statusQuery: 'type=standard,criteria&status=' },
];

// Tabs cho Evaluator (chỉ xem Báo cáo Tổng hợp TĐG được giao)
const evaluatorTabs = [
    { id: 'tdg_assigned', label: 'Báo cáo được giao', roles: ['evaluator'], statusQuery: 'type=overall_tdg&assigned=true&status=' }, // Sẽ cần logic backend để lọc theo assignment
    { id: 'tdg_undone', label: 'Chưa đánh giá', roles: ['evaluator'], statusQuery: 'type=overall_tdg&assigned=true&status=accepted,in_progress' }, // Giả định assignment status
    { id: 'tdg_done', label: 'Đã hoàn thành', roles: ['evaluator'], statusQuery: 'type=overall_tdg&assigned=true&status=completed' }, // Giả định assignment status
];

export default function ReportsManagement() {
    const router = useRouter()
    const { user, isLoading } = useAuth()

    const userRole = user?.role
    const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin'
    const isReporter = userRole === 'reporter'

    // Xác định bộ tabs chính
    let primaryTabsConfig;
    if (userRole === 'evaluator') {
        primaryTabsConfig = [
            { id: 'evaluations', label: 'Báo cáo Đánh giá TĐG', icon: ClipboardCheck, tabs: evaluatorTabs.filter(tab => tab.roles.includes(userRole)) }
        ]
    } else {
        primaryTabsConfig = [
            { id: 'overall_tdg', label: 'Báo cáo TĐG', icon: ClipboardCheck, tabs: overallTdgTabs.filter(tab => tab.roles.includes(userRole)) },
            { id: 'standard_criteria', label: 'Tiêu chuẩn/Tiêu chí', icon: ListTodo, tabs: standardCriteriaTabs.filter(tab => tab.roles.includes(userRole)) }
        ]
    }

    // Đặt tab chính đầu tiên là tab đang active
    const [activePrimaryTab, setActivePrimaryTab] = useState(primaryTabsConfig[0]?.id || 'overall_tdg')

    const currentPrimaryTab = primaryTabsConfig.find(tab => tab.id === activePrimaryTab);
    const secondaryTabs = currentPrimaryTab?.tabs || [];

    // Đặt tab phụ đầu tiên là tab đang active
    const [activeSecondaryTab, setActiveSecondaryTab] = useState(secondaryTabs[0]?.id || 'my_reports')

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (primaryTabsConfig.length > 0 && activePrimaryTab !== primaryTabsConfig[0].id) {
            setActivePrimaryTab(primaryTabsConfig[0].id)
        }
    }, [userRole])

    useEffect(() => {
        if (secondaryTabs.length > 0 && activeSecondaryTab !== secondaryTabs[0].id) {
            setActiveSecondaryTab(secondaryTabs[0].id)
        }
    }, [activePrimaryTab])


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
                            {(isManagerOrAdmin || isReporter) && (
                                <button
                                    onClick={() => router.push('/reports/create')}
                                    className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-xl transition-all font-semibold"
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Tạo báo cáo mới
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Primary Tabs: Loại báo cáo */}
                <div className="flex border-b border-gray-200">
                    {primaryTabsConfig.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActivePrimaryTab(tab.id)}
                            className={`px-4 py-3 font-semibold transition-all text-base flex items-center space-x-2 ${
                                activePrimaryTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-500'
                                    : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                            }`}
                        >
                            <tab.icon className='h-5 w-5' />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <ReportsStatusTabs
                    statusTabs={secondaryTabs}
                    activeTab={activeSecondaryTab}
                    setActiveTab={setActiveSecondaryTab}
                    userRole={userRole}
                    userId={user._id}
                    // Thêm typeFilter vào đây
                    typeFilter={activePrimaryTab === 'standard_criteria' ? 'standard,criteria' : 'overall_tdg'}
                    isEvaluatorView={userRole === 'evaluator'}
                />

            </div>
        </Layout>
    )
}