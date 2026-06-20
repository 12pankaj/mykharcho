const pool = require('../config/db');

class Notification {
    // Get notifications for a user
    static async getByUserId(userId) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(query, [userId]);
        return rows;
    }

    // Mark notification as read
    static async markAsRead(id, userId) {
        const query = `
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = $1 AND user_id = $2 
            RETURNING *
        `;
        const { rows } = await pool.query(query, [id, userId]);
        return rows[0];
    }

    // Create a single notification
    static async create(userId, title, message, type) {
        const query = `
            INSERT INTO notifications (user_id, title, message, type) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *
        `;
        const { rows } = await pool.query(query, [userId, title, message, type]);
        return rows[0];
    }

    // Broadcast a notification to all users
    static async broadcast(title, message, type) {
        const query = `
            INSERT INTO notifications (user_id, title, message, type)
            SELECT id, $1, $2, $3 FROM users
            RETURNING *
        `;
        const { rows } = await pool.query(query, [title, message, type]);
        return rows;
    }
}

module.exports = Notification;
