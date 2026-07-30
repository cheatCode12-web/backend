const { Server } = require('socket.io');

let io;

module.exports.initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user's room
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Handle sending messages
    socket.on('send_message', (data) => {
      const { recipient_id, content, message_id } = data;
      // Emit to recipient's room
      io.to(`user_${recipient_id}`).emit('new_message', {
        id: message_id,
        content,
        timestamp: new Date()
      });
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { user_id, target_id } = data;
      io.to(`user_${target_id}`).emit('user_typing', { user_id });
    });

    socket.on('typing_stop', (data) => {
      const { user_id, target_id } = data;
      io.to(`user_${target_id}`).emit('user_stopped_typing', { user_id });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

module.exports.emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

module.exports.getIO = () => io;