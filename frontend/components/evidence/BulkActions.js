import { useState } from 'react'
import { Trash2, Download, Move, Copy, X, Check } from 'lucide-react'
import { ConfirmModal } from '../common/Modal'
import toast from 'react-hot-toast'
import evidenceService from '../../services/evidenceService'

export default function BulkActions({ selectedCount, selectedIds, onClearSelection }) {
    const [loading, setLoading] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)

    const handleBulkDelete = async () => {
        try {
            setLoading(true)
            await evidenceService.deleteMultipleEvidences(selectedIds)
            toast.success(`Đã xóa ${selectedCount} minh chứng`)
            onClearSelection()
        } catch (error) {
            toast.error('Lỗi xóa minh chứng')
        } finally {
            setLoading(false)
            setDeleteModal(false)
        }
    }

    const handleBulkDownload = async () => {
        try {
            setLoading(true)
            await evidenceService.downloadMultipleEvidences(selectedIds)
            toast.success('Đã tạo file tải xuống')
        } catch (error) {
            toast.error('Lỗi tải xuống')
        } finally {
            setLoading(false)
        }
    }

    const handleBulkCopy = () => {
        console.log('Bulk copy:', selectedIds)
    }

    const handleBulkMove = () => {
        console.log('Bulk move:', selectedIds)
    }

    return (
        <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-blue-700">
                            <Check className="h-5 w-5 mr-2" />
                            <span className="font-medium">
                                Đã chọn {selectedCount} minh chứng
                            </span>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={handleBulkDownload}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Tải xuống
                            </button>

                            <button
                                onClick={handleBulkCopy}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 disabled:opacity-50"
                            >
                                <Copy className="h-4 w-4 mr-1" />
                                Sao chép
                            </button>

                            <button
                                onClick={handleBulkMove}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 disabled:opacity-50"
                            >
                                <Move className="h-4 w-4 mr-1" />
                                Di chuyển
                            </button>

                            <button
                                onClick={() => setDeleteModal(true)}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Xóa
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onClearSelection}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleBulkDelete}
                title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa ${selectedCount} minh chứng đã chọn? Thao tác này không thể hoàn tác.`}
                confirmText="Xóa tất cả"
                type="danger"
            />
        </>
    )
}