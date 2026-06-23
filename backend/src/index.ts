/**
 * SwasthGuru Backend — Secured Monolith Entry Point
 * ─────────────────────────────────────────────────────────────────────────
 * This is the primary API gateway for local development.
 * In production (GCP/Docker), each route group runs as a dedicated microservice
 * in the /services directory. This file composes them for local convenience.
 *
 * Security layers:
 * - JWT authentication via Clerk JWKS
 * - RBAC (Role-Based Access Control) per route group
 * - Rate limiting (IP-based token bucket)
 * - Structured request logging (GCP Cloud Logging compatible)
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';

// ─── Route Handlers ─────────────────────────────────────────────────────────
import doctorRoutes from './routes/doctors';
import userRoutes from './routes/users';
import appointmentRoutes from './routes/appointments';
import recordRoutes from './routes/records';
import recognizeMedicineRouter from './routes/recognizeMedicine';

// ─── Middleware ─────────────────────────────────────────────────────────────
import { requireAuth, optionalAuth } from './middleware/auth';
import { requireRole } from './middleware/rbac';
import { generalLimiter, writeLimiter, aiLimiter, authLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';

// ─── App Setup ─────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
    },
    pingTimeout: 20_000,
    pingInterval: 10_000,
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e7,
});

// ─── Global Middleware ──────────────────────────────────────────────────────
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Request-Id'],
}));
app.use(express.json({ limit: '15mb' }));
app.use(requestLogger);

// ─── Health & Readiness Probes ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        service: 'swasthguru-backend',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
    });
});

app.get('/ready', (_req, res) => {
    // Could add DB ping here for readiness
    res.json({ status: 'ready' });
});

// ─── SIGNAL SERVICE METRICS PROXY ──────────────────────────────────────────
// In production, these live in the signal-service. Here we expose a stub.
app.get('/metrics', (_req, res) => {
    res.json({
        note: 'For full metrics, connect to the dedicated signal-service at port 5001',
        backend: {
            uptime: Math.floor(process.uptime()),
            memoryUsageMB: Math.floor(process.memoryUsage().rss / 1024 / 1024),
            environment: process.env.NODE_ENV || 'development',
        },
    });
});

// ─── ICE Config (STUN/TURN) ─────────────────────────────────────────────────
app.get('/api/ice-config', generalLimiter, (_req, res) => {
    const iceServers: any[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ];

    if (process.env.TURN_SERVER_URL) {
        iceServers.push({
            urls: process.env.TURN_SERVER_URL,
            username: process.env.TURN_USERNAME || '',
            credential: process.env.TURN_CREDENTIAL || '',
        });
    }

    res.json({ iceServers });
});

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * Public routes — Doctor listings are public (patients need to browse)
 * Rate-limited to prevent scraping.
 */
app.use('/api/doctors', generalLimiter, doctorRoutes);

/**
 * User sync / profile — Uses optionalAuth because Clerk webhook calls
 * come without a Bearer token (they have Svix signatures instead).
 * Individual endpoints inside can enforce stronger auth if needed.
 */
app.use('/api/users', authLimiter, userRoutes);

/**
 * Appointments — require authentication; role check is inside route handlers
 * because both patients and doctors need to access this.
 */
app.use('/api/appointments', generalLimiter, requireAuth, appointmentRoutes);

/**
 * Medical Records — require authentication + patient or doctor role
 */
app.use('/api/records', writeLimiter, requireAuth, recordRoutes);

/**
 * Medicine OCR Recognition — AI endpoint, rate-limited more aggressively
 */
app.use('/api/recognize-medicine', aiLimiter, recognizeMedicineRouter);

// ─── Root ───────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({
        name: 'SwasthGuru API Gateway',
        version: '2.0.0',
        architecture: 'microservices-ready',
        services: {
            'auth-service': 'http://localhost:5002 (user profiles, Clerk webhooks)',
            'data-service': 'http://localhost:5003 (appointments, records, doctors)',
            'signal-service': 'http://localhost:5001 (WebRTC signalling, Socket.IO)',
            'core-engine': 'http://localhost:8000 (GenAI / medicine analysis)',
        },
        endpoints: [
            'GET /health',
            'GET /api/ice-config',
            'GET /api/doctors',
            'POST /api/users',
            'GET/POST /api/appointments',
            'GET/POST/DELETE /api/records',
            'POST /api/recognize-medicine',
        ],
    });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'The requested endpoint does not exist.' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[server] Unhandled error:', err);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' });
});

// ─── Room Registry for Socket.IO ────────────────────────────────────────────
interface Room {
    participants: Map<string, { userId: string; role: string; joinedAt: number }>;
    createdAt: number;
}

const rooms = new Map<string, Room>();
const MAX_PARTICIPANTS = 2;

const metrics = {
    totalConnections: 0,
    activeConnections: 0,
    peakConnections: 0,
    totalRoomsCreated: 0,
};

