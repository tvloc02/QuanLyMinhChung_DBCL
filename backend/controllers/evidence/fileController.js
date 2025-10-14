const File = require('../../models/Evidence/File');
const Evidence = require('../../models/Evidence/Evidence');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Hàm updateFolderMetadata (giữ nguyên)
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

        // Validate parent folder if provided
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
            // SỬA LỖI FONT: Mã hóa tên file gốc để sử dụng an toàn trong path
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
                originalName: file.originalname, // Lưu tên gốc (có thể chứa ký tự tiếng Việt)
                storedName, // Lưu tên đã được mã hóa URI (an toàn trong filesystem)
                filePath: permanentPath,
                size: file.size,
                mimeType: file.mimetype,
                extension: path.extname(file.originalname).toLowerCase(),
                evidenceId,
                uploadedBy: req.user.id,
                url: `/uploads/evidences/${storedName}`,
                type: 'file',
                parentFolder: parentFolderId || null,
                approvalStatus: req.user.role === 'admin' ? 'approved' : 'pending',
                approvedBy: req.user.role === 'admin' ? req.user.id : null,
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

        if (!fs.existsSync(file.filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File không tồn tại trên hệ thống'
            });
        }

        await file.incrementDownloadCount();

        // SỬA LỖI FONT: Dùng tên gốc (đã được lưu đúng) khi download
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

        const file = await File.findById(id).populate('evidenceId');
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
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
            .populate('evidenceId', 'code name')
            .populate('uploadedBy', 'fullName email')
            .populate('parentFolder', 'originalName type');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
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


const createFolder = async (req, res) => {
    try {
        const { evidenceId } = req.params;
        const { folderName, parentFolderId } = req.body;

        if (!folderName) {
            return res.status(400).json({
                success: false,
                message: 'Tên thư mục là bắt buộc'
            });
        }

        const evidence = await Evidence.findById(evidenceId);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(evidence.standardId) &&
            !req.user.hasCriteriaAccess(evidence.criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo thư mục cho minh chứng này'
            });
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

        const folder = new File({
            originalName: folderName.trim(),
            storedName: folderName.trim(),
            filePath: '',
            size: 0,
            mimeType: 'folder',
            extension: '',
            type: 'folder',
            evidenceId,
            uploadedBy: req.user.id,
            parentFolder: parentFolderId || null,
            folderMetadata: {
                fileCount: 0,
                totalSize: 0,
                lastModified: new Date()
            }
        });

        await folder.save();

        evidence.files.push(folder._id);
        await evidence.save();

        if (parentFolderId) {
            await updateFolderMetadata(parentFolderId);
        }

        res.status(201).json({
            success: true,
            message: 'Tạo thư mục thành công',
            data: folder
        });

    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo thư mục'
        });
    }
};

const renameFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const { newName } = req.body;

        if (!newName) {
            return res.status(400).json({
                success: false,
                message: 'Tên mới là bắt buộc'
            });
        }

        const folder = await File.findById(id).populate('evidenceId');
        if (!folder) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thư mục'
            });
        }

        if (folder.type !== 'folder') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể đổi tên thư mục'
            });
        }

        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(folder.evidenceId.standardId) &&
            !req.user.hasCriteriaAccess(folder.evidenceId.criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền đổi tên thư mục này'
            });
        }

        folder.originalName = newName.trim();
        folder.storedName = newName.trim();
        folder.folderMetadata.lastModified = new Date();
        await folder.save();

        res.json({
            success: true,
            message: 'Đổi tên thư mục thành công',
            data: folder
        });

    } catch (error) {
        console.error('Rename folder error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đổi tên thư mục'
        });
    }
};

const getFolderContents = async (req, res) => {
    try {
        const { id } = req.params;
        const { evidenceId } = req.query;

        let query = {};

        if (id === 'root') {
            query = {
                evidenceId,
                parentFolder: null
            };
        } else {
            const folder = await File.findOne({ _id: id, type: 'folder' });
            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thư mục'
                });
            }

            query = { parentFolder: id };
        }

        const items = await File.find(query)
            .populate('uploadedBy', 'fullName email')
            .sort({ type: -1, originalName: 1 }); // Folders first, then files

        res.json({
            success: true,
            data: items
        });

    } catch (error) {
        console.error('Get folder contents error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy nội dung thư mục'
        });
    }
};

const moveFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetFolderId } = req.body;

        const file = await File.findById(id).populate('evidenceId');
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file/thư mục'
            });
        }

        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(file.evidenceId.standardId) &&
            !req.user.hasCriteriaAccess(file.evidenceId.criteriaId)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền di chuyển file/thư mục này'
            });
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

const getFolderTree = async (req, res) => {
    try {
        const { evidenceId } = req.params;

        const evidence = await Evidence.findById(evidenceId);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        const allItems = await File.find({ evidenceId })
            .populate('uploadedBy', 'fullName')
            .sort({ type: -1, originalName: 1 });

        const tree = buildTree(allItems, null);

        res.json({
            success: true,
            data: tree
        });

    } catch (error) {
        console.error('Get folder tree error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy cây thư mục'
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

        const stats = await File.aggregate([
            { $match: { evidenceId: mongoose.Types.ObjectId(evidenceId) } },
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
                    evidenceId: mongoose.Types.ObjectId(evidenceId),
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

const buildTree = (items, parentId) => {
    const children = items.filter(item => {
        const itemParentId = item.parentFolder ? item.parentFolder.toString() : null;
        return itemParentId === parentId;
    });

    return children.map(item => ({
        ...item.toObject(),
        children: item.type === 'folder' ? buildTree(items, item._id.toString()) : []
    }));
};

module.exports = {
    uploadFiles,
    downloadFile,
    deleteFile,
    getFileInfo,
    createFolder,
    renameFolder,
    getFolderContents,
    moveFile,
    getFolderTree,
    searchFiles,
    getFileStatistics
};