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
    Building2
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
            const response = await apiMethods.organizations.getAll()
            setOrganizations(response.data.data.organizations || [])
            if (response.data.data.organizations?.length > 0) {
                setSelectedOrganization(response.data.data.organizations[0]._id)
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
            setTreeData(response.data.data.tree || {})
        } catch (error) {
            console.error('Fetch tree data error:', error)
            toast.error('Lỗi khi tải cây minh chứng')
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
            Object.keys(treeData[standardKey].criteria).forEach(criteriaKey => {
                allNodes[`${standardKey}-${criteriaKey}`] = true
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

    const handleExport = async () => {
        try {
            const response = await apiMethods.evidences.export({
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

            Object.keys(standard.criteria).forEach(criteriaKey => {
                const criteria = standard.criteria[criteriaKey]
                const filteredEvidences = criteria.evidences.filter(evidence =>
                    evidence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    evidence.code.toLowerCase().includes(searchTerm.toLowerCase())
                )

                if (filteredEvidences.length > 0) {
                    filteredCriteria[criteriaKey] = {
                        ...criteria,
                        evidences: filteredEvidences
                    }
                }
            })

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

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <BookOpen className="h-4 w-4 inline mr-1" />
                            Chương trình
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
                            Tổ chức
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-end space-x-2">
                        <button
                            onClick={fetchTreeData}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 inline-flex items-center justify-center"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Tải lại
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                    <button
                        onClick={expandAll}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Mở rộng tất cả
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Thu gọn tất cả
                    </button>
                </div>

                <button
                    onClick={handleExport}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                </button>
            </div>

            {/* Tree View */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600">Đang tải cây minh chứng...</p>
                    </div>
                ) : Object.keys(filteredTreeData).length === 0 ? (
                    <div className="p-12 text-center">
                        <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                            {searchTerm ? 'Không tìm thấy minh chứng phù hợp' : 'Chưa có minh chứng nào'}
                        </p>
                    </div>
                ) : (
                    <div className="p-4">
                        {Object.keys(filteredTreeData).map(standardKey => {
                            const standard = filteredTreeData[standardKey]
                            const isStandardExpanded = expandedNodes[standardKey]

                            return (
                                <div key={standardKey} className="mb-4">
                                    {/* Standard Level */}
                                    <div
                                        className="flex items-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                                        onClick={() => toggleNode(standardKey)}
                                    >
                                        {isStandardExpanded ? (
                                            <ChevronDown className="h-5 w-5 text-blue-600" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-blue-600" />
                                        )}
                                        {isStandardExpanded ? (
                                            <FolderOpen className="h-5 w-5 text-blue-600" />
                                        ) : (
                                            <Folder className="h-5 w-5 text-blue-600" />
                                        )}
                                        <span className="font-semibold text-gray-900">
                                            {standardKey}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            ({Object.keys(standard.criteria).length} tiêu chí)
                                        </span>
                                    </div>

                                    {/* Criteria Level */}
                                    {isStandardExpanded && (
                                        <div className="ml-8 mt-2 space-y-2">
                                            {Object.keys(standard.criteria).map(criteriaKey => {
                                                const criteria = standard.criteria[criteriaKey]
                                                const criteriaNodeKey = `${standardKey}-${criteriaKey}`
                                                const isCriteriaExpanded = expandedNodes[criteriaNodeKey]

                                                return (
                                                    <div key={criteriaKey}>
                                                        {/* Criteria Node */}
                                                        <div
                                                            className="flex items-center space-x-2 p-2 bg-green-50 hover:bg-green-100 rounded-lg cursor-pointer transition-colors"
                                                            onClick={() => toggleNode(criteriaNodeKey)}
                                                        >
                                                            {isCriteriaExpanded ? (
                                                                <ChevronDown className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 text-green-600" />
                                                            )}
                                                            {isCriteriaExpanded ? (
                                                                <FolderOpen className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <Folder className="h-4 w-4 text-green-600" />
                                                            )}
                                                            <span className="font-medium text-gray-900">
                                                                {criteriaKey}
                                                            </span>
                                                            <span className="text-sm text-gray-500">
                                                                ({criteria.evidences.length} minh chứng)
                                                            </span>
                                                        </div>

                                                        {/* Evidence Level */}
                                                        {isCriteriaExpanded && (
                                                            <div className="ml-8 mt-2 space-y-1">
                                                                {criteria.evidences.map(evidence => (
                                                                    <div
                                                                        key={evidence._id}
                                                                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
                                                                    >
                                                                        <div className="flex items-center space-x-2 flex-1">
                                                                            <FileText className="h-4 w-4 text-gray-400" />
                                                                            <span className="text-sm text-gray-700 font-mono">
                                                                                {evidence.code}
                                                                            </span>
                                                                            <span className="text-sm text-gray-900">
                                                                                {evidence.name}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                ({evidence.fileCount} files)
                                                                            </span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleViewEvidence(evidence._id)}
                                                                            className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
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
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                            Tổng số: <strong>{Object.keys(filteredTreeData).length}</strong> tiêu chuẩn,
                            <strong className="ml-1">
                                {Object.values(filteredTreeData).reduce((acc, std) =>
                                    acc + Object.keys(std.criteria).length, 0
                                )}
                            </strong> tiêu chí,
                            <strong className="ml-1">
                                {Object.values(filteredTreeData).reduce((acc, std) =>
                                        acc + Object.values(std.criteria).reduce((acc2, crit) =>
                                            acc2 + crit.evidences.length, 0
                                        ), 0
                                )}
                            </strong> minh chứng
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}