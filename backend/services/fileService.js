const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

const extractTextContent = async (filePath, mimeType) => {
    try {
        switch (mimeType) {
            case 'application/pdf':
                return await extractFromPDF(filePath);

            case 'application/msword':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return await extractFromWord(filePath);

            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                return await extractFromExcel(filePath);

            case 'text/plain':
                return await extractFromText(filePath);

            default:
                return null;
        }
    } catch (error) {
        console.error('Extract text content error:', error);
        return null;
    }
};

const extractFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Extract from PDF error:', error);
        return null;
    }
};

// Extract text from Word documents
const extractFromWord = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error('Extract from Word error:', error);
        return null;
    }
};

// Extract text from Excel files
const extractFromExcel = async (filePath) => {
    try {
        const workbook = XLSX.readFile(filePath);
        let allText = '';

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { defval: '', header: 1 });

            data.forEach(row => {
                if (Array.isArray(row)) {
                    allText += row.join(' ') + '\n';
                }
            });
        });

        return allText.trim();
    } catch (error) {
        console.error('Extract from Excel error:', error);
        return null;
    }
};

// Extract text from plain text files
const extractFromText = async (filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error('Extract from text error:', error);
        return null;
    }
};

// Calculate file hash (MD5)
const calculateFileHash = (filePath) => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash('md5');
        hash.update(fileBuffer);
        return hash.digest('hex');
    } catch (error) {
        console.error('Calculate file hash error:', error);
        return null;
    }
};

// Get file metadata
const getFileMetadata = async (filePath, mimeType) => {
    try {
        const stats = fs.statSync(filePath);
        const metadata = {
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
        };

        // Extract additional metadata based on file type
        if (mimeType === 'application/pdf') {
            const pdfMetadata = await getPDFMetadata(filePath);
            Object.assign(metadata, pdfMetadata);
        } else if (mimeType.startsWith('image/')) {
            const imageMetadata = await getImageMetadata(filePath);
            Object.assign(metadata, imageMetadata);
        }

        return metadata;
    } catch (error) {
        console.error('Get file metadata error:', error);
        return null;
    }
};

// Get PDF metadata
const getPDFMetadata = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);

        return {
            pageCount: data.numpages,
            wordCount: data.text ? data.text.split(/\s+/).length : 0,
            title: data.info ? data.info.Title : null,
            author: data.info ? data.info.Author : null,
            subject: data.info ? data.info.Subject : null,
            creator: data.info ? data.info.Creator : null,
            creationDate: data.info ? data.info.CreationDate : null
        };
    } catch (error) {
        console.error('Get PDF metadata error:', error);
        return {};
    }
};

// Get image metadata (basic)
const getImageMetadata = async (filePath) => {
    try {
        // This would require image processing library like sharp
        // For now, return basic info
        return {
            dimensions: {
                width: null,
                height: null
            }
        };
    } catch (error) {
        console.error('Get image metadata error:', error);
        return {};
    }
};

// Create file thumbnail (for images)
const createThumbnail = async (filePath, outputPath, size = 150) => {
    try {
        // This would require image processing library like sharp
        // For now, just copy the original file
        fs.copyFileSync(filePath, outputPath);
        return outputPath;
    } catch (error) {
        console.error('Create thumbnail error:', error);
        return null;
    }
};

