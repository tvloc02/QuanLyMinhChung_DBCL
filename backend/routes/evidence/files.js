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

// Route download file
router.get('/download/:id',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    downloadFile
);

// Route lấy thông tin file
router.get('/:id/info',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    getFileInfo
);

// Route xóa file
router.delete('/:id',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    deleteFile
);

// Route tạo folder cho TDG
router.post('/create-folder/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')
    ],
    validation,
    createFolder
);

// Route lấy danh sách file/folder của minh chứng (phân trang)
router.get('/list/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
        query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit phải từ 1-50'),
        query('folderId').optional()
    ],
    validation,
    async (req, res) => {
        try {
            const { evidenceId } = req.params;
            const { page = 1, limit = 20, folderId } = req.query;

            const File = require('../../models/Evidence/File');
            const Evidence = require('../../models/Evidence/Evidence');

            const evidence = await Evidence.findById(evidenceId).populate('departmentId assignedTo');
            if (!evidence) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy minh chứng'
                });
            }

            // ===== KIỂM TRA QUYỀN TRUY CẬP =====
            if (req.user.role !== 'admin') {
                const userDeptId = req.user.department?.toString();
                const evidenceDeptId = evidence.departmentId?._id?.toString();
                const isAssigned = evidence.assignedTo?.some(user => user._id.toString() === req.user.id);

                if (req.user.role === 'manager') {
                    // Manager: được xem file của phòng ban mình
                    if (userDeptId !== evidenceDeptId) {
                        return res.status(403).json({
                            success: false,
                            message: 'Không có quyền truy cập minh chứng này'
                        });
                    }
                } else if (req.user.role === 'tdg') {
                    // TDG: được xem file của minh chứng nếu được phân quyền hoặc thuộc phòng ban tạo
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

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            // Query để lấy file
            let query = { evidenceId, status: 'active' };

            // Nếu là TDG thì chỉ lấy file của chính họ hoặc file đã được nộp (submitted)
            if (req.user.role === 'tdg') {
                query.$or = [
                    { uploadedBy: req.user.id },
                    { isSubmitted: true } // File đã được nộp thì TDG được xem
                ];
            }

            // Nếu có folderId, lấy file trong folder đó
            if (folderId && folderId !== 'root') {
                query.parentFolder = folderId;
            } else {
                query.parentFolder = null;
            }

            const [files, total] = await Promise.all([
                File.find(query)
                    .populate('uploadedBy', 'fullName email')
                    .populate('approvedBy', 'fullName email')
                    .sort({ uploadedAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                File.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: {
                    files,
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

// Route lấy contents của folder
router.get('/folder/:folderId/contents',
    auth,
    [
        param('folderId').isMongoId().withMessage('ID folder không hợp lệ')
    ],
    validation,
    getFolderContents
);

// Route nộp file (submit) - TDG nộp file cho manager duyệt
router.post('/submit/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')
    ],
    validation,
    submitEvidence
);

// Route duyệt file - Manager duyệt file
router.post('/approve/:fileId',
    auth,
    [
        param('fileId').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    approveFile
);

// Route từ chối file - Manager từ chối file
router.post('/reject/:fileId',
    auth,
    [
        param('fileId').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    rejectFile
);

// Route stream file (xem file online)
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

            // ===== KIỂM TRA QUYỀN XEM FILE =====
            const evidence = file.evidenceId;
            if (req.user.role !== 'admin') {
                const userDeptId = req.user.department?.toString();
                const evidenceDeptId = evidence.departmentId?.toString();
                const isAssigned = evidence.assignedTo?.some(id => id.toString() === req.user.id);

                // TDG chỉ xem được file của mình hoặc file đã được nộp
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