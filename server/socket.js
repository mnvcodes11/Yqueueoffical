const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const normalizeOrigins = (origins) => {
  const normalized = new Set();
  origins.forEach((origin) => {
    const trimmed = String(origin).trim();
    if (!trimmed) return;
    try {
      const url = new URL(trimmed);
      normalized.add(url.origin);
      if (url.hostname === 'localhost') {
        url.hostname = '127.0.0.1';
        normalized.add(url.origin);
      }
    } catch (err) {
      normalized.add(trimmed);
    }
  });
  return Array.from(normalized);
};

const initSocket = (httpServer) => {
  const allowedOrigins = normalizeOrigins(
    process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',')
      : ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://yqueue.vercel.app']
  );
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
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
      if (!decoded?.id || !decoded?.role) {
        return next(new Error('Not authorized'));
      }
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
  if (!studentId) return;

  let sid = studentId;
  // If a populated student object was passed, extract the identifier.
  if (typeof studentId === 'object') {
    if (studentId._id) sid = studentId._id;
    else if (studentId.id) sid = studentId.id;
  }

  try {
    sid = sid.toString();
  } catch (e) {
    return;
  }

  io.to(`student:${sid}`).emit('order:update', order);
};

// Notify kitchen/worker/admin views that the live order queue changed.
const emitOrderUpdateToStaff = (order) => {
  if (!io) return;
  io.to('staff').emit('order:update', order);
};

module.exports = { initSocket, getIo, emitOrderUpdateToStudent, emitOrderUpdateToStaff };

// Test helper: allow setting `io` in unit tests without starting a real server.
// Not used in production; included to facilitate automated checks.
module.exports.__setIoForTests = (testIo) => {
  io = testIo;
};
