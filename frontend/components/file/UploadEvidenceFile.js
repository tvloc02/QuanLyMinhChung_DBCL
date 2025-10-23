import { useState } from 'react'
import { Upload, X, AlertCircle, CheckCircle, Loader2, File, Info, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UploadEvidenceModal({ evidence, onClose, onSuccess }) {
    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const newFiles = Array.from(e.dataTransfer.files).map(file => ({
                file,
                id: Math.random(),
                name: file.name,
                size: file.size,
                type: file.type
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                id: Math.random(),
                name: file.name,
                size: file.size,
                type: file.type
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    }

    const removeFile = (id) => {
        setFiles(prev => prev.filter(f => f.id !== id))
    }

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.error('Vui lòng chọn ít nhất một file')
            return
        }

        try {
            setUploading(true)
            const formData = new FormData()

            files.forEach(f => {
                formData.append('files', f.file)
            })

            // Gọi API upload file
            const response = await fetch(`/api/files/upload/${evidence._id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Lỗi khi upload file');
            }

            const data = await response.json();
            setUploadedFiles(data.data || []);
            setFiles([])
            toast.success(`Đã upload thành công ${files.length} file. Giờ nộp file để manager duyệt.`)
        } catch (error) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Lỗi khi upload file')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async () => {
        if (uploadedFiles.length === 0) {
            toast.error('Vui lòng upload file trước')
            return
        }

        try {
            setSubmitting(true)

            // Gọi API submit evidence
            const response = await fetch(`/api/files/submit/${evidence._id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Lỗi khi nộp file');
            }

            toast.success('Đã nộp file thành công. Manager sẽ duyệt trong thời gian sớm nhất.')
            setUploadedFiles([])
            setFiles([])
            onSuccess()
        } catch (error) {
            console.error('Submit error:', error)
            toast.error(error.message || 'Lỗi khi nộp file')
        } finally {
            setSubmitting(false)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex items-center justify-between border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Upload và nộp file minh chứng</h2>
                            <p className="text-blue-100 text-sm">
                                {evidence.code} - {evidence.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={uploading || submitting}
                        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all disabled:opacity-50"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Upload Area */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                            dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                        <Upload className="h-12 w-12 mx-auto text-blue-600 mb-3" />
                        <p className="text-gray-900 font-semibold mb-2">
                            Kéo thả file vào đây hoặc click để chọn
                        </p>
                        <p className="text-gray-500 text-sm mb-4">
                            Hỗ trợ tất cả loại file, tối đa 10 file, mỗi file &lt; 100MB
                        </p>
                        <label className="inline-block">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                disabled={uploading || submitting}
                                className="hidden"
                            />
                            <span className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold cursor-pointer disabled:opacity-50">
                                Chọn file
                            </span>
                        </label>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">
                                    Danh sách file cần upload ({files.length})
                                </h3>
                                <span className="text-sm text-gray-600">
                                    Tổng: {formatFileSize(totalSize)}
                                </span>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {files.map((f) => (
                                    <div
                                        key={f.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <File className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {f.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(f.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFile(f.id)}
                                            disabled={uploading || submitting}
                                            className="ml-2 p-1.5 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                            title="Xóa file"
                                        >
                                            <X className="h-5 w-5 text-red-600" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Uploaded Files */}
                    {uploadedFiles.length > 0 && (
                        <div className="space-y-3 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <h3 className="font-bold text-green-900">
                                    File đã upload ({uploadedFiles.length})
                                </h3>
                            </div>

                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {uploadedFiles.map((f) => (
                                    <div
                                        key={f._id}
                                        className="flex items-center gap-2 p-2 bg-white rounded border border-green-200"
                                    >
                                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {f.originalName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(f.size)} • Chờ duyệt
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-2">Hướng dẫn:</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                <li><strong>Bước 1:</strong> Chọn file → Click "Upload" để lưu file</li>
                                <li><strong>Bước 2:</strong> File sẽ hiển thị ở danh sách "File đã upload"</li>
                                <li><strong>Bước 3:</strong> Click "Nộp file" để gửi cho manager duyệt</li>
                                <li>Manager sẽ duyệt/từ chối file trong 1-2 ngày</li>
                            </ol>
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>Chỉ upload file liên quan đến minh chứng này</li>
                                <li>Tên file nên rõ ràng, có ý nghĩa</li>
                                <li>Kiểm tra file trước upload để tránh lỗi</li>
                                <li>Sau khi nộp, chờ manager duyệt (không thể chỉnh sửa)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={uploading || submitting}
                        className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold disabled:opacity-50"
                    >
                        Hủy
                    </button>

                    {uploadedFiles.length === 0 ? (
                        <button
                            onClick={handleUpload}
                            disabled={uploading || files.length === 0}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Đang upload...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-5 w-5" />
                                    Upload {files.length > 0 && `(${files.length})`}
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || uploadedFiles.length === 0}
                            className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Đang nộp...
                                </>
                            ) : (
                                <>
                                    <Check className="h-5 w-5" />
                                    Nộp file ({uploadedFiles.length})
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}