/**
 * Rate Limiter Middleware
 * In-memory token-bucket rate limiter.
 * For production, swap the in-memory store with Redis (ioredis).
 * Limits: 100 req/min per IP for general routes, 20/min for write ops.
 */

import { Request, Response, NextFunction } from 'express';

interface BucketEntry {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

// Cleanup stale buckets every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets.entries()) {
        if (entry.resetAt < now) buckets.delete(key);
    }
}, 5 * 60 * 1000);

function getKey(req: Request, suffix = ''): string {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${ip}:${suffix}`;
}

function createLimiter(options: { max: number; windowMs: number; keyPrefix: string }) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const key = getKey(req, options.keyPrefix);
        const now = Date.now();
        let entry = buckets.get(key);

        if (!entry || entry.resetAt < now) {
            entry = { count: 1, resetAt: now + options.windowMs };
            buckets.set(key, entry);
            next();
            return;
        }

        entry.count++;

        const remaining = Math.max(0, options.max - entry.count);
        res.setHeader('X-RateLimit-Limit', options.max);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

        if (entry.count > options.max) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            res.setHeader('Retry-After', retryAfter);
            res.status(429).json({
                error: 'RATE_LIMIT_EXCEEDED',
                message: `Too many requests. Retry after ${retryAfter} seconds.`,
                retryAfter,
            });
            return;
        }

        next();
    };
}

/** General API rate limiter: 120 req/min */
export const generalLimiter = createLimiter({
    max: 120,
    windowMs: 60 * 1000,
    keyPrefix: 'general',
});

/** Strict write limiter: 30 req/min (POST/PUT/PATCH/DELETE) */
export const writeLimiter = createLimiter({
    max: 30,
    windowMs: 60 * 1000,
    keyPrefix: 'write',
});

/** Auth endpoint limiter: 10 req/min (brute-force protection) */
export const authLimiter = createLimiter({
    max: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'auth',
});

/** AI/LLM endpoint limiter: 20 req/min */
export const aiLimiter = createLimiter({
    max: 20,
    windowMs: 60 * 1000,
    keyPrefix: 'ai',
});

/**
 * Dynamic rate limiter factory — create custom limits on the fly
 */
export function rateLimit(max: number, windowMs: number, keyPrefix = 'custom') {
    return createLimiter({ max, windowMs, keyPrefix });
}
