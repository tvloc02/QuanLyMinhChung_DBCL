import { useState, useEffect } from 'react'
import { Building2, Plus, Search, Download, Upload, Edit2, Trash2, RefreshCw, Filter, Mail, Phone } from 'lucide-react'
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
                { wch: 15 },
                { wch: 40 },
                { wch: 50 },
                { wch: 25 },
                { wch: 25 },
                { wch: 15 },
                { wch: 45 },
                { wch: 15 }
            ]

            XLSX.utils.book_append_sheet(wb, wsData, 'Dữ liệu nhập')

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
                'Email': org.contactEmail || '',
                'Điện thoại': org.contactPhone || '',
                'Trạng thái': getStatusLabel(org.status),
                'Người tạo': org.createdBy?.fullName || '',
                'Ngày tạo': formatDate(org.createdAt)
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            ws['!cols'] = [
                { wch: 5 },
                { wch: 15 },
                { wch: 40 },
                { wch: 25 },
                { wch: 15 },
                { wch: 12 },
                { wch: 25 },
                { wch: 12 }
            ]

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
            active: 'bg-green-100 text-green-700 border border-green-300',
            inactive: 'bg-red-100 text-red-700 border border-red-300',
            suspended: 'bg-yellow-100 text-yellow-700 border border-yellow-300'
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
    }

    return (
        <div className="space-y-6">
            {/* Header với gradient */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Building2 className="w-9 h-9 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Quản lý Tổ chức</h1>
                            <p className="text-green-100">Quản lý các tổ chức - cấp đánh giá</p>
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
                                setSelectedOrg(null)
                                setShowOrgModal(true)
                            }}
                            className="px-6 py-2.5 bg-white text-green-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold"
                        >
                            <Plus size={20} />
                            Thêm tổ chức
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tổ chức..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                        <option value="">⚡ Tất cả trạng thái</option>
                        <option value="active">✅ Hoạt động</option>
                        <option value="inactive">⏸️ Không hoạt động</option>
                        <option value="suspended">🔒 Tạm ngưng</option>
                    </select>

                    <button
                        onClick={loadOrganizations}
                        className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 font-medium"
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
                        <thead className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Mã</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Tên tổ chức</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-green-700 uppercase tracking-wider">Liên hệ</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-green-700 uppercase tracking-wider">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : organizations.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <Building2 className="w-16 h-16 text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium text-lg">Không có dữ liệu</p>
                                        <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc thêm tổ chức mới</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            organizations.map((org) => (
                                <tr key={org._id} className="hover:bg-green-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 text-sm font-bold text-green-700 bg-green-100 rounded-lg">
                                            {org.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900">{org.name}</div>
                                        {org.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-md mt-1">
                                                {org.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${getStatusColor(org.status)}`}>
                                            {getStatusLabel(org.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {org.contactEmail && (
                                            <div className="flex items-center text-sm text-gray-900 mb-1">
                                                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                                {org.contactEmail}
                                            </div>
                                        )}
                                        {org.contactPhone && (
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                                {org.contactPhone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedOrg(org)
                                                    setShowOrgModal(true)
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(org._id)}
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
                {!loading && organizations.length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-t-2 border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-bold text-green-600">{organizations.length}</span> trong tổng số{' '}
                            <span className="font-bold text-green-600">{pagination.total}</span> tổ chức
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