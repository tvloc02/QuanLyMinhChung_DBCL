const File = require('../../models/Evidence/File');
const Evidence = require('../../models/Evidence/Evidence');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

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

        if (req.user.role !== 'admin') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = evidence.departmentId?.toString();
            const isAssigned = evidence.assignedTo?.some(id => id.toString() === req.user.id);

            if (req.user.role === 'manager') {
                if (userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có quyền upload file cho minh chứng của phòng ban mình'
                    });
                }
            } else if (req.user.role === 'tdg') {
                if (!isAssigned && userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền upload file cho minh chứng này'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền upload file'
                });
            }
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

        const evidence = file.evidenceId;
        if (req.user.role !== 'admin') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = evidence.departmentId?.toString();
            const isAssigned = evidence.assignedTo?.some(id => id.toString() === req.user.id);

            if (req.user.role === 'manager') {
                if (userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền tải file này'
                    });
                }
            } else if (req.user.role === 'tdg') {
                if (!isAssigned && userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền tải file này'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền tải file'
                });
            }
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

        const evidence = file.evidenceId;

        if (req.user.role !== 'admin') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = evidence.departmentId?.toString();
            const isAssigned = evidence.assignedTo?.some(id => id.toString() === req.user.id);
            const isFileUploader = file.uploadedBy?.toString() === req.user.id;

            if (req.user.role === 'manager') {
                if (userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có quyền xóa file của phòng ban mình'
                    });
                }
            } else if (req.user.role === 'tdg') {
                if (!isFileUploader) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có quyền xóa file của mình'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xóa file'
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

            if (file.approvalStatus === 'approved') {
                return res.status(403).json({
                    success: false,
                    message: 'Không thể xóa file đã được duyệt. Vui lòng bỏ duyệt trước khi xóa.'
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
            .populate('evidenceId', 'code name departmentId assignedTo')
            .populate('uploadedBy', 'fullName email')
            .populate('parentFolder', 'originalName type');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        const evidence = file.evidenceId;
        if (req.user.role !== 'admin') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = evidence.departmentId?.toString();
            const isAssigned = evidence.assignedTo?.some(id => id.toString() === req.user.id);

            if (req.user.role === 'manager') {
                if (userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xem thông tin file này'
                    });
                }
            } else if (req.user.role === 'tdg') {
                if (!isAssigned && userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xem thông tin file này'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem thông tin file'
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

        if (req.user.role !== 'admin') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = evidence.departmentId?.toString();
            const isAssigned = evidence.assignedTo?.some(id => id.toString() === req.user.id);

            if (req.user.role === 'manager') {
                if (userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có quyền tạo thư mục cho minh chứng của phòng ban mình'
                    });
                }
            } else if (req.user.role === 'tdg') {
                if (!isAssigned && userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền tạo thư mục cho minh chứng này'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền tạo thư mục'
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

        // ===== KIỂM TRA QUYỀN ĐỔI TÊN FOLDER =====
        if (req.user.role !== 'admin') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = folder.evidenceId.departmentId?.toString();

            if (req.user.role === 'manager') {
                if (userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có quyền đổi tên thư mục của phòng ban mình'
                    });
                }
            } else if (req.user.role === 'tdg') {
                const isFileUploader = folder.uploadedBy?.toString() === req.user.id;
                if (!isFileUploader) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có quyền đổi tên thư mục của mình'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền đổi tên thư mục'
                });
            }
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

        // ===== KIỂM TRA QUYỀN XEM NỘI DUNG FOLDER =====
        const evidence = await Evidence.findById(evidenceId).populate('departmentId assignedTo');
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        if (req.user.role !== 'admin') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = evidence.departmentId?._id?.toString();
            const isAssigned = evidence.assignedTo?.some(user => user._id.toString() === req.user.id);

            if (req.user.role === 'manager') {
                if (userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xem nội dung này'
                    });
                }
            } else if (req.user.role === 'tdg') {
                if (!isAssigned && userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xem nội dung này'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem nội dung'
                });
            }
        }

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
            .sort({ type: -1, originalName: 1 });

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

        // ===== KIỂM TRA QUYỀN DI CHUYỂN FILE =====
        if (req.user.role !== 'admin') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = file.evidenceId.departmentId?.toString();

            if (req.user.role === 'manager') {
                if (userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có quyền di chuyển file của phòng ban mình'
                    });
                }
            } else if (req.user.role === 'tdg') {
                const isFileUploader = file.uploadedBy?.toString() === req.user.id;
                if (!isFileUploader) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn chỉ có quyền di chuyển file của mình'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền di chuyển file'
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

        const evidence = await Evidence.findById(evidenceId).populate('departmentId assignedTo');
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        // ===== KIỂM TRA QUYỀN XEM TREE =====
        if (req.user.role !== 'admin') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = evidence.departmentId?._id?.toString();
            const isAssigned = evidence.assignedTo?.some(user => user._id.toString() === req.user.id);

            if (req.user.role === 'manager') {
                if (userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xem cây thư mục này'
                    });
                }
            } else if (req.user.role === 'tdg') {
                if (!isAssigned && userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xem cây thư mục này'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem cây thư mục'
                });
            }
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
            const evidence = await Evidence.findById(evidenceId).populate('departmentId assignedTo');
            if (!evidence) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy minh chứng'
                });
            }

            // ===== KIỂM TRA QUYỀN TÌM KIẾM =====
            if (req.user.role !== 'admin') {
                const userDeptId = req.user.department?.toString();
                const evidenceDeptId = evidence.departmentId?._id?.toString();
                const isAssigned = evidence.assignedTo?.some(user => user._id.toString() === req.user.id);

                if (req.user.role === 'manager') {
                    if (userDeptId !== evidenceDeptId) {
                        return res.status(403).json({
                            success: false,
                            message: 'Bạn không có quyền tìm kiếm file này'
                        });
                    }
                } else if (req.user.role === 'tdg') {
                    if (!isAssigned && userDeptId !== evidenceDeptId) {
                        return res.status(403).json({
                            success: false,
                            message: 'Bạn không có quyền tìm kiếm file này'
                        });
                    }
                } else {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền tìm kiếm file'
                    });
                }
            }

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

        const evidence = await Evidence.findById(evidenceId).populate('departmentId assignedTo');
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        // ===== KIỂM TRA QUYỀN XEM THỐNG KÊ =====
        if (req.user.role !== 'admin') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = evidence.departmentId?._id?.toString();
            const isAssigned = evidence.assignedTo?.some(user => user._id.toString() === req.user.id);

            if (req.user.role === 'manager') {
                if (userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xem thống kê này'
                    });
                }
            } else if (req.user.role === 'tdg') {
                if (!isAssigned && userDeptId !== evidenceDeptId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền xem thống kê này'
                    });
                }
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem thống kê'
                });
            }
        }

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

