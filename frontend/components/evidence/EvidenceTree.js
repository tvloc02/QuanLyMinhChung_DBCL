import { useState, useEffect } from 'react'
import {
    ChevronRight,
    ChevronDown,
    FolderTree,
    Folder,
    File,
    Download,
    Eye,
    Search
} from 'lucide-react'
import Loading from '../common/Loading'
import toast from 'react-hot-toast'

export default function EvidenceTree() {
    const [programs, setPrograms] = useState([])
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedOrganization, setSelectedOrganization] = useState('')
    const [treeData, setTreeData] = useState(null)
    const [expandedNodes, setExpandedNodes] = useState(new Set())
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchPrograms()
    }, [])

    useEffect(() => {
        if (selectedProgram && selectedOrganization) {
            fetchTreeData()
        }
    }, [selectedProgram, selectedOrganization])

    const fetchPrograms = async () => {
        try {
            setPrograms([
                { id: 'prog1', name: 'Chương trình đánh giá chất lượng giáo dục' },
                { id: 'prog2', name: 'Chương trình kiểm định chất lượng' }
            ])
        } catch (error) {
            toast.error('Lỗi tải danh sách chương trình')
        }
    }

    const fetchTreeData = async () => {
        try {
            setLoading(true)
            const mockTreeData = {
                id: 'root',
                name: 'Minh chứng',
                type: 'folder',
                children: [
                    {
                        id: 'std1',
                        name: 'Tiêu chuẩn 1: Sứ mệnh và mục tiêu',
                        type: 'standard',
                        children: [
                            {
                                id: 'cri1.1',
                                name: 'Tiêu chí 1.1: Sứ mệnh',
                                type: 'criteria',
                                children: [
                                    {
                                        id: 'ev1',
                                        name: 'H1.01.01.01 - Quyết định thành lập trường',
                                        type: 'evidence',
                                        code: 'H1.01.01.01',
                                        files: [
                                            { id: 'f1', name: 'quyet-dinh-thanh-lap.pdf', size: '2.5 MB' },
                                            { id: 'f2', name: 'bang-phu-luc.docx', size: '1.2 MB' }
                                        ]
                                    },
                                    {
                                        id: 'ev2',
                                        name: 'H1.01.01.02 - Điều lệ trường',
                                        type: 'evidence',
                                        code: 'H1.01.01.02',
                                        files: [
                                            { id: 'f3', name: 'dieu-le-truong.pdf', size: '3.1 MB' }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: 'cri1.2',
                                name: 'Tiêu chí 1.2: Mục tiêu đào tạo',
                                type: 'criteria',
                                children: [
                                    {
                                        id: 'ev3',
                                        name: 'H1.01.02.01 - Chương trình đào tạo',
                                        type: 'evidence',
                                        code: 'H1.01.02.01',
                                        files: [
                                            { id: 'f4', name: 'chuong-trinh-dao-tao.xlsx', size: '5.2 MB' }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'std2',
                        name: 'Tiêu chuẩn 2: Tổ chức và quản lý',
                        type: 'standard',
                        children: [
                            {
                                id: 'cri2.1',
                                name: 'Tiêu chí 2.1: Cơ cấu tổ chức',
                                type: 'criteria',
                                children: []
                            }
                        ]
                    }
                ]
            }

            setTreeData(mockTreeData)
            setExpandedNodes(new Set(['root', 'std1', 'std2']))
        } catch (error) {
            toast.error('Lỗi tải cây minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev)
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId)
            } else {
                newSet.add(nodeId)
            }
            return newSet
        })
    }

    const handleDownloadFile = (file, evidenceCode) => {
        console.log('Download file:', file, evidenceCode)
        toast.success(`Đang tải xuống ${file.name}`)
    }

    const handleViewFile = (file, evidenceCode) => {
        console.log('View file:', file, evidenceCode)
    }

    const handleDownloadAll = () => {
        if (!selectedProgram || !selectedOrganization) {
            toast.error('Vui lòng chọn chương trình và tổ chức')
            return
        }
        console.log('Download all for program:', selectedProgram, 'organization:', selectedOrganization)
        toast.success('Đang chuẩn bị file tải xuống...')
    }

    const renderTreeNode = (node, level = 0) => {
        const hasChildren = node.children && node.children.length > 0
        const isExpanded = expandedNodes.has(node.id)
        const paddingLeft = level * 24

        if (searchQuery) {
            const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (node.code && node.code.toLowerCase().includes(searchQuery.toLowerCase()))

            if (!matchesSearch && node.type !== 'folder' && node.type !== 'standard' && node.type !== 'criteria') {
                return null
            }
        }

        const getIcon = () => {
            switch (node.type) {
                case 'folder':
                case 'standard':
                case 'criteria':
                    return <Folder className="h-4 w-4 text-blue-500" />
                case 'evidence':
                    return <File className="h-4 w-4 text-green-500" />
                default:
                    return <File className="h-4 w-4 text-gray-500" />
            }
        }

        const getTextColor = () => {
            switch (node.type) {
                case 'standard':
                    return 'text-blue-700 font-semibold'
                case 'criteria':
                    return 'text-purple-700 font-medium'
                case 'evidence':
                    return 'text-green-700'
                default:
                    return 'text-gray-700'
            }
        }

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center py-2 hover:bg-gray-50 rounded-md cursor-pointer`}
                    style={{ paddingLeft: `${paddingLeft + 8}px` }}
                >
                    {hasChildren ? (
                        <button
                            onClick={() => toggleNode(node.id)}
                            className="mr-2 p-1 hover:bg-gray-200 rounded"
                        >
                            {isExpanded ?
                                <ChevronDown className="h-4 w-4" /> :
                                <ChevronRight className="h-4 w-4" />
                            }
                        </button>
                    ) : (
                        <div className="w-6 mr-2" />
                    )}

                    {getIcon()}

                    <span className={`ml-2 flex-1 ${getTextColor()}`}>
                        {node.name}
                    </span>

                    {node.files && node.files.length > 0 && (
                        <span className="text-xs text-gray-500 mr-2">
                            ({node.files.length} file)
                        </span>
                    )}
                </div>

                {node.type === 'evidence' && node.files && isExpanded && (
                    <div style={{ paddingLeft: `${paddingLeft + 48}px` }}>
                        {node.files.map(file => (
                            <div key={file.id} className="flex items-center py-1 text-sm text-gray-600">
                                <File className="h-3 w-3 mr-2" />
                                <span className="flex-1">{file.name}</span>
                                <span className="text-xs text-gray-400 mr-3">{file.size}</span>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleViewFile(file, node.code)}
                                        className="p-1 text-blue-500 hover:text-blue-700"
                                        title="Xem"
                                    >
                                        <Eye className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => handleDownloadFile(file, node.code)}
                                        className="p-1 text-green-500 hover:text-green-700"
                                        title="Tải xuống"
                                    >
                                        <Download className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {hasChildren && isExpanded && (
                    <div>
                        {node.children.map(child => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chương trình đánh giá
                        </label>
                        <select
                            value={selectedProgram}
                            onChange={(e) => setSelectedProgram(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Chọn chương trình</option>
                            {programs.map(program => (
                                <option key={program.id} value={program.id}>
                                    {program.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tổ chức - Cấp đánh giá
                        </label>
                        <select
                            value={selectedOrganization}
                            onChange={(e) => setSelectedOrganization(e.target.value)}
                            disabled={!selectedProgram}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">Chọn tổ chức</option>
                            <option value="org1">Trung tâm kiểm định chất lượng giáo dục - VNUA</option>
                            <option value="org2">Ban đảm bảo chất lượng</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={handleDownloadAll}
                            disabled={!selectedProgram || !selectedOrganization}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Tải xuống tất cả
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm minh chứng..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            <FolderTree className="h-5 w-5 mr-2" />
                            Cây minh chứng
                        </h3>
                        {treeData && (
                            <div className="text-sm text-gray-500">
                                Tổng số minh chứng: {treeData.children?.reduce((total, std) =>
                                total + (std.children?.reduce((subTotal, cri) =>
                                    subTotal + (cri.children?.length || 0), 0) || 0), 0
                            )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4">
                    {loading ? (
                        <div className="py-12">
                            <Loading message="Đang tải cây minh chứng..." />
                        </div>
                    ) : !selectedProgram || !selectedOrganization ? (
                        <div className="text-center py-12">
                            <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Chọn chương trình và tổ chức
                            </h3>
                            <p className="text-gray-500">
                                Vui lòng chọn chương trình đánh giá và tổ chức để xem cây minh chứng
                            </p>
                        </div>
                    ) : treeData ? (
                        <div className="max-h-96 overflow-y-auto">
                            {renderTreeNode(treeData)}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Chưa có minh chứng
                            </h3>
                            <p className="text-gray-500">
                                Chưa có minh chứng nào trong chương trình và tổ chức này
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {treeData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                    <FolderTree className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tiêu chuẩn</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {treeData.children?.length || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                    <Folder className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tiêu chí</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {treeData.children?.reduce((total, std) =>
                                        total + (std.children?.length || 0), 0
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                    <File className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Minh chứng</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {treeData.children?.reduce((total, std) =>
                                        total + (std.children?.reduce((subTotal, cri) =>
                                            subTotal + (cri.children?.length || 0), 0) || 0), 0
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}