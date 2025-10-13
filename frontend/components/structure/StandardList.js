import { useState, useEffect } from 'react'
import { Target, Plus, Search, Download, Upload, Edit2, Trash2, RefreshCw, Filter, Layers } from 'lucide-react'
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
                { wch: 15 },
                { wch: 50 },
                { wch: 18 },
                { wch: 15 },
                { wch: 45 },
            ]

            XLSX.utils.book_append_sheet(wb, wsData, 'Dữ liệu nhập')

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
                { wch: 5 },
                { wch: 10 },
                { wch: 50 },
                { wch: 35 },
                { wch: 30 },
                { wch: 12 },
                { wch: 25 },
                { wch: 12 }
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
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Target className="w-9 h-9 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Quản lý Tiêu chuẩn</h1>
                            <p className="text-orange-100">Quản lý các tiêu chuẩn đánh giá chất lượng</p>
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
                                setSelectedStandard(null)
                                setShowStandardModal(true)
                            }}
                            className="px-6 py-2.5 bg-white text-orange-600 rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold"
                        >
                            <Plus size={20} />
                            Thêm tiêu chuẩn
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Bộ lọc tìm kiếm</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tiêu chuẩn..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <select
                        value={programId}
                        onChange={(e) => setProgramId(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                        <option value="">Tất cả chương trình</option>
                        {programs.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        value={organizationId}
                        onChange={(e) => setOrganizationId(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                        <option value="">Tất cả tổ chức</option>
                        {organizations.map(o => (
                            <option key={o._id} value={o._id}>{o.name}</option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                        <option value="">⚡ Tất cả trạng thái</option>
                        <option value="draft">Nháp</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                        <option value="archived">Lưu trữ</option>
                    </select>

                    <button
                        onClick={loadStandards}
                        className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 font-medium"
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
                        <thead className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-orange-700 uppercase tracking-wider">Mã</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-orange-700 uppercase tracking-wider">Tên tiêu chuẩn</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-orange-700 uppercase tracking-wider">Chương trình</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-orange-700 uppercase tracking-wider">Tổ chức</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-orange-700 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-orange-700 uppercase tracking-wider">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : standards.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <Target className="w-16 h-16 text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium text-lg">Không có dữ liệu</p>
                                        <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc thêm tiêu chuẩn mới</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            standards.map((standard) => (
                                <tr key={standard._id} className="hover:bg-orange-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 text-sm font-bold text-orange-700 bg-orange-100 rounded-lg">
                                            {standard.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-900">{standard.name}</div>
                                        {standard.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-md mt-1">
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${getStatusColor(standard.status)}`}>
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
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(standard._id)}
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
                {!loading && standards.length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-t-2 border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị <span className="font-bold text-orange-600">{standards.length}</span> trong tổng số{' '}
                            <span className="font-bold text-orange-600">{pagination.total}</span> tiêu chuẩn
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