import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { apiMethods } from '../../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
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
    FileDown,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react'

// =========================================================
// THÊM: HOOK GIẢ ĐỊNH useAuth
// BẠN PHẢI THAY THẾ HOOK NÀY BẰNG HOOK AUTH THỰC TẾ CỦA BẠN
// (Nơi lưu trữ thông tin người dùng và ID của họ)
// =========================================================
const useAuth = () => {
    // Trong ứng dụng thực tế, bạn sẽ dùng useContext(AuthContext)
    // Giả định người dùng đăng nhập và có ID hợp lệ
    const user = {
        id: '60c72b2f9a941a0015b6d5f7', // ObjectId hợp lệ giả định
        isLoggedIn: true
    };
    return user;
};
// =========================================================


export default function EvidenceTree() {
    const router = useRouter()
    const user = useAuth(); // Lấy thông tin người dùng

    const [loading, setLoading] = useState(true)
    const [treeData, setTreeData] = useState([])
    const [expandedNodes, setExpandedNodes] = useState({})
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedOrganization, setSelectedOrganization] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [importing, setImporting] = useState(false)
    const [importMode, setImportMode] = useState('create')
    const [showImportModal, setShowImportModal] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [statistics, setStatistics] = useState(null)

    // =========================================================
    // THAY THẾ: Lấy academicYearId và userId từ nguồn thực tế
    // =========================================================
    // Giả định academicYearId được truyền qua query params.
    const academicYearId = router.query.academicYearId || '60c72b2f9a941a0015b6d5f6'; // ObjectId hợp lệ giả định
    const userId = user.id; // Lấy ID người dùng từ hook auth
    // =========================================================

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
                // Đảm bảo ID được chọn là một ObjectId hợp lệ (vì nó đến từ DB)
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
                // Đảm bảo ID được chọn là một ObjectId hợp lệ (vì nó đến từ DB)
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

            // Validate trước khi gọi API
            if (!selectedProgram || !selectedOrganization) {
                console.warn('Missing programId or organizationId')
                setTreeData([])
                setLoading(false)
                return
            }

            console.log('Fetching tree with:', {
                programId: selectedProgram,
                organizationId: selectedOrganization
            })

            const response = await apiMethods.evidences.getFullTree(
                selectedProgram,
                selectedOrganization
            )

            console.log('Tree response:', response.data)

            setTreeData(response.data.data.tree || [])
            setStatistics(response.data.data.statistics || null)
        } catch (error) {
            console.error('Fetch tree data error:', error)
            console.error('Error response:', error.response?.data)

            const errorMessage = error.response?.data?.message
                || error.response?.data?.errors?.[0]?.msg
                || 'Lỗi khi tải cây minh chứng'

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

    const handleViewEvidence = (evidenceId) => {
        router.push(`/evidence-management?view=${evidenceId}`)
    }

    const downloadTemplate = () => {
        // Tạo template Excel với định dạng đúng
        const templateData = [
            ['STT', 'Mã', 'Tên minh chứng'],
            ['', '1', 'Tiêu chuẩn 1: Mục tiêu và chuẩn đầu ra của chương trình'],
            ['', '1.1', 'Tiêu chí 1.1: Mục tiêu của CTĐT được xác định rõ ràng'],
            ['1', 'H1.01.01.01', 'Quyết định công bố tầm nhìn sứ mạng, giá trị cốt lõi'],
            ['2', 'H1.01.01.02', 'Quyết định thành lập nhóm nghiên cứu mạnh, tinh hoa, xuất sắc'],
            ['3', 'H1.01.01.03', 'Bảng thống kê diện tích sân xây dựng HV'],
            ['', '1.2', 'Tiêu chí 1.2: CĐR của CTĐT được xác định rõ ràng'],
            ['4', 'H1.01.02.01', 'Quyết định công bố chuẩn đầu ra'],
            ['5', 'H1.01.02.02', 'Ma trận kiến thức kỹ năng'],
            ['', '2', 'Tiêu chuẩn 2: Chương trình đào tạo'],
            ['', '2.1', 'Tiêu chí 2.1: Cấu trúc chương trình đáp ứng chuẩn đầu ra'],
            ['6', 'H1.02.01.01', 'Quyết định ban hành chương trình đào tạo'],
            ['7', 'H1.02.01.02', 'Ma trận kiến thức, kỹ năng theo chuẩn đầu ra'],
            ['', '3', 'Tiêu chuẩn 3: Đội ngũ giảng viên'],
            ['', '3.1', 'Tiêu chí 3.1: Đội ngũ giảng viên đáp ứng yêu cầu'],
            ['8', 'H1.03.01.01', 'Danh sách giảng viên cơ hữu'],
            ['9', 'H1.03.01.02', 'Bằng cấp và chứng chỉ của giảng viên'],
        ]

        // Tạo worksheet
        const ws = XLSX.utils.aoa_to_sheet(templateData)

        // Set độ rộng cột
        ws['!cols'] = [
            { wch: 5 },  // STT
            { wch: 15 }, // Mã
            { wch: 70 }  // Tên minh chứng
        ]

        // Style cho header row (optional, nhưng giúp dễ nhìn)
        const headerRange = XLSX.utils.decode_range(ws['!ref'])
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1"
            if (!ws[address]) continue
            ws[address].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "4F81BD" } }
            }
        }

        // Tạo workbook
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Minh chứng')

        // Download file
        XLSX.writeFile(wb, 'template-import-minh-chung.xlsx')

        toast.success('Đã tải file mẫu Excel')
    }

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        // BƯỚC 2: Đảm bảo các ID hợp lệ đã được chọn
        if (!selectedProgram || !selectedOrganization) {
            toast.error('Vui lòng chọn Chương trình và Tổ chức trước')
            event.target.value = ''
            return
        }

        // Kiểm tra hai biến quan trọng mà backend cần
        if (!academicYearId || !userId) {
            toast.error('Không tìm thấy ID Năm học hoặc ID Người dùng. Vui lòng kiểm tra cấu hình.')
            event.target.value = ''
            return
        }

        setSelectedFile(file)
        setShowImportModal(true)
    }

    const handleImport = async () => {
        if (!selectedFile) return

        // Kiểm tra lần cuối các ID quan trọng
        if (!selectedProgram || !selectedOrganization || !academicYearId || !userId) {
            toast.error('Thiếu thông tin Chương trình, Tổ chức, Năm học hoặc Người dùng. Không thể import.')
            setShowImportModal(false)
            return
        }

        try {
            setImporting(true)

            // 1. Tạo FormData để gửi file và tất cả metadata
            const formData = new FormData()
            formData.append('file', selectedFile)

            // 2. Thêm các tham số BẮT BUỘC vào FormData
            // Đảm bảo các giá trị này là ObjectId hợp lệ để tránh lỗi 400 (CastError)
            formData.append('programId', selectedProgram)
            formData.append('organizationId', selectedOrganization)
            formData.append('mode', importMode)

            // BƯỚC 1: Thêm academicYearId và userId (được giả định là ObjectId hợp lệ)
            formData.append('academicYearId', academicYearId)
            formData.append('userId', userId)

            // Gọi API với FormData
            const response = await apiMethods.evidences.import(formData);


            if (response.data.success) {
                // SỬA LỖI: Xử lý errors an toàn và THÊM LỌC SỐ LƯỢNG LỖI TẠO MỚI
                const { created, updated } = response.data.data.data || response.data.data;
                const errors = response.data.data.details?.errors || [];

                // Lấy thông báo từ backend (chứa tổng số lượng tạo/cập nhật)
                let message = response.data.message || `Import hoàn tất! (Lỗi: ${errors.length})\n`

                if (errors.length > 0) {
                    // Nếu có lỗi, chỉ hiển thị thông báo lỗi và yêu cầu kiểm tra log
                    message += `\n- Tồn tại ${errors.length} lỗi (Xem chi tiết trong log server)`
                    toast.error(message, { duration: 8000 });
                } else {
                    // Nếu KHÔNG có lỗi, hiển thị thông báo thành công chi tiết
                    toast.success(message, { duration: 6000 });
                }

                // QUAN TRỌNG: Tải lại dữ liệu để cập nhật cây minh chứng
                fetchTreeData();
            } else {
                toast.error(response.data.message || 'Import thất bại')
            }

        } catch (error) {
            console.error('Import error:', error.response?.data || error);
            // Lỗi 400 thường chứa thông báo chi tiết từ backend
            const errorMessage = error.response?.data?.message || error.message;
            toast.error('Lỗi khi import: ' + errorMessage)
        } finally {
            setImporting(false)
            setShowImportModal(false)
            setSelectedFile(null)
            // Reset file input
            const fileInput = document.getElementById('file-upload')
            if (fileInput) fileInput.value = ''
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
            link.setAttribute('download', `cay-minh-chung-${Date.now()}.xlsx`)
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

        return tree.map(standard => {
            const filteredCriteria = standard.criteria?.map(criteria => {
                const filteredEvidences = criteria.evidences?.filter(evidence =>
                    evidence.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    evidence.code?.toLowerCase().includes(searchTerm.toLowerCase())
                ) || []

                return {
                    ...criteria,
                    evidences: filteredEvidences
                }
            }).filter(c => c.evidences.length > 0) || []

            return {
                ...standard,
                criteria: filteredCriteria
            }
        }).filter(s => s.criteria.length > 0)
    }

    const filteredTreeData = searchTerm ? filterTree(treeData) : treeData

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

                    {/* Hiển thị ID năm học (giả định) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FileText className="h-4 w-4 inline mr-1" />
                            ID Năm học
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl truncate">
                            {academicYearId || 'Đang tải...'}
                        </div>
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
                        disabled={filteredTreeData.length === 0}
                        className="inline-flex items-center px-4 py-2.5 text-sm border-2 border-gray-200 bg-white rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Mở rộng tất cả
                    </button>
                    <button
                        onClick={collapseAll}
                        disabled={filteredTreeData.length === 0}
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
                        !selectedProgram || !selectedOrganization ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            disabled={!selectedProgram || !selectedOrganization}
                            className="hidden"
                        />
                        <Upload className="h-5 w-5 mr-2" />
                        Import Excel
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

            {/* Statistics */}
            {statistics && !searchTerm && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-900">{statistics.totalStandards}</div>
                            <div className="text-sm text-indigo-700">Tổng tiêu chuẩn</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-900">{statistics.standardsWithEvidence}</div>
                            <div className="text-sm text-green-700">TC có minh chứng</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-900">{statistics.totalCriteria}</div>
                            <div className="text-sm text-blue-700">Tổng tiêu chí</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-900">{statistics.criteriaWithEvidence}</div>
                            <div className="text-sm text-emerald-700">TC có minh chứng</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-900">{statistics.totalEvidences}</div>
                            <div className="text-sm text-purple-700">Tổng minh chứng</div>
                        </div>
                    </div>
                </div>
            )}

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
                ) : filteredTreeData.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Folder className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchTerm ? 'Không tìm thấy minh chứng phù hợp' : 'Chưa có dữ liệu'}
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Vui lòng kiểm tra lại dữ liệu'}
                        </p>
                    </div>
                ) : (
                    <div className="p-6">
                        {filteredTreeData.map((standard, stdIdx) => {
                            const isStandardExpanded = expandedNodes[`std-${stdIdx}`]
                            const hasEvidence = standard.hasEvidence

                            return (
                                <div key={standard.id} className="mb-4">
                                    <div
                                        className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all group ${
                                            hasEvidence
                                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-300'
                                                : 'bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-red-300'
                                        }`}
                                        onClick={() => toggleNode(`std-${stdIdx}`)}
                                    >
                                        {/* Status indicator */}
                                        <div className="flex-shrink-0">
                                            {hasEvidence ? (
                                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                            ) : (
                                                <XCircle className="h-6 w-6 text-red-600" />
                                            )}
                                        </div>

                                        {/* Expand/Collapse icon */}
                                        {isStandardExpanded ? (
                                            <ChevronDown className={`h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform ${
                                                hasEvidence ? 'text-green-600' : 'text-red-600'
                                            }`} />
                                        ) : (
                                            <ChevronRight className={`h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform ${
                                                hasEvidence ? 'text-green-600' : 'text-red-600'
                                            }`} />
                                        )}

                                        {/* Folder icon */}
                                        {isStandardExpanded ? (
                                            <FolderOpen className={`h-6 w-6 flex-shrink-0 ${
                                                hasEvidence ? 'text-green-600' : 'text-red-600'
                                            }`} />
                                        ) : (
                                            <Folder className={`h-6 w-6 flex-shrink-0 ${
                                                hasEvidence ? 'text-green-600' : 'text-red-600'
                                            }`} />
                                        )}

                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="font-semibold text-gray-900">
                                                Tiêu chuẩn {standard.code}: {standard.name}
                                            </span>
                                            <span className={`px-3 py-1 bg-white rounded-full text-sm font-medium ${
                                                hasEvidence ? 'border border-green-300 text-green-700' : 'border border-red-300 text-red-700'
                                            }`}>
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
                                                    <div key={criteria.id}>
                                                        <div
                                                            className={`flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all group ${
                                                                criteriaHasEvidence
                                                                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-300'
                                                                    : 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-300'
                                                            }`}
                                                            onClick={() => toggleNode(criteriaNodeKey)}
                                                        >
                                                            {/* Status indicator */}
                                                            <div className="flex-shrink-0">
                                                                {criteriaHasEvidence ? (
                                                                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                                                ) : (
                                                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                                                )}
                                                            </div>

                                                            {/* Expand/Collapse icon */}
                                                            {isCriteriaExpanded ? (
                                                                <ChevronDown className={`h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform ${
                                                                    criteriaHasEvidence ? 'text-blue-600' : 'text-orange-600'
                                                                }`} />
                                                            ) : (
                                                                <ChevronRight className={`h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform ${
                                                                    criteriaHasEvidence ? 'text-blue-600' : 'text-orange-600'
                                                                }`} />
                                                            )}

                                                            {/* Folder icon */}
                                                            {isCriteriaExpanded ? (
                                                                <FolderOpen className={`h-5 w-5 flex-shrink-0 ${
                                                                    criteriaHasEvidence ? 'text-blue-600' : 'text-orange-600'
                                                                }`} />
                                                            ) : (
                                                                <Folder className={`h-5 w-5 flex-shrink-0 ${
                                                                    criteriaHasEvidence ? 'text-blue-600' : 'text-orange-600'
                                                                }`} />
                                                            )}

                                                            <div className="flex-1 flex items-center justify-between">
                                                                <span className="font-medium text-gray-900">
                                                                    Tiêu chí {standard.code}.{criteria.code}: {criteria.name}
                                                                </span>
                                                                <span className={`px-2.5 py-1 bg-white rounded-full text-xs font-medium ${
                                                                    criteriaHasEvidence ? 'border border-blue-300 text-blue-700' : 'border border-orange-300 text-orange-700'
                                                                }`}>
                                                                    {criteria.evidences?.length || 0} minh chứng
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isCriteriaExpanded && criteria.evidences && criteria.evidences.length > 0 && (
                                                            <div className="ml-8 mt-2 space-y-2">
                                                                {criteria.evidences.map(evidence => (
                                                                    <div
                                                                        key={evidence.id}
                                                                        className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl group transition-all"
                                                                    >
                                                                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                                            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                                <FileText className="h-5 w-5 text-indigo-600" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center space-x-2 mb-1">
                                                                                    <span className="text-sm font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
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
                                                                            onClick={() => handleViewEvidence(evidence.id)}
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

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Chọn chế độ import</h3>

                        <div className="space-y-3 mb-6">
                            <label className="flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
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
                                    <div className="text-sm text-gray-600">Chỉ tạo các minh chứng mới, bỏ qua mã đã tồn tại</div>
                                </div>
                            </label>

                            <label className="flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
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
                                    <div className="text-sm text-gray-600">Cập nhật minh chứng đã tồn tại, tạo mới nếu chưa có</div>
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
        </div>
    )
}