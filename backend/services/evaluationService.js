const Evaluation = require('../models/report/Evaluation');
const Assignment = require('../models/report/Assignment');
const Notification = require('../models/system/Notification');

const createEvaluationFromAssignment = async (assignmentId, evaluatorId) => {
    try {
        const assignment = await Assignment.findById(assignmentId)
            .populate('reportId');

        if (!assignment) {
            throw new Error('Assignment not found');
        }

        const evaluation = new Evaluation({
            academicYearId: assignment.academicYearId,
            assignmentId: assignment._id,
            reportId: assignment.reportId._id,
            evaluatorId,
            criteriaScores: assignment.evaluationCriteria || []
        });

        await evaluation.save();
        await assignment.start();

        return evaluation;
    } catch (error) {
        console.error('Create evaluation from assignment error:', error);
        throw error;
    }
};

const submitEvaluation = async (evaluationId, evaluatorId) => {
    try {
        const evaluation = await Evaluation.findById(evaluationId);

        if (!evaluation) {
            throw new Error('Evaluation not found');
        }

        if (evaluation.evaluatorId.toString() !== evaluatorId.toString()) {
            throw new Error('Unauthorized');
        }

        await evaluation.submit();

        // Complete assignment
        const assignment = await Assignment.findById(evaluation.assignmentId);
        if (assignment) {
            await assignment.complete(evaluationId);
        }

        // Notify managers
        await Notification.createEvaluationNotification(
            evaluationId,
            'evaluation_submitted',
            assignment.assignedBy
        );

        return evaluation;
    } catch (error) {
        console.error('Submit evaluation error:', error);
        throw error;
    }
};

const getEvaluationProgress = async (evaluatorId, academicYearId) => {
    try {
        const evaluations = await Evaluation.find({
            evaluatorId,
            academicYearId
        });

        return {
            total: evaluations.length,
            draft: evaluations.filter(e => e.status === 'draft').length,
            submitted: evaluations.filter(e => e.status === 'submitted').length,
            completed: evaluations.filter(e => e.status === 'final').length
        };
    } catch (error) {
        console.error('Get evaluation progress error:', error);
        throw error;
    }
};

module.exports = {
    createEvaluationFromAssignment,
    submitEvaluation,
    getEvaluationProgress
};