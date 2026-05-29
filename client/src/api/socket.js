import { io } from 'socket.io-client';
import { getToken } from './http.js';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  socket = io({
    autoConnect: false,
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: getToken() };
  if (!s.connected) s.connect();
  return s;
}
