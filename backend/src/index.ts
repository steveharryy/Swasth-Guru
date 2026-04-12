import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import doctorRoutes from './routes/doctors';

import userRoutes from './routes/users';
import appointmentRoutes from './routes/appointments';
import recordRoutes from './routes/records';
import recognizeMedicineRouter from './routes/recognizeMedicine';

dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for dev, restrict in prod
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: true, // Echoes back the request origin - perfect for dev + prod
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

app.use('/api/doctors', doctorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/recognize-medicine', recognizeMedicineRouter);

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId, userId) => {
        console.log(`User ${userId} joined room ${roomId}`);
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected from room ${roomId}`);
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });

    // Signaling events
    socket.on('offer', (data) => {
        socket.to(data.roomId).emit('offer', data);
    });

    socket.on('answer', (data) => {
        socket.to(data.roomId).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.roomId).emit('ice-candidate', data);
    });
    
    socket.on('chat-message', (data) => {
        socket.to(data.roomId).emit('chat-message', data);
    });

    socket.on('call-ended', (data) => {
        socket.to(data.roomId).emit('call-ended', data);
    });
});


const PORT = process.env.PORT || 8888;

httpServer.listen(Number(PORT), '0.0.0.0', () => console.log(`Server running on port ${PORT} (IPv4)`));
