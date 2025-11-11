import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/common/Layout'
import RichTextEditor from '../../../components/reports/RichTextEditor'
import ReportEvidencePicker from '../../../components/reports/ReportEvidencePicker'
import EvidenceViewer from '../../../components/reports/EvidenceViewer'
import toast from 'react-hot-toast'
import {
    FileText, Save, ArrowLeft, Upload, BookOpen, Building,
    Layers, Hash, FileType, AlignLeft, Tag, X, File, AlertCircle,
    RefreshCw, Plus, FilePlus, Lock, Check, Edit2
} from 'lucide-react'
import reportService from '../../../services/reportService'
import { apiMethods } from '../../../services/api'
import { default as BaseLayout } from '../../../components/common/Layout'
import NewEvidenceModal from '../../../components/reports/NewEvidenceModal'

function CriteriaReportPickerModal({ isOpen, reportType, standardId, programId, organizationId, initialReports, onClose, onSelectReports }) {
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [selectedReports, setSelectedReports] = useState(initialReports || []);
    const isOverallTdg = reportType === 'overall_tdg';
    const isStandard = reportType === 'standard';

    const getReportTypeLabel = (type) => {
        const typeMap = {
            'criteria': 'Báo cáo tiêu chí',
            'standard': 'Báo cáo tiêu chuẩn',
            'overall_tdg': 'Báo cáo tổng hợp TĐG'
        }
        return typeMap[type] || type
    }

    const fetchReports = async () => {
        if (!programId || !organizationId || (isStandard && !standardId)) {
            setReports([]);
            return;
        }

        try {
            setLoadingReports(true);
            const params = { reportType, standardId, programId, organizationId };
            const response = await apiMethods.reports.getInsertable(params);

            const fetchedReports = response.data?.reports || [];

            const availableReports = fetchedReports.filter(fr => !initialReports.some(ir => ir._id === fr._id));

            setReports(availableReports);
        } catch (error) {
            toast.error("Lỗi khi tải danh sách báo cáo có thể chèn.");
            setReports([]);
        } finally {
            setLoadingReports(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchReports();
        }
    }, [isOpen, reportType, standardId, programId, organizationId]);

    const handleToggleSelect = (report) => {
        setSelectedReports(prev => {
            if (prev.some(r => r._id === report._id)) {
                return prev.filter(r => r._id !== report._id);
            } else {
                // Đảm bảo cấu trúc data giống với linkedCriteriaReports
                return [...prev, { ...report, name: report.title, code: report.code, _id: report._id }];
            }
        });
    };

    if (!isOpen) return null;

    const contextReady = isOverallTdg ? (programId && organizationId) : (isStandard && standardId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        Chọn Báo Cáo Công Khai để Chèn (Cấp thấp hơn)
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {!contextReady ? (
                        <div className="bg-red-50 text-red-800 p-3 rounded-lg">Vui lòng chọn đầy đủ Chương trình/Tổ chức và Tiêu chuẩn (nếu cần) để tải danh sách báo cáo phù hợp.</div>
                    ) : loadingReports ? (
                        <div className="text-center py-8">Đang tải báo cáo...</div>
                    ) : reports.length === 0 ? (
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg">Không tìm thấy báo cáo đã công khai/phát hành phù hợp để chèn.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {reports.map(report => (
                                <div
                                    key={report._id}
                                    className={`p-4 border rounded-xl transition-all cursor-pointer flex justify-between items-center ${
                                        selectedReports.some(r => r._id === report._id)
                                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                                            : 'bg-white border-gray-200 hover:border-gray-400'
                                    }`}
                                    onClick={() => handleToggleSelect(report)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-sm font-semibold text-gray-600">{report.code}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                                report.type === 'standard' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {getReportTypeLabel(report.type)}
                                            </span>
                                        </div>
                                        <p className="font-medium text-gray-900 truncate">{report.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {report.standard?.code && `Tiêu chuẩn ${report.standard.code}`}
                                            {report.criteria?.code && report.type === 'criteria' && ` | Tiêu chí ${report.criteria.code}`}
                                            {report.createdBy?.fullName && ` | Tác giả: ${report.createdBy.fullName}`}
                                        </p>
                                    </div>
                                    <div className="ml-4">
                                        {selectedReports.some(r => r._id === report._id) ? (
                                            <Check className="w-5 h-5 text-blue-600" />
                                        ) : (
                                            <Plus className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => onSelectReports(selectedReports)}
                        disabled={selectedReports.length === 0}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
                    >
                        Chèn {selectedReports.length} Báo Cáo
                    </button>
                </div>
            </div>
        </div>
    );
}

const getReportTypeLabel = (type) => {
    const typeMap = {
        'criteria': 'Báo cáo tiêu chí',
        'standard': 'Báo cáo tiêu chuẩn',
        'overall_tdg': 'Báo cáo tổng hợp TĐG'
    }
    return typeMap[type] || type
}

export default function EditReportPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const { id } = router.query // Có thể là ID báo cáo để sửa hoặc 'new' (chỉ định tạo mới)
    const editorRef = useRef(null)

    const isEditMode = id && id !== 'new'

    const [originalReport, setOriginalReport] = useState(null); // Báo cáo gốc khi ở chế độ Edit
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [isDataLoaded, setIsDataLoaded] = useState(false)

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
    const [linkedCriteriaReports, setLinkedCriteriaReports] = useState([])
    const [isContentDirty, setIsContentDirty] = useState(false)

    const breadcrumbItems = [
        { name: 'Báo cáo', icon: FileText, path: '/reports/reports' },
        { name: isEditMode ? 'Chỉnh sửa báo cáo' : 'Tạo báo cáo mới', icon: isEditMode ? Edit2 : Plus }
    ]

    const mapReportToForm = (reportData) => {
        return {
            title: reportData.title || '',
            type: reportData.type || 'criteria',
            programId: reportData.programId?._id || reportData.programId || '',
            organizationId: reportData.organizationId?._id || reportData.organizationId || '',
            standardId: reportData.standardId?._id || reportData.standardId || '',
            criteriaId: reportData.criteriaId?._id || reportData.criteriaId || '',
            content: reportData.content || '',
            contentMethod: reportData.contentMethod || 'online_editor',
            summary: reportData.summary || '',
            keywords: reportData.keywords || [],
            taskId: reportData.taskId || null
        }
    }

    const fetchInitialData = async () => {
        try {
            const [programsRes, orgsRes] = await Promise.all([
                apiMethods.programs.getAll(),
                apiMethods.organizations.getAll()
            ])
            setPrograms(programsRes.data.data.programs || [])
            setOrganizations(orgsRes.data.data.organizations || [])

            if (isEditMode) {
                const reportRes = await apiMethods.reports.getById(id);
                const reportData = reportRes.data.data;

                // Load initial linked reports
                const initialLinkedReports = reportData.linkedCriteriaReports?.map(id => ({
                    _id: id,
                    name: 'Đang tải...', // Placeholder
                    code: '...',
                })) || [];
                setLinkedCriteriaReports(initialLinkedReports);

                setOriginalReport(reportData);
                setFormData(mapReportToForm(reportData));

                // Cần load full data của linked reports nếu có thể
                // Logic phức tạp, tạm thời bỏ qua phần tải full data của linked reports từ server để giữ tính khả thi

            }
        } catch (error) {
            console.error('Fetch initial data error:', error)
            setMessage({ type: 'error', text: 'Lỗi tải dữ liệu ban đầu hoặc báo cáo gốc' })
            if (isEditMode) router.replace(`/reports/${id}`)
        }
        setIsDataLoaded(true);
    }

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        } else if (user && router.isReady && !isDataLoaded) {
            setLoading(true);
            fetchInitialData().finally(() => setLoading(false));
        }
    }, [user, isLoading, router.isReady, isDataLoaded])

    useEffect(() => {
        if (formData.programId && formData.organizationId) {
            fetchStandards()
        } else {
            setStandards([]);
            setCriteria([]);
            setFormData(prev => ({ ...prev, standardId: '', criteriaId: '' }));
        }
    }, [formData.programId, formData.organizationId])

    useEffect(() => {
        if (formData.standardId) {
            fetchCriteria()
        } else {
            setCriteria([]);
            setFormData(prev => ({ ...prev, criteriaId: '' }));
        }
    }, [formData.standardId])

    useEffect(() => {
        // Handle evidence link click in editor
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
        const errors = {};

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

        if (formData.contentMethod === 'online_editor') {
            const plainText = editorRef.current?.getContent?.() || '';

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = plainText;
            const textContent = tempDiv.textContent || '';

            if (!textContent.trim()) {
                errors.content = 'Nội dung báo cáo là bắt buộc (tối thiểu một số ký tự)';
            }
        } else if (formData.contentMethod === 'file_upload') {
            if (!isEditMode && !selectedFile) { // File chỉ bắt buộc khi tạo mới
                errors.file = 'Vui lòng chọn file để upload';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e, shouldCreateNew = false) => {
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
                taskId: formData.taskId || null,
                linkedCriteriaReports: linkedCriteriaReports.map(r => r._id) // Gửi ID
            }

            if (formData.type !== 'overall_tdg') {
                submitData.standardId = formData.standardId
                if (formData.type === 'criteria') {
                    submitData.criteriaId = formData.criteriaId
                }
            }

            if (formData.contentMethod === 'online_editor') {
                submitData.content = formData.content
            } else {
                submitData.content = ''
            }

            let response;
            let reportId;
            let successMessage;

            if (isEditMode && !shouldCreateNew) {
                // UPDATE (chế độ Sửa)
                response = await apiMethods.reports.update(id, submitData);
                reportId = id;
                successMessage = 'Cập nhật báo cáo thành công';
            } else {
                // CREATE (chế độ Tạo mới hoặc Sửa & Tạo bản mới)
                response = await reportService.createReport(submitData);
                reportId = response.data._id;
                successMessage = 'Tạo báo cáo mới thành công';
            }

            // File upload logic (Chỉ thực hiện khi có file mới)
            if (formData.contentMethod === 'file_upload' && selectedFile) {
                try {
                    const fileFormData = new FormData();
                    fileFormData.append('file', selectedFile);

                    await apiMethods.reports.uploadFile(reportId, fileFormData);
                    successMessage += ' và upload file thành công';
                } catch (uploadError) {
                    console.error('Upload error:', uploadError)
                    successMessage += '. Tuy nhiên, có lỗi khi upload file';
                }
            }

            toast.success(successMessage);
            router.push(`/reports/${reportId}`); // Chuyển hướng về trang chi tiết

        } catch (error) {
            console.error('Submit error:', error)
            let errorMessage = error.response?.data?.message || error.message || 'Lỗi tạo/cập nhật báo cáo';
            toast.error(errorMessage);
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
        // Tắt lock ở đây vì trang edit cho phép thay đổi mọi thứ nếu người dùng có quyền
        // if (isLocked[field]) {
        //     return
        // }

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

    const handleInsertCriteriaReports = (selectedReports) => {
        if (!editorRef.current || typeof editorRef.current.insertHTML !== 'function') {
            toast.error('Lỗi: Không thể truy cập trình soạn thảo.');
            return;
        }

        let htmlToInsert = '';

        selectedReports.forEach((report, index) => {
            htmlToInsert += `<div style="border-left: 3px solid #3b82f6; padding-left: 1rem; margin: 1rem 0; background-color: #eff6ff;">
                                <h4>Báo cáo chèn vào: ${report.title} (${report.code})</h4>
                                ${report.content}
                             </div>`;

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
                    ).map(sr => ({...sr, name: sr.title, code: sr.code}))
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

    const isEvidencePickerContextReady = formData.criteriaId || (formData.type === 'overall_tdg' && formData.programId && formData.organizationId);

    return (
        <Layout title="" breadcrumbItems={breadcrumbItems}>
            {showCriteriaReportPicker && (
                <CriteriaReportPickerModal
                    isOpen={showCriteriaReportPicker}
                    reportType={formData.type}
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

                    {/* Header - Chuyển sang Blue/Indigo */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-1">
                                        {isEditMode ? `Sửa báo cáo: ${originalReport?.code}` : 'Tạo báo cáo mới'}
                                    </h1>
                                    <p className="text-blue-100">
                                        {isEditMode ? 'Chỉnh sửa nội dung và thông tin báo cáo' : 'Tạo báo cáo phân tích tiêu chuẩn/tiêu chí/tổng hợp'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push(isEditMode ? `/reports/${id}` : '/reports/reports')}
                                className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-xl transition-all font-medium"
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
                                <FileText className="w-6 h-6 text-blue-600" />
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
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
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
                                    {/* Loại báo cáo - Cho phép chọn overall_tdg */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <FileType className="w-4 h-4 inline mr-1" />
                                            Loại báo cáo <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => {
                                                const newType = e.target.value;
                                                handleChange('type', newType);
                                                if (newType === 'overall_tdg') {
                                                    setFormData(prev => ({ ...prev, standardId: '', criteriaId: '' }));
                                                }
                                            }}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        >
                                            <option value="criteria">Báo cáo tiêu chí</option>
                                            <option value="standard">Báo cáo tiêu chuẩn</option>
                                            <option value="overall_tdg">Báo cáo tổng hợp TĐG</option>
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
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                formErrors.programId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
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
                                        </label>
                                        <select
                                            value={formData.organizationId}
                                            onChange={(e) => handleChange('organizationId', e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                formErrors.organizationId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
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

                                    {/* Tiêu chuẩn - Ẩn khi là overall_tdg */}
                                    {formData.type !== 'overall_tdg' && (
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
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                    formErrors.standardId ? 'border-red-300 bg-red-50' : 'border-gray-200'
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
                                            {formErrors.standardId && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors.standardId}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Tiêu chí - Chỉ hiển thị khi là criteria */}
                                    {formData.type === 'criteria' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Hash className="w-4 h-4 inline mr-1" />
                                                Tiêu chí <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.criteriaId}
                                                onChange={(e) => handleChange('criteriaId', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                    formErrors.criteriaId ? 'border-red-300 bg-red-50' : 'border-gray-200'
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
                                <AlignLeft className="w-6 h-6 text-blue-600" />
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
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-400 transition-all">
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Upload className="w-8 h-8 text-blue-600" />
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
                                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg cursor-pointer transition-all font-medium"
                                            >
                                                <File className="w-5 h-5 mr-2" />
                                                Chọn file
                                            </label>
                                        </div>

                                        {selectedFile && (
                                            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center flex-1 min-w-0">
                                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                            <File className="w-6 h-6 text-blue-600" />
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
                                        {isEditMode && originalReport?.attachedFile?.originalName && !selectedFile && (
                                            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-700">
                                                File hiện tại: {originalReport.attachedFile.originalName} - {(originalReport.attachedFile.size / 1024 / 1024).toFixed(2)} MB. Chọn file mới để thay thế.
                                            </div>
                                        )}
                                    </div>
                                    {formErrors.file && (
                                        <p className="text-red-500 text-sm mt-2">{formErrors.file}</p>
                                    )}
                                </div>
                            )}

                            {/* Gắn Báo cáo Cấp Thấp Hơn */}
                            {formData.type !== 'criteria' && (
                                <div className="mt-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
                                    <h4 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                        Chèn Nội Dung Báo Cáo Cấp Thấp Hơn
                                    </h4>

                                    {/* Danh sách các báo cáo đã chọn */}
                                    <div className="space-y-2">
                                        {linkedCriteriaReports.map(report => (
                                            <div key={report._id} className="flex items-center justify-between p-3 border border-blue-200 bg-white rounded-lg shadow-sm">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-blue-800 truncate">
                                                        {report.name} ({report.code})
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
                                            <p className="text-sm text-gray-500 italic py-2">Chưa có báo cáo cấp thấp hơn nào được chèn.</p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
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
                                            }
                                            setShowCriteriaReportPicker(true)
                                        }}
                                        className="flex items-center mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:shadow-lg hover:bg-blue-700 transition-colors"
                                        disabled={
                                            formData.type === 'criteria' ||
                                            (formData.type === 'standard' && !formData.standardId) ||
                                            (formData.type === 'overall_tdg' && (!formData.programId || !formData.organizationId))
                                        }
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
                                <Tag className="w-6 h-6 text-blue-600" />
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
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
                                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Nhập từ khóa và nhấn Enter"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddKeyword}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.keywords.map((keyword, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                                            >
                                                {keyword}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveKeyword(keyword)}
                                                    className="ml-2 text-blue-500 hover:text-blue-700"
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
                                onClick={() => router.push(isEditMode ? `/reports/${id}` : '/reports/reports')}
                                className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                            >
                                Hủy
                            </button>
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, true)}
                                    disabled={submitting}
                                    className="flex items-center space-x-2 px-8 py-3 bg-orange-600 text-white rounded-xl hover:shadow-xl disabled:opacity-50 transition-all font-medium"
                                >
                                    <FilePlus className="w-5 h-5" />
                                    <span>Tạo bản sao mới</span>
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl disabled:opacity-50 transition-all font-medium"
                            >
                                {submitting ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>Đang lưu...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>{isEditMode ? 'Cập nhật báo cáo' : 'Tạo báo cáo'}</span>
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
                                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm gap-2"
                                    // Vô hiệu hóa nếu chưa chọn tiêu chí
                                    disabled={!formData.criteriaId}
                                >
                                    <FilePlus className="h-5 w-5" />
                                    Tạo Minh chứng Mới
                                </button>

                                {isEvidencePickerContextReady ? (
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
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                        Vui lòng chọn Chương trình & Tổ chức (và Tiêu chuẩn/Tiêu chí nếu cần) để tải danh sách minh chứng.
                                    </div>
                                )}
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