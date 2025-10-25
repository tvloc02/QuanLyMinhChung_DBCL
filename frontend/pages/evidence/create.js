import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import { debounce } from '../../utils/debounce' // Giữ lại debounce nếu cần
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import {
    Plus,
    Upload,
    FileText,
    ArrowLeft,
    Loader2,
    Calendar,
    Save,
    RefreshCw,
    BookOpen,
    Building2,
    Hash,
    X,
    Sparkles,
    Zap,
    AlertCircle
} from 'lucide-react'


export default function AddEvidencePage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    // --- START: LOGIC FORM VÀ STATES (Từ AddEvidenceManual.js) ---

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        code: '',
        documentNumber: '',
        documentType: 'Khác',
        issueDate: '',
        effectiveDate: '',
        issuingAgency: '',
        notes: '',
        tags: []
    })

    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [standards, setStandards] = useState([])
    const [criteria, setCriteria] = useState([])

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [tagInput, setTagInput] = useState('')
    const [autoGenerateCode, setAutoGenerateCode] = useState(true)
    const [prefixLetter, setPrefixLetter] = useState('H')
    const [previewCode, setPreviewCode] = useState('')

    const prefixLetters = Array.from({ length: 25 }, (_, i) => String.fromCharCode(65 + i)) // A đến Y

    const documentTypes = [
        'Quyết định',
        'Thông tư',
        'Nghị định',
        'Luật',
        'Báo cáo',
        'Kế hoạch',
        'Tài liệu',
        'Khác'
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        fetchPrograms()
        fetchOrganizations()
    }, [])

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
        if (autoGenerateCode && formData.standardId && formData.criteriaId && prefixLetter) {
            generatePreviewCode()
        } else {
            setPreviewCode('')
        }
    }, [formData.standardId, formData.criteriaId, autoGenerateCode, prefixLetter])

    const fetchPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll({ status: 'active' })
            setPrograms(response.data.data.programs || [])
        } catch (error) {
            console.error('Fetch programs error:', error)
            toast.error('Lỗi khi tải danh sách chương trình')
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll({ status: 'active' })
            setOrganizations(response.data.data.organizations || [])
        } catch (error) {
            console.error('Fetch organizations error:', error)
            toast.error('Lỗi khi tải danh sách tổ chức')
        }
    }

    const fetchStandards = async () => {
        try {
            const response = await apiMethods.standards.getAll({
                programId: formData.programId,
                organizationId: formData.organizationId,
                status: 'active'
            })
            const standards = response.data.data.standards || response.data.data || []
            setStandards(standards)
            setFormData(prev => ({ ...prev, standardId: '', criteriaId: '' }))
        } catch (error) {
            console.error('Fetch standards error:', error)
            toast.error('Lỗi khi tải danh sách tiêu chuẩn')
        }
    }

    const fetchCriteria = async () => {
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
            setFormData(prev => ({ ...prev, criteriaId: '' }))
        } catch (error) {
            console.error('Fetch criteria error:', error)
            toast.error('Lỗi khi tải danh sách tiêu chí')
            setCriteria([])
        }
    }

    const generatePreviewCode = () => {
        const standard = standards.find(s => s._id === formData.standardId)
        const criterion = criteria.find(c => c._id === formData.criteriaId)

        if (!standard || !criterion || !prefixLetter) {
            setPreviewCode('')
            return
        }

        const standardCode = String(standard.code).padStart(2, '0')
        const criteriaCode = String(criterion.code).padStart(2, '0')
        const preview = `${prefixLetter}1.${standardCode}.${criteriaCode}.XX`

        setPreviewCode(preview)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files)
        const maxFiles = 10
        const maxSize = 50 * 1024 * 1024

        if (selectedFiles.length + files.length > maxFiles) {
            toast.error(`Chỉ được upload tối đa ${maxFiles} files`)
            return
        }

        const oversizedFiles = files.filter(f => f.size > maxSize)
        if (oversizedFiles.length > 0) {
            toast.error(`Một số files vượt quá 50MB`)
            return
        }

        setSelectedFiles(prev => [...prev, ...files])
    }

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, tagInput.trim()]
                }))
            }
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.name || !formData.programId || !formData.organizationId ||
            !formData.standardId || !formData.criteriaId) {
            toast.error('Vui lòng điền đầy đủ các trường bắt buộc')
            return
        }

        const codePattern = /^[A-Y]\d+\.\d{2}\.\d{2}\.\d{2}$/
        if (!autoGenerateCode && formData.code) {
            if (!codePattern.test(formData.code)) {
                toast.error('Mã minh chứng không đúng định dạng (ký tự đầu phải là A-Y, VD: A1.01.01.04)')
                return
            }
        }

        try {
            setLoading(true)

            const evidenceData = {
                name: formData.name.trim(),
                programId: formData.programId,
                organizationId: formData.organizationId,
                standardId: formData.standardId,
                criteriaId: formData.criteriaId
            }

            if (formData.description?.trim()) {
                evidenceData.description = formData.description.trim()
            }

            if (!autoGenerateCode && formData.code?.trim()) {
                evidenceData.code = formData.code.trim()
            }

            if (autoGenerateCode && prefixLetter) {
                evidenceData.prefixLetter = prefixLetter
            }


            if (formData.documentNumber?.trim()) {
                evidenceData.documentNumber = formData.documentNumber.trim()
            }

            if (formData.documentType) {
                evidenceData.documentType = formData.documentType
            }

            if (formData.issueDate) {
                evidenceData.issueDate = formData.issueDate
            }

            if (formData.effectiveDate) {
                evidenceData.effectiveDate = formData.effectiveDate
            }

            if (formData.issuingAgency?.trim()) {
                evidenceData.issuingAgency = formData.issuingAgency.trim()
            }

            if (formData.notes?.trim()) {
                evidenceData.notes = formData.notes.trim()
            }

            if (formData.tags && formData.tags.length > 0) {
                evidenceData.tags = formData.tags
            }

            const response = await apiMethods.evidences.create(evidenceData)

            if (response.data.success) {
                const evidenceId = response.data.data._id

                if (selectedFiles.length > 0) {
                    setUploading(true)
                    try {
                        await apiMethods.files.upload(evidenceId, selectedFiles)
                        toast.success('Thêm minh chứng và upload files thành công')
                    } catch (uploadError) {
                        console.error('Upload error:', uploadError)
                        toast.warning('Minh chứng đã được tạo nhưng có lỗi khi upload files')
                    }
                    setUploading(false)
                } else {
                    toast.success(response.data.message || 'Tạo minh chứng thành công')
                }

                setTimeout(() => {
                    router.push('/evidence-management')
                }, 1500)
            }
        } catch (error) {
            console.error('Create evidence error:', error)

            let errorMessage = 'Lỗi khi tạo minh chứng'

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error
            }

            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setFormData({
            name: '',
            description: '',
            programId: '',
            organizationId: '',
            standardId: '',
            criteriaId: '',
            code: '',
            documentNumber: '',
            documentType: 'Khác',
            issueDate: '',
            effectiveDate: '',
            issuingAgency: '',
            notes: '',
            tags: []
        })
        setSelectedFiles([])
        setStandards([])
        setCriteria([])
        setPrefixLetter('H')
        setPreviewCode('')
        toast.success('Đã đặt lại form')
    }

    // --- END: LOGIC FORM VÀ STATES ---

    const breadcrumbItems = [
        { name: 'Quản lý minh chứng', href: '/evidence/evidence-management', icon: FileText },
        { name: 'Thêm minh chứng', icon: Plus }
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">

                {/* Header - Màu xanh lam đồng bộ */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Plus className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Thêm Minh Chứng Mới</h1>
                                <p className="text-blue-100">Tạo, mô tả và đính kèm files cho minh chứng</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.back()} // Quay lại trang trước
                            className="flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-lg transition-all font-semibold"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Quay lại</span>
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200">
                    <div className="p-6">
                        <div className="space-y-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Thông tin cơ bản */}
                                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            <BookOpen className="h-5 w-5 text-blue-600" />
                                        </div>
                                        Thông tin cơ bản
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <BookOpen className="h-4 w-4 inline mr-1 text-blue-600" />
                                                Chương trình <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="programId"
                                                value={formData.programId}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Building2 className="h-4 w-4 inline mr-1 text-blue-600" />
                                                Tổ chức <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="organizationId"
                                                value={formData.organizationId}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            >
                                                <option value="">Chọn tổ chức</option>
                                                {organizations.map(org => (
                                                    <option key={org._id} value={org._id}>
                                                        {org.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <FileText className="h-4 w-4 inline mr-1 text-blue-600" />
                                                Tiêu chuẩn <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="standardId"
                                                value={formData.standardId}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!formData.programId || !formData.organizationId}
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                                            >
                                                <option value="">Chọn tiêu chuẩn</option>
                                                {standards.map(standard => (
                                                    <option key={standard._id} value={standard._id}>
                                                        {standard.code} - {standard.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <FileText className="h-4 w-4 inline mr-1 text-blue-600" />
                                                Tiêu chí <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                name="criteriaId"
                                                value={formData.criteriaId}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!formData.standardId}
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                                            >
                                                <option value="">Chọn tiêu chí</option>
                                                {criteria.map(criterion => (
                                                    <option key={criterion._id} value={criterion._id}>
                                                        {criterion.code} - {criterion.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Chi tiết minh chứng */}
                                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                            <Hash className="h-5 w-5 text-purple-600" />
                                        </div>
                                        Chi tiết minh chứng
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    <Hash className="h-4 w-4 inline mr-1 text-purple-600" />
                                                    Mã minh chứng
                                                </label>
                                                <label className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <input
                                                        type="checkbox"
                                                        checked={autoGenerateCode}
                                                        onChange={(e) => setAutoGenerateCode(e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span>Tự động tạo mã</span>
                                                </label>
                                            </div>

                                            {/* Logic cho tự động tạo mã */}
                                            {autoGenerateCode ? (
                                                <div className='space-y-3'>
                                                    {/* Chọn tiền tố */}
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div className='md:col-span-1'>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Chọn Ký tự đầu
                                                            </label>
                                                            <select
                                                                name="prefixLetter"
                                                                value={prefixLetter}
                                                                onChange={(e) => setPrefixLetter(e.target.value)}
                                                                required
                                                                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                                            >
                                                                {prefixLetters.map(letter => (
                                                                    <option key={letter} value={letter}>
                                                                        {letter}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className='md:col-span-3'>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Mã sẽ được tạo
                                                            </label>
                                                            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-sm text-indigo-700">
                                                                <Sparkles className="h-4 w-4 inline mr-1" />
                                                                {previewCode ? (
                                                                    <span>Mã sẽ được tạo tự động: <strong>{previewCode}</strong> (XX = số thứ tự tiếp theo)</span>
                                                                ) : (
                                                                    <span>Chọn Tiêu chuẩn, Tiêu chí và Ký tự đầu để xem preview mã</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="code"
                                                    value={formData.code}
                                                    onChange={handleInputChange}
                                                    placeholder="VD: A1.01.01.04"
                                                    pattern="^[A-Y]\d+\.\d{2}\.\d{2}\.\d{2}$"
                                                    title="Format: [A-Y][số hộp].[mã tiêu chuẩn].[mã tiêu chí].[số thứ tự]"
                                                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                                />
                                            )}
                                            <p className="text-xs text-gray-500 mt-2">
                                                Format: [A-Y][số hộp].[mã TC].[mã TC].[STT] - VD: A1.01.01.04
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tên minh chứng <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                maxLength={500}
                                                placeholder="Nhập tên minh chứng..."
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mô tả
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows={3}
                                                maxLength={2000}
                                                placeholder="Nhập mô tả minh chứng..."
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin văn bản */}
                                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                            <FileText className="h-5 w-5 text-green-600" />
                                        </div>
                                        Thông tin văn bản
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Số hiệu văn bản
                                            </label>
                                            <input
                                                type="text"
                                                name="documentNumber"
                                                value={formData.documentNumber}
                                                onChange={handleInputChange}
                                                maxLength={100}
                                                placeholder="VD: 123/QĐ-BGDĐT"
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Loại văn bản
                                            </label>
                                            <select
                                                name="documentType"
                                                value={formData.documentType}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            >
                                                {documentTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Calendar className="h-4 w-4 inline mr-1 text-blue-600" />
                                                Ngày ban hành
                                            </label>
                                            <input
                                                type="date"
                                                name="issueDate"
                                                value={formData.issueDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Calendar className="h-4 w-4 inline mr-1 text-blue-600" />
                                                Ngày hiệu lực
                                            </label>
                                            <input
                                                type="date"
                                                name="effectiveDate"
                                                value={formData.effectiveDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Cơ quan ban hành
                                            </label>
                                            <input
                                                type="text"
                                                name="issuingAgency"
                                                value={formData.issuingAgency}
                                                onChange={handleInputChange}
                                                maxLength={200}
                                                placeholder="VD: Bộ Giáo dục và Đào tạo"
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin bổ sung */}
                                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                            <Upload className="h-5 w-5 text-orange-600" />
                                        </div>
                                        Thông tin bổ sung
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ghi chú
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                rows={3}
                                                maxLength={1000}
                                                placeholder="Nhập ghi chú nếu có..."
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tags (nhấn Enter để thêm)
                                            </label>
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleAddTag}
                                                placeholder="Nhập tag và nhấn Enter..."
                                                className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                            {formData.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {formData.tags.map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800 font-medium border border-blue-200"
                                                        >
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTag(tag)}
                                                                className="ml-2 text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Upload className="h-4 w-4 inline mr-1 text-blue-600" />
                                                Files đính kèm
                                            </label>
                                            <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 hover:border-blue-500 transition-colors">
                                                <label className="cursor-pointer">
                                                    <div className="text-center">
                                                        <Upload className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                                                        <p className="text-sm text-gray-600 mb-1">
                                                            <span className="text-blue-600 font-medium">Chọn files</span> hoặc kéo thả vào đây
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Tối đa 10 files, mỗi file 50MB
                                                        </p>
                                                        <input
                                                            type="file"
                                                            multiple
                                                            onChange={handleFileSelect}
                                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                                                            className="hidden"
                                                        />
                                                    </div>
                                                </label>
                                                {selectedFiles.length > 0 && (
                                                    <div className="mt-4 space-y-2">
                                                        {selectedFiles.map((file, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                                                            >
                                                                <span className="text-sm text-gray-700 truncate flex-1">
                                                                    {file.name}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeFile(index)}
                                                                    className="ml-2 text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-4 p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={loading || uploading}
                                        className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-all font-medium inline-flex items-center"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Đặt lại
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || uploading}
                                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                                    >
                                        {loading || uploading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>{uploading ? 'Đang upload files...' : 'Đang lưu...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="h-5 w-5" />
                                                <span>Lưu minh chứng</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Note */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mt-6">
                                    <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                                        <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                                        Lưu ý quan trọng
                                    </h4>
                                    <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                                        <li>Các trường có dấu (*) là bắt buộc</li>
                                        <li>Mã minh chứng sẽ được tự động tạo theo format: [A-Y][số hộp].[mã TC].[mã TC].[STT]</li>
                                        <li>Ký tự đầu tiên sẽ được chọn bởi người dùng (A-Y)</li>
                                        <li>Số thứ tự sẽ tự động tăng dựa trên minh chứng đã có trong hệ thống</li>
                                        <li>Chọn đúng Chương trình và Tổ chức trước khi chọn Tiêu chuẩn và Tiêu chí</li>
                                    </ul>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}