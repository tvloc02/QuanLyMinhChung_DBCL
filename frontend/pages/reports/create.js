import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import RichTextEditor from '../../components/reports/RichTextEditor'
import ReportEvidencePicker from '../../components/reports/ReportEvidencePicker'
import EvidenceViewer from '../../components/reports/EvidenceViewer'
import ReportSelectionModal from '../../components/reports/ReportSelectionModal'
import toast from 'react-hot-toast'
import {
    FileText, Save, ArrowLeft, Upload, Eye, BookOpen, Building,
    Layers, Hash, FileType, AlignLeft, Tag, X, File, AlertCircle,
    RefreshCw, Plus, FilePlus, Lock
} from 'lucide-react'
import reportService from '../../services/reportService'
import { apiMethods } from '../../services/api'
import { default as BaseLayout } from '../../components/common/Layout'
import NewEvidenceModal from '../../components/reports/NewEvidenceModal'

const getReportTypeLabel = (type) => {
    const typeMap = {
        'criteria': 'Báo cáo tiêu chí',
        'standard': 'Báo cáo tiêu chuẩn',
        'overall_tdg': 'Báo cáo tổng hợp TĐG'
    }
    return typeMap[type] || type
}

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
    const [isFromContext, setIsFromContext] = useState(false)
    const [showReportSelectionModal, setShowReportSelectionModal] = useState(false)
    const [isContentDirty, setIsContentDirty] = useState(false)
    const [isDataLoaded, setIsDataLoaded] = useState(false)
    const [isLocked, setIsLocked] = useState({})
    const [linkedCriteriaReports, setLinkedCriteriaReports] = useState([])

    // State để lưu context data
    const [contextData, setContextData] = useState({
        programId: null,
        organizationId: null,
        standardId: null,
        criteriaId: null,
        type: 'criteria',
        taskId: null
    })

    const [formData, setFormData] = useState({
        title: '',
        type: 'criteria',
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        content: '',
        contentMethod: 'online_editor',
        summary: '',
        keywords: [],
        taskId: null
    })

    const [formErrors, setFormErrors] = useState({})
    const [keywordInput, setKeywordInput] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [selectedEvidenceCode, setSelectedEvidenceCode] = useState(null)
    const [showEvidenceViewer, setShowEvidenceViewer] = useState(false)
    const [showNewEvidenceModal, setShowNewEvidenceModal] = useState(false)
    const [showCriteriaReportPicker, setShowCriteriaReportPicker] = useState(false)

    // Cờ kiểm soát việc đã xử lý modal lần đầu chưa
    const [hasHandledInitialModal, setHasHandledInitialModal] = useState(false)

    const breadcrumbItems = [
        { name: 'Báo cáo', icon: FileText, path: '/reports/reports' },
        { name: 'Tạo báo cáo mới', icon: Plus }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user && router.isReady && !isDataLoaded) {
            fetchInitialData()

            const { taskId, reportType, standardId, criteriaId, programId, organizationId, forceModal } = router.query

            if (taskId || (reportType && standardId)) {
                setIsFromContext(true)

                const newContextData = {
                    taskId: taskId || null,
                    type: reportType || 'criteria',
                    standardId: standardId || '',
                    criteriaId: criteriaId || '',
                    programId: programId || '',
                    organizationId: organizationId || ''
                }
                setContextData(newContextData)

                setFormData(prev => ({
                    ...prev,
                    taskId: newContextData.taskId,
                    type: newContextData.type,
                    standardId: newContextData.standardId,
                    criteriaId: newContextData.criteriaId,
                    programId: newContextData.programId,
                    organizationId: newContextData.organizationId,
                }))

                const newIsLocked = {}
                if (newContextData.type !== 'overall_tdg') {
                    newIsLocked.programId = true
                    newIsLocked.organizationId = true
                    newIsLocked.standardId = true
                    newIsLocked.reportType = true

                    if (newContextData.type === 'criteria') {
                        newIsLocked.criteriaId = true
                    }
                }
                setIsLocked(newIsLocked)

                // Chỉ hiển thị modal nếu chưa xử lý lần đầu
                if (!hasHandledInitialModal) {
                    setShowReportSelectionModal(true)
                }
            }
            setIsDataLoaded(true)
        }
    }, [user, isLoading, router.isReady, isDataLoaded, hasHandledInitialModal])

    useEffect(() => {
        if (formData.programId && formData.organizationId) {
            fetchStandards()
        }
    }, [formData.programId, formData.organizationId])

    useEffect(() => {
        if (formData.standardId) {
            fetchCriteria()
        }
    }, [formData.standardId])

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
        const errors = {};

        // ===== BASIC FIELDS =====
        if (!formData.title.trim()) {
            errors.title = 'Tiêu đề báo cáo là bắt buộc';
        }

        if (!formData.programId) {
            errors.programId = 'Chương trình là bắt buộc';
        }

        if (!formData.organizationId) {
            errors.organizationId = 'Tổ chức là bắt buộc';
        }

        if (formData.type !== 'overall_tdg' && !formData.standardId) {
            errors.standardId = 'Tiêu chuẩn là bắt buộc';
        }

        if (formData.type === 'criteria' && !formData.criteriaId) {
            errors.criteriaId = 'Tiêu chí là bắt buộc';
        }

        // ===== CONTENT VALIDATION =====
        if (formData.contentMethod === 'online_editor') {
            const plainText = editorRef.current?.getContent?.() || '';

            // Loại bỏ HTML tags để kiểm tra text thực tế
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = plainText;
            const textContent = tempDiv.textContent || '';

            if (!textContent.trim()) {
                errors.content = 'Nội dung báo cáo là bắt buộc (tối thiểu một số ký tự)';
            }
        } else if (formData.contentMethod === 'file_upload') {
            if (!selectedFile) {
                errors.file = 'Vui lòng chọn file để upload';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

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
                keywords: formData.keywords,
            }

            if (formData.type !== 'overall_tdg') {
                submitData.standardId = formData.standardId
            }
            if (formData.type === 'criteria') {
                submitData.criteriaId = formData.criteriaId
            }
            if (formData.taskId) {
                submitData.taskId = formData.taskId
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
                    router.push(`/reports/${reportId}`)
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
        if (isLocked[field]) {
            return
        }

        if (isContentDirty && ['programId', 'organizationId', 'standardId', 'criteriaId'].includes(field)) {
            const confirmChange = window.confirm(
                'Nội dung báo cáo đã thay đổi. Thay đổi Tiêu chuẩn/Tiêu chí/Chương trình sẽ xóa nội dung hiện tại. Bạn có chắc chắn muốn tiếp tục?'
            )
            if (!confirmChange) return

            setFormData(prev => ({ ...prev, content: '' }))
            setIsContentDirty(false)
            if (editorRef.current) {
                editorRef.current.getContent = () => ''
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

    const handleSelectExistingReport = (reportId) => {
        // Sau khi chọn báo cáo đã có, chuyển hướng đến trang chỉnh sửa
        router.push(`/reports/${reportId}`)
        setHasHandledInitialModal(true)
    }

    const handleCreateNewReport = () => {
        // Sau khi chọn tạo báo cáo mới, đóng modal và đánh dấu đã xử lý
        setShowReportSelectionModal(false)
        setHasHandledInitialModal(true)

        // Giữ lại các thông tin đã được ghim từ context
        setFormData(prev => ({
            ...prev,
            title: '',
            content: '',
            type: contextData.type,
            standardId: contextData.standardId,
            criteriaId: contextData.criteriaId,
            programId: contextData.programId,
            organizationId: contextData.organizationId,
            taskId: contextData.taskId,
        }))
        setIsFromContext(false);
    }

    const handleInsertCriteriaReports = (selectedReports) => {
        if (!editorRef.current) {
            toast.error('Lỗi: Không thể truy cập trình soạn thảo.');
            return;
        }

        if (typeof editorRef.current.insertHTML !== 'function') {
            toast.error('Lỗi: Trình soạn thảo không có method insertHTML.');
            return;
        }

        let htmlToInsert = '';

        selectedReports.forEach((report, index) => {
            htmlToInsert += report.content;

            if (index < selectedReports.length - 1) {
                htmlToInsert += '<p><br></p>';
            }
        });

        try {
            const success = editorRef.current.insertHTML(htmlToInsert);

            if (success) {
                setLinkedCriteriaReports(prev => [
                    ...prev,
                    ...selectedReports.filter(sr =>
                        !prev.some(p => p._id === sr._id)
                    )
                ]);

                toast.success(`Đã chèn ${selectedReports.length} báo cáo`);
            } else {
                toast.error('Không thể chèn nội dung. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Insert reports error:', error);
            toast.error(`Lỗi khi chèn: ${error.message}`);
        }
    };


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
            {showCriteriaReportPicker && (
                <CriteriaReportPickerModal
                    isOpen={showCriteriaReportPicker}
                    reportType={formData.type}  // ← THÊM DÒNG NÀY
                    standardId={formData.standardId}
                    programId={formData.programId}
                    organizationId={formData.organizationId}
                    initialReports={linkedCriteriaReports}
                    onClose={() => setShowCriteriaReportPicker(false)}
                    onSelectReports={(selected) => {
                        handleInsertCriteriaReports(selected);
                        setShowCriteriaReportPicker(false);
                    }}
                />
            )}

            {/* New Evidence Modal */}
            {showNewEvidenceModal && (
                <NewEvidenceModal
                    criteriaId={formData.criteriaId}
                    standardId={formData.standardId}
                    programId={formData.programId}
                    organizationId={formData.organizationId}
                    onClose={() => setShowNewEvidenceModal(false)}
                    onSuccess={() => {
                        setShowNewEvidenceModal(false)
                        toast.success('Minh chứng mới đã được tạo thành công và sẵn sàng để chèn.')
                    }}
                />
            )}


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
                                        {formData.taskId ? 'Viết báo cáo từ nhiệm vụ' : 'Tạo báo cáo mới'}
                                    </h1>
                                    <p className="text-indigo-100">
                                        {formData.taskId ? 'Hoàn thành báo cáo từ nhiệm vụ được giao' : 'Tạo báo cáo phân tích tiêu chuẩn/tiêu chí'}
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
                                    />
                                    {formErrors.title && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Loại báo cáo */}
                                    {formData.type !== 'overall_tdg' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <FileType className="w-4 h-4 inline mr-1" />
                                                Loại báo cáo <span className="text-red-500">*</span>
                                                {isLocked.reportType && <Lock className="w-4 h-4 inline ml-1 text-blue-500" title="Đã khóa từ yêu cầu" />}
                                            </label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => handleChange('type', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                disabled={isLocked.reportType}
                                            >
                                                <option value="criteria">Báo cáo tiêu chí</option>
                                                <option value="standard">Báo cáo tiêu chuẩn</option>
                                            </select>
                                        </div>
                                    )}

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
                                            {isLocked.programId && <Lock className="w-4 h-4 inline ml-1 text-blue-500" title="Đã khóa từ yêu cầu" />}
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
                                            disabled={isLocked.programId}
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
                                    </div>

                                    {/* Tổ chức */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Building className="w-4 h-4 inline mr-1" />
                                            Tổ chức <span className="text-red-500">*</span>
                                            {isLocked.organizationId && <Lock className="w-4 h-4 inline ml-1 text-blue-500" title="Đã khóa từ yêu cầu" />}
                                        </label>
                                        <select
                                            value={formData.organizationId}
                                            onChange={(e) => handleChange('organizationId', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                                formErrors.organizationId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                            disabled={isLocked.organizationId}
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
                                    </div>

                                    {/* Tiêu chuẩn */}
                                    {formData.type !== 'overall_tdg' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Layers className="w-4 h-4 inline mr-1" />
                                                Tiêu chuẩn <span className="text-red-500">*</span>
                                                {isLocked.standardId && <Lock className="w-4 h-4 inline ml-1 text-blue-500" title="Đã khóa từ yêu cầu" />}
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
                                                disabled={!formData.programId || !formData.organizationId || isLocked.standardId}
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
                                        </div>
                                    )}

                                    {/* Tiêu chí */}
                                    {formData.type === 'criteria' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Hash className="w-4 h-4 inline mr-1" />
                                                Tiêu chí <span className="text-red-500">*</span>
                                                {isLocked.criteriaId && <Lock className="w-4 h-4 inline ml-1 text-blue-500" title="Đã khóa từ yêu cầu" />}
                                            </label>
                                            <select
                                                value={formData.criteriaId}
                                                onChange={(e) => handleChange('criteriaId', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                                                    formErrors.criteriaId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                                disabled={!formData.standardId || isLocked.criteriaId}
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

                            {/* Gắn Báo cáo Tiêu chí Công Khai */}
                            {formData.type === 'standard' && (
                                <div className="mt-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
                                    <h4 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-indigo-600" />
                                        Chèn Nội Dung Báo Cáo Tiêu Chí
                                    </h4>

                                    {/* Danh sách các báo cáo đã chọn */}
                                    <div className="space-y-2">
                                        {linkedCriteriaReports.map(report => (
                                            <div key={report._id} className="flex items-center justify-between p-3 border border-indigo-200 bg-white rounded-lg shadow-sm">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-indigo-800 truncate">
                                                        {report.name} ({report.code})
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center mt-1">
                                                        Hiển thị tên người viết:
                                                        <select
                                                            value={report.displayAuthor ? 'true' : 'false'}
                                                            onChange={(e) => {
                                                                setLinkedCriteriaReports(prev => prev.map(r => r._id === report._id ? { ...r, displayAuthor: e.target.value === 'true' } : r))
                                                            }}
                                                            className="ml-2 text-xs border border-gray-300 rounded-md p-1 focus:ring-indigo-500"
                                                        >
                                                            <option value={'true'}>Có</option>
                                                            <option value={'false'}>Không</option>
                                                        </select>
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setLinkedCriteriaReports(prev => prev.filter(r => r._id !== report._id))}
                                                    className="p-2 text-red-500 hover:text-red-700 ml-4 rounded-lg hover:bg-red-50 transition-all"
                                                    title="Bỏ chèn"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        {!linkedCriteriaReports.length && (
                                            <p className="text-sm text-gray-500 italic py-2">Chưa có báo cáo tiêu chí nào được chèn.</p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Kiểm tra điều kiện theo loại báo cáo
                                            if (formData.type === 'overall_tdg') {
                                                if (!formData.programId || !formData.organizationId) {
                                                    toast.error('Vui lòng chọn Chương trình và Tổ chức trước khi chèn báo cáo.')
                                                    return
                                                }
                                            } else if (formData.type === 'standard') {
                                                if (!formData.standardId) {
                                                    toast.error('Vui lòng chọn Tiêu chuẩn trước khi chèn báo cáo.')
                                                    return
                                                }
                                            } else if (formData.type === 'criteria') {
                                                toast.error('Báo cáo tiêu chí không thể chèn báo cáo khác.')
                                                return
                                            }
                                            setShowCriteriaReportPicker(true)
                                        }}
                                        className="flex items-center mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:shadow-lg hover:bg-indigo-700 transition-colors"
                                        disabled={formData.type === 'criteria' || !formData.standardId && formData.type === 'standard'}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Chọn & Chèn Nội Dung
                                    </button>
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

                {/* Sidebar - Evidence Picker (Luôn hiển thị) */}
                {formData.contentMethod === 'online_editor' && (
                    <div className="w-96 flex-shrink-0">
                        <div className="sticky top-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

                                {/* Nút Tạo Minh Chứng Mới */}
                                <button
                                    onClick={handleOpenNewEvidenceModal}
                                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm gap-2"
                                    // Vô hiệu hóa nếu chưa chọn tiêu chí
                                    disabled={!formData.criteriaId}
                                >
                                    <FilePlus className="h-5 w-5" />
                                    Tạo Minh chứng Mới
                                </button>

                                <ReportEvidencePicker
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
        </Layout>
    )
}

function CriteriaReportPickerModal({
                                       isOpen,
                                       standardId,
                                       programId,
                                       organizationId,
                                       reportType,
                                       initialReports,
                                       onClose,
                                       onSelectReports
                                   }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchInsertableReports();
        }
    }, [isOpen, reportType, standardId, programId, organizationId]);

    const fetchInsertableReports = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                reportType: reportType
            };

            if (reportType === 'standard' && standardId) {
                params.standardId = standardId;
            } else if (reportType === 'overall_tdg') {
                if (programId) params.programId = programId;
                if (organizationId) params.organizationId = organizationId;
            }

            const response = await apiMethods.reports.getInsertable(params);

            if (response.data?.data?.reports) {
                const fetchedReports = response.data.data.reports.map(report => {
                    const initial = initialReports?.find(ir => ir._id === report._id);
                    return {
                        ...report,
                        isSelected: initial ? true : false,
                        displayAuthor: initial?.displayAuthor ?? true
                    };
                });
                setReports(fetchedReports);
            }
        } catch (err) {
            console.error('Fetch insertable reports error:', err);
            setError('Không thể tải danh sách báo cáo. Vui lòng thử lại.');
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (reportId) => {
        setReports(prev => prev.map(r =>
            r._id === reportId ? { ...r, isSelected: !r.isSelected } : r
        ));
    };

    const handleAuthorToggle = (reportId, value) => {
        setReports(prev => prev.map(r =>
            r._id === reportId ? { ...r, displayAuthor: value === 'true' } : r
        ));
    };

    const handleSave = () => {
        const selectedReports = reports.filter(r => r.isSelected);
        if (selectedReports.length === 0) {
            toast.error('Vui lòng chọn ít nhất một báo cáo');
            return;
        }
        onSelectReports(selectedReports);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            Chọn Báo Cáo Để Chèn Vào
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {reportType === 'overall_tdg' && 'Chọn báo cáo tiêu chuẩn hoặc tiêu chí để chèn'}
                            {reportType === 'standard' && 'Chọn báo cáo tiêu chí để chèn'}
                            {reportType === 'criteria' && 'Báo cáo tiêu chí không thể chèn báo cáo khác'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600">Đang tải danh sách báo cáo...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                            <p className="font-semibold mb-2">Lỗi</p>
                            <p className="text-sm">{error}</p>
                            <button
                                onClick={fetchInsertableReports}
                                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : reports.length > 0 ? (
                        reports.map(report => (
                            <div
                                key={report._id}
                                className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                            >
                                <input
                                    type="checkbox"
                                    checked={report.isSelected}
                                    onChange={() => handleToggle(report._id)}
                                    className="w-5 h-5 text-indigo-600 rounded mt-1 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0 ml-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-semibold text-indigo-700">
                                            {report.code}
                                        </p>
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                            {report.type === 'criteria' ? 'Tiêu chí' : 'Tiêu chuẩn'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-900 font-medium mb-2">
                                        {report.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                        Tác giả: <span className="font-medium">{report.createdBy?.fullName || 'N/A'}</span>
                                    </p>

                                    {/* Preview nội dung rút gọn */}
                                    {report.content && (
                                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-2 line-clamp-2 border-l-2 border-gray-300">
                                            <div dangerouslySetInnerHTML={{
                                                __html: report.content.substring(0, 150) + '...'
                                            }} />
                                        </div>
                                    )}

                                    {/* Hiển thị thông tin tiêu chuẩn/tiêu chí */}
                                    <div className="text-xs text-gray-500 space-y-1">
                                        {report.standard && (
                                            <p>
                                                📋 Tiêu chuẩn: <span className="font-medium">{report.standard.code} - {report.standard.name}</span>
                                            </p>
                                        )}
                                        {report.criteria && (
                                            <p>
                                                ✓ Tiêu chí: <span className="font-medium">{report.criteria.code} - {report.criteria.name}</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Tuỳ chọn hiển thị tác giả */}
                                    {report.isSelected && (
                                        <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-200">
                                            <label className="text-xs text-gray-700 flex items-center">
                                                <span className="mr-2">Hiển thị tên tác giả:</span>
                                                <select
                                                    value={report.displayAuthor ? 'true' : 'false'}
                                                    onChange={(e) => handleAuthorToggle(report._id, e.target.value)}
                                                    className="px-2 py-1 border border-indigo-200 rounded text-xs focus:ring-indigo-500"
                                                >
                                                    <option value="true">✓ Có</option>
                                                    <option value="false">✗ Không</option>
                                                </select>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">
                                Không có báo cáo nào có thể chèn
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!reports.some(r => r.isSelected)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Chèn ({reports.filter(r => r.isSelected).length})
                    </button>
                </div>
            </div>
        </div>
    );
}