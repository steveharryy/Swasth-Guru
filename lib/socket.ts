'use client';

/**
 * Socket.IO Client
 * ─────────────────────────────────────────────────────────────────────────
 * Manages the singleton Socket.IO connection to the SwasthGuru signal service.
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Room auto-rejoin on reconnect
 * - Server heartbeat (ping/pong) response
 * - Connection state change callbacks
 * - Graceful server shutdown handling
 */

import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from './utils';

let socket: Socket | null = null;

// Track current room membership for auto-rejoin on reconnect
let currentRoom: { roomId: string; userId: string; role: string } | null = null;

// Connection state change listeners
const stateListeners: Array<(state: SocketConnectionState) => void> = [];

export type SocketConnectionState =
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected'
    | 'server_shutdown';

let currentState: SocketConnectionState = 'disconnected';

function notifyStateChange(state: SocketConnectionState): void {
    currentState = state;
    stateListeners.forEach(fn => fn(state));
}

export function getSocket(): Socket {
    if (!socket) {
        const SOCKET_URL = getSocketUrl();

        socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],  // WebSocket first, polling fallback
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
            randomizationFactor: 0.5,
            reconnectionAttempts: Infinity,
            timeout: 20_000,
        });

        // ── Connection Lifecycle ────────────────────────────────────────────
        socket.on('connect', () => {
            console.log('[socket] Connected:', socket!.id);
            notifyStateChange('connected');

            // Auto-rejoin the room if we were in one before disconnect
            if (currentRoom) {
                console.log('[socket] Auto-rejoining room:', currentRoom.roomId);
                socket!.emit('reconnect-to-room', currentRoom);
            }
        });

        socket.on('disconnect', (reason) => {
            console.warn('[socket] Disconnected:', reason);
            notifyStateChange('disconnected');
        });

        socket.on('connect_error', (err) => {
            console.error('[socket] Connection error:', err.message);
            notifyStateChange('reconnecting');
        });

        socket.on('reconnect_attempt', (attempt) => {
            console.log(`[socket] Reconnect attempt #${attempt}`);
            notifyStateChange('reconnecting');
        });

        socket.on('reconnect', () => {
            console.log('[socket] Reconnected successfully');
            notifyStateChange('connected');
        });

        // ── Heartbeat (server sends 'ping', client responds with 'pong') ──
        socket.on('ping', () => {
            socket!.emit('pong');
        });

        // ── Server shutdown notice ─────────────────────────────────────────
        socket.on('server-shutdown', ({ message }: { message: string }) => {
            console.warn('[socket] Server shutdown notice:', message);
            notifyStateChange('server_shutdown');
        });
    }

    return socket;
}

/**
 * Join a consultation room and track it for auto-rejoin.
 */
export function joinRoom(roomId: string, userId: string, role: string = 'patient'): void {
    currentRoom = { roomId, userId, role };
    const s = getSocket();
    s.emit('join-room', { roomId, userId, role });
}

/**
 * Leave a room and clear the stored room state.
 */
export function leaveRoom(roomId: string): void {
    if (currentRoom?.roomId === roomId) {
        currentRoom = null;
    }
}

/**
 * Register a callback to be notified of connection state changes.
 * Returns an unsubscribe function.
 */
export function onSocketStateChange(fn: (state: SocketConnectionState) => void): () => void {
    stateListeners.push(fn);
    // Immediately call with current state
    fn(currentState);
    return () => {
        const idx = stateListeners.indexOf(fn);
        if (idx !== -1) stateListeners.splice(idx, 1);
    };
}

/**
 * Get the current connection state.
 */
export function getSocketState(): SocketConnectionState {
    return currentState;
}

/**
 * Disconnect and reset the socket (call this on logout).
 */
export function disconnectSocket(): void {
    if (socket) {
        currentRoom = null;
        socket.disconnect();
        socket = null;
        notifyStateChange('disconnected');
    }
}
