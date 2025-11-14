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
    getFileContent,
    reprocessFile,
    moveFile,
    searchFiles,
    getFileStatistics
} = require('../../controllers/evidence/fileController');
const File = require('../../models/Evidence/File');

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

router.get('/stream/:id',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    streamFile
);

router.get('/:id/info',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    getFileInfo
);

// Route mới để lấy nội dung và tóm tắt file
router.get('/:id/content',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    getFileContent
);

// Route mới để xử lý lại file
router.post('/:id/reprocess',
    auth,
    [
        param('id').isMongoId().withMessage('ID file không hợp lệ')
    ],
    validation,
    reprocessFile
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
        query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Giới hạn không hợp lệ')
    ],
    validation,
    async (req, res) => {
        try {
            const { evidenceId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            const [files, total] = await Promise.all([
                File.find({ evidenceId })
                    .populate('uploadedBy', 'fullName email')
                    .sort({ uploadedAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                File.countDocuments({ evidenceId })
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

router.get('/search',
    auth,
    searchFiles
);

router.get('/statistics/:evidenceId',
    auth,
    [
        param('evidenceId').isMongoId().withMessage('ID minh chứng không hợp lệ')
    ],
    validation,
    getFileStatistics
);

module.exports = router;