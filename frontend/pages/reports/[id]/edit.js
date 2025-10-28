import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import { apiMethods } from '../../../services/api'
import RichTextEditor from '../../../components/reports/RichTextEditor' // <-- ĐÃ THAY ĐỔI
import EvidencePicker from '../../../components/reports/EvidencePicker'
import toast from 'react-hot-toast'
import { FileText, Save, Loader2, Edit, X, Link as LinkIcon } from 'lucide-react'
import { formatDate } from '../../../utils/helpers'

const isMongoId = (id) => typeof id === 'string' && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);

export default function EditReportPage() {
    const router = useRouter()
    const { id } = router.query
    const { user, isLoading } = useAuth()
    const editorRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [report, setReport] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        keywords: [],
        programId: '',
        organizationId: '',
        type: ''
    })
    const [content, setContent] = useState('')
    const [selectedEvidences, setSelectedEvidences] = useState([])

    const breadcrumbItems = [
        { name: 'Báo cáo', path: '/reports' },
        { name: 'Chi tiết', path: id ? `/reports/${id}` : '#' },
        { name: 'Chỉnh sửa' }
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

            if (!reportData || reportData.status !== 'draft') {
                toast.error('Chỉ có thể chỉnh sửa báo cáo ở trạng thái nháp')
                router.replace(`/reports/${reportId}`)
                return
            }

            setReport(reportData)
            setFormData({
                title: reportData.title || '',
                summary: reportData.summary || '',
                keywords: reportData.keywords || [],
                programId: reportData.programId?._id || reportData.programId || '',
                organizationId: reportData.organizationId?._id || reportData.organizationId || '',
                type: reportData.type || ''
            })
            setContent(reportData.content || '')

            const initialEvidences = reportData.linkedEvidences?.map(item => ({
                evidenceId: item.evidenceId?._id || item.evidenceId,
                code: item.evidenceId?.code,
                name: item.evidenceId?.name,
                contextText: item.contextText || '',
                selectedFileIds: item.selectedFileIds?.map(file => file._id) || []
            })) || []
            setSelectedEvidences(initialEvidences)

        } catch (error) {
            console.error('Fetch report error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi tải báo cáo')
            router.replace('/reports')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleKeywordsChange = (e) => {
        const value = e.target.value
        const keywords = value.split(',').map(k => k.trim()).filter(k => k)
        setFormData(prev => ({ ...prev, keywords }))
    }

    const handleSelectEvidence = (evidence) => {
        const exists = selectedEvidences.find(e => e.evidenceId === evidence.evidenceId)
        if (!exists) {
            setSelectedEvidences(prev => [...prev, evidence])
            if (editorRef.current) {
                // Sử dụng RichTextEditor tùy chỉnh của bạn
                editorRef.current.insertEvidenceCode(evidence.code)
            }
        }
    }

    const handleRemoveEvidence = (evidenceId) => {
        setSelectedEvidences(prev => prev.filter(e => e.evidenceId !== evidenceId))
    }

    const handleUpdateEvidence = (evidenceId, updates) => {
        setSelectedEvidences(prev => prev.map(e =>
            e.evidenceId === evidenceId ? { ...e, ...updates } : e
        ))
    }

    const handleSave = async () => {
        if (!formData.title.trim()) {
            toast.error('Tiêu đề báo cáo là bắt buộc')
            return
        }

        const contentToSave = editorRef.current?.getContent() || content

        if (!contentToSave.trim() && report.contentMethod !== 'file_upload') {
            toast.error('Nội dung báo cáo không được để trống')
            return
        }

        try {
            setSaving(true)

            const linkedEvidencesToSend = selectedEvidences.map(item => ({
                evidenceId: item.evidenceId,
                contextText: item.contextText,
                selectedFileIds: item.selectedFileIds
            }))

            const dataToUpdate = {
                title: formData.title.trim(),
                summary: formData.summary.trim(),
                keywords: formData.keywords,
                content: contentToSave,
                linkedEvidences: linkedEvidencesToSend
            }

            const response = await apiMethods.reports.update(id, dataToUpdate)
            toast.success('Lưu báo cáo thành công')

            const updatedReportData = response.data.data
            setReport(updatedReportData)

            const reloadedEvidences = updatedReportData.linkedEvidences?.map(item => ({
                evidenceId: item.evidenceId?._id || item.evidenceId,
                code: item.evidenceId?.code,
                name: item.evidenceId?.name,
                contextText: item.contextText || '',
                selectedFileIds: item.selectedFileIds?.map(file => file._id) || []
            })) || []
            setSelectedEvidences(reloadedEvidences)

        } catch (error) {
            console.error('Save error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi lưu báo cáo')
        } finally {
            setSaving(false)
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
                        <X className="h-6 w-6 text-red-600 flex-shrink-0" />
                        <h3 className="text-lg font-bold text-red-800">Không tìm thấy báo cáo</h3>
                    </div>
                </div>
            </Layout>
        )
    }

    const isTitleDisabled = !!report?.requestId;

    return (
        <Layout title={`Chỉnh sửa: ${report.code}`} breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white">
                    <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                        <Edit className="h-7 w-7"/>
                        Chỉnh sửa Báo cáo: {report.code}
                    </h1>
                    <p className="text-orange-100">Cập nhật nội dung và thông tin bổ sung cho bản nháp này.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin cơ bản</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tiêu đề báo cáo {isTitleDisabled && <span className="text-sm text-gray-500">(Khóa - theo Yêu cầu)</span>}
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        disabled={isTitleDisabled}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                        placeholder="Nhập tiêu đề báo cáo"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Nội dung báo cáo */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Nội dung báo cáo</h2>
                            <RichTextEditor // <-- SỬ DỤNG RichTextEditor
                                ref={editorRef}
                                value={content}
                                onChange={setContent}
                                placeholder="Nhập nội dung báo cáo..."
                            />
                        </div>

                        {/* Thông tin bổ sung */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin bổ sung</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tóm tắt
                                    </label>
                                    <textarea
                                        name="summary"
                                        value={formData.summary}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập tóm tắt ngắn gọn về báo cáo"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Từ khóa
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.keywords.join(', ')}
                                        onChange={handleKeywordsChange}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập từ khóa, phân cách bằng dấu phẩy"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cột bên phải: Minh chứng */}
                    <div className="lg:col-span-1 space-y-6">
                        {formData.type && formData.programId && formData.organizationId && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <EvidencePicker
                                    reportType={formData.type}
                                    programId={formData.programId}
                                    organizationId={formData.organizationId}
                                    onSelectEvidence={handleSelectEvidence}
                                    selectedEvidences={selectedEvidences}
                                />
                            </div>
                        )}

                        {selectedEvidences.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <LinkIcon className='h-5 w-5 text-blue-600'/>
                                    Minh chứng đã chọn ({selectedEvidences.length})
                                </h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {selectedEvidences.map((evidence) => (
                                        <div
                                            key={evidence.evidenceId}
                                            className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-mono text-sm font-semibold text-blue-700">
                                                        {evidence.code}
                                                    </p>
                                                    <p className="text-xs text-gray-600 truncate">
                                                        {evidence.name}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveEvidence(evidence.evidenceId)}
                                                    className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Form cập nhật ngữ cảnh */}
                                            <label className="block text-xs font-semibold text-gray-600 mt-2 mb-1">
                                                Ngữ cảnh liên kết
                                            </label>
                                            <textarea
                                                value={evidence.contextText || ''}
                                                onChange={(e) => handleUpdateEvidence(evidence.evidenceId, { contextText: e.target.value })}
                                                rows={2}
                                                maxLength={500}
                                                className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs resize-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Ngữ cảnh sử dụng minh chứng (tối đa 500 ký tự)"
                                            />
                                            {/* Lưu ý: Không hỗ trợ chọn file con trong scope này, chỉ hiển thị số lượng file nếu có */}
                                            {evidence.selectedFileIds && evidence.selectedFileIds.length > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Đang chọn: {evidence.selectedFileIds.length} file đính kèm
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => router.push(`/reports/${id}`)}
                        className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                    >
                        Hủy và Quay lại
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Lưu Cập nhật
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Layout>
    )
}