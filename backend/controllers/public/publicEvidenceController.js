const mongoose = require('mongoose');
const Evidence = require('../../models/Evidence/Evidence');
const AcademicYear = require('../../models/system/AcademicYear');
const Program = require('../../models/Evidence/Program');
const Organization = require('../../models/Evidence/Organization');
const Standard = require('../../models/Evidence/Standard');
const Criteria = require('../../models/Evidence/Criteria');

// Lấy minh chứng theo code (công khai)
const getEvidenceByCode = async (req, res) => {
    try {
        const { code } = req.params;
        
        console.log('=== GET EVIDENCE BY CODE ===');
        console.log('Code:', code);
        console.log('Code uppercase:', code.toUpperCase());

        // Tạm thời bỏ filter status để test
        const evidence = await Evidence.findOne({ code: code.toUpperCase() })
            .populate('createdBy', 'fullName email')
            .populate('academicYearId', 'name code')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate({
                path: 'standardId',
                select: 'name code'
            })
            .populate({
                path: 'criteriaId',
                select: 'name code'
            })
            .populate({
                path: 'files',
                select: 'originalName size mimeType uploadedAt'
            });

        console.log('Evidence found:', evidence ? 'YES' : 'NO');
        if (evidence) {
            console.log('Evidence status:', evidence.status);
            console.log('Files count:', evidence.files?.length || 0);
            console.log('AcademicYear:', evidence.academicYearId);
            console.log('Program:', evidence.programId);
            console.log('Organization:', evidence.organizationId);
            console.log('Standard:', evidence.standardId);
            console.log('Criteria:', evidence.criteriaId);
        }
        
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
            message: 'Lỗi hệ thống: ' + error.message
        });
    }
};

// Lấy minh chứng theo ID (công khai)
const getEvidenceById = async (req, res) => {
    try {
        const { id } = req.params;

        const evidence = await Evidence.findOne({ _id: id, status: 'approved' })
            .populate('createdBy', 'fullName email')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate({
                path: 'files',
                select: 'originalName size mimeType uploadedAt'
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
};

// ✅ Lấy toàn bộ cấu trúc phân cấp
const getPublicHierarchy = async (req, res) => {
    try {
        // Lấy tất cả năm học công khai
        const AcademicYearModel = mongoose.model('AcademicYear');
        const academicYears = await AcademicYearModel.find({})
            .select('id name code isActive')
            .sort({ code: -1 })
            .lean();

        // Lấy tất cả Programs
        const ProgramModel = mongoose.model('Program');
        const programs = await ProgramModel.find({})
            .select('id name code')
            .sort({ code: 1 })
            .lean();

        // Lấy tất cả Organizations
        const OrganizationModel = mongoose.model('Organization');
        const organizations = await OrganizationModel.find({})
            .select('id name code')
            .sort({ code: 1 })
            .lean();

        // Lấy tất cả Standards
        const StandardModel = mongoose.model('Standard');
        const standards = await StandardModel.find({})
            .select('id name code academicYearId programId')
            .sort({ code: 1 })
            .lean();

        // Lấy tất cả Criterias
        const CriteriaModel = mongoose.model('Criteria');
        const criterias = await CriteriaModel.find({})
            .select('id name code standardId')
            .sort({ code: 1 })
            .lean();

        // Lấy tất cả Evidences (chỉ những cái công khai - status approved)
        const evidences = await Evidence.find({ status: 'approved' })
            .select('id code name description criteriaId status createdAt')
            .populate({
                path: 'files',
                select: 'id originalName mimeType size uploadedAt'
            })
            .sort({ code: 1 })
            .lean();

        res.json({
            success: true,
            data: {
                academicYears,
                programs,
                organizations,
                standards,
                criterias,
                evidences
            }
        });

    } catch (error) {
        console.error('Get public hierarchy error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy dữ liệu phân cấp: ' + error.message
        });
    }
};

// ✅ Lấy minh chứng theo lọc phân cấp
const getEvidencesByHierarchy = async (req, res) => {
    try {
        const {
            academicYearId,
            programId,
            organizationId,
            standardId,
            criteriaId
        } = req.query;

        let query = { status: 'approved' };

        if (academicYearId) query.academicYearId = academicYearId;
        if (programId) query.programId = programId;
        if (organizationId) query.organizationId = organizationId;
        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;

        const evidences = await Evidence.find(query)
            .select('id code name description criteriaId status createdAt')
            .populate({
                path: 'files',
                select: 'id originalName mimeType size uploadedAt'
            })
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .sort({ code: 1 })
            .lean();

        res.json({
            success: true,
            data: { evidences }
        });

    } catch (error) {
        console.error('Get evidences by hierarchy error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống: ' + error.message
        });
    }
};

module.exports = {
    getEvidenceByCode,
    getEvidenceById,
    getPublicHierarchy,
    getEvidencesByHierarchy,
};