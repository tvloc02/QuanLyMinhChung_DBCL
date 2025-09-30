import { useState, useEffect } from 'react'
import axios from 'axios'
import {
    BookOpen, Plus, Search, Filter, Download, Upload,
    Edit2, Trash2, Eye, MoreVertical, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import {api, apiMethods} from '../../services/api'
import { formatDate } from '../../utils/helpers'
import * as XLSX from 'xlsx'
import ImportExcelModal from './ImportExcelModal'
import ProgramModal from './ProgramModal'

export default function ProgramList() {
    const [programs, setPrograms] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0
    })

    // Filters
    const [search, setSearch] = useState('')
    const [type, setType] = useState('')
    const [status, setStatus] = useState('')

    // Modals
    const [showImportModal, setShowImportModal] = useState(false)
    const [showProgramModal, setShowProgramModal] = useState(false)
    const [selectedProgram, setSelectedProgram] = useState(null)

    useEffect(() => {
        loadPrograms()
    }, [pagination.current, search, type, status])

    const loadPrograms = async () => {
        try {
            setLoading(true)

            // Tạo params object, chỉ thêm các giá trị không rỗng
            const params = {
                page: pagination.current,
                limit: 10
            };

            if (search) params.search = search;
            if (type) params.type = type;
            if (status) params.status = status;

            const response = await apiMethods.programs.getAll(params);


            if (response.data.success) {
                setPrograms(response.data.data.programs)
                setPagination(response.data.data.pagination)
            }
        } catch (error) {
            toast.error('Không thể tải danh sách chương trình')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleExportExcel = () => {
        try {
            // Chuẩn bị dữ liệu
            const exportData = programs.map((program, index) => ({
                'STT': index + 1,
                'Mã chương trình': program.code,
                'Tên chương trình': program.name,
                'Mô tả': program.description || '',
                'Loại': getProgramTypeLabel(program.type),
                'Phiên bản': program.version || '1.0',
                'Năm áp dụng': program.applicableYear || '',
                'Trạng thái': getStatusLabel(program.status),
                'Ngày tạo': formatDate(program.createdAt)
            }))

            // Tạo workbook
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            // Định dạng cột
            const colWidths = [
                { wch: 5 },  // STT
                { wch: 15 }, // Mã
                { wch: 40 }, // Tên
                { wch: 50 }, // Mô tả
                { wch: 15 }, // Loại
                { wch: 10 }, // Phiên bản
                { wch: 12 }, // Năm
                { wch: 12 }, // Trạng thái
                { wch: 12 }  // Ngày tạo
            ]
            ws['!cols'] = colWidths

            XLSX.utils.book_append_sheet(wb, ws, 'Chương trình')
            XLSX.writeFile(wb, `Danh_sach_chuong_trinh_${Date.now()}.xlsx`)

            toast.success('Xuất file thành công')
        } catch (error) {
            toast.error('Có lỗi khi xuất file')
            console.error(error)
        }
    }

    const handleDownloadTemplate = () => {
        try {
            // Dữ liệu mẫu
            const templateData = [
                {
                    'Mã chương trình (*)': 'DGCL-DH',
                    'Tên chương trình (*)': 'Đánh giá chất lượng chương trình đào tạo đại học',
                    'Mô tả': 'Chương trình đánh giá chất lượng theo tiêu chuẩn quốc gia',
                    'Loại (*)': 'undergraduate',
                    'Phiên bản': '1.0',
                    'Năm áp dụng': '2024',
                    'Mục tiêu': 'Đảm bảo chất lượng đào tạo',
                    'Hướng dẫn': 'Thực hiện theo quy định'
                }
            ]

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(templateData)

            // Style cho header
            const range = XLSX.utils.decode_range(ws['!ref'])
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1"
                if (!ws[address]) continue
                ws[address].s = {
                    fill: { fgColor: { rgb: "4472C4" } },
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    alignment: { horizontal: "center", vertical: "center" }
                }
            }

            // Độ rộng cột
            ws['!cols'] = [
                { wch: 20 }, { wch: 50 }, { wch: 50 }, { wch: 15 },
                { wch: 10 }, { wch: 12 }, { wch: 40 }, { wch: 40 }
            ]

            // Thêm sheet hướng dẫn
            const instructionData = [
                { 'Cột': 'Mã chương trình (*)', 'Mô tả': 'Mã chương trình (bắt buộc, chữ hoa, số, gạch ngang)', 'Ví dụ': 'DGCL-DH' },
                { 'Cột': 'Tên chương trình (*)', 'Mô tả': 'Tên đầy đủ của chương trình (bắt buộc)', 'Ví dụ': 'Đánh giá chất lượng đào tạo' },
                { 'Cột': 'Mô tả', 'Mô tả': 'Mô tả chi tiết về chương trình', 'Ví dụ': 'Chương trình đánh giá...' },
                { 'Cột': 'Loại (*)', 'Mô tả': 'undergraduate/graduate/institution/other', 'Ví dụ': 'undergraduate' },
                { 'Cột': 'Phiên bản', 'Mô tả': 'Phiên bản chương trình', 'Ví dụ': '1.0' },
                { 'Cột': 'Năm áp dụng', 'Mô tả': 'Năm bắt đầu áp dụng (2000-2100)', 'Ví dụ': '2024' },
                { 'Cột': 'Mục tiêu', 'Mô tả': 'Mục tiêu của chương trình', 'Ví dụ': 'Đảm bảo chất lượng' },
                { 'Cột': 'Hướng dẫn', 'Mô tả': 'Hướng dẫn thực hiện', 'Ví dụ': 'Thực hiện theo quy định' }
            ]

            const wsInstruction = XLSX.utils.json_to_sheet(instructionData)
            wsInstruction['!cols'] = [{ wch: 25 }, { wch: 50 }, { wch: 30 }]

            XLSX.utils.book_append_sheet(wb, ws, 'Mẫu nhập liệu')
            XLSX.utils.book_append_sheet(wb, wsInstruction, 'Hướng dẫn')

            XLSX.writeFile(wb, 'Mau_import_chuong_trinh.xlsx')
            toast.success('Đã tải file mẫu')
        } catch (error) {
            toast.error('Có lỗi khi tạo file mẫu')
            console.error(error)
        }
    }

    const handleImport = async (file) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await apiMethods.programs.import?.(formData) ||
                await apiMethods.programs.bulkImport?.(formData)

            if (response.data.success) {
                toast.success(`Import thành công ${response.data.data.success} chương trình`)
                loadPrograms()
                setShowImportModal(false)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Import thất bại')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa chương trình này?')) return

        try {
            await apiMethods.programs.delete(id)
            toast.success('Xóa thành công')
            loadPrograms()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa thất bại')
        }
    }

    const getProgramTypeLabel = (type) => {
        const types = {
            undergraduate: 'Đại học',
            graduate: 'Sau đại học',
            institution: 'Cơ sở giáo dục',
            other: 'Khác'
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Chương trình</h1>
                    <p className="text-gray-600 mt-1">Quản lý các chương trình đánh giá</p>
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
                            setSelectedProgram(null)
                            setShowProgramModal(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Thêm chương trình
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Tất cả loại</option>
                        <option value="undergraduate">Đại học</option>
                        <option value="graduate">Sau đại học</option>
                        <option value="institution">Cơ sở giáo dục</option>
                        <option value="other">Khác</option>
                    </select>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="draft">Nháp</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                        <option value="archived">Lưu trữ</option>
                    </select>

                    <button
                        onClick={loadPrograms}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Mã
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tên chương trình
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Loại
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Năm áp dụng
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ngày tạo
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : programs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            programs.map((program) => (
                                <tr key={program._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">
                                                {program.code}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {program.name}
                                        </div>
                                        {program.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-md">
                                                {program.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900">
                                                {getProgramTypeLabel(program.type)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.status)}`}>
                                                {getStatusLabel(program.status)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {program.applicableYear}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(program.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedProgram(program)
                                                    setShowProgramModal(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(program._id)}
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
                {!loading && programs.length > 0 && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{programs.length}</span> trong tổng số{' '}
                            <span className="font-medium">{pagination.total}</span> chương trình
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                                disabled={!pagination.hasPrev}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                                disabled={!pagination.hasNext}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showImportModal && (
                <ImportExcelModal
                    onClose={() => setShowImportModal(false)}
                    onImport={handleImport}
                    title="Import Chương trình"
                />
            )}

            {showProgramModal && (
                <ProgramModal
                    program={selectedProgram}
                    onClose={() => {
                        setShowProgramModal(false)
                        setSelectedProgram(null)
                    }}
                    onSuccess={() => {
                        loadPrograms()
                        setShowProgramModal(false)
                        setSelectedProgram(null)
                    }}
                />
            )}
        </div>
    )
}