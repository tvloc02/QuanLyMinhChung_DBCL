import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import RichTextEditor from '../../components/reports/RichTextEditor'
import EvidencePicker from '../../components/reports/EvidencePicker'
import EvidenceViewer from '../../components/reports/EvidenceViewer'
import toast from 'react-hot-toast'
import {
    FileText,
    Save,
    ArrowLeft,
    Upload,
    Eye,
    BookOpen,
    Building,
    Layers,
    Hash,
    FileType,
    AlignLeft,
    Tag,
    X,
    File
} from 'lucide-react'
import reportService from '../../services/reportService'
import { apiMethods } from '../../services/api'

export default function CreateReportPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const editorRef = useRef(null)

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Data lists
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])

    // Form state
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

    // File upload
    const [selectedFile, setSelectedFile] = useState(null)

    // Evidence viewer
    const [selectedEvidenceCode, setSelectedEvidenceCode] = useState(null)
    const [showEvidenceViewer, setShowEvidenceViewer] = useState(false)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user) {
            fetchInitialData()
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (formData.programId && formData.organizationId) {
            fetchStandards()
        } else {
            setStandards([])
            setFormData(prev => ({ ...prev, standardId: '', criteriaId: '' }))
        }
    }, [formData.programId, formData.organizationId])

    useEffect(() => {
        if (formData.standardId) {
            fetchCriteria()
        } else {
            setCriteria([])
            setFormData(prev => ({ ...prev, criteriaId: '' }))
        }
    }, [formData.standardId])

    // Add click listener for evidence codes
    useEffect(() => {
        const handleEvidenceClick = (e) => {
            if (e.target.classList.contains('evidence-code')) {
                const code = e.target.getAttribute('data-code')
                if (code) {
                    setSelectedEvidenceCode(code)
                    setShowEvidenceViewer(true)
                }
            }
        }

        document.addEventListener('click', handleEvidenceClick)
        return () => document.removeEventListener('click', handleEvidenceClick)
    }, [])

    const breadcrumbItems = [
        { name: 'Báo cáo', icon: FileText, path: '/reports/reports' },
        { name: 'Tạo báo cáo mới', icon: FileText }
    ]

    const fetchInitialData = async () => {
        try {
            setLoading(true)

            // ✅ DÙNG apiMethods TRỰC TIẾP GIỐNG FILE EVIDENCE
            const [programsRes, orgsRes] = await Promise.all([
                apiMethods.programs.getAll(),
                apiMethods.organizations.getAll()
            ])

            // ✅ XỬ LÝ RESPONSE GIỐNG FILE EVIDENCE
            setPrograms(programsRes.data.data.programs || [])
            setOrganizations(orgsRes.data.data.organizations || [])

        } catch (error) {
            console.error('Fetch initial data error:', error)
            toast.error('Lỗi tải dữ liệu ban đầu')
        } finally {
            setLoading(false)
        }
    }

    const fetchStandards = async () => {
        if (!formData.programId || !formData.organizationId) {
            return
        }

        try {
            // ✅ DÙNG apiMethods GIỐNG FILE EVIDENCE
            const response = await apiMethods.standards.getAll({
                programId: formData.programId,
                organizationId: formData.organizationId,
                status: 'active'
            })

            const standards = response.data.data.standards || response.data.data || []
            setStandards(standards)

        } catch (error) {
            console.error('Fetch standards error:', error)
            toast.error('Lỗi khi tải danh sách tiêu chuẩn')
        }
    }

    const fetchCriteria = async () => {
        if (!formData.standardId) {
            return
        }

        try {
            // ✅ DÙNG apiMethods GIỐNG FILE EVIDENCE
            const response = await apiMethods.criteria.getAll({
                standardId: formData.standardId,
                status: 'active'
            })

            let criteriaData = []
            if (response.data.data) {
                if (Array.isArray(response.data.data.criterias)) {
                    criteriaData = response.data.data.criterias
                } else if (Array.isArray(response.data.data.criteria)) {
                    criteriaData = response.data.data.criteria
                } else if (Array.isArray(response.data.data)) {
                    criteriaData = response.data.data
                }
            }

            setCriteria(criteriaData)

        } catch (error) {
            console.error('Fetch criteria error:', error)
            toast.error('Lỗi khi tải danh sách tiêu chí')
            setCriteria([])
        }
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.title.trim()) {
            errors.title = 'Tiêu đề báo cáo là bắt buộc'
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

        if (formData.contentMethod === 'online_editor' && !formData.content.trim()) {
            errors.content = 'Nội dung báo cáo là bắt buộc'
        }

        if (formData.contentMethod === 'file_upload' && !selectedFile) {
            errors.file = 'Vui lòng chọn file để upload'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        try {
            setSubmitting(true)

            const submitData = {
                title: formData.title,
                type: formData.type,
                programId: formData.programId,
                organizationId: formData.organizationId,
                contentMethod: formData.contentMethod,
                summary: formData.summary,
                keywords: formData.keywords
            }

            if (formData.type !== 'comprehensive_report') {
                submitData.standardId = formData.standardId
            }

            if (formData.type === 'criteria_analysis') {
                submitData.criteriaId = formData.criteriaId
            }

            if (formData.contentMethod === 'online_editor') {
                submitData.content = formData.content
            }

            const response = await reportService.createReport(submitData)

            if (response.success) {
                const reportId = response.data._id

                // Upload file if needed
                if (formData.contentMethod === 'file_upload' && selectedFile) {
                    try {
                        await reportService.uploadFile(reportId, selectedFile)
                        toast.success('Tạo báo cáo và upload file thành công')
                    } catch (uploadError) {
                        toast.warning('Báo cáo đã được tạo nhưng có lỗi khi upload file')
                    }
                } else {
                    toast.success('Tạo báo cáo thành công')
                }

                setTimeout(() => {
                    router.push(`/reports/reports`)
                }, 1500)
            }
        } catch (error) {
            console.error('Create report error:', error)
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

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            const maxSize = 50 * 1024 * 1024 // 50MB
            if (file.size > maxSize) {
                toast.error('File không được vượt quá 50MB')
                return
            }

            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]

            if (!allowedTypes.includes(file.type)) {
                toast.error('Chỉ chấp nhận file PDF hoặc Word')
                return
            }

            setSelectedFile(file)
        }
    }

    const handleInsertEvidence = (code) => {
        if (editorRef.current?.insertEvidenceCode) {
            editorRef.current.insertEvidenceCode(code)
            toast.success(`Đã chèn mã minh chứng ${code}`)
        }
    }

    if (isLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <Layout title="Tạo báo cáo mới" breadcrumbItems={breadcrumbItems}>
            <div className="flex gap-6">
                {/* Main Form */}
                <div className="flex-1 space-y-6">
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Thông tin cơ bản
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiêu đề báo cáo <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            formErrors.title ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Nhập tiêu đề báo cáo"
                                        maxLength={500}
                                    />
                                    {formErrors.title && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <FileType className="h-4 w-4 inline mr-1" />
                                        Loại báo cáo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="criteria_analysis">Phiếu phân tích tiêu chí</option>
                                        <option value="standard_analysis">Phiếu phân tích tiêu chuẩn</option>
                                        <option value="comprehensive_report">Báo cáo tổng hợp</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phương thức nhập <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.contentMethod}
                                        onChange={(e) => setFormData({ ...formData, contentMethod: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="online_editor">Soạn thảo trực tuyến</option>
                                        <option value="file_upload">Upload file</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <BookOpen className="h-4 w-4 inline mr-1" />
                                        Chương trình <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.programId}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            programId: e.target.value,
                                            standardId: '',
                                            criteriaId: ''
                                        })}
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
                                        Tổ chức <span className="text-red-500">*</span>
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
                                            Tiêu chuẩn <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.standardId}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                standardId: e.target.value,
                                                criteriaId: ''
                                            })}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                formErrors.standardId ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            disabled={!formData.programId || !formData.organizationId}
                                        >
                                            <option value="">Chọn tiêu chuẩn</option>
                                            {standards.map(standard => (
                                                <option key={standard._id} value={standard._id}>
                                                    {standard.code} - {standard.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {formData.type === 'criteria_analysis' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Hash className="h-4 w-4 inline mr-1" />
                                            Tiêu chí <span className="text-red-500">*</span>
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
                                                    {criterion.code} - {criterion.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Nội dung báo cáo
                            </h3>

                            {formData.contentMethod === 'online_editor' ? (
                                <div>
                                    <RichTextEditor
                                        ref={editorRef}
                                        value={formData.content}
                                        onChange={(content) => setFormData({ ...formData, content })}
                                        placeholder="Nhập nội dung báo cáo..."
                                    />
                                    {formErrors.content && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.content}</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                                        <div className="text-center">
                                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-sm text-gray-600 mb-2">
                                                Kéo thả file hoặc click để chọn
                                            </p>
                                            <p className="text-xs text-gray-500 mb-4">
                                                Hỗ trợ: PDF, DOC, DOCX (tối đa 50MB)
                                            </p>
                                            <input
                                                type="file"
                                                onChange={handleFileSelect}
                                                accept=".pdf,.doc,.docx"
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label
                                                htmlFor="file-upload"
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                                            >
                                                <File className="h-4 w-4 mr-2" />
                                                Chọn file
                                            </label>
                                        </div>

                                        {selectedFile && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center flex-1 min-w-0">
                                                        <File className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {selectedFile.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedFile(null)}
                                                        className="ml-2 text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.file && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.file}</p>
                                    )}
                                </div>
                            )}
                        </div>

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
                                                    <X className="h-3 w-3" />
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

                {/* Sidebar - Evidence Picker */}
                {formData.contentMethod === 'online_editor' && (formData.standardId || formData.criteriaId) && (
                    <div className="w-96 flex-shrink-0">
                        <div className="sticky top-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <EvidencePicker
                                    standardId={formData.standardId}
                                    criteriaId={formData.criteriaId}
                                    onSelect={handleInsertEvidence}
                                    onViewEvidence={(code) => {
                                        setSelectedEvidenceCode(code)
                                        setShowEvidenceViewer(true)
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Evidence Viewer Overlay */}
            {showEvidenceViewer && selectedEvidenceCode && (
                <EvidenceViewer
                    evidenceCode={selectedEvidenceCode}
                    onClose={() => {
                        setShowEvidenceViewer(false)
                        setSelectedEvidenceCode(null)
                    }}
                    onInsert={handleInsertEvidence}
                />
            )}
        </Layout>
    )
}