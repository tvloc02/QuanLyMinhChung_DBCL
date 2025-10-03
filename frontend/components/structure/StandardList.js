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
                setPrograms(response.data.data.programs || response.data.data || [])
            }
        } catch (error) {
            console.error('Load programs error:', error)
        }
    }

    const loadOrganizations = async () => {
        try {
            const response = await apiMethods.organizations.getAll({ status: 'active', limit: 100 })
            if (response.data.success) {
                setOrganizations(response.data.data.organizations || response.data.data || [])
            }
        } catch (error) {
            console.error('Load organizations error:', error)
        }
    }

    const loadStandards = async () => {
        try {
            setLoading(true)
            const params = {
                page: pagination.current,
                limit: 10
            };

            if (search) params.search = search;
            if (programId) params.programId = programId;
            if (organizationId) params.organizationId = organizationId;
            if (status) params.status = status;

            const response = await apiMethods.standards.getAll(params);

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
            const wb = XLSX.utils.book_new()

            // ===== SHEET 1: Giới thiệu =====
            const introData = [
                [''],
                ['HỆ THỐNG QUẢN LÝ ĐÁNH GIÁ CHẤT LƯỢNG'],
                ['FILE MẪU IMPORT TIÊU CHUẨN'],
                [''],
                ['Hướng dẫn sử dụng:'],
                ['1. Điền thông tin vào sheet "Dữ liệu nhập"'],
                ['2. Các cột có dấu (*) là BẮT BUỘC'],
                ['3. Xem sheet "Hướng dẫn chi tiết" để biết thêm thông tin'],
                ['4. Xem danh sách Chương trình và Tổ chức ở các sheet tương ứng'],
                ['5. Sau khi điền xong, lưu file và import vào hệ thống'],
                [''],
                ['Lưu ý:'],
                ['- Mã tiêu chuẩn phải là số từ 1-99 (VD: 1, 01, 12)'],
                ['- Mã chương trình và Mã tổ chức phải TỒN TẠI trong hệ thống'],
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
                    'Mã tiêu chuẩn (*)': '1',
                    'Tên tiêu chuẩn (*)': 'Mục tiêu chương trình đào tạo',
                    'Mã chương trình (*)': 'DGCL-DH',
                    'Mã tổ chức (*)': 'MOET',
                    'Mục tiêu': 'Đánh giá tính phù hợp và khả thi của mục tiêu chương trình đào tạo',
                }
            ]

            const wsData = XLSX.utils.json_to_sheet(templateData)

            wsData['!cols'] = [
                { wch: 15 },  // Mã
                { wch: 50 },  // Tên
                { wch: 18 },  // Mã chương trình
                { wch: 15 },  // Mã tổ chức
                { wch: 45 },  // Mục tiêu
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
                    'Tên cột': 'Mã tiêu chuẩn (*)',
                    'Kiểu dữ liệu': 'Số',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Mã số tiêu chuẩn, từ 1-99. Hệ thống tự động thêm số 0 ở đầu nếu là 1 chữ số',
                    'Ví dụ hợp lệ': '1, 01, 12, 25',
                    'Ví dụ không hợp lệ': 'TC1 (chứa chữ), 100 (vượt quá 99)'
                },
                {
                    'Tên cột': 'Tên tiêu chuẩn (*)',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Tên đầy đủ của tiêu chuẩn đánh giá, tối đa 500 ký tự',
                    'Ví dụ hợp lệ': 'Mục tiêu chương trình đào tạo',
                    'Ví dụ không hợp lệ': ''
                },
                {
                    'Tên cột': 'Mã chương trình (*)',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Mã chương trình đánh giá đã được tạo trong hệ thống. Xem sheet "DS Chương trình"',
                    'Ví dụ hợp lệ': 'DGCL-DH, KĐCLGD',
                    'Ví dụ không hợp lệ': 'ABC (chưa tồn tại trong hệ thống)'
                },
                {
                    'Tên cột': 'Mã tổ chức (*)',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Mã tổ chức đánh giá đã được tạo trong hệ thống. Xem sheet "DS Tổ chức"',
                    'Ví dụ hợp lệ': 'MOET, ABET',
                    'Ví dụ không hợp lệ': 'XYZ (chưa tồn tại trong hệ thống)'
                },
                {
                    'Tên cột': 'Mục tiêu',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Mục tiêu của tiêu chuẩn, tối đa 2000 ký tự',
                    'Ví dụ hợp lệ': 'Đánh giá tính phù hợp của mục tiêu',
                    'Ví dụ không hợp lệ': ''
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

            // ===== SHEET 4: DS Chương trình =====
            const programsData = programs.length > 0 ? programs.map(p => ({
                'Mã chương trình': p.code,
                'Tên chương trình': p.name
            })) : [{
                'Mã chương trình': 'Không có dữ liệu',
                'Tên chương trình': 'Vui lòng tạo chương trình trước khi import tiêu chuẩn'
            }]

            const wsProgramsList = XLSX.utils.json_to_sheet(programsData)
            wsProgramsList['!cols'] = [{ wch: 20 }, { wch: 60 }]

            XLSX.utils.book_append_sheet(wb, wsProgramsList, 'DS Chương trình')

            // ===== SHEET 5: DS Tổ chức =====
            const orgsData = organizations.length > 0 ? organizations.map(o => ({
                'Mã tổ chức': o.code,
                'Tên tổ chức': o.name
            })) : [{
                'Mã tổ chức': 'Không có dữ liệu',
                'Tên tổ chức': 'Vui lòng tạo tổ chức trước khi import tiêu chuẩn'
            }]

            const wsOrgsList = XLSX.utils.json_to_sheet(orgsData)
            wsOrgsList['!cols'] = [{ wch: 20 }, { wch: 60 }]

            XLSX.utils.book_append_sheet(wb, wsOrgsList, 'DS Tổ chức')

            // ===== SHEET 6: Lỗi thường gặp =====
            const errorsData = [
                {
                    'STT': '1',
                    'Lỗi': 'Mã tiêu chuẩn đã tồn tại',
                    'Nguyên nhân': 'Mã tiêu chuẩn bị trùng trong cùng chương trình và tổ chức',
                    'Cách khắc phục': 'Thay đổi mã tiêu chuẩn thành mã khác'
                },
                {
                    'STT': '2',
                    'Lỗi': 'Mã tiêu chuẩn không hợp lệ',
                    'Nguyên nhân': 'Mã không phải là số hoặc vượt quá 99',
                    'Cách khắc phục': 'Nhập mã là số từ 1-99'
                },
                {
                    'STT': '3',
                    'Lỗi': 'Thiếu trường bắt buộc',
                    'Nguyên nhân': 'Không điền đủ các trường có dấu (*)',
                    'Cách khắc phục': 'Điền đầy đủ: Mã tiêu chuẩn, Tên, Mã chương trình, Mã tổ chức'
                },
                {
                    'STT': '4',
                    'Lỗi': 'Chương trình không tồn tại',
                    'Nguyên nhân': 'Mã chương trình chưa được tạo trong hệ thống',
                    'Cách khắc phục': 'Tạo chương trình trước hoặc sử dụng mã đã có trong sheet "DS Chương trình"'
                },
                {
                    'STT': '5',
                    'Lỗi': 'Tổ chức không tồn tại',
                    'Nguyên nhân': 'Mã tổ chức chưa được tạo trong hệ thống',
                    'Cách khắc phục': 'Tạo tổ chức trước hoặc sử dụng mã đã có trong sheet "DS Tổ chức"'
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

            XLSX.writeFile(wb, 'Mau_import_tieu_chuan.xlsx')
            toast.success('Đã tải file mẫu thành công')
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
                'Chương trình': std.programId?.name || '',
                'Tổ chức': std.organizationId?.name || '',
                'Trạng thái': getStatusLabel(std.status),
                'Người tạo': std.createdBy?.fullName || '',
                'Ngày tạo': formatDate(std.createdAt)
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            ws['!cols'] = [
                { wch: 5 },   // STT
                { wch: 10 },  // Mã
                { wch: 50 },  // Tên
                { wch: 35 },  // Chương trình
                { wch: 30 },  // Tổ chức
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
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
                        ) : standards.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
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