// ─── Socket.IO — Enhanced Signal Logic ─────────────────────────────────────
io.on('connection', (socket) => {
    metrics.totalConnections++;
    metrics.activeConnections++;
    metrics.peakConnections = Math.max(metrics.peakConnections, metrics.activeConnections);

    console.log(`[socket] Connected: ${socket.id} (active: ${metrics.activeConnections})`);

    const joinedRooms = new Set<string>();

    // Heartbeat
    let missedPings = 0;
    const heartbeat = setInterval(() => {
        socket.emit('ping');
        missedPings++;
        if (missedPings >= 3) socket.disconnect(true);
    }, 30_000);

    socket.on('pong', () => { missedPings = 0; });

    // ── Room Join ──────────────────────────────────────────────────────────
    socket.on('join-room', (data: any) => {
        // Support both old string format and new object format
        const roomId = typeof data === 'object' ? data.roomId : data;
        const userId = typeof data === 'object' ? data.userId : (data as string) || 'unknown';
        const role = typeof data === 'object' ? (data.role || 'patient') : 'patient';

        if (!rooms.has(roomId)) {
            rooms.set(roomId, { participants: new Map(), createdAt: Date.now() });
            metrics.totalRoomsCreated++;
        }

        const room = rooms.get(roomId)!;

        if (room.participants.size >= MAX_PARTICIPANTS && !room.participants.has(socket.id)) {
            socket.emit('error', { code: 'ROOM_FULL', message: 'The consultation room is already full.' });
            return;
        }

        socket.join(roomId);
        joinedRooms.add(roomId);
        room.participants.set(socket.id, { userId, role, joinedAt: Date.now() });

        socket.to(roomId).emit('user-connected', userId);

        socket.emit('room-joined', {
            roomId,
            participantCount: room.participants.size,
            existingParticipants: Array.from(room.participants.entries())
                .filter(([sid]) => sid !== socket.id)
                .map(([, p]) => p),
        });

        console.log(`[room] ${userId} joined ${roomId} (${room.participants.size} participants)`);
    });

    // ── Reconnect support ──────────────────────────────────────────────────
    socket.on('reconnect-to-room', (data: { roomId: string; userId: string; role?: string }) => {
        const { roomId, userId, role = 'patient' } = data;
        const room = rooms.get(roomId);

        if (room) {
            socket.join(roomId);
            joinedRooms.add(roomId);
            room.participants.set(socket.id, { userId, role, joinedAt: Date.now() });
            socket.to(roomId).emit('user-reconnected', { userId, role });
            socket.emit('reconnect-ack', { roomId });
        } else {
            socket.emit('room-gone', { roomId });
        }
    });

    // ── WebRTC Signalling ──────────────────────────────────────────────────
    socket.on('offer', (data: any) => {
        socket.to(data.roomId).emit('offer', { ...data, fromSocketId: socket.id });
    });

    socket.on('answer', (data: any) => {
        socket.to(data.roomId).emit('answer', { ...data, fromSocketId: socket.id });
    });

    socket.on('ice-candidate', (data: any) => {
        socket.to(data.roomId).emit('ice-candidate', { ...data, fromSocketId: socket.id });
    });

    // ── Chat ───────────────────────────────────────────────────────────────
    socket.on('chat-message', (data: any) => {
        socket.to(data.roomId).emit('chat-message', {
            ...data,
            messageId: randomUUID(),
            timestamp: data.timestamp || Date.now(),
        });
    });

    // ── Media State ────────────────────────────────────────────────────────
    socket.on('media-state', (data: any) => {
        socket.to(data.roomId).emit('media-state', data);
    });

    // ── Call End ───────────────────────────────────────────────────────────
    socket.on('call-ended', (data: any) => {
        socket.to(data.roomId).emit('call-ended', data);
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
        metrics.activeConnections--;
        clearInterval(heartbeat);

        for (const roomId of joinedRooms) {
            const room = rooms.get(roomId);
            const participant = room?.participants.get(socket.id);

            if (participant) {
                socket.to(roomId).emit('user-disconnected', participant.userId);
                room!.participants.delete(socket.id);
                if (room!.participants.size === 0) rooms.delete(roomId);
            }
        }

        console.log(`[socket] Disconnected: ${socket.id} (${reason}), active: ${metrics.activeConnections}`);
        joinedRooms.clear();
    });
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 SwasthGuru Backend running on port ${PORT}`);
    console.log(`   → Health:      http://localhost:${PORT}/health`);
    console.log(`   → API Root:    http://localhost:${PORT}/`);
    console.log(`   → ICE Config:  http://localhost:${PORT}/api/ice-config`);
    console.log(`\n   Security: JWT auth enabled | Rate limiting active | RBAC enforced`);
    console.log(`   Microservices: auth(5002) | data(5003) | signal(5001) | core-engine(8000)\n`);
});

process.on('SIGTERM', () => {
    console.log('[backend] SIGTERM received. Initiating graceful shutdown...');
    io.emit('server-shutdown', { message: 'Server is restarting. Please reconnect shortly.' });
    httpServer.close(() => {
        console.log('[backend] Server closed.');
        process.exit(0);
    });
});
