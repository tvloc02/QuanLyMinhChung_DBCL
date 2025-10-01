import { useState, useEffect } from 'react'
import { Plus, Search, Download, Upload, Edit2, Trash2, RefreshCw } from 'lucide-react'
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

            // ===== SHEET 1: Trang giới thiệu =====
            const introData = [
                [''],
                ['HỆ THỐNG QUẢN LÝ ĐÁNH GIÁ CHẤT LƯỢNG'],
                ['FILE MẪU IMPORT CHƯƠNG TRÌNH ĐÁNH GIÁ'],
                [''],
                ['Hướng dẫn sử dụng:'],
                ['1. Điền thông tin vào sheet "Dữ liệu nhập"'],
                ['2. Các cột có dấu (*) là BẮT BUỘC'],
                ['3. Xem sheet "Hướng dẫn chi tiết" để biết thêm thông tin'],
                ['4. Sau khi điền xong, lưu file và import vào hệ thống'],
                [''],
                ['Lưu ý:'],
                ['- Mã chương trình phải VIẾT HOA, chỉ chứa chữ cái, số, gạch ngang (-)'],
                ['- Năm áp dụng phải trong khoảng 2000-2100'],
                ['- Không được để trống các trường bắt buộc'],
                [''],
                ['Ngày tạo:', new Date().toLocaleDateString('vi-VN')],
            ]

            const wsIntro = XLSX.utils.aoa_to_sheet(introData)
            wsIntro['!cols'] = [{ wch: 80 }]

            // Style cho trang giới thiệu
            const introCellStyle = {
                font: { bold: true, sz: 14, color: { rgb: "1F4E78" } },
                alignment: { horizontal: "center", vertical: "center" }
            }
            if (wsIntro['A2']) wsIntro['A2'].s = { font: { bold: true, sz: 16, color: { rgb: "1F4E78" } }, alignment: { horizontal: "center" } }
            if (wsIntro['A3']) wsIntro['A3'].s = { font: { bold: true, sz: 14, color: { rgb: "E26B0A" } }, alignment: { horizontal: "center" } }

            XLSX.utils.book_append_sheet(wb, wsIntro, 'Giới thiệu')

            // ===== SHEET 2: Dữ liệu nhập =====
            const templateData = [
                {
                    'Mã chương trình (*)': 'DGCL-DH',
                    'Tên chương trình (*)': 'Đánh giá chất lượng chương trình đào tạo đại học',
                    'Mô tả': 'Chương trình đánh giá chất lượng theo tiêu chuẩn quốc gia',
                    'Năm áp dụng': '2024',
                    'Mục tiêu': 'Đảm bảo chất lượng đào tạo đáp ứng chuẩn đầu ra',
                    'Hướng dẫn': 'Thực hiện theo quy định của Bộ GD&ĐT'
                }
            ]

            const wsData = XLSX.utils.json_to_sheet(templateData)

            // Định dạng cột
            wsData['!cols'] = [
                { wch: 20 },  // Mã chương trình
                { wch: 55 },  // Tên chương trình
                { wch: 50 },  // Mô tả
                { wch: 12 },  // Năm áp dụng
                { wch: 45 },  // Mục tiêu
                { wch: 45 }   // Hướng dẫn
            ]

            // Style cho header
            const headerStyle = {
                fill: { fgColor: { rgb: "4472C4" } },
                font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            }

            // Áp dụng style cho header row
            const range = XLSX.utils.decode_range(wsData['!ref'])
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1"
                if (!wsData[address]) continue
                wsData[address].s = headerStyle
            }

            // Style cho data rows
            const dataStyle = {
                border: {
                    top: { style: "thin", color: { rgb: "D9D9D9" } },
                    bottom: { style: "thin", color: { rgb: "D9D9D9" } },
                    left: { style: "thin", color: { rgb: "D9D9D9" } },
                    right: { style: "thin", color: { rgb: "D9D9D9" } }
                },
                alignment: { vertical: "top", wrapText: true }
            }

            for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const address = XLSX.utils.encode_col(C) + (R + 1)
                    if (!wsData[address]) continue
                    wsData[address].s = dataStyle
                }
            }

            // Set row height
            wsData['!rows'] = [{ hpt: 30 }] // Header height

            XLSX.utils.book_append_sheet(wb, wsData, 'Dữ liệu nhập')

            // ===== SHEET 3: Hướng dẫn chi tiết =====
            const instructionData = [
                {
                    'Tên cột': 'Mã chương trình (*)',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Mã chương trình phải VIẾT HOA, tối đa 20 ký tự, chỉ chứa chữ cái (A-Z), số (0-9), dấu gạch ngang (-) và gạch dưới (_)',
                    'Ví dụ hợp lệ': 'DGCL-DH, CTDT-2024, KĐCLGD',
                    'Ví dụ không hợp lệ': 'dgcl-dh (chữ thường), DGCL DH (có dấu cách)'
                },
                {
                    'Tên cột': 'Tên chương trình (*)',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Tên đầy đủ của chương trình đánh giá, tối đa 300 ký tự',
                    'Ví dụ hợp lệ': 'Đánh giá chất lượng chương trình đào tạo đại học',
                    'Ví dụ không hợp lệ': ''
                },
                {
                    'Tên cột': 'Mô tả',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Mô tả chi tiết về chương trình, mục đích, phạm vi áp dụng. Tối đa 2000 ký tự',
                    'Ví dụ hợp lệ': 'Chương trình đánh giá chất lượng theo tiêu chuẩn...',
                    'Ví dụ không hợp lệ': ''
                },
                {
                    'Tên cột': 'Năm áp dụng',
                    'Kiểu dữ liệu': 'Số',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Năm bắt đầu áp dụng chương trình, phải là số nguyên từ 2000 đến 2100',
                    'Ví dụ hợp lệ': '2024, 2025',
                    'Ví dụ không hợp lệ': '1999, 2101, 24 (không đầy đủ)'
                },
                {
                    'Tên cột': 'Mục tiêu',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Mục tiêu của chương trình đánh giá. Tối đa 2000 ký tự',
                    'Ví dụ hợp lệ': 'Đảm bảo chất lượng đào tạo đáp ứng chuẩn đầu ra',
                    'Ví dụ không hợp lệ': ''
                },
                {
                    'Tên cột': 'Hướng dẫn',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Hướng dẫn thực hiện chương trình. Tối đa 3000 ký tự',
                    'Ví dụ hợp lệ': 'Thực hiện theo quy định của Bộ GD&ĐT',
                    'Ví dụ không hợp lệ': ''
                }
            ]

            const wsInstruction = XLSX.utils.json_to_sheet(instructionData)
            wsInstruction['!cols'] = [
                { wch: 25 },  // Tên cột
                { wch: 15 },  // Kiểu dữ liệu
                { wch: 10 },  // Bắt buộc
                { wch: 60 },  // Mô tả chi tiết
                { wch: 35 },  // Ví dụ hợp lệ
                { wch: 35 }   // Ví dụ không hợp lệ
            ]

            // Style cho instruction header
            const instrHeaderStyle = {
                fill: { fgColor: { rgb: "70AD47" } },
                font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                alignment: { horizontal: "center", vertical: "center", wrapText: true }
            }

            const instrRange = XLSX.utils.decode_range(wsInstruction['!ref'])
            for (let C = instrRange.s.c; C <= instrRange.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1"
                if (!wsInstruction[address]) continue
                wsInstruction[address].s = instrHeaderStyle
            }

            XLSX.utils.book_append_sheet(wb, wsInstruction, 'Hướng dẫn chi tiết')

            // ===== SHEET 4: Lỗi thường gặp =====
            const errorsData = [
                {
                    'STT': '1',
                    'Lỗi': 'Mã chương trình đã tồn tại',
                    'Nguyên nhân': 'Mã chương trình bị trùng với mã đã có trong hệ thống',
                    'Cách khắc phục': 'Thay đổi mã chương trình thành mã khác chưa sử dụng'
                },
                {
                    'STT': '2',
                    'Lỗi': 'Mã chương trình không hợp lệ',
                    'Nguyên nhân': 'Mã chứa ký tự đặc biệt hoặc chữ thường',
                    'Cách khắc phục': 'Chỉ sử dụng chữ HOA, số, dấu gạch ngang (-) và gạch dưới (_)'
                },
                {
                    'STT': '3',
                    'Lỗi': 'Thiếu trường bắt buộc',
                    'Nguyên nhân': 'Không điền đủ các trường có dấu (*)',
                    'Cách khắc phục': 'Điền đầy đủ thông tin cho các trường: Mã chương trình, Tên chương trình'
                },
                {
                    'STT': '4',
                    'Lỗi': 'Năm áp dụng không hợp lệ',
                    'Nguyên nhân': 'Năm nhỏ hơn 2000 hoặc lớn hơn 2100',
                    'Cách khắc phục': 'Nhập năm trong khoảng 2000-2100'
                },
                {
                    'STT': '5',
                    'Lỗi': 'Vượt quá độ dài cho phép',
                    'Nguyên nhân': 'Nội dung vượt quá số ký tự quy định',
                    'Cách khắc phục': 'Rút gọn nội dung theo giới hạn: Tên (300 ký tự), Mô tả (2000 ký tự), Hướng dẫn (3000 ký tự)'
                }
            ]

            const wsErrors = XLSX.utils.json_to_sheet(errorsData)
            wsErrors['!cols'] = [
                { wch: 5 },   // STT
                { wch: 30 },  // Lỗi
                { wch: 45 },  // Nguyên nhân
                { wch: 60 }   // Cách khắc phục
            ]

            const errorHeaderStyle = {
                fill: { fgColor: { rgb: "C00000" } },
                font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
                alignment: { horizontal: "center", vertical: "center" }
            }

            const errorRange = XLSX.utils.decode_range(wsErrors['!ref'])
            for (let C = errorRange.s.c; C <= errorRange.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1"
                if (!wsErrors[address]) continue
                wsErrors[address].s = errorHeaderStyle
            }

            XLSX.utils.book_append_sheet(wb, wsErrors, 'Lỗi thường gặp')

            // Export file
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
                'Mô tả': program.description || '',
                'Năm áp dụng': program.applicableYear || '',
                'Trạng thái': getStatusLabel(program.status),
                'Người tạo': program.createdBy?.fullName || '',
                'Ngày tạo': formatDate(program.createdAt)
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            ws['!cols'] = [
                { wch: 5 },   // STT
                { wch: 15 },  // Mã
                { wch: 50 },  // Tên
                { wch: 60 },  // Mô tả
                { wch: 12 },  // Năm
                { wch: 15 },  // Trạng thái
                { wch: 25 },  // Người tạo
                { wch: 12 }   // Ngày tạo
            ]

            // Style header
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
                // Hiển thị chi tiết lỗi
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên chương trình</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Năm áp dụng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : programs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            programs.map((program) => (
                                <tr key={program._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">{program.code}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{program.name}</div>
                                        {program.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-md">
                                                {program.description}
                                            </div>
                                        )}
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