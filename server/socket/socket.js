import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.endsWith('.onrender.com') ||
          origin.endsWith('.cloudfront.net')
        ) {
          return callback(null, true);
        }
        return callback(new Error('Socket.IO CORS blocked origin'), false);
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  io.on('connection', (socket) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SOCKET] Client connected: ${socket.id}`);
    }

    // Join general user room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(userId);
      }
    });

    // Join role-based room (e.g. 'teacher', 'student', 'parent', 'admin', 'school')
    socket.on('join_role', (role) => {
      if (role) {
        socket.join(role);
      }
    });

    // Handle messages with room targeting
    socket.on('send_message', (data) => {
      const { receiver } = data;
      if (receiver) {
        socket.to(receiver).emit('receive_message', data);
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      if (data?.receiver) {
        socket.to(data.receiver).emit('typing', data);
      }
    });

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
      }
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
  if (io && userId) {
    io.to(userId).emit('notification', notification);
  }
};

// Send real-time notification to a specific role group
export const sendNotificationToRole = (role, notification) => {
  if (io && role) {
    io.to(role).emit('notification', notification);
  }
};
