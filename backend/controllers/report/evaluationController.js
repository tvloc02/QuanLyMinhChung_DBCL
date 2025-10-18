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
            message: 'Lỗi khi lấy thông tin đánh giá'
        });
    }
};

const createEvaluation = async (req, res) => {
    try {
        const { assignmentId } = req.body;
        const academicYearId = req.academicYearId;

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
            return res.status(400).json({
                success: false,
                message: 'Phân quyền không tồn tại'
            });
        }

        if (assignment.expertId.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền tạo đánh giá cho phân quyền này'
            });
        }

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

        // ✅ TẠO EVALUATION VỚI DEFAULT VALUES - overallComment có giá trị mặc định
        const evaluation = new Evaluation({
            academicYearId,
            assignmentId,
            reportId: assignment.reportId._id,
            evaluatorId: req.user.id,
            criteriaScores: [],
            rating: 'satisfactory',
            overallComment: '', // Giờ cho phép rỗng, sẽ validate khi submit
            evidenceAssessment: {
                adequacy: 'adequate',
                relevance: 'fair',
                quality: 'fair'
            }
        });

        await evaluation.save();

        // Update assignment status
        if (assignment.status === 'accepted') {
            await assignment.start();
        }

        await evaluation.populate([
            { path: 'reportId', select: 'title type code' },
            { path: 'evaluatorId', select: 'fullName email' }
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
            message: error.message || 'Lỗi khi tạo đánh giá'
        });
    }
};

const updateEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const academicYearId = req.academicYearId;

        console.log('📥 Update evaluation:', { id, updateData });

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

        // ✅ CHỈ UPDATE CÁC FIELDS CÓ TRONG updateData
        if (updateData.overallComment !== undefined) {
            evaluation.overallComment = updateData.overallComment;
        }

        if (updateData.rating !== undefined) {
            evaluation.rating = updateData.rating;
        }

        if (updateData.evidenceAssessment !== undefined) {
            evaluation.evidenceAssessment = updateData.evidenceAssessment;
        }

        // ✅ KHÔNG VALIDATE YÊU CẦU KHI UPDATE (chỉ lưu draft)
        // Validation bắt buộc sẽ ở hàm submitEvaluation

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

        // ✅ CHECK REQUIRED BEFORE SUBMIT - KIỂM TRA TẤT CẢ FIELDS
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
                message: 'Tính đầy đủ minh chứng là bắt buộc'
            });
        }

        if (!evaluation.evidenceAssessment?.relevance) {
            return res.status(400).json({
                success: false,
                message: 'Tính liên quan minh chứng là bắt buộc'
            });
        }

        if (!evaluation.evidenceAssessment?.quality) {
            return res.status(400).json({
                success: false,
                message: 'Chất lượng minh chứng là bắt buộc'
            });
        }

        await evaluation.submit();

        // Update assignment
        const assignment = await Assignment.findById(evaluation.assignmentId);
        if (assignment) {
            await assignment.complete(evaluation._id);
        }

        // Update report
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

        console.log('✅ Evaluation submitted');

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
                message: 'Không có quyền cập nhật'
            });
        }

        Object.assign(evaluation, updateData);
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