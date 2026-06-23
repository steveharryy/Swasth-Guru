/**
 * Role-Based Access Control (RBAC) Middleware
 * Guards routes based on user roles extracted by the auth middleware.
 * Must be used AFTER requireAuth.
 */

import { Request, Response, NextFunction } from 'express';

type Role = 'patient' | 'doctor' | 'admin';

/**
 * requireRole — allows only the specified roles
 * @param roles - Array of permitted roles
 * @example router.get('/patient-data', requireAuth, requireRole(['patient', 'admin']), handler)
 */
export function requireRole(roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: 'FORBIDDEN',
                message: `Access denied. Required role: [${roles.join(' | ')}]. Your role: ${req.user.role}`,
            });
            return;
        }

        next();
    };
}

/**
 * requireSelf — ensures the user can only access their OWN data.
 * Compares req.user.userId with a URL param or body field.
 * Admin users bypass this check.
 *
 * @param userIdParam - The route parameter name containing the user's clerkId (default: 'clerkId')
 */
export function requireSelf(userIdParam: string = 'clerkId') {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
            return;
        }

        // Admins can access any user's data
        if (req.user.role === 'admin') {
            next();
            return;
        }

        const paramId = req.params[userIdParam] || req.body[userIdParam] || req.query[userIdParam];

        if (paramId && paramId !== req.user.userId) {
            res.status(403).json({
                error: 'FORBIDDEN',
                message: 'You are not authorized to access another user\'s data.',
            });
            return;
        }

        next();
    };
}

/**
 * requireAny — passes if the user has ANY of the roles listed.
 * Alias of requireRole for readability.
 */
export const requireAny = requireRole;

/**
 * requireAdmin — shorthand for requireRole(['admin'])
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    requireRole(['admin'])(req, res, next);
}
