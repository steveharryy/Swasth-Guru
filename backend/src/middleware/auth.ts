/**
 * JWT Authentication Middleware
 * Verifies Clerk-issued JWTs and attaches the decoded user payload to req.user
 * Uses the JWKS endpoint of the Clerk instance for key verification.
 */

import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
// Derive the Clerk frontend API domain from the publishable key
// e.g. pk_test_Y3Jpc3...$  -> decode base64 after pk_test_ prefix
function getClerkIssuer(): string {
    try {
        // Clerk publishable key encodes the frontend API hostname in base64
        const raw = CLERK_PUBLISHABLE_KEY.split('_')[2]?.replace(/\$+$/, '');
        if (!raw) throw new Error('Cannot parse Clerk key');
        const decoded = Buffer.from(raw, 'base64').toString('utf-8').replace(/\s+$/, '');
        return `https://${decoded}`;
    } catch {
        // Fallback: use hardcoded domain if key is unavailable
        return process.env.CLERK_ISSUER || 'https://crisp-stag-10.clerk.accounts.dev';
    }
}

const JWKS_URL = `${getClerkIssuer()}/.well-known/jwks.json`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export interface AuthenticatedUser {
    userId: string;       // Clerk user ID (sub)
    role: 'patient' | 'doctor' | 'admin';
    email?: string;
    sessionId?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

/**
 * Extracts the role from Clerk JWT public metadata claim
 */
function extractRole(payload: JWTPayload): 'patient' | 'doctor' | 'admin' {
    // Clerk puts custom claims in publicMetadata under the JWT
    const meta = (payload as any)?.public_metadata || (payload as any)?.metadata || {};
    const role = meta?.role || (payload as any)?.role;
    if (role === 'doctor') return 'doctor';
    if (role === 'admin') return 'admin';
    return 'patient'; // default
}

/**
 * requireAuth — mandatory authentication
 * Rejects requests without a valid Bearer token.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            if (process.env.NODE_ENV !== 'production') {
                // In local development, bypass token check and extract user from request parameters if available
                // Use optional chaining — req.body is undefined on GET requests
                const clerkId = req.params.clerkId || req.body?.patientId || req.body?.doctorId || 'dev_mock_user';
                const role = req.path.includes('doctor') ? 'doctor' : 'patient';
                req.user = {
                    userId: clerkId,
                    role: role as any,
                    email: 'dev@example.com',
                };
                return next();
            }
            res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' });
            return;
        }

        const token = authHeader.slice(7);

        const { payload } = await jwtVerify(token, JWKS, {
            issuer: getClerkIssuer(),
        });

        req.user = {
            userId: payload.sub as string,
            role: extractRole(payload),
            email: (payload as any)?.email,
            sessionId: (payload as any)?.sid,
        };

        next();
    } catch (err: any) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[auth] JWT verification failed in dev, bypassing:', err.message);
            const clerkId = req.params.clerkId || req.body?.patientId || req.body?.doctorId || 'dev_mock_user';
            const role = req.path.includes('doctor') ? 'doctor' : 'patient';
            req.user = {
                userId: clerkId,
                role: role as any,
                email: 'dev@example.com',
            };
            return next();
        }
        console.error('[auth] JWT verification failed:', err.code || err.message);
        res.status(401).json({
            error: 'INVALID_TOKEN',
            message: 'Token expired or invalid. Please sign in again.',
        });
    }
}

/**
 * optionalAuth — attaches user if token present, proceeds regardless
 * Useful for public routes that can optionally show user-specific data.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const { payload } = await jwtVerify(token, JWKS, {
                issuer: getClerkIssuer(),
            });
            req.user = {
                userId: payload.sub as string,
                role: extractRole(payload),
                email: (payload as any)?.email,
                sessionId: (payload as any)?.sid,
            };
        } else if (process.env.NODE_ENV !== 'production') {
            req.user = {
                userId: 'dev_mock_user',
                role: 'patient',
                email: 'dev@example.com',
            };
        }
    } catch {
        if (process.env.NODE_ENV !== 'production') {
            req.user = {
                userId: 'dev_mock_user',
                role: 'patient',
                email: 'dev@example.com',
            };
        }
    }
    next();
}
