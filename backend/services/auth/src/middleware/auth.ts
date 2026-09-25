// Request authentication shared by the backend services (each service has its
// own copy because images are built per service; keep them identical).
//
//  - requireUser:     a valid access token (refresh tokens are rejected)
//  - requireAdmin:    a valid access token whose role is "admin"
//  - requireInternal: a service-to-service call carrying INTERNAL_API_TOKEN
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthClaims {
  userId: string;
  email?: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

const DEV_ONLY_SECRET = 'local-development-only-secret';

/** The JWT signing secret. Missing in production is a fatal misconfiguration. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return DEV_ONLY_SECRET;
}

export function readAuth(req: Request): AuthClaims | null {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as jwt.JwtPayload;
    // Only plain access tokens: refresh and password-change tokens carry a `type`.
    if (decoded.type || typeof decoded.userId !== 'string') return null;
    return { userId: decoded.userId, email: decoded.email, role: decoded.role ?? 'customer' };
  } catch {
    return null;
  }
}

export function requireUser(req: Request, res: Response, next: NextFunction): void {
  const auth = readAuth(req);
  if (!auth) {
    res.status(401).json({ success: false, error: 'Not logged in' });
    return;
  }
  req.auth = auth;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = readAuth(req);
  if (!auth) {
    res.status(401).json({ success: false, error: 'Not logged in' });
    return;
  }
  if (auth.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  req.auth = auth;
  next();
}

/** True when the request carries the shared service-to-service token. */
export function hasInternalToken(req: Request): boolean {
  const expected = process.env.INTERNAL_API_TOKEN;
  const provided = req.header('x-internal-token');
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function requireInternal(req: Request, res: Response, next: NextFunction): void {
  if (!hasInternalToken(req)) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }
  next();
}
