/**
 * SwasthGuru Signal Service
 * ─────────────────────────────────────────────────────────────────────────
 * WebRTC Signalling + Socket.IO server supporting 300+ concurrent sessions.
 *
 * Features:
 * - Room registry with participant limits and metadata
 * - Full WebRTC signalling: offer/answer/ICE candidate relay
 * - Session heartbeat monitoring (30-second ping/pong)
 * - Graceful reconnection with room state recovery
 * - Real-time connection metrics tracking
 * - Chat message relay within rooms
 * - TURN/STUN server config endpoint
 * - Health check endpoint for load balancer probes
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5001', 10);
const MAX_PARTICIPANTS_PER_ROOM = parseInt(process.env.MAX_PARTICIPANTS || '2', 10);
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 10_000;

// ─── Room Registry ─────────────────────────────────────────────────────────
interface Participant {
    socketId: string;
    userId: string;
    role: string;
    joinedAt: number;
    lastSeen: number;
}

interface Room {
    id: string;
    participants: Map<string, Participant>; // socketId -> Participant
    createdAt: number;
    metadata: Record<string, any>;
}

const rooms = new Map<string, Room>();

// ─── Metrics ───────────────────────────────────────────────────────────────
const metrics = {
    totalConnections: 0,
    activeConnections: 0,
    peakConnections: 0,
    totalRoomsCreated: 0,
    activeRooms: 0,
    messagesRelayed: 0,
    startedAt: Date.now(),
};

// ─── App Setup ─────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
    },
    pingTimeout: 20_000,
    pingInterval: 10_000,
    transports: ['websocket', 'polling'],
    // Increase buffer for high-concurrency
    maxHttpBufferSize: 1e6,
    connectTimeout: 20_000,
});

// ─── REST Endpoints ────────────────────────────────────────────────────────

/** Health check for GCP load balancer / Kubernetes probes */
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'signal-service',
        uptime: Math.floor((Date.now() - metrics.startedAt) / 1000),
        activeConnections: metrics.activeConnections,
        activeRooms: metrics.activeRooms,
    });
});

/** Live metrics endpoint */
app.get('/metrics', (_req, res) => {
    res.json({
        ...metrics,
        uptimeSeconds: Math.floor((Date.now() - metrics.startedAt) / 1000),
        rooms: Array.from(rooms.values()).map(room => ({
            id: room.id,
            participants: room.participants.size,
            ageSeconds: Math.floor((Date.now() - room.createdAt) / 1000),
        })),
    });
});

/** STUN/TURN configuration endpoint — clients call this before creating RTCPeerConnection */
app.get('/ice-config', (_req, res) => {
    const iceServers = [
        // Public STUN servers (for development / fallback)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ];

    // Add TURN server if configured (required for users behind symmetric NAT)
    if (process.env.TURN_SERVER_URL) {
        iceServers.push({
            urls: process.env.TURN_SERVER_URL,
            // @ts-ignore
            username: process.env.TURN_USERNAME || '',
            credential: process.env.TURN_CREDENTIAL || '',
        } as any);
    }

    res.json({ iceServers });
});

// ─── Utility Functions ─────────────────────────────────────────────────────
function getOrCreateRoom(roomId: string, metadata: Record<string, any> = {}): Room {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            id: roomId,
            participants: new Map(),
            createdAt: Date.now(),
            metadata,
        });
        metrics.totalRoomsCreated++;
        metrics.activeRooms++;
        console.log(`[room] Created room: ${roomId}`);
    }
    return rooms.get(roomId)!;
}

function removeParticipantFromRoom(roomId: string, socketId: string): void {
    const room = rooms.get(roomId);
    if (!room) return;

    room.participants.delete(socketId);
    console.log(`[room] Participant ${socketId} left room ${roomId}. Remaining: ${room.participants.size}`);

    // Clean up empty rooms
    if (room.participants.size === 0) {
        rooms.delete(roomId);
        metrics.activeRooms--;
        console.log(`[room] Room ${roomId} destroyed (empty)`);
    }
}

