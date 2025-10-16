const mongoose = require('mongoose');
const Evidence = require('../../models/evidence/Evidence');

const getEvidenceByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const evidence = await Evidence.findOne({ code: code.toUpperCase() })
            .populate('createdBy', 'fullName email')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('attachments');

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
};

const getEvidenceById = async (req, res) => {
    try {
        const { id } = req.params;

        const evidence = await Evidence.findById(id)
            .populate('createdBy', 'fullName email')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('attachments');

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
};

module.exports = {
    getEvidenceByCode,
    getEvidenceById
};