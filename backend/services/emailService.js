const nodemailer = require('nodemailer');

const createTransporter = () => {
    const config = {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };

    if (process.env.EMAIL_PROVIDER === 'gmail') {
        config.service = 'gmail';
        config.host = 'smtp.gmail.com';
        config.port = 587;
        config.secure = false;
    }

    if (process.env.EMAIL_PROVIDER === 'outlook') {
        config.service = 'hotmail';
        config.host = 'smtp.live.com';
        config.port = 587;
        config.secure = false;
    }

    return nodemailer.createTransporter(config);
};

const createEmailTemplate = (title, content, footerText = '') => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #007bff;
                margin: 0;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #007bff;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #eee;
                padding-top: 20px;
                margin-top: 30px;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Hệ thống Quản lý Minh chứng</h1>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p>© 2024 Hệ thống Quản lý Minh chứng</p>
                <p>${footerText}</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const sendPasswordResetEmail = async (email, fullName, resetUrl) => {
    try {
        const transporter = createTransporter();

        const content = `
            <h2>Yêu cầu đặt lại mật khẩu</h2>
            <p>Xin chào <strong>${fullName}</strong>,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trong hệ thống Quản lý Minh chứng.</p>
            <p>Để đặt lại mật khẩu, vui lòng nhấp vào liên kết bên dưới:</p>
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </div>
            <div class="warning">
                <p><strong>Lưu ý:</strong></p>
                <ul>
                    <li>Liên kết này chỉ có hiệu lực trong vòng 10 phút</li>
                    <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                    <li>Để đảm bảo an toàn, không chia sẻ liên kết này với bất kỳ ai</li>
                </ul>
            </div>
            <p>Trân trọng,<br>Đội ngũ hỗ trợ hệ thống</p>
        `;

        const mailOptions = {
            from: `"Hệ thống Quản lý Minh chứng" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: email,
            subject: '[Hệ thống Quản lý Minh chứng] Đặt lại mật khẩu',
            html: createEmailTemplate('Đặt lại mật khẩu', content)
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', result.messageId);

        return {
            success: true,
            messageId: result.messageId
        };
    } catch (error) {
        console.error('Send password reset email error:', error);
        throw error;
    }
};

const sendWelcomeEmail = async (email, fullName, defaultPassword, loginUrl) => {
    try {
        const transporter = createTransporter();

        const content = `
            <h2>Chào mừng bạn đến với Hệ thống Quản lý Minh chứng</h2>
            <p>Xin chào <strong>${fullName}</strong>,</p>
            <p>Tài khoản của bạn đã được tạo thành công trong hệ thống Quản lý Minh chứng.</p>
            <p><strong>Thông tin đăng nhập:</strong></p>
            <ul>
                <li><strong>Tên đăng nhập:</strong> ${email}</li>
                <li><strong>Mật khẩu tạm:</strong> ${defaultPassword}</li>
            </ul>
            <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Đăng nhập hệ thống</a>
            </div>
            <div class="warning">
                <p><strong>Quan trọng:</strong></p>
                <ul>
                    <li>Đây là mật khẩu tạm thời, vui lòng đổi mật khẩu sau khi đăng nhập lần đầu</li>
                    <li>Không chia sẻ thông tin đăng nhập với bất kỳ ai</li>
                    <li>Nếu có thắc mắc, vui lòng liên hệ quản trị viên</li>
                </ul>
            </div>
            <p>Trân trọng,<br>Đội ngũ hỗ trợ hệ thống</p>
        `;

        const mailOptions = {
            from: `"Hệ thống Quản lý Minh chứng" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: email,
            subject: '[Hệ thống Quản lý Minh chứng] Tài khoản mới được tạo',
            html: createEmailTemplate('Chào mừng', content)
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Welcome email sent:', result.messageId);

        return {
            success: true,
            messageId: result.messageId
        };
    } catch (error) {
        console.error('Send welcome email error:', error);
        throw error;
    }
};

const sendPasswordChangeNotification = async (email, fullName) => {
    try {
        const transporter = createTransporter();

        const content = `
            <h2>Thông báo thay đổi mật khẩu</h2>
            <p>Xin chào <strong>${fullName}</strong>,</p>
            <p>Mật khẩu tài khoản của bạn đã được thay đổi thành công vào lúc ${new Date().toLocaleString('vi-VN')}.</p>
            <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với quản trị viên hệ thống.</p>
            <p>Trân trọng,<br>Đội ngũ hỗ trợ hệ thống</p>
        `;

        const mailOptions = {
            from: `"Hệ thống Quản lý Minh chứng" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: email,
            subject: '[Hệ thống Quản lý Minh chứng] Thông báo thay đổi mật khẩu',
            html: createEmailTemplate('Thông báo bảo mật', content)
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Password change notification sent:', result.messageId);

        return {
            success: true,
            messageId: result.messageId
        };
    } catch (error) {
        console.error('Send password change notification error:', error);
        throw error;
    }
};

const sendImportNotification = async (email, fullName, importResult) => {
    try {
        const transporter = createTransporter();

        const content = `
            <h2>Kết quả Import Minh chứng</h2>
            <p>Xin chào <strong>${fullName}</strong>,</p>
            <p>Quá trình import minh chứng đã hoàn tất với kết quả như sau:</p>
            <ul>
                <li><strong>Tổng số bản ghi:</strong> ${importResult.total}</li>
                <li><strong>Import thành công:</strong> ${importResult.success}</li>
                <li><strong>Thất bại:</strong> ${importResult.failed}</li>
                <li><strong>Bỏ qua:</strong> ${importResult.skipped}</li>
            </ul>
            ${importResult.errors && importResult.errors.length > 0 ? `
                <h3>Danh sách lỗi:</h3>
                <ul>
                    ${importResult.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            ` : ''}
            <p>Trân trọng,<br>Đội ngũ hỗ trợ hệ thống</p>
        `;

        const mailOptions = {
            from: `"Hệ thống Quản lý Minh chứng" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: email,
            subject: '[Hệ thống Quản lý Minh chứng] Kết quả Import',
            html: createEmailTemplate('Kết quả Import', content)
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Import notification sent:', result.messageId);

        return {
            success: true,
            messageId: result.messageId
        };
    } catch (error) {
        console.error('Send import notification error:', error);
        throw error;
    }
};

const sendWeeklyReport = async (adminEmails, reportData) => {
    try {
        const transporter = createTransporter();

        const content = `
            <h2>Báo cáo tuần từ ${reportData.fromDate} đến ${reportData.toDate}</h2>
            <h3>Tổng quan hệ thống:</h3>
            <ul>
                <li><strong>Tổng minh chứng:</strong> ${reportData.totalEvidences}</li>
                <li><strong>Minh chứng mới:</strong> ${reportData.newEvidences}</li>
                <li><strong>Tổng file:</strong> ${reportData.totalFiles}</li>
                <li><strong>File mới:</strong> ${reportData.newFiles}</li>
                <li><strong>Người dùng hoạt động:</strong> ${reportData.activeUsers}</li>
            </ul>
            
            <h3>Top 5 người dùng tích cực nhất:</h3>
            <ul>
                ${reportData.topUsers.map(user =>
            `<li><strong>${user.name}:</strong> ${user.activityCount} hoạt động</li>`
        ).join('')}
            </ul>
            
            <p>Chi tiết báo cáo có thể xem trong hệ thống.</p>
            <p>Trân trọng,<br>Hệ thống tự động</p>
        `;

        const mailOptions = {
            from: `"Hệ thống Quản lý Minh chứng" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: adminEmails.join(', '),
            subject: '[Hệ thống Quản lý Minh chứng] Báo cáo tuần',
            html: createEmailTemplate('Báo cáo tuần', content)
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Weekly report sent:', result.messageId);

        return {
            success: true,
            messageId: result.messageId
        };
    } catch (error) {
        console.error('Send weekly report error:', error);
        throw error;
    }
};

const testEmailConfiguration = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('Email configuration is valid');
        return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
        console.error('Email configuration error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendPasswordChangeNotification,
    sendImportNotification,
    sendWeeklyReport,
    testEmailConfiguration
};