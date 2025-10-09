const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const uploadFile = async (filePath, options = {}) => {
    try {
        const defaultOptions = {
            resource_type: "auto",
            folder: "evidence-management",
            use_filename: true,
            unique_filename: false,
            overwrite: true,
            ...options
        };

        const result = await cloudinary.uploader.upload(filePath, defaultOptions);
        return {
            success: true,
            data: {
                public_id: result.public_id,
                secure_url: result.secure_url,
                resource_type: result.resource_type,
                format: result.format,
                bytes: result.bytes,
                width: result.width,
                height: result.height
            }
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const deleteFile = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return {
            success: result.result === 'ok',
            result: result.result
        };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const uploadMultipleFiles = async (files, options = {}) => {
    try {
        const uploadPromises = files.map(file => uploadFile(file.path, {
            ...options,
            public_id: file.filename
        }));

        const results = await Promise.all(uploadPromises);
        return {
            success: true,
            data: results
        };
    } catch (error) {
        console.error('Cloudinary multiple upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const getTransformedUrl = (publicId, transformations) => {
    return cloudinary.url(publicId, transformations);
};

const getFileInfo = async (publicId) => {
    try {
        const result = await cloudinary.api.resource(publicId);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Cloudinary get file info error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    cloudinary,
    uploadFile,
    deleteFile,
    uploadMultipleFiles,
    getTransformedUrl,
    getFileInfo
};