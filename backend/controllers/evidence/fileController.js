const File = require('../../models/Evidence/File');
const Evidence = require('../../models/Evidence/Evidence');
const path = require('path');
const mongoose = require('mongoose');
const permissionService = require('../../services/permissionService');
const jwt = require('jsonwebtoken');
const { GridFSBucket } = require('mongodb');
const axios = require('axios');
const FormData = require('form-data');

let gfsBucket;
mongoose.connection.once('open', () => {
    gfsBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
});

const authenticateTokenFromQuery = (req) => {
    const token = req.query.token;
    if (!token) return false;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
        req.user = decoded;
        return true;
    } catch (error) {
        return false;
    }
};

const updateFolderMetadata = async (folderId) => {
    try {
        const children = await File.find({ parentFolder: folderId });
        let fileCount = 0;
        let totalSize = 0;

        for (const child of children) {
            if (child.type === 'file') {
                fileCount++;
                totalSize += child.size;
            } else if (child.type === 'folder') {
                fileCount += child.folderMetadata.fileCount;
                totalSize += child.folderMetadata.totalSize;
            }
        }

        await File.findByIdAndUpdate(folderId, {
            'folderMetadata.fileCount': fileCount,
            'folderMetadata.totalSize': totalSize,
            'folderMetadata.lastModified': new Date()
        });
    } catch (error) {
        console.error('Update folder metadata error:', error);
    }
};

// Hàm xử lý file và gửi tới Python service
const processFileContent = async (fileId) => {
    try {
        const file = await File.findById(fileId);
        if (!file) return;

        // Đánh dấu đang xử lý
        file.processStatus = 'processing';
        await file.save();

        // Lấy nội dung file từ GridFS
        const chunks = [];
        const downloadStream = gfsBucket.openDownloadStream(file.gridfsId);

        await new Promise((resolve, reject) => {
            downloadStream.on('data', chunk => chunks.push(chunk));
            downloadStream.on('end', resolve);
            downloadStream.on('error', reject);
        });

        const fileBuffer = Buffer.concat(chunks);

        // Gửi file tới Python service để xử lý
        const formData = new FormData();
        formData.append('file', fileBuffer, {
            filename: file.originalName,
            contentType: file.mimeType
        });
        formData.append('file_id', fileId.toString());

        const response = await axios.post(
            `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/process-file`,
            formData,
            {
                headers: formData.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity
            }
        );

        if (response.data.success) {
            // Cập nhật file với nội dung và tóm tắt
            file.extractedContent = response.data.content;
            file.summary = response.data.summary;
            file.vectorId = response.data.vector_id;
            file.processStatus = 'completed';
            await file.save();
        } else {
            file.processStatus = 'failed';
            await file.save();
        }

    } catch (error) {
        console.error('Process file content error:', error);
        await File.findByIdAndUpdate(fileId, { processStatus: 'failed' });
    }
};

const uploadFiles = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const { parentFolderId } = req.body;
        const files = req.files;
        const userId = req.user.id;
        let academicYearId = req.academicYearId;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có file nào được upload'
            });
        }

        const evidence = await Evidence.findById(evidenceId);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        if (!academicYearId) {
            academicYearId = evidence.academicYearId;
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            const canUpload = await permissionService.canUploadEvidence(userId, evidence.criteriaId, academicYearId);
            if (!canUpload) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền upload file cho minh chứng này'
                });
            }
        }

        if (parentFolderId) {
            const parentFolder = await File.findOne({
                _id: parentFolderId,
                evidenceId,
                type: 'folder'
            });

            if (!parentFolder) {
                return res.status(404).json({
                    success: false,
                    message: 'Thư mục cha không tồn tại'
                });
            }
        }

        const savedFiles = [];

        for (const file of files) {
            const originalNameUtf8 = file.originalname;

            const fileDoc = new File({
                originalName: originalNameUtf8,
                gridfsId: file.id,
                size: file.size,
                mimeType: file.mimetype,
                extension: path.extname(originalNameUtf8).toLowerCase(),
                evidenceId,
                uploadedBy: userId,
                uploadedAt: new Date(),
                type: 'file',
                parentFolder: parentFolderId || null,
                processStatus: 'pending'
            });

            await fileDoc.save();
            savedFiles.push(fileDoc);

            // Xử lý file không đồng bộ
            processFileContent(fileDoc._id);

            if (parentFolderId) {
                await updateFolderMetadata(parentFolderId);
            }
        }

        evidence.files.push(...savedFiles.map(f => f._id));
        await evidence.save();

        res.json({
            success: true,
            message: `Upload thành công ${savedFiles.length} file. Đang xử lý nội dung...`,
            data: savedFiles
        });

    } catch (error) {
        console.error('Upload files error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi upload file'
        });
    }
};

