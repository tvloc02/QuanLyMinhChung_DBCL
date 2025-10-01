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
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })
    const [search, setSearch] = useState('')
    const [standardId, setStandardId] = useState('')
    const [programId, setProgramId] = useState('')
    const [status, setStatus] = useState('')
    const [showImportModal, setShowImportModal] = useState(false)
    const [showCriteriaModal, setShowCriteriaModal] = useState(false)
    const [selectedCriteria, setSelectedCriteria] = useState(null)

    useEffect(() => {
        loadPrograms()
    }, [])

    useEffect(() => {
        if (programId) {
            loadStandards()
        } else {
            setStandards([])
        }
    }, [programId])

    useEffect(() => {
        loadCriteria()
    }, [pagination.current, search, standardId, programId, status])

    const loadPrograms = async () => {
        try {
            const response = await apiMethods.programs.getAll({ status: 'active', limit: 100 })
            if (response.data.success) {
                setPrograms(response.data.data.programs || response.data.data || [])
            }
        } catch (error) {
            console.error('Load programs error:', error)
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
                setStandards(response.data.data.standards || response.data.data || [])
            }
        } catch (error) {
            console.error('Load standards error:', error)
        }
    }

    const loadCriteria = async () => {
        try {
            setLoading(true)
            const params = {
                page: pagination.current,
                limit: 10
            };

            if (search) params.search = search;
            if (standardId) params.standardId = standardId;
            if (programId) params.programId = programId;
            if (status) params.status = status;

            const response = await apiMethods.criteria.getAll(params);

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
            const wb = XLSX.utils.book_new()

            // ===== SHEET 1: Giới thiệu =====
            const introData = [
                [''],
                ['HỆ THỐNG QUẢN LÝ ĐÁNH GIÁ CHẤT LƯỢNG'],
                ['FILE MẪU IMPORT TIÊU CHÍ'],
                [''],
                ['Hướng dẫn sử dụng:'],
                ['1. Điền thông tin vào sheet "Dữ liệu nhập"'],
                ['2. Các cột có dấu (*) là BẮT BUỘC'],
                ['3. Xem sheet "Hướng dẫn chi tiết" để biết thêm thông tin'],
                ['4. Xem danh sách Tiêu chuẩn ở sheet tương ứng'],
                ['5. Sau khi điền xong, lưu file và import vào hệ thống'],
                [''],
                ['Lưu ý:'],
                ['- Mã tiêu chí phải là số từ 1-99 (VD: 1, 01, 12)'],
                ['- Mã tiêu chuẩn phải TỒN TẠI trong hệ thống'],
                ['- Không được để trống các trường bắt buộc'],
                [''],
                ['Ngày tạo:', new Date().toLocaleDateString('vi-VN')],
            ]

            const wsIntro = XLSX.utils.aoa_to_sheet(introData)
            wsIntro['!cols'] = [{ wch: 80 }]

            if (wsIntro['A2']) wsIntro['A2'].s = { font: { bold: true, sz: 16, color: { rgb: "1F4E78" } }, alignment: { horizontal: "center" } }
            if (wsIntro['A3']) wsIntro['A3'].s = { font: { bold: true, sz: 14, color: { rgb: "E26B0A" } }, alignment: { horizontal: "center" } }

            XLSX.utils.book_append_sheet(wb, wsIntro, 'Giới thiệu')

            // ===== SHEET 2: Dữ liệu nhập =====
            const templateData = [
                {
                    'Mã tiêu chí (*)': '1',
                    'Tên tiêu chí (*)': 'Mục tiêu chương trình đào tạo được xây dựng phù hợp',
                    'Mô tả': 'Mục tiêu thể hiện rõ định hướng phát triển và đáp ứng yêu cầu của xã hội',
                    'Mã tiêu chuẩn (*)': '1',
                    'Thứ tự': '1',
                    'Yêu cầu': 'Có văn bản mô tả mục tiêu rõ ràng, có sự tham gia của các bên liên quan',
                    'Hướng dẫn': 'Kiểm tra tính nhất quán giữa mục tiêu với sứ mệnh và tầm nhìn'
                }
            ]

            const wsData = XLSX.utils.json_to_sheet(templateData)

            wsData['!cols'] = [
                { wch: 12 },  // Mã
                { wch: 55 },  // Tên
                { wch: 60 },  // Mô tả
                { wch: 15 },  // Mã tiêu chuẩn
                { wch: 10 },  // Thứ tự
                { wch: 50 },  // Yêu cầu
                { wch: 50 }   // Hướng dẫn
            ]

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

            const range = XLSX.utils.decode_range(wsData['!ref'])
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1"
                if (!wsData[address]) continue
                wsData[address].s = headerStyle
            }

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

            wsData['!rows'] = [{ hpt: 30 }]

            XLSX.utils.book_append_sheet(wb, wsData, 'Dữ liệu nhập')

            // ===== SHEET 3: Hướng dẫn chi tiết =====
            const instructionData = [
                {
                    'Tên cột': 'Mã tiêu chí (*)',
                    'Kiểu dữ liệu': 'Số',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Mã số tiêu chí, từ 1-99. Hệ thống tự động thêm số 0 ở đầu nếu là 1 chữ số',
                    'Ví dụ hợp lệ': '1, 01, 12, 25',
                    'Ví dụ không hợp lệ': 'TC1 (chứa chữ), 100 (vượt quá 99)'
                },
                {
                    'Tên cột': 'Tên tiêu chí (*)',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Tên đầy đủ của tiêu chí đánh giá, tối đa 500 ký tự',
                    'Ví dụ hợp lệ': 'Mục tiêu được xây dựng phù hợp',
                    'Ví dụ không hợp lệ': ''
                },
                {
                    'Tên cột': 'Mô tả',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Mô tả chi tiết về tiêu chí, tối đa 3000 ký tự',
                    'Ví dụ hợp lệ': 'Mục tiêu thể hiện rõ định hướng phát triển...',
                    'Ví dụ không hợp lệ': ''
                },
                {
                    'Tên cột': 'Mã tiêu chuẩn (*)',
                    'Kiểu dữ liệu': 'Số',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Mã tiêu chuẩn cha đã được tạo trong hệ thống. Xem sheet "DS Tiêu chuẩn"',
                    'Ví dụ hợp lệ': '1, 01, 02',
                    'Ví dụ không hợp lệ': '100 (chưa tồn tại)'
                },
                {
                    'Tên cột': 'Thứ tự',
                    'Kiểu dữ liệu': 'Số',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Thứ tự hiển thị của tiêu chí, phải là số nguyên dương. Mặc định là 1',
                    'Ví dụ hợp lệ': '1, 2, 3, 10',
                    'Ví dụ không hợp lệ': '-1, 0, 1.5'
                },
                {
                    'Tên cột': 'Yêu cầu',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Yêu cầu của tiêu chí, tối đa 2000 ký tự',
                    'Ví dụ hợp lệ': 'Có văn bản mô tả mục tiêu rõ ràng',
                    'Ví dụ không hợp lệ': ''
                },
                {
                    'Tên cột': 'Hướng dẫn',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Hướng dẫn đánh giá tiêu chí, tối đa 3000 ký tự',
                    'Ví dụ hợp lệ': 'Kiểm tra tính nhất quán...',
                    'Ví dụ không hợp lệ': ''
                }
            ]

            const wsInstruction = XLSX.utils.json_to_sheet(instructionData)
            wsInstruction['!cols'] = [
                { wch: 25 },
                { wch: 15 },
                { wch: 10 },
                { wch: 60 },
                { wch: 35 },
                { wch: 35 }
            ]

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

            // ===== SHEET 4: DS Tiêu chuẩn =====
            const standardsData = standards.length > 0 ? standards.map(s => ({
                'Mã tiêu chuẩn': s.code,
                'Tên tiêu chuẩn': s.name,
                'Chương trình': s.programId?.name || '',
                'Tổ chức': s.organizationId?.name || ''
            })) : [{
                'Mã tiêu chuẩn': 'Không có dữ liệu',
                'Tên tiêu chuẩn': programId ? 'Không có tiêu chuẩn cho chương trình này' : 'Vui lòng chọn chương trình để xem danh sách',
                'Chương trình': '',
                'Tổ chức': ''
            }]

            const wsStandardsList = XLSX.utils.json_to_sheet(standardsData)
            wsStandardsList['!cols'] = [{ wch: 15 }, { wch: 50 }, { wch: 35 }, { wch: 30 }]

            XLSX.utils.book_append_sheet(wb, wsStandardsList, 'DS Tiêu chuẩn')

            // ===== SHEET 5: Lỗi thường gặp =====
            const errorsData = [
                {
                    'STT': '1',
                    'Lỗi': 'Mã tiêu chí đã tồn tại',
                    'Nguyên nhân': 'Mã tiêu chí bị trùng trong cùng tiêu chuẩn',
                    'Cách khắc phục': 'Thay đổi mã tiêu chí thành mã khác'
                },
                {
                    'STT': '2',
                    'Lỗi': 'Mã tiêu chí không hợp lệ',
                    'Nguyên nhân': 'Mã không phải là số hoặc vượt quá 99',
                    'Cách khắc phục': 'Nhập mã là số từ 1-99'
                },
                {
                    'STT': '3',
                    'Lỗi': 'Thiếu trường bắt buộc',
                    'Nguyên nhân': 'Không điền đủ các trường có dấu (*)',
                    'Cách khắc phục': 'Điền đầy đủ: Mã tiêu chí, Tên tiêu chí, Mã tiêu chuẩn'
                },
                {
                    'STT': '4',
                    'Lỗi': 'Tiêu chuẩn không tồn tại',
                    'Nguyên nhân': 'Mã tiêu chuẩn chưa được tạo trong hệ thống',
                    'Cách khắc phục': 'Tạo tiêu chuẩn trước hoặc sử dụng mã đã có trong sheet "DS Tiêu chuẩn"'
                },
                {
                    'STT': '5',
                    'Lỗi': 'Vượt quá độ dài cho phép',
                    'Nguyên nhân': 'Nội dung vượt quá số ký tự quy định',
                    'Cách khắc phục': 'Rút gọn: Tên (500 ký tự), Mô tả (3000 ký tự), Yêu cầu (2000 ký tự)'
                }
            ]

            const wsErrors = XLSX.utils.json_to_sheet(errorsData)
            wsErrors['!cols'] = [
                { wch: 5 },
                { wch: 30 },
                { wch: 45 },
                { wch: 60 }
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

            XLSX.writeFile(wb, 'Mau_import_tieu_chi.xlsx')
            toast.success('Đã tải file mẫu thành công')
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
                'Trạng thái': getStatusLabel(c.status),
                'Người tạo': c.createdBy?.fullName || '',
                'Ngày tạo': formatDate(c.createdAt)
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            ws['!cols'] = [
                { wch: 5 },   // STT
                { wch: 10 },  // Mã
                { wch: 55 },  // Tên
                { wch: 60 },  // Mô tả
                { wch: 40 },  // Tiêu chuẩn
                { wch: 35 },  // Chương trình
                { wch: 8 },   // Thứ tự
                { wch: 12 },  // Trạng thái
                { wch: 25 },  // Người tạo
                { wch: 12 }   // Ngày tạo
            ]

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
            const errorMsg = error.response?.data?.message || 'Import thất bại'
            const details = error.response?.data?.details

            if (details && Array.isArray(details)) {
                const errorList = details.map((err, idx) =>
                    `\n${idx + 1}. Dòng ${err.row}: ${err.field ? `[${err.field}] ` : ''}${err.message}`
                ).join('')
                toast.error(`${errorMsg}${errorList}`, {
                    duration: 8000,
                    style: { maxWidth: '600px' }
                })
            } else {
                toast.error(errorMsg, { duration: 5000 })
            }
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
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
                        ) : criteria.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
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