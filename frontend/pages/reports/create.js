import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import RichTextEditor from '../../components/reports/RichTextEditor'
import EvidencePicker from '../../components/reports/EvidencePicker'
import EvidenceViewer from '../../components/reports/EvidenceViewer'
import toast from 'react-hot-toast'
import {
    FileText, Save, ArrowLeft, Upload, Eye, BookOpen, Building,
    Layers, Hash, FileType, AlignLeft, Tag, X, File, AlertCircle,
    RefreshCw, Plus, FilePlus
} from 'lucide-react'
import reportService from '../../services/reportService'
import { apiMethods } from '../../services/api'
import { default as BaseLayout } from '../../components/common/Layout'
// Import component Modal tạo minh chứng mới
import NewEvidenceModal from '../../components/reports/NewEvidenceModal'

export default function CreateReportPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const editorRef = useRef(null)

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])
    const [isFromTask, setIsFromTask] = useState(false)
    const [isContentDirty, setIsContentDirty] = useState(false) // Theo dõi nội dung đã thay đổi chưa
    const [isDataLoaded, setIsDataLoaded] = useState(false) // Theo dõi dữ liệu ban đầu đã tải chưa

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
    const [selectedFile, setSelectedFile] = useState(null)
    const [selectedEvidenceCode, setSelectedEvidenceCode] = useState(null)
    const [showEvidenceViewer, setShowEvidenceViewer] = useState(false)
    const [showNewEvidenceModal, setShowNewEvidenceModal] = useState(false) // State cho modal tạo minh chứng

    const breadcrumbItems = [
        { name: 'Báo cáo', icon: FileText, path: '/reports/reports' },
        { name: 'Tạo báo cáo mới', icon: Plus }
    ]

    // Xử lý query params từ task
    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user && router.isReady && !isDataLoaded) {
            fetchInitialData()

            if (router.query.standardId && router.query.criteriaId) {
                setIsFromTask(true)
                preloadTaskData()
            }
            setIsDataLoaded(true)
        }
    }, [user, isLoading, router.isReady, isDataLoaded])

    // Fetch dữ liệu ban đầu (chương trình, tổ chức)
    const fetchInitialData = async () => {
        try {
            setLoading(true)
            const [programsRes, orgsRes] = await Promise.all([
                apiMethods.programs.getAll(),
                apiMethods.organizations.getAll()
            ])
            setPrograms(programsRes.data.data.programs || [])
            setOrganizations(orgsRes.data.data.organizations || [])
        } catch (error) {
            console.error('Fetch initial data error:', error)
            setMessage({ type: 'error', text: 'Lỗi tải dữ liệu ban đầu' })
        } finally {
            setLoading(false)
        }
    }

    // Pre-load dữ liệu từ task (khi có standardId và criteriaId trong URL)
    const preloadTaskData = async () => {
        try {
            const criteriaId = router.query.criteriaId
            const standardId = router.query.standardId
            const reportType = router.query.reportType || 'criteria_analysis'

            // 1. Fetch criteria/standard để lấy programId và organizationId
            const itemToFetch = criteriaId ? apiMethods.criteria.getById(criteriaId) : apiMethods.standards.getById(standardId)
            const itemRes = await itemToFetch
            const itemData = itemRes.data.data

            const programId = itemData.programId?._id || itemData.programId
            const organizationId = itemData.organizationId?._id || itemData.organizationId

            // 2. Cập nhật form data với toàn bộ thông tin từ task
            setFormData(prev => ({
                ...prev,
                criteriaId: criteriaId || '',
                standardId: standardId || '',
                programId,
                organizationId,
                type: reportType === 'tdg' ? 'comprehensive_report' : (reportType === 'standard' ? 'standard_analysis' : 'criteria_analysis'),
                title: `Báo cáo ${itemData.code} - ${itemData.name}` // Tiêu đề mặc định
            }))

        } catch (error) {
            console.error('Preload task data error:', error)
            setMessage({ type: 'error', text: 'Lỗi tải dữ liệu từ nhiệm vụ' })
        }
    }

    // Fetch standards khi program/org thay đổi
    useEffect(() => {
        if (formData.programId && formData.organizationId) {
            fetchStandards()
        }
    }, [formData.programId, formData.organizationId])

    // Fetch criteria khi standard thay đổi
    useEffect(() => {
        if (formData.standardId) {
            fetchCriteria()
        }
    }, [formData.standardId])

    // Lắng nghe click cho Evidence Code trong Editor
    useEffect(() => {
        const handleEvidenceClick = (e) => {
            if (e.target.classList.contains('evidence-link')) {
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

    const fetchStandards = async () => {
        if (!formData.programId || !formData.organizationId) return
        try {
            const response = await apiMethods.standards.getAll({
                programId: formData.programId,
                organizationId: formData.organizationId,
                status: 'active'
            })
            const standards = response.data.data.standards || response.data.data || []
            setStandards(standards)
        } catch (error) {
            console.error('Fetch standards error:', error)
            setMessage({ type: 'error', text: 'Lỗi khi tải danh sách tiêu chuẩn' })
        }
    }

    const fetchCriteria = async () => {
        if (!formData.standardId) return
        try {
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
            setMessage({ type: 'error', text: 'Lỗi khi tải danh sách tiêu chí' })
            setCriteria([])
        }
    }

    const validateForm = () => {
        const errors = {}
        if (!formData.title.trim()) errors.title = 'Tiêu đề báo cáo là bắt buộc'
        if (!formData.programId) errors.programId = 'Chương trình là bắt buộc'
        if (!formData.organizationId) errors.organizationId = 'Tổ chức là bắt buộc'
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
            setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' })
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
            } else {
                submitData.content = ''
            }

            const response = await reportService.createReport(submitData)

            if (response.success) {
                const reportId = response.data._id

                if (formData.contentMethod === 'file_upload' && selectedFile) {
                    try {
                        await reportService.uploadFile(reportId, selectedFile)
                        setMessage({ type: 'success', text: 'Tạo báo cáo và upload file thành công' })
                    } catch (uploadError) {
                        console.error('Upload error:', uploadError)
                        setMessage({ type: 'success', text: 'Báo cáo đã được tạo nhưng có lỗi khi upload file' })
                    }
                } else {
                    setMessage({ type: 'success', text: 'Tạo báo cáo thành công' })
                }

                setTimeout(() => {
                    router.push(`/reports/reports`)
                }, 1500)
            }
        } catch (error) {
            console.error('Submit error:', error)
            let errorMessage = 'Lỗi tạo báo cáo'
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error.message) {
                errorMessage = error.message
            }
            setMessage({ type: 'error', text: errorMessage })
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
            const maxSize = 50 * 1024 * 1024
            if (file.size > maxSize) {
                setMessage({ type: 'error', text: 'File không được vượt quá 50MB' })
                return
            }

            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]

            if (!allowedTypes.includes(file.type)) {
                setMessage({ type: 'error', text: 'Chỉ chấp nhận file PDF hoặc Word' })
                return
            }

            setSelectedFile(file)
            setFormErrors(prev => ({ ...prev, file: '' }))
        }
    }

    const handleInsertEvidence = (code) => {
        if (editorRef.current?.insertEvidenceCode) {
            editorRef.current.insertEvidenceCode(code)
            toast.success(`Đã chèn mã minh chứng ${code}`)
        }
    }

    const handleContentChange = useCallback((content) => {
        setFormData(prev => ({ ...prev, content }))
        if (content.trim() && !isContentDirty) {
            setIsContentDirty(true)
        } else if (!content.trim() && isContentDirty) {
            setIsContentDirty(false)
        }
        if (formErrors.content) {
            setFormErrors(prev => ({ ...prev, content: '' }))
        }
    }, [isContentDirty, formErrors])


    const handleChange = (field, value) => {
        if (isContentDirty) {
            const confirmChange = window.confirm(
                'Nội dung báo cáo đã thay đổi. Thay đổi Tiêu chuẩn/Tiêu chí/Chương trình sẽ xóa nội dung hiện tại. Bạn có chắc chắn muốn tiếp tục?'
            )
            if (!confirmChange) return

            // Nếu đồng ý, xóa nội dung
            setFormData(prev => ({ ...prev, content: '' }))
            setIsContentDirty(false)
            if (editorRef.current) {
                editorRef.current.getContent = () => '' // Reset nội dung editor
            }
        }

        setFormData(prev => ({ ...prev, [field]: value }))
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleOpenNewEvidenceModal = () => {
        if (!formData.criteriaId) {
            toast.error('Vui lòng chọn Tiêu chí trước khi tạo minh chứng mới.')
            return
        }
        setShowNewEvidenceModal(true)
    }


    if (isLoading || loading) {
        return (
            <BaseLayout title="Đang tải..." breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </BaseLayout>
        )
    }

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            <div className="flex gap-6">
                {/* Main Form */}
                <div className="flex-1 space-y-6">
                    {/* Message Alert */}
                    {message.text && (
                        <div className={`rounded-2xl border p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
                            message.type === 'success'
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                                : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
                        }`}>
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        message.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                        <AlertCircle className={`w-7 h-7 ${
                                            message.type === 'success' ? 'text-green-600' : 'text-red-600'
                                        }`} />
                                    </div>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className={`font-bold text-lg mb-1 ${
                                        message.type === 'success' ? 'text-green-900' : 'text-red-900'
                                    }`}>
                                        {message.type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra'}
                                    </h3>
                                    <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                                        {message.text}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setMessage({ type: '', text: '' })}
                                    className="ml-4 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-1">
                                        {isFromTask ? 'Viết báo cáo từ nhiệm vụ' : 'Tạo báo cáo mới'}
                                    </h1>
                                    <p className="text-indigo-100">
                                        {isFromTask ? 'Hoàn thành báo cáo từ nhiệm vụ được giao' : 'Tạo báo cáo phân tích tiêu chuẩn/tiêu chí'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/reports/reports')}
                                className="flex items-center space-x-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:shadow-xl transition-all font-medium"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Quay lại</span>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Thông tin cơ bản */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-indigo-600" />
                                Thông tin cơ bản
                            </h2>

                            <div className="space-y-6">
                                {/* Tiêu đề */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tiêu đề báo cáo <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                            formErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                        placeholder="Nhập tiêu đề báo cáo"
                                        maxLength={500}
                                        readOnly={isFromTask} // Chỉ cho phép sửa nếu không phải từ task
                                    />
                                    {formErrors.title && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Loại báo cáo */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <FileType className="w-4 h-4 inline mr-1" />
                                            Loại báo cáo <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => handleChange('type', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            disabled={isFromTask}
                                        >
                                            <option value="criteria_analysis">Phiếu phân tích tiêu chí</option>
                                            <option value="standard_analysis">Phiếu phân tích tiêu chuẩn</option>
                                            <option value="comprehensive_report">Báo cáo tổng hợp</option>
                                        </select>
                                    </div>

                                    {/* Phương thức nhập */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phương thức nhập <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.contentMethod}
                                            onChange={(e) => handleChange('contentMethod', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        >
                                            <option value="online_editor">Soạn thảo trực tuyến</option>
                                            <option value="file_upload">Upload file</option>
                                        </select>
                                    </div>

                                    {/* Chương trình */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <BookOpen className="w-4 h-4 inline mr-1" />
                                            Chương trình <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.programId}
                                            onChange={(e) => {
                                                handleChange('programId', e.target.value)
                                                setFormData(prev => ({ ...prev, standardId: '', criteriaId: '' }))
                                            }}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                                formErrors.programId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                            disabled={isFromTask}
                                        >
                                            <option value="">Chọn chương trình</option>
                                            {programs.map(program => (
                                                <option key={program._id} value={program._id}>
                                                    {program.name}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.programId && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.programId}</p>
                                        )}
                                        {isFromTask && formData.programId && (
                                            <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                                ✓ Được tự động chọn từ nhiệm vụ
                                            </p>
                                        )}
                                    </div>

                                    {/* Tổ chức */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Building className="w-4 h-4 inline mr-1" />
                                            Tổ chức <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.organizationId}
                                            onChange={(e) => handleChange('organizationId', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                                formErrors.organizationId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                            disabled={isFromTask}
                                        >
                                            <option value="">Chọn tổ chức</option>
                                            {organizations.map(org => (
                                                <option key={org._id} value={org._id}>
                                                    {org.name}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.organizationId && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.organizationId}</p>
                                        )}
                                        {isFromTask && formData.organizationId && (
                                            <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                                ✓ Được tự động chọn từ nhiệm vụ
                                            </p>
                                        )}
                                    </div>

                                    {/* Tiêu chuẩn */}
                                    {formData.type !== 'comprehensive_report' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Layers className="w-4 h-4 inline mr-1" />
                                                Tiêu chuẩn <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.standardId}
                                                onChange={(e) => {
                                                    handleChange('standardId', e.target.value)
                                                    setFormData(prev => ({ ...prev, criteriaId: '' }))
                                                }}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                                    formErrors.standardId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                                disabled={!formData.programId || !formData.organizationId || isFromTask}
                                            >
                                                <option value="">Chọn tiêu chuẩn</option>
                                                {standards.map(standard => (
                                                    <option key={standard._id} value={standard._id}>
                                                        {standard.code} - {standard.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.standardId && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors.standardId}</p>
                                            )}
                                            {isFromTask && formData.standardId && (
                                                <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                                    ✓ Được tự động chọn từ nhiệm vụ
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Tiêu chí */}
                                    {formData.type === 'criteria_analysis' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Hash className="w-4 h-4 inline mr-1" />
                                                Tiêu chí <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.criteriaId}
                                                onChange={(e) => handleChange('criteriaId', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                                    formErrors.criteriaId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                                disabled={!formData.standardId || isFromTask}
                                            >
                                                <option value="">Chọn tiêu chí</option>
                                                {criteria.map(criterion => (
                                                    <option key={criterion._id} value={criterion._id}>
                                                        {criterion.code} - {criterion.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.criteriaId && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors.criteriaId}</p>
                                            )}
                                            {isFromTask && formData.criteriaId && (
                                                <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                                                    ✓ Được tự động chọn từ nhiệm vụ
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Nội dung */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <AlignLeft className="w-6 h-6 text-indigo-600" />
                                Nội dung báo cáo
                            </h2>

                            {formData.contentMethod === 'online_editor' ? (
                                <div>
                                    <RichTextEditor
                                        ref={editorRef}
                                        value={formData.content}
                                        onChange={handleContentChange}
                                        placeholder="Nhập nội dung báo cáo..."
                                    />
                                    {formErrors.content && (
                                        <p className="text-red-500 text-sm mt-2">{formErrors.content}</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-indigo-400 transition-all">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Upload className="w-8 h-8 text-indigo-600" />
                                            </div>
                                            <p className="text-base font-medium text-gray-900 mb-2">
                                                Kéo thả file hoặc click để chọn
                                            </p>
                                            <p className="text-sm text-gray-500 mb-4">
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
                                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg cursor-pointer transition-all font-medium"
                                            >
                                                <File className="w-5 h-5 mr-2" />
                                                Chọn file
                                            </label>
                                        </div>

                                        {selectedFile && (
                                            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center flex-1 min-w-0">
                                                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                                            <File className="w-6 h-6 text-indigo-600" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">
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
                                                        className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.file && (
                                        <p className="text-red-500 text-sm mt-2">{formErrors.file}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Thông tin bổ sung */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Tag className="w-6 h-6 text-indigo-600" />
                                Thông tin bổ sung
                            </h2>

                            <div className="space-y-6">
                                {/* Tóm tắt */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tóm tắt
                                    </label>
                                    <textarea
                                        value={formData.summary}
                                        onChange={(e) => handleChange('summary', e.target.value)}
                                        rows={4}
                                        maxLength={1000}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                                        placeholder="Tóm tắt ngắn gọn về nội dung báo cáo"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.summary.length}/1000 ký tự
                                    </p>
                                </div>

                                {/* Từ khóa */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Từ khóa
                                    </label>
                                    <div className="flex gap-3 mb-3">
                                        <input
                                            type="text"
                                            value={keywordInput}
                                            onChange={(e) => setKeywordInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            placeholder="Nhập từ khóa và nhấn Enter"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddKeyword}
                                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.keywords.map((keyword, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-sm font-medium border border-indigo-200"
                                            >
                                                {keyword}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveKeyword(keyword)}
                                                    className="ml-2 text-indigo-500 hover:text-indigo-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-4 pt-6">
                            <button
                                type="button"
                                onClick={() => router.push('/reports/reports')}
                                className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl disabled:opacity-50 transition-all font-medium"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>Đang tạo...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Tạo báo cáo</span>
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
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

                                {formData.criteriaId && (
                                    <button
                                        onClick={handleOpenNewEvidenceModal}
                                        className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm gap-2"
                                    >
                                        <FilePlus className="h-5 w-5" />
                                        Tạo Minh chứng Mới
                                    </button>
                                )}

                                <EvidencePicker
                                    standardId={formData.standardId}
                                    criteriaId={formData.criteriaId}
                                    programId={formData.programId}
                                    organizationId={formData.organizationId}
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

            {showNewEvidenceModal && (
                <NewEvidenceModal
                    criteriaId={formData.criteriaId}
                    standardId={formData.standardId}
                    programId={formData.programId}
                    organizationId={formData.organizationId}
                    onClose={() => setShowNewEvidenceModal(false)}
                    // onEvidenceCreated (Optional: làm mới EvidencePicker sau khi tạo thành công)
                />
            )}
        </Layout>
    )
}