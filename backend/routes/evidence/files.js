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

// ✅ SỬA ROUTE LẤY DANH SÁCH FILE/FOLDER (Dùng cho cả phân trang và lấy folder gốc)
router.get('/list/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
        query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit phải từ 1-50'),
        query('parentFolder').optional()
    ],
    validation,
    async (req, res) => {
        try {
            const { evidenceId } = req.params;
            const { page = 1, limit = 20, parentFolder } = req.query; // Dùng parentFolder

            const File = require('../../models/Evidence/File');
            const Evidence = require('../../models/Evidence/Evidence');

            // Cần populate assignedTo cho logic check quyền
            const evidence = await Evidence.findById(evidenceId).populate('departmentId assignedTo');
            if (!evidence) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy minh chứng'
                });
            }

            // ===== KIỂM TRA QUYỀN TRUY CẬP (Logic nhất quán với evidenceController) =====
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
                    // TDG được xem file nếu được phân quyền HOẶC thuộc phòng ban tạo
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
                // TDG chỉ thấy file của mình VÀ folder của mình (folder cũng có uploadedBy) HOẶC file đã được nộp
                query.$or = [
                    { uploadedBy: req.user.id },
                    { isSubmitted: true }
                ];
            }

            // Xác định thư mục cha
            if (parentFolder && parentFolder !== 'root') {
                query.parentFolder = parentFolder;
            } else {
                query.parentFolder = null;
            }

            // Lấy danh sách items (files/folders)
            const [items, total] = await Promise.all([
                File.find(query)
                    .populate('uploadedBy', 'fullName email')
                    .populate('approvedBy', 'fullName email')
                    .sort({ type: -1, originalName: 1 }) // Sắp xếp folder lên trước
                    .skip(skip)
                    .limit(limitNum),
                File.countDocuments(query)
            ]);

            // ✅ TRẢ VỀ CẤU TRÚC ĐỒNG NHẤT
            res.json({
                success: true,
                data: {
                    items, // Sửa tên từ files thành items để dễ quản lý ở Front-end
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

            // ===== KIỂM TRA QUYỀN XEM FILE (Cần sửa để lấy assignedTo) =====
            const Evidence = require('../../models/Evidence/Evidence');
            const evidence = await Evidence.findById(file.evidenceId._id).populate('assignedTo'); // Lấy lại evidence có assignedTo

            if (req.user.role !== 'admin') {
                const userDeptId = req.user.department?.toString();
                const evidenceDeptId = evidence.departmentId?.toString();
                const isAssigned = evidence.assignedTo?.some(id => id.toString() === req.user.id);

                // TDG
                if (req.user.role === 'tdg') {
                    const isOwnFile = file.uploadedBy.toString() === req.user.id;
                    const isSubmitted = file.isSubmitted;
                    // Cho phép nếu là file của mình, HOẶC đã được nộp, HOẶC được phân quyền, HOẶC cùng phòng ban
                    if (!isOwnFile && !isSubmitted && !isAssigned && userDeptId !== evidenceDeptId) {
                        return res.status(403).json({
                            success: false,
                            message: 'Không có quyền xem file này'
                        });
                    }
                } else if (req.user.role === 'manager') {
                    // Manager chỉ cần cùng phòng ban (hoặc được assigned, nhưng ở đây chỉ check dept)
                    if (userDeptId !== evidenceDeptId) {
                        return res.status(403).json({
                            success: false,
                            message: 'Không có quyền xem file này'
                        });
                    }
                }
            }
            // =============================================================

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