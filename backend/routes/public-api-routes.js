const express = require('express');
const router = express.Router();
const Report = require('../../models/report/Report');
const Evidence = require('../../models/Evidence/Evidence');
const mongoose = require('mongoose');

/**
 * PUBLIC API ROUTES - Không yêu cầu xác thực
 * Dùng cho trang công khai để xem báo cáo và minh chứng
 */

// ============================================
// REPORT ROUTES
// ============================================

/**
 * GET /api/public/reports/:id
 * Lấy thông tin báo cáo công khai
 * Chỉ trả về báo cáo đã được xuất bản
 */
router.get('/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra xem ID có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID báo cáo không hợp lệ'
            });
        }

        // Tìm báo cáo đã xuất bản
        const report = await Report.findOne({
            _id: id,
            status: 'published'
        })
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName email')
            .select('-__v');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại hoặc chưa được xuất bản'
            });
        }

        // Tăng view count
        report.metadata.viewCount = (report.metadata.viewCount || 0) + 1;
        await report.save();

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Get public report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin báo cáo'
        });
    }
});

/**
 * GET /api/public/reports/:id/evidences
 * Lấy danh sách minh chứng liên kết với báo cáo
 */
router.get('/reports/:id/evidences', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID báo cáo không hợp lệ'
            });
        }

        const report = await Report.findOne({
            _id: id,
            status: 'published'
        })
            .select('linkedEvidences')
            .populate({
                path: 'linkedEvidences.evidenceId',
                select: 'code name description files'
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        res.json({
            success: true,
            data: report.linkedEvidences || []
        });

    } catch (error) {
        console.error('Get report evidences error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

/**
 * GET /api/public/reports/:id/versions
 * Lấy danh sách phiên bản của báo cáo
 */
router.get('/reports/:id/versions', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID báo cáo không hợp lệ'
            });
        }

        const report = await Report.findOne({
            _id: id,
            status: 'published'
        })
            .select('versions')
            .populate({
                path: 'versions.changedBy',
                select: 'fullName email'
            });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        res.json({
            success: true,
            data: report.versions || []
        });

    } catch (error) {
        console.error('Get report versions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

/**
 * GET /api/public/reports/:id/download
 * Tải xuống báo cáo dưới dạng HTML
 * Nội dung bao gồm mã minh chứng được chuyển thành link
 */
router.get('/reports/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'html' } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID báo cáo không hợp lệ'
            });
        }

        const report = await Report.findOne({
            _id: id,
            status: 'published'
        })
            .populate('programId', 'name')
            .populate('organizationId', 'name')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Báo cáo không tồn tại'
            });
        }

        if (format !== 'html') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ hỗ trợ định dạng HTML'
            });
        }

        // Xử lý nội dung - thay thế mã minh chứng thành link
        let processedContent = report.content;

        // Regex để tìm mã minh chứng và thay thế thành link
        const evidenceCodePattern = /\b([A-Y]\d+\.\d{2}\.\d{2}\.\d{2})\b/g;
        processedContent = processedContent.replace(evidenceCodePattern, (match) => {
            const protocol = req.protocol;
            const host = req.get('host');
            const url = `${protocol}://${host}/public/evidences/${match}`;

            return `<a href="${url}" class="evidence-link" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.75rem; background-color: #dbeafe; color: #1e40af; border-radius: 0.375rem; font-family: monospace; font-weight: 600; font-size: 0.875rem; text-decoration: none; border: 1px solid #7dd3fc;">
                ${match}
                <svg style="width: 0.75rem; height: 0.75rem; fill: none; stroke: currentColor;" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
            </a>`;
        });

        // Lấy danh sách minh chứng liên kết
        let evidenceLinksHtml = '';
        if (report.linkedEvidences && report.linkedEvidences.length > 0) {
            evidenceLinksHtml = '<h2 style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;">Minh chứng liên quan</h2><ul>';

            const protocol = req.protocol;
            const host = req.get('host');

            report.linkedEvidences.forEach(linkItem => {
                if (linkItem.evidenceId) {
                    const evidence = linkItem.evidenceId;
                    const url = `${protocol}://${host}/public/evidences/${evidence.code}`;
                    evidenceLinksHtml += `<li><strong>${evidence.code}</strong>: <a href="${url}" target="_blank" rel="noopener noreferrer">${evidence.name}</a>`;

                    if (linkItem.contextText) {
                        evidenceLinksHtml += ` (Ngữ cảnh: ${linkItem.contextText})`;
                    }
                    evidenceLinksHtml += '</li>';
                }
            });

            evidenceLinksHtml += '</ul>';
        }

        const finalContent = processedContent + evidenceLinksHtml;

        // Tạo HTML document
        const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 960px;
            margin: 0 auto;
            padding: 40px;
            background-color: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .header {
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        h1 {
            font-size: 28px;
            color: #1e40af;
            margin-bottom: 10px;
        }
        
        .meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        
        .meta-item {
            font-size: 13px;
        }
        
        .meta-label {
            font-weight: bold;
            color: #666;
        }
        
        .meta-value {
            color: #333;
            margin-top: 5px;
        }
        
        .content {
            margin: 30px 0;
        }
        
        .content h2 {
            font-size: 18px;
            color: #1e40af;
            margin: 20px 0 10px 0;
            border-left: 4px solid #1e40af;
            padding-left: 10px;
        }
        
        .content h3 {
            font-size: 16px;
            color: #333;
            margin: 15px 0 10px 0;
        }
        
        .content p {
            margin: 10px 0;
        }
        
        .content ul, .content ol {
            margin-left: 20px;
            margin: 10px 0;
        }
        
        .content li {
            margin: 5px 0;
        }
        
        a {
            color: #1e40af;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .evidence-link {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            background-color: #dbeafe;
            color: #1e40af;
            border-radius: 0.375rem;
            font-family: 'Courier New', monospace;
            font-weight: 600;
            font-size: 0.875rem;
            border: 1px solid #7dd3fc;
            cursor: pointer;
        }
        
        .evidence-link svg {
            width: 0.75rem;
            height: 0.75rem;
        }
        
        .evidence-link:hover {
            background-color: #93c5fd;
            border-color: #38bdf8;
        }
        
        .footer {
            border-top: 1px solid #e0e0e0;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 12px;
            color: #999;
        }
        
        .print-footer {
            margin-top: 40px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            font-size: 11px;
            color: #666;
        }
        
        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
                padding: 0;
            }
            a {
                color: #1e40af;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${report.title}</h1>
            <p style="color: #666; margin-top: 10px;">${report.summary || ''}</p>
            
            <div class="meta">
                <div class="meta-item">
                    <div class="meta-label">Mã báo cáo</div>
                    <div class="meta-value">${report.code}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Loại</div>
                    <div class="meta-value">${report.type}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Người tạo</div>
                    <div class="meta-value">${report.createdBy?.fullName || 'N/A'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Ngày tạo</div>
                    <div class="meta-value">${new Date(report.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
                ${report.programId ? `
                <div class="meta-item">
                    <div class="meta-label">Chương trình</div>
                    <div class="meta-value">${report.programId.name}</div>
                </div>
                ` : ''}
                ${report.organizationId ? `
                <div class="meta-item">
                    <div class="meta-label">Tổ chức</div>
                    <div class="meta-value">${report.organizationId.name}</div>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="content">
            ${finalContent}
        </div>
        
        <div class="print-footer">
            <p>Tài liệu này được tạo tự động từ hệ thống quản lý báo cáo.</p>
            <p>Thời gian in: ${new Date().toLocaleString('vi-VN')}</p>
        </div>
    </div>
    
    <script>
        // Tự động mở các link minh chứng trong tab mới
        document.querySelectorAll('.evidence-link').forEach(link => {
            link.addEventListener('click', (e) => {
                if (!e.ctrlKey && !e.metaKey) {
                    // Nếu không bấm Ctrl/Cmd, mở trong tab mới
                    window.open(link.href, '_blank');
                    e.preventDefault();
                }
            });
        });
    </script>
</body>
</html>
        `;

        // Tăng download count
        report.metadata.downloadCount = (report.metadata.downloadCount || 0) + 1;
        await report.save();

        // Gửi file
        const filename = `${report.code}-${report.title}.html`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);

    } catch (error) {
        console.error('Download report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải báo cáo'
        });
    }
});

