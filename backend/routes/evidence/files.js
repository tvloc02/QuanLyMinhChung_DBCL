const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const { auth } = require('../../middleware/auth');
const { upload, handleUploadError } = require('../../middleware/upload');
const validation = require('../../middleware/validation');
const {
    uploadFiles,
    downloadFile,
    streamFile,
    deleteFile,
    getFileInfo,
    moveFile,
    searchFiles,
    getFileStatistics
} = require('../../controllers/evidence/fileController');

// Upload files
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

// Download file
router.get('/download/:id',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    downloadFile
);

// Stream file (for preview) - ÁP DỤNG AUTH ĐÃ SỬA
router.get('/stream/:id',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    streamFile
);

// Get file info
router.get('/:id/info',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    getFileInfo
);

// Delete file
router.delete('/:id',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    deleteFile
);

// Get files by evidence
router.get('/evidence/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ'),
        query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Giới hạn không hợp lệ')
    ],
    validation,
    async (req, res) => {
        try {
            const { evidenceId, page = 1, limit = 10 } = req.query;
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

// Search files
router.get('/search',
    auth,
    searchFiles
);

// Get file statistics
router.get('/statistics/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')
    ],
    validation,
    getFileStatistics
);

module.exports = router;