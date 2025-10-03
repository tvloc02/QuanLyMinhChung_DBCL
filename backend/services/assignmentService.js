const Assignment = require('../models/report/Assignment');
const Notification = require('../models/system/Notification');
const User = require('../models/User/User');

const createAssignment = async (assignmentData, assignedBy) => {
    try {
        const assignment = new Assignment({
            ...assignmentData,
            assignedBy
        });

        await assignment.save();

        // Create notification for expert
        await Notification.createAssignmentNotification(
            assignment._id,
            'assignment_new',
            assignment.expertId,
            assignedBy
        );

        return assignment;
    } catch (error) {
        console.error('Create assignment error:', error);
        throw error;
    }
};

const getExpertAssignments = async (expertId, academicYearId, filters = {}) => {
    try {
        const query = {
            expertId,
            academicYearId,
            ...filters
        };

        return await Assignment.find(query)
            .populate('reportId', 'title type')
            .populate('assignedBy', 'fullName email')
            .sort({ createdAt: -1 });
    } catch (error) {
        console.error('Get expert assignments error:', error);
        throw error;
    }
};

const checkOverdueAssignments = async () => {
    try {
        return await Assignment.markOverdueAssignments();
    } catch (error) {
        console.error('Check overdue assignments error:', error);
        throw error;
    }
};

const sendReminders = async () => {
    try {
        const upcomingDeadlines = await Assignment.getUpcomingDeadlines(null, 3); // 3 days

        for (const assignment of upcomingDeadlines) {
            await Notification.createAssignmentNotification(
                assignment._id,
                'assignment_reminder',
                assignment.expertId
            );

            await assignment.addReminder('reminder', 'Nhắc nhở hạn chót đánh giá');
        }

        return upcomingDeadlines.length;
    } catch (error) {
        console.error('Send assignment reminders error:', error);
        throw error;
    }
};

module.exports = {
    createAssignment,
    getExpertAssignments,
    checkOverdueAssignments,
    sendReminders
};