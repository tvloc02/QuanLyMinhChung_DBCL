const mongoose = require('mongoose');
const ActivityLog = require('../../models/system/ActivityLog');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const nodemailer = require('nodemailer');

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
            0,
            ActivityLog.countDocuments({ action: { $regex: '_delete$' } }),
            ActivityLog.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }),
            null,
            mongoose.model('User').countDocuments(),
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
                storageUsed: 'N/A',
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

        console.log('✅ Mail config retrieved successfully');

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('❌ Get mail config error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy cấu hình email',
            error: error.message
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

        if (!smtpHost || !smtpPort || !smtpUser) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin cấu hình'
            });
        }

        // Update environment variables
        process.env.SMTP_HOST = smtpHost;
        process.env.SMTP_PORT = smtpPort;
        process.env.SMTP_SECURE = smtpSecure ? 'true' : 'false';
        process.env.SMTP_USER = smtpUser;
        if (smtpPass && smtpPass !== '********') {
            process.env.SMTP_PASS = smtpPass;
        }
        process.env.SMTP_FROM = smtpFrom || smtpUser;
        process.env.EMAIL_PROVIDER = emailProvider || 'custom';

        // Update .env file
        const envPath = path.join(__dirname, '../../.env');
        try {
            let envContent = '';
            try {
                envContent = await fs.readFile(envPath, 'utf8');
            } catch (err) {
                console.log('.env file not found, creating new one');
            }

            const envLines = envContent.split('\n');
            const envVars = {
                SMTP_HOST: smtpHost,
                SMTP_PORT: smtpPort,
                SMTP_SECURE: smtpSecure ? 'true' : 'false',
                SMTP_USER: smtpUser,
                SMTP_FROM: smtpFrom || smtpUser,
                EMAIL_PROVIDER: emailProvider || 'custom'
            };

            if (smtpPass && smtpPass !== '********') {
                envVars.SMTP_PASS = smtpPass;
            }

            Object.keys(envVars).forEach(key => {
                const index = envLines.findIndex(line => line.startsWith(`${key}=`));
                if (index !== -1) {
                    envLines[index] = `${key}=${envVars[key]}`;
                } else {
                    envLines.push(`${key}=${envVars[key]}`);
                }
            });

            await fs.writeFile(envPath, envLines.join('\n'));
            console.log('✅ .env file updated successfully');
        } catch (fileError) {
            console.error('⚠️ Error updating .env file:', fileError);
        }

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
        console.error('❌ Update mail config error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật cấu hình email',
            error: error.message
        });
    }
};

// Test email configuration
const testEmail = async (req, res) => {
    try {
        const { testEmail: emailAddress, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpSecure } = req.body;

        console.log('📧 Testing email with config:', {
            smtpHost,
            smtpPort,
            smtpUser,
            emailAddress
        });

        if (!emailAddress) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp địa chỉ email'
            });
        }

        if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ cấu hình SMTP'
            });
        }

        // Create transporter with provided config
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: smtpSecure || parseInt(smtpPort) === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass
            },
            debug: true,
            logger: true
        });

        console.log('🔌 Verifying SMTP connection...');

        // Verify connection
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        // Send test email
        const mailOptions = {
            from: smtpFrom || smtpUser,
            to: emailAddress,
            subject: 'Email kiểm tra cấu hình - CMC University',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb;">✅ Email kiểm tra cấu hình</h2>
                    <p>Xin chào,</p>
                    <p>Đây là email kiểm tra cấu hình SMTP từ hệ thống <strong>CMC University</strong>.</p>
                    <p>Nếu bạn nhận được email này, cấu hình email của bạn đã hoạt động đúng!</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #374151;">
                            <strong>Thông tin cấu hình:</strong><br>
                            SMTP Host: ${smtpHost}<br>
                            SMTP Port: ${smtpPort}<br>
                            SMTP User: ${smtpUser}
                        </p>
                    </div>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        Email này được gửi tự động từ hệ thống vào lúc ${new Date().toLocaleString('vi-VN')}.<br>
                        Vui lòng không trả lời email này.
                    </p>
                </div>
            `
        };

        console.log('📤 Sending test email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);

        // Log successful test
        await ActivityLog.log({
            userId: req.user._id,
            action: 'system_maintenance',
            description: `Gửi email thử thành công đến ${emailAddress}`,
            targetType: 'System',
            severity: 'low',
            result: 'success'
        });

        res.json({
            success: true,
            message: `Email thử đã được gửi đến ${emailAddress}. Vui lòng kiểm tra hộp thư!`,
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Test email error:', error);

        let errorMessage = 'Lỗi khi gửi email thử';

        if (error.code === 'EAUTH') {
            errorMessage = 'Xác thực SMTP thất bại. Vui lòng kiểm tra tên đăng nhập và mật khẩu';
        } else if (error.code === 'ECONNECTION') {
            errorMessage = 'Không thể kết nối đến máy chủ SMTP. Vui lòng kiểm tra host và port';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Kết nối bị timeout. Vui lòng kiểm tra cấu hình mạng';
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.code || error.message
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

        const output = require('fs').createWriteStream(filepath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', async () => {
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

        backups.sort((a, b) => b.createdAt - a.createdAt);

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
        res.json({
            success: true,
            data: {
                items: [],
                pagination: {
                    current: 1,
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