import { useState, useEffect } from 'react'
import { BookOpen, Plus, Search, Download, Upload, Edit2, Trash2, RefreshCw, Filter, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import * as XLSX from 'xlsx'
import ImportExcelModal from './ImportExcelModal'
import ProgramModal from './ProgramModal'

export default function ProgramList() {
    const [programs, setPrograms] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [showImportModal, setShowImportModal] = useState(false)
    const [showProgramModal, setShowProgramModal] = useState(false)
    const [selectedProgram, setSelectedProgram] = useState(null)

    useEffect(() => {
        loadPrograms()
    }, [pagination.current, search, status])

    const loadPrograms = async () => {
        try {
            setLoading(true)
            const params = {
                page: pagination.current,
                limit: 10
            };

            if (search) params.search = search;
            if (status) params.status = status;

            const response = await apiMethods.programs.getAll(params);

            if (response.data.success) {
                setPrograms(response.data.data.programs)
                setPagination(response.data.data.pagination)
            }
        } catch (error) {
            toast.error('Không thể tải danh sách chương trình')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadTemplate = () => {
        try {
            const wb = XLSX.utils.book_new()

            // Dữ liệu và hướng dẫn cho sheet 'Dữ liệu nhập'
            const introAndTemplateData = [
                [''],
                ['HỆ THỐNG QUẢN LÝ ĐÁNH GIÁ CHẤT LƯỢNG'],
                ['FILE MẪU IMPORT CHƯƠNG TRÌNH ĐÁNH GIÁ'],
                [''],
                ['Hướng dẫn sử dụng:'],
                ['1. Điền thông tin vào các cột bên dưới, bắt đầu từ dòng 15.'],
                ['2. Các cột có dấu (*) là BẮT BUỘC. Chỉ nhập dữ liệu vào hàng DỮ LIỆU.'],
                [''],
                ['Lưu ý về định dạng:'],
                ['- Mã chương trình (*): VIẾT HOA, chỉ chứa chữ cái, số, gạch ngang (-) hoặc gạch dưới (_). Tối đa 20 ký tự.'],
                ['- Năm áp dụng: Số nguyên từ 2000 đến 2100.'],
                ['- Ngày hiệu lực/hết hạn: Nhập theo định dạng YYYY-MM-DD (Ví dụ: 2025-01-01). Ngày hết hạn phải SAU Ngày hiệu lực.'],
                [''],
            ]

            // Hàng tiêu đề (header) của dữ liệu nhập
            const dataHeader = [
                'Mã chương trình (*)',
                'Tên chương trình (*)',
                'Năm áp dụng',
                'Ngày hiệu lực (YYYY-MM-DD)',
                'Ngày hết hạn (YYYY-MM-DD)',
                'Mục tiêu',
                'Hướng dẫn' // Thêm trường Hướng dẫn
            ]

            // Dữ liệu mẫu (chỉ 1 dòng)
            const sampleData = [
                'DGCL-DH-2025',
                'Đánh giá chất lượng chương trình đào tạo đại học năm 2025',
                '2025',
                '2025-01-01',
                '2026-01-01',
                'Đảm bảo chất lượng đào tạo đáp ứng chuẩn đầu ra.',
                'Tham khảo các quy định hiện hành về kiểm định chất lượng.'
            ]

            // Ghép phần giới thiệu và dữ liệu
            const fullData = [
                ...introAndTemplateData,
                dataHeader,
                sampleData
            ]

            const ws = XLSX.utils.aoa_to_sheet(fullData)

            // Cấu hình độ rộng cột
            ws['!cols'] = [
                { wch: 25 }, // Mã chương trình
                { wch: 60 }, // Tên chương trình
                { wch: 15 }, // Năm áp dụng
                { wch: 25 }, // Ngày hiệu lực
                { wch: 25 }, // Ngày hết hạn
                { wch: 50 }, // Mục tiêu
                { wch: 50 }  // Hướng dẫn
            ]

            // Định dạng tiêu đề chính (row 2, A2) và tiêu đề phụ (row 3, A3)
            if (ws['A2']) ws['A2'].s = { font: { bold: true, sz: 16, color: { rgb: "1F4E78" } }, alignment: { horizontal: "center" } }
            if (ws['A3']) ws['A3'].s = { font: { bold: true, sz: 14, color: { rgb: "E26B0A" } }, alignment: { horizontal: "center" } }

            // Định dạng hàng header dữ liệu (row 14)
            const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "007FFF" } } }
            const headerRowIndex = 14; // AOA index starts at 0, so row 15 is index 14
            dataHeader.forEach((_, colIndex) => {
                const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIndex });
                if (ws[cellRef]) ws[cellRef].s = headerStyle;
            });


            XLSX.utils.book_append_sheet(wb, ws, 'Du_lieu_chuong_trinh')

            XLSX.writeFile(wb, 'Mau_import_chuong_trinh.xlsx')
            toast.success('Đã tải file mẫu thành công')
        } catch (error) {
            toast.error('Có lỗi khi tạo file mẫu')
            console.error(error)
        }
    }

    const handleExportExcel = () => {
        try {
            const exportData = programs.map((program, index) => ({
                'STT': index + 1,
                'Mã chương trình': program.code,
                'Tên chương trình': program.name,
                'Năm áp dụng': program.applicableYear || '',
                'Trạng thái': getStatusLabel(program.status),
                'Người tạo': program.createdBy?.fullName || '',
                'Ngày tạo': formatDate(program.createdAt)
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            ws['!cols'] = [
                { wch: 5 },
                { wch: 15 },
                { wch: 50 },
                { wch: 12 },
                { wch: 15 },
                { wch: 25 },
                { wch: 12 }
            ]

            XLSX.utils.book_append_sheet(wb, ws, 'Chương trình')
            XLSX.writeFile(wb, `Danh_sach_chuong_trinh_${Date.now()}.xlsx`)
            toast.success('Xuất file thành công')
        } catch (error) {
            toast.error('Có lỗi khi xuất file')
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
            const errorMsg = error.response?.data?.message || 'Import thất bại'
            const details = error.response?.data?.details

            if (details && Array.isArray(details)) {
                const errorList = details.map((err, idx) =>
                    `\n${idx + 1}. Dòng ${err.row}: ${err.message}`
                ).join('')
                toast.error(`${errorMsg}${errorList}`, { duration: 8000 })
            } else {
                toast.error(errorMsg, { duration: 5000 })
            }
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
            draft: 'bg-gray-100 text-gray-700 border border-gray-300',
            active: 'bg-green-100 text-green-700 border border-green-300',
            inactive: 'bg-red-100 text-red-700 border border-red-300',
            archived: 'bg-yellow-100 text-yellow-700 border border-yellow-300'
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
    }

    return (
        <div className="space-y-6">
            {/* Header với gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <BookOpen className="w-9 h-9 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Quản lý Chương trình</h1>
                            <p className="text-blue-100">Quản lý các chương trình đánh giá chất lượng</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadTemplate}
                            className="px-4 py-2.5 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 transition-all flex items-center gap-2 font-medium"
                        >
                            <Download size={18} />
                            Tải mẫu
                        </button>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="px-4 py-2.5 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 transition-all flex items-center gap-2 font-medium"
                        >
                            <Upload size={18} />
                            Import
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="px-4 py-2.5 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl hover:bg-opacity-30 transition-all flex items-center gap-2 font-medium"
                        >
                            <Download size={18} />
                            Export
                        </button>
                        <button
                            onClick={() => {
                                setSelectedProgram(null)
                                setShowProgramModal(true)
                            }}
                            className="px-6 py-2.5 bg-white text-blue-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold"
                        >
                            <Plus size={20} />
                            Thêm chương trình
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm chương trình..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                        <option value="">⚡ Tất cả trạng thái</option>
                        <option value="draft">📝 Nháp</option>
                        <option value="active">✅ Hoạt động</option>
                        <option value="inactive">⏸️ Không hoạt động</option>
                        <option value="archived">📦 Lưu trữ</option>
                    </select>

                    <button
                        onClick={loadPrograms}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                        <RefreshCw size={18} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Mã</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Tên chương trình</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Năm áp dụng</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Ngày tạo</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-blue-700 uppercase tracking-wider">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : programs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium text-lg">Không có dữ liệu</p>
                                        <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc thêm chương trình mới</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            programs.map((program) => (
                                <tr key={program._id} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 text-sm font-bold text-blue-700 bg-blue-100 rounded-lg">
                                            {program.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900">{program.name}</div>
                                        {program.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-md mt-1">
                                                {program.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${getStatusColor(program.status)}`}>
                                            {getStatusLabel(program.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                            <span className="font-semibold">{program.applicableYear}</span>
                                        </div>
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
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(program._id)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                                title="Xóa"
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
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-t-2 border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-bold text-blue-600">{programs.length}</span> trong tổng số{' '}
                            <span className="font-bold text-blue-600">{pagination.total}</span> chương trình
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                                disabled={!pagination.hasPrev}
                                className="px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                                disabled={!pagination.hasNext}
                                className="px-4 py-2 border-2 border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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