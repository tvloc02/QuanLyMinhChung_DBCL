import { useState, useEffect } from 'react'
import { BarChart3, Plus, Search, Download, Upload, Edit2, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import * as XLSX from 'xlsx'
import ImportExcelModal from './ImportExcelModal'
import StandardModal from './StandardModal'

export default function StandardList() {
    const [standards, setStandards] = useState([])
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })

    const [search, setSearch] = useState('')
    const [programId, setProgramId] = useState('')
    const [organizationId, setOrganizationId] = useState('')
    const [status, setStatus] = useState('')

    const [showImportModal, setShowImportModal] = useState(false)
    const [showStandardModal, setShowStandardModal] = useState(false)
    const [selectedStandard, setSelectedStandard] = useState(null)

    useEffect(() => {
        loadPrograms()
        loadOrganizations()
    }, [])

    useEffect(() => {
        loadStandards()
    }, [pagination.current, search, programId, organizationId, status])

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
            setLoading(true)
            const response = await apiMethods.standards.getAll({
                page: pagination.current,
                limit: 10,
            })

            if (response.data.success) {
                setStandards(response.data.data.standards)
                setPagination(response.data.data.pagination)
            }
        } catch (error) {
            toast.error('Không thể tải danh sách tiêu chuẩn')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadTemplate = () => {
        try {
            const templateData = [
                {
                    'Mã tiêu chuẩn (*)': '1',
                    'Tên tiêu chuẩn (*)': 'Mục tiêu chương trình đào tạo',
                    'Mô tả': 'Mục tiêu chương trình được xây dựng phù hợp với tầm nhìn, sứ mệnh',
                    'Mã chương trình (*)': 'DGCL-DH',
                    'Mã tổ chức (*)': 'MOET',
                    'Thứ tự': '1',
                    'Trọng số (%)': '15',
                    'Mục tiêu': 'Đánh giá tính phù hợp của mục tiêu',
                    'Hướng dẫn': 'Kiểm tra sự phù hợp giữa mục tiêu và yêu cầu'
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
                    fill: { fgColor: { rgb: "70AD47" } },
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    alignment: { horizontal: "center", vertical: "center" }
                }
            }

            ws['!cols'] = [
                { wch: 15 }, { wch: 50 }, { wch: 60 }, { wch: 15 }, { wch: 15 },
                { wch: 10 }, { wch: 12 }, { wch: 40 }, { wch: 50 }
            ]

            // Sheet hướng dẫn
            const instructionData = [
                { 'Cột': 'Mã tiêu chuẩn (*)', 'Mô tả': 'Mã số tiêu chuẩn (1-2 chữ số)', 'Ví dụ': '1, 01, 12' },
                { 'Cột': 'Tên tiêu chuẩn (*)', 'Mô tả': 'Tên đầy đủ của tiêu chuẩn', 'Ví dụ': 'Mục tiêu chương trình đào tạo' },
                { 'Cột': 'Mô tả', 'Mô tả': 'Mô tả chi tiết về tiêu chuẩn', 'Ví dụ': 'Mục tiêu được xây dựng...' },
                { 'Cột': 'Mã chương trình (*)', 'Mô tả': 'Mã chương trình đã tạo', 'Ví dụ': 'DGCL-DH' },
                { 'Cột': 'Mã tổ chức (*)', 'Mô tả': 'Mã tổ chức đã tạo', 'Ví dụ': 'MOET' },
                { 'Cột': 'Thứ tự', 'Mô tả': 'Thứ tự hiển thị (số nguyên dương)', 'Ví dụ': '1, 2, 3' },
                { 'Cột': 'Trọng số (%)', 'Mô tả': 'Trọng số từ 0-100', 'Ví dụ': '15, 20' },
                { 'Cột': 'Mục tiêu', 'Mô tả': 'Mục tiêu của tiêu chuẩn', 'Ví dụ': 'Đánh giá tính phù hợp' },
                { 'Cột': 'Hướng dẫn', 'Mô tả': 'Hướng dẫn đánh giá', 'Ví dụ': 'Kiểm tra sự phù hợp...' }
            ]

            const wsInstruction = XLSX.utils.json_to_sheet(instructionData)
            wsInstruction['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 30 }]

            // Sheet danh sách chương trình
            const programsData = programs.map(p => ({
                'Mã chương trình': p.code,
                'Tên chương trình': p.name
            }))
            const wsProgramsList = XLSX.utils.json_to_sheet(programsData)

            // Sheet danh sách tổ chức
            const orgsData = organizations.map(o => ({
                'Mã tổ chức': o.code,
                'Tên tổ chức': o.name
            }))
            const wsOrgsList = XLSX.utils.json_to_sheet(orgsData)

            XLSX.utils.book_append_sheet(wb, ws, 'Mẫu nhập liệu')
            XLSX.utils.book_append_sheet(wb, wsInstruction, 'Hướng dẫn')
            XLSX.utils.book_append_sheet(wb, wsProgramsList, 'DS Chương trình')
            XLSX.utils.book_append_sheet(wb, wsOrgsList, 'DS Tổ chức')

            XLSX.writeFile(wb, 'Mau_import_tieu_chuan.xlsx')
            toast.success('Đã tải file mẫu')
        } catch (error) {
            toast.error('Có lỗi khi tạo file mẫu')
            console.error(error)
        }
    }

    const handleExportExcel = () => {
        try {
            const exportData = standards.map((std, index) => ({
                'STT': index + 1,
                'Mã': std.code,
                'Tên tiêu chuẩn': std.name,
                'Mô tả': std.description || '',
                'Chương trình': std.programId?.name || '',
                'Tổ chức': std.organizationId?.name || '',
                'Thứ tự': std.order,
                'Trọng số (%)': std.weight || '',
                'Trạng thái': getStatusLabel(std.status),
                'Ngày tạo': formatDate(std.createdAt)
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)
            ws['!cols'] = [
                { wch: 5 }, { wch: 10 }, { wch: 50 }, { wch: 60 }, { wch: 40 },
                { wch: 30 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
            ]

            XLSX.utils.book_append_sheet(wb, ws, 'Tiêu chuẩn')
            XLSX.writeFile(wb, `Danh_sach_tieu_chuan_${Date.now()}.xlsx`)
            toast.success('Xuất file thành công')
        } catch (error) {
            toast.error('Có lỗi khi xuất file')
        }
    }

    const handleImport = async (file) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await apiMethods.standards.import?.(formData) ||
                await apiMethods.standards.bulkImport?.(formData)

            if (response.data.success) {
                toast.success(`Import thành công ${response.data.data.success} tiêu chuẩn`)
                loadStandards()
                setShowImportModal(false)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Import thất bại')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa tiêu chuẩn này?')) return

        try {
            await apiMethods.standards.delete(id)
            toast.success('Xóa thành công')
            loadStandards()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa thất bại')
        }
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
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Tiêu chuẩn</h1>
                    <p className="text-gray-600 mt-1">Quản lý các tiêu chuẩn đánh giá</p>
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
                            setSelectedStandard(null)
                            setShowStandardModal(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Thêm tiêu chuẩn
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                        onChange={(e) => setProgramId(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả chương trình</option>
                        {programs.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        value={organizationId}
                        onChange={(e) => setOrganizationId(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả tổ chức</option>
                        {organizations.map(o => (
                            <option key={o._id} value={o._id}>{o.name}</option>
                        ))}
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
                        onClick={loadStandards}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên tiêu chuẩn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chương trình</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổ chức</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thứ tự</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trọng số</th>
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
                        ) : standards.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            standards.map((standard) => (
                                <tr key={standard._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">{standard.code}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{standard.name}</div>
                                        {standard.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-md">
                                                {standard.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900">
                                                {standard.programId?.name || '-'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                            <span className="text-sm text-gray-900">
                                                {standard.organizationId?.name || '-'}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                                        {standard.order}
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                                        {standard.weight ? `${standard.weight}%` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(standard.status)}`}>
                                                {getStatusLabel(standard.status)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedStandard(standard)
                                                    setShowStandardModal(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(standard._id)}
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
                {!loading && standards.length > 0 && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{standards.length}</span> trong tổng số{' '}
                            <span className="font-medium">{pagination.total}</span> tiêu chuẩn
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
                    title="Import Tiêu chuẩn"
                />
            )}

            {showStandardModal && (
                <StandardModal
                    standard={selectedStandard}
                    programs={programs}
                    organizations={organizations}
                    onClose={() => {
                        setShowStandardModal(false)
                        setSelectedStandard(null)
                    }}
                    onSuccess={() => {
                        loadStandards()
                        setShowStandardModal(false)
                        setSelectedStandard(null)
                    }}
                />
            )}
        </div>
    )
}