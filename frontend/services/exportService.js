import { apiMethods } from './api'
import { downloadBlob, formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

class ExportService {
    // Export evidence list to Excel
    async exportEvidenceToExcel(filters = {}, options = {}) {
        try {
            const {
                filename = `evidence_export_${formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`,
                columns = 'all',
                includeFiles = false
            } = options

            const response = await apiMethods.exportReport('evidence-excel', {
                ...filters,
                columns,
                includeFiles,
                format: 'xlsx'
            })

            if (response.status === 200) {
                downloadBlob(response.data, filename)
                return {
                    success: true,
                    message: `Xuất Excel thành công: ${filename}`
                }
            }

            return {
                success: false,
                message: 'Lỗi xuất Excel'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi xuất Excel'
            }
        }
    }

    // Export evidence list to CSV
    async exportEvidenceToCSV(filters = {}, options = {}) {
        try {
            const {
                filename = `evidence_export_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`,
                delimiter = ',',
                encoding = 'UTF-8'
            } = options

            const response = await apiMethods.exportReport('evidence-csv', {
                ...filters,
                format: 'csv',
                delimiter,
                encoding
            })

            if (response.status === 200) {
                downloadBlob(response.data, filename)
                return {
                    success: true,
                    message: `Xuất CSV thành công: ${filename}`
                }
            }

            return {
                success: false,
                message: 'Lỗi xuất CSV'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi xuất CSV'
            }
        }
    }

    // Export evidence report to PDF
    async exportEvidenceToPDF(filters = {}, options = {}) {
        try {
            const {
                filename = `evidence_report_${formatDate(new Date(), 'YYYY-MM-DD')}.pdf`,
                template = 'standard',
                includeCharts = true,
                includeImages = false
            } = options

            const response = await apiMethods.exportReport('evidence-pdf', {
                ...filters,
                format: 'pdf',
                template,
                includeCharts,
                includeImages
            })

            if (response.status === 200) {
                downloadBlob(response.data, filename)
                return {
                    success: true,
                    message: `Xuất PDF thành công: ${filename}`
                }
            }

            return {
                success: false,
                message: 'Lỗi xuất PDF'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi xuất PDF'
            }
        }
    }

    // Export evidence tree structure
    async exportEvidenceTree(programId, format = 'excel', options = {}) {
        try {
            const {
                filename = `evidence_tree_${formatDate(new Date(), 'YYYY-MM-DD')}.${format}`,
                includeEmpty = false,
                includeStats = true
            } = options

            const response = await apiMethods.exportReport('evidence-tree', {
                programId,
                format,
                includeEmpty,
                includeStats
            })

            if (response.status === 200) {
                downloadBlob(response.data, filename)
                return {
                    success: true,
                    message: `Xuất cây minh chứng thành công: ${filename}`
                }
            }

            return {
                success: false,
                message: 'Lỗi xuất cây minh chứng'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi xuất cây minh chứng'
            }
        }
    }

    // Export statistics report
    async exportStatistics(type = 'overview', options = {}) {
        try {
            const {
                format = 'pdf',
                filename = `statistics_${type}_${formatDate(new Date(), 'YYYY-MM-DD')}.${format}`,
                dateRange = null,
                programId = null
            } = options

            const response = await apiMethods.exportReport('statistics', {
                type,
                format,
                dateRange,
                programId
            })

            if (response.status === 200) {
                downloadBlob(response.data, filename)
                return {
                    success: true,
                    message: `Xuất báo cáo thống kê thành công: ${filename}`
                }
            }

            return {
                success: false,
                message: 'Lỗi xuất báo cáo thống kê'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi xuất báo cáo thống kê'
            }
        }
    }

    // Generate and export template
    async exportTemplate(type, format = 'excel') {
        try {
            const templates = {
                'evidence-import': 'Mẫu import minh chứng',
                'evidence-tree': 'Mẫu cây minh chứng',
                'standards': 'Mẫu tiêu chuẩn',
                'criteria': 'Mẫu tiêu chí'
            }

            const filename = `template_${type}_${formatDate(new Date(), 'YYYY-MM-DD')}.${format}`

            const response = await fetch(`/api/templates/${type}?format=${format}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            })

            if (response.ok) {
                const blob = await response.blob()
                downloadBlob(blob, filename)
                return {
                    success: true,
                    message: `Tải template thành công: ${templates[type] || type}`
                }
            }

            return {
                success: false,
                message: 'Lỗi tải template'
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi tải template'
            }
        }
    }

    // Export user data
    async exportUsers(filters = {}, format = 'excel') {
        try {
            const filename = `users_export_${formatDate(new Date(), 'YYYY-MM-DD')}.${format}`

            const response = await apiMethods.exportReport('users', {
                ...filters,
                format
            })

            if (response.status === 200) {
                downloadBlob(response.data, filename)
                return {
                    success: true,
                    message: `Xuất danh sách người dùng thành công: ${filename}`
                }
            }

            return {
                success: false,
                message: 'Lỗi xuất danh sách người dùng'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi xuất danh sách người dùng'
            }
        }
    }

    // Export audit log
    async exportAuditLog(filters = {}, format = 'excel') {
        try {
            const filename = `audit_log_${formatDate(new Date(), 'YYYY-MM-DD')}.${format}`

            const response = await apiMethods.exportReport('audit-log', {
                ...filters,
                format
            })

            if (response.status === 200) {
                downloadBlob(response.data, filename)
                return {
                    success: true,
                    message: `Xuất nhật ký hoạt động thành công: ${filename}`
                }
            }

            return {
                success: false,
                message: 'Lỗi xuất nhật ký hoạt động'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi xuất nhật ký hoạt động'
            }
        }
    }

    // Export custom report
    async exportCustomReport(config, options = {}) {
        try {
            const {
                filename = `custom_report_${formatDate(new Date(), 'YYYY-MM-DD')}.pdf`,
                format = 'pdf'
            } = options

            const response = await fetch('/api/reports/custom/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    config,
                    format,
                    ...options
                })
            })

            if (response.ok) {
                const blob = await response.blob()
                downloadBlob(blob, filename)
                return {
                    success: true,
                    message: `Xuất báo cáo tùy chỉnh thành công: ${filename}`
                }
            }

            const error = await response.json()
            return {
                success: false,
                message: error.message || 'Lỗi xuất báo cáo tùy chỉnh'
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi xuất báo cáo tùy chỉnh'
            }
        }
    }

    // Bulk export (multiple reports)
    async bulkExport(exports, options = {}) {
        try {
            const {
                zipFilename = `bulk_export_${formatDate(new Date(), 'YYYY-MM-DD')}.zip`,
                notify = true
            } = options

            const response = await fetch('/api/exports/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    exports,
                    zipFilename,
                    notify
                })
            })

            const data = await response.json()

            if (data.success) {
                if (notify) {
                    toast.success('Đã tạo yêu cầu xuất hàng loạt. Bạn sẽ nhận được thông báo khi hoàn thành.')
                    return {
                        success: true,
                        taskId: data.taskId,
                        message: 'Yêu cầu xuất hàng loạt đã được tạo'
                    }
                } else {
                    // Direct download
                    downloadBlob(data.data, zipFilename)
                    return {
                        success: true,
                        message: `Xuất hàng loạt thành công: ${zipFilename}`
                    }
                }
            }

            return {
                success: false,
                message: data.message || 'Lỗi xuất hàng loạt'
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi xuất hàng loạt'
            }
        }
    }

    // Check export task status
    async checkExportStatus(taskId) {
        try {
            const response = await fetch(`/api/exports/status/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    status: data.data.status,
                    progress: data.data.progress,
                    downloadUrl: data.data.downloadUrl,
                    error: data.data.error
                }
            }

            return {
                success: false,
                message: data.message
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi kiểm tra trạng thái export'
            }
        }
    }

    // Download completed export
    async downloadExportResult(taskId, filename) {
        try {
            const response = await fetch(`/api/exports/download/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            })

            if (response.ok) {
                const blob = await response.blob()
                downloadBlob(blob, filename)
                return {
                    success: true,
                    message: `Tải xuống thành công: ${filename}`
                }
            }

            return {
                success: false,
                message: 'Lỗi tải xuống kết quả export'
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi tải xuống kết quả export'
            }
        }
    }

    // Get available export formats for a type
    getAvailableFormats(exportType) {
        const formats = {
            'evidence': ['excel', 'csv', 'pdf'],
            'evidence-tree': ['excel', 'pdf'],
            'statistics': ['pdf', 'excel'],
            'users': ['excel', 'csv'],
            'audit-log': ['excel', 'csv'],
            'custom': ['pdf', 'excel', 'word']
        }

        return formats[exportType] || ['pdf']
    }

    // Get export presets
    getExportPresets(type) {
        const presets = {
            evidence: [
                {
                    name: 'Tất cả minh chứng',
                    description: 'Xuất toàn bộ minh chứng với đầy đủ thông tin',
                    config: { includeAll: true }
                },
                {
                    name: 'Minh chứng theo chương trình',
                    description: 'Xuất minh chứng theo từng chương trình',
                    config: { groupByProgram: true }
                },
                {
                    name: 'Minh chứng đã phê duyệt',
                    description: 'Chỉ xuất minh chứng đã được phê duyệt',
                    config: { status: 'approved' }
                }
            ],
            statistics: [
                {
                    name: 'Báo cáo tổng quan',
                    description: 'Thống kê tổng quan hệ thống',
                    config: { type: 'overview' }
                },
                {
                    name: 'Báo cáo theo thời gian',
                    description: 'Thống kê theo khoảng thời gian',
                    config: { type: 'timeline' }
                }
            ]
        }

        return presets[type] || []
    }

    // Helper to get auth token
    getToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token')
    }

    // Validate export parameters
    validateExportParams(type, params) {
        const errors = []

        if (!type) {
            errors.push('Loại export không được để trống')
        }

        // Type-specific validations
        switch (type) {
            case 'evidence':
                if (params.dateFrom && params.dateTo) {
                    const fromDate = new Date(params.dateFrom)
                    const toDate = new Date(params.dateTo)

                    if (fromDate > toDate) {
                        errors.push('Ngày bắt đầu phải nhỏ hơn ngày kết thúc')
                    }
                }
                break

            case 'evidence-tree':
                if (!params.programId) {
                    errors.push('Vui lòng chọn chương trình')
                }
                break

            case 'custom':
                if (!params.config || Object.keys(params.config).length === 0) {
                    errors.push('Cấu hình báo cáo không được để trống')
                }
                break
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    // Preview export (get sample data)
    async previewExport(type, params, limit = 10) {
        try {
            const response = await fetch('/api/exports/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    type,
                    params,
                    limit
                })
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    preview: data.data.preview,
                    totalCount: data.data.totalCount,
                    columns: data.data.columns
                }
            }

            return {
                success: false,
                message: data.message || 'Lỗi xem trước export'
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi xem trước export'
            }
        }
    }
}

const exportService = new ExportService()

export default exportService