import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import toast from 'react-hot-toast'
import {
    FileText,
    Save,
    Send,
    ArrowLeft,
    Link as LinkIcon,
    Upload,
    Eye,
    BookOpen,
    Building,
    Layers,
    Hash,
    FileType,
    AlignLeft,
    Tag,
    CheckCircle
} from 'lucide-react'
import reportService from '../../services/reportService'
import programService from '../../services/programService'
import organizationService from '../../services/organizationService'
import evidenceService from '../../services/evidenceService'

export default function CreateReportPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])
    const [evidences, setEvidences] = useState([])

    const [formData, setFormData] = useState({
        title: '',
        type: 'criteria_analysis',
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        content: '',
        contentMethod: 'online_editor',
        summary: '',
        keywords: []
    })

    const [formErrors, setFormErrors] = useState({})
    const [keywordInput, setKeywordInput] = useState('')
    const [showPreview, setShowPreview] = useState(false)
    const [selectedEvidences, setSelectedEvidences] = useState([])

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user) {
            fetchInitialData()
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (formData.programId) {
            fetchStandards(formData.programId)
        }
    }, [formData.programId])

    useEffect(() => {
        if (formData.standardId) {
            fetchCriteria(formData.standardId)
        }
    }, [formData.standardId])

    useEffect(() => {
        if (formData.criteriaId) {
            fetchEvidences()
        }
    }, [formData.criteriaId])

    const breadcrumbItems = [
        { name: 'Báo cáo', icon: FileText, path: '/reports/reports' },
        { name: 'Tạo báo cáo mới', icon: FileText }
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
            toast.error('Lỗi tải dữ liệu ban đầu')
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

    const fetchCriteria = async (standardId) => {
        try {
            const response = await programService.getCriteria(standardId)
            setCriteria(response.data?.criteria || [])
        } catch (error) {
            console.error('Lỗi tải tiêu chí:', error)
        }
    }

    const fetchEvidences = async () => {
        try {
            const response = await evidenceService.getEvidences({
                criteriaId: formData.criteriaId,
                limit: 100
            })
            setEvidences(response.data?.evidences || [])
        } catch (error) {
            console.error('Lỗi tải minh chứng:', error)
        }
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.title.trim()) {
            errors.title = 'Tiêu đề báo cáo là bắt buộc'
        }

        if (!formData.type) {
            errors.type = 'Loại báo cáo là bắt buộc'
        }

        if (!formData.programId) {
            errors.programId = 'Chương trình là bắt buộc'
        }

        if (!formData.organizationId) {
            errors.organizationId = 'Tổ chức là bắt buộc'
        }

        if (formData.type !== 'comprehensive_report' && !formData.standardId) {
            errors.standardId = 'Tiêu chuẩn là bắt buộc'
        }

        if (formData.type === 'criteria_analysis' && !formData.criteriaId) {
            errors.criteriaId = 'Tiêu chí là bắt buộc'
        }

        if (!formData.content.trim()) {
            errors.content = 'Nội dung báo cáo là bắt buộc'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (isDraft = false) => {
        if (!validateForm()) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        try {
            setSubmitting(true)

            const submitData = {
                ...formData,
                keywords: formData.keywords
            }

            const response = await reportService.createReport(submitData)

            if (response.success) {
                toast.success('Tạo báo cáo thành công')
                router.push(`/reports/reports`)
            } else {
                toast.error(response.message || 'Lỗi tạo báo cáo')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi tạo báo cáo')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAddKeyword = () => {
        if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
            setFormData({
                ...formData,
                keywords: [...formData.keywords, keywordInput.trim()]
            })
            setKeywordInput('')
        }
    }

    const handleRemoveKeyword = (keyword) => {
        setFormData({
            ...formData,
            keywords: formData.keywords.filter(k => k !== keyword)
        })
    }

    const insertEvidenceReference = (evidenceCode) => {
        const textarea = document.getElementById('content')
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = formData.content
        const before = text.substring(0, start)
        const after = text.substring(end)

        setFormData({
            ...formData,
            content: before + evidenceCode + after
        })
    }

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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Tạo báo cáo mới</h1>
                        <p className="text-gray-600 mt-1">Tạo báo cáo phân tích tiêu chuẩn/tiêu chí</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Thông tin cơ bản
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <AlignLeft className="h-4 w-4 inline mr-1" />
                                    Tiêu đề báo cáo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.title ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập tiêu đề báo cáo"
                                />
                                {formErrors.title && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FileType className="h-4 w-4 inline mr-1" />
                                    Loại báo cáo *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.type ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="criteria_analysis">Phiếu phân tích tiêu chí</option>
                                    <option value="standard_analysis">Phiếu phân tích tiêu chuẩn</option>
                                    <option value="comprehensive_report">Báo cáo tổng hợp</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <BookOpen className="h-4 w-4 inline mr-1" />
                                    Chương trình *
                                </label>
                                <select
                                    value={formData.programId}
                                    onChange={(e) => setFormData({ ...formData, programId: e.target.value, standardId: '', criteriaId: '' })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.programId ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Chọn chương trình</option>
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
                                    Tổ chức *
                                </label>
                                <select
                                    value={formData.organizationId}
                                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        formErrors.organizationId ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Chọn tổ chức</option>
                                    {organizations.map(org => (
                                        <option key={org._id} value={org._id}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.type !== 'comprehensive_report' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Layers className="h-4 w-4 inline mr-1" />
                                        Tiêu chuẩn *
                                    </label>
                                    <select
                                        value={formData.standardId}
                                        onChange={(e) => setFormData({ ...formData, standardId: e.target.value, criteriaId: '' })}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            formErrors.standardId ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        disabled={!formData.programId}
                                    >
                                        <option value="">Chọn tiêu chuẩn</option>
                                        {standards.map(standard => (
                                            <option key={standard._id} value={standard._id}>
                                                {standard.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.type === 'criteria_analysis' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Hash className="h-4 w-4 inline mr-1" />
                                        Tiêu chí *
                                    </label>
                                    <select
                                        value={formData.criteriaId}
                                        onChange={(e) => setFormData({ ...formData, criteriaId: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            formErrors.criteriaId ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        disabled={!formData.standardId}
                                    >
                                        <option value="">Chọn tiêu chí</option>
                                        {criteria.map(criterion => (
                                            <option key={criterion._id} value={criterion._id}>
                                                {criterion.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Nội dung báo cáo
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
                            </button>
                        </div>

                        {showPreview ? (
                            <div className="prose max-w-none border border-gray-200 rounded-md p-4 bg-gray-50">
                                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                            </div>
                        ) : (
                            <textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                rows={15}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                                    formErrors.content ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Nhập nội dung báo cáo..."
                            />
                        )}
                        {formErrors.content && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.content}</p>
                        )}
                    </div>

                    {/* Evidence References */}
                    {evidences.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <LinkIcon className="h-5 w-5 mr-2" />
                                Minh chứng tham chiếu
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                {evidences.map(evidence => (
                                    <button
                                        key={evidence._id}
                                        type="button"
                                        onClick={() => insertEvidenceReference(evidence.code)}
                                        className="text-left p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-sm text-blue-600 font-medium">
                                                {evidence.code}
                                            </span>
                                            <CheckCircle className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                            {evidence.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Tag className="h-5 w-5 mr-2" />
                            Thông tin bổ sung
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tóm tắt
                                </label>
                                <textarea
                                    value={formData.summary}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    rows={3}
                                    maxLength={1000}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tóm tắt ngắn gọn về nội dung báo cáo"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.summary.length}/1000 ký tự
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Từ khóa
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập từ khóa và nhấn Enter"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddKeyword}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Thêm
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.keywords.map((keyword, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                        >
                                            {keyword}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveKeyword(keyword)}
                                                className="ml-2 text-blue-500 hover:text-blue-700"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Tạo báo cáo
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}