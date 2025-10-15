const mongoose = require('mongoose');
const Evaluation = require('../../models/report/Evaluation');
const Assignment = require('../../models/report/Assignment');
const Report = require('../../models/report/Report'); // Đảm bảo import Report

const getEvaluations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            evaluatorId,
            reportId,
            rating,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const academicYearId = req.academicYearId;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        let query = { academicYearId };

        // Đảm bảo Expert chỉ thấy đánh giá của mình
        if (req.user.role === 'expert') {
            query.evaluatorId = req.user.id;
        }

        if (search) {
            query.$or = [
                { overallComment: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query.status = status;
        if (evaluatorId) query.evaluatorId = evaluatorId;
        if (reportId) query.reportId = reportId;
        if (rating) query.rating = rating;

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [evaluations, total] = await Promise.all([
            Evaluation.find(query)
                .populate('reportId', 'title type code')
                .populate('evaluatorId', 'fullName email')
                .populate('assignmentId', 'deadline priority')
                .populate('reviewedBy', 'fullName email')
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Evaluation.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                evaluations,
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
        console.error('Get evaluations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách đánh giá'
        });
    }
};

const getEvaluationById = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId })
            .populate('reportId', 'title type code content')
            .populate('evaluatorId', 'fullName email')
            .populate('assignmentId')
            .populate('reviewedBy', 'fullName email')
            .populate({
                path: 'history.userId',
                select: 'fullName email'
            });

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá trong năm học này'
            });
        }

        // LƯU Ý: logic canView đã được định nghĩa trong Evaluation.js
        if (!evaluation.canView(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem đánh giá này'
            });
        }

        res.json({
            success: true,
            data: evaluation
        });

    } catch (error) {
        console.error('Get evaluation by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin đánh giá'
        });
    }
};

const createEvaluation = async (req, res) => {
    try {
        const { assignmentId } = req.body;
        const academicYearId = req.academicYearId;

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            academicYearId
        }).populate('reportId');

        if (!assignment) {
            return res.status(400).json({
                success: false,
                message: 'Phân công không tồn tại trong năm học này'
            });
        }

        // CHUYÊN GIA TẠO ĐÁNH GIÁ CỦA CHÍNH MÌNH
        if (assignment.expertId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo đánh giá cho phân công này'
            });
        }

        const existingEvaluation = await Evaluation.findOne({
            assignmentId,
            academicYearId
        });

        if (existingEvaluation) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá cho phân công này đã tồn tại'
            });
        }

        const evaluation = new Evaluation({
            academicYearId,
            assignmentId,
            reportId: assignment.reportId._id,
            evaluatorId: req.user.id,
            criteriaScores: assignment.evaluationCriteria.map(criteria => ({
                criteriaName: criteria.name,
                maxScore: criteria.maxScore,
                score: 0,
                weight: criteria.weight,
                comment: ''
            })),
            rating: 'satisfactory',
            overallComment: '',
            evidenceAssessment: {
                adequacy: 'adequate',
                relevance: 'fair',
                quality: 'fair'
            }
        });

        await evaluation.save();

        // Cập nhật trạng thái Assignment sang 'in_progress'
        await assignment.start();

        await evaluation.populate([
            { path: 'reportId', select: 'title type code' },
            { path: 'evaluatorId', select: 'fullName email' },
            { path: 'assignmentId' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Tạo đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('Create evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tạo đánh giá'
        });
    }
};

const updateEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá trong năm học này'
            });
        }

        // LƯU Ý: logic canEdit đã được định nghĩa trong Evaluation.js
        if (!evaluation.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền cập nhật đánh giá này'
            });
        }

        const allowedFields = [
            'criteriaScores', 'overallComment', 'strengths', 'improvementAreas',
            'recommendations', 'evidenceAssessment'
        ];

        const oldData = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                oldData[field] = evaluation[field];
                evaluation[field] = updateData[field];
            }
        });

        evaluation.addHistory('updated', req.user.id, oldData);

        await evaluation.save();

        res.json({
            success: true,
            message: 'Cập nhật đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('Update evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật đánh giá'
        });
    }
};

const submitEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (evaluation.evaluatorId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền nộp đánh giá này'
            });
        }

        if (evaluation.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá đã được nộp trước đó'
            });
        }

        // KIỂM TRA ĐẦY ĐỦ THÔNG TIN
        if (!evaluation.isComplete) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá chưa hoàn thiện, vui lòng điền đầy đủ thông tin'
            });
        }

        await evaluation.submit();

        const assignment = await Assignment.findById(evaluation.assignmentId);
        if (assignment) {
            // Cập nhật trạng thái Assignment sang 'completed'
            await assignment.complete(evaluation._id);
        }

        res.json({
            success: true,
            message: 'Nộp đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('Submit evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi nộp đánh giá'
        });
    }
};

const reviewEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const academicYearId = req.academicYearId;

        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem xét đánh giá'
            });
        }

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (evaluation.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể xem xét đánh giá đã nộp'
            });
        }

        await evaluation.review(req.user.id, comments);

        res.json({
            success: true,
            message: 'Xem xét đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('Review evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi xem xét đánh giá'
        });
    }
};

const finalizeEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin mới có quyền hoàn tất đánh giá'
            });
        }

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (evaluation.status !== 'reviewed') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể hoàn tất đánh giá đã được xem xét'
            });
        }

        await evaluation.finalize(req.user.id);

        // --- BỔ SUNG: CẬP NHẬT ĐIỂM TRUNG BÌNH VÀ SỐ LƯỢNG ĐÁNH GIÁ CỦA BÁO CÁO ---
        const averageScore = await Evaluation.getAverageScoreByReport(evaluation.reportId);

        const report = await Report.findById(evaluation.reportId);
        if (report) {
            // Cập nhật điểm trung bình
            report.metadata.averageScore = averageScore;
            // Tăng số lượng đánh giá
            report.metadata.evaluationCount = (report.metadata.evaluationCount || 0) + 1;
            // Thêm ID đánh giá vào mảng evaluations của Report (nếu chưa có)
            if (!report.evaluations.map(e => e.toString()).includes(evaluation._id.toString())) {
                report.evaluations.push(evaluation._id);
            }

            await report.save();
        }
        // -----------------------------------------------------------------------

        res.json({
            success: true,
            message: 'Hoàn tất đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('Finalize evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi hoàn tất đánh giá'
        });
    }
};

const autoSaveEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (!evaluation.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền cập nhật đánh giá này'
            });
        }

        Object.assign(evaluation, updateData);
        await evaluation.autoSave();

        res.json({
            success: true,
            message: 'Auto save thành công',
            data: { lastSaved: evaluation.metadata.lastSaved }
        });

    } catch (error) {
        console.error('Auto save evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi auto save'
        });
    }
};

const getEvaluatorStats = async (req, res) => {
    try {
        const { evaluatorId } = req.params;
        const academicYearId = req.academicYearId;

        const stats = await Evaluation.getEvaluatorStats(evaluatorId, academicYearId);

        res.json({
            success: true,
            data: {
                ...stats,
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Get evaluator stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê chuyên gia'
        });
    }
};

const getSystemStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const stats = await Evaluation.getSystemStats(academicYearId);

        res.json({
            success: true,
            data: {
                ...stats,
                academicYear: req.currentAcademicYear
            }
        });

    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy thống kê hệ thống'
        });
    }
};

const getAverageScoreByReport = async (req, res) => {
    try {
        const { reportId } = req.params;

        const averageScore = await Evaluation.getAverageScoreByReport(reportId);

        res.json({
            success: true,
            data: { averageScore }
        });

    } catch (error) {
        console.error('Get average score by report error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy điểm trung bình'
        });
    }
};

module.exports = {
    getEvaluations,
    getEvaluationById,
    createEvaluation,
    updateEvaluation,
    submitEvaluation,
    reviewEvaluation,
    finalizeEvaluation,
    autoSaveEvaluation,
    getEvaluatorStats,
    getSystemStats,
    getAverageScoreByReport
};