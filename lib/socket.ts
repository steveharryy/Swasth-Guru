'use client';

import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from './utils';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const SOCKET_URL = getSocketUrl();
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
}
