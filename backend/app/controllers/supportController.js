const pool = require('../config/db');
const aiSupport = require('../services/aiSupport');

exports.createTicket = async (req, res) => {
    try {
        const { subject, description, priority } = req.body;
        const userId = req.user.id;

        const result = await pool.query(
            'INSERT INTO support_tickets (user_id, subject, description, status, priority) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, subject, description, 'Open', priority || 'Normal']
        );

        const ticket = result.rows[0];

        // Trigger AI Response asynchronously (don't block the user)
        aiSupport.getAIResponse(subject, description).then(async (aiMsg) => {
            await pool.query(
                'INSERT INTO support_messages (ticket_id, sender_type, message) VALUES ($1, $2, $3)',
                [ticket.id, 'ai', aiMsg]
            );
        });

        res.json({ success: true, ticket: ticket });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({ error: 'Could not create ticket' });
    }
};

exports.getTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json({ success: true, tickets: result.rows });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Could not fetch tickets' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const result = await pool.query(
            'SELECT * FROM support_messages WHERE ticket_id = $1 ORDER BY created_at ASC',
            [ticketId]
        );
        res.json({ success: true, messages: result.rows });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Could not fetch messages' });
    }
};

exports.addMessage = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        // Set sender type based on user role
        const senderType = (role === 'admin' || role === 'agent') ? role : 'user';

        const result = await pool.query(
            'INSERT INTO support_messages (ticket_id, sender_type, message) VALUES ($1, $2, $3) RETURNING *',
            [ticketId, senderType, message]
        );

        // If an admin or agent replies, and the ticket is 'Open', move it to 'In Progress'
        if (role === 'admin' || role === 'agent') {
            await pool.query(
                "UPDATE support_tickets SET status = 'In Progress' WHERE id = $1 AND status = 'Open'",
                [ticketId]
            );
        }

        res.json({ success: true, message: result.rows[0] });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Could not add message' });
    }
};
