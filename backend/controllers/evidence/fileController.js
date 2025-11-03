const File = require('../../models/Evidence/File');
const Evidence = require('../../models/Evidence/Evidence');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const permissionService = require('../../services/permissionService');

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

        const fs = require('fs');
        const path = require('path');

        for (const file of files) {
            const encodedFileName = encodeURIComponent(file.originalname);

            const storedName = File.generateStoredName(
                evidence.code,
                evidence.name,
                encodedFileName
            );

            const permanentPath = path.join('uploads', 'evidences', storedName);
            const permanentDir = path.dirname(permanentPath);

            if (!fs.existsSync(permanentDir)) {
                fs.mkdirSync(permanentDir, { recursive: true });
            }

            if (fs.existsSync(file.path)) {
                fs.renameSync(file.path, permanentPath);
            } else {
                console.warn(`File temp không tồn tại: ${file.path}. Bỏ qua rename.`);
                continue;
            }

            const fileDoc = new File({
                originalName: file.originalname,
                storedName,
                filePath: permanentPath,
                size: file.size,
                mimeType: file.mimetype,
                extension: path.extname(file.originalname).toLowerCase(),
                evidenceId,
                uploadedBy: userId,
                url: `/uploads/evidences/${storedName}`,
                type: 'file',
                parentFolder: parentFolderId || null,
                approvalStatus: req.user.role === 'admin' ? 'approved' : 'pending',
                approvedBy: req.user.role === 'admin' ? userId : null,
                approvalDate: req.user.role === 'admin' ? new Date() : null
            });

            await fileDoc.save();
            savedFiles.push(fileDoc);

            if (parentFolderId) {
                await updateFolderMetadata(parentFolderId);
            }
        }

        evidence.files.push(...savedFiles.map(f => f._id));
        await evidence.save();
        await evidence.updateStatus();

        res.json({
            success: true,
            message: `Upload thành công ${savedFiles.length} file`,
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

        const fs = require('fs');
        const path = require('path');

        if (!fs.existsSync(file.filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File không tồn tại trên hệ thống'
            });
        }

        if (req.user.role === 'reporter') {
            const academicYearId = file.evidenceId.academicYearId;
            const accessibleCriteriaIds = await permissionService.getAccessibleCriteriaIds(req.user.id, academicYearId);
            if (!accessibleCriteriaIds.map(id => id.toString()).includes(file.evidenceId.criteriaId.toString())) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập file này'
                });
            }
        }

        await file.incrementDownloadCount();

        const decodedFileName = file.originalName;

        res.download(file.filePath, decodedFileName);

    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải file'
        });
    }
};

const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        let academicYearId = req.academicYearId;

        const file = await File.findById(id).populate('evidenceId');
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
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
                    message: 'Bạn không có quyền xóa file này'
                });
            }
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

        const fs = require('fs');

        if (file.type === 'file' && fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
        }

        await Evidence.findByIdAndUpdate(
            file.evidenceId._id,
            { $pull: { files: file._id } }
        );

        await File.findByIdAndDelete(id);

        if (file.evidenceId) {
            await Evidence.findById(file.evidenceId._id).then(e => e?.updateStatus());
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

        if (req.user.role === 'reporter') {
            const academicYearId = file.evidenceId.academicYearId;
            const accessibleCriteriaIds = await permissionService.getAccessibleCriteriaIds(req.user.id, academicYearId);
            if (!accessibleCriteriaIds.map(id => id.toString()).includes(file.evidenceId.criteriaId.toString())) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập file này'
                });
            }
        }

        res.json({
            success: true,
            data: file
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
        const {
            evidenceId,
            keyword,
            fileType,
            minSize,
            maxSize,
            uploadedBy,
            dateFrom,
            dateTo
        } = req.query;

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
                { extractedContent: { $regex: keyword, $options: 'i' } }
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
            return res.status(404).json({ success: false, message: 'Không tìm thấy minh chứng' });
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
                    totalDownloads: { $sum: '$downloadCount' }
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
            totalDownloads: 0
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
    deleteFile,
    getFileInfo,
    moveFile,
    searchFiles,
    getFileStatistics
};