const downloadFile = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findById(id).populate('evidenceId');
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        if (file.type === 'folder') {
            return res.status(400).json({
                success: false,
                message: 'Không thể tải xuống thư mục'
            });
        }

        await file.incrementDownloadCount();

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
        res.setHeader('Content-Type', file.mimeType);

        const downloadStream = gfsBucket.openDownloadStream(file.gridfsId);

        downloadStream.on('error', (err) => {
            console.error('GridFS download error:', err);
            if (!res.headersSent) {
                return res.status(404).json({
                    success: false,
                    message: 'File không tồn tại trên hệ thống lưu trữ'
                });
            }
        });

        downloadStream.pipe(res);

    } catch (error) {
        console.error('Download file error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi tải file'
            });
        }
    }
};

const streamFile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            const isAuthenticated = authenticateTokenFromQuery(req);
            if (!isAuthenticated) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền truy cập file stream'
                });
            }
        }

        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        if (file.type === 'folder') {
            return res.status(400).json({
                success: false,
                message: 'Không thể stream thư mục'
            });
        }

        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Disposition', 'inline');

        const downloadStream = gfsBucket.openDownloadStream(file.gridfsId);

        downloadStream.on('error', (err) => {
            console.error('GridFS stream error:', err);
            if (!res.headersSent) {
                return res.status(404).json({
                    success: false,
                    message: 'File không tồn tại trên hệ thống lưu trữ'
                });
            }
        });

        downloadStream.pipe(res);

    } catch (error) {
        console.error('Stream file error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi stream file'
            });
        }
    }
};

const getFileContent = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findById(id)
            .select('originalName extractedContent summary processStatus vectorId')
            .populate('uploadedBy', 'fullName');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        res.json({
            success: true,
            data: {
                originalName: file.originalName,
                content: file.extractedContent,
                summary: file.summary,
                processStatus: file.processStatus,
                vectorId: file.vectorId,
                uploadedBy: file.uploadedBy
            }
        });

    } catch (error) {
        console.error('Get file content error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy nội dung file'
        });
    }
};

const reprocessFile = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        // Xử lý lại file
        processFileContent(id);

        res.json({
            success: true,
            message: 'Đang xử lý lại nội dung file...'
        });

    } catch (error) {
        console.error('Reprocess file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xử lý lại file'
        });
    }
};

const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const file = await File.findById(id).populate('evidenceId');
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        const isUploader = file.uploadedBy.toString() === userId.toString();
        const hasManagerRole = req.user.role === 'admin' || req.user.role === 'manager';
        const canDelete = hasManagerRole || isUploader;

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa file này'
            });
        }

        if (file.type === 'folder') {
            const childrenCount = await File.countDocuments({ parentFolder: id });
            if (childrenCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa thư mục có chứa file/thư mục con'
                });
            }
        }

        const parentFolderId = file.parentFolder;

        // Xóa vector từ Python service nếu có
        if (file.vectorId) {
            try {
                await axios.delete(
                    `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/delete-vector/${file.vectorId}`
                );
            } catch (error) {
                console.error('Delete vector error:', error);
            }
        }

        await Evidence.findByIdAndUpdate(
            file.evidenceId._id,
            { $pull: { files: file._id } }
        );

        await File.findByIdAndDelete(id);

        if (file.evidenceId) {
            await Evidence.findById(file.evidenceId._id).then(e => e?.updateStatus?.());
        }

        if (parentFolderId) {
            await updateFolderMetadata(parentFolderId);
        }

        res.json({
            success: true,
            message: file.type === 'folder' ? 'Xóa thư mục thành công' : 'Xóa file thành công'
        });

    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xóa file'
        });
    }
};

const getFileInfo = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findById(id)
            .populate('evidenceId', 'code name academicYearId criteriaId')
            .populate('uploadedBy', 'fullName email')
            .populate('parentFolder', 'originalName type');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        const isUploader = file.uploadedBy._id.toString() === req.user.id.toString();

        res.json({
            success: true,
            data: file,
            canDelete: req.user.role === 'admin' || req.user.role === 'manager' || isUploader
        });

    } catch (error) {
        console.error('Get file info error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin file'
        });
    }
};

const moveFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetFolderId } = req.body;
        const userId = req.user.id;
        let academicYearId = req.academicYearId;

        const file = await File.findById(id).populate('evidenceId');
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file/thư mục'
            });
        }

        if (!academicYearId) {
            academicYearId = file.evidenceId.academicYearId;
        }

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            const evidence = file.evidenceId;
            const canManage = await permissionService.canManageFiles(userId, evidence.criteriaId, academicYearId);
            if (!canManage) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền di chuyển file/thư mục này'
                });
            }
        }

        if (targetFolderId && targetFolderId !== 'root') {
            const targetFolder = await File.findOne({
                _id: targetFolderId,
                type: 'folder',
                evidenceId: file.evidenceId
            });

            if (!targetFolder) {
                return res.status(404).json({
                    success: false,
                    message: 'Thư mục đích không tồn tại'
                });
            }

            const checkIfDescendant = async (ancestorId, descendantId) => {
                let currentId = ancestorId;
                while (currentId) {
                    if (currentId.toString() === descendantId.toString()) {
                        return true;
                    }
                    const folder = await File.findById(currentId);
                    if (!folder || !folder.parentFolder) {
                        return false;
                    }
                    currentId = folder.parentFolder;
                }
                return false;
            };

            if (file.type === 'folder') {
                const isDescendant = await checkIfDescendant(targetFolderId, id);
                if (isDescendant || targetFolderId === id) {
                    return res.status(400).json({
                        success: false,
                        message: 'Không thể di chuyển thư mục vào chính nó hoặc thư mục con'
                    });
                }
            }
        }

        const oldParentId = file.parentFolder;
        file.parentFolder = targetFolderId === 'root' ? null : targetFolderId;
        await file.save();

        if (oldParentId) {
            await updateFolderMetadata(oldParentId);
        }
        if (targetFolderId && targetFolderId !== 'root') {
            await updateFolderMetadata(targetFolderId);
        }

        res.json({
            success: true,
            message: 'Di chuyển thành công',
            data: file
        });

    } catch (error) {
        console.error('Move file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi di chuyển file/thư mục'
        });
    }
};