function broadcastRoomState(roomId: string): void {
    const room = rooms.get(roomId);
    if (!room) return;

    const state = {
        roomId,
        participantCount: room.participants.size,
        participants: Array.from(room.participants.values()).map(p => ({
            userId: p.userId,
            role: p.role,
            joinedAt: p.joinedAt,
        })),
    };

    io.to(roomId).emit('room-state', state);
}

// ─── Socket.IO Connection Handler ─────────────────────────────────────────
io.on('connection', (socket: Socket) => {
    metrics.totalConnections++;
    metrics.activeConnections++;
    metrics.peakConnections = Math.max(metrics.peakConnections, metrics.activeConnections);

    console.log(`[socket] Connected: ${socket.id} (active: ${metrics.activeConnections})`);

    // Track which rooms this socket joined (for cleanup on disconnect)
    const joinedRooms = new Set<string>();

    // ── Heartbeat ────────────────────────────────────────────────────────
    let missedHeartbeats = 0;
    const heartbeatInterval = setInterval(() => {
        socket.emit('ping');
        missedHeartbeats++;
        if (missedHeartbeats >= 3) {
            console.warn(`[heartbeat] Socket ${socket.id} unresponsive — disconnecting`);
            socket.disconnect(true);
        }
    }, HEARTBEAT_INTERVAL_MS);

    socket.on('pong', () => {
        missedHeartbeats = 0;
        // Update lastSeen for all rooms this socket is in
        for (const roomId of joinedRooms) {
            const room = rooms.get(roomId);
            const participant = room?.participants.get(socket.id);
            if (participant) participant.lastSeen = Date.now();
        }
    });

    // ── Room Management ──────────────────────────────────────────────────
    socket.on('join-room', (data: { roomId: string; userId: string; role?: string; metadata?: any }) => {
        const { roomId, userId, role = 'patient', metadata = {} } = data;

        if (!roomId || !userId) {
            socket.emit('error', { code: 'INVALID_DATA', message: 'roomId and userId are required.' });
            return;
        }

        const room = getOrCreateRoom(roomId, metadata);

        // Enforce participant limit
        if (room.participants.size >= MAX_PARTICIPANTS_PER_ROOM && !room.participants.has(socket.id)) {
            socket.emit('error', {
                code: 'ROOM_FULL',
                message: `Room ${roomId} is full (max ${MAX_PARTICIPANTS_PER_ROOM} participants).`,
            });
            return;
        }

        socket.join(roomId);
        joinedRooms.add(roomId);

        const participant: Participant = {
            socketId: socket.id,
            userId,
            role,
            joinedAt: Date.now(),
            lastSeen: Date.now(),
        };

        room.participants.set(socket.id, participant);

        console.log(`[room] ${userId} (${role}) joined ${roomId}. Total: ${room.participants.size}`);

        // Notify OTHER participants that a new user connected
        socket.to(roomId).emit('user-connected', { userId, role, socketId: socket.id });

        // Send current room state to the newly joined user
        socket.emit('room-joined', {
            roomId,
            participantCount: room.participants.size,
            existingParticipants: Array.from(room.participants.values())
                .filter(p => p.socketId !== socket.id)
                .map(p => ({ userId: p.userId, role: p.role })),
        });

        // Broadcast updated room state to all
        broadcastRoomState(roomId);
    });

    // ── WebRTC Signalling Events ─────────────────────────────────────────
    socket.on('offer', (data: { roomId: string; offer: RTCSessionDescriptionInit; targetUserId?: string }) => {
        metrics.messagesRelayed++;
        socket.to(data.roomId).emit('offer', {
            offer: data.offer,
            fromSocketId: socket.id,
        });
    });

    socket.on('answer', (data: { roomId: string; answer: RTCSessionDescriptionInit; targetUserId?: string }) => {
        metrics.messagesRelayed++;
        socket.to(data.roomId).emit('answer', {
            answer: data.answer,
            fromSocketId: socket.id,
        });
    });

    socket.on('ice-candidate', (data: { roomId: string; candidate: RTCIceCandidate }) => {
        metrics.messagesRelayed++;
        socket.to(data.roomId).emit('ice-candidate', {
            candidate: data.candidate,
            fromSocketId: socket.id,
        });
    });

    // ── Reconnection Support ─────────────────────────────────────────────
    socket.on('reconnect-to-room', (data: { roomId: string; userId: string; role?: string }) => {
        const { roomId, userId, role = 'patient' } = data;
        const room = rooms.get(roomId);

        if (room) {
            socket.join(roomId);
            joinedRooms.add(roomId);
            room.participants.set(socket.id, {
                socketId: socket.id,
                userId,
                role,
                joinedAt: Date.now(),
                lastSeen: Date.now(),
            });

            // Notify others of reconnection
            socket.to(roomId).emit('user-reconnected', { userId, role, socketId: socket.id });

            socket.emit('reconnect-ack', {
                roomId,
                participantCount: room.participants.size,
            });

            console.log(`[room] ${userId} reconnected to ${roomId}`);
        } else {
            // Room was cleaned up; treat as a fresh join
            socket.emit('room-gone', { roomId, message: 'Room no longer exists. Please start a new session.' });
        }
    });

    // ── Chat Messages ────────────────────────────────────────────────────
    socket.on('chat-message', (data: { roomId: string; message: string; senderId: string; timestamp?: number }) => {
        metrics.messagesRelayed++;
        const enriched = {
            ...data,
            timestamp: data.timestamp || Date.now(),
            messageId: uuidv4(),
        };
        // Relay to others in the room (not back to sender)
        socket.to(data.roomId).emit('chat-message', enriched);
    });

    // ── Call Control ─────────────────────────────────────────────────────
    socket.on('call-ended', (data: { roomId: string; userId?: string }) => {
        socket.to(data.roomId).emit('call-ended', { userId: data.userId, socketId: socket.id });
        console.log(`[call] Call ended in room ${data.roomId} by ${socket.id}`);
    });

    socket.on('media-state', (data: { roomId: string; videoEnabled: boolean; audioEnabled: boolean; userId: string }) => {
        socket.to(data.roomId).emit('media-state', data);
    });

    // ── Disconnect Cleanup ───────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
        metrics.activeConnections--;
        clearInterval(heartbeatInterval);

        console.log(`[socket] Disconnected: ${socket.id} (reason: ${reason}, active: ${metrics.activeConnections})`);

        for (const roomId of joinedRooms) {
            const room = rooms.get(roomId);
            const participant = room?.participants.get(socket.id);

            if (participant) {
                socket.to(roomId).emit('user-disconnected', {
                    userId: participant.userId,
                    socketId: socket.id,
                    reason,
                });
                removeParticipantFromRoom(roomId, socket.id);
                broadcastRoomState(roomId);
            }
        }

        joinedRooms.clear();
    });
});

// ─── Start Server ──────────────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🔌 SwasthGuru Signal Service running on port ${PORT}`);
    console.log(`   → Health: http://localhost:${PORT}/health`);
    console.log(`   → Metrics: http://localhost:${PORT}/metrics`);
    console.log(`   → ICE Config: http://localhost:${PORT}/ice-config`);
    console.log(`   → Max participants per room: ${MAX_PARTICIPANTS_PER_ROOM}\n`);
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────
process.on('SIGTERM', () => {
    console.log('[signal-service] SIGTERM received. Closing connections...');
    io.emit('server-shutdown', { message: 'Server is restarting. Please reconnect in a moment.' });
    httpServer.close(() => {
        console.log('[signal-service] Server closed.');
        process.exit(0);
    });
});
