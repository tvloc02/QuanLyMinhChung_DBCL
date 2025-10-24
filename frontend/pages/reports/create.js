import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import RichTextEditor from '../../components/reports/RichTextEditor'
import EvidencePicker from '../../components/reports/EvidencePicker'
import SelfEvaluationModal from '../../components/reports/SelfEvaluationModal'
import { apiMethods } from '../../services/api'
import reportService from '../../services/reportService'
import toast from 'react-hot-toast'
import { FileText, Save, Send, Loader2, X } from 'lucide-react'

const REPORT_TYPES = [
    { value: 'criteria_analysis', label: 'Phân tích tiêu chí' },
    { value: 'standard_analysis', label: 'Phân tích tiêu chuẩn' },
    { value: 'comprehensive_report', label: 'Báo cáo tổng hợp' }
]

const cleanData = (data) => {
    return Object.keys(data).reduce((acc, key) => {
        if (data[key] !== undefined && data[key] !== null) {
            acc[key] = data[key];
        }
        return acc;
    }, {});
};

export default function CreateReport() {
    const router = useRouter()
    const { requestId } = router.query
    const { user, isLoading } = useAuth()
    const editorRef = useRef(null)

    const breadcrumbItems = [
        { name: 'Báo cáo', href: '/reports/reports', icon: FileText },
        { name: 'Tạo báo cáo mới' }
    ]

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        programId: '',
        organizationId: '',
        summary: '',
        keywords: [],
        requestId: requestId || '',
        content: ''
    })

    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [request, setRequest] = useState(null)
    const [allowedTypes, setAllowedTypes] = useState([])
    const [selectedEvidences, setSelectedEvidences] = useState([])
    const [showSelfEvalModal, setShowSelfEvalModal] = useState(false)
    const [selfEvaluation, setSelfEvaluation] = useState(null)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchPrograms()
            fetchOrganizations()
        }
    }, [user])

    useEffect(() => {
        if (requestId && user) {
            fetchRequest()
        }
    }, [requestId, user])

    const fetchPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll()
            setPrograms(response.data?.data?.programs || [])
        } catch (error) {
            console.error('Fetch programs error:', error)
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll()
            setOrganizations(response.data?.data?.organizations || [])
        } catch (error) {
            console.error('Fetch organizations error:', error)
        }
    }

    const fetchRequest = async () => {
        try {
            const response = await apiMethods.reportRequests.getById(requestId)
            const req = response.data?.data || response.data
            setRequest(req)

            const reqTypes = req.types && Array.isArray(req.types) ? req.types : []
            setAllowedTypes(reqTypes)

            if (reqTypes.length === 1) {
                setFormData(prev => ({
                    ...prev,
                    title: req.title || '',
                    type: reqTypes[0],
                    programId: req.programId?._id || req.programId || '',
                    organizationId: req.organizationId?._id || req.organizationId || '',
                    requestId: req._id
                }))
            } else {
                setFormData(prev => ({
                    ...prev,
                    title: req.title || '',
                    programId: req.programId?._id || req.programId || '',
                    organizationId: req.organizationId?._id || req.organizationId || '',
                    requestId: req._id
                }))
            }
        } catch (error) {
            console.error('Fetch request error:', error)
            toast.error('Lỗi khi tải thông tin yêu cầu')
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleKeywordsChange = (e) => {
        const value = e.target.value
        const keywords = value.split(',').map(k => k.trim()).filter(k => k)
        setFormData(prev => ({
            ...prev,
            keywords
        }))
    }

    const handleSelectEvidence = (evidence) => {
        const exists = selectedEvidences.find(e => e.evidenceId === evidence.evidenceId)
        if (!exists) {
            setSelectedEvidences(prev => [...prev, evidence])
            if (editorRef.current) {
                editorRef.current.insertEvidenceCode(evidence.code)
            }
        }
    }

    const handleRemoveEvidence = (evidenceId) => {
        setSelectedEvidences(prev => prev.filter(e => e.evidenceId !== evidenceId))
    }

    // Sửa: Hàm lấy nội dung phải ưu tiên lấy từ REF (DOM) nếu tồn tại, nếu không lấy từ state
    const getContentFromEditor = () => {
        const contentFromRef = editorRef.current?.getContent();
        // Lấy từ Ref (nếu nó không rỗng) HOẶC lấy từ state (nếu state có nội dung)
        return contentFromRef || formData.content || '';
    }

    // Hàm cập nhật content state từ RichTextEditor
    const handleContentChange = (content) => {
        setFormData(prev => ({ ...prev, content }))
    }


    const handleSave = async () => {
        if (!formData.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề báo cáo')
            return
        }

        if (!formData.type) {
            toast.error('Vui lòng chọn loại báo cáo')
            return
        }

        if (request && allowedTypes.length > 0 && !allowedTypes.includes(formData.type)) {
            toast.error('Loại báo cáo này không được cho phép cho yêu cầu này')
            return
        }

        if (!formData.programId || !formData.organizationId) {
            toast.error('Vui lòng chọn chương trình và tổ chức')
            return
        }

        const content = getContentFromEditor()
        if (!content.trim()) {
            toast.error('Vui lòng nhập nội dung báo cáo')
            return
        }

        try {
            setLoading(true)

            const rawData = {
                ...formData,
                content,
                linkedEvidences: selectedEvidences,
                description: formData.summary.trim() || '',
                summary: formData.summary.trim() || ''
            };

            const dataToSend = cleanData(rawData);

            const response = await reportService.create(dataToSend)
            toast.success('Lưu báo cáo thành công')
            router.push(`/reports/${response.data?.data?._id || response.data?._id}`)
        } catch (error) {
            console.error('Save error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi lưu báo cáo')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!selfEvaluation) {
            setShowSelfEvalModal(true)
            return
        }

        if (!formData.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề báo cáo')
            return
        }

        if (!formData.type) {
            toast.error('Vui lòng chọn loại báo cáo')
            return
        }

        if (request && allowedTypes.length > 0 && !allowedTypes.includes(formData.type)) {
            toast.error('Loại báo cáo này không được cho phép cho yêu cầu này')
            return
        }

        if (!formData.programId || !formData.organizationId) {
            toast.error('Vui lòng chọn chương trình và tổ chức')
            return
        }

        const content = getContentFromEditor()
        if (!content.trim()) {
            toast.error('Vui lòng nhập nội dung báo cáo')
            return
        }

        try {
            setSubmitting(true)

            const rawData = {
                ...formData,
                content,
                linkedEvidences: selectedEvidences,
                description: formData.summary.trim() || '',
                summary: formData.summary.trim() || ''
            };

            const dataToSend = cleanData(rawData);

            const createResponse = await reportService.create(dataToSend)
            const reportId = createResponse.data?.data?._id || createResponse.data?._id

            await reportService.addSelfEvaluation(reportId, selfEvaluation)
            await reportService.submit(reportId)

            toast.success('Nộp báo cáo thành công')
            router.push(`/reports/${reportId}`)
        } catch (error) {
            console.error('Submit error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi nộp báo cáo')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSelfEvaluationSubmit = async (evalData) => {
        setSelfEvaluation(evalData)
        setShowSelfEvalModal(false)
        await handleSubmit()
    }

    const availableTypes = allowedTypes.length > 0
        ? REPORT_TYPES.filter(t => allowedTypes.includes(t.value))
        : REPORT_TYPES

    if (isLoading) {
        return (
            <Layout title="" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                <FileText className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Tạo báo cáo mới</h1>
                                <p className="text-blue-100">
                                    {request ? `Theo yêu cầu: ${request.title}` : 'Điền thông tin để tạo báo cáo'}
                                </p>
                                {request && allowedTypes.length > 0 && (
                                    <p className="text-blue-100 text-sm mt-1">
                                        Loại báo cáo cho phép: {allowedTypes.length === 1 ? availableTypes.map(t => t.label).join(', ') : `${allowedTypes.length} loại`}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Thông tin cơ bản</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tiêu đề báo cáo <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        disabled={!!request}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                        placeholder="Nhập tiêu đề báo cáo"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Loại báo cáo <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            disabled={!!request && allowedTypes.length === 1}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                            required
                                        >
                                            <option value="">Chọn loại báo cáo</option>
                                            {availableTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                        {request && allowedTypes.length === 1 && (
                                            <p className="text-xs text-blue-600 mt-1">
                                                ✓ Tự động chọn loại duy nhất cho phép
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Chương trình <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="programId"
                                            value={formData.programId}
                                            onChange={handleChange}
                                            disabled={!!request}
                                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                            required
                                        >
                                            <option value="">Chọn chương trình</option>
                                            {programs.map(p => (
                                                <option key={p._id} value={p._id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tổ chức <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="organizationId"
                                        value={formData.organizationId}
                                        onChange={handleChange}
                                        disabled={!!request}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                        required
                                    >
                                        <option value="">Chọn tổ chức</option>
                                        {organizations.map(o => (
                                            <option key={o._id} value={o._id}>{o.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Nội dung báo cáo</h2>
                            <RichTextEditor
                                ref={editorRef}
                                value={formData.content}
                                onChange={handleContentChange}
                                placeholder="Nhập nội dung báo cáo..."
                            />
                        </div>

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

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => router.back()}
                                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        Lưu nháp
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowSelfEvalModal(true)}
                                disabled={submitting}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Đang nộp...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Nộp báo cáo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
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
                                <h3 className="text-lg font-bold text-gray-900 mb-3">
                                    Minh chứng đã chọn ({selectedEvidences.length})
                                </h3>
                                <div className="space-y-2">
                                    {selectedEvidences.map((evidence) => (
                                        <div
                                            key={evidence.evidenceId}
                                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-mono text-sm font-semibold text-green-700">
                                                    {evidence.code}
                                                </p>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {evidence.name}
                                                </p>
                                                {evidence.selectedFileIds && evidence.selectedFileIds.length > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {evidence.selectedFileIds.length} file(s)
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveEvidence(evidence.evidenceId)}
                                                className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSelfEvalModal && (
                <SelfEvaluationModal
                    onClose={() => setShowSelfEvalModal(false)}
                    onSubmit={handleSelfEvaluationSubmit}
                    initialData={selfEvaluation}
                />
            )}
        </Layout>
    )
}