const searchFiles = async (req, res) => {
    try {
        const { evidenceId, keyword, fileType, minSize, maxSize, uploadedBy, dateFrom, dateTo } = req.query;

        let query = {};

        if (req.user.role === 'reporter') {
            const accessibleCriteriaIds = await permissionService.getAccessibleCriteriaIds(req.user.id, req.academicYearId);
            const accessibleEvidenceIds = await Evidence.find({ criteriaId: { $in: accessibleCriteriaIds } }).distinct('_id');

            if (accessibleEvidenceIds.length === 0) {
                return res.json({ success: true, data: { files: [], total: 0 } });
            }
            query.evidenceId = { $in: accessibleEvidenceIds };
        }

        if (evidenceId) {
            query.evidenceId = evidenceId;
        }

        if (keyword) {
            query.$or = [
                { originalName: { $regex: keyword, $options: 'i' } },
                { extractedContent: { $regex: keyword, $options: 'i' } },
                { summary: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (fileType) {
            if (fileType === 'folder') {
                query.type = 'folder';
            } else {
                query.mimeType = { $regex: fileType, $options: 'i' };
            }
        }

        if (minSize || maxSize) {
            query.size = {};
            if (minSize) query.size.$gte = parseInt(minSize);
            if (maxSize) query.size.$lte = parseInt(maxSize);
        }

        if (uploadedBy) {
            query.uploadedBy = uploadedBy;
        }

        if (dateFrom || dateTo) {
            query.uploadedAt = {};
            if (dateFrom) query.uploadedAt.$gte = new Date(dateFrom);
            if (dateTo) query.uploadedAt.$lte = new Date(dateTo);
        }

        const files = await File.find(query)
            .populate('evidenceId', 'code name')
            .populate('uploadedBy', 'fullName email')
            .populate('parentFolder', 'originalName')
            .sort({ uploadedAt: -1 });

        res.json({
            success: true,
            data: {
                files,
                total: files.length
            }
        });

    } catch (error) {
        console.error('Search files error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm file'
        });
    }
};

const getFileStatistics = async (req, res) => {
    try {
        const { evidenceId } = req.params;

        const evidence = await Evidence.findById(evidenceId);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        if (req.user.role === 'reporter') {
            const academicYearId = evidence.academicYearId;
            const accessibleCriteriaIds = await permissionService.getAccessibleCriteriaIds(req.user.id, academicYearId);
            if (!accessibleCriteriaIds.map(id => id.toString()).includes(evidence.criteriaId.toString())) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập minh chứng này'
                });
            }
        }

        const stats = await File.aggregate([
            { $match: { evidenceId: new mongoose.Types.ObjectId(evidenceId) } },
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: { $cond: [{ $eq: ['$type', 'file'] }, 1, 0] } },
                    totalFolders: { $sum: { $cond: [{ $eq: ['$type', 'folder'] }, 1, 0] } },
                    totalSize: { $sum: '$size' },
                    totalDownloads: { $sum: '$downloadCount' },
                    totalProcessed: {
                        $sum: {
                            $cond: [{ $eq: ['$processStatus', 'completed'] }, 1, 0]
                        }
                    },
                    totalPending: {
                        $sum: {
                            $cond: [{ $eq: ['$processStatus', 'pending'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const typeStats = await File.aggregate([
            {
                $match: {
                    evidenceId: new mongoose.Types.ObjectId(evidenceId),
                    type: 'file'
                }
            },
            {
                $group: {
                    _id: '$mimeType',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$size' }
                }
            }
        ]);

        const result = stats[0] || {
            totalFiles: 0,
            totalFolders: 0,
            totalSize: 0,
            totalDownloads: 0,
            totalProcessed: 0,
            totalPending: 0
        };

        res.json({
            success: true,
            data: {
                ...result,
                typeStats
            }
        });

    } catch (error) {
        console.error('Get file statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê file'
        });
    }
};

module.exports = {
    uploadFiles,
    downloadFile,
    streamFile,
    deleteFile,
    getFileInfo,
    getFileContent,
    reprocessFile,
    moveFile,
    searchFiles,
    getFileStatistics
};