import { useState, useEffect } from 'react'
import { Building, Plus, Search, Download, Upload, Edit2, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import * as XLSX from 'xlsx'
import ImportExcelModal from './ImportExcelModal'
import OrganizationModal from './OrganizationModal'

export default function OrganizationsList() {
    const [organizations, setOrganizations] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('')
    const [showImportModal, setShowImportModal] = useState(false)
    const [showOrgModal, setShowOrgModal] = useState(false)
    const [selectedOrg, setSelectedOrg] = useState(null)

    useEffect(() => {
        loadOrganizations()
    }, [pagination.current, search, status])

    const loadOrganizations = async () => {
        try {
            setLoading(true)
            const params = {
                page: pagination.current,
                limit: 10
            };

            if (search) params.search = search;
            if (status) params.status = status;

            const response = await apiMethods.organizations.getAll(params);

            if (response.data.success) {
                setOrganizations(response.data.data.organizations)
                setPagination(response.data.data.pagination)
            }
        } catch (error) {
            toast.error('Không thể tải danh sách tổ chức')
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
                ['FILE MẪU IMPORT TỔ CHỨC - CẤP ĐÁNH GIÁ'],
                [''],
                ['Hướng dẫn sử dụng:'],
                ['1. Điền thông tin vào sheet "Dữ liệu nhập"'],
                ['2. Các cột có dấu (*) là BẮT BUỘC'],
                ['3. Xem sheet "Hướng dẫn chi tiết" để biết thêm thông tin'],
                ['4. Sau khi điền xong, lưu file và import vào hệ thống'],
                [''],
                ['Lưu ý:'],
                ['- Mã tổ chức phải VIẾT HOA, chỉ chứa chữ cái, số, gạch ngang (-)'],
                ['- Email và số điện thoại phải đúng định dạng'],
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
                    'Mã tổ chức (*)': 'MOET',
                    'Tên tổ chức (*)': 'Bộ Giáo dục và Đào tạo',
                    'Mô tả': 'Cơ quan quản lý nhà nước về giáo dục và đào tạo',
                    'Website': 'https://moet.gov.vn',
                    'Email liên hệ': 'contact@moet.gov.vn',
                    'Số điện thoại': '024 3869 8113',
                    'Địa chỉ': '49 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
                    'Quốc gia': 'Vietnam'
                }
            ]

            const wsData = XLSX.utils.json_to_sheet(templateData)

            wsData['!cols'] = [
                { wch: 15 },  // Mã
                { wch: 40 },  // Tên
                { wch: 50 },  // Mô tả
                { wch: 25 },  // Website
                { wch: 25 },  // Email
                { wch: 15 },  // Phone
                { wch: 45 },  // Địa chỉ
                { wch: 15 }   // Quốc gia
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
                    'Tên cột': 'Mã tổ chức (*)',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Mã tổ chức phải VIẾT HOA, tối đa 20 ký tự, chỉ chứa chữ cái (A-Z), số (0-9), dấu gạch ngang (-) và gạch dưới (_)',
                    'Ví dụ hợp lệ': 'MOET, BGD-DT, ABET',
                    'Ví dụ không hợp lệ': 'moet (chữ thường), BGD DT (có dấu cách)'
                },
                {
                    'Tên cột': 'Tên tổ chức (*)',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Có',
                    'Mô tả chi tiết': 'Tên đầy đủ của tổ chức, tối đa 300 ký tự',
                    'Ví dụ hợp lệ': 'Bộ Giáo dục và Đào tạo',
                    'Ví dụ không hợp lệ': ''
                },
                {
                    'Tên cột': 'Mô tả',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Mô tả chi tiết về tổ chức, chức năng nhiệm vụ. Tối đa 2000 ký tự',
                    'Ví dụ hợp lệ': 'Cơ quan quản lý nhà nước về giáo dục',
                    'Ví dụ không hợp lệ': ''
                },
                {
                    'Tên cột': 'Website',
                    'Kiểu dữ liệu': 'URL',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Địa chỉ website của tổ chức, phải bắt đầu bằng http:// hoặc https://',
                    'Ví dụ hợp lệ': 'https://moet.gov.vn',
                    'Ví dụ không hợp lệ': 'moet.gov.vn (thiếu https://)'
                },
                {
                    'Tên cột': 'Email liên hệ',
                    'Kiểu dữ liệu': 'Email',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Email liên hệ chính thức của tổ chức',
                    'Ví dụ hợp lệ': 'contact@moet.gov.vn',
                    'Ví dụ không hợp lệ': 'contact@moet (thiếu domain đầy đủ)'
                },
                {
                    'Tên cột': 'Số điện thoại',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Số điện thoại liên hệ, có thể chứa số, dấu cách, dấu gạch ngang, dấu ngoặc',
                    'Ví dụ hợp lệ': '024 3869 8113, (024) 3869-8113',
                    'Ví dụ không hợp lệ': 'abc123 (chứa chữ cái)'
                },
                {
                    'Tên cột': 'Địa chỉ',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Địa chỉ trụ sở chính của tổ chức. Tối đa 500 ký tự',
                    'Ví dụ hợp lệ': '49 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
                    'Ví dụ không hợp lệ': ''
                },
                {
                    'Tên cột': 'Quốc gia',
                    'Kiểu dữ liệu': 'Văn bản',
                    'Bắt buộc': 'Không',
                    'Mô tả chi tiết': 'Tên quốc gia. Mặc định là Vietnam nếu không điền',
                    'Ví dụ hợp lệ': 'Vietnam, Thailand, Singapore',
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

            // ===== SHEET 4: Lỗi thường gặp =====
            const errorsData = [
                {
                    'STT': '1',
                    'Lỗi': 'Mã tổ chức đã tồn tại',
                    'Nguyên nhân': 'Mã tổ chức bị trùng với mã đã có trong hệ thống',
                    'Cách khắc phục': 'Thay đổi mã tổ chức thành mã khác chưa sử dụng'
                },
                {
                    'STT': '2',
                    'Lỗi': 'Mã tổ chức không hợp lệ',
                    'Nguyên nhân': 'Mã chứa ký tự đặc biệt hoặc chữ thường',
                    'Cách khắc phục': 'Chỉ sử dụng chữ HOA, số, dấu gạch ngang (-) và gạch dưới (_)'
                },
                {
                    'STT': '3',
                    'Lỗi': 'Thiếu trường bắt buộc',
                    'Nguyên nhân': 'Không điền đủ các trường có dấu (*)',
                    'Cách khắc phục': 'Điền đầy đủ: Mã tổ chức, Tên tổ chức'
                },
                {
                    'STT': '4',
                    'Lỗi': 'Email không hợp lệ',
                    'Nguyên nhân': 'Email sai định dạng',
                    'Cách khắc phục': 'Nhập email đúng định dạng: example@domain.com'
                },
                {
                    'STT': '5',
                    'Lỗi': 'Website không hợp lệ',
                    'Nguyên nhân': 'URL không bắt đầu bằng http:// hoặc https://',
                    'Cách khắc phục': 'Thêm https:// vào đầu URL'
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

            XLSX.writeFile(wb, 'Mau_import_to_chuc.xlsx')
            toast.success('Đã tải file mẫu thành công')
        } catch (error) {
            toast.error('Có lỗi khi tạo file mẫu')
            console.error(error)
        }
    }

    const handleExportExcel = () => {
        try {
            const exportData = organizations.map((org, index) => ({
                'STT': index + 1,
                'Mã tổ chức': org.code,
                'Tên tổ chức': org.name,
                'Mô tả': org.description || '',
                'Website': org.website || '',
                'Email': org.contactEmail || '',
                'Điện thoại': org.contactPhone || '',
                'Địa chỉ': org.address || '',
                'Quốc gia': org.country || 'Vietnam',
                'Trạng thái': getStatusLabel(org.status),
                'Người tạo': org.createdBy?.fullName || '',
                'Ngày tạo': formatDate(org.createdAt)
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            ws['!cols'] = [
                { wch: 5 },   // STT
                { wch: 15 },  // Mã
                { wch: 40 },  // Tên
                { wch: 50 },  // Mô tả
                { wch: 25 },  // Website
                { wch: 25 },  // Email
                { wch: 15 },  // Phone
                { wch: 40 },  // Địa chỉ
                { wch: 15 },  // Quốc gia
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

            XLSX.utils.book_append_sheet(wb, ws, 'Tổ chức')
            XLSX.writeFile(wb, `Danh_sach_to_chuc_${Date.now()}.xlsx`)
            toast.success('Xuất file thành công')
        } catch (error) {
            toast.error('Có lỗi khi xuất file')
        }
    }

    const handleImport = async (file) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await apiMethods.organizations.import?.(formData) ||
                await apiMethods.organizations.bulkImport?.(formData)

            if (response.data.success) {
                toast.success(`Import thành công ${response.data.data.success} tổ chức`)
                loadOrganizations()
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
        if (!confirm('Bạn có chắc muốn xóa tổ chức này?')) return

        try {
            await apiMethods.organizations.delete(id)
            toast.success('Xóa thành công')
            loadOrganizations()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xóa thất bại')
        }
    }

    const getStatusLabel = (status) => {
        const statuses = {
            active: 'Hoạt động',
            inactive: 'Không hoạt động',
            suspended: 'Tạm ngưng'
        }
        return statuses[status] || status
    }

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-red-100 text-red-700',
            suspended: 'bg-yellow-100 text-yellow-700'
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Tổ chức</h1>
                    <p className="text-gray-600 mt-1">Quản lý các tổ chức - cấp đánh giá</p>
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
                            setSelectedOrg(null)
                            setShowOrgModal(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Thêm tổ chức
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
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                        <option value="suspended">Tạm ngưng</option>
                    </select>

                    <button
                        onClick={loadOrganizations}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên tổ chức</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên hệ</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <div className="flex justify-center">
                                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : organizations.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    Không có dữ liệu
                                </td>
                            </tr>
                        ) : (
                            organizations.map((org) => (
                                <tr key={org._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">{org.code}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                                        {org.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-md">
                                                {org.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(org.status)}`}>
                                            {getStatusLabel(org.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {org.contactEmail && (
                                            <div className="text-sm text-gray-900">{org.contactEmail}</div>
                                        )}
                                        {org.contactPhone && (
                                            <div className="text-sm text-gray-500">{org.contactPhone}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedOrg(org)
                                                    setShowOrgModal(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(org._id)}
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
                {!loading && organizations.length > 0 && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{organizations.length}</span> trong tổng số{' '}
                            <span className="font-medium">{pagination.total}</span> tổ chức
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
                    title="Import Tổ chức"
                />
            )}

            {showOrgModal && (
                <OrganizationModal
                    organization={selectedOrg}
                    onClose={() => {
                        setShowOrgModal(false)
                        setSelectedOrg(null)
                    }}
                    onSuccess={() => {
                        loadOrganizations()
                        setShowOrgModal(false)
                        setSelectedOrg(null)
                    }}
                />
            )}
        </div>
    )
}