import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import FileManagement from '../file/FileManagement' // Giả sử component này tồn tại
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
    Eye,
    Edit,
    Trash2,
    Shield,
    FileTextIcon,
    Send,
    Users
} from 'lucide-react'

// Hàm cắt chuỗi để hiển thị tối đa 2 dòng (khoảng 80 ký tự)
const truncateName = (name) => {
    if (!name) return ''
    const maxChars = 80 // Giả sử 80 ký tự là tối đa 2 dòng cho độ rộng này
    if (name.length > maxChars) {
        return name.substring(0, maxChars) + '...'
    }
    return name
}

// Giả sử ActionButton là một component đơn giản với style mới (chuyển sang tông Blue)
const ActionButton = ({ icon: Icon, label, onClick, variant, size, disabled }) => {
    const baseStyle = "flex items-center justify-center p-2 rounded-xl transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
    let variantStyle = "text-white bg-blue-600 hover:bg-blue-700" // Default: Blue (Primary)
    if (variant === 'secondary') variantStyle = "text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200"
    if (variant === 'purple') variantStyle = "text-white bg-purple-600 hover:bg-purple-700"
    if (variant === 'green') variantStyle = "text-white bg-emerald-600 hover:bg-emerald-700"
    if (size === 'sm') variantStyle = variantStyle + ' w-10 h-10' // Kích thước cố định

    return (
        <button
            onClick={onClick}
            className={`${baseStyle} ${variantStyle}`}
            title={label}
            disabled={disabled}
        >
            <Icon className="h-5 w-5" />
        </button>
    )
}

// Component giả lập cho phần Thống kê
const StatisticsCard = ({ statistics }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Tổng quan</h3>
        <div className="grid grid-cols-2 gap-4">
            {statistics ? (
                <>
                    <StatItem label="Tổng Tiêu chuẩn" value={statistics.totalStandards} color="text-blue-600" />
                    <StatItem label="TC có MC" value={statistics.standardsWithEvidence} color="text-green-600" />
                    <StatItem label="Tổng Tiêu chí" value={statistics.totalCriteria} color="text-indigo-600" />
                    <StatItem label="TCh có MC" value={statistics.criteriaWithEvidence} color="text-emerald-600" />
                    <StatItem label="Tổng Minh chứng" value={statistics.totalEvidences} color="text-purple-600" />
                    <StatItem label="Tỉ lệ hoàn thành" value={`${(statistics.standardsWithEvidence / statistics.totalStandards * 100 || 0).toFixed(1)}%`} color="text-red-600" />
                </>
            ) : (
                <p className="text-gray-500 col-span-2">Vui lòng chọn Chương trình/Tổ chức để xem thống kê...</p>
            )}
        </div>
    </div>
)

const StatItem = ({ label, value, color }) => (
    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
)