// Validate file type and size
const validateFile = (file, allowedTypes, maxSize) => {
    const errors = [];

    // Check file type
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
        errors.push(`Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
        errors.push(`File quá lớn. Tối đa: ${formatBytes(maxSize)}`);
    }

    // Check if file exists and is readable
    if (file.path && !fs.existsSync(file.path)) {
        errors.push('File không tồn tại');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Clean old temporary files
const cleanTempFiles = (tempDir, maxAge = 24 * 60 * 60 * 1000) => {
    try {
        if (!fs.existsSync(tempDir)) return;

        const files = fs.readdirSync(tempDir);
        const now = Date.now();

        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`Cleaned temp file: ${file}`);
            }
        });
    } catch (error) {
        console.error('Clean temp files error:', error);
    }
};

// Ensure directory exists
const ensureDirectoryExists = (dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return true;
    } catch (error) {
        console.error('Ensure directory exists error:', error);
        return false;
    }
};

// Move file safely (with backup)
const moveFileSafely = (sourcePath, targetPath) => {
    try {
        // Ensure target directory exists
        const targetDir = path.dirname(targetPath);
        ensureDirectoryExists(targetDir);

        // If target file exists, create backup
        if (fs.existsSync(targetPath)) {
            const backupPath = targetPath + '.backup.' + Date.now();
            fs.renameSync(targetPath, backupPath);
        }

        // Move file
        fs.renameSync(sourcePath, targetPath);

        return {
            success: true,
            targetPath
        };
    } catch (error) {
        console.error('Move file safely error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Copy file with progress (for large files)
const copyFileWithProgress = (sourcePath, targetPath, progressCallback) => {
    return new Promise((resolve, reject) => {
        const sourceStream = fs.createReadStream(sourcePath);
        const targetStream = fs.createWriteStream(targetPath);

        let copiedBytes = 0;
        const totalBytes = fs.statSync(sourcePath).size;

        sourceStream.on('data', (chunk) => {
            copiedBytes += chunk.length;
            if (progressCallback) {
                progressCallback({
                    copiedBytes,
                    totalBytes,
                    percentage: (copiedBytes / totalBytes) * 100
                });
            }
        });

        sourceStream.on('end', () => {
            resolve(targetPath);
        });

        sourceStream.on('error', reject);
        targetStream.on('error', reject);

        sourceStream.pipe(targetStream);
    });
};

// Format bytes to human readable format
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Scan file for viruses (placeholder - would need actual antivirus integration)
const scanForViruses = async (filePath) => {
    try {
        // This is a placeholder implementation
        // In production, you would integrate with an antivirus service like ClamAV

        // Basic checks for suspicious file patterns
        const suspiciousExtensions = ['.exe', '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js'];
        const fileExt = path.extname(filePath).toLowerCase();

        if (suspiciousExtensions.includes(fileExt)) {
            return {
                clean: false,
                threat: 'Suspicious file extension',
                details: `File extension ${fileExt} is not allowed`
            };
        }

        const stats = fs.statSync(filePath);
        if (stats.size > 100 * 1024 * 1024) { // 100MB
            return {
                clean: false,
                threat: 'File too large',
                details: 'File size exceeds security limits'
            };
        }

        return {
            clean: true,
            threat: null,
            details: 'File appears to be clean'
        };
    } catch (error) {
        console.error('Virus scan error:', error);
        return {
            clean: false,
            threat: 'Scan error',
            details: error.message
        };
    }
};

const compressFile = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        const zlib = require('zlib');
        const readStream = fs.createReadStream(inputPath);
        const writeStream = fs.createWriteStream(outputPath);
        const gzip = zlib.createGzip();

        readStream
            .pipe(gzip)
            .pipe(writeStream)
            .on('finish', () => resolve(outputPath))
            .on('error', reject);
    });
};

// Decompress gzip file
const decompressFile = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        const zlib = require('zlib');
        const readStream = fs.createReadStream(inputPath);
        const writeStream = fs.createWriteStream(outputPath);
        const gunzip = zlib.createGunzip();

        readStream
            .pipe(gunzip)
            .pipe(writeStream)
            .on('finish', () => resolve(outputPath))
            .on('error', reject);
    });
};

module.exports = {
    extractTextContent,
    calculateFileHash,
    getFileMetadata,
    createThumbnail,
    validateFile,
    cleanTempFiles,
    ensureDirectoryExists,
    moveFileSafely,
    copyFileWithProgress,
    formatBytes,
    scanForViruses,
    compressFile,
    decompressFile
};