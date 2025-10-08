import { apiMethods } from './api'
import { formatBytes, downloadBlob } from '../utils/helpers'
import toast from 'react-hot-toast'

class FileService {
    constructor() {
        this.uploadProgress = new Map()
        this.uploadControllers = new Map()
    }

    // Upload single file
    async uploadFile(file, options = {}) {
        const {
            onProgress,
            evidenceId,
            folder = '/',
            description = '',
            tags = []
        } = options

        try {
            const formData = new FormData()
            formData.append('file', file)

            if (evidenceId) formData.append('evidenceId', evidenceId)
            if (folder !== '/') formData.append('folder', folder)
            if (description) formData.append('description', description)
            if (tags.length > 0) formData.append('tags', JSON.stringify(tags))

            // Create abort controller for cancellation
            const controller = new AbortController()
            this.uploadControllers.set(file.name, controller)

            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        )
                        this.uploadProgress.set(file.name, percentCompleted)
                        onProgress(percentCompleted)
                    }
                }
            })

            const data = await response.json()

            if (data.success) {
                this.uploadProgress.delete(file.name)
                this.uploadControllers.delete(file.name)
                return {
                    success: true,
                    file: data.data,
                    message: `Tải lên ${file.name} thành công`
                }
            }

            return {
                success: false,
                message: data.message || 'Tải lên thất bại'
            }
        } catch (error) {
            this.uploadProgress.delete(file.name)
            this.uploadControllers.delete(file.name)

            if (error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Đã hủy tải lên',
                    cancelled: true
                }
            }

            return {
                success: false,
                message: error.message || 'Lỗi tải lên file'
            }
        }
    }

    // Upload multiple files
    async uploadMultipleFiles(files, options = {}) {
        const {
            onProgress,
            onFileComplete,
            maxConcurrent = 3
        } = options

        const results = []
        const totalFiles = files.length
        let completedFiles = 0

        // Upload files in batches
        for (let i = 0; i < files.length; i += maxConcurrent) {
            const batch = files.slice(i, i + maxConcurrent)

            const batchPromises = batch.map(async (file) => {
                try {
                    const result = await this.uploadFile(file, {
                        ...options,
                        onProgress: (progress) => {
                            // Individual file progress
                            if (onFileComplete) {
                                onFileComplete(file, progress)
                            }
                        }
                    })

                    completedFiles++

                    // Overall progress
                    if (onProgress) {
                        const overallProgress = Math.round((completedFiles / totalFiles) * 100)
                        onProgress(overallProgress)
                    }

                    return result
                } catch (error) {
                    return {
                        success: false,
                        file: file.name,
                        message: error.message
                    }
                }
            })

            const batchResults = await Promise.all(batchPromises)
            results.push(...batchResults)
        }

        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length

        return {
            success: failCount === 0,
            results,
            summary: {
                total: totalFiles,
                success: successCount,
                failed: failCount
            }
        }
    }

    // Cancel upload
    cancelUpload(fileName) {
        const controller = this.uploadControllers.get(fileName)
        if (controller) {
            controller.abort()
            this.uploadProgress.delete(fileName)
            this.uploadControllers.delete(fileName)
            return true
        }
        return false
    }

    // Get upload progress
    getUploadProgress(fileName) {
        return this.uploadProgress.get(fileName) || 0
    }

    // Download file
    async downloadFile(fileId, fileName) {
        try {
            const response = await apiMethods.downloadFile(fileId)

            if (response.status === 200) {
                downloadBlob(response.data, fileName)
                return {
                    success: true,
                    message: `Đang tải xuống ${fileName}`
                }
            }

            return {
                success: false,
                message: 'Lỗi tải xuống file'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi tải xuống file'
            }
        }
    }

    // Download multiple files as ZIP
    async downloadMultipleFiles(fileIds, zipName = 'files.zip') {
        try {
            const response = await fetch('/api/files/download/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ fileIds })
            })

            if (response.ok) {
                const blob = await response.blob()
                downloadBlob(blob, zipName)
                return {
                    success: true,
                    message: `Đang tải xuống ${zipName}`
                }
            }

            const error = await response.json()
            return {
                success: false,
                message: error.message || 'Lỗi tải xuống files'
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi tải xuống files'
            }
        }
    }

    // Delete file
    async deleteFile(fileId) {
        try {
            const response = await apiMethods.deleteFile(fileId)

            if (response.data.success) {
                return {
                    success: true,
                    message: 'Xóa file thành công'
                }
            }

            return {
                success: false,
                message: response.data.message || 'Xóa file thất bại'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi xóa file'
            }
        }
    }

    // Delete multiple files
    async deleteMultipleFiles(fileIds) {
        try {
            const deletePromises = fileIds.map(id => this.deleteFile(id))
            const results = await Promise.all(deletePromises)

            const successCount = results.filter(r => r.success).length
            const failCount = results.filter(r => !r.success).length

            return {
                success: failCount === 0,
                summary: {
                    total: fileIds.length,
                    success: successCount,
                    failed: failCount
                },
                message: failCount === 0
                    ? `Đã xóa ${successCount} file`
                    : `Xóa ${successCount} file, ${failCount} file thất bại`
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi xóa files'
            }
        }
    }

    // Get file info
    async getFileInfo(fileId) {
        try {
            const response = await apiMethods.getFileInfo(fileId)

            if (response.data.success) {
                return {
                    success: true,
                    file: response.data.data
                }
            }

            return {
                success: false,
                message: response.data.message || 'Lỗi tải thông tin file'
            }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Lỗi tải thông tin file'
            }
        }
    }

    // Validate file
    validateFile(file, options = {}) {
        const {
            maxSize = 10 * 1024 * 1024, // 10MB default
            allowedTypes = [],
            allowedExtensions = []
        } = options

        const errors = []

        // Check file size
        if (file.size > maxSize) {
            errors.push(`File quá lớn. Kích thước tối đa: ${formatBytes(maxSize)}`)
        }

        // Check file type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            errors.push(`Loại file không được hỗ trợ: ${file.type}`)
        }

        // Check file extension
        if (allowedExtensions.length > 0) {
            const extension = file.name.split('.').pop().toLowerCase()
            if (!allowedExtensions.includes(extension)) {
                errors.push(`Định dạng file không được hỗ trợ: .${extension}`)
            }
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    // Validate multiple files
    validateFiles(files, options = {}) {
        const results = []
        let validCount = 0

        files.forEach(file => {
            const validation = this.validateFile(file, options)
            results.push({
                file: file.name,
                valid: validation.valid,
                errors: validation.errors
            })

            if (validation.valid) {
                validCount++
            }
        })

        return {
            results,
            summary: {
                total: files.length,
                valid: validCount,
                invalid: files.length - validCount
            },
            allValid: validCount === files.length
        }
    }

    // Create folder
    async createFolder(name, parentPath = '/') {
        try {
            const response = await fetch('/api/files/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    name,
                    parentPath
                })
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    folder: data.data,
                    message: `Tạo thư mục "${name}" thành công`
                }
            }

            return {
                success: false,
                message: data.message || 'Tạo thư mục thất bại'
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi tạo thư mục'
            }
        }
    }

    // Rename file or folder
    async rename(fileId, newName) {
        try {
            const response = await fetch(`/api/files/${fileId}/rename`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ name: newName })
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    file: data.data,
                    message: `Đổi tên thành "${newName}" thành công`
                }
            }

            return {
                success: false,
                message: data.message || 'Đổi tên thất bại'
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi đổi tên'
            }
        }
    }

    // Move files
    async moveFiles(fileIds, targetPath) {
        try {
            const response = await fetch('/api/files/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    fileIds,
                    targetPath
                })
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    message: `Di chuyển ${fileIds.length} file thành công`
                }
            }

            return {
                success: false,
                message: data.message || 'Di chuyển thất bại'
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi di chuyển file'
            }
        }
    }

    // Copy files
    async copyFiles(fileIds, targetPath) {
        try {
            const response = await fetch('/api/files/copy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({
                    fileIds,
                    targetPath
                })
            })

            const data = await response.json()

            if (data.success) {
                return {
                    success: true,
                    message: `Sao chép ${fileIds.length} file thành công`
                }
            }

            return {
                success: false,
                message: data.message || 'Sao chép thất bại'
            }
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi sao chép file'
            }
        }
    }

    // Get file thumbnail
    getFileThumbnail(fileId, size = 'medium') {
        return `/api/files/${fileId}/thumbnail?size=${size}`
    }

    // Get file preview URL
    getFilePreviewUrl(fileId) {
        return `/api/files/${fileId}/preview`
    }

    // Get file download URL
    getFileDownloadUrl(fileId) {
        return `/api/files/${fileId}/download`
    }

    // Helper to get token (assuming auth service is available)
    getToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token')
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result)
            reader.onerror = error => reject(error)
        })
    }

    // Compress image
    async compressImage(file, options = {}) {
        const {
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 0.8,
            format = 'image/jpeg'
        } = options

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img

                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }

                if (height > maxHeight) {
                    width = (width * maxHeight) / height
                    height = maxHeight
                }

                canvas.width = width
                canvas.height = height

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(resolve, format, quality)
            }

            img.onerror = reject
            img.src = URL.createObjectURL(file)
        })
    }

    // Extract text from file (OCR simulation)
    async extractTextFromFile(file) {
        // This would typically use an OCR service
        // For now, return a placeholder
        return {
            success: true,
            text: 'Extracted text would appear here...',
            confidence: 0.95
        }
    }
}

// Create singleton instance
const fileService = new FileService()

export default fileService