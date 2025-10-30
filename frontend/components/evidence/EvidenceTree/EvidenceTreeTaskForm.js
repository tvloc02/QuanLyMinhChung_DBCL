import { useState, useEffect } from 'react'
import { X, Send, Loader2, Upload, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiMethods } from '../../../services/api'

export default function EvidenceTreeTaskForm({
                                                 showAssignModal,
                                                 assignTarget,
                                                 assignReportType,
                                                 onClose,
                                                 onSubmit, // Hàm này gọi apiMethods.tasks.create()
                                                 selectedEvidence,
                                                 onCloseFileManager,
                                                 onFileUpload
                                             }) {
    const [selectedUsers, setSelectedUsers] = useState([])
    const [availableUsers, setAvailableUsers] = useState([])
    const [isLoadingUsers, setIsLoadingUsers] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [rejectionReason, setRejectionReason] = useState('')
    const [fileInput, setFileInput] = useState(null)

    // ⭐️ BIẾN THIẾU ĐƯỢC THÊM VÀO STATE
    const [taskDescription, setTaskDescription] = useState('')
    const [dueDate, setDueDate] = useState('')

    useEffect(() => {
        if (showAssignModal && assignTarget) {
            // Giả định mô tả mặc định là tên của mục được giao
            setTaskDescription(`Viết báo cáo ${assignReportType.toUpperCase()} cho ${assignTarget.code}: ${assignTarget.name}`)
            setDueDate('')

            const fetchUsers = async () => {
                setIsLoadingUsers(true)
                try {
                    const response = await apiMethods.users.getAll({
                        role: 'reporter',
                        status: 'active',
                        limit: 100
                    })

                    let userList = response.data.data || []

                    if (userList && userList.users) {
                        userList = userList.users
                    }

                    if (Array.isArray(userList)) {
                        setAvailableUsers(userList)
                    } else {
                        setAvailableUsers([])
                    }

                } catch (error) {
                    toast.error('Lỗi khi tải danh sách báo cáo viên.')
                    console.error('Fetch reporters error:', error)
                    setAvailableUsers([])
                } finally {
                    setIsLoadingUsers(false)
                }
            }
            fetchUsers()
        }
    }, [showAssignModal, assignTarget, assignReportType])

    const handleToggleUser = (user) => {
        setSelectedUsers(prev => prev.some(u => u._id === user._id)
            ? prev.filter(u => u._id !== user._id)
            : [...prev, user]
        )
    }

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || [])
        setUploadedFiles([...uploadedFiles, ...files])
    }

    const handleRemoveFile = (index) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
    }

    const handleAssignment = async () => {
        if (!taskDescription.trim()) {
            toast.error('Mô tả nhiệm vụ là bắt buộc.')
            return
        }
        if (selectedUsers.length === 0) {
            toast.error('Vui lòng chọn ít nhất một người được giao.')
            return
        }

        setIsSubmitting(true)

        try {
            const userIds = selectedUsers.map(u => u._id)

            // ⭐️ Cấu trúc dữ liệu TẠO TASK (Đã sửa để khớp API Backend)
            const submitData = {
                // Các trường bắt buộc cho API:
                description: taskDescription.trim(),
                assignedTo: userIds,
                reportType: assignReportType,

                // Các trường ID (lấy từ assignTarget)
                programId: assignTarget.programId,
                organizationId: assignTarget.organizationId,
                standardId: assignTarget.standardId,
                criteriaId: assignTarget.criteriaId, // Bắt buộc cho mọi Task

                // Trường tùy chọn:
                dueDate: dueDate || undefined,
                rejectionReason: rejectionReason // Sử dụng rejectionReason cho ghi chú
            }

            // ⚠️ Cần kiểm tra lại: Backend Task Schema có vẻ không cần programId/organizationId
            // nếu nó được lấy từ Criteria. Tuy nhiên, gửi đủ ID là cách an toàn nhất.

            await onSubmit(submitData)

            toast.success(`Đã giao nhiệm vụ cho ${selectedUsers.length} người.`)
            handleCloseModal()
        } catch (error) {
            toast.error(error.message || 'Lỗi khi giao nhiệm vụ')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCloseModal = () => {
        setSelectedUsers([])
        setAvailableUsers([])
        setRejectionReason('')
        setTaskDescription('') // Reset
        setDueDate('') // Reset
        // Không reset uploadedFiles/selectedEvidence vì đây là modal GIAO VIỆC
        onClose()
    }

    const handleUploadFiles = async () => {
        if (uploadedFiles.length === 0) {
            toast.error('Vui lòng chọn ít nhất một file')
            return
        }
        setIsSubmitting(true)
        try {
            await onFileUpload(uploadedFiles)
            toast.success('Upload file thành công!')
            setUploadedFiles([])
            onCloseFileManager()
        } catch (error) {
            toast.error(error.message || 'Lỗi khi upload file')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (showAssignModal && assignTarget) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">
                            Giao nhiệm vụ: <span className="text-blue-600">{assignTarget.name}</span>
                        </h3>
                        <button
                            onClick={handleCloseModal}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Thông tin mục tiêu */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-gray-600">
                                Phân công Reporter viết báo cáo <span className="font-semibold text-blue-600">{assignReportType.toUpperCase()}</span> cho <span className="font-semibold">{assignTarget.code}</span>
                            </p>
                        </div>

                        {/* ⭐️ Ô Mô tả nhiệm vụ (Bắt buộc) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả nhiệm vụ <span className="text-red-500">*</span></label>
                            <textarea
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                placeholder="Nhập mô tả chi tiết nhiệm vụ..."
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${!taskDescription.trim() ? 'border-red-300' : 'border-gray-200'}`}
                            />
                            {!taskDescription.trim() && <p className="mt-1 text-xs text-red-600">Mô tả là bắt buộc.</p>}
                        </div>

                        {/* ⭐️ Ô Ngày hết hạn (dueDate) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày hết hạn (Tùy chọn)</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Chọn người dùng */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Chọn Reporter cần giao nhiệm vụ</label>
                            <div className="border-2 border-gray-200 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto bg-gray-50">
                                {isLoadingUsers ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin text-blue-500" />
                                        <span className="text-sm text-gray-600">Đang tải danh sách...</span>
                                    </div>
                                ) : availableUsers.length === 0 ? (
                                    <div className="flex items-center justify-center py-4">
                                        <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                                        <span className="text-sm text-gray-600">Không tìm thấy Reporter nào đang hoạt động.</span>
                                    </div>
                                ) : (
                                    availableUsers.map(user => (
                                        <label
                                            key={user._id}
                                            className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                        >
                                            <span className="text-sm font-medium">{user.fullName} ({user.email})</span>
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.some(u => u._id === user._id)}
                                                onChange={() => handleToggleUser(user)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </label>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-gray-600 mt-2">Đã chọn: <span className="font-semibold">{selectedUsers.length}</span> người</p>
                        </div>

                        {/* Ghi chú */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú (tùy chọn)</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Nhập ghi chú hoặc hướng dẫn cho người được giao..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        {/* Nút action */}
                        <div className="flex space-x-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={handleCloseModal}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAssignment}
                                disabled={isSubmitting || selectedUsers.length === 0 || !taskDescription.trim()}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium inline-flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Đang giao...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5 mr-2" />
                                        Giao nhiệm vụ
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (selectedEvidence) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Upload Files</h3>
                    <button
                        onClick={onCloseFileManager}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Thông tin minh chứng */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Minh chứng:</p>
                        <p className="text-sm font-medium text-gray-900">{selectedEvidence.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Mã: {selectedEvidence.code}</p>
                    </div>

                    {/* Upload files */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn files</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-all cursor-pointer">
                            <input
                                ref={setFileInput}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-1">Kéo files hoặc</p>
                            <button
                                onClick={() => fileInput?.click()}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                chọn từ máy tính
                            </button>
                        </div>
                    </div>

                    {/* Danh sách files */}
                    {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Files được chọn ({uploadedFiles.length})</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {uploadedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="text-sm text-gray-600 truncate flex-1">
                                            {file.name}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFile(idx)}
                                            className="p-1 hover:bg-gray-200 rounded transition-all"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Nút upload */}
                    <button
                        onClick={handleUploadFiles}
                        disabled={uploadedFiles.length === 0 || isSubmitting}
                        className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium inline-flex items-center justify-center"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Đang upload...
                            </>
                        ) : (
                            <>
                                <Upload className="h-5 w-5 mr-2" />
                                Upload ({uploadedFiles.length})
                            </>
                        )}
                    </button>
                </div>
            </div>
        )
    }

    return null
}