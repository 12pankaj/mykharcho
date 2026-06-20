const { Server } = require('socket.io');

let io;

exports.initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Allow both web-app (admin) and marketing-site
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Visitor joining from marketing site
        socket.on('join_visitor', (data) => {
            const { name, email } = data;
            // Room is unique to the visitor
            socket.join(socket.id);
            console.log(`Visitor ${name} (${email}) joined room ${socket.id}`);
            
            // Notify admins that a new visitor wants to chat
            io.to('admin_room').emit('visitor_waiting', { 
                visitorId: socket.id, 
                name, 
                email,
                message: 'Looking for support' 
            });
        });

        // Admin joining
        socket.on('join_admin', () => {
            socket.join('admin_room');
            console.log(`Admin joined admin_room: ${socket.id}`);
        });

        // Visitor sends a message
        socket.on('visitor_send_message', (data) => {
            // Send to admins
            io.to('admin_room').emit('receive_admin_message', {
                visitorId: socket.id,
                message: data.message,
                sender: 'visitor'
            });
        });

        // Admin sends a message back to specific visitor
        socket.on('admin_send_message', (data) => {
            const { visitorId, message } = data;
            io.to(visitorId).emit('receive_visitor_message', {
                message,
                sender: 'admin'
            });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

exports.getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
