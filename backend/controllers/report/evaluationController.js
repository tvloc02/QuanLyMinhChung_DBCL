const mongoose = require('mongoose');
const Evaluation = require('../../models/report/Evaluation');
const Assignment = require('../../models/report/Assignment');
const Report = require('../../models/report/Report');

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

        // Experts chỉ thấy đánh giá của mình
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
                .populate('supervisorGuidance.guidedBy', 'fullName email')
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
            .populate('supervisorGuidance.guidedBy', 'fullName email')
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
                message: 'Phân quyền không tồn tại trong năm học này'
            });
        }

        // Chỉ expert được phân quyền mới tạo đánh giá
        if (assignment.expertId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo đánh giá cho phân quyền này'
            });
        }

        // Phân quyền phải được chấp nhận
        if (!['accepted', 'in_progress'].includes(assignment.status)) {
            return res.status(400).json({
                success: false,
                message: 'Phân quyền chưa được chấp nhận'
            });
        }

        const existingEvaluation = await Evaluation.findOne({
            assignmentId,
            academicYearId
        });

        if (existingEvaluation) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá cho phân quyền này đã tồn tại'
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
        if (assignment.status === 'accepted') {
            await assignment.start();
        }

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

        console.log('📥 Update evaluation request:', { id, updateData });

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá trong năm học này'
            });
        }

        if (!evaluation.canEdit(req.user.id, req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền cập nhật đánh giá này'
            });
        }

        // ✅ Accept all updateable fields
        const allowedFields = [
            'criteriaScores',
            'overallComment',
            'rating',
            'totalScore',
            'maxTotalScore',
            'averageScore',
            'strengths',
            'improvementAreas',
            'recommendations',
            'evidenceAssessment'
        ];

        const oldData = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                oldData[field] = evaluation[field];
                evaluation[field] = updateData[field];
            }
        });

        // ✅ Validate required fields
        if (!evaluation.overallComment || evaluation.overallComment.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Nhận xét tổng thể là bắt buộc'
            });
        }

        if (!evaluation.rating) {
            return res.status(400).json({
                success: false,
                message: 'Xếp loại đánh giá là bắt buộc'
            });
        }

        if (!evaluation.evidenceAssessment?.adequacy) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá tính đầy đủ minh chứng là bắt buộc'
            });
        }

        if (!evaluation.evidenceAssessment?.relevance) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá tính liên quan minh chứng là bắt buộc'
            });
        }

        if (!evaluation.evidenceAssessment?.quality) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá chất lượng minh chứng là bắt buộc'
            });
        }

        evaluation.addHistory('updated', req.user.id, oldData);

        await evaluation.save();

        console.log('✅ Evaluation updated successfully');

        res.json({
            success: true,
            message: 'Cập nhật đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('❌ Update evaluation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi cập nhật đánh giá'
        });
    }
};

const submitEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        console.log('📥 Submit evaluation request:', { id });

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
                message: `Đánh giá hiện ở trạng thái "${evaluation.status}", không thể nộp`
            });
        }

        // ✅ Kiểm tra tính hoàn thiện
        const requiredFields = [
            { field: 'overallComment', message: 'Nhận xét tổng thể' },
            { field: 'rating', message: 'Xếp loại đánh giá' },
            {
                field: 'evidenceAssessment.adequacy',
                message: 'Đánh giá tính đầy đủ minh chứng',
                check: (val) => val && val.adequacy
            },
            {
                field: 'evidenceAssessment.relevance',
                message: 'Đánh giá tính liên quan minh chứng',
                check: (val) => val && val.relevance
            },
            {
                field: 'evidenceAssessment.quality',
                message: 'Đánh giá chất lượng minh chứng',
                check: (val) => val && val.quality
            }
        ];

        for (const required of requiredFields) {
            if (required.check) {
                if (!required.check(evaluation[required.field.split('.')[0]])) {
                    return res.status(400).json({
                        success: false,
                        message: `${required.message} là bắt buộc`
                    });
                }
            } else {
                if (!evaluation[required.field]) {
                    return res.status(400).json({
                        success: false,
                        message: `${required.message} là bắt buộc`
                    });
                }
            }
        }

        await evaluation.submit();

        const assignment = await Assignment.findById(evaluation.assignmentId);
        if (assignment) {
            await assignment.complete(evaluation._id);
        }

        // Cập nhật dữ liệu báo cáo
        const report = await Report.findById(evaluation.reportId);
        if (report) {
            const averageScore = await Evaluation.getAverageScoreByReport(evaluation.reportId);
            report.metadata.averageScore = averageScore;
            report.metadata.evaluationCount = (report.metadata.evaluationCount || 0) + 1;
            if (!report.evaluations.map(e => e.toString()).includes(evaluation._id.toString())) {
                report.evaluations.push(evaluation._id);
            }
            await report.save();
        }

        console.log('✅ Evaluation submitted successfully');

        res.json({
            success: true,
            message: 'Nộp đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('❌ Submit evaluation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi hệ thống khi nộp đánh giá'
        });
    }
};

const superviseEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const academicYearId = req.academicYearId;

        // Chỉ supervisor hoặc admin mới giám sát được
        if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền giám sát đánh giá'
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
                message: 'Chỉ có thể giám sát đánh giá đã nộp'
            });
        }

        await evaluation.supervise(req.user.id, comments);

        res.json({
            success: true,
            message: 'Giám sát đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('Supervise evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi giám sát đánh giá'
        });
    }
};

const finalizeEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const academicYearId = req.academicYearId;

        // Chỉ admin mới hoàn tất được
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

        if (evaluation.status !== 'supervised') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể hoàn tất đánh giá đã được giám sát'
            });
        }

        await evaluation.finalize(req.user.id);

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
    superviseEvaluation,
    finalizeEvaluation,
    autoSaveEvaluation,
    getEvaluatorStats,
    getSystemStats,
    getAverageScoreByReport
};