import { io } from 'socket.io-client';

const defaultSocketUrl = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://yqueue.onrender.com';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl;

let socket = null;

// Connects once per session. Safe to call repeatedly - returns the existing
// connection if one is already open.
export const connectSocket = () => {
  const token = localStorage.getItem('yqueue_token');
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
