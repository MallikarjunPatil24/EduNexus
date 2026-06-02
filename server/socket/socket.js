import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for local development
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join general user room
    socket.on('join_user', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    // Join role-based room (e.g. 'teacher', 'student', 'parent', 'admin')
    socket.on('join_role', (role) => {
      socket.join(role);
      console.log(`User joined role room: ${role}`);
    });

    // Handle messages
    socket.on('send_message', (data) => {
      // data: { sender, receiver, content, timestamp }
      const { receiver } = data;
      socket.to(receiver).emit('receive_message', data);
      console.log(`Message routed from ${data.sender} to ${receiver}`);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      // data: { sender, receiver, isTyping }
      socket.to(data.receiver).emit('typing', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Send real-time notification to a specific user
export const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(userId).emit('notification', notification);
  }
};

// Send real-time notification to a specific role group
export const sendNotificationToRole = (role, notification) => {
  if (io) {
    io.to(role).emit('notification', notification);
  }
};
