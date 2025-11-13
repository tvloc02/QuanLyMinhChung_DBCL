const mongoose = require('mongoose');
const Evaluation = require('../../models/report/Evaluation');
const Assignment = require('../../models/report/Assignment');
const Report = require('../../models/report/Report');

const getEvaluations = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, evaluatorId, reportId, score, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const academicYearId = req.academicYearId;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        let query = { academicYearId };

        if (req.user.role === 'evaluator' && !evaluatorId) query.evaluatorId = req.user.id;
        if (search) query.overallComment = { $regex: search, $options: 'i' };
        if (status) query.status = status;
        if (evaluatorId) query.evaluatorId = evaluatorId;
        if (reportId) query.reportId = reportId;
        if (score) query.score = parseInt(score);

        const [evaluations, total] = await Promise.all([
            Evaluation.find(query)
                .populate('reportId', 'title type code')
                .populate('evaluatorId', 'fullName email')
                .populate('assignmentId', 'deadline priority')
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip).limit(parseInt(limit)),
            Evaluation.countDocuments(query)
        ]);

        res.json({ success: true, data: { evaluations, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total }, academicYear: req.currentAcademicYear } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};

const getEvaluationById = async (req, res) => {
    try {
        const evaluation = await Evaluation.findOne({ _id: req.params.id, academicYearId: req.academicYearId })
            .populate('reportId', 'title type code content')
            .populate('evaluatorId', 'fullName email')
            .populate('assignmentId');
        if (!evaluation) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        if (!evaluation.canView(req.user.id, req.user.role)) return res.status(403).json({ success: false, message: 'Không có quyền xem' });
        res.json({ success: true, data: evaluation });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};

const createEvaluation = async (req, res) => {
    try {
        const { assignmentId } = req.body;
        const academicYearId = req.academicYearId;

        const assignment = await Assignment.findOne({ _id: assignmentId, academicYearId }).populate('reportId');
        if (!assignment) return res.status(400).json({ success: false, message: 'Phân quyền không tồn tại' });
        if (assignment.evaluatorId.toString() !== req.user.id.toString()) return res.status(403).json({ success: false, message: 'Không có quyền' });

        const existing = await Evaluation.findOne({ assignmentId, academicYearId });
        if (existing) return res.status(400).json({ success: false, message: 'Đánh giá đã tồn tại' });

        const evaluation = new Evaluation({
            academicYearId,
            assignmentId,
            reportId: assignment.reportId._id,
            evaluatorId: req.user.id,
            status: 'draft',
            evidenceAssessment: {}
        });

        await evaluation.save();

        if (assignment.status === 'accepted') {
            await assignment.start();
        }

        await evaluation.populate([{ path: 'reportId', select: 'title type code' }, { path: 'evaluatorId', select: 'fullName email' }, { path: 'assignmentId' }]);
        res.status(201).json({ success: true, message: 'Tạo bản nháp thành công', data: evaluation });

    } catch (error) {
        console.error('Create evaluation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateEvaluation = async (req, res) => {
    try {
        const evaluation = await Evaluation.findOne({ _id: req.params.id, academicYearId: req.academicYearId });
        if (!evaluation) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        if (!evaluation.canEdit(req.user.id, req.user.role)) return res.status(403).json({ success: false, message: 'Không có quyền cập nhật' });

        const allowedFields = ['overallComment', 'score', 'strengths', 'improvementAreas', 'recommendations', 'evidenceAssessment'];
        const oldData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                oldData[field] = evaluation[field];
                evaluation[field] = req.body[field];
            }
        });

        evaluation.addHistory('updated', req.user.id, oldData);
        await evaluation.save();
        res.json({ success: true, message: 'Cập nhật thành công', data: evaluation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};

const submitEvaluation = async (req, res) => {
    try {
        const evaluation = await Evaluation.findOne({ _id: req.params.id, academicYearId: req.academicYearId });
        if (!evaluation) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

        await evaluation.submit();

        const Assignment = require('../../models/report/Assignment');
        await Assignment.updateOne({ _id: evaluation.assignmentId }, { status: 'completed', completedAt: new Date() });

        res.json({ success: true, message: 'Nộp thành công', data: evaluation });
    } catch (err) {
        console.error('Submit error:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: Object.values(err.errors).map(e => e.message) });
        }
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};

const superviseEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        if (req.user.role !== 'admin' && req.user.role !== 'supervisor') return res.status(403).json({ success: false, message: 'Không có quyền' });

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId: req.academicYearId });
        if (!evaluation) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        if (evaluation.status !== 'submitted') return res.status(400).json({ success: false, message: 'Chỉ giám sát đánh giá đã nộp' });

        await evaluation.supervise(req.user.id, comments);
        res.json({ success: true, message: 'Giám sát thành công', data: evaluation });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};

const finalizeEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Không có quyền' });

        const evaluation = await Evaluation.findOne({ _id: id, academicYearId: req.academicYearId });
        if (!evaluation) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        if (evaluation.status !== 'supervised') return res.status(400).json({ success: false, message: 'Chỉ hoàn tất đánh giá đã giám sát' });

        await evaluation.finalize(req.user.id);
        res.json({ success: true, message: 'Hoàn tất thành công', data: evaluation });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};

const autoSaveEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const evaluation = await Evaluation.findOne({ _id: id, academicYearId: req.academicYearId });
        if (!evaluation) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        if (!evaluation.canEdit(req.user.id, req.user.role)) return res.status(403).json({ success: false, message: 'Không có quyền' });

        Object.assign(evaluation, updateData);
        await evaluation.autoSave();
        res.json({ success: true, message: 'Auto save thành công', data: { lastSaved: evaluation.metadata.lastSaved } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};

const getEvaluatorStats = async (req, res) => {
    try {
        const { evaluatorId } = req.params;
        const stats = await Evaluation.getEvaluatorStats(evaluatorId, req.academicYearId);
        res.json({ success: true, data: { ...stats, academicYear: req.currentAcademicYear } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};

const getSystemStats = async (req, res) => {
    try {
        const stats = await Evaluation.getSystemStats(req.academicYearId);
        res.json({ success: true, data: { ...stats, academicYear: req.currentAcademicYear } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};

const getAverageScoreByReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const averageScore = await Evaluation.getAverageScoreByReport(reportId);
        res.json({ success: true, data: { averageScore } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
};

module.exports = {
    getEvaluations, getEvaluationById, createEvaluation, updateEvaluation,
    submitEvaluation, superviseEvaluation, finalizeEvaluation, autoSaveEvaluation,
    getEvaluatorStats, getSystemStats, getAverageScoreByReport
};