// ============================================
// EVIDENCE ROUTES
// ============================================

/**
 * GET /api/public/evidences/code/:code
 * Lấy thông tin minh chứng theo mã
 */
router.get('/evidences/code/:code', async (req, res) => {
    try {
        const { code } = req.params;

        // Tìm minh chứng theo mã
        const evidence = await Evidence.findOne({ code: code.toUpperCase() })
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate({
                path: 'files',
                select: 'originalName size mimeType uploadedAt approvalStatus uploadedBy',
                populate: {
                    path: 'uploadedBy',
                    select: 'fullName email'
                }
            })
            .select('-__v');

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Minh chứng không tồn tại'
            });
        }

        res.json({
            success: true,
            data: evidence
        });

    } catch (error) {
        console.error('Get evidence by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin minh chứng'
        });
    }
});

/**
 * GET /api/public/evidences/:id
 * Lấy thông tin minh chứng theo ID
 */
router.get('/evidences/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID minh chứng không hợp lệ'
            });
        }

        const evidence = await Evidence.findById(id)
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate({
                path: 'files',
                select: 'originalName size mimeType uploadedAt approvalStatus uploadedBy',
                populate: {
                    path: 'uploadedBy',
                    select: 'fullName email'
                }
            })
            .select('-__v');

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Minh chứng không tồn tại'
            });
        }

        res.json({
            success: true,
            data: evidence
        });

    } catch (error) {
        console.error('Get evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin minh chứng'
        });
    }
});

/**
 * GET /api/public/evidences/:id/files
 * Lấy danh sách file của minh chứng
 */
router.get('/evidences/:id/files', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID minh chứng không hợp lệ'
            });
        }

        const evidence = await Evidence.findById(id)
            .select('files')
            .populate({
                path: 'files',
                select: 'originalName size mimeType uploadedAt approvalStatus uploadedBy',
                populate: {
                    path: 'uploadedBy',
                    select: 'fullName email'
                }
            });

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Minh chứng không tồn tại'
            });
        }

        res.json({
            success: true,
            data: evidence.files || []
        });

    } catch (error) {
        console.error('Get evidence files error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

/**
 * GET /api/public/evidences/files/:fileId/download
 * Tải xuống file của minh chứng
 * Chỉ cho phép tải file đã được duyệt (approved)
 */
router.get('/evidences/files/:fileId/download', async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: 'ID file không hợp lệ'
            });
        }

        const File = require('../../models/Evidence/File');
        const fs = require('fs');
        const path = require('path');

        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File không tồn tại'
            });
        }

        // Chỉ cho phép tải file đã được duyệt
        if (file.approvalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'File chưa được duyệt'
            });
        }

        const filePath = path.resolve(file.path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File không tồn tại trên server'
            });
        }

        // Tải file
        res.download(filePath, file.originalName);

    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải file'
        });
    }
});

module.exports = router;