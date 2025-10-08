import { useState, useCallback } from 'react'
import { formatBytes } from '../utils/helpers'
import toast from 'react-hot-toast'
import { apiMethods } from '../services/api'

const useFileUpload = (options = {}) => {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
        multiple = false,
        autoUpload = false,
        onUploadSuccess,
        onUploadError,
        onProgress,
        uploadEndpoint = '/api/files/upload'
    } = options

    const [files, setFiles] = useState([])
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState({})
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [errors, setErrors] = useState([])

    // Validate file
    const validateFile = useCallback((file) => {
        const errors = []

        // Check file size
        if (file.size > maxSize) {
            errors.push(`Kích thước file ${file.name} vượt quá ${formatBytes(maxSize)}`)
        }

        // Check file type
        if (allowedTypes.length > 0) {
            const isAllowedType = allowedTypes.some(type => {
                if (type.startsWith('.')) {
                    return file.name.toLowerCase().endsWith(type.toLowerCase())
                }
                if (type.includes('*')) {
                    const baseType = type.split('/')[0]
                    return file.type.startsWith(baseType)
                }
                return file.type === type
            })

            if (!isAllowedType) {
                errors.push(`Định dạng file ${file.name} không được hỗ trợ`)
            }
        }

        return errors
    }, [maxSize, allowedTypes])

    const addFiles = useCallback((newFiles) => {
        const fileArray = Array.from(newFiles)
        const validatedFiles = []
        const newErrors = []

        fileArray.forEach(file => {
            const fileErrors = validateFile(file)
            if (fileErrors.length > 0) {
                newErrors.push(...fileErrors)
            } else {
                const fileWithId = {
                    id: Date.now() + Math.random(),
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'pending',
                    progress: 0,
                    uploadedData: null,
                    error: null
                }
                validatedFiles.push(fileWithId)
            }
        })

        if (newErrors.length > 0) {
            setErrors(prev => [...prev, ...newErrors])
            newErrors.forEach(error => toast.error(error))
        }

        setFiles(prev => {
            if (multiple) {
                return [...prev, ...validatedFiles]
            } else {
                return validatedFiles.slice(0, 1)
            }
        })

        if (autoUpload && validatedFiles.length > 0) {
            uploadFiles(validatedFiles)
        }

        return validatedFiles
    }, [validateFile, multiple, autoUpload])

    const removeFile = useCallback((fileId) => {
        setFiles(prev => prev.filter(f => f.id !== fileId))
        setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
        })
        setErrors(prev => prev.filter(error => !error.includes(fileId)))
    }, [])

    const clearFiles = useCallback(() => {
        setFiles([])
        setUploadProgress({})
        setUploadedFiles([])
        setErrors([])
    }, [])

    const uploadFile = useCallback(async (fileData) => {
        const formData = new FormData()
        formData.append('file', fileData.file)
        formData.append('name', fileData.name)

        try {
            setUploadProgress(prev => ({ ...prev, [fileData.id]: 0 }))

            const response = await apiMethods.uploadFile(formData, {
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    )
                    setUploadProgress(prev => ({ ...prev, [fileData.id]: progress }))

                    if (onProgress) {
                        onProgress(fileData.id, progress)
                    }
                }
            })

            if (response.data.success) {
                const uploadedData = response.data.data

                setFiles(prev =>
                    prev.map(f =>
                        f.id === fileData.id
                            ? { ...f, status: 'success', uploadedData }
                            : f
                    )
                )

                setUploadedFiles(prev => [...prev, { ...fileData, uploadedData }])

                if (onUploadSuccess) {
                    onUploadSuccess(uploadedData, fileData)
                }

                toast.success(`Upload ${fileData.name} thành công`)
                return uploadedData
            } else {
                throw new Error(response.data.message || 'Upload thất bại')
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Upload thất bại'

            setFiles(prev =>
                prev.map(f =>
                    f.id === fileData.id
                        ? { ...f, status: 'error', error: errorMessage }
                        : f
                )
            )

            setErrors(prev => [...prev, `${fileData.name}: ${errorMessage}`])

            if (onUploadError) {
                onUploadError(error, fileData)
            }

            toast.error(`Upload ${fileData.name} thất bại: ${errorMessage}`)
            throw error
        } finally {
            setUploadProgress(prev => {
                const newProgress = { ...prev }
                delete newProgress[fileData.id]
                return newProgress
            })
        }
    }, [onProgress, onUploadSuccess, onUploadError])

    const uploadFiles = useCallback(async (filesToUpload = null) => {
        const targetFiles = filesToUpload || files.filter(f => f.status === 'pending')

        if (targetFiles.length === 0) {
            toast.warning('Không có file nào để upload')
            return []
        }

        setUploading(true)
        const results = []

        try {
            for (const fileData of targetFiles) {
                try {
                    const result = await uploadFile(fileData)
                    results.push(result)
                } catch (error) {
                    // Error is already handled in uploadFile
                }
            }

            if (results.length > 0) {
                toast.success(`Upload thành công ${results.length} file`)
            }

            return results
        } finally {
            setUploading(false)
        }
    }, [files, uploadFile])

    const retryFailedUploads = useCallback(async () => {
        const failedFiles = files.filter(f => f.status === 'error')

        if (failedFiles.length === 0) {
            toast.info('Không có file lỗi nào để thử lại')
            return []
        }

        setFiles(prev =>
            prev.map(f =>
                f.status === 'error'
                    ? { ...f, status: 'pending', error: null }
                    : f
            )
        )

        return await uploadFiles(failedFiles)
    }, [files, uploadFiles])

    const getFile = useCallback((fileId) => {
        return files.find(f => f.id === fileId)
    }, [files])

    const getFilesByStatus = useCallback((status) => {
        return files.filter(f => f.status === status)
    }, [files])

    const stats = {
        total: files.length,
        pending: files.filter(f => f.status === 'pending').length,
        uploading: Object.keys(uploadProgress).length,
        success: files.filter(f => f.status === 'success').length,
        error: files.filter(f => f.status === 'error').length,
        totalSize: files.reduce((total, f) => total + f.size, 0),
        uploadedSize: uploadedFiles.reduce((total, f) => total + f.size, 0)
    }

    const getInputProps = useCallback(() => ({
        type: 'file',
        multiple,
        accept: allowedTypes.join(','),
        onChange: (e) => {
            if (e.target.files && e.target.files.length > 0) {
                addFiles(e.target.files)
                e.target.value = ''
            }
        }
    }), [multiple, allowedTypes, addFiles])

    const getDragProps = useCallback(() => ({
        onDragOver: (e) => {
            e.preventDefault()
            e.stopPropagation()
        },
        onDragEnter: (e) => {
            e.preventDefault()
            e.stopPropagation()
        },
        onDragLeave: (e) => {
            e.preventDefault()
            e.stopPropagation()
        },
        onDrop: (e) => {
            e.preventDefault()
            e.stopPropagation()

            const droppedFiles = e.dataTransfer.files
            if (droppedFiles && droppedFiles.length > 0) {
                addFiles(droppedFiles)
            }
        }
    }), [addFiles])

    return {
        files,
        uploading,
        uploadProgress,
        uploadedFiles,
        errors,
        stats,

        addFiles,
        removeFile,
        clearFiles,
        uploadFiles,
        uploadFile,
        retryFailedUploads,

        getFile,
        getFilesByStatus,

        getInputProps,
        getDragProps,

        validateFile,
        formatBytes: (bytes) => formatBytes(bytes)
    }
}

export default useFileUpload