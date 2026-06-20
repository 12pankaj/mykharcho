const Notification = require('../models/notificationModel');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.getByUserId(req.user.id);
        res.status(200).json({ success: true, data: notifications });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.markAsRead(id, req.user.id);
        
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        
        res.status(200).json({ success: true, data: notification });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.broadcastNotification = async (req, res) => {
    try {
        const { title, message } = req.body;
        
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }
        
        await Notification.broadcast(title, message, 'system');
        
        res.status(200).json({ success: true, message: 'Broadcast sent to all users successfully' });
    } catch (err) {
        console.error('Error broadcasting notification:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