const submitEvidence = async (req, res) => {
    try {
        const { evidenceId } = req.params;

        // Chỉ TDG được nộp
        if (req.user.role !== 'tdg') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ TDG được nộp file'
            });
        }

        const File = require('../../models/Evidence/File');
        const Evidence = require('../../models/Evidence/Evidence');

        const evidence = await Evidence.findById(evidenceId);
        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        // Check quyền
        const isAssigned = evidence.assignedTo?.some(id => id.toString() === req.user.id);
        const userDeptId = req.user.department?.toString();
        const evidenceDeptId = evidence.departmentId?.toString();

        if (!isAssigned && userDeptId !== evidenceDeptId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền nộp file cho minh chứng này'
            });
        }

        // Lấy tất cả file của user chưa nộp
        const filesToSubmit = await File.find({
            evidenceId,
            uploadedBy: req.user.id,
            type: 'file',
            isSubmitted: false,
            status: 'active'
        });

        if (filesToSubmit.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có file để nộp'
            });
        }

        const submittedAt = new Date();

        // Update tất cả file thành submitted
        const result = await File.updateMany(
            {
                evidenceId,
                uploadedBy: req.user.id,
                type: 'file',
                isSubmitted: false,
                status: 'active'
            },
            {
                $set: {
                    isSubmitted: true,
                    submittedAt,
                    submittedBy: req.user.id,
                    approvalStatus: 'pending'
                }
            }
        );

        // Log activity
        await File.findOne({
            evidenceId,
            uploadedBy: req.user.id
        }).then(async file => {
            if (file) {
                await file.addActivityLog(
                    'evidence_submit',
                    req.user.id,
                    `Nộp minh chứng với ${filesToSubmit.length} file`,
                    {
                        severity: 'medium',
                        result: 'success',
                        fileCount: filesToSubmit.length,
                        submittedAt
                    }
                );
            }
        });

        res.json({
            success: true,
            message: `Nộp thành công ${filesToSubmit.length} file. Chờ manager duyệt.`,
            data: {
                submittedCount: filesToSubmit.length,
                submittedAt
            }
        });

    } catch (error) {
        console.error('Submit evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi nộp file'
        });
    }
};

const approveFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        // Chỉ Manager/Admin được duyệt
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Manager hoặc Admin được duyệt file'
            });
        }

        const File = require('../../models/Evidence/File');
        const file = await File.findById(fileId).populate('evidenceId');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        // Check file là pending
        if (file.approvalStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'File này không ở trạng thái chờ duyệt'
            });
        }

        // Check quyền (Manager chỉ duyệt file của phòng ban mình)
        if (req.user.role === 'manager') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = file.evidenceId.departmentId?.toString();

            if (userDeptId !== evidenceDeptId) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền duyệt file này'
                });
            }
        }

        // Cập nhật file
        file.approvalStatus = 'approved';
        file.approvedBy = req.user.id;
        file.approvalDate = new Date();
        await file.save();

        // Log activity
        await file.addActivityLog(
            'file_approve',
            req.user.id,
            `Duyệt file: ${file.originalName}`,
            {
                severity: 'medium',
                result: 'success',
                approvedBy: req.user.id
            }
        );

        res.json({
            success: true,
            message: 'Duyệt file thành công',
            data: file
        });

    } catch (error) {
        console.error('Approve file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi duyệt file'
        });
    }
};

// ===== 5. TỪ CHỐI FILE (MANAGER TỪ CHỐI) =====
const rejectFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { rejectionReason } = req.body;

        // Chỉ Manager/Admin được từ chối
        if (req.user.role !== 'manager' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ Manager hoặc Admin được từ chối file'
            });
        }

        if (!rejectionReason || !rejectionReason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập lý do từ chối'
            });
        }

        const File = require('../../models/Evidence/File');
        const file = await File.findById(fileId).populate('evidenceId');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy file'
            });
        }

        // Check file là pending
        if (file.approvalStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'File này không ở trạng thái chờ duyệt'
            });
        }

        // Check quyền (Manager chỉ từ chối file của phòng ban mình)
        if (req.user.role === 'manager') {
            const userDeptId = req.user.department?.toString();
            const evidenceDeptId = file.evidenceId.departmentId?.toString();

            if (userDeptId !== evidenceDeptId) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền từ chối file này'
                });
            }
        }

        // Cập nhật file
        file.approvalStatus = 'rejected';
        file.approvedBy = req.user.id;
        file.approvalDate = new Date();
        file.rejectionReason = rejectionReason.trim();
        await file.save();

        // Log activity
        await file.addActivityLog(
            'file_reject',
            req.user.id,
            `Từ chối file: ${file.originalName}`,
            {
                severity: 'medium',
                result: 'success',
                rejectionReason: rejectionReason.trim(),
                approvedBy: req.user.id
            }
        );

        res.json({
            success: true,
            message: 'Từ chối file thành công',
            data: file
        });

    } catch (error) {
        console.error('Reject file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi từ chối file'
        });
    }
};

// ===== HELPER: Update folder metadata =====
const updateFolderMetadata = async (folderId) => {
    try {
        const File = require('../../models/Evidence/File');
        const children = await File.find({ parentFolder: folderId });

        let fileCount = 0;
        let totalSize = 0;

        for (const child of children) {
            if (child.type === 'file') {
                fileCount++;
                totalSize += child.size || 0;
            } else if (child.type === 'folder') {
                fileCount += child.folderMetadata?.fileCount || 0;
                totalSize += child.folderMetadata?.totalSize || 0;
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
    getFileStatistics,
    submitEvidence,
    approveFile,
    rejectFile
};