import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { FileText, Upload, Save, X, Plus, Trash2 } from 'lucide-react'
import FileUpload from '../file/FileUpLoad'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'

export default function EvidenceForm({ evidenceId = null, onSuccess, onCancel }) {
    const router = useRouter()
    const isEdit = Boolean(evidenceId)

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        status: 'draft',
        notes: '',
        tags: []
    })
    const [files, setFiles] = useState([])
    const [errors, setErrors] = useState({})
    const [newTag, setNewTag] = useState('')


    useEffect(() => {
        if (isEdit) {
            loadEvidence()
        }
    }, [evidenceId])

    useEffect(() => {
        // Generate code when all required fields are selected
        if (formData.programId && formData.standardId && formData.criteriaId && !isEdit) {
            generateEvidenceCode()
        }
    }, [formData.programId, formData.standardId, formData.criteriaId])

    const loadEvidence = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.getEvidence(evidenceId)
            if (response.data.success) {
                const evidence = response.data.data
                setFormData({
                    code: evidence.code || '',
                    name: evidence.name || '',
                    description: evidence.description || '',
                    programId: evidence.programId || '',
                    organizationId: evidence.organizationId || '',
                    standardId: evidence.standardId || '',
                    criteriaId: evidence.criteriaId || '',
                    status: evidence.status || 'draft',
                    notes: evidence.notes || '',
                    tags: evidence.tags || []
                })
                setFiles(evidence.files || [])
            }
        } catch (error) {
            toast.error('Lỗi tải thông tin minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const generateEvidenceCode = async () => {
        try {
            const response = await apiMethods.generateEvidenceCode({
                programId: formData.programId,
                standardId: formData.standardId,
                criteriaId: formData.criteriaId
            })
            if (response.data.success) {
                setFormData(prev => ({
                    ...prev,
                    code: response.data.data.code
                }))
            }
        } catch (error) {
            console.error('Error generating code:', error)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }))
        }

        // Reset criteria when standard changes
        if (name === 'standardId' && value !== formData.standardId) {
            setFormData(prev => ({
                ...prev,
                criteriaId: ''
            }))
        }
    }

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }))
            setNewTag('')
        }
    }

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const handleFileUpload = async (file) => {
        try {
            const formDataFile = new FormData()
            formDataFile.append('file', file)

            const response = await apiMethods.uploadFile(formDataFile)
            if (response.data.success) {
                const uploadedFile = response.data.data
                setFiles(prev => [...prev, uploadedFile])
                return uploadedFile
            }
        } catch (error) {
            throw new Error('Upload failed')
        }
    }

    const handleRemoveFile = (fileId) => {
        setFiles(prev => prev.filter(file => file.id !== fileId))
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập tên minh chứng'
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Vui lòng nhập mã minh chứng'
        }

        if (!formData.programId) {
            newErrors.programId = 'Vui lòng chọn chương trình'
        }

        if (!formData.organizationId) {
            newErrors.organizationId = 'Vui lòng chọn tổ chức'
        }

        if (!formData.standardId) {
            newErrors.standardId = 'Vui lòng chọn tiêu chuẩn'
        }

        if (!formData.criteriaId) {
            newErrors.criteriaId = 'Vui lòng chọn tiêu chí'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setLoading(true)

            const submitData = {
                ...formData,
                fileIds: files.map(file => file.id)
            }

            let response
            if (isEdit) {
                response = await apiMethods.updateEvidence(evidenceId, submitData)
            } else {
                response = await apiMethods.createEvidence(submitData)
            }

            if (response.data.success) {
                toast.success(isEdit ? 'Cập nhật minh chứng thành công' : 'Tạo minh chứng thành công')
                onSuccess?.(response.data.data)
                if (!onSuccess) {
                    router.push('/evidence-management')
                }
            }
        } catch (error) {
            toast.error(isEdit ? 'Lỗi cập nhật minh chứng' : 'Lỗi tạo minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        if (onCancel) {
            onCancel()
        } else {
            router.back()
        }
    }

    const filteredCriteria = criteria.filter(criterion =>
        criterion.standardId === formData.standardId
    )

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        {isEdit ? 'Chỉnh sửa minh chứng' : 'Tạo minh chứng mới'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã minh chứng *
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                placeholder="Sẽ tự động tạo khi chọn tiêu chí"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.code ? 'border-red-500' : 'border-gray-300'
                                } ${!isEdit ? 'bg-gray-50' : ''}`}
                                readOnly={!isEdit}
                            />
                            {errors.code && (
                                <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                            )}
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên minh chứng *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Nhập tên minh chứng"
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                            )}
                        </div>
                    </div>

                    {/* Structure Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Program */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chương trình đánh giá *
                            </label>
                            <select
                                name="programId"
                                value={formData.programId}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.programId ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Chọn chương trình</option>
                                {programs.map(program => (
                                    <option key={program.id} value={program.id}>
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                            {errors.programId && (
                                <p className="text-red-500 text-sm mt-1">{errors.programId}</p>
                            )}
                        </div>

                        {/* Organization */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tổ chức *
                            </label>
                            <select
                                name="organizationId"
                                value={formData.organizationId}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.organizationId ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Chọn tổ chức</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                            {errors.organizationId && (
                                <p className="text-red-500 text-sm mt-1">{errors.organizationId}</p>
                            )}
                        </div>

                        {/* Standard */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu chuẩn *
                            </label>
                            <select
                                name="standardId"
                                value={formData.standardId}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.standardId ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Chọn tiêu chuẩn</option>
                                {standards.map(standard => (
                                    <option key={standard.id} value={standard.id}>
                                        {standard.name}
                                    </option>
                                ))}
                            </select>
                            {errors.standardId && (
                                <p className="text-red-500 text-sm mt-1">{errors.standardId}</p>
                            )}
                        </div>

                        {/* Criteria */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tiêu chí *
                            </label>
                            <select
                                name="criteriaId"
                                value={formData.criteriaId}
                                onChange={handleInputChange}
                                disabled={!formData.standardId}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                                    errors.criteriaId ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">
                                    {formData.standardId ? 'Chọn tiêu chí' : 'Chọn tiêu chuẩn trước'}
                                </option>
                                {filteredCriteria.map(criterion => (
                                    <option key={criterion.id} value={criterion.id}>
                                        {criterion.name}
                                    </option>
                                ))}
                            </select>
                            {errors.criteriaId && (
                                <p className="text-red-500 text-sm mt-1">{errors.criteriaId}</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mô tả
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Nhập mô tả chi tiết về minh chứng"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Từ khóa (Tags)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {formData.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                placeholder="Nhập từ khóa"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="draft">Nháp</option>
                            <option value="pending">Chờ xử lý</option>
                            <option value="approved">Đã phê duyệt</option>
                            <option value="rejected">Từ chối</option>
                        </select>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tài liệu đính kèm
                        </label>
                        <FileUpload
                            multiple={true}
                            onUpload={handleFileUpload}
                            className="mb-4"
                        />

                        {/* Uploaded Files List */}
                        {files.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">
                                    Files đã tải lên ({files.length})
                                </h4>
                                {files.map((file, index) => (
                                    <div key={file.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center">
                                            <FileText className="h-4 w-4 text-gray-500 mr-2" />
                                            <span className="text-sm text-gray-900">{file.name}</span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(file.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ghi chú
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Thêm ghi chú nếu cần"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}