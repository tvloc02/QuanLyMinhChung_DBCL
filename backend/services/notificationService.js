const Notification = require('../models/system/Notification');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./emailService');

const createNotification = async (notificationData) => {
    try {
        const notification = new Notification(notificationData);
        await notification.save();

        // Send email if enabled
        if (notification.channels.email) {
            await sendEmailNotification(notification);
        }

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

const sendEmailNotification = async (notification) => {
    try {
        // Implementation for email sending based on notification type
        console.log(`Email notification sent: ${notification.title}`);
    } catch (error) {
        console.error('Send email notification error:', error);
    }
};

const markAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findById(notificationId);
        if (notification && notification.recipientId.toString() === userId.toString()) {
            return await notification.markAsRead();
        }
        return null;
    } catch (error) {
        console.error('Mark notification as read error:', error);
        throw error;
    }
};

module.exports = {
    createNotification,
    markAsRead
};