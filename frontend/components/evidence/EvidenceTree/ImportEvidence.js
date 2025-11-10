import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Upload, Download, AlertCircle, Loader2, CheckCircle2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../../services/api'
import Layout from '../../../components/common/Layout'
import * as XLSX from 'xlsx'

export default function TaskImportEvidencePage() {
    const router = useRouter()
    const { taskId } = router.query

    const [task, setTask] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [importResult, setImportResult] = useState(null)

    useEffect(() => {
        if (taskId) {
            fetchTaskDetails()
        }
    }, [taskId])

    const fetchTaskDetails = async () => {
        try {
            setLoading(true)
            const response = await apiMethods.tasks.getById(taskId)
            setTask(response.data.data)
        } catch (error) {
            console.error('Fetch task error:', error)
            toast.error('Không thể tải chi tiết nhiệm vụ')
            router.push('/tasks')
        } finally {
            setLoading(false)
        }
    }

    const downloadTemplate = () => {
        const wb = XLSX.utils.book_new()

        if (task.reportType === 'overall_tdg') {
            const data = [
                ['STT', 'Mã Tiêu chuẩn', 'Tên Tiêu chuẩn', 'Mã Tiêu chí', 'Tên Tiêu chí', 'Mã Minh chứng', 'Tên Minh chứng'],
                ['1', 'TC-01', 'Tầm nhìn', '01', 'Tầm nhìn rõ ràng', 'A1.01.01.01', 'Quyết định công bố tầm nhìn']
            ]
            const ws = XLSX.utils.aoa_to_sheet(data)
            ws['!cols'] = [
                { wch: 5 },
                { wch: 15 },
                { wch: 30 },
                { wch: 12 },
                { wch: 25 },
                { wch: 18 },
                { wch: 40 }
            ]
            XLSX.utils.book_append_sheet(wb, ws, 'Minh chứng')
        } else if (task.reportType === 'standard') {
            const data = [
                ['STT', 'Mã Tiêu chí', 'Tên Tiêu chí', 'Mã Minh chứng', 'Tên Minh chứng'],
                ['1', '01', 'Tiêu chí 1', 'A1.01.01.01', 'Minh chứng 1']
            ]
            const ws = XLSX.utils.aoa_to_sheet(data)
            ws['!cols'] = [
                { wch: 5 },
                { wch: 12 },
                { wch: 25 },
                { wch: 18 },
                { wch: 40 }
            ]
            XLSX.utils.book_append_sheet(wb, ws, 'Minh chứng')
        } else {
            const data = [
                ['STT', 'Mã Minh chứng', 'Tên Minh chứng'],
                ['1', 'A1.01.01.01', 'Minh chứng 1']
            ]
            const ws = XLSX.utils.aoa_to_sheet(data)
            ws['!cols'] = [
                { wch: 5 },
                { wch: 18 },
                { wch: 40 }
            ]
            XLSX.utils.book_append_sheet(wb, ws, 'Minh chứng')
        }

        XLSX.writeFile(wb, `template-import-${task.reportType || 'evidences'}.xlsx`)
        toast.success('Đã tải file mẫu')
    }

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                toast.error('Vui lòng chọn file Excel')
                return
            }
            setSelectedFile(file)
            setImportResult(null)
        }
    }

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error('Vui lòng chọn file')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('taskId', taskId)
            formData.append('reportType', task.reportType)

            const response = await apiMethods.tasks.importEvidence(formData)

            setImportResult(response.data.data)

            if (response.data.success) {
                toast.success(`Import thành công! ${response.data.data.successCount} minh chứng`)
            }
        } catch (error) {
            console.error('Import error:', error)
            toast.error(error.response?.data?.message || 'Lỗi khi import file')
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <Layout title="Import Minh chứng">
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </Layout>
        )
    }

    if (!task) {
        return (
            <Layout title="Import Minh chứng">
                <div className="text-center py-16">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Không tìm thấy nhiệm vụ</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout title="Import Minh chứng">
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold">Import Minh chứng</h1>
                        <p className="text-blue-100">Nhiệm vụ: {task.description}</p>
                        <div className="flex items-center space-x-4 mt-4 text-sm">
                            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                                Loại báo cáo: {getReportTypeLabel(task.reportType)}
                            </span>
                            {task.dueDate && (
                                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                                    Hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Upload File Minh chứng</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        Chọn file Excel
                                    </label>
                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
                                        onClick={() => document.getElementById('file-input')?.click()}
                                    >
                                        <input
                                            id="file-input"
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 mb-2">Kéo file hoặc bấm để chọn</p>
                                        <p className="text-sm text-gray-500">Hỗ trợ .xlsx, .xls</p>
                                    </div>
                                </div>

                                {selectedFile && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                            <p className="text-xs text-gray-600">
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null)
                                                setImportResult(null)
                                            }}
                                            className="p-2 hover:bg-blue-200 rounded transition-all"
                                        >
                                            <X className="w-5 h-5 text-blue-600" />
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={handleImport}
                                    disabled={!selectedFile || uploading}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium flex items-center justify-center"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Đang upload...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-5 w-5 mr-2" />
                                            Upload File
                                        </>
                                    )}
                                </button>
                            </div>

                            {importResult && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-start space-x-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-green-900">Import thành công!</p>
                                            <div className="mt-2 text-sm text-green-700 space-y-1">
                                                <p>✓ Thành công: {importResult.successCount}</p>
                                                {importResult.errors?.length > 0 && (
                                                    <p>✗ Lỗi: {importResult.errors.length}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {importResult.errors?.length > 0 && (
                                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-sm font-medium text-red-900 mb-2">Các lỗi:</p>
                                            <ul className="text-xs text-red-700 space-y-1">
                                                {importResult.errors.slice(0, 5).map((err, idx) => (
                                                    <li key={idx}>• {err}</li>
                                                ))}
                                                {importResult.errors.length > 5 && (
                                                    <li>... và {importResult.errors.length - 5} lỗi khác</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Hướng dẫn</h3>
                            <div className="space-y-3 text-sm text-gray-600">
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Định dạng file:</p>
                                    <p>File Excel với các cột: Mã, Tên, ...</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 mb-1">Phạm vi:</p>
                                    {task.reportType === 'overall_tdg' && (
                                        <p>Có thể import toàn bộ minh chứng</p>
                                    )}
                                    {task.reportType === 'standard' && (
                                        <p>Chỉ có thể import minh chứng trong tiêu chuẩn được giao</p>
                                    )}
                                    {task.reportType === 'criteria' && (
                                        <p>Chỉ có thể import minh chứng trong tiêu chí được giao</p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={downloadTemplate}
                                className="w-full mt-4 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-medium flex items-center justify-center"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Tải File Mẫu
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-900">
                                💡 Tải file mẫu để xem định dạng đúng trước khi chuẩn bị dữ liệu
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

function getReportTypeLabel(type) {
    const labels = {
        'overall_tdg': 'Báo cáo Tự đánh giá',
        'standard': 'Báo cáo Tiêu chuẩn',
        'criteria': 'Báo cáo Tiêu chí'
    }
    return labels[type] || type
}