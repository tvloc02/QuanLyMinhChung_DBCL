import { apiMethods } from './api'
import { downloadBlob, formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

class ExportService {
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

}

const exportService = new ExportService()

export default exportService