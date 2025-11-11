const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function để decode tên file tiếng Việt
const decodeFilename = (filename) => {
    console.log('=== DECODE FILENAME DEBUG ===');
    console.log('Original filename:', filename);
    
    try {
        // Thử nhiều cách decode khác nhau
        
        // Cách 1: latin1 -> utf8 (phổ biến nhất)
        const decoded1 = Buffer.from(filename, 'latin1').toString('utf8');
        console.log('Method 1 (latin1->utf8):', decoded1);
        
        // Cách 2: binary -> utf8
        const decoded2 = Buffer.from(filename, 'binary').toString('utf8');
        console.log('Method 2 (binary->utf8):', decoded2);
        
        // Cách 3: Giữ nguyên (đã là UTF-8)
        console.log('Method 3 (original):', filename);
        
        // Kiểm tra cách nào có ký tự tiếng Việt hợp lệ
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
        
        // Nếu không có ký tự tiếng Việt, ưu tiên latin1->utf8
        console.log('✓ No Vietnamese chars, using Method 1');
        return decoded1;
        
    } catch (error) {
        console.warn('Failed to decode filename:', error);
    }
    
    console.log('✗ Using original filename (fallback)');
    return filename;
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destPath = path.join(uploadDir, 'temp');
        if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
        }
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        // Decode tên file tiếng Việt
        file.originalname = decodeFilename(file.originalname);
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Decode tên file tiếng Việt
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
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 10 // Maximum 10 files
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