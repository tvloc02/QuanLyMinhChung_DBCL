import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    Save,
    RefreshCw,
    BookOpen,
    Building2,
    FileText,
    Upload,
    Calendar,
    Hash,
    X,
    Sparkles,
    ArrowLeft,
    Zap
} from 'lucide-react'

export default function AddEvidenceManual() {
    const router = useRouter()

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
    const [previewCode, setPreviewCode] = useState('')

    const documentTypes = [
        'Quyết định',
        'Thông tư',
        'Nghị định',
        'Luật',
        'Báo cáo',
        'Kế hoạch',
        'Khác'
    ]

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
        if (autoGenerateCode && formData.standardId && formData.criteriaId) {
            generatePreviewCode()
        } else {
            setPreviewCode('')
        }
    }, [formData.standardId, formData.criteriaId, autoGenerateCode])

    const fetchPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll()
            setPrograms(response.data.data.programs || [])
        } catch (error) {
            console.error('Fetch programs error:', error)
            toast.error('Lỗi khi tải danh sách chương trình')
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll()
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

        if (!standard || !criterion) {
            setPreviewCode('')
            return
        }

        const standardCode = String(standard.code).padStart(2, '0')
        const criteriaCode = String(criterion.code).padStart(2, '0')
        const preview = `H1.${standardCode}.${criteriaCode}.XX`

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

        if (!autoGenerateCode && formData.code) {
            const codePattern = /^H\d+\.\d{2}\.\d{2}\.\d{2}$/
            if (!codePattern.test(formData.code)) {
                toast.error('Mã minh chứng không đúng định dạng (VD: H1.01.01.04)')
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
        setPreviewCode('')
    }

    return (
        <div className="space-y-6">
            {/* Header với gradient */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Thêm minh chứng mới</h1>
                            <p className="text-indigo-100">Tạo minh chứng thủ công với đầy đủ thông tin</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/evidence-management')}
                        className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl hover:bg-opacity-30 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Quay lại</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Thông tin cơ bản */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                        </div>
                        Thông tin cơ bản
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <BookOpen className="h-4 w-4 inline mr-1" />
                                Chương trình <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="programId"
                                value={formData.programId}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                                <Building2 className="h-4 w-4 inline mr-1" />
                                Tổ chức <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="organizationId"
                                value={formData.organizationId}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                                <FileText className="h-4 w-4 inline mr-1" />
                                Tiêu chuẩn <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="standardId"
                                value={formData.standardId}
                                onChange={handleInputChange}
                                required
                                disabled={!formData.programId || !formData.organizationId}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
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
                                <FileText className="h-4 w-4 inline mr-1" />
                                Tiêu chí <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="criteriaId"
                                value={formData.criteriaId}
                                onChange={handleInputChange}
                                required
                                disabled={!formData.standardId}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <Hash className="h-5 w-5 text-purple-600" />
                        </div>
                        Chi tiết minh chứng
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    <Hash className="h-4 w-4 inline mr-1" />
                                    Mã minh chứng
                                </label>
                                <label className="flex items-center space-x-2 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={autoGenerateCode}
                                        onChange={(e) => setAutoGenerateCode(e.target.checked)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Tự động tạo mã</span>
                                </label>
                            </div>

                            {autoGenerateCode ? (
                                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl text-sm text-indigo-700">
                                    <Sparkles className="h-4 w-4 inline mr-1" />
                                    {previewCode ? (
                                        <span>Mã sẽ được tạo tự động: <strong>{previewCode}</strong> (XX = số thứ tự tiếp theo)</span>
                                    ) : (
                                        <span>Chọn Tiêu chuẩn và Tiêu chí để xem preview mã</span>
                                    )}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="VD: H1.01.01.04"
                                    pattern="^H\d+\.\d{2}\.\d{2}\.\d{2}$"
                                    title="Format: H[số hộp].[mã tiêu chuẩn].[mã tiêu chí].[số thứ tự]"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                Format: H[số hộp].[mã TC].[mã TC].[STT] - VD: H1.01.01.04
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
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Thông tin văn bản */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
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
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            >
                                {documentTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                Ngày ban hành
                            </label>
                            <input
                                type="date"
                                name="issueDate"
                                value={formData.issueDate}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                Ngày hiệu lực
                            </label>
                            <input
                                type="date"
                                name="effectiveDate"
                                value={formData.effectiveDate}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Thông tin bổ sung */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
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
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {formData.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-indigo-100 text-indigo-800 font-medium"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-2 hover:text-indigo-600 transition-colors"
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
                                <Upload className="h-4 w-4 inline mr-1" />
                                Files đính kèm
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-400 transition-colors">
                                <label className="cursor-pointer">
                                    <div className="text-center">
                                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                        <p className="text-sm text-gray-600 mb-1">
                                            <span className="text-indigo-600 font-medium">Chọn files</span> hoặc kéo thả vào đây
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
                                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
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
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={loading || uploading}
                        className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all font-medium inline-flex items-center"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Đặt lại
                    </button>
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                        {loading || uploading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Lưu ý quan trọng
                    </h4>
                    <ul className="text-sm text-indigo-800 space-y-2 list-disc list-inside">
                        <li>Các trường có dấu (*) là bắt buộc</li>
                        <li>Mã minh chứng sẽ được tự động tạo theo format: H[số hộp].[mã TC].[mã TC].[STT]</li>
                        <li>Số thứ tự sẽ tự động tăng dựa trên minh chứng đã có trong hệ thống</li>
                        <li>Chọn đúng Chương trình và Tổ chức trước khi chọn Tiêu chuẩn và Tiêu chí</li>
                    </ul>
                </div>
            </form>
        </div>
    )
}