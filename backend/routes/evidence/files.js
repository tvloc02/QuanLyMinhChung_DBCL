const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const { auth } = require('../../middleware/auth');
const { upload, handleUploadError } = require('../../middleware/upload');
const validation = require('../../middleware/validation');
const {
    uploadFiles,
    downloadFile,
    deleteFile,
    getFileInfo,
    createFolder,
    renameFile,
    renameFolder,
    getFolderContents,
    submitEvidence,
    approveFile,
    rejectFile
} = require('../../controllers/evidence/fileController');

router.post('/upload/:evidenceId',
    auth,
    upload.array('files', 10),
    handleUploadError,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')
    ],
    validation,
    uploadFiles
);

router.get('/download/:id',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    downloadFile
);

router.get('/:id/info',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    getFileInfo
);

router.delete('/:id',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    deleteFile
);

router.post('/rename/:id',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    renameFile
);

router.post('/create-folder/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')
    ],
    validation,
    createFolder
);

router.get('/list/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')
    ],
    validation,
    async (req, res) => {
        try {
            const { evidenceId } = req.params;
            const page = parseInt(req.query.page || 1);
            const limit = parseInt(req.query.limit || 20);
            const { parentFolder } = req.query;

            const File = require('../../models/Evidence/File');
            const Evidence = require('../../models/Evidence/Evidence');

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
                            message: 'Không có quyền truy cập minh chứng này'
                        });
                    }
                } else if (req.user.role === 'tdg') {
                    if (!isAssigned && userDeptId !== evidenceDeptId) {
                        return res.status(403).json({
                            success: false,
                            message: 'Không có quyền truy cập minh chứng này'
                        });
                    }
                } else {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền truy cập'
                    });
                }
            }

            const pageNum = page;
            const limitNum = limit;
            const skip = (pageNum - 1) * limitNum;

            let query = { evidenceId, status: 'active' };

            if (req.user.role === 'tdg') {
                query.$or = [
                    { uploadedBy: req.user.id },
                    { isSubmitted: true }
                ];
            }

            if (parentFolder === 'root' || !parentFolder) {
                query.parentFolder = null;
            } else if (parentFolder !== 'all') {
                query.parentFolder = parentFolder;
            }

            const [items, total] = await Promise.all([
                File.find(query)
                    .populate('uploadedBy', 'fullName email')
                    .populate('approvedBy', 'fullName email')
                    .sort({ type: -1, originalName: 1 })
                    .skip(skip)
                    .limit(limitNum),
                File.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: {
                    items,
                    pagination: {
                        current: pageNum,
                        pages: Math.ceil(total / limitNum),
                        total,
                        hasNext: pageNum * limitNum < total,
                        hasPrev: pageNum > 1
                    }
                }
            });

        } catch (error) {
            console.error('Get files by evidence error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi lấy danh sách file'
            });
        }
    }
);

router.get('/folder/:folderId/contents',
    auth,
    [
        param('folderId').isMongoId().withMessage('ID folder không hợp lệ')
    ],
    validation,
    getFolderContents
);

router.post('/submit/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')
    ],
    validation,
    submitEvidence
);

router.post('/approve/:fileId',
    auth,
    [
        param('fileId').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    approveFile
);

router.post('/reject/:fileId',
    auth,
    [
        param('fileId').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    rejectFile
);

router.get('/stream/:id',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    async (req, res) => {
        try {
            const { id } = req.params;
            const File = require('../../models/Evidence/File');
            const fs = require('fs');
            const path = require('path');

            const file = await File.findById(id).populate('evidenceId');
            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy file'
                });
            }

            const Evidence = require('../../models/Evidence/Evidence');
            const evidence = await Evidence.findById(file.evidenceId._id).populate('assignedTo');

            if (req.user.role !== 'admin') {
                const userDeptId = req.user.department?.toString();
                const evidenceDeptId = evidence.departmentId?.toString();
                const isAssigned = evidence.assignedTo?.some(id => id.toString() === req.user.id);

                if (req.user.role === 'tdg') {
                    const isOwnFile = file.uploadedBy.toString() === req.user.id;
                    const isSubmitted = file.isSubmitted;
                    if (!isOwnFile && !isSubmitted && !isAssigned && userDeptId !== evidenceDeptId) {
                        return res.status(403).json({
                            success: false,
                            message: 'Không có quyền xem file này'
                        });
                    }
                } else if (req.user.role === 'manager') {
                    if (userDeptId !== evidenceDeptId) {
                        return res.status(403).json({
                            success: false,
                            message: 'Không có quyền xem file này'
                        });
                    }
                }
            }

            if (!fs.existsSync(file.filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'File không tồn tại trên hệ thống'
                });
            }

            const stat = fs.statSync(file.filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const fileStream = fs.createReadStream(file.filePath, { start, end });

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': file.mimeType,
                });
                fileStream.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': file.mimeType,
                });
                fs.createReadStream(file.filePath).pipe(res);
            }

        } catch (error) {
            console.error('Stream file error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi stream file'
            });
        }
    }
);

module.exports = router;