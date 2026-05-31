const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const connectedUsers = new Map();

function setupSocket(server) {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId).select('_id role name email');
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);
    connectedUsers.set(userId, socket.id);

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

function notifyUser(userId, notification) {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
}

function notifyAdmins(notification) {
  if (io) {
    io.emit('admin_notification', notification);
  }
}

module.exports = { setupSocket, getIO, notifyUser, notifyAdmins };
