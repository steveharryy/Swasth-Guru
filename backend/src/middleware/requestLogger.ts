/**
 * Structured Request Logger Middleware
 * Outputs JSON-structured logs for each request, compatible with GCP Cloud Logging format.
 * Includes request ID, latency, status code, user ID, and method/path.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const requestId = randomUUID();
    const startTime = Date.now();

    // Attach request ID for tracing
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    // Log response on finish
    res.on('finish', () => {
        const latencyMs = Date.now() - startTime;
        const logEntry = {
            severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO',
            timestamp: new Date().toISOString(),
            requestId,
            httpRequest: {
                requestMethod: req.method,
                requestUrl: req.originalUrl,
                status: res.statusCode,
                userAgent: req.headers['user-agent'],
                remoteIp: req.ip,
                latencyMs,
            },
            userId: req.user?.userId,
            userRole: req.user?.role,
            labels: {
                service: process.env.SERVICE_NAME || 'swasthguru-backend',
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
            },
        };

        // In production, this would go to Cloud Logging; in dev, pretty-print
        if (process.env.NODE_ENV === 'production') {
            process.stdout.write(JSON.stringify(logEntry) + '\n');
        } else {
            const statusColor = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
            console.log(
                `${statusColor}[${res.statusCode}]\x1b[0m ${req.method} ${req.originalUrl} — ${latencyMs}ms ${
                    req.user ? `(${req.user.role}: ${req.user.userId.slice(0, 8)}...)` : '(anon)'
                }`
            );
        }
    });

    next();
}
