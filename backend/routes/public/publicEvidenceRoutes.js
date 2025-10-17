const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const validation = require('../../middleware/validation');
const Report = require('../../models/report/Report');

// GET /api/public/reports/:code
// Lấy báo cáo theo code (công khai)
router.get('/:code', [
    param('code').notEmpty().trim().toUpperCase()
], validation, async (req, res) => {
    try {
        const { code } = req.params;

        const report = await Report.findOne({ code: code.toUpperCase(), status: 'published' })
            .populate('createdBy', 'fullName email')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate({
                path: 'linkedEvidences.evidenceId',
                select: 'code name'
            });

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
        console.error('Get report by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

// GET /api/public/reports/id/:id
// Lấy báo cáo theo ID (công khai)
router.get('/id/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findById(id)
            .populate('createdBy', 'fullName email')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate({
                path: 'linkedEvidences.evidenceId',
                select: 'code name'
            });

        if (!report || report.status !== 'published') {
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
        console.error('Get report by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

module.exports = router;