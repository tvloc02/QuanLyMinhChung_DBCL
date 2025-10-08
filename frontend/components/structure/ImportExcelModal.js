import { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function ImportExcelModal({ onClose, onImport, title = "Import dữ liệu từ Excel" }) {
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0]
        if (!selectedFile) return

        // Validate file type
        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]

        if (!validTypes.includes(selectedFile.type)) {
            setError('Vui lòng chọn file Excel (.xls hoặc .xlsx)')
            return
        }

        // Validate file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File không được vượt quá 10MB')
            return
        }

        setFile(selectedFile)
        setError('')

        // Preview data
        try {
            const reader = new FileReader()
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, { type: 'array' })
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

                // Get first 5 rows for preview
                setPreview(jsonData.slice(0, 6))
            }
            reader.readAsArrayBuffer(selectedFile)
        } catch (err) {
            console.error('Preview error:', err)
            setError('Không thể xem trước file')
        }
    }

    const handleImport = async () => {
        if (!file) {
            setError('Vui lòng chọn file')
            return
        }

        try {
            setLoading(true)
            setError('')
            await onImport(file)
        } catch (err) {
            setError(err.message || 'Import thất bại')
        } finally {
            setLoading(false)
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            const event = { target: { files: [droppedFile] } }
            handleFileChange(event)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Upload className="text-green-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                            <p className="text-sm text-gray-600">Chọn file Excel để import dữ liệu</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Upload Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileSpreadsheet className="text-blue-600" size={32} />
                            </div>

                            {file ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle size={20} />
                                        <span className="font-medium">{file.name}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setFile(null)
                                            setPreview(null)
                                            setError('')
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        Chọn file khác
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-gray-700 font-medium">
                                        Kéo thả file Excel vào đây hoặc click để chọn
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Hỗ trợ file .xlsx, .xls (tối đa 10MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-sm font-medium text-red-800">Lỗi</p>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {preview && preview.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">Xem trước dữ liệu</h3>
                                <span className="text-sm text-gray-500">
                                    Hiển thị {preview.length} dòng đầu tiên
                                </span>
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <tbody>
                                        {preview.map((row, rowIndex) => (
                                            <tr
                                                key={rowIndex}
                                                className={rowIndex === 0 ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}
                                            >
                                                {row.map((cell, cellIndex) => (
                                                    <td
                                                        key={cellIndex}
                                                        className="px-4 py-2 border-b border-gray-200 whitespace-nowrap"
                                                    >
                                                        {cell || '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Lưu ý khi import:</h4>
                        <ul className="space-y-1 text-sm text-blue-800">
                            <li>• Dòng đầu tiên phải là tiêu đề cột</li>
                            <li>• Các cột có dấu (*) là bắt buộc</li>
                            <li>• Dữ liệu phải đúng định dạng theo hướng dẫn</li>
                            <li>• Tải file mẫu để xem cấu trúc chi tiết</li>
                            <li>• Dữ liệu trùng lặp sẽ không được import</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!file || loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang import...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                <span>Import dữ liệu</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}