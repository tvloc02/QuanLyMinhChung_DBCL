const mongoose = require('mongoose');
const Report = require('../../models/report/Report');

const getAssessmentReports = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            type,
            standardId,
            criteriaId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const academicYearId = req.academicYearId;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Chỉ lấy báo cáo đã xuất bản
        let query = {
            academicYearId,
            status: 'published'
        };

        // Filter theo người dùng
        if (req.user.role !== 'admin') {
            // Người tạo hoặc được phân quyền
            query.$or = [
                { createdBy: req.user.id },
                { 'accessControl.assignedExperts.expertId': req.user.id },
                { 'accessControl.advisors.advisorId': req.user.id }
            ];
        }

        if (search) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (type) query.type = type;
        if (standardId) query.standardId = standardId;
        if (criteriaId) query.criteriaId = criteriaId;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [reports, total] = await Promise.all([
            Report.find(query)
                .populate('programId', 'name code')
                .populate('organizationId', 'name code')
                .populate('standardId', 'name code')
                .populate('criteriaId', 'name code')
                .populate('createdBy', 'fullName email')
                .populate('accessControl.assignedExperts.expertId', 'fullName email')
                .populate('accessControl.advisors.advisorId', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Report.countDocuments(query)
        ]);

        // Xử lý dữ liệu để hiển thị
        const processedReports = reports.map(report => ({
            _id: report._id,
            title: report.title,
            code: report.code,
            type: report.type,
            typeText: report.typeText || getTypeText(report.type),
            standardInfo: report.standardId ? {
                id: report.standardId._id,
                name: report.standardId.name,
                code: report.standardId.code
            } : null,
            criteriaInfo: report.criteriaId ? {
                id: report.criteriaId._id,
                name: report.criteriaId.name,
                code: report.criteriaId.code
            } : null,
            experts: report.accessControl.assignedExperts.map(e => ({
                id: e.expertId._id,
                name: e.expertId.fullName,
                email: e.expertId.email,
                assignedAt: e.assignedAt,
                canComment: e.canComment,
                canEvaluate: e.canEvaluate
            })),
            advisors: report.accessControl.advisors.map(a => ({
                id: a.advisorId._id,
                name: a.advisorId.fullName,
                email: a.advisorId.email,
                assignedAt: a.assignedAt,
                canComment: a.canComment
            })),
            createdBy: {
                id: report.createdBy._id,
                name: report.createdBy.fullName,
                email: report.createdBy.email
            },
            createdAt: report.createdAt,
            metadata: report.metadata
        }));

        res.json({
            success: true,
            data: {
                reports: processedReports,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(total / limitNum),
                    total,
                    hasNext: pageNum * limitNum < total,
                    hasPrev: pageNum > 1
                },
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Get assessment reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách báo cáo đánh giá'
        });
    }
};

const getAssessmentReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const report = await Report.findOne({
            _id: id,
            academicYearId,
            status: 'published'
        })
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('accessControl.assignedExperts.expertId', 'fullName email')
            .populate('accessControl.assignedExperts.assignedBy', 'fullName email')
            .populate('accessControl.advisors.advisorId', 'fullName email')
            .populate('accessControl.advisors.assignedBy', 'fullName email')
            .lean();

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy báo cáo đánh giá'
            });
        }

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        console.error('Get assessment report by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin báo cáo đánh giá'
        });
    }
};

const getAssessmentStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        let matchQuery = {
            academicYearId: mongoose.Types.ObjectId(academicYearId),
            status: 'published'
        };

        if (req.user.role !== 'admin') {
            matchQuery.$or = [
                { createdBy: mongoose.Types.ObjectId(req.user.id) },
                { 'accessControl.assignedExperts.expertId': mongoose.Types.ObjectId(req.user.id) },
                { 'accessControl.advisors.advisorId': mongoose.Types.ObjectId(req.user.id) }
            ];
        }

        const stats = await Report.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    criteriaAnalysis: {
                        $sum: { $cond: [{ $eq: ['$type', 'criteria_analysis'] }, 1, 0] }
                    },
                    standardAnalysis: {
                        $sum: { $cond: [{ $eq: ['$type', 'standard_analysis'] }, 1, 0] }
                    },
                    comprehensiveReport: {
                        $sum: { $cond: [{ $eq: ['$type', 'comprehensive_report'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0] || {
                total: 0,
                criteriaAnalysis: 0,
                standardAnalysis: 0,
                comprehensiveReport: 0
            }
        });

    } catch (error) {
        console.error('Get assessment stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê'
        });
    }
};

function getTypeText(type) {
    const typeMap = {
        'criteria_analysis': 'Phân tích tiêu chí',
        'standard_analysis': 'Phân tích tiêu chuẩn',
        'comprehensive_report': 'Báo cáo tổng hợp'
    };
    return typeMap[type] || type;
}

module.exports = {
    getAssessmentReports,
    getAssessmentReportById,
    getAssessmentStats
};