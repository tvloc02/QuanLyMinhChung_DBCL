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
    X,
    ArrowLeft,
    ArrowRight,
    Zap,
    Loader2
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export default function EvidenceImport() {
    const router = useRouter()
    const [step, setStep] = useState(1)
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
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ]

        if (!validTypes.includes(file.type)) {
            toast.error('Vui lòng chọn file Excel (.xlsx) hoặc CSV')
            return
        }

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
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <Upload className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Import minh chứng</h1>
                            <p className="text-indigo-100">Nhập dữ liệu minh chứng từ file Excel</p>
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

            {/* Progress Steps */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                        {[
                            { num: 1, label: 'Chọn file' },
                            { num: 2, label: 'Import' },
                            { num: 3, label: 'Kết quả' }
                        ].map((item, idx) => (
                            <div key={item.num} className="flex items-center flex-1">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all ${
                                        step >= item.num
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}>
                                        {item.num}
                                    </div>
                                    <span className={`font-medium ${
                                        step >= item.num ? 'text-indigo-600' : 'text-gray-400'
                                    }`}>
                                        {item.label}
                                    </span>
                                </div>
                                {idx < 2 && (
                                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                                        step > item.num ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Step 1: Select File */}
            {step === 1 && (
                <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                <BookOpen className="h-5 w-5 text-indigo-600" />
                            </div>
                            Thông tin import
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <BookOpen className="h-4 w-4 inline mr-1" />
                                    Chương trình <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedProgram}
                                    onChange={(e) => setSelectedProgram(e.target.value)}
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
                                    value={selectedOrganization}
                                    onChange={(e) => setSelectedOrganization(e.target.value)}
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
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleDownloadTemplate}
                                disabled={!selectedProgram || !selectedOrganization}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                            >
                                <Download className="h-5 w-5 mr-2" />
                                Tải template Excel
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                            </div>
                            Chọn file import
                        </h3>

                        <div
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                                dragActive
                                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50'
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <FileSpreadsheet className="h-20 w-20 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">
                                Kéo thả file vào đây
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                hoặc
                            </p>
                            <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg cursor-pointer transition-all font-medium">
                                <Upload className="h-5 w-5 mr-2" />
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

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                        <h4 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            Hướng dẫn import
                        </h4>
                        <ul className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                            <CheckCircle className="h-5 w-5 text-indigo-600" />
                        </div>
                        Xác nhận import
                    </h3>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <FileSpreadsheet className="h-7 w-7 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{selectedFile?.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(selectedFile?.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setStep(1)}
                                className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="Xóa file"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                                <p className="text-sm text-gray-600 mb-1">Chương trình</p>
                                <p className="font-medium text-gray-900">
                                    {programs.find(p => p._id === selectedProgram)?.name}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                                <p className="text-sm text-gray-600 mb-1">Tổ chức</p>
                                <p className="font-medium text-gray-900">
                                    {organizations.find(o => o._id === selectedOrganization)?.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={() => setStep(1)}
                            disabled={importing}
                            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all font-medium"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                        >
                            {importing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    <span>Đang import...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="h-5 w-5 mr-2" />
                                    <span>Bắt đầu import</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Results */}
            {step === 3 && importResults && (
                <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            Kết quả import
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-indigo-600 mb-1 font-medium">Tổng số</p>
                                        <p className="text-3xl font-bold text-indigo-900">
                                            {importResults.total}
                                        </p>
                                    </div>
                                    <FileText className="h-10 w-10 text-indigo-600 opacity-50" />
                                </div>
                            </div>

                            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-600 mb-1 font-medium">Thành công</p>
                                        <p className="text-3xl font-bold text-green-900">
                                            {importResults.success}
                                        </p>
                                    </div>
                                    <CheckCircle className="h-10 w-10 text-green-600 opacity-50" />
                                </div>
                            </div>

                            <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-red-600 mb-1 font-medium">Thất bại</p>
                                        <p className="text-3xl font-bold text-red-900">
                                            {importResults.failed}
                                        </p>
                                    </div>
                                    <XCircle className="h-10 w-10 text-red-600 opacity-50" />
                                </div>
                            </div>

                            <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-yellow-600 mb-1 font-medium">Bỏ qua</p>
                                        <p className="text-3xl font-bold text-yellow-900">
                                            {importResults.skipped}
                                        </p>
                                    </div>
                                    <AlertCircle className="h-10 w-10 text-yellow-600 opacity-50" />
                                </div>
                            </div>
                        </div>

                        {importResults.errors && importResults.errors.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    Lỗi chi tiết ({importResults.errors.length})
                                </h4>
                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
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

                        {importResults.successItems && importResults.successItems.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    Đã import thành công ({importResults.successItems.length})
                                </h4>
                                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                                    {importResults.successItems.slice(0, 10).map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-3 border-b border-gray-200 last:border-b-0 text-sm hover:bg-gray-50"
                                        >
                                            <span className="font-mono text-indigo-600 font-medium">{item.code}</span>
                                            {' - '}
                                            <span className="text-gray-900">{item.name}</span>
                                        </div>
                                    ))}
                                    {importResults.successItems.length > 10 && (
                                        <div className="p-3 text-sm text-gray-500 text-center bg-gray-50">
                                            ... và {importResults.successItems.length - 10} minh chứng khác
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                            >
                                Import file khác
                            </button>
                            <button
                                onClick={handleViewEvidences}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                            >
                                <span>Xem danh sách minh chứng</span>
                                <ArrowRight className="h-5 w-5 ml-2" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}