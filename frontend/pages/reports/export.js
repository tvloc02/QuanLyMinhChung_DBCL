import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import toast from 'react-hot-toast'
import {
    Download,
    FileText,
    FileSpreadsheet,
    FilePdf,
    FileCode,
    Filter,
    Calendar,
    BookOpen,
    Building,
    Layers,
    Hash,
    CheckCircle,
    AlertCircle,
    Clock,
    Package
} from 'lucide-react'
import reportService from '../../services/reportService'
import programService from '../../services/programService'
import organizationService from '../../services/organizationService'

export default function ExportReportPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])

    const [exportConfig, setExportConfig] = useState({
        format: 'pdf',
        type: 'all',
        programId: '',
        organizationId: '',
        standardId: '',
        status: '',
        dateFrom: '',
        dateTo: '',
        includeEvidences: true,
        includeEvaluations: true,
        includeStatistics: true
    })

    const [exportHistory, setExportHistory] = useState([])

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user) {
            fetchInitialData()
            fetchExportHistory()
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (exportConfig.programId) {
            fetchStandards(exportConfig.programId)
        }
    }, [exportConfig.programId])

    const breadcrumbItems = [
        { name: 'Xuất báo cáo', icon: Download }
    ]

    const fetchInitialData = async () => {
        try {
            setLoading(true)
            const [programsData, orgsData] = await Promise.all([
                programService.getPrograms({ limit: 100 }),
                organizationService.getOrganizations({ limit: 100 })
            ])

            setPrograms(programsData.data?.programs || [])
            setOrganizations(orgsData.data?.organizations || [])
        } catch (error) {
            toast.error('Lỗi tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }

    const fetchStandards = async (programId) => {
        try {
            const response = await programService.getStandards(programId)
            setStandards(response.data?.standards || [])
        } catch (error) {
            console.error('Lỗi tải tiêu chuẩn:', error)
        }
    }

    const fetchExportHistory = async () => {
        // Mock export history - replace with actual API
        const mockHistory = [
            {
                id: '1',
                fileName: 'baocao_tieuchuan_20250102.pdf',
                format: 'pdf',
                size: '2.5 MB',
                createdAt: new Date(),
                status: 'completed'
            }
        ]
        setExportHistory(mockHistory)
    }

    const handleExport = async () => {
        try {
            setExporting(true)
            toast.loading('Đang tạo file xuất...')

            // Build query parameters
            const params = new URLSearchParams()
            if (exportConfig.programId) params.append('programId', exportConfig.programId)
            if (exportConfig.organizationId) params.append('organizationId', exportConfig.organizationId)
            if (exportConfig.standardId) params.append('standardId', exportConfig.standardId)
            if (exportConfig.status) params.append('status', exportConfig.status)
            if (exportConfig.dateFrom) params.append('dateFrom', exportConfig.dateFrom)
            if (exportConfig.dateTo) params.append('dateTo', exportConfig.dateTo)
            params.append('format', exportConfig.format)

            const response = await reportService.exportReports(params.toString())

            // Create blob and download
            const blob = new Blob([response], {
                type: exportConfig.format === 'pdf' ? 'application/pdf' :
                    exportConfig.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                        'text/html'
            })

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
            link.download = `baocao_${date}.${exportConfig.format}`

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.dismiss()
            toast.success('Xuất báo cáo thành công')
            fetchExportHistory()
        } catch (error) {
            toast.dismiss()
            toast.error(error.response?.data?.message || 'Lỗi xuất báo cáo')
        } finally {
            setExporting(false)
        }
    }

    const getFormatIcon = (format) => {
        switch (format) {
            case 'pdf':
                return <FilePdf className="h-8 w-8 text-red-600" />
            case 'xlsx':
                return <FileSpreadsheet className="h-8 w-8 text-green-600" />
            case 'html':
                return <FileCode className="h-8 w-8 text-blue-600" />
            default:
                return <FileText className="h-8 w-8 text-gray-600" />
        }
    }

    const FormatCard = ({ format, title, description, icon: Icon, color, selected, onClick }) => (
        <button
            onClick={onClick}
            className={`relative p-6 rounded-lg border-2 transition-all ${
                selected
                    ? `border-${color}-500 bg-${color}-50`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
        >
            {selected && (
                <div className={`absolute top-2 right-2 bg-${color}-500 text-white rounded-full p-1`}>
                    <CheckCircle className="h-4 w-4" />
                </div>
            )}
            <div className="flex flex-col items-center text-center space-y-3">
                <Icon className={`h-12 w-12 ${selected ? `text-${color}-600` : 'text-gray-400'}`} />
                <div>
                    <h4 className="font-semibold text-gray-900">{title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
            </div>
        </button>
    )

    if (isLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Xuất báo cáo</h1>
                    <p className="text-gray-600 mt-1">Xuất báo cáo theo định dạng và bộ lọc mong muốn</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Export Configuration */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Format Selection */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Chọn định dạng xuất
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormatCard
                                    format="pdf"
                                    title="PDF"
                                    description="Định dạng di động, dễ chia sẻ"
                                    icon={FilePdf}
                                    color="red"
                                    selected={exportConfig.format === 'pdf'}
                                    onClick={() => setExportConfig({ ...exportConfig, format: 'pdf' })}
                                />
                                <FormatCard
                                    format="xlsx"
                                    title="Excel"
                                    description="Bảng tính, dễ phân tích"
                                    icon={FileSpreadsheet}
                                    color="green"
                                    selected={exportConfig.format === 'xlsx'}
                                    onClick={() => setExportConfig({ ...exportConfig, format: 'xlsx' })}
                                />
                                <FormatCard
                                    format="html"
                                    title="HTML"
                                    description="Hiển thị trên web"
                                    icon={FileCode}
                                    color="blue"
                                    selected={exportConfig.format === 'html'}
                                    onClick={() => setExportConfig({ ...exportConfig, format: 'html' })}
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Filter className="h-5 w-5 mr-2" />
                                Bộ lọc dữ liệu
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <BookOpen className="h-4 w-4 inline mr-1" />
                                        Chương trình
                                    </label>
                                    <select
                                        value={exportConfig.programId}
                                        onChange={(e) => setExportConfig({
                                            ...exportConfig,
                                            programId: e.target.value,
                                            standardId: ''
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả chương trình</option>
                                        {programs.map(program => (
                                            <option key={program._id} value={program._id}>
                                                {program.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Building className="h-4 w-4 inline mr-1" />
                                        Tổ chức
                                    </label>
                                    <select
                                        value={exportConfig.organizationId}
                                        onChange={(e) => setExportConfig({ ...exportConfig, organizationId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả tổ chức</option>
                                        {organizations.map(org => (
                                            <option key={org._id} value={org._id}>
                                                {org.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Layers className="h-4 w-4 inline mr-1" />
                                        Tiêu chuẩn
                                    </label>
                                    <select
                                        value={exportConfig.standardId}
                                        onChange={(e) => setExportConfig({ ...exportConfig, standardId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={!exportConfig.programId}
                                    >
                                        <option value="">Tất cả tiêu chuẩn</option>
                                        {standards.map(standard => (
                                            <option key={standard._id} value={standard._id}>
                                                {standard.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Hash className="h-4 w-4 inline mr-1" />
                                        Trạng thái
                                    </label>
                                    <select
                                        value={exportConfig.status}
                                        onChange={(e) => setExportConfig({ ...exportConfig, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="draft">Bản nháp</option>
                                        <option value="published">Đã xuất bản</option>
                                        <option value="archived">Lưu trữ</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Calendar className="h-4 w-4 inline mr-1" />
                                        Từ ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={exportConfig.dateFrom}
                                        onChange={(e) => setExportConfig({ ...exportConfig, dateFrom: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Calendar className="h-4 w-4 inline mr-1" />
                                        Đến ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={exportConfig.dateTo}
                                        onChange={(e) => setExportConfig({ ...exportConfig, dateTo: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tùy chọn bổ sung</h3>

                            <div className="space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={exportConfig.includeEvidences}
                                        onChange={(e) => setExportConfig({
                                            ...exportConfig,
                                            includeEvidences: e.target.checked
                                        })}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Bao gồm danh sách minh chứng
                                    </span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={exportConfig.includeEvaluations}
                                        onChange={(e) => setExportConfig({
                                            ...exportConfig,
                                            includeEvaluations: e.target.checked
                                        })}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Bao gồm kết quả đánh giá
                                    </span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={exportConfig.includeStatistics}
                                        onChange={(e) => setExportConfig({
                                            ...exportConfig,
                                            includeStatistics: e.target.checked
                                        })}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        Bao gồm thống kê và biểu đồ
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Export Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                            >
                                {exporting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Đang xuất...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-5 w-5 mr-2" />
                                        Xuất báo cáo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Export History */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Clock className="h-5 w-5 mr-2" />
                                Lịch sử xuất
                            </h3>

                            {exportHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">
                                        Chưa có lịch sử xuất
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {exportHistory.map(item => (
                                        <div
                                            key={item.id}
                                            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-2 flex-1 min-w-0">
                                                    {getFormatIcon(item.format)}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {item.fileName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {item.size}
                                                        </p>
                                                        <div className="flex items-center mt-2 text-xs text-gray-500">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                                        </div>
                                                    </div>
                                                </div>
                                                {item.status === 'completed' && (
                                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}