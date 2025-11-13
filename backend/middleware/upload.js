const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GridFsStorage } = require('multer-gridfs-storage');

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const decodeFilename = (filename) => {
    console.log('=== DECODE FILENAME DEBUG ===');
    console.log('Original filename:', filename);

    try {
        const decoded1 = Buffer.from(filename, 'latin1').toString('utf8');
        console.log('Method 1 (latin1->utf8):', decoded1);

        const decoded2 = Buffer.from(filename, 'binary').toString('utf8');
        console.log('Method 2 (binary->utf8):', decoded2);

        console.log('Method 3 (original):', filename);

        const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

        if (vietnameseChars.test(decoded1)) {
            console.log('✓ Using Method 1');
            return decoded1;
        }
        if (vietnameseChars.test(decoded2)) {
            console.log('✓ Using Method 2');
            return decoded2;
        }
        if (vietnameseChars.test(filename)) {
            console.log('✓ Using Method 3 (original)');
            return filename;
        }

        console.log('✓ No Vietnamese chars, using Method 1');
        return decoded1;

    } catch (error) {
        console.warn('Failed to decode filename:', error);
    }

    console.log('✗ Using original filename (fallback)');
    return filename;
};

const storage = new GridFsStorage({
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database',
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        file.originalname = decodeFilename(file.originalname);
        return {
            filename: `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`,
            bucketName: 'uploads',
            metadata: {
                evidenceId: req.params.evidenceId,
                parentFolderId: req.body.parentFolderId
            }
        };
    }
});

const fileFilter = (req, file, cb) => {
    file.originalname = decodeFilename(file.originalname);

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Loại file ${file.mimetype} không được hỗ trợ`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10
    }
});

const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File quá lớn (tối đa 50MB)'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Quá nhiều file (tối đa 10 file)'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Field name không đúng'
            });
        }
    }

    if (error.message.includes('không được hỗ trợ')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next(error);
};

module.exports = { upload, handleUploadError };