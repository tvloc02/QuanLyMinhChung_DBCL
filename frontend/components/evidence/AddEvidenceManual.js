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
    Sparkles
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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

            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết minh chứng</h3>

                <div className="space-y-4">
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
                                    className="rounded border-gray-300"
                                />
                                <span>Tự động tạo mã</span>
                            </label>
                        </div>

                        {autoGenerateCode ? (
                            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        )}
                        <p className="text-xs text-gray-500 mt-1">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin văn bản</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin bổ sung</h3>

                <div className="space-y-4">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-2 hover:text-blue-600"
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
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <label className="cursor-pointer">
                                <div className="text-center">
                                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">
                                        Chọn files để upload (tối đa 10 files, mỗi file 50MB)
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
                                            className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                                        >
                                            <span className="text-sm text-gray-700 truncate flex-1">
                                                {file.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="ml-2 text-red-600 hover:text-red-800"
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

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading || uploading}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 inline-flex items-center"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Đặt lại
                </button>
                <button
                    type="submit"
                    disabled={loading || uploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
                >
                    {loading || uploading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {uploading ? 'Đang upload files...' : 'Đang lưu...'}
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Lưu minh chứng
                        </>
                    )}
                </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Lưu ý:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Các trường có dấu (*) là bắt buộc</li>
                    <li>Mã minh chứng sẽ được tự động tạo theo format: H[số hộp].[mã TC].[mã TC].[STT]</li>
                    <li>Số thứ tự sẽ tự động tăng dựa trên minh chứng đã có trong hệ thống</li>
                    <li>Chọn đúng Chương trình và Tổ chức trước khi chọn Tiêu chuẩn và Tiêu chí</li>
                </ul>
            </div>
        </form>
    )
}