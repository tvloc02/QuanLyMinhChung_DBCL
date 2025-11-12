// frontend/pages/public/browser.js - FULL CODE

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
    ChevronRight,
    FileText,
    Download,
    Eye,
    X,
    Loader2,
    AlertCircle,
    Home,
    FolderOpen,
    BookOpen,
    ArrowLeft
} from 'lucide-react'
import publicEvidenceAPI from '../../../services/publicEvidenceService'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export default function PublicEvidenceBrowser() {
    const router = useRouter()
    const { code } = router.query
    
    const [data, setData] = useState(null)
    const [evidence, setEvidence] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Trạng thái lựa chọn
    const [selectedAcademicYear, setSelectedAcademicYear] = useState(null)
    const [selectedProgram, setSelectedProgram] = useState(null)
    const [selectedOrganization, setSelectedOrganization] = useState(null)
    const [selectedStandard, setSelectedStandard] = useState(null)
    const [selectedCriteria, setSelectedCriteria] = useState(null)
    const [selectedEvidence, setSelectedEvidence] = useState(null)

    // Modal xem file
    const [viewingFile, setViewingFile] = useState(null)
    const [fileContent, setFileContent] = useState(null)
    const [fileLoading, setFileLoading] = useState(false)

    useEffect(() => {
        if (code) {
            // Nếu có code trong URL, chỉ load minh chứng đó
            fetchEvidenceByCode(code)
        } else {
            // Nếu không có code, hiển thị browser
            fetchHierarchyData()
        }
    }, [code])

    const fetchEvidenceByCode = async (evidenceCode) => {
        try {
            setLoading(true)
            setError(null)
            
            const result = await publicEvidenceAPI.getByCode(evidenceCode)
            
            console.log('Evidence data:', result.data)
            console.log('AcademicYear:', result.data?.academicYearId)
            console.log('Program:', result.data?.programId)
            console.log('Organization:', result.data?.organizationId)
            
            if (result.success) {
                setEvidence(result.data)
            } else {
                setError(result.message || 'Không tìm thấy minh chứng')
            }
        } catch (err) {
            console.error('Fetch evidence error:', err)
            setError('Không thể tải minh chứng: ' + (err.response?.data?.message || err.message || 'Lỗi hệ thống'))
        } finally {
            setLoading(false)
        }
    }

    const fetchHierarchyData = async () => {
        try {
            setLoading(true)
            setError(null)
            
            console.log('API_BASE_URL:', API_BASE_URL)
            console.log('Calling getHierarchy...')
            
            const result = await publicEvidenceAPI.getHierarchy()
            
            console.log('Result:', result)

            if (result.success) {
                setData(result.data)
            } else {
                setError(result.message || 'Lỗi khi tải dữ liệu')
            }
        } catch (err) {
            console.error('Fetch error:', err)
            console.error('Error details:', err.response?.data || err.message)
            setError('Không thể tải dữ liệu: ' + (err.response?.data?.message || err.message || 'Lỗi hệ thống'))
        } finally {
            setLoading(false)
        }
    }

    const getFilteredPrograms = () => data?.programs || []
    const getFilteredOrganizations = () => data?.organizations || []
    const getFilteredStandards = () => selectedAcademicYear && selectedProgram
        ? (data?.standards || []).filter(s =>
            s.academicYearId === selectedAcademicYear &&
            s.programId === selectedProgram
        )
        : []
    const getFilteredCriterias = () => selectedStandard
        ? (data?.criterias || []).filter(c => c.standardId === selectedStandard)
        : []
    const getFilteredEvidences = () => selectedCriteria
        ? (data?.evidences || []).filter(e => e.criteriaId === selectedCriteria)
        : []

    const viewFile = async (file) => {
        setViewingFile(file)
        setFileLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/files/stream/${file.id}`)

            if (!response.ok) {
                throw new Error('Không thể tải file')
            }

            const mimeType = file.mimeType || 'application/octet-stream'

            if (mimeType.startsWith('image/')) {
                const blob = await response.blob()
                const url = URL.createObjectURL(blob)
                setFileContent({ type: 'image', url, name: file.originalName })
            } else if (mimeType === 'application/pdf') {
                const blob = await response.blob()
                const url = URL.createObjectURL(blob)
                setFileContent({ type: 'pdf', url, name: file.originalName })
            } else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
                const text = await response.text()
                setFileContent({ type: 'text', content: text, name: file.originalName })
            } else {
                setFileContent({ type: 'unknown', name: file.originalName })
            }
        } catch (err) {
            console.error('Error loading file:', err)
            setFileContent({ type: 'error', name: file.originalName, error: err.message })
        } finally {
            setFileLoading(false)
        }
    }

    const downloadFile = (file) => {
        const link = document.createElement('a')
        link.href = `${API_BASE_URL}/api/files/download/${file.id}`
        link.download = file.originalName || 'download'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    const getStatusColor = (status) => {
        const colors = {
            new: 'from-blue-400 to-blue-600',
            in_progress: 'from-cyan-400 to-blue-600',
            completed: 'from-indigo-400 to-indigo-600',
            approved: 'from-green-400 to-emerald-600',
            rejected: 'from-red-400 to-rose-600'
        }
        return colors[status] || 'from-blue-400 to-blue-600'
    }

    const getStatusLabel = (status) => {
        const labels = {
            new: 'Mới',
            in_progress: 'Đang thực hiện',
            completed: 'Hoàn thành',
            approved: 'Đã duyệt',
            rejected: 'Từ chối'
        }
        return labels[status] || status
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <p className="text-slate-700 font-semibold text-lg">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-200">
                    <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-100 to-rose-100 rounded-full mx-auto mb-4">
                        <AlertCircle className="w-7 h-7 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Lỗi</h1>
                    <p className="text-center text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => code ? fetchEvidenceByCode(code) : fetchHierarchyData()}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        )
    }

    // Nếu có code và đã load evidence, hiển thị detail page
    if (code && evidence) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
                {/* Modal xem file */}
                {viewingFile && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-blue-200">
                            <div className="flex items-center justify-between p-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-slate-900 truncate">{viewingFile.originalName}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setViewingFile(null)
                                        setFileContent(null)
                                    }}
                                    className="p-2 hover:bg-blue-100 rounded-lg transition-all text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="overflow-auto bg-white" style={{ height: 'calc(90vh - 80px)' }}>
                                {fileLoading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    </div>
                                ) : fileContent ? (
                                    <>
                                        {fileContent.type === 'image' && (
                                            <div className="h-full flex items-center justify-center p-4 bg-slate-50">
                                                <img
                                                    src={fileContent.url}
                                                    alt={fileContent.name}
                                                    className="max-h-full max-w-full rounded-xl shadow-lg"
                                                />
                                            </div>
                                        )}
                                        {fileContent.type === 'pdf' && (
                                            <iframe
                                                src={fileContent.url}
                                                className="w-full h-full"
                                                title="PDF Viewer"
                                            />
                                        )}
                                        {fileContent.type === 'text' && (
                                            <pre className="p-8 text-slate-700 font-mono text-sm overflow-auto whitespace-pre-wrap bg-slate-50">
                                                {fileContent.content}
                                            </pre>
                                        )}
                                        {fileContent.type === 'unknown' && (
                                            <div className="h-full flex items-center justify-center flex-col gap-4">
                                                <div className="p-4 bg-blue-100 rounded-full">
                                                    <FileText className="w-12 h-12 text-blue-600" />
                                                </div>
                                                <p className="text-slate-600 text-center font-medium">Loại file này không hỗ trợ xem trực tiếp</p>
                                                <button
                                                    onClick={() => downloadFile(viewingFile)}
                                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Tải xuống
                                                </button>
                                            </div>
                                        )}
                                        {fileContent.type === 'error' && (
                                            <div className="h-full flex items-center justify-center">
                                                <div className="text-center">
                                                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                                    <p className="text-red-600 font-semibold">Lỗi khi tải file</p>
                                                    <p className="text-sm text-slate-500 mt-1">{fileContent.error}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white px-6 py-10 shadow-xl">
                    <div className="max-w-5xl mx-auto flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h1 className="text-4xl font-bold">Chi Tiết Minh Chứng</h1>
                            </div>
                            <p className="text-blue-100 text-lg">{evidence.code}</p>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all font-semibold"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Trang chủ
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <div className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden">
                        <div className={`bg-gradient-to-r ${getStatusColor(evidence.status)} px-8 py-8 text-white`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-semibold opacity-90 mb-2">Mã minh chứng</p>
                                    <h3 className="text-3xl font-bold mb-3">{evidence.code}</h3>
                                    <h4 className="text-xl mb-3">{evidence.name}</h4>
                                    {evidence.description && (
                                        <p className="opacity-90 mb-4">{evidence.description}</p>
                                    )}
                                    
                                    {/* Thông tin phân cấp */}
                                    <div className="mt-4 space-y-2 text-sm opacity-90">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">Năm học:</span>
                                            <span>{evidence.academicYearId?.name || <span className="italic text-yellow-200">Chưa có thông tin</span>}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">Chương trình:</span>
                                            <span>{evidence.programId?.name || <span className="italic text-yellow-200">Chưa có thông tin</span>}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">Tổ chức:</span>
                                            <span>{evidence.organizationId?.name || <span className="italic text-yellow-200">Chưa có thông tin</span>}</span>
                                        </div>
                                        {evidence.standardId && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Tiêu chuẩn:</span>
                                                <span>{evidence.standardId.code} - {evidence.standardId.name}</span>
                                            </div>
                                        )}
                                        {evidence.criteriaId && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Tiêu chí:</span>
                                                <span>{evidence.criteriaId.code} - {evidence.criteriaId.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-white bg-opacity-30 backdrop-blur-sm">
                                        {getStatusLabel(evidence.status)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Files */}
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                Tệp minh chứng
                                <span className="ml-auto text-lg text-blue-600 font-semibold bg-blue-50 px-4 py-1 rounded-full">
                                    {evidence.files?.length || 0}
                                </span>
                            </h3>
                            <div className="space-y-3">
                                {evidence.files && evidence.files.length > 0 ? (
                                    evidence.files.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-5 hover:bg-blue-50 rounded-xl border border-blue-100 transition-all group">
                                            <div className="flex-1 flex items-center gap-4">
                                                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg text-blue-600 group-hover:text-blue-700">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 group-hover:text-blue-600">{file.originalName}</p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => viewFile(file)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg text-white rounded-lg font-semibold transition-all text-sm"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Xem
                                                </button>
                                                <button
                                                    onClick={() => downloadFile(file)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold transition-all text-sm"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm italic text-center py-8">Không có tệp nào</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
            {/* Modal xem file */}
            {viewingFile && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-blue-200">
                        <div className="flex items-center justify-between p-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="font-semibold text-slate-900 truncate">{viewingFile.originalName}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setViewingFile(null)
                                    setFileContent(null)
                                }}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-all text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-auto bg-white" style={{ height: 'calc(90vh - 80px)' }}>
                            {fileLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                </div>
                            ) : fileContent ? (
                                <>
                                    {fileContent.type === 'image' && (
                                        <div className="h-full flex items-center justify-center p-4 bg-slate-50">
                                            <img
                                                src={fileContent.url}
                                                alt={fileContent.name}
                                                className="max-h-full max-w-full rounded-xl shadow-lg"
                                            />
                                        </div>
                                    )}
                                    {fileContent.type === 'pdf' && (
                                        <iframe
                                            src={fileContent.url}
                                            className="w-full h-full"
                                            title="PDF Viewer"
                                        />
                                    )}
                                    {fileContent.type === 'text' && (
                                        <pre className="p-8 text-slate-700 font-mono text-sm overflow-auto whitespace-pre-wrap bg-slate-50">
                      {fileContent.content}
                    </pre>
                                    )}
                                    {fileContent.type === 'unknown' && (
                                        <div className="h-full flex items-center justify-center flex-col gap-4">
                                            <div className="p-4 bg-blue-100 rounded-full">
                                                <FileText className="w-12 h-12 text-blue-600" />
                                            </div>
                                            <p className="text-slate-600 text-center font-medium">Loại file này không hỗ trợ xem trực tiếp</p>
                                            <button
                                                onClick={() => downloadFile(viewingFile)}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
                                            >
                                                <Download className="w-4 h-4" />
                                                Tải xuống
                                            </button>
                                        </div>
                                    )}
                                    {fileContent.type === 'error' && (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="text-center">
                                                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                                <p className="text-red-600 font-semibold">Lỗi khi tải file</p>
                                                <p className="text-sm text-slate-500 mt-1">{fileContent.error}</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white px-6 py-10 shadow-xl">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                <Home className="w-6 h-6" />
                            </div>
                            <h1 className="text-4xl font-bold">Thư viện Minh Chứng</h1>
                        </div>
                        <p className="text-blue-100 text-lg">Duyệt và quản lý minh chứng theo cấu trúc phân cấp</p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all font-semibold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Trang chủ
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Breadcrumb */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-white p-5 rounded-2xl border border-blue-200 shadow-sm overflow-x-auto">
                        <span className="font-semibold text-slate-700 shrink-0">Trình tự:</span>
                        {selectedAcademicYear && (
                            <>
                                <span className="text-blue-700 font-bold shrink-0">{data?.academicYears?.find(a => a.id === selectedAcademicYear)?.name}</span>
                                {selectedProgram && <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />}
                            </>
                        )}
                        {selectedProgram && (
                            <>
                                <span className="text-indigo-700 font-bold shrink-0">{data?.programs?.find(p => p.id === selectedProgram)?.name}</span>
                                {selectedOrganization && <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />}
                            </>
                        )}
                        {selectedOrganization && (
                            <>
                                <span className="text-cyan-700 font-bold shrink-0">{data?.organizations?.find(o => o.id === selectedOrganization)?.name}</span>
                                {selectedStandard && <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />}
                            </>
                        )}
                        {selectedStandard && (
                            <>
                                <span className="text-purple-700 font-bold shrink-0">{data?.standards?.find(s => s.id === selectedStandard)?.code}</span>
                                {selectedCriteria && <ChevronRight className="w-4 h-4 text-blue-400 shrink-0" />}
                            </>
                        )}
                        {selectedCriteria && (
                            <span className="text-rose-700 font-bold shrink-0">{data?.criterias?.find(c => c.id === selectedCriteria)?.code}</span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    {/* Năm học */}
                    <div className="bg-white rounded-2xl shadow-md border border-blue-200 overflow-hidden hover:shadow-lg transition-all">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Năm học
                            </h2>
                        </div>
                        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                            {data?.academicYears?.map(year => (
                                <button
                                    key={year.id}
                                    onClick={() => {
                                        setSelectedAcademicYear(year.id)
                                        setSelectedProgram(null)
                                        setSelectedOrganization(null)
                                        setSelectedStandard(null)
                                        setSelectedCriteria(null)
                                        setSelectedEvidence(null)
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                                        selectedAcademicYear === year.id
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                            : 'hover:bg-blue-50 text-slate-700'
                                    }`}
                                >
                                    {year.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chương trình */}
                    <div className="bg-white rounded-2xl shadow-md border border-indigo-200 overflow-hidden hover:shadow-lg transition-all">
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-4">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <FolderOpen className="w-5 h-5" />
                                Chương trình
                            </h2>
                        </div>
                        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                            {selectedAcademicYear ? (
                                getFilteredPrograms().map(prog => (
                                    <button
                                        key={prog.id}
                                        onClick={() => {
                                            setSelectedProgram(prog.id)
                                            setSelectedOrganization(null)
                                            setSelectedStandard(null)
                                            setSelectedCriteria(null)
                                            setSelectedEvidence(null)
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                                            selectedProgram === prog.id
                                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                                                : 'hover:bg-indigo-50 text-slate-700'
                                        }`}
                                    >
                                        {prog.name}
                                    </button>
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm italic text-center py-4">Chọn năm học</p>
                            )}
                        </div>
                    </div>

                    {/* Tổ chức */}
                    <div className="bg-white rounded-2xl shadow-md border border-cyan-200 overflow-hidden hover:shadow-lg transition-all">
                        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-5 py-4">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <FolderOpen className="w-5 h-5" />
                                Tổ chức
                            </h2>
                        </div>
                        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                            {selectedProgram ? (
                                getFilteredOrganizations().map(org => (
                                    <button
                                        key={org.id}
                                        onClick={() => {
                                            setSelectedOrganization(org.id)
                                            setSelectedStandard(null)
                                            setSelectedCriteria(null)
                                            setSelectedEvidence(null)
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                                            selectedOrganization === org.id
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md'
                                                : 'hover:bg-cyan-50 text-slate-700'
                                        }`}
                                    >
                                        {org.name}
                                    </button>
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm italic text-center py-4">Chọn chương trình</p>
                            )}
                        </div>
                    </div>

                    {/* Tiêu chuẩn */}
                    <div className="bg-white rounded-2xl shadow-md border border-purple-200 overflow-hidden hover:shadow-lg transition-all">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-5 py-4">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Tiêu chuẩn
                            </h2>
                        </div>
                        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                            {selectedOrganization ? (
                                getFilteredStandards().map(std => (
                                    <button
                                        key={std.id}
                                        onClick={() => {
                                            setSelectedStandard(std.id)
                                            setSelectedCriteria(null)
                                            setSelectedEvidence(null)
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                                            selectedStandard === std.id
                                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                                                : 'hover:bg-purple-50 text-slate-700'
                                        }`}
                                    >
                                        <div className="font-bold">{std.code}</div>
                                        <div className="text-xs opacity-75 mt-1">{std.name}</div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm italic text-center py-4">Chọn tổ chức</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tiêu chí và Minh chứng */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Tiêu chí */}
                    <div className="bg-white rounded-2xl shadow-md border border-pink-200 overflow-hidden hover:shadow-lg transition-all">
                        <div className="bg-gradient-to-r from-pink-500 to-rose-600 px-5 py-4">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Tiêu chí
                            </h2>
                        </div>
                        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                            {selectedStandard ? (
                                getFilteredCriterias().length > 0 ? (
                                    getFilteredCriterias().map(crit => (
                                        <button
                                            key={crit.id}
                                            onClick={() => {
                                                setSelectedCriteria(crit.id)
                                                setSelectedEvidence(null)
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm ${
                                                selectedCriteria === crit.id
                                                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold shadow-md'
                                                    : 'hover:bg-pink-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="font-bold">{crit.code}</div>
                                            <div className="text-xs opacity-75 mt-1">{crit.name}</div>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm italic text-center py-4">Không có tiêu chí</p>
                                )
                            ) : (
                                <p className="text-slate-400 text-sm italic text-center py-4">Chọn tiêu chuẩn</p>
                            )}
                        </div>
                    </div>

                    {/* Minh chứng */}
                    <div className="bg-white rounded-2xl shadow-md border border-amber-200 overflow-hidden hover:shadow-lg transition-all">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-4">
                            <h2 className="font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Minh chứng
                            </h2>
                        </div>
                        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                            {selectedCriteria ? (
                                getFilteredEvidences().length > 0 ? (
                                    getFilteredEvidences().map(evidence => (
                                        <button
                                            key={evidence.id}
                                            onClick={() => setSelectedEvidence(evidence.id)}
                                            className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm ${
                                                selectedEvidence === evidence.id
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md'
                                                    : 'hover:bg-amber-50 text-slate-700'
                                            }`}
                                        >
                                            <div className="font-bold">{evidence.code}</div>
                                            <div className="text-xs opacity-75 mt-1">{evidence.name}</div>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm italic text-center py-4">Không có minh chứng</p>
                                )
                            ) : (
                                <p className="text-slate-400 text-sm italic text-center py-4">Chọn tiêu chí</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chi tiết minh chứng */}
                {selectedEvidence && (
                    <div className="mt-10 bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden">
                        {(() => {
                            const evidence = data?.evidences?.find(e => e.id === selectedEvidence)
                            if (!evidence) return null
                            return (
                                <>
                                    <div className={`bg-gradient-to-r ${getStatusColor(evidence.status)} px-8 py-8 text-white`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-semibold opacity-90 mb-2">Mã minh chứng</p>
                                                <h3 className="text-3xl font-bold mb-3">{evidence.code}</h3>
                                                <h4 className="text-xl mb-3">{evidence.name}</h4>
                                                {evidence.description && (
                                                    <p className="opacity-90">{evidence.description}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold bg-white bg-opacity-30 backdrop-blur-sm`}>
                                                    {getStatusLabel(evidence.status)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Files */}
                                    <div className="p-8">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                            <div className="p-3 bg-blue-100 rounded-lg">
                                                <FileText className="w-6 h-6 text-blue-600" />
                                            </div>
                                            Tệp minh chứng
                                            <span className="ml-auto text-lg text-blue-600 font-semibold bg-blue-50 px-4 py-1 rounded-full">
                        {evidence.files?.length || 0}
                      </span>
                                        </h3>
                                        <div className="space-y-3">
                                            {evidence.files && evidence.files.length > 0 ? (
                                                evidence.files.map((file, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-5 hover:bg-blue-50 rounded-xl border border-blue-100 transition-all group">
                                                        <div className="flex-1 flex items-center gap-4">
                                                            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg text-blue-600 group-hover:text-blue-700">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 group-hover:text-blue-600">{file.originalName}</p>
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-4">
                                                            <button
                                                                onClick={() => viewFile(file)}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg text-white rounded-lg font-semibold transition-all text-sm"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                Xem
                                                            </button>
                                                            <button
                                                                onClick={() => downloadFile(file)}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold transition-all text-sm"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-slate-400 text-sm italic text-center py-8">Không có tệp nào</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )
                        })()}
                    </div>
                )}
            </div>
        </div>
    )
}