import {useEffect, useState} from 'react'
import {AlertCircle, Loader2, Send, Upload, X} from 'lucide-react'
import toast from 'react-hot-toast'
import {apiMethods} from '../../../services/api'

export default function EvidenceTreeTaskForm({
                                                 showAssignModal,
                                                 assignTarget,
                                                 assignReportType,
                                                 onClose,
                                                 onSubmit,
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
    const [taskDescription, setTaskDescription] = useState('')
    const [dueDate, setDueDate] = useState('')

    // Trạng thái cho popup xác nhận
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [duplicateUsers, setDuplicateUsers] = useState([])
    const [pendingSubmitData, setPendingSubmitData] = useState(null)

    const reportTypeMap = {
        'tdg': 'overall_tdg',
        'standard': 'standard',
        'criteria': 'criteria'
    }

    useEffect(() => {
        if (showAssignModal && assignTarget) {
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

    // ⭐️ Kiểm tra xem người dùng đã từng được giao nhiệm vụ này chưa
    const checkDuplicateAssignments = async (userIds) => {
        try {
            const standardId = assignTarget.standardId
            const criteriaId = assignTarget.criteriaId || null
            const reportType = reportTypeMap[assignReportType] || assignReportType

            // Tìm các task đã tồn tại với cùng standardId/criteriaId
            const response = await apiMethods.tasks.getAll({})

            const existingTasks = response.data.data || []
            const taskArray = Array.isArray(existingTasks) ? existingTasks : (existingTasks.tasks || [])

            return userIds.filter(userId => {
                return taskArray.some(task => {
                    const taskStandardMatch = task.standardId?._id?.toString() === standardId?.toString() ||
                        task.standardId?.toString() === standardId?.toString()
                    const taskCriteriaMatch = reportType === 'criteria'
                        ? (task.criteriaId?._id?.toString() === criteriaId?.toString() ||
                            task.criteriaId?.toString() === criteriaId?.toString())
                        : true

                    const taskReportTypeMatch = task.reportType === reportType

                    return taskArray.some(t => {
                        const assignedToIds = Array.isArray(t.assignedTo)
                            ? t.assignedTo.map(a => a._id || a)
                            : []
                        return assignedToIds.includes(userId)
                            && task.standardId?.toString() === standardId?.toString()
                            && taskReportTypeMatch
                            && (reportType !== 'criteria' || task.criteriaId?.toString() === criteriaId?.toString())
                    })
                })
            })
        } catch (error) {
            console.error('Error checking duplicates:', error)
            return []
        }
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
        if (!assignTarget.standardId) {
            toast.error('Tiêu chuẩn không xác định. Vui lòng thử lại.')
            return
        }
        if (assignReportType === 'criteria' && !assignTarget.criteriaId) {
            toast.error('Tiêu chí là bắt buộc cho báo cáo tiêu chí.')
            return
        }

        // ⭐️ Kiểm tra xem có người dùng nào đã từng được giao trước đó
        const userIds = selectedUsers.map(u => u._id)
        const duplicates = await checkDuplicateAssignments(userIds)

        if (duplicates.length > 0) {
            // Lấy tên của các người bị trùng
            const duplicateNames = selectedUsers
                .filter(u => duplicates.includes(u._id))
                .map(u => u.fullName)
                .join(', ')

            setDuplicateUsers(duplicateNames)
            setPendingSubmitData({
                description: taskDescription.trim(),
                assignedTo: userIds,
                standardId: assignTarget.standardId,
                criteriaId: assignTarget.criteriaId || null,
                reportType: reportTypeMap[assignReportType] || assignReportType,
                dueDate: dueDate ? new Date(dueDate + 'T00:00:00').toISOString() : undefined,
                rejectionReason: rejectionReason
            })
            setShowConfirmModal(true)
            return
        }

        await submitAssignment({
            description: taskDescription.trim(),
            assignedTo: userIds,
            standardId: assignTarget.standardId,
            criteriaId: assignTarget.criteriaId || null,
            reportType: reportTypeMap[assignReportType] || assignReportType,
            dueDate: dueDate ? new Date(dueDate + 'T00:00:00').toISOString() : undefined,
            rejectionReason: rejectionReason
        })
    }

    const submitAssignment = async (submitData) => {
        setIsSubmitting(true)
        try {
            await onSubmit(submitData)
            toast.success(`Đã giao nhiệm vụ cho ${selectedUsers.length} người.`)
            handleCloseModal()
            setShowConfirmModal(false)
        } catch (error) {
            console.error('❌ Error creating task:', error)
            const errorMsg = error.message || 'Lỗi khi giao nhiệm vụ'
            toast.error(errorMsg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCloseModal = () => {
        setSelectedUsers([])
        setAvailableUsers([])
        setRejectionReason('')
        setTaskDescription('')
        setDueDate('')
        setPendingSubmitData(null)
        setDuplicateUsers([])
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

    // ⭐️ POPUP XÁC NHẬN
    if (showConfirmModal && pendingSubmitData) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
                        Xác nhận giao nhiệm vụ
                    </h3>
                    <p className="text-center text-gray-600 mb-4">
                        Bạn đã từng giao nhiệm vụ viết báo cáo cho <span className="font-semibold text-blue-600">{duplicateUsers}</span>, bạn vẫn muốn giao tiếp nhiệm vụ viết báo cáo này chứ?
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={() => submitAssignment(pendingSubmitData)}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-medium"
                        >
                            {isSubmitting ? 'Đang giao...' : 'Tiếp tục'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // FORM GIAO NHIỆM VỤ
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
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-gray-600">
                                Phân công Reporter viết báo cáo <span className="font-semibold text-blue-600">{assignReportType.toUpperCase()}</span> cho <span className="font-semibold">{assignTarget.code}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                S:{assignTarget.standardId?.substring(0, 4) || 'NULL'}... | C:{assignTarget.criteriaId?.substring(0, 4) || 'NULL'}...
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mô tả nhiệm vụ <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                placeholder="Nhập mô tả chi tiết nhiệm vụ..."
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                                    !taskDescription.trim()
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200 bg-white'
                                }`}
                            />
                            {!taskDescription.trim() && (
                                <p className="mt-1 text-xs text-red-600">Mô tả là bắt buộc.</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày hết hạn <span className="text-gray-400 text-xs">(Tùy chọn)</span>
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Chọn Reporter cần giao nhiệm vụ <span className="text-red-500">*</span>
                            </label>
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
                            <p className="text-xs text-gray-600 mt-2">
                                Đã chọn: <span className="font-semibold text-blue-600">{selectedUsers.length}</span> người
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ghi chú <span className="text-gray-400 text-xs">(Tùy chọn)</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Nhập ghi chú hoặc hướng dẫn cho người được giao..."
                                rows={3}
                                maxLength={2000}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {rejectionReason.length}/2000 ký tự
                            </p>
                        </div>

                        <div className="flex space-x-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={handleCloseModal}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAssignment}
                                disabled={isSubmitting || selectedUsers.length === 0 || !taskDescription.trim()}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium inline-flex items-center justify-center"
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

    // ⭐️ FORM UPLOAD FILES (hiện nút upload thay vì xem/sửa)
    if (selectedEvidence) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Upload Minh Chứng</h3>
                    <button
                        onClick={onCloseFileManager}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-xs text-gray-600 mb-1">Minh chứng:</p>
                        <p className="text-sm font-medium text-gray-900">{selectedEvidence.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Mã: {selectedEvidence.code}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn files</label>
                        <div
                            className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                            onClick={() => fileInput?.click()}
                        >
                            <input
                                ref={setFileInput}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-1">Kéo files hoặc</p>
                            <button
                                type="button"
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                chọn từ máy tính
                            </button>
                        </div>
                    </div>

                    {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Files được chọn ({uploadedFiles.length})</p>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {uploadedFiles.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="text-sm text-gray-600 truncate flex-1">
                                            {file.name}
                                            <span className="text-xs text-gray-500 ml-2">
                                                ({(file.size / 1024).toFixed(2)} KB)
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFile(idx)}
                                            className="p-1 hover:bg-red-200 rounded transition-all"
                                        >
                                            <X className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleUploadFiles}
                        disabled={uploadedFiles.length === 0 || isSubmitting}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium inline-flex items-center justify-center"
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