import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import { apiMethods } from '../../../services/api'
import toast from 'react-hot-toast'
import {
    Download,
    Settings,
    Loader2,
    ArrowLeft,
    Check,
} from 'lucide-react'

const isMongoId = (id) => {
    if (typeof id !== 'string') return false;
    return id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
};

export default function DownloadConfigPage() {
    const router = useRouter()
    const { id } = router.query
    const { user, isLoading } = useAuth()

    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [report, setReport] = useState(null)
    const [config, setConfig] = useState({
        format: 'docx', // docx hoặc html
        includeComments: false,
        includeVersions: false
    })

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Chi tiết', path: id ? `/reports/${id}` : '#' },
        { name: 'Cấu hình tải về' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && router.isReady && isMongoId(id)) {
            fetchReport(id)
        } else if (!isMongoId(id) && !isLoading) {
            setLoading(false)
        }
    }, [user, id, router.isReady])

    const fetchReport = async (reportId) => {
        try {
            setLoading(true)
            const response = await apiMethods.reports.getById(reportId)
            const reportData = response.data?.data || response.data
            setReport(reportData)
        } catch (error) {
            console.error('Fetch report error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải báo cáo')
            router.replace('/reports')
        } finally {
            setLoading(false)
        }
    }

    const handleConfigChange = (name, value) => {
        setConfig(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleDownload = async () => {
        if (!report) return

        try {
            setDownloading(true)

            // ✅ GỌI API: Dùng API có sẵn, giả định endpoint /download chấp nhận các query params
            // Tuy nhiên, vì reportController.js hiện tại chỉ chấp nhận format, chúng ta sẽ mô phỏng việc này.
            // Nếu backend hỗ trợ, query sẽ là: download(id, format, includeComments, includeVersions)

            // Hiện tại, ta dùng API có sẵn với format, và gửi thông báo nếu người dùng chọn tùy chỉnh
            const format = config.format === 'docx' ? 'html' : config.format; // Tải Word (.doc) bằng cách giả lập từ HTML
            const filenameExt = config.format === 'docx' ? '.doc' : `.${format}`

            const response = await apiMethods.reports.download(id, format)

            // Nếu người dùng yêu cầu các tùy chọn nâng cao chưa được API hỗ trợ:
            if (config.includeComments || config.includeVersions) {
                toast.success('Đã tải file. (Lưu ý: Tùy chọn Nhận xét/Phiên bản chưa được tích hợp vào nội dung tải về)')
            } else {
                toast.success(`Đã tải báo cáo thành công dưới định dạng ${config.format.toUpperCase()}`)
            }

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${report.code}-${report.title}${filenameExt}`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

        } catch (error) {
            console.error('Download error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải báo cáo')
        } finally {
            setDownloading(false)
        }
    }

    if (isLoading || loading) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </Layout>
        )
    }

    if (!report) {
        return (
            <Layout breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <ArrowLeft className="h-6 w-6 text-red-600 flex-shrink-0" />
                        <h3 className="text-lg font-bold text-red-800">Báo cáo không khả dụng</h3>
                    </div>
                </div>
            </Layout>
        )
    }

    const isSubmittedOrPublished = report.status === 'submitted' || report.status === 'published'

    return (
        <Layout title={`Cấu hình tải về: ${report.code}`} breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-blue-100 hover:text-white mb-4 font-semibold transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="h-7 w-7"/>
                        Cấu hình tải về Báo cáo
                    </h1>
                    <p className="text-blue-100 mt-2">
                        {report.title} ({report.code})
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cột Cấu hình */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-3">Tùy chọn xuất file</h2>

                        {/* 1. Chọn Định dạng */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Định dạng file</label>
                            <div className="flex gap-4">
                                <label className={`flex items-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                                    config.format === 'docx' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                                }`}>
                                    <input
                                        type="radio"
                                        name="format"
                                        value="docx"
                                        checked={config.format === 'docx'}
                                        onChange={() => handleConfigChange('format', 'docx')}
                                        className="text-blue-600 focus:ring-blue-500 mr-3"
                                    />
                                    Word (.DOCX - giả lập)
                                </label>
                                <label className={`flex items-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                                    config.format === 'html' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                                }`}>
                                    <input
                                        type="radio"
                                        name="format"
                                        value="html"
                                        checked={config.format === 'html'}
                                        onChange={() => handleConfigChange('format', 'html')}
                                        className="text-blue-600 focus:ring-blue-500 mr-3"
                                    />
                                    HTML (.HTML)
                                </label>
                            </div>
                        </div>

                        {/* 2. Tùy chọn Nội dung */}
                        {isSubmittedOrPublished && (
                            <div className="pt-4 border-t border-gray-200 space-y-3">
                                <label className="block text-sm font-bold text-gray-700">Tùy chọn nội dung</label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="includeComments"
                                        checked={config.includeComments}
                                        onChange={(e) => handleConfigChange('includeComments', e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">Bao gồm nhận xét của người đánh giá</span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="includeVersions"
                                        checked={config.includeVersions}
                                        onChange={(e) => handleConfigChange('includeVersions', e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">Bao gồm lịch sử phiên bản (tóm tắt)</span>
                                </label>
                            </div>
                        )}

                        {/* 3. Nút Download */}
                        <div className="pt-6 border-t border-gray-200">
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg font-bold transition-all disabled:opacity-50"
                            >
                                {downloading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Đang tạo file...
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-5 w-5 mr-2" />
                                        Tải Báo cáo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Cột Tóm tắt */}
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Tóm tắt Báo cáo</h3>
                        <p className="text-sm text-gray-700 mb-4">{report.summary || 'Không có tóm tắt.'}</p>

                        <div className="space-y-2 border-t pt-4">
                            <p className="text-sm font-medium text-gray-600 flex justify-between">
                                Trạng thái:
                                <span className="font-semibold text-blue-600">{report.status === 'draft' ? 'Bản nháp' : report.status === 'submitted' ? 'Đã nộp' : 'Đã xuất bản'}</span>
                            </p>
                            <p className="text-sm font-medium text-gray-600 flex justify-between">
                                Người tạo:
                                <span className="font-semibold text-gray-900">{report.createdBy?.fullName || 'N/A'}</span>
                            </p>
                            <p className="text-sm font-medium text-gray-600 flex justify-between">
                                Ngày tạo:
                                <span className="font-semibold text-gray-900">{formatDate(report.createdAt)}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}