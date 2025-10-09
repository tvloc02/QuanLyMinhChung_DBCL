// backend/controllers/dashboard/dashboardController.js
const User = require('../../models/User/User');
const Evidence = require('../../models/Evidence/Evidence');
const Report = require('../../models/report/Report');
const Assignment = require('../../models/report/Assignment');
const Evaluation = require('../../models/report/Evaluation');

// Admin Stats
const getAdminStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalEvidences,
            activeYears,
            pendingReports
        ] = await Promise.all([
            User.countDocuments({ status: 'active' }),
            Evidence.countDocuments({ academicYearId: req.academicYearId }),
            require('../../models/system/AcademicYear').countDocuments({ status: 'active' }),
            Report.countDocuments({
                academicYearId: req.academicYearId,
                status: 'pending'
            })
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalEvidences,
                activeYears,
                pendingReports
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Manager Stats
const getManagerStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const [
            totalReports,
            pendingEvaluations,
            completedReports,
            myAssignments
        ] = await Promise.all([
            Report.countDocuments({
                academicYearId,
                createdBy: req.user.id
            }),
            Assignment.countDocuments({
                academicYearId,
                assignedBy: req.user.id,
                status: 'pending'
            }),
            Report.countDocuments({
                academicYearId,
                createdBy: req.user.id,
                status: 'completed'
            }),
            Assignment.countDocuments({
                academicYearId,
                assignedBy: req.user.id
            })
        ]);

        res.json({
            success: true,
            data: {
                totalReports,
                pendingEvaluations,
                completedReports,
                myAssignments
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Expert Stats
const getExpertStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const [
            myAssignments,
            completedEvaluations,
            pendingEvaluations,
            avgScoreData
        ] = await Promise.all([
            Assignment.countDocuments({
                academicYearId,
                expertId: req.user.id,
                status: { $in: ['pending', 'in_progress'] }
            }),
            Evaluation.countDocuments({
                academicYearId,
                evaluatorId: req.user.id,
                status: 'completed'
            }),
            Evaluation.countDocuments({
                academicYearId,
                evaluatorId: req.user.id,
                status: { $in: ['draft', 'in_progress'] }
            }),
            Evaluation.aggregate([
                {
                    $match: {
                        academicYearId,
                        evaluatorId: req.user.id,
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgScore: { $avg: '$averageScore' }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                myAssignments,
                completed: completedEvaluations,
                pending: pendingEvaluations,
                avgScore: avgScoreData[0]?.avgScore?.toFixed(1) || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Advisor Stats
const getAdvisorStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;
        const userAccess = {
            standardAccess: req.user.standardAccess || [],
            criteriaAccess: req.user.criteriaAccess || []
        };

        let evidenceQuery = { academicYearId };
        if (userAccess.standardAccess.length > 0) {
            evidenceQuery.standardId = { $in: userAccess.standardAccess };
        }

        const [
            evidences,
            standards,
            programs,
            files
        ] = await Promise.all([
            Evidence.countDocuments(evidenceQuery),
            userAccess.standardAccess.length,
            require('../../models/Evidence/Program').countDocuments({ academicYearId }),
            require('../../models/Evidence/File').countDocuments()
        ]);

        res.json({
            success: true,
            data: {
                evidences,
                standards,
                programs,
                files
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAdminStats,
    getManagerStats,
    getExpertStats,
    getAdvisorStats
};