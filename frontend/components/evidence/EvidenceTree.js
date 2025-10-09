import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import {
    ChevronDown,
    ChevronRight,
    FileText,
    Folder,
    FolderOpen,
    Search,
    Download,
    Eye,
    RefreshCw,
    BookOpen,
    Building2,
    Loader2,
    ArrowLeft,
    Maximize2,
    Minimize2,
    Upload,
    FileDown
} from 'lucide-react'

export default function EvidenceTree() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [treeData, setTreeData] = useState({})
    const [expandedNodes, setExpandedNodes] = useState({})
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedOrganization, setSelectedOrganization] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [importing, setImporting] = useState(false)

    useEffect(() => {
        fetchPrograms()
        fetchOrganizations()
    }, [])

    useEffect(() => {
        if (selectedProgram && selectedOrganization) {
            fetchTreeData()
        }
    }, [selectedProgram, selectedOrganization])

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
            const response = await apiMethods.evidences.getTree(
                selectedProgram,
                selectedOrganization
            )
            setTreeData(response.data.data.tree || response.data.data || {})
        } catch (error) {
            console.error('Fetch tree data error:', error)
            toast.error('Lỗi khi tải cây minh chứng')
            setTreeData({})
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
        Object.keys(treeData).forEach(standardKey => {
            allNodes[standardKey] = true
            if (treeData[standardKey]?.criteria) {
                Object.keys(treeData[standardKey].criteria).forEach(criteriaKey => {
                    allNodes[`${standardKey}-${criteriaKey}`] = true
                })
            }
        })
        setExpandedNodes(allNodes)
    }

    const collapseAll = () => {
        setExpandedNodes({})
    }

    const handleViewEvidence = (evidenceId) => {
        router.push(`/evidence-management?view=${evidenceId}`)
    }

    const downloadTemplate = () => {
        // Tạo template Excel mẫu
        const templateData = [
            ['TT', 'Mã minh chứng', 'Tên minh chứng'],
            ['1', 'Tiêu chuẩn 1: Mục tiêu và chuẩn đầu ra của chương trình', ''],
            ['Tiêu chí 1.1: Mục tiêu của CTĐT được xác định rõ ràng, phù hợp với sứ mạng của trường', '', ''],
            ['1', 'H1.01.01.01', 'Quyết định công bố tầm nhìn sứ mạng, giá trị cốt lõi'],
            ['2', 'H1.01.01.02', 'Quyết định thành lập nhóm nghiên cứu mạnh, tinh hoa, xuất sắc'],
            ['3', 'H1.01.01.03', 'Bảng thống kê diện tích sân xây dựng HV, Giảng đường - CSVC'],
            ['4', 'H1.01.01.04', 'Bảng thống kê các phòng thí nghiệm nghiên cứu chuyên sâu - phòng thí nghiệm trung tâm của Học viện'],
            ['5', 'H1.01.01.05', 'Quyết định công bố quy chế tuyển sinh WB'],
            ['6', 'H1.01.01.06', 'Quy hoạch tổng thể ngành nông nghiệp đến năm 2020 và tầm nhìn 2030'],
            ['7', 'H1.01.01.07', 'Kế hoạch xây dựng tầm nhìn sứ mạng'],
            ['8', 'H1.01.01.08', 'Phiếu lấy ý kiến các bên về xây dựng tầm nhìn sứ mạng'],
            ['9', 'H1.01.01.09', 'Các tài liệu phát cho sinh viên, các tờ giới thiệu TTV'],
            ['10', 'H1.01.01.10', 'Kế hoạch nhiệm kỳ (trong đó có các hoạt động thực hiện tầm nhìn sứ mạng), kế hoạch hàng năm'],
            ['Tiêu chí 1.2: CĐR của CTĐT được xác định rõ ràng, bao quát được cả về kiến thức, kỹ năng và thái độ', '', ''],
            ['11', 'H1.01.02.01', 'Quyết định công bố tầm nhìn sứ mạng, giá trị cốt lõi'],
            ['12', 'H1.01.02.02', 'Chương trình theo cấu trúc được tổ chức duyệt truyền'],
            ['', 'Tiêu chuẩn 2: Chương trình đào tạo', ''],
            ['Tiêu chí 2.1: Cấu trúc chương trình đáp ứng chuẩn đầu ra', '', ''],
            ['1', 'H1.02.01.01', 'Quyết định ban hành chương trình đào tạo'],
            ['2', 'H1.02.01.02', 'Ma trận kiến thức, kỹ năng theo chuẩn đầu ra'],
            ['3', 'H1.02.01.03', 'Đề cương chi tiết các học phần'],
            ['', 'Tiêu chuẩn 3: Đội ngũ giảng viên', ''],
            ['Tiêu chí 3.1: Đội ngũ giảng viên đáp ứng yêu cầu', '', ''],
            ['1', 'H1.03.01.01', 'Danh sách giảng viên cơ hữu'],
            ['2', 'H1.03.01.02', 'Bằng cấp và chứng chỉ của giảng viên']
        ]

        let csvContent = '\uFEFF' // UTF-8 BOM
        templateData.forEach(row => {
            csvContent += row.join(',') + '\n'
        })

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'template-cay-minh-chung.csv')
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        toast.success('Đã tải template mẫu')
    }

    const handleImport = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!selectedProgram || !selectedOrganization) {
            toast.error('Vui lòng chọn Chương trình và Tổ chức trước khi import')
            return
        }

        try {
            setImporting(true)

            // Đọc file
            const text = await file.text()
            const lines = text.split('\n').filter(line => line.trim())

            if (lines.length < 2) {
                toast.error('File không đúng định dạng')
                return
            }

            // Parse dữ liệu
            const evidencesToImport = []
            let currentStandard = ''
            let currentCriteria = ''

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim()
                if (!line) continue

                // Parse CSV line (handle quotes and commas)
                const columns = []
                let currentCol = ''
                let inQuotes = false

                for (let j = 0; j < line.length; j++) {
                    const char = line[j]
                    if (char === '"') {
                        inQuotes = !inQuotes
                    } else if (char === ',' && !inQuotes) {
                        columns.push(currentCol.trim())
                        currentCol = ''
                    } else {
                        currentCol += char
                    }
                }
                columns.push(currentCol.trim())

                const [tt, code, name] = columns

                // Dòng tiêu chuẩn: Cột A có số (như "1"), Cột B bắt đầu "Tiêu chuẩn", Cột C trống
                if (tt && !isNaN(tt) && code && code.startsWith('Tiêu chuẩn') && !name) {
                    currentStandard = code
                    currentCriteria = ''
                    continue
                }

                // Dòng tiêu chí: Cột A trống hoặc là text "Tiêu chí", Cột B có "Tiêu chí"
                if (code && code.startsWith('Tiêu chí')) {
                    currentCriteria = code
                    continue
                }

                // Dòng minh chứng: Có TT là số, có code dạng H1.xx.xx.xx, có tên
                if (tt && !isNaN(tt) && code && name && currentStandard && currentCriteria) {
                    // Kiểm tra code có dạng minh chứng (VD: H1.01.01.01)
                    if (code.match(/^H\d+\.\d+\.\d+\.\d+$/)) {
                        evidencesToImport.push({
                            code: code,
                            name: name,
                            standard: currentStandard,
                            criteria: currentCriteria,
                            programId: selectedProgram,
                            organizationId: selectedOrganization
                        })
                    }
                }
            }

            if (evidencesToImport.length === 0) {
                toast.error('Không tìm thấy minh chứng nào trong file')
                return
            }

            // Gọi API import
            await apiMethods.evidences.importFromFile({
                evidences: evidencesToImport,
                programId: selectedProgram,
                organizationId: selectedOrganization
            })

            toast.success(`Import thành công ${evidencesToImport.length} minh chứng`)
            fetchTreeData() // Refresh data

        } catch (error) {
            console.error('Import error:', error)
            toast.error('Lỗi khi import dữ liệu: ' + (error.message || 'Unknown error'))
        } finally {
            setImporting(false)
            event.target.value = '' // Reset input
        }
    }

    const handleExport = async () => {
        try {
            const response = await apiMethods.evidences.exportData({
                programId: selectedProgram,
                organizationId: selectedOrganization,
                format: 'xlsx'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `evidence-tree-${Date.now()}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('Export thành công')
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Lỗi khi export dữ liệu')
        }
    }

    const filterTree = (tree) => {
        if (!searchTerm) return tree

        const filtered = {}
        Object.keys(tree).forEach(standardKey => {
            const standard = tree[standardKey]
            const filteredCriteria = {}

            if (standard?.criteria) {
                Object.keys(standard.criteria).forEach(criteriaKey => {
                    const criteria = standard.criteria[criteriaKey]
                    if (criteria?.evidences) {
                        const filteredEvidences = criteria.evidences.filter(evidence =>
                            evidence.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            evidence.code?.toLowerCase().includes(searchTerm.toLowerCase())
                        )

                        if (filteredEvidences.length > 0) {
                            filteredCriteria[criteriaKey] = {
                                ...criteria,
                                evidences: filteredEvidences
                            }
                        }
                    }
                })
            }

            if (Object.keys(filteredCriteria).length > 0) {
                filtered[standardKey] = {
                    ...standard,
                    criteria: filteredCriteria
                }
            }
        })

        return filtered
    }

    const filteredTreeData = filterTree(treeData)

    const totalStandards = Object.keys(filteredTreeData).length
    const totalCriteria = Object.values(filteredTreeData).reduce((acc, std) =>
        acc + (std?.criteria ? Object.keys(std.criteria).length : 0), 0
    )
    const totalEvidences = Object.values(filteredTreeData).reduce((acc, std) =>
            acc + (std?.criteria ? Object.values(std.criteria).reduce((acc2, crit) =>
                acc2 + (crit?.evidences?.length || 0), 0
            ) : 0), 0
    )

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
                            <p className="text-indigo-100">Cấu trúc phân cấp minh chứng theo tiêu chuẩn và tiêu chí</p>
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Search className="h-4 w-4 inline mr-1" />
                            Tìm kiếm
                        </label>
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc mã..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={fetchTreeData}
                            disabled={loading || !selectedProgram || !selectedOrganization}
                            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center transition-all font-medium"
                        >
                            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Tải lại
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                    <button
                        onClick={expandAll}
                        disabled={Object.keys(filteredTreeData).length === 0}
                        className="inline-flex items-center px-4 py-2.5 text-sm border-2 border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Mở rộng tất cả
                    </button>
                    <button
                        onClick={collapseAll}
                        disabled={Object.keys(filteredTreeData).length === 0}
                        className="inline-flex items-center px-4 py-2.5 text-sm border-2 border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                        <Minimize2 className="h-4 w-4 mr-2" />
                        Thu gọn tất cả
                    </button>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={downloadTemplate}
                        className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                        <FileDown className="h-5 w-5 mr-2" />
                        Tải file mẫu
                    </button>

                    <label className={`inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-medium ${
                        importing || !selectedProgram || !selectedOrganization ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}>
                        <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleImport}
                            disabled={importing || !selectedProgram || !selectedOrganization}
                            className="hidden"
                        />
                        {importing ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Đang import...
                            </>
                        ) : (
                            <>
                                <Upload className="h-5 w-5 mr-2" />
                                Import Excel
                            </>
                        )}
                    </label>

                    <button
                        onClick={handleExport}
                        disabled={!selectedProgram || !selectedOrganization}
                        className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Tree View */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-gray-600 font-medium">Đang tải cây minh chứng...</p>
                    </div>
                ) : !selectedProgram || !selectedOrganization ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Folder className="h-10 w-10 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa chọn dữ liệu</h3>
                        <p className="text-gray-500">Vui lòng chọn Chương trình và Tổ chức để xem cây minh chứng</p>
                    </div>
                ) : Object.keys(filteredTreeData).length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Folder className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm ? 'Không tìm thấy minh chứng phù hợp' : 'Chưa có minh chứng nào'}
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Tạo minh chứng mới để bắt đầu'}
                        </p>
                    </div>
                ) : (
                    <div className="p-6">
                        {Object.keys(filteredTreeData).map(standardKey => {
                            const standard = filteredTreeData[standardKey]
                            const isStandardExpanded = expandedNodes[standardKey]

                            return (
                                <div key={standardKey} className="mb-4">
                                    <div
                                        className="flex items-center space-x-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-2 border-indigo-200 rounded-xl cursor-pointer transition-all group"
                                        onClick={() => toggleNode(standardKey)}
                                    >
                                        {isStandardExpanded ? (
                                            <ChevronDown className="h-5 w-5 text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                        )}
                                        {isStandardExpanded ? (
                                            <FolderOpen className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                                        ) : (
                                            <Folder className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="font-semibold text-gray-900">{standardKey}</span>
                                            <span className="px-3 py-1 bg-white border border-indigo-200 rounded-full text-sm font-medium text-indigo-700">
                                                {standard?.criteria ? Object.keys(standard.criteria).length : 0} tiêu chí
                                            </span>
                                        </div>
                                    </div>

                                    {isStandardExpanded && standard?.criteria && (
                                        <div className="ml-8 mt-3 space-y-3">
                                            {Object.keys(standard.criteria).map(criteriaKey => {
                                                const criteria = standard.criteria[criteriaKey]
                                                const criteriaNodeKey = `${standardKey}-${criteriaKey}`
                                                const isCriteriaExpanded = expandedNodes[criteriaNodeKey]

                                                return (
                                                    <div key={criteriaKey}>
                                                        <div
                                                            className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 rounded-xl cursor-pointer transition-all group"
                                                            onClick={() => toggleNode(criteriaNodeKey)}
                                                        >
                                                            {isCriteriaExpanded ? (
                                                                <ChevronDown className="h-4 w-4 text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                                            )}
                                                            {isCriteriaExpanded ? (
                                                                <FolderOpen className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                            ) : (
                                                                <Folder className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                            )}
                                                            <div className="flex-1 flex items-center justify-between">
                                                                <span className="font-medium text-gray-900">{criteriaKey}</span>
                                                                <span className="px-2.5 py-1 bg-white border border-green-200 rounded-full text-xs font-medium text-green-700">
                                                                    {criteria?.evidences?.length || 0} minh chứng
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isCriteriaExpanded && criteria?.evidences && (
                                                            <div className="ml-8 mt-2 space-y-2">
                                                                {criteria.evidences.map(evidence => (
                                                                    <div
                                                                        key={evidence._id}
                                                                        className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl group transition-all"
                                                                    >
                                                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                                <FileText className="h-5 w-5 text-blue-600" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center space-x-2 mb-1">
                                                                                    <span className="text-sm font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                                                        {evidence.code}
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
                                                                        <button
                                                                            onClick={() => handleViewEvidence(evidence._id)}
                                                                            className="opacity-0 group-hover:opacity-100 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex-shrink-0"
                                                                            title="Xem chi tiết"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </button>
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

            {/* Summary */}
            {!loading && Object.keys(filteredTreeData).length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Folder className="h-8 w-8 text-indigo-600" />
                            </div>
                            <div className="text-3xl font-bold text-indigo-900 mb-1">{totalStandards}</div>
                            <div className="text-sm text-indigo-700 font-medium">Tiêu chuẩn</div>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <FolderOpen className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="text-3xl font-bold text-green-900 mb-1">{totalCriteria}</div>
                            <div className="text-sm text-green-700 font-medium">Tiêu chí</div>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-blue-900 mb-1">{totalEvidences}</div>
                            <div className="text-sm text-blue-700 font-medium">Minh chứng</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}