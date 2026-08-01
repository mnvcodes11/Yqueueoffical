const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Auth middleware: client connects with `auth: { token }` (the same JWT
  // used for REST calls). No token, no bad room-spoofing possible - the
  // room a socket joins is derived from the verified token, never from
  // anything the client claims.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Not authorized'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`student:${socket.userId}`);
    if (socket.role === 'worker' || socket.role === 'admin') {
      socket.join('staff');
    }
  });

  return io;
};

const getIo = () => {
  if (!io) throw new Error('Socket.IO not initialized - call initSocket(server) first');
  return io;
};

// Notify the student who owns the order (their dashboard/order tracking page).
const emitOrderUpdateToStudent = (studentId, order) => {
  if (!io) return;
  io.to(`student:${studentId}`).emit('order:update', order);
};

// Notify kitchen/worker/admin views that the live order queue changed.
const emitOrderUpdateToStaff = (order) => {
  if (!io) return;
  io.to('staff').emit('order:update', order);
};

module.exports = { initSocket, getIo, emitOrderUpdateToStudent, emitOrderUpdateToStaff };
