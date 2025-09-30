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
    const [level, setLevel] = useState('')
    const [type, setType] = useState('')
    const [status, setStatus] = useState('')

    const [showImportModal, setShowImportModal] = useState(false)
    const [showOrgModal, setShowOrgModal] = useState(false)
    const [selectedOrg, setSelectedOrg] = useState(null)

    useEffect(() => {
        loadOrganizations()
    }, [pagination.current, search, level, type, status])

    const loadOrganizations = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.organizations.getAll({
                page: pagination.current,
                limit: 10,
            })

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
            const templateData = [
                {
                    'Mã tổ chức (*)': 'MOET',
                    'Tên tổ chức (*)': 'Bộ Giáo dục và Đào tạo',
                    'Mô tả': 'Cơ quan quản lý nhà nước về giáo dục',
                    'Cấp độ (*)': 'national',
                    'Loại (*)': 'government',
                    'Website': 'https://moet.gov.vn',
                    'Email liên hệ': 'contact@moet.gov.vn',
                    'Số điện thoại': '0243 869 8113',
                    'Địa chỉ': '49 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
                    'Quốc gia': 'Vietnam'
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
                    fill: { fgColor: { rgb: "4472C4" } },
                    font: { bold: true, color: { rgb: "FFFFFF" } },
                    alignment: { horizontal: "center", vertical: "center" }
                }
            }

            ws['!cols'] = [
                { wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 15 }, { wch: 15 },
                { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 40 }, { wch: 15 }
            ]

            // Sheet hướng dẫn
            const instructionData = [
                { 'Cột': 'Mã tổ chức (*)', 'Mô tả': 'Mã viết tắt (chữ hoa, số, gạch ngang)', 'Ví dụ': 'MOET' },
                { 'Cột': 'Tên tổ chức (*)', 'Mô tả': 'Tên đầy đủ của tổ chức', 'Ví dụ': 'Bộ Giáo dục và Đào tạo' },
                { 'Cột': 'Mô tả', 'Mô tả': 'Mô tả về tổ chức', 'Ví dụ': 'Cơ quan quản lý...' },
                { 'Cột': 'Cấp độ (*)', 'Mô tả': 'national/international/regional/institutional', 'Ví dụ': 'national' },
                { 'Cột': 'Loại (*)', 'Mô tả': 'government/education/professional/international/other', 'Ví dụ': 'government' },
                { 'Cột': 'Website', 'Mô tả': 'Địa chỉ website', 'Ví dụ': 'https://moet.gov.vn' },
                { 'Cột': 'Email liên hệ', 'Mô tả': 'Email liên hệ', 'Ví dụ': 'contact@moet.gov.vn' },
                { 'Cột': 'Số điện thoại', 'Mô tả': 'Số điện thoại liên hệ', 'Ví dụ': '0243 869 8113' },
                { 'Cột': 'Địa chỉ', 'Mô tả': 'Địa chỉ trụ sở', 'Ví dụ': '49 Đại Cồ Việt...' },
                { 'Cột': 'Quốc gia', 'Mô tả': 'Tên quốc gia', 'Ví dụ': 'Vietnam' }
            ]

            const wsInstruction = XLSX.utils.json_to_sheet(instructionData)
            wsInstruction['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 30 }]

            XLSX.utils.book_append_sheet(wb, ws, 'Mẫu nhập liệu')
            XLSX.utils.book_append_sheet(wb, wsInstruction, 'Hướng dẫn')

            XLSX.writeFile(wb, 'Mau_import_to_chuc.xlsx')
            toast.success('Đã tải file mẫu')
        } catch (error) {
            toast.error('Có lỗi khi tạo file mẫu')
        }
    }

    const handleExportExcel = () => {
        try {
            const exportData = organizations.map((org, index) => ({
                'STT': index + 1,
                'Mã': org.code,
                'Tên tổ chức': org.name,
                'Mô tả': org.description || '',
                'Cấp độ': getLevelLabel(org.level),
                'Loại': getTypeLabel(org.type),
                'Website': org.website || '',
                'Email': org.contactEmail || '',
                'Điện thoại': org.contactPhone || '',
                'Địa chỉ': org.address || '',
                'Trạng thái': getStatusLabel(org.status),
                'Ngày tạo': formatDate(org.createdAt)
            }))

            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)
            ws['!cols'] = [
                { wch: 5 }, { wch: 15 }, { wch: 40 }, { wch: 50 }, { wch: 12 }, { wch: 15 },
                { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 12 }
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
            toast.error(error.response?.data?.message || 'Import thất bại')
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

    const getLevelLabel = (level) => {
        const levels = {
            national: 'Quốc gia',
            international: 'Quốc tế',
            regional: 'Khu vực',
            institutional: 'Cơ sở'
        }
        return levels[level] || level
    }

    const getTypeLabel = (type) => {
        const types = {
            government: 'Chính phủ',
            education: 'Giáo dục',
            professional: 'Chuyên nghiệp',
            international: 'Quốc tế',
            other: 'Khác'
        }
        return types[type] || type
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
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả cấp độ</option>
                        <option value="national">Quốc gia</option>
                        <option value="international">Quốc tế</option>
                        <option value="regional">Khu vực</option>
                        <option value="institutional">Cơ sở</option>
                    </select>

                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả loại</option>
                        <option value="government">Chính phủ</option>
                        <option value="education">Giáo dục</option>
                        <option value="professional">Chuyên nghiệp</option>
                        <option value="international">Quốc tế</option>
                        <option value="other">Khác</option>
                    </select>

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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cấp độ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liên hệ</th>
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
                        ) : organizations.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {getLevelLabel(org.level)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {getTypeLabel(org.type)}
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