export default function EvidenceTree() {
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [treeData, setTreeData] = useState([])
    const [expandedNodes, setExpandedNodes] = useState({})
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedOrganization, setSelectedOrganization] = useState('')
    const [importing, setImporting] = useState(false)
    const [importMode, setImportMode] = useState('create')
    const [showImportModal, setShowImportModal] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [statistics, setStatistics] = useState(null)
    const [selectedEvidence, setSelectedEvidence] = useState(null)
    const [draggedEvidence, setDraggedEvidence] = useState(null)
    const [userRole, setUserRole] = useState('')
    const [userPermissions, setUserPermissions] = useState({})

    // State cho Modal Phân quyền/Giao nhiệm vụ
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [assignTarget, setAssignTarget] = useState(null) // { type: 'standard'/'criteria'/'tdg', id: '', code: '' }
    const [assignReportType, setAssignReportType] = useState('criteria') // reportType: tdg, standard, criteria

    useEffect(() => {
        fetchUserInfo()
        fetchPrograms()
        fetchOrganizations()
    }, [])

    useEffect(() => {
        if (selectedProgram && selectedOrganization) {
            fetchTreeData()
        } else {
            setTreeData([])
            setStatistics(null)
        }
    }, [selectedProgram, selectedOrganization])

    const fetchUserInfo = async () => {
        try {
            const response = await apiMethods.users.getProfile()
            setUserRole(response.data.data?.role || '')
            // Lấy permissions để kiểm tra quyền viết báo cáo
            const permissions = response.data.data?.permissions || {}
            setUserPermissions({
                canWriteTDGReport: permissions['can_write_tdg_report'],
                canWriteStandardReport: permissions['can_write_standard_report'],
                canWriteCriteriaReport: permissions['can_write_criteria_report'],
            })
        } catch (error) {
            console.error('Fetch user info error:', error)
        }
    }

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

    const fetchTreeData = async () => {
        try {
            setLoading(true)
            if (!selectedProgram || !selectedOrganization) {
                setTreeData([])
                setLoading(false)
                return
            }
            const response = await apiMethods.evidences.getFullTree(
                selectedProgram,
                selectedOrganization
            )
            setTreeData(response.data.data.tree || [])
            setStatistics(response.data.data.statistics || null)
        } catch (error) {
            console.error('Fetch tree data error:', error)
            const errorMessage = error.response?.data?.message || 'Lỗi khi tải cây minh chứng'
            toast.error(errorMessage)
            setTreeData([])
            setStatistics(null)
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
        if (!confirm(`Di chuyển "${draggedEvidence.evidence.name}" sang Tiêu chí ${criteria.code}?\nMã mới: ${newCode}`)) {
            setDraggedEvidence(null)
            return
        }
        try {
            // Cập nhật API call để gửi đủ thông tin move
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
            ['1', 'A1.01.01.01', 'Quyết định công bố tầm nhìn']
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
        if (!selectedProgram || !selectedOrganization) {
            toast.error('Vui lòng chọn Chương trình và Tổ chức trước')
            event.target.value = ''
            return
        }
        setSelectedFile(file)
        setShowImportModal(true)
    }

    const handleImport = async () => {
        if (!selectedFile || !selectedProgram || !selectedOrganization) return
        try {
            setImporting(true)
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('programId', selectedProgram)
            formData.append('organizationId', selectedOrganization)
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
            if (!selectedProgram || !selectedOrganization) {
                toast.error('Vui lòng chọn Chương trình và Tổ chức')
                return
            }
            toast.loading('Đang xuất dữ liệu...')
            const response = await apiMethods.evidences.exportData({
                programId: selectedProgram,
                organizationId: selectedOrganization,
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

    // Logic Phân quyền
    const canManageAll = userRole === 'admin' || userRole === 'manager'

    // Giao nhiệm vụ (task/phân quyền viết báo cáo)
    const handleAssignClick = (type, node, reportType) => {
        setAssignTarget({
            type: type,
            id: node.id,
            code: node.code,
            name: node.name,
            programId: selectedProgram,
            organizationId: selectedOrganization,
            standardId: node.standardId, // Dùng cho criteria
            criteriaId: node.criteriaId // Dùng cho standard
        })
        setAssignReportType(reportType)
        setShowAssignModal(true)
    }

    // Viết báo cáo (chỉ hiển thị nếu được phân quyền)
    const canWriteReport = (reportType) => {
        if (canManageAll) return true
        if (reportType === 'tdg' && userPermissions.canWriteTDGReport) return true
        if (reportType === 'standard' && userPermissions.canWriteStandardReport) return true
        if (reportType === 'criteria' && userPermissions.canWriteCriteriaReport) return true
        return false
    }

    // Thao tác với Minh chứng (Thêm/Sửa/Xóa)
    const canEditEvidence = () => {
        // Manager có quyền thêm sửa xóa minh chứng
        return canManageAll || userRole === 'reporter'
    }

    const canDeleteEvidence = () => {
        return canManageAll
    }


    const getStatusIcon = (status) => {
        const iconMap = {
            'new': <Clock className="h-4 w-4 text-gray-500" />,
            'in_progress': <Clock className="h-4 w-4 text-blue-500" />,
            'completed': <CheckCircle2 className="h-4 w-4 text-green-500" />,
            'approved': <Check className="h-4 w-4 text-emerald-500" />,
            'rejected': <XCircle className="h-4 w-4 text-red-500" />
        }
        return iconMap[status] || <Clock className="h-4 w-4 text-gray-500" />
    }

    const getStatusLabel = (status) => {
        const labels = {
            'new': 'Mới',
            'in_progress': 'Đang thực hiện',
            'completed': 'Hoàn thành',
            'approved': 'Đã duyệt',
            'rejected': 'Từ chối'
        }
        return labels[status] || 'Mới'
    }

    const getStatusColor = (status) => {
        const colors = {
            'new': 'bg-gray-100 text-gray-700 border-gray-300',
            'in_progress': 'bg-blue-100 text-blue-700 border-blue-300',
            'completed': 'bg-green-100 text-green-700 border-green-300',
            'approved': 'bg-emerald-100 text-emerald-700 border-emerald-300',
            'rejected': 'bg-red-100 text-red-700 border-red-300'
        }
        return colors[status] || colors['new']
    }

    const StandardNode = ({ standard, stdIdx }) => {
        const isExpanded = expandedNodes[`std-${stdIdx}`]

        return (
            <div key={standard.id} className="mb-4">
                <div
                    className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all ${
                        standard.hasEvidence ? 'bg-blue-50 hover:bg-blue-100 border-blue-300' : 'bg-red-50 hover:bg-red-100 border-red-300'
                    }`}
                >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={() => toggleNode(`std-${stdIdx}`)}>
                        <div className="flex-shrink-0">
                            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </div>
                        <div className="flex-shrink-0">
                            {isExpanded ? <FolderOpen className="h-6 w-6 text-blue-600" /> : <Folder className="h-6 w-6 text-blue-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-semibold text-gray-900 block overflow-hidden" style={{ maxHeight: '2.8em', lineHeight: '1.4em' }}>
                                TC {standard.code}: {truncateName(standard.name)}
                            </span>
                            <div className="text-xs text-gray-600 mt-1">
                                {standard.criteria?.length || 0} tiêu chí
                            </div>
                        </div>
                    </div>
                    {/* Nút thao tác Tiêu chuẩn - cố định bên phải */}
                    <div className="flex space-x-2 ml-4 flex-shrink-0">
                        <ActionButton
                            icon={Eye}
                            label="Xem"
                            onClick={(e) => { e.stopPropagation(); toast.success('Xem tiêu chuẩn'); }}
                            variant="secondary"
                            size="sm"
                        />
                        {/* Viết Báo cáo TĐG */}
                        {canWriteReport('tdg') && (
                            <ActionButton
                                icon={FileTextIcon}
                                label="Viết BC TĐG"
                                onClick={(e) => { e.stopPropagation(); toast.success('Mở form viết báo cáo TĐG'); }}
                                variant="primary"
                                size="sm"
                            />
                        )}
                        {/* Viết Báo cáo Tiêu chuẩn */}
                        {canWriteReport('standard') && (
                            <ActionButton
                                icon={FileTextIcon}
                                label="Viết BC Tiêu chuẩn"
                                onClick={(e) => { e.stopPropagation(); toast.success('Mở form viết báo cáo tiêu chuẩn'); }}
                                variant="primary"
                                size="sm"
                            />
                        )}
                        {/* Manager/Reporter có quyền giao nhiệm vụ/phân quyền BC Tiêu chuẩn */}
                        {(canManageAll || canWriteReport('tdg')) && (
                            <ActionButton
                                icon={Users}
                                label="Phân quyền BC Tiêu chuẩn"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleAssignClick('standard', standard, 'standard')
                                }}
                                variant="purple"
                                size="sm"
                            />
                        )}
                    </div>
                </div>

                {isExpanded && standard.criteria && (
                    <div className="ml-8 mt-3 space-y-3">
                        {standard.criteria.map((criteria, critIdx) => (
                            <CriteriaNode
                                key={criteria.id}
                                criteria={criteria}
                                standard={standard}
                                stdIdx={stdIdx}
                                critIdx={critIdx}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const CriteriaNode = ({ criteria, standard, stdIdx, critIdx, onDragOver, onDrop }) => {
        const criteriaNodeKey = `std-${stdIdx}-crit-${critIdx}`
        const isCriteriaExpanded = expandedNodes[criteriaNodeKey]

        return (
            <div
                key={criteria.id}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, standard.id, criteria.id)}
            >
                <div
                    className={`flex items-center justify-between p-3 border-2 rounded-xl transition-all ${
                        criteria.hasEvidence ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300' : 'bg-orange-50 hover:bg-orange-100 border-orange-300'
                    }`}
                >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={() => toggleNode(criteriaNodeKey)}>
                        <div className="flex-shrink-0">
                            {isCriteriaExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                        <div className="flex-shrink-0">
                            {isCriteriaExpanded ? <FolderOpen className="h-5 w-5 text-indigo-600" /> : <Folder className="h-5 w-5 text-indigo-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="font-medium text-gray-900 block overflow-hidden" style={{ maxHeight: '2.8em', lineHeight: '1.4em' }}>
                                TC {standard.code}.{criteria.code}: {truncateName(criteria.name)}
                            </span>
                            <div className="text-xs text-gray-600 mt-1">
                                {criteria.evidences?.length || 0} minh chứng
                            </div>
                        </div>
                    </div>
                    {/* Nút thao tác Tiêu chí - cố định bên phải */}
                    <div className="flex space-x-2 ml-4 flex-shrink-0">
                        <ActionButton
                            icon={Eye}
                            label="Xem"
                            onClick={(e) => { e.stopPropagation(); toast.success('Xem tiêu chí'); }}
                            variant="secondary"
                            size="sm"
                        />
                        {/* Viết Báo cáo Tiêu chí */}
                        {canWriteReport('criteria') && (
                            <ActionButton
                                icon={FileTextIcon}
                                label="Viết BC Tiêu chí"
                                onClick={(e) => { e.stopPropagation(); toast.success('Mở form viết báo cáo tiêu chí'); }}
                                variant="primary"
                                size="sm"
                            />
                        )}
                        {/* Manager/Reporter có quyền giao nhiệm vụ/phân quyền BC Tiêu chí */}
                        {(canManageAll || canWriteReport('standard')) && (
                            <ActionButton
                                icon={Users}
                                label="Phân quyền BC Tiêu chí"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleAssignClick('criteria', {...criteria, standardId: standard.id}, 'criteria')
                                }}
                                variant="purple"
                                size="sm"
                            />
                        )}
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
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="text-sm font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">
                                                {evidence.code}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded border font-medium inline-flex items-center ${getStatusColor(evidence.status)} flex-shrink-0`}>
                                                {getStatusIcon(evidence.status)}
                                                <span className="ml-1">{getStatusLabel(evidence.status)}</span>
                                            </span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                                                {evidence.fileCount || 0} files
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-900 truncate font-medium block overflow-hidden" style={{ maxHeight: '2.8em', lineHeight: '1.4em' }}>
                                            {truncateName(evidence.name)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2 ml-4 flex-shrink-0">
                                    <ActionButton
                                        icon={Eye}
                                        label="Xem MC"
                                        onClick={(e) => { e.stopPropagation(); toast.success('Xem minh chứng'); }}
                                        variant="secondary"
                                        size="sm"
                                    />
                                    {canEditEvidence() && (
                                        <ActionButton
                                            icon={Edit}
                                            label="Sửa MC"
                                            onClick={(e) => { e.stopPropagation(); toast.success('Mở form sửa minh chứng'); }}
                                            variant="secondary"
                                            size="sm"
                                        />
                                    )}
                                    {canDeleteEvidence() && (
                                        <ActionButton
                                            icon={Trash2}
                                            label="Xóa MC"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (confirm('Bạn chắc chắn muốn xóa?')) {
                                                    toast.success('Xóa minh chứng')
                                                }
                                            }}
                                            variant="secondary"
                                            size="sm"
                                        />
                                    )}
                                    <ActionButton
                                        icon={Upload}
                                        label="Files"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedEvidence(evidence)
                                        }}
                                        variant="green"
                                        size="sm"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Component Modal Phân quyền/Giao nhiệm vụ
    const AssignModal = () => {
        const [selectedUsers, setSelectedUsers] = useState([])
        const [isSubmitting, setIsSubmitting] = useState(false)

        useEffect(() => {
            // Logic fetch users to prefill/search (mocked here)
            // Tạm thời để trống
        }, [])

        if (!showAssignModal || !assignTarget) return null

        const handleAssignment = async () => {
            if (selectedUsers.length === 0) {
                toast.error('Vui lòng chọn ít nhất một người được giao.')
                return
            }
            setIsSubmitting(true)

            try {
                const userIds = selectedUsers.map(u => u._id)
                const isTdg = assignReportType === 'tdg'
                const isStandard = assignReportType === 'standard'
                const isCriteria = assignReportType === 'criteria'

                // Logic lấy ID cho Task: Nếu là TĐG, lấy ID của TC/TCh đầu tiên để đại diện (hoặc cần endpoint tạo task chung)
                let standardId = isCriteria ? assignTarget.standardId : assignTarget.id
                let criteriaId = isCriteria ? assignTarget.id : (assignTarget.criteriaId || treeData[0]?.criteria[0]?.id || 'DUMMY_CRITERIA_ID')

                // Nếu là TĐG, dùng ID của TC/TCh đầu tiên làm dummy
                if (isTdg) {
                    const firstStandard = treeData[0]
                    const firstCriteria = firstStandard?.criteria[0]
                    if (!firstStandard || !firstCriteria) {
                        toast.error('Không thể tạo nhiệm vụ TĐG: Thiếu Tiêu chuẩn/Tiêu chí.')
                        setIsSubmitting(false)
                        return
                    }
                    standardId = firstStandard.id
                    criteriaId = firstCriteria.id
                }

                const taskData = {
                    description: `Nhiệm vụ viết báo cáo ${isTdg ? 'Tự đánh giá' : isStandard ? 'Tiêu chuẩn' : 'Tiêu chí'} cho ${assignTarget.code}`,
                    standardId: standardId,
                    criteriaId: criteriaId,
                    assignedTo: userIds,
                    reportType: assignReportType,
                    // dueDate: new Date().toISOString()
                }

                await apiMethods.tasks.create(taskData)

                toast.success(`Đã giao nhiệm vụ ${assignReportType.toUpperCase()} cho ${selectedUsers.length} người.`)
                setShowAssignModal(false)
                setAssignTarget(null)
                setSelectedUsers([])
                // Có thể reload tree hoặc chỉ thông báo thành công
            } catch (error) {
                console.error('Assignment error:', error)
                toast.error(error.response?.data?.message || 'Lỗi khi giao nhiệm vụ')
            } finally {
                setIsSubmitting(false)
            }
        }

        // Dữ liệu giả lập cho thanh tìm kiếm người dùng
        const availableUsers = [
            { _id: 'reporter1', fullName: 'Reporter 1 - Viết TĐG', email: 'r1@mail.com' },
            { _id: 'reporter2', fullName: 'Reporter 2 - Viết TC', email: 'r2@mail.com' },
            { _id: 'reporter3', fullName: 'Reporter 3 - Viết TCh', email: 'r3@mail.com' },
            { _id: 'reporter4', fullName: 'Manager A', email: 'm1@mail.com' },
        ]

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Giao nhiệm vụ: <span className="text-blue-600">{assignTarget.name} ({assignReportType.toUpperCase()})</span>
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Phân công Reporter viết báo cáo {assignReportType.toUpperCase()} cho: **{assignTarget.code}**
                    </p>

                    {/* Giả lập thanh tìm kiếm và chọn người dùng */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Tìm kiếm và chọn Reporter</label>
                        <div className="border p-4 rounded-xl min-h-32 bg-gray-50">
                            {availableUsers.map(user => (
                                <div key={user._id} className="flex items-center justify-between p-2 hover:bg-white rounded">
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.some(u => u._id === user._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedUsers([...selectedUsers, user])
                                                } else {
                                                    setSelectedUsers(selectedUsers.filter(u => u._id !== user._id))
                                                }
                                            }}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <span className="text-sm font-medium">{user.fullName}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-sm text-gray-600">Đã chọn: **{selectedUsers.length}** người</div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <button
                            onClick={() => {
                                setShowAssignModal(false)
                                setSelectedUsers([])
                            }}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAssignment}
                            disabled={isSubmitting || selectedUsers.length === 0}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium inline-flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Đang giao...
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5 mr-2" />
                                    Giao nhiệm vụ
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                            <FolderOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-1">Cây Minh Chứng</h1>
                            <p className="text-blue-100">Quản lý minh chứng theo chương trình, tổ chức, tiêu chuẩn và tiêu chí</p>
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

            {/* Program/Organization Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <BookOpen className="h-4 w-4 inline mr-1" />
                            Chương trình <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedProgram}
                            onChange={(e) => setSelectedProgram(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Chọn tổ chức</option>
                            {organizations.map(org => (
                                <option key={org._id} value={org._id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={fetchTreeData}
                            disabled={loading || !selectedProgram || !selectedOrganization}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                        >
                            <RefreshCw className={`h-5 w-5 mr-2 inline ${loading ? 'animate-spin' : ''}`} />
                            Tải lại
                        </button>
                    </div>
                </div>
            </div>

            {/* Thống kê và Thanh công cụ Import/Export/Expand */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-7 flex flex-col space-y-3">
                    <div className="flex justify-between items-center">
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
                        {canManageAll && (
                            <button
                                onClick={() => handleAssignClick('tdg', { id: selectedProgram, code: 'TĐG', name: 'Báo cáo Tự đánh giá' }, 'tdg')}
                                disabled={!selectedProgram || !selectedOrganization}
                                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                            >
                                <Shield className="h-5 w-5 mr-2" />
                                Phân quyền BC Tổng hợp
                            </button>
                        )}
                    </div>
                    {/* Thanh Import/Export */}
                    <div className="flex space-x-3 justify-end">
                        <button
                            onClick={downloadTemplate}
                            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                        >
                            <FileDown className="h-5 w-5 mr-2" />
                            File mẫu
                        </button>

                        <label className={`inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-medium ${
                            !selectedProgram || !selectedOrganization ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}>
                            <input
                                id="file-upload"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelectForImport}
                                disabled={!selectedProgram || !selectedOrganization}
                                className="hidden"
                            />
                            <Upload className="h-5 w-5 mr-2" />
                            Import
                        </label>

                        <button
                            onClick={handleExport}
                            disabled={!selectedProgram || !selectedOrganization}
                            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                        >
                            <Download className="h-5 w-5 mr-2" />
                            Export
                        </button>
                    </div>
                </div>
                {/* Statistics Card (1 trong 4 ô của trang chính) */}
                <div className="col-span-12 lg:col-span-5">
                    <StatisticsCard statistics={statistics} />
                </div>
            </div>

            {/* Evidence Tree & File Management (Phần dưới) */}
            <div className="grid grid-cols-12 gap-6">
                <div className={`${selectedEvidence ? 'col-span-12 lg:col-span-7' : 'col-span-12'} bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-500`}>
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-16">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Đang tải...</p>
                        </div>
                    ) : !selectedProgram || !selectedOrganization ? (
                        <div className="p-16 text-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Folder className="h-10 w-10 text-blue-600" />
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
                        <div className="p-6">
                            {treeData.map((standard, stdIdx) => (
                                <StandardNode key={standard.id} standard={standard} stdIdx={stdIdx} />
                            ))}
                        </div>
                    )}
                </div>

                {selectedEvidence && (
                    <div className="col-span-12 lg:col-span-5">
                        <FileManagement
                            evidence={selectedEvidence}
                            onClose={() => setSelectedEvidence(null)}
                            onUpdate={fetchTreeData}
                        />
                    </div>
                )}
            </div>

            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    {/* ... (Modal Import giữ nguyên logic và style) ... */}
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
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium inline-flex items-center justify-center"
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
            {/* Modal Phân quyền */}
            <AssignModal />
        </div>
    )
}