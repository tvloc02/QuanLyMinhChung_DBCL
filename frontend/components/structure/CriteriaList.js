import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Download, Upload, Edit2, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import * as XLSX from 'xlsx'
import ImportExcelModal from './ImportExcelModal'
import CriteriaModal from './CriteriaModal'

export default function CriteriaList() {
    const [criteria, setCriteria] = useState([])
    const [standards, setStandards] = useState([])
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })

    const [search, setSearch] = useState('')
    const [standardId, setStandardId] = useState('')
    const [programId, setProgramId] = useState('')
    const [status, setStatus] = useState('')
    const [type, setType] = useState('')

    const [showImportModal, setShowImportModal] = useState(false)
    const [showCriteriaModal, setShowCriteriaModal] = useState(false)
    const [selectedCriteria, setSelectedCriteria] = useState(null)

    useEffect(() => {
        loadPrograms()
        loadOrganizations()
    }, [])

    useEffect(() => {
        if (programId) {
            loadStandards()
        }
    }, [programId])

    useEffect(() => {
        loadCriteria()
    }, [pagination.current, search, standardId, programId, status, type])

    const loadPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll({ status: 'active', limit: 100 })
            if (response.data.success) {
                setPrograms(response.data.data.programs || [])
            }
        } catch (error) {
            console.error('Load programs error:', error)
        }
    }

    const loadOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll({ status: 'active', limit: 100 })
            if (response.data.success) {
                setOrganizations(response.data.data.organizations || [])
            }
        } catch (error) {
            console.error('Load organizations error:', error)
        }
    }

    const loadStandards = async () => {
        try {
            const response = await apiMethods.standards.getAll({
                programId,
                status: 'active',
                limit: 100
            })
            if (response.data.success) {
                setStandards(response.data.data.standards || [])
            }
        } catch (error) {
            console.error('Load standards error:', error)
        }
    }

    const loadCriteria = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.criteria.getAll({
                page: pagination.current,
                limit: 10,
            })

            if (response.data.success) {
                setCriteria(response.data.data.criteria)
                setPagination(response.data.data.pagination)
            }
        } catch (error) {
            toast.error('Không thể tải danh sách tiêu chí')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadTemplate = () => {
        try {
            const templateData = [
                {
                    'Mã tiêu chí (*)': '1',
                    'Tên tiêu chí (*)': 'Mục tiêu chương trình đào tạo được xây dựng phù hợp',
                    'Mô tả': 'Mục tiêu thể hiện rõ định hướng phát triển',
                    'Mã tiêu chuẩn (*)': '1',
                    'Thứ tự': '1',
                    'Trọng số (%)': '25',
                    'Loại (*)': 'mandatory',
                    'Yêu cầu': 'Có văn bản mô tả mục tiêu',
                    'Hướng dẫn': 'Kiểm tra tính nhất quán'
                }
            ]

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(templateData)

            // Style header
            const range = XLSX.utils.decode_range(ws['!ref'])
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1"
                if (!ws[address]) continue
                ws[address].s = {
                    fill: { fgColor: { rgb: "FFC000" } },
                    font: { bold: true, color: { rgb: "000000" } },
                    alignment: { horizontal: "center", vertical: "center" }
                }
            }

            ws['!cols'] = [
                { wch: 12 }, { wch: 55 }, { wch: 50 }, { wch: 15 },
                { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 40 }, { wch: 50 }
            ]

            // Sheet hướng dẫn
            const instructionData = [
                { 'Cột': 'Mã tiêu chí (*)', 'Mô tả': 'Mã số tiêu chí (1-2 chữ số)', 'Ví dụ': '1, 01, 12' },
                { 'Cột': 'Tên tiêu chí (*)', 'Mô tả': 'Tên đầy đủ của tiêu chí', 'Ví dụ': 'Mục tiêu được xây dựng phù hợp' },
                { 'Cột': 'Mô tả', 'Mô tả': 'Mô tả chi tiết về tiêu chí', 'Ví dụ': 'Mục tiêu thể hiện...' },
                { 'Cột': 'Mã tiêu chuẩn (*)', 'Mô tả': 'Mã tiêu chuẩn cha (đã tạo)', 'Ví dụ': '1, 2, 3' },
                { 'Cột': 'Thứ tự', 'Mô tả': 'Thứ tự hiển thị', 'Ví dụ': '1, 2, 3' },
                { 'Cột': 'Trọng số (%)', 'Mô tả': 'Trọng số từ 0-100', 'Ví dụ': '25, 30' },
                { 'Cột': 'Loại (*)', 'Mô tả': 'mandatory/optional/conditional', 'Ví dụ': 'mandatory' },
                { 'Cột': 'Yêu cầu', 'Mô tả': 'Yêu cầu của tiêu chí', 'Ví dụ': 'Có văn bản mô tả' },
                { 'Cột': 'Hướng dẫn', 'Mô tả': 'Hướng dẫn đánh giá', 'Ví dụ': 'Kiểm tra tính nhất quán' }
            ]

            const wsInstruction = XLSX.utils.json_to_sheet(instructionData)
            wsInstruction['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 35 }]

            // Sheet danh sách tiêu chuẩn
            const standardsData = standards.map(s => ({
                'Mã tiêu chuẩn': s.code,
                'Tên tiêu chuẩn': s.name,
                'Chương trình': s.programId?.name || '',
                'Tổ chức': s.organizationId?.name || ''
            }))
            const wsStandardsList = XLSX.utils.json_to_sheet(standardsData.length > 0 ? standardsData : [
                { 'Mã tiêu chuẩn': '', 'Tên tiêu chuẩn': 'Vui lòng chọn chương trình để xem danh sách', 'Chương trình': '', 'Tổ chức': '' }
            ])

            XLSX.utils.book_append_sheet(wb, ws, 'Mẫu nhập liệu')
            XLSX.utils.book_append_sheet(wb, wsInstruction, 'Hướng dẫn')
            XLSX.utils.book_append_sheet(wb, wsStandardsList, 'DS Tiêu chuẩn')

            XLSX.writeFile(wb, 'Mau_import_tieu_chi.xlsx')
            toast.success('Đã tải file mẫu')
        } catch (error) {
            toast.error('Có lỗi khi tạo file mẫu')
            console.error(error)
        }
    }

    const handleExportExcel = () => {
        try {
            const exportData = criteria.map((c, index) => ({
                'STT': index + 1,
                'Mã': c.code,
                'Tên tiêu chí': c.name,
                'Mô tả': c.description || '',
                'Tiêu chuẩn': c.standardId?.name || '',
                'Chương trình': c.programId?.name || '',
                'Thứ tự': c.order,
                'Trọng số (%)': c.weight || '',
                'Loại': getTypeLabel(c.type),
                'Trạng thái': getStatusLabel(c.status),
                'Ngày tạo': formatDate(c.createdAt)
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)
            ws['!cols'] = [
                { wch: 5 }, { wch: 10 }, { wch: 55 }, { wch: 50 }, { wch: 40 },
                { wch: 35 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
            ]

            XLSX.utils.book_append_sheet(wb, ws, 'Tiêu chí')
            XLSX.writeFile(wb, `Danh_sach_tieu_chi_${Date.now()}.xlsx`)
            toast.success('Xuất file thành công')
        } catch (error) {
            toast.error('Có lỗi khi xuất file')
        }
    }

    const handleImport = async (file) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await apiMethods.criteria.import?.(formData) ||
                await apiMethods.criteria.bulkImport?.(formData)

            if (response.data.success) {
                toast.success(`Import thành công ${response.data.data.success} tiêu chí`)
                loadCriteria()
                setShowImportModal(false)
            }
                } catch (error) {
            console.log(file)
            console.log(formData.get('file'))
            toast.error(error.response?.data?.message || 'Import thất bại')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa tiêu chí này?')) return

        try {
            await apiMethods.criteria.delete(id)
            toast.success('Xóa thành công')
            loadCriteria()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa thất bại')
        }
    }

    const getTypeLabel = (type) => {
        const types = {
            mandatory: 'Bắt buộc',
            optional: 'Tùy chọn',
            conditional: 'Có điều kiện'
        }
        return types[type] || type
    }

    const getStatusLabel = (status) => {
        const statuses = {
            draft: 'Nháp',
            active: 'Hoạt động',
            inactive: 'Không hoạt động',
            archived: 'Lưu trữ'
        }
        return statuses[status] || status
    }

    const getStatusColor = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-700',
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-red-100 text-red-700',
            archived: 'bg-yellow-100 text-yellow-700'
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Tiêu chí</h1>
                    <p className="text-gray-600 mt-1">Quản lý các tiêu chí đánh giá</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadTemplate}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Download size={18} />
                        Tải mẫu
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Upload size={18} />
                        Import Excel
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Download size={18} />
                        Export Excel
                    </button>
                    <button
                        onClick={() => {
                            setSelectedCriteria(null)
                            setShowCriteriaModal(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Thêm tiêu chí
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={programId}
                        onChange={(e) => {
                            setProgramId(e.target.value)
                            setStandardId('')
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả chương trình</option>
                        {programs.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        value={standardId}
                        onChange={(e) => setStandardId(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!programId}
                    >
                        <option value="">Tất cả tiêu chuẩn</option>
                        {standards.map(s => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>

                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả loại</option>
                        <option value="mandatory">Bắt buộc</option>
                        <option value="optional">Tùy chọn</option>
                        <option value="conditional">Có điều kiện</option>
                    </select>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="draft">Nháp</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                        <option value="archived">Lưu trữ</option>
                    </select>

                    <button
                        onClick={loadCriteria}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên tiêu chí</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu chuẩn</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thứ tự</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trọng số</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : criteria.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            criteria.map((item) => (
                                <tr key={item._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">{item.code}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                        {item.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-md">
                                                {item.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900">
                                                {item.standardId?.name || '-'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                                        {item.order}
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                                        {item.weight ? `${item.weight}%` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {getTypeLabel(item.type)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCriteria(item)
                                                    setShowCriteriaModal(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item._id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && criteria.length > 0 && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{criteria.length}</span> trong tổng số{' '}
                            <span className="font-medium">{pagination.total}</span> tiêu chí
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                                disabled={!pagination.hasPrev}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                                disabled={!pagination.hasNext}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showImportModal && (
                <ImportExcelModal
                    onClose={() => setShowImportModal(false)}
                    onImport={handleImport}
                    title="Import Tiêu chí"
                />
            )}

            {showCriteriaModal && (
                <CriteriaModal
                    criteria={selectedCriteria}
                    standards={standards}
                    programs={programs}
                    onClose={() => {
                        setShowCriteriaModal(false)
                        setSelectedCriteria(null)
                    }}
                    onSuccess={() => {
                        loadCriteria()
                        setShowCriteriaModal(false)
                        setSelectedCriteria(null)
                    }}
                />
            )}
        </div>
    )
}