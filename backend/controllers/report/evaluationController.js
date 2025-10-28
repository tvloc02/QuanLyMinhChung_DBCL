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
                }
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
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId })
            .populate('reportId', 'title type code')
            .populate('evaluatorId', 'fullName email')
            .populate('assignmentId', 'deadline priority')
            .populate('supervisorGuidance.guidedBy', 'fullName email');

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (!evaluation.canView(currentUserId, currentUserRole)) {
            console.warn(`403: User ${currentUserId} (${currentUserRole}) tried to view evaluation ${id}.`);
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
            message: 'Lỗi khi lấy thông tin đánh giá'
        });
    }
};

const createEvaluation = async (req, res) => {
    try {
        const { assignmentId } = req.body;
        const academicYearId = req.academicYearId;

        console.log('📥 Creating evaluation for assignmentId:', assignmentId);

        if (!assignmentId) {
            return res.status(400).json({
                success: false,
                message: 'assignmentId là bắt buộc'
            });
        }

        const assignment = await Assignment.findOne({
            _id: assignmentId,
            academicYearId
        }).populate('reportId');

        if (!assignment) {
            console.error('❌ Assignment not found:', assignmentId);
            return res.status(400).json({
                success: false,
                message: 'Phân quyền không tồn tại'
            });
        }

        console.log('✅ Assignment found:', assignment.status);

        if (assignment.expertId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo đánh giá cho phân quyền này'
            });
        }

        if (!['pending', 'accepted', 'in_progress'].includes(assignment.status)) {
            return res.status(400).json({
                success: false,
                message: `Phân quyền không thể được đánh giá. Trạng thái hiện tại: ${assignment.status}`
            });
        }

        const existingEvaluation = await Evaluation.findOne({
            assignmentId,
            academicYearId
        });

        if (existingEvaluation) {
            console.log('⚠️ Evaluation already exists:', existingEvaluation._id);
            return res.status(409).json({
                success: false,
                message: 'Đánh giá cho phân quyền này đã tồn tại',
                data: {
                    existingEvaluationId: existingEvaluation._id,
                    status: existingEvaluation.status
                }
            });
        }

        const evaluation = new Evaluation({
            academicYearId,
            assignmentId,
            reportId: assignment.reportId._id,
            evaluatorId: req.user.id,
            criteriaScores: assignment.evaluationCriteria || [],
            rating: '',
            overallComment: '',
            evidenceAssessment: {
                adequacy: '',
                relevance: '',
                quality: ''
            },
            status: 'draft'
        });

        await evaluation.save();

        if (assignment.status === 'pending') {
            assignment.status = 'accepted';
        } else if (assignment.status === 'accepted') {
            assignment.status = 'in_progress';
        }
        assignment.evaluationId = evaluation._id;
        await assignment.save();

        await evaluation.populate([
            { path: 'reportId', select: 'title type code' },
            { path: 'evaluatorId', select: 'fullName email' },
            { path: 'assignmentId', select: 'deadline priority' }
        ]);

        console.log('✅ Evaluation created:', evaluation._id);

        res.status(201).json({
            success: true,
            message: 'Tạo đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('❌ Create evaluation error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo đánh giá'
        });
    }
};

const updateEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;


        console.log('📥 Update evaluation:', { id, updateData });

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (!evaluation.canEdit(currentUserId, currentUserRole)) {
            let errorMessage = 'Không có quyền cập nhật đánh giá này.';

            if (currentUserRole === 'expert' && evaluation.evaluatorId.toString() === currentUserId.toString()) {
                if (evaluation.status !== 'draft') {
                    errorMessage = `Bạn chỉ có quyền sửa bản nháp. Đánh giá này đang ở trạng thái: ${evaluation.status}.`;
                }
            } else if (currentUserRole === 'expert') {
                errorMessage = 'Bạn chỉ có quyền chỉnh sửa đánh giá do bạn tạo.';
            }

            return res.status(403).json({
                success: false,
                message: errorMessage
            });
        }

        if (updateData.overallComment !== undefined) {
            evaluation.overallComment = updateData.overallComment;
        }

        if (updateData.rating !== undefined) {
            evaluation.rating = updateData.rating;
        }

        if (updateData.evidenceAssessment !== undefined) {
            evaluation.evidenceAssessment = updateData.evidenceAssessment;
        }

        if (updateData.criteriaScores !== undefined) {
            evaluation.criteriaScores = updateData.criteriaScores;
            evaluation.calculateScores();
        }

        if (updateData.strengths !== undefined) {
            evaluation.strengths = updateData.strengths;
        }

        if (updateData.improvementAreas !== undefined) {
            evaluation.improvementAreas = updateData.improvementAreas;
        }

        if (updateData.recommendations !== undefined) {
            evaluation.recommendations = updateData.recommendations;
        }

        evaluation.addHistory('updated', req.user.id);
        await evaluation.save();

        console.log('✅ Evaluation updated');

        res.json({
            success: true,
            message: 'Cập nhật đánh giá thành công',
            data: evaluation
        });

    } catch (error) {
        console.error('❌ Update evaluation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật đánh giá'
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
                message: 'Đánh giá đã nộp, không thể nộp lại'
            });
        }

        const validationErrors = [];

        if (!evaluation.overallComment || evaluation.overallComment.trim() === '') {
            validationErrors.push('Nhận xét tổng thể là bắt buộc');
        }

        if (!evaluation.rating || !['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'].includes(evaluation.rating)) {
            validationErrors.push('Xếp loại đánh giá là bắt buộc');
        }

        if (!evaluation.evidenceAssessment?.adequacy || !['insufficient', 'adequate', 'comprehensive'].includes(evaluation.evidenceAssessment.adequacy)) {
            validationErrors.push('Tính đầy đủ minh chứng là bắt buộc');
        }

        if (!evaluation.evidenceAssessment?.relevance || !['poor', 'fair', 'good', 'excellent'].includes(evaluation.evidenceAssessment.relevance)) {
            validationErrors.push('Tính liên quan minh chứng là bắt buộc');
        }

        if (!evaluation.evidenceAssessment?.quality || !['poor', 'fair', 'good', 'excellent'].includes(evaluation.evidenceAssessment.quality)) {
            validationErrors.push('Chất lượng minh chứng là bắt buộc');
        }

        if (evaluation.criteriaScores && evaluation.criteriaScores.length > 0) {
            const invalidCriteria = [];
            evaluation.criteriaScores.forEach((c, idx) => {
                if (!c.criteriaName || c.criteriaName.trim() === '') {
                    invalidCriteria.push(`Tiêu chí ${idx + 1}: tên không hợp lệ`);
                }
                if (c.score === undefined || c.score === null || c.score === '') {
                    invalidCriteria.push(`Tiêu chí ${idx + 1} (${c.criteriaName}): chưa có điểm`);
                }
                if (typeof c.score === 'number' && (c.score < 0 || c.score > (c.maxScore || 10))) {
                    invalidCriteria.push(`Tiêu chí ${idx + 1} (${c.criteriaName}): điểm phải từ 0 đến ${c.maxScore || 10}`);
                }
            });

            if (invalidCriteria.length > 0) {
                validationErrors.push(...invalidCriteria);
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Đánh giá chưa đầy đủ. Vui lòng kiểm tra các lỗi sau:',
                errors: validationErrors,
                data: {
                    overallComment: evaluation.overallComment ? '✅' : '❌',
                    rating: evaluation.rating ? '✅' : '❌',
                    evidenceAssessment: {
                        adequacy: evaluation.evidenceAssessment?.adequacy ? '✅' : '❌',
                        relevance: evaluation.evidenceAssessment?.relevance ? '✅' : '❌',
                        quality: evaluation.evidenceAssessment?.quality ? '✅' : '❌'
                    },
                    criteriaScores: evaluation.criteriaScores?.length > 0 ? '✅' : '❌'
                }
            });
        }

        await evaluation.submit();

        const assignment = await Assignment.findById(evaluation.assignmentId);
        if (assignment) {
            await assignment.complete(evaluation._id);
        }

        const report = await Report.findById(evaluation.reportId);
        if (report) {
            const averageScore = await Evaluation.getAverageScoreByReport(evaluation.reportId);
            if (report.metadata) {
                report.metadata.averageScore = averageScore;
                report.metadata.evaluationCount = (report.metadata.evaluationCount || 0) + 1;
            }
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
            message: error.message || 'Lỗi khi nộp đánh giá'
        });
    }
};

const superviseEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const academicYearId = req.academicYearId;

        if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ admin/supervisor có quyền'
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
            message: 'Lỗi khi giám sát đánh giá'
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
                message: 'Chỉ admin có quyền'
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
            message: 'Lỗi khi hoàn tất đánh giá'
        });
    }
};

const autoSaveEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;


        const evaluation = await Evaluation.findOne({ _id: id, academicYearId });
        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đánh giá'
            });
        }

        if (!evaluation.canEdit(currentUserId, currentUserRole)) {
            let errorMessage = 'Không có quyền cập nhật đánh giá này.';

            if (currentUserRole === 'expert' && evaluation.evaluatorId.toString() === currentUserId.toString()) {
                if (evaluation.status !== 'draft') {
                    errorMessage = `Bạn chỉ có quyền sửa bản nháp. Đánh giá này đang ở trạng thái: ${evaluation.status}.`;
                }
            } else if (currentUserRole === 'expert') {
                errorMessage = 'Bạn chỉ có quyền chỉnh sửa đánh giá do bạn tạo.';
            }

            return res.status(403).json({
                success: false,
                message: errorMessage
            });
        }

        const allowedAutoSaveFields = [
            'overallComment', 'rating', 'evidenceAssessment',
            'strengths', 'improvementAreas', 'recommendations', 'criteriaScores'
        ];

        allowedAutoSaveFields.forEach(field => {
            if (updateData[field] !== undefined) {
                evaluation[field] = updateData[field];
            }
        });

        if (updateData.criteriaScores !== undefined) {
            evaluation.calculateScores();
        }

        await evaluation.autoSave();

        res.json({
            success: true,
            message: 'Lưu tự động thành công',
            data: { lastSaved: evaluation.metadata.lastSaved }
        });

    } catch (error) {
        console.error('Auto save error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi auto save'
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
            data: stats
        });

    } catch (error) {
        console.error('Get evaluator stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê'
        });
    }
};

const getSystemStats = async (req, res) => {
    try {
        const academicYearId = req.academicYearId;

        const stats = await Evaluation.getSystemStats(academicYearId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê hệ thống'
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
        console.error('Get average score error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy điểm trung bình'
        });
    }
};

const deleteEvaluation = async (req, res) => {
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

        if (req.user.role !== 'admin' &&
            (evaluation.evaluatorId.toString() !== req.user.id.toString() || evaluation.status !== 'draft')
        ) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có quyền xóa bản nháp của chính mình'
            });
        }

        const assignment = await Assignment.findById(evaluation.assignmentId);
        if (assignment && assignment.status !== 'cancelled' && assignment.status !== 'pending') {
            assignment.status = 'accepted';
            assignment.evaluationId = undefined;
            await assignment.save();
        }

        await Evaluation.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Đã xóa đánh giá thành công'
        });

    } catch (error) {
        console.error('Delete evaluation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa đánh giá'
        });
    }
};

module.exports = {
    getEvaluations,
    getEvaluationById,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    submitEvaluation,
    superviseEvaluation,
    finalizeEvaluation,
    autoSaveEvaluation,
    getEvaluatorStats,
    getSystemStats,
    getAverageScoreByReport
};