const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const validation = require('../../middleware/validation');
const Evidence = require('../../models/Evidence/Evidence');

// GET /api/public/evidences/:code
// Lấy minh chứng theo code (public access)
router.get('/:code', [
    param('code').notEmpty().trim().toUpperCase()
], validation, async (req, res) => {
    try {
        const { code } = req.params;

        const evidence = await Evidence.findOne({ code: code.toUpperCase() })
            .populate('createdBy', 'fullName email')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate({
                path: 'files',
                select: 'originalName size mimeType uploadedAt _id'
            });

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
            message: 'Lỗi hệ thống'
        });
    }
});

// GET /api/public/evidences/id/:id
// Lấy minh chứng theo ID (public access)
router.get('/id/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const evidence = await Evidence.findById(id)
            .populate('createdBy', 'fullName email')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate({
                path: 'files',
                select: 'originalName size mimeType uploadedAt _id'
            });

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
        console.error('Get evidence by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

module.exports = router;