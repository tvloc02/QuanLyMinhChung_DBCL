import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
    Upload,
    Download,
    FileSpreadsheet,
    CheckCircle,
    XCircle,
    AlertCircle,
    BookOpen,
    Building2,
    FileText,
    X
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function EvidenceImport() {
    const router = useRouter()
    const [step, setStep] = useState(1) // 1: Select file, 2: Import, 3: Results
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedOrganization, setSelectedOrganization] = useState('')
    const [selectedFile, setSelectedFile] = useState(null)
    const [importing, setImporting] = useState(false)
    const [importResults, setImportResults] = useState(null)
    const [dragActive, setDragActive] = useState(false)

    useEffect(() => {
        fetchPrograms()
        fetchOrganizations()
    }, [])

    const fetchPrograms = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`${API_URL}/programs`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setPrograms(response.data.data.programs || [])
            if (response.data.data.programs?.length > 0) {
                setSelectedProgram(response.data.data.programs[0]._id)
            }
        } catch (error) {
            console.error('Fetch programs error:', error)
            toast.error('Lỗi khi tải danh sách chương trình')
        }
    }

    const fetchOrganizations = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`${API_URL}/organizations`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setOrganizations(response.data.data.organizations || [])
            if (response.data.data.organizations?.length > 0) {
                setSelectedOrganization(response.data.data.organizations[0]._id)
            }
        } catch (error) {
            console.error('Fetch organizations error:', error)
            toast.error('Lỗi khi tải danh sách tổ chức')
        }
    }

    const handleDownloadTemplate = async () => {
        if (!selectedProgram || !selectedOrganization) {
            toast.error('Vui lòng chọn chương trình và tổ chức')
            return
        }

        try {
            const token = localStorage.getItem('token')
            const response = await axios.post(
                `${API_URL}/evidences/generate-template`,
                {
                    programId: selectedProgram,
                    organizationId: selectedOrganization
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            )

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `evidence-import-template-${Date.now()}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('Tải template thành công')
        } catch (error) {
            console.error('Download template error:', error)
            toast.error('Lỗi khi tải template')
        }
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }

    const handleFileSelect = (file) => {
        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ]

        if (!validTypes.includes(file.type)) {
            toast.error('Vui lòng chọn file Excel (.xlsx) hoặc CSV')
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File quá lớn. Kích thước tối đa là 10MB')
            return
        }

        setSelectedFile(file)
        setStep(2)
    }

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0])
        }
    }

    const handleImport = async () => {
        if (!selectedFile || !selectedProgram || !selectedOrganization) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        try {
            setImporting(true)

            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('programId', selectedProgram)
            formData.append('organizationId', selectedOrganization)

            const token = localStorage.getItem('token')
            const response = await axios.post(
                `${API_URL}/evidences/import`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            if (response.data.success) {
                setImportResults(response.data.data)
                setStep(3)
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            console.error('Import error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi import dữ liệu')
        } finally {
            setImporting(false)
        }
    }

    const handleReset = () => {
        setStep(1)
        setSelectedFile(null)
        setImportResults(null)
    }

    const handleViewEvidences = () => {
        router.push('/evidence-management')
    }

    return (
        <div className="space-y-6">
            {/* Progress Steps */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 ${
                            step >= 1 ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                            }`}>
                                1
                            </div>
                            <span className="font-medium">Chọn file</span>
                        </div>
                        <div className="w-12 h-0.5 bg-gray-300"></div>
                        <div className={`flex items-center space-x-2 ${
                            step >= 2 ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                            }`}>
                                2
                            </div>
                            <span className="font-medium">Import</span>
                        </div>
                        <div className="w-12 h-0.5 bg-gray-300"></div>
                        <div className={`flex items-center space-x-2 ${
                            step >= 3 ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                            }`}>
                                3
                            </div>
                            <span className="font-medium">Kết quả</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 1: Select File */}
            {step === 1 && (
                <>
                    {/* Selection Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin import</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <BookOpen className="h-4 w-4 inline mr-1" />
                                    Chương trình <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
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
                                    value={selectedOrganization}
                                    onChange={(e) => setSelectedOrganization(e.target.value)}
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
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleDownloadTemplate}
                                disabled={!selectedProgram || !selectedOrganization}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Tải template Excel
                            </button>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn file import</h3>

                        <div
                            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                                dragActive
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                Kéo thả file vào đây
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                hoặc
                            </p>
                            <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                Chọn file
                                <input
                                    type="file"
                                    onChange={handleFileInputChange}
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-4">
                                Hỗ trợ: Excel (.xlsx), CSV - Tối đa 10MB
                            </p>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            Hướng dẫn import
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                            <li>Tải template Excel về máy bằng nút "Tải template Excel"</li>
                            <li>Điền thông tin minh chứng vào file template theo đúng format</li>
                            <li>Các trường có dấu (*) là bắt buộc phải điền</li>
                            <li>Mã tiêu chuẩn và mã tiêu chí phải tồn tại trong hệ thống</li>
                            <li>Upload file đã điền để bắt đầu import</li>
                            <li>Tối đa 1000 bản ghi trong mỗi lần import</li>
                        </ul>
                    </div>
                </>
            )}

            {/* Step 2: Import */}
            {step === 2 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Xác nhận import</h3>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="font-medium text-gray-900">{selectedFile?.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(selectedFile?.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setStep(1)}
                                className="text-red-600 hover:bg-red-50 p-2 rounded"
                                title="Xóa file"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Chương trình</p>
                                <p className="font-medium text-gray-900">
                                    {programs.find(p => p._id === selectedProgram)?.name}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Tổ chức</p>
                                <p className="font-medium text-gray-900">
                                    {organizations.find(o => o._id === selectedOrganization)?.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setStep(1)}
                            disabled={importing}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {importing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Đang import...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Bắt đầu import
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Results */}
            {step === 3 && importResults && (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Kết quả import</h3>

                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-blue-600 mb-1">Tổng số</p>
                                        <p className="text-2xl font-bold text-blue-900">
                                            {importResults.total}
                                        </p>
                                    </div>
                                    <FileText className="h-8 w-8 text-blue-600" />
                                </div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-600 mb-1">Thành công</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {importResults.success}
                                        </p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                            </div>

                            <div className="p-4 bg-red-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-red-600 mb-1">Thất bại</p>
                                        <p className="text-2xl font-bold text-red-900">
                                            {importResults.failed}
                                        </p>
                                    </div>
                                    <XCircle className="h-8 w-8 text-red-600" />
                                </div>
                            </div>

                            <div className="p-4 bg-yellow-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-yellow-600 mb-1">Bỏ qua</p>
                                        <p className="text-2xl font-bold text-yellow-900">
                                            {importResults.skipped}
                                        </p>
                                    </div>
                                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        {/* Errors */}
                        {importResults.errors && importResults.errors.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    Lỗi chi tiết ({importResults.errors.length})
                                </h4>
                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                                    {importResults.errors.map((error, index) => (
                                        <div
                                            key={index}
                                            className="p-3 border-b border-gray-200 last:border-b-0 text-sm text-red-600"
                                        >
                                            {error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Success Items */}
                        {importResults.successItems && importResults.successItems.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    Đã import thành công ({importResults.successItems.length})
                                </h4>
                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                                    {importResults.successItems.slice(0, 10).map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-3 border-b border-gray-200 last:border-b-0 text-sm"
                                        >
                                            <span className="font-mono text-blue-600">{item.code}</span>
                                            {' - '}
                                            <span className="text-gray-900">{item.name}</span>
                                        </div>
                                    ))}
                                    {importResults.successItems.length > 10 && (
                                        <div className="p-3 text-sm text-gray-500 text-center">
                                            ... và {importResults.successItems.length - 10} minh chứng khác
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Import file khác
                            </button>
                            <button
                                onClick={handleViewEvidences}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Xem danh sách minh chứng
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}