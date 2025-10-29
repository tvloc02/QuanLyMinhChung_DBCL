import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Download, Upload, Edit2, Trash2, RefreshCw, CheckSquare, Filter, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import * as XLSX from 'xlsx'
import ImportExcelModal from './ImportExcelModal'
import CriteriaModal from './CriteriaModal'
import { ActionButton } from '../ActionButtons'

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
            setStandardId('')
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
            if (!programId) return

            const response = await apiMethods.standards.getAll({
                programId,
                status: 'active',
                limit: 100
            })
            if (response.data.success) {
                // Ensure the list contains only objects with _id and name
                setStandards((response.data.data.standards || response.data.data || []).filter(s => s._id))
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
                    'Ví dụ hợp lệ': '1, 01, 12, 25, 99',
                    'Ví dụ không hợp lệ': 'TC1 (chứa chữ), 100 (vượt quá 99), 1.01 (có dấu chấm)'
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
                    'Tên cột': 'Mã tiêu chuẩn (*)',
                    'Kiểu dữ liệu': 'Số',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Mã tiêu chuẩn cha đã được tạo trong hệ thống. Xem sheet "DS Tiêu chuẩn"',
                    'Ví dụ hợp lệ': '1, 01, 02, 10',
                    'Ví dụ không hợp lệ': '100 (chưa tồn tại)'
                },

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
                    'Cách khắc phục': 'Thay đổi mã tiêu chí thành mã khác (VD: 1 -> 2)'
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
                'Tiêu chuẩn': `${c.standardId?.code} - ${c.standardId?.name}` || '',
                'Chương trình': c.programId?.name || '',
                'Trạng thái': getStatusLabel(c.status),
                'Người tạo': c.createdBy?.fullName || '',
                'Ngày tạo': formatDate(c.createdAt)
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            ws['!cols'] = [
                { wch: 5 },   // STT
                { wch: 12 },  // Mã
                { wch: 55 },  // Tên
                { wch: 50 },  // Tiêu chuẩn
                { wch: 35 },  // Chương trình
                { wch: 12 },  // Trạng thái
                { wch: 25 },  // Người tạo
                { wch: 12 }   // Ngày tạo
            ]

            const range = XLSX.utils.decode_range(ws['!ref'])
            // Custom header style (Báo cáo style: rgb 1F4E78 - dark blue)
            const customHeaderStyle = {
                fill: { fgColor: { rgb: "1F4E78" } },
                font: { bold: true, color: { rgb: "FFFFFF" } },
                alignment: { horizontal: "center", vertical: "center" }
            }

            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_col(C) + "1"
                if (!ws[address]) continue
                ws[address].s = customHeaderStyle
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

    // Hàm giả lập xem chi tiết
    const handleViewDetail = (item) => {
        setSelectedCriteria({ ...item, isViewMode: true })
        setShowCriteriaModal(true)
    }

    // Hàm mở modal chỉnh sửa
    const handleEdit = (item) => {
        setSelectedCriteria(item)
        setShowCriteriaModal(true)
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
            {/* Header với gradient - Xanh Lam */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <CheckSquare className="w-9 h-9 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Quản lý Tiêu chí</h1>
                            <p className="text-blue-100">Quản lý các tiêu chí đánh giá chất lượng</p>
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
                                setSelectedCriteria(null)
                                setShowCriteriaModal(true)
                            }}
                            className="px-6 py-2.5 bg-white text-blue-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold"
                        >
                            <Plus size={20} />
                            Thêm tiêu chí
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tiêu chí..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <select
                        value={programId}
                        onChange={(e) => {
                            setProgramId(e.target.value)
                            setStandardId('')
                        }}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                        <option value="">Tất cả chương trình</option>
                        {programs.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        value={standardId}
                        onChange={(e) => setStandardId(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={!programId}
                    >
                        <option value="">Tất cả tiêu chuẩn</option>
                        {standards.map(s => (
                            <option key={s._id} value={s._id}>
                                {s.code} - {s.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="draft">Nháp</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                        <option value="archived">Lưu trữ</option>
                    </select>

                    <button
                        onClick={loadCriteria}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                        <RefreshCw size={18} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gradient-to-r from-blue-50 to-sky-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-16">STT</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-24">Mã</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 min-w-[200px]">Tên tiêu chí</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-60">Tiêu chuẩn</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-b-2 border-blue-200 w-32">Trạng thái</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-blue-200 w-48">Thao tác</th>
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
                        ) : criteria.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <CheckSquare className="w-16 h-16 text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium text-lg">Không có dữ liệu</p>
                                        <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc thêm tiêu chí mới</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            criteria.map((item, index) => (
                                <tr key={item._id} className="hover:bg-blue-50 transition-colors border-b border-gray-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                                        {((pagination.current - 1) * 10) + index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                        <span className="px-3 py-1 text-sm font-bold text-blue-700 bg-blue-100 rounded-lg border border-blue-200">
                                            {item.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 border-r border-gray-200">
                                        <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                                        {item.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-md mt-1">
                                                {item.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 border-r border-gray-200">
                                        <div className="text-sm text-gray-900">
                                            <span className="font-bold text-indigo-600">{item.standardId?.code}</span>
                                            {' - '}
                                            <span className="text-gray-700">{item.standardId?.name || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${getStatusColor(item.status)}`}>
                                            {getStatusLabel(item.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* ActionButton cho Xem chi tiết */}
                                            <ActionButton
                                                icon={Eye}
                                                variant="view"
                                                size="sm"
                                                onClick={() => handleViewDetail(item)}
                                                title="Xem chi tiết tiêu chí"
                                            />
                                            {/* ActionButton cho Chỉnh sửa */}
                                            <ActionButton
                                                icon={Edit2}
                                                variant="edit"
                                                size="sm"
                                                onClick={() => handleEdit(item)}
                                                title="Chỉnh sửa tiêu chí"
                                            />
                                            {/* ActionButton cho Xóa */}
                                            <ActionButton
                                                icon={Trash2}
                                                variant="delete"
                                                size="sm"
                                                onClick={() => handleDelete(item._id)}
                                                title="Xóa tiêu chí"
                                            />
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
                    <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-t-2 border-blue-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-bold text-blue-600">{criteria.length}</span> trong tổng số{' '}
                            <span className="font-bold text-blue-600">{pagination.total}</span> tiêu chí
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                                disabled={!pagination.hasPrev}
                                className="px-4 py-2 border-2 border-blue-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                                disabled={!pagination.hasNext}
                                className="px-4 py-2 border-2 border-blue-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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