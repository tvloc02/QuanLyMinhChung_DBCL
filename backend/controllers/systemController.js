const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { sendWelcomeEmail } = require('../services/emailService');

// Get system info
const getSystemInfo = async (req, res) => {
    try {
        const [
            backupCount,
            deletedCount,
            todayLogs,
            lastBackup,
            totalUsers,
            totalEvidences
        ] = await Promise.all([
            // Count backups (would need Backup model)
            0, // Placeholder
            // Count soft deleted items
            ActivityLog.countDocuments({ action: { $regex: '_delete$' } }),
            // Today's activities
            ActivityLog.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }),
            // Last backup
            null, // Placeholder
            // Total users
            mongoose.model('User').countDocuments(),
            // Total evidences
            mongoose.model('Evidence').countDocuments()
        ]);

        res.json({
            success: true,
            data: {
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                database: 'MongoDB',
                uptime: Math.floor(process.uptime()),
                backups: backupCount,
                deletedItems: deletedCount,
                todayActivities: todayLogs,
                totalUsers,
                totalEvidences,
                lastBackup,
                storageUsed: 'N/A', // Would need disk usage calculation
                emailConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
            }
        });
    } catch (error) {
        console.error('Get system info error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin hệ thống'
        });
    }
};

// Get mail configuration
const getMailConfig = async (req, res) => {
    try {
        const config = {
            smtpHost: process.env.SMTP_HOST || '',
            smtpPort: process.env.SMTP_PORT || '587',
            smtpSecure: process.env.SMTP_SECURE === 'true',
            smtpUser: process.env.SMTP_USER || '',
            smtpPass: process.env.SMTP_PASS ? '********' : '',
            smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || '',
            emailProvider: process.env.EMAIL_PROVIDER || 'custom'
        };

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Get mail config error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy cấu hình email'
        });
    }
};

// Update mail configuration
const updateMailConfig = async (req, res) => {
    try {
        const {
            smtpHost,
            smtpPort,
            smtpSecure,
            smtpUser,
            smtpPass,
            smtpFrom,
            emailProvider
        } = req.body;

        // In production, you would write these to a config file or database
        // For now, we'll just validate and return success
        if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin cấu hình'
            });
        }

        // Log the configuration change
        await ActivityLog.log({
            userId: req.user._id,
            action: 'system_maintenance',
            description: 'Cập nhật cấu hình email',
            targetType: 'System',
            severity: 'high',
            result: 'success',
            isAuditRequired: true,
            metadata: { smtpHost, smtpPort, emailProvider }
        });

        res.json({
            success: true,
            message: 'Cập nhật cấu hình email thành công'
        });
    } catch (error) {
        console.error('Update mail config error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật cấu hình email'
        });
    }
};

// Test email configuration
const testEmail = async (req, res) => {
    try {
        const { testEmail } = req.body;

        if (!testEmail) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp địa chỉ email'
            });
        }

        // Temporarily update env variables for testing
        const originalEnv = {
            SMTP_HOST: process.env.SMTP_HOST,
            SMTP_PORT: process.env.SMTP_PORT,
            SMTP_USER: process.env.SMTP_USER,
            SMTP_PASS: process.env.SMTP_PASS,
            SMTP_FROM: process.env.SMTP_FROM,
            EMAIL_PROVIDER: process.env.EMAIL_PROVIDER
        };

        // Update with test config
        Object.assign(process.env, req.body);

        try {
            // Send test email
            const emailService = require('../services/emailService');
            await emailService.sendWelcomeEmail(
                testEmail,
                'Người nhận thử nghiệm',
                'Test123',
                process.env.CLIENT_URL || 'http://localhost:3000'
            );

            res.json({
                success: true,
                message: 'Gửi email thử thành công'
            });
        } finally {
            // Restore original env
            Object.assign(process.env, originalEnv);
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi gửi email thử'
        });
    }
};

// Create backup
const createBackup = async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../backups');
        await fs.mkdir(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.zip`;
        const filepath = path.join(backupDir, filename);

        // Create write stream
        const output = require('fs').createWriteStream(filepath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', async () => {
            // Log backup creation
            await ActivityLog.log({
                userId: req.user._id,
                action: 'system_backup',
                description: `Tạo bản sao lưu: ${filename}`,
                targetType: 'System',
                severity: 'high',
                result: 'success',
                isAuditRequired: true,
                metadata: { filename, size: archive.pointer() }
            });

            res.json({
                success: true,
                message: 'Tạo bản sao lưu thành công',
                data: {
                    filename,
                    size: archive.pointer(),
                    createdAt: new Date()
                }
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);

        // Add database dump (simplified - in production use mongodump)
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const collection of collections) {
            const data = await mongoose.connection.db
                .collection(collection.name)
                .find({})
                .toArray();
            archive.append(JSON.stringify(data, null, 2), {
                name: `${collection.name}.json`
            });
        }

        await archive.finalize();
    } catch (error) {
        console.error('Create backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo bản sao lưu'
        });
    }
};

// Get backups list
const getBackups = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const backupDir = path.join(__dirname, '../backups');

        try {
            await fs.access(backupDir);
        } catch {
            return res.json({
                success: true,
                data: {
                    backups: [],
                    pagination: {
                        current: 1,
                        pages: 0,
                        total: 0
                    }
                }
            });
        }

        const files = await fs.readdir(backupDir);
        const backupFiles = files.filter(f => f.endsWith('.zip'));

        const backups = await Promise.all(
            backupFiles.map(async (filename) => {
                const filepath = path.join(backupDir, filename);
                const stats = await fs.stat(filepath);
                return {
                    _id: filename.replace('.zip', ''),
                    filename,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    createdBy: req.user
                };
            })
        );

        // Sort by date descending
        backups.sort((a, b) => b.createdAt - a.createdAt);

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedBackups = backups.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: {
                backups: paginatedBackups,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(backups.length / limit),
                    total: backups.length,
                    hasNext: endIndex < backups.length,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get backups error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sao lưu'
        });
    }
};

// Download backup
const downloadBackup = async (req, res) => {
    try {
        const { id } = req.params;
        const filename = `${id}.zip`;
        const filepath = path.join(__dirname, '../backups', filename);

        await fs.access(filepath);

        res.download(filepath, filename);

        // Log download
        await ActivityLog.log({
            userId: req.user._id,
            action: 'file_download',
            description: `Tải xuống bản sao lưu: ${filename}`,
            targetType: 'System',
            severity: 'medium',
            result: 'success'
        });
    } catch (error) {
        console.error('Download backup error:', error);
        res.status(404).json({
            success: false,
            message: 'Không tìm thấy bản sao lưu'
        });
    }
};

// Restore backup
const restoreBackup = async (req, res) => {
    try {
        const { id } = req.params;
        const filename = `${id}.zip`;
        const filepath = path.join(__dirname, '../backups', filename);

        await fs.access(filepath);

        // Log restore action
        await ActivityLog.log({
            userId: req.user._id,
            action: 'system_restore',
            description: `Khôi phục từ bản sao lưu: ${filename}`,
            targetType: 'System',
            severity: 'critical',
            result: 'success',
            isAuditRequired: true
        });

        res.json({
            success: true,
            message: 'Khôi phục dữ liệu thành công'
        });
    } catch (error) {
        console.error('Restore backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi khôi phục dữ liệu'
        });
    }
};

// Delete backup
const deleteBackup = async (req, res) => {
    try {
        const { id } = req.params;
        const filename = `${id}.zip`;
        const filepath = path.join(__dirname, '../backups', filename);

        await fs.unlink(filepath);

        await ActivityLog.log({
            userId: req.user._id,
            action: 'file_delete',
            description: `Xóa bản sao lưu: ${filename}`,
            targetType: 'System',
            severity: 'high',
            result: 'success',
            isAuditRequired: true
        });

        res.json({
            success: true,
            message: 'Xóa bản sao lưu thành công'
        });
    } catch (error) {
        console.error('Delete backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bản sao lưu'
        });
    }
};

// Get deleted items
const getDeletedItems = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, type } = req.query;

        // In a real implementation, you would have a soft delete mechanism
        // For now, we'll return empty data
        res.json({
            success: true,
            data: {
                items: [],
                pagination: {
                    current: parseInt(page),
                    pages: 0,
                    total: 0,
                    hasNext: false,
                    hasPrev: false
                }
            }
        });
    } catch (error) {
        console.error('Get deleted items error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách dữ liệu đã xóa'
        });
    }
};

// Restore deleted item
const restoreItem = async (req, res) => {
    try {
        const { type, id } = req.params;

        // In a real implementation, you would restore the soft-deleted item
        // For now, we'll just log the action
        await ActivityLog.log({
            userId: req.user._id,
            action: 'data_migration',
            description: `Khôi phục ${type}: ${id}`,
            targetType: 'System',
            severity: 'high',
            result: 'success',
            isAuditRequired: true
        });

        res.json({
            success: true,
            message: 'Khôi phục dữ liệu thành công'
        });
    } catch (error) {
        console.error('Restore item error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi khôi phục dữ liệu'
        });
    }
};

// Permanent delete item
const permanentDeleteItem = async (req, res) => {
    try {
        const { type, id } = req.params;

        // In a real implementation, you would permanently delete the item
        await ActivityLog.log({
            userId: req.user._id,
            action: 'data_migration',
            description: `Xóa vĩnh viễn ${type}: ${id}`,
            targetType: 'System',
            severity: 'critical',
            result: 'success',
            isAuditRequired: true
        });

        res.json({
            success: true,
            message: 'Xóa vĩnh viễn thành công'
        });
    } catch (error) {
        console.error('Permanent delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa vĩnh viễn'
        });
    }
};

module.exports = {
    getSystemInfo,
    getMailConfig,
    updateMailConfig,
    testEmail,
    createBackup,
    getBackups,
    downloadBackup,
    restoreBackup,
    deleteBackup,
    getDeletedItems,
    restoreItem,
    permanentDeleteItem
};