// backend/controllers/dashboard/dashboardController.js
const mongoose = require('mongoose');

// Import Models
const User = mongoose.model('User');
const Evidence = mongoose.model('Evidence');
const Report = mongoose.model('Report');
const Assignment = mongoose.model('Assignment');
const Evaluation = mongoose.model('Evaluation');
const AcademicYear = mongoose.model('AcademicYear');
const Program = mongoose.model('Program');
const Organization = mongoose.model('Organization');
const Standard = mongoose.model('Standard');
const Criteria = mongoose.model('Criteria');
const File = mongoose.model('File');
const ActivityLog = mongoose.model('ActivityLog');

// Hàm Helper để lấy thống kê cơ bản của User (không phụ thuộc năm học)
const getUserStatistics = async () => {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const managerUsers = await User.countDocuments({ role: 'manager' });
    const expertUsers = await User.countDocuments({ role: 'expert' });
    const advisorUsers = await User.countDocuments({ role: 'advisor' });
    const activeYears = await AcademicYear.countDocuments({ status: 'active' });

    return { totalUsers, adminUsers, managerUsers, expertUsers, advisorUsers, activeYears };
};

// =========================================================================
// === ADMIN DASHBOARD CONTROLLER (HÀM TỔNG HỢP MỚI)
// =========================================================================

const getAllAdminStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        // --- 1. Lấy dữ liệu tổng quan User/System ---
        const userStats = await getUserStatistics();

        // --- 2. Lấy dữ liệu chi tiết theo Academic Year ---
        const [
            programStats,
            organizationStats,
            standardStats,
            criteriaStats,
            evidenceStats,
            reportStats,
            assignmentStats,
            evaluationStats,
            recentActivities
        ] = await Promise.all([
            // Program Stats
            Program.aggregate([
                { $match: { academicYearId: mongoose.Types.ObjectId(academicYearId) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Organization Stats
            Organization.aggregate([
                { $match: { academicYearId: mongoose.Types.ObjectId(academicYearId) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Standard Stats
            Standard.aggregate([
                { $match: { academicYearId: mongoose.Types.ObjectId(academicYearId) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Criteria Stats
            Criteria.aggregate([
                { $match: { academicYearId: mongoose.Types.ObjectId(academicYearId) } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Evidence Stats (Sử dụng logic từ evidenceController/getStatistics)
            Evidence.aggregate([
                { $match: { academicYearId: mongoose.Types.ObjectId(academicYearId) } },
                {
                    $group: {
                        _id: null,
                        totalEvidences: { $sum: 1 },
                        approvedEvidences: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                        inProgressEvidences: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                        rejectedEvidences: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                        totalFiles: { $sum: { $size: '$files' } },
                    }
                }
            ]),
            // Report Stats (Sử dụng logic từ reportController/getReportStats)
            Report.aggregate([
                { $match: { academicYearId: new mongoose.Types.ObjectId(academicYearId) } },
                {
                    $group: {
                        _id: null,
                        totalReports: { $sum: 1 },
                        draftReports: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                        publishedReports: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
                        totalViews: { $sum: '$metadata.viewCount' },
                        totalDownloads: { $sum: '$metadata.downloadCount' },
                    }
                }
            ]),
            // Assignment Stats (Sử dụng logic từ assignmentController/getAssignmentStats)
            Assignment.aggregate([
                { $match: { academicYearId: new mongoose.Types.ObjectId(academicYearId) } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        status: '$_id',
                        count: '$count'
                    }
                }
            ]),
            // Evaluation Stats (Sử dụng logic từ evaluationController/getSystemStats)
            Evaluation.aggregate([
                { $match: { academicYearId: new mongoose.Types.ObjectId(academicYearId) } },
                {
                    $group: {
                        _id: null,
                        totalEvaluations: { $sum: 1 },
                        draftEvaluations: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
                        submittedEvaluations: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
                        supervisedEvaluations: { $sum: { $cond: [{ $eq: ['$status', 'supervised'] }, 1, 0] } },
                        totalScore: { $sum: '$averageScore' }
                    }
                }
            ]),
            // Recent Activities
            ActivityLog.find({})
                .populate('userId', 'fullName email')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        // --- 3. Tính toán bổ sung ---

        // Total File Size (Lấy từ Evidence Stat đã tính ở evidenceController)
        const evidenceIds = await Evidence.find({ academicYearId }).distinct('_id');
        const fileStats = await File.aggregate([
            { $match: { evidenceId: { $in: evidenceIds }, type: 'file' } },
            { $group: { _id: null, totalSize: { $sum: '$size' } } }
        ]);
        const totalFilesSizeGB = (fileStats[0]?.totalSize || 0) / (1024 * 1024 * 1024);

        // Assignment Due Date Stats
        const overdueAssignments = await Assignment.countDocuments({
            academicYearId,
            status: { $in: ['pending', 'accepted', 'in_progress'] },
            deadline: { $lt: new Date() }
        });


        // --- 4. Chuẩn hóa Output ---

        const programStatusMap = programStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
        const orgStatusMap = organizationStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
        const standardStatusMap = standardStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {});
        const assignmentStatusMap = assignmentStats.reduce((acc, item) => ({ ...acc, [item.status]: item.count }), {});

        const evidenceResult = evidenceStats[0] || {};
        const reportResult = reportStats[0] || {};
        const evaluationResult = evaluationStats[0] || {};

        const totalEvaluations = evaluationResult.totalEvaluations || 0;
        const averageScore = totalEvaluations > 0 ? (evaluationResult.totalScore / totalEvaluations).toFixed(1) : 0;

        const finalStats = {
            // Tổng quan hệ thống
            totalUsers: userStats.totalUsers,
            activeYears: userStats.activeYears,

            // Thống kê người dùng theo vai trò
            roleStats: userStats,

            // Cấu hình (Program, Org, Standard, Criteria)
            programStats: programStatusMap,
            organizationStats: orgStatusMap,
            standardStats: standardStatusMap,
            criteriaStats: criteriaStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),

            // Minh chứng
            evidenceStats: {
                totalEvidences: evidenceResult.totalEvidences || 0,
                approved: evidenceResult.approvedEvidences || 0,
                inProgress: evidenceResult.inProgressEvidences || 0,
                rejected: evidenceResult.rejectedEvidences || 0,
                totalFiles: evidenceResult.totalFiles || 0,
                totalFileSizeGB: totalFilesSizeGB,
            },

            // Báo cáo
            reportStats: {
                totalReports: reportResult.totalReports || 0,
                published: reportResult.publishedReports || 0,
                draft: reportResult.draftReports || 0,
                totalViews: reportResult.totalViews || 0,
                totalDownloads: reportResult.totalDownloads || 0,
            },

            // Đánh giá (Assignment & Evaluation)
            assignmentStats: {
                ...assignmentStatusMap,
                overdue: overdueAssignments,
                total: reportResult.totalReports || 0, // Approx total assignments = total reports
            },
            evaluationStats: {
                total: totalEvaluations,
                draft: evaluationResult.draftEvaluations || 0,
                submitted: evaluationResult.submittedEvaluations || 0,
                supervised: evaluationResult.supervisedEvaluations || 0,
                averageScore: averageScore,
            },

            // Hoạt động
            recentActivities,

            academicYear: req.currentAcademicYear
        };

        res.json({ success: true, data: finalStats });

    } catch (error) {
        console.error('Get all admin stats error:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy thống kê dashboard' });
    }
};


// =========================================================================
// === MANAGER DASHBOARD CONTROLLER
// =========================================================================

const getManagerStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;
        const managerId = req.user.id;

        const [
            totalReports,
            pendingAssignments,
            completedReports,
            myAssignmentsTotal
        ] = await Promise.all([
            // Tổng báo cáo do Manager này tạo
            Report.countDocuments({
                academicYearId,
                createdBy: managerId
            }),
            // Tổng phân công đang chờ expert chấp nhận
            Assignment.countDocuments({
                academicYearId,
                assignedBy: managerId,
                status: 'pending'
            }),
            // Tổng báo cáo đã hoàn thành đánh giá (Giả định: đã có 1 evaluation status completed)
            Report.countDocuments({
                academicYearId,
                createdBy: managerId,
                evaluationCount: { $gt: 0 } // Giả định trường này tồn tại sau khi đánh giá
            }),
            // Tổng phân công do Manager này tạo
            Assignment.countDocuments({
                academicYearId,
                assignedBy: managerId
            })
        ]);

        res.json({
            success: true,
            data: {
                totalReports,
                pendingEvaluations: pendingAssignments,
                completedReports,
                myAssignments: myAssignmentsTotal
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =========================================================================
// === EXPERT DASHBOARD CONTROLLER
// =========================================================================

const getExpertStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;
        const expertId = req.user.id;

        const [
            activeAssignmentsCount, // pending, accepted, in_progress
            completedEvaluationsCount, // completed
            draftEvaluationsCount, // draft, in_progress
            avgScoreData
        ] = await Promise.all([
            Assignment.countDocuments({
                academicYearId,
                expertId: expertId,
                status: { $in: ['pending', 'accepted', 'in_progress'] }
            }),
            Evaluation.countDocuments({
                academicYearId,
                evaluatorId: expertId,
                status: 'completed'
            }),
            Evaluation.countDocuments({
                academicYearId,
                evaluatorId: expertId,
                status: { $in: ['draft', 'in_progress'] } // Bao gồm draft và những cái đã accepted nhưng chưa submit
            }),
            Evaluation.aggregate([
                {
                    $match: {
                        academicYearId: new mongoose.Types.ObjectId(academicYearId),
                        evaluatorId: new mongoose.Types.ObjectId(expertId),
                        status: { $in: ['submitted', 'supervised', 'completed'] } // Chỉ tính điểm của các bản đã nộp trở lên
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
                myAssignments: activeAssignmentsCount,
                completed: completedEvaluationsCount,
                pending: draftEvaluationsCount,
                avgScore: avgScoreData[0]?.avgScore?.toFixed(1) || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =========================================================================
// === ADVISOR DASHBOARD CONTROLLER
// =========================================================================

const getAdvisorStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;
        const userAccess = {
            standardAccess: req.user.standardAccess || [],
            criteriaAccess: req.user.criteriaAccess || []
        };

        // Query chỉ giới hạn trong phạm vi quyền truy cập của Advisor
        let evidenceQuery = { academicYearId };

        if (userAccess.standardAccess.length > 0) {
            evidenceQuery.$or = [
                { standardId: { $in: userAccess.standardAccess } },
                { criteriaId: { $in: userAccess.criteriaAccess } }
            ];
        } else {
            // Nếu không có quyền truy cập cụ thể, chỉ hiển thị những gì công khai hoặc không có gì
            // Trong trường hợp này, ta giả định quyền truy cập bằng 0 nếu không có cấu hình.
            // Để đảm bảo tính chính xác, nếu không có standard/criteria access, ta chỉ đếm những mục công khai
            // Hoặc giới hạn ở 0 nếu logic backend chặt chẽ
        }

        const [
            evidencesCount,
            programsCount,
            totalFilesCount
        ] = await Promise.all([
            Evidence.countDocuments(evidenceQuery),
            Program.countDocuments({ academicYearId }),
            File.countDocuments({})
        ]);

        // Advisor chỉ có thể xem số lượng Standards mà họ có quyền
        const standardsCount = userAccess.standardAccess.length;

        res.json({
            success: true,
            data: {
                evidences: evidencesCount,
                standards: standardsCount,
                programs: programsCount,
                files: totalFilesCount // Tổng file trong hệ thống (cần xem xét lại quyền truy cập)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllAdminStats, // Endpoint tổng hợp mới cho Admin
    getManagerStats,
    getExpertStats,
    getAdvisorStats
};