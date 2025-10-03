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
    getFileInfo
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

router.get('/evidence/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
        query('page').optional().isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit phải từ 1-50')
    ],
    validation,
    async (req, res) => {
        try {
            const { evidenceId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const File = require('../../models/Evidence/File');
            const Evidence = require('../../models/Evidence/Evidence');

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
                    message: 'Không có quyền truy cập minh chứng này'
                });
            }

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const [files, total] = await Promise.all([
                File.find({ evidenceId, status: 'active' })
                    .populate('uploadedBy', 'fullName email')
                    .sort({ uploadedAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                File.countDocuments({ evidenceId, status: 'active' })
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

            if (req.user.role !== 'admin' &&
                !req.user.hasStandardAccess(file.evidenceId.standardId) &&
                !req.user.hasCriteriaAccess(file.evidenceId.criteriaId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền truy cập file này'
                });
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