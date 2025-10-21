// EvidenceTree.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import FileManagement from '../file/FileManagement'
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Folder,
    FolderOpen,
    Download,
    RefreshCw,
    BookOpen,
    Building2,
    Loader2,
    ArrowLeft,
    Maximize2,
    Minimize2,
    Upload,
    FileDown,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    Check,
    GripVertical,
    Send,
    Users
} from 'lucide-react'

export default function EvidenceTree() {
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [treeData, setTreeData] = useState([])
    const [expandedNodes, setExpandedNodes] = useState({})
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [departments, setDepartments] = useState([])
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedOrganization, setSelectedOrganization] = useState('')
    const [selectedDepartment, setSelectedDepartment] = useState('')
    const [importing, setImporting] = useState(false)
    const [importMode, setImportMode] = useState('create')
    const [showImportModal, setShowImportModal] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [statistics, setStatistics] = useState(null)

    const [selectedEvidence, setSelectedEvidence] = useState(null)
    const [draggedEvidence, setDraggedEvidence] = useState(null)

    const [showRequestModal, setShowRequestModal] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [assignUsers, setAssignUsers] = useState([])
    const [availableUsers, setAvailableUsers] = useState([])
    const [selectedEvidenceForRequest, setSelectedEvidenceForRequest] = useState(null)
    const [userRole, setUserRole] = useState('')

    useEffect(() => {
        fetchPrograms()
        fetchOrganizations()
        fetchDepartments()
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        setUserRole(user.role || '')
    }, [])

    useEffect(() => {
        if (selectedProgram && selectedOrganization) {
            fetchTreeData()
        }
    }, [selectedProgram, selectedOrganization, selectedDepartment])

    const fetchPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll()
            const programsData = response.data.data.programs || response.data.data || []
            setPrograms(programsData)
            if (programsData.length > 0) {
                setSelectedProgram(programsData[0]._id)
            }
        } catch (error) {
            console.error('Fetch programs error:', error)
            toast.error('Lỗi khi tải danh sách chương trình')
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll()
            const organizationsData = response.data.data.organizations || response.data.data || []
            setOrganizations(organizationsData)
            if (organizationsData.length > 0) {
                setSelectedOrganization(organizationsData[0]._id)
            }
        } catch (error) {
            console.error('Fetch organizations error:', error)
            toast.error('Lỗi khi tải danh sách tổ chức')
        }
    }

    const fetchDepartments = async () => {
        try {
            const response = await apiMethods.departments.getAll()
            const departmentsData = response.data.data.departments || response.data.data || []
            setDepartments(departmentsData)
            setSelectedDepartment('')
        } catch (error) {
            console.error('Fetch departments error:', error)
            toast.error('Lỗi khi tải danh sách phòng ban')
        }
    }

    const fetchDepartmentUsers = async (departmentId) => {
        try {
            const response = await apiMethods.users.getAll({
                department: departmentId
            })
            setAvailableUsers(response.data.data.users || [])
        } catch (error) {
            console.error('Fetch department users error:', error)
            toast.error('Lỗi khi tải danh sách cán bộ')
        }
    }

    const fetchTreeData = async () => {
        try {
            setLoading(true)

            if (!selectedProgram || !selectedOrganization) {
                setTreeData([])
                setLoading(false)
                return
            }

            const params = {
                programId: selectedProgram,
                organizationId: selectedOrganization
            }

            if (selectedDepartment) {
                params.departmentId = selectedDepartment
            }

            const response = await apiMethods.evidences.getFullTree(
                params.programId,
                params.organizationId,
                params.departmentId
            )

            setTreeData(response.data.data.tree || [])
            setStatistics(response.data.data.statistics || null)
        } catch (error) {
            console.error('Fetch tree data error:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi khi tải cây minh chứng'
            toast.error(errorMessage)
            setTreeData([])
        } finally {
            setLoading(false)
        }
    }

    const toggleNode = (nodeKey) => {
        setExpandedNodes(prev => ({
            ...prev,
            [nodeKey]: !prev[nodeKey]
        }))
    }

    const expandAll = () => {
        const allNodes = {}
        treeData.forEach((standard, stdIdx) => {
            allNodes[`std-${stdIdx}`] = true
            standard.criteria?.forEach((criteria, critIdx) => {
                allNodes[`std-${stdIdx}-crit-${critIdx}`] = true
            })
        })
        setExpandedNodes(allNodes)
    }

    const collapseAll = () => {
        setExpandedNodes({})
    }

    const handleDragStart = (e, evidence, standardId, criteriaId) => {
        setDraggedEvidence({ evidence, standardId, criteriaId })
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = async (e, targetStandardId, targetCriteriaId) => {
        e.preventDefault()

        if (!draggedEvidence) return

        if (draggedEvidence.standardId === targetStandardId &&
            draggedEvidence.criteriaId === targetCriteriaId) {
            toast.info('Minh chứng đã ở vị trí này')
            setDraggedEvidence(null)
            return
        }

        const standard = treeData.find(s => s.id === targetStandardId)
        const criteria = standard?.criteria.find(c => c.id === targetCriteriaId)

        if (!standard || !criteria) {
            toast.error('Không tìm thấy tiêu chuẩn/tiêu chí đích')
            setDraggedEvidence(null)
            return
        }

        const currentCode = draggedEvidence.evidence.code
        const currentCodeParts = currentCode.split('.')

        const prefixAndBox = currentCodeParts[0]

        const newStandardCode = String(standard.code).padStart(2, '0')
        const newCriteriaCode = String(criteria.code).padStart(2, '0')

        const sequenceNumber = currentCodeParts[3]

        const newCode = `${prefixAndBox}.${newStandardCode}.${newCriteriaCode}.${sequenceNumber}`

        if (!confirm(`Di chuyển "${draggedEvidence.evidence.name}" sang Tiêu chí ${criteria.code}?\nMã mới (giữ tiền tố và STT): ${newCode}`)) {
            setDraggedEvidence(null)
            return
        }

        try {
            await apiMethods.evidences.move(draggedEvidence.evidence.id, {
                targetStandardId,
                targetCriteriaId,
                newCode
            })
            toast.success('Di chuyển minh chứng thành công')
            fetchTreeData()
            setSelectedEvidence(null)
        } catch (error) {
            console.error('Move evidence error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi di chuyển minh chứng')
        } finally {
            setDraggedEvidence(null)
        }
    }

    const downloadTemplate = () => {
        const templateData = [
            ['STT', 'Mã', 'Tên minh chứng'],
            ['', 'A', 'Tiêu chuẩn A: Mục tiêu và chuẩn đầu ra'],
            ['', 'A.1', 'Tiêu chí A.1: Mục tiêu CTĐT'],
            ['1', 'A1.01.01.01', 'Quyết định công bố tầm nhìn'],
            ['2', 'A1.01.01.02', 'Quyết định thành lập nhóm nghiên cứu']
        ]

        const ws = XLSX.utils.aoa_to_sheet(templateData)
        ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 70 }]

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Minh chứng')
        XLSX.writeFile(wb, 'template-import-minh-chung.xlsx')
        toast.success('Đã tải file mẫu Excel')
    }

    const handleFileSelectForImport = (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!selectedProgram || !selectedOrganization || !selectedDepartment) {
            toast.error('Vui lòng chọn Chương trình, Tổ chức và Phòng ban trước')
            event.target.value = ''
            return
        }

        setSelectedFile(file)
        setShowImportModal(true)
    }

    const handleImport = async () => {
        if (!selectedFile || !selectedProgram || !selectedOrganization || !selectedDepartment) return

        try {
            setImporting(true)

            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('programId', selectedProgram)
            formData.append('organizationId', selectedOrganization)
            formData.append('departmentId', selectedDepartment)
            formData.append('mode', importMode)

            const response = await apiMethods.evidences.import(formData)

            if (response.data.success) {
                const errors = response.data.data.details?.errors || []
                let message = response.data.message || 'Import hoàn tất!'

                if (errors.length > 0) {
                    message += ` (${errors.length} lỗi)`
                    toast.error(message, { duration: 8000 })
                } else {
                    toast.success(message, { duration: 6000 })
                }

                setTimeout(() => fetchTreeData(), 500)
            } else {
                toast.error(response.data.message || 'Import thất bại')
            }
        } catch (error) {
            console.error('Import error:', error)
            toast.error('Lỗi khi import: ' + (error.response?.data?.message || error.message))
        } finally {
            setImporting(false)
            setShowImportModal(false)
            setSelectedFile(null)
            const fileInput = document.getElementById('file-upload')
            if (fileInput) fileInput.value = ''
        }
    }

    const handleExport = async () => {
        try {
            if (!selectedProgram || !selectedOrganization || !selectedDepartment) {
                toast.error('Vui lòng chọn Chương trình, Tổ chức và Phòng ban')
                return
            }

            toast.loading('Đang xuất dữ liệu...')

            const response = await apiMethods.evidences.exportData({
                programId: selectedProgram,
                organizationId: selectedOrganization,
                departmentId: selectedDepartment,
                format: 'xlsx'
            })

            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `cay-minh-chung-${Date.now()}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.dismiss()
            toast.success('Export thành công!')
        } catch (error) {
            console.error('Export error:', error)
            toast.dismiss()
            toast.error('Lỗi khi export')
        }
    }

    const handleSendCompletionRequest = async () => {
        if (!selectedDepartment) {
            toast.error('Vui lòng chọn phòng ban')
            return
        }

        try {
            const response = await apiMethods.evidences.sendCompletionRequest(selectedDepartment)
            if (response.data.success) {
                toast.success(response.data.message)
                setShowRequestModal(false)
            }
        } catch (error) {
            console.error('Send completion request error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi gửi yêu cầu')
        }
    }

    const handleSubmitCompletion = async () => {
        if (!selectedDepartment) {
            toast.error('Vui lòng chọn phòng ban')
            return
        }

        try {
            const response = await apiMethods.evidences.submitCompletionNotification(
                selectedDepartment,
                'Cây minh chứng đã được hoàn thiện'
            )
            if (response.data.success) {
                toast.success(response.data.message)
            }
        } catch (error) {
            console.error('Submit completion error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi gửi xác nhận')
        }
    }

    const handleAssignEvidence = async () => {
        if (assignUsers.length === 0) {
            toast.error('Vui lòng chọn ít nhất một người dùng')
            return
        }

        try {
            const response = await apiMethods.evidences.assignToUsers(
                selectedEvidenceForRequest.id,
                assignUsers
            )
            if (response.data.success) {
                toast.success('Phân quyền minh chứng thành công')
                setShowAssignModal(false)
                setAssignUsers([])
                setSelectedEvidenceForRequest(null)
                fetchTreeData()
            }
        } catch (error) {
            console.error('Assign evidence error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi phân quyền')
        }
    }

    const handleSendFileRequest = async (evidence) => {
        if (!window.confirm(`Gửi yêu cầu nộp file cho minh chứng: ${evidence.name}?`)) {
            return
        }

        try {
            const response = await apiMethods.evidences.sendFileSubmissionRequest(
                evidence.id,
                `Vui lòng nộp file cho minh chứng ${evidence.code}`
            )
            if (response.data.success) {
                toast.success('Đã gửi yêu cầu nộp file')
                fetchTreeData()
            }
        } catch (error) {
            console.error('Send file request error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi gửi yêu cầu')
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'new':
                return <Clock className="h-4 w-4 text-gray-500" />
            case 'assigned':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />
            case 'in_progress':
                return <Clock className="h-4 w-4 text-blue-500" />
            case 'pending_approval':
                return <AlertCircle className="h-4 w-4 text-purple-500" />
            case 'approved':
                return <Check className="h-4 w-4 text-emerald-500" />
            case 'rejected':
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusLabel = (status) => {
        const labels = {
            'new': 'Mới',
            'assigned': 'Phân quyền',
            'in_progress': 'Đang thực hiện',
            'pending_approval': 'Chờ duyệt',
            'approved': 'Đã duyệt',
            'rejected': 'Từ chối',
            'active': 'Hoạt động',
            'inactive': 'Không hoạt động'
        }
        return labels[status] || 'Mới'
    }

    const getStatusColor = (status) => {
        const colors = {
            'new': 'bg-gray-100 text-gray-700 border-gray-300',
            'assigned': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'in_progress': 'bg-blue-100 text-blue-700 border-blue-300',
            'pending_approval': 'bg-purple-100 text-purple-700 border-purple-300',
            'approved': 'bg-emerald-100 text-emerald-700 border-emerald-300',
            'rejected': 'bg-red-100 text-red-700 border-red-300',
            'active': 'bg-green-100 text-green-700 border-green-300',
            'inactive': 'bg-gray-100 text-gray-700 border-gray-300'
        }
        return colors[status] || colors['new']
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <FolderOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Cây minh chứng</h1>
                            <p className="text-indigo-100">Quản lý minh chứng theo tiêu chuẩn và tiêu chí</p>
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

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <BookOpen className="h-4 w-4 inline mr-1" />
                            Chương trình <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedProgram}
                            onChange={(e) => setSelectedProgram(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                            <Building2 className="h-4 w-4 inline mr-1" />
                            Phòng ban <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Tất cả phòng ban</option>
                            {departments.map(dept => (
                                <option key={dept._id} value={dept._id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={fetchTreeData}
                            disabled={loading || !selectedProgram || !selectedOrganization}
                            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                        >
                            <RefreshCw className={`h-5 w-5 mr-2 inline ${loading ? 'animate-spin' : ''}`} />
                            Tải lại
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="flex space-x-3">
                    <button
                        onClick={expandAll}
                        disabled={treeData.length === 0}
                        className="inline-flex items-center px-4 py-2.5 text-sm border-2 border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                    >
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Mở rộng
                    </button>
                    <button
                        onClick={collapseAll}
                        disabled={treeData.length === 0}
                        className="inline-flex items-center px-4 py-2.5 text-sm border-2 border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                    >
                        <Minimize2 className="h-4 w-4 mr-2" />
                        Thu gọn
                    </button>
                </div>

                <div className="flex space-x-3 flex-wrap">
                    <button
                        onClick={downloadTemplate}
                        className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                        <FileDown className="h-5 w-5 mr-2" />
                        File mẫu
                    </button>

                    {userRole === 'admin' && (
                        <button
                            onClick={() => setShowRequestModal(true)}
                            disabled={!selectedProgram || !selectedOrganization || !selectedDepartment}
                            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                        >
                            <Send className="h-5 w-5 mr-2" />
                            Gửi yêu cầu
                        </button>
                    )}

                    {userRole === 'manager' && (
                        <button
                            onClick={handleSubmitCompletion}
                            disabled={!selectedProgram || !selectedOrganization || !selectedDepartment}
                            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                        >
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Hoàn thiện
                        </button>
                    )}

                    <label className={`inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-medium ${
                        !selectedProgram || !selectedOrganization || !selectedDepartment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelectForImport}
                            disabled={!selectedProgram || !selectedOrganization || !selectedDepartment}
                            className="hidden"
                        />
                        <Upload className="h-5 w-5 mr-2" />
                        Import
                    </label>

                    <button
                        onClick={handleExport}
                        disabled={!selectedProgram || !selectedOrganization || !selectedDepartment}
                        className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Statistics */}
            {statistics && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-900">{statistics.totalStandards}</div>
                            <div className="text-sm text-indigo-700">Tổng TC</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-900">{statistics.standardsWithEvidence}</div>
                            <div className="text-sm text-green-700">TC có MC</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-900">{statistics.totalCriteria}</div>
                            <div className="text-sm text-blue-700">Tổng TCi</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-900">{statistics.criteriaWithEvidence}</div>
                            <div className="text-sm text-emerald-700">TCi có MC</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-900">{statistics.totalEvidences}</div>
                            <div className="text-sm text-purple-700">Tổng MC</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tree and File Panel */}
            <div className="grid grid-cols-12 gap-6">
                {/* Tree */}
                <div className={`${selectedEvidence ? 'col-span-7' : 'col-span-12'} bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all`}>
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-16">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải...</p>
                        </div>
                    ) : !selectedProgram || !selectedOrganization ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Folder className="h-10 w-10 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa chọn dữ liệu</h3>
                            <p className="text-gray-500">Vui lòng chọn Chương trình và Tổ chức</p>
                        </div>
                    ) : treeData.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Folder className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dữ liệu</h3>
                        </div>
                    ) : (
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {treeData.map((standard, stdIdx) => {
                                const isStandardExpanded = expandedNodes[`std-${stdIdx}`]
                                const hasEvidence = standard.hasEvidence

                                return (
                                    <div key={standard.id} className="mb-4">
                                        <div
                                            className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all group ${
                                                hasEvidence ? 'bg-green-50 hover:bg-green-100 border-green-300' : 'bg-red-50 hover:bg-red-100 border-red-300'
                                            }`}
                                            onClick={() => toggleNode(`std-${stdIdx}`)}
                                        >
                                            <div className="flex-shrink-0">
                                                {hasEvidence ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <XCircle className="h-6 w-6 text-red-600" />}
                                            </div>
                                            {isStandardExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                            {isStandardExpanded ? <FolderOpen className="h-6 w-6" /> : <Folder className="h-6 w-6" />}
                                            <div className="flex-1 flex items-center justify-between">
                                                <span className="font-semibold text-gray-900">
                                                    TC {standard.code}: {standard.name}
                                                </span>
                                                <span className="px-3 py-1 bg-white rounded-full text-sm font-medium border">
                                                    {standard.criteria?.length || 0} tiêu chí
                                                </span>
                                            </div>
                                        </div>

                                        {isStandardExpanded && standard.criteria && (
                                            <div className="ml-8 mt-3 space-y-3">
                                                {standard.criteria.map((criteria, critIdx) => {
                                                    const criteriaNodeKey = `std-${stdIdx}-crit-${critIdx}`
                                                    const isCriteriaExpanded = expandedNodes[criteriaNodeKey]
                                                    const criteriaHasEvidence = criteria.hasEvidence

                                                    return (
                                                        <div
                                                            key={criteria.id}
                                                            onDragOver={handleDragOver}
                                                            onDrop={(e) => handleDrop(e, standard.id, criteria.id)}
                                                        >
                                                            <div
                                                                className={`flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                                                                    criteriaHasEvidence ? 'bg-blue-50 hover:bg-blue-100 border-blue-300' : 'bg-orange-50 hover:bg-orange-100 border-orange-300'
                                                                }`}
                                                                onClick={() => toggleNode(criteriaNodeKey)}
                                                            >
                                                                <div className="flex-shrink-0">
                                                                    {criteriaHasEvidence ? <CheckCircle2 className="h-5 w-5 text-blue-600" /> : <AlertCircle className="h-5 w-5 text-orange-600" />}
                                                                </div>
                                                                {isCriteriaExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                                {isCriteriaExpanded ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                                                                <div className="flex-1 flex items-center justify-between">
                                                                    <span className="font-medium text-gray-900">
                                                                        TC {standard.code}.{criteria.code}: {criteria.name}
                                                                    </span>
                                                                    <span className="px-2.5 py-1 bg-white rounded-full text-xs font-medium border">
                                                                        {criteria.evidences?.length || 0} MC
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {isCriteriaExpanded && criteria.evidences && criteria.evidences.length > 0 && (
                                                                <div className="ml-8 mt-2 space-y-2">
                                                                    {criteria.evidences.map(evidence => (
                                                                        <div
                                                                            key={evidence.id}
                                                                            draggable
                                                                            onDragStart={(e) => handleDragStart(e, evidence, standard.id, criteria.id)}
                                                                            className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl group transition-all cursor-move"
                                                                        >
                                                                            <div className="flex items-center space-x-3 flex-1">
                                                                                <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                                                    <FileText className="h-5 w-5 text-indigo-600" />
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center space-x-2 mb-1">
                                                                                        <span className="text-sm font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                                                            {evidence.code}
                                                                                        </span>
                                                                                        <span className={`text-xs px-2 py-0.5 rounded border font-medium inline-flex items-center ${getStatusColor(evidence.status)}`}>
                                                                                            {getStatusIcon(evidence.status)}
                                                                                            <span className="ml-1">{getStatusLabel(evidence.status)}</span>
                                                                                        </span>
                                                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                                            {evidence.fileCount || 0} files
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-sm text-gray-900 truncate font-medium">
                                                                                        {evidence.name}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex space-x-1">
                                                                                {userRole === 'manager' && evidence.status === 'new' && (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setSelectedEvidenceForRequest(evidence)
                                                                                            fetchDepartmentUsers(selectedDepartment)
                                                                                            setShowAssignModal(true)
                                                                                        }}
                                                                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                                                        title="Phân quyền minh chứng"
                                                                                    >
                                                                                        <Users className="h-4 w-4" />
                                                                                    </button>
                                                                                )}

                                                                                {userRole === 'manager' && evidence.status === 'assigned' && (
                                                                                    <button
                                                                                        onClick={() => handleSendFileRequest(evidence)}
                                                                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                                                        title="Gửi yêu cầu nộp file"
                                                                                    >
                                                                                        <Send className="h-4 w-4" />
                                                                                    </button>
                                                                                )}

                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setSelectedEvidence(evidence)
                                                                                    }}
                                                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                                                >
                                                                                    <Upload className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* File Management Panel */}
                {selectedEvidence && (
                    <div className="col-span-5">
                        <FileManagement
                            evidence={selectedEvidence}
                            onClose={() => setSelectedEvidence(null)}
                            onUpdate={fetchTreeData}
                        />
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Chọn chế độ import</h3>
                        <div className="space-y-3 mb-6">
                            <label className="flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="importMode"
                                    value="create"
                                    checked={importMode === 'create'}
                                    onChange={(e) => setImportMode(e.target.value)}
                                    className="mt-1"
                                />
                                <div>
                                    <div className="font-semibold text-gray-900">Tạo mới</div>
                                    <div className="text-sm text-gray-600">Chỉ tạo minh chứng mới</div>
                                </div>
                            </label>
                            <label className="flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="importMode"
                                    value="update"
                                    checked={importMode === 'update'}
                                    onChange={(e) => setImportMode(e.target.value)}
                                    className="mt-1"
                                />
                                <div>
                                    <div className="font-semibold text-gray-900">Cập nhật</div>
                                    <div className="text-sm text-gray-600">Cập nhật hoặc tạo mới</div>
                                </div>
                            </label>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowImportModal(false)
                                    setSelectedFile(null)
                                }}
                                disabled={importing}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={importing}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium inline-flex items-center justify-center"
                            >
                                {importing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Đang import...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5 mr-2" />
                                        Import
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Modal - Admin */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            Gửi yêu cầu hoàn thiện cây minh chứng
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Bạn sắp gửi yêu cầu hoàn thiện cây minh chứng đến tất cả quản lý của phòng ban: <strong>{departments.find(d => d._id === selectedDepartment)?.name}</strong>
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSendCompletionRequest}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                            >
                                Gửi yêu cầu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal - Manager */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Phân quyền minh chứng
                        </h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            Minh chứng: <strong>{selectedEvidenceForRequest?.code}</strong>
                        </p>
                        <div className="mb-6 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                            {availableUsers.map(user => (
                                <label key={user._id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                                    <input
                                        type="checkbox"
                                        checked={assignUsers.includes(user._id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setAssignUsers([...assignUsers, user._id])
                                            } else {
                                                setAssignUsers(assignUsers.filter(id => id !== user._id))
                                            }
                                        }}
                                        className="mr-3"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">{user.fullName}</div>
                                        <div className="text-sm text-gray-600">{user.email}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false)
                                    setAssignUsers([])
                                    setSelectedEvidenceForRequest(null)
                                }}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAssignEvidence}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                            >
                                Phân quyền
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}