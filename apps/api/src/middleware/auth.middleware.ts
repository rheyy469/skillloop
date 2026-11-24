import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { repository } from '../lib/repository.js';
import { AppError } from '../utils/errors.js';
import { UserRecord } from '../lib/store.js';
import { getSessionSecret } from '../config/env.js';

export const SESSION_COOKIE_NAME = 'skillloop_sid';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
      sessionTokenHash?: string;
    }
  }
}

export function hashSessionToken(rawToken: string): string {
  const secret = getSessionSecret();
  return crypto.createHmac('sha256', secret).update(rawToken).digest('hex');
}

function isHttpsRequest(req?: Request): boolean {
  if (!req) return process.env.COOKIE_SECURE === 'true';
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  return Boolean(req.secure || proto === 'https' || process.env.COOKIE_SECURE === 'true');
}

function resolveCookieSecurity(req?: Request): {
  secure: boolean;
  sameSite: 'lax' | 'none' | 'strict';
} {
  const https = isHttpsRequest(req);
  const envSameSite = (process.env.COOKIE_SAME_SITE || 'auto').trim().toLowerCase();

  if (envSameSite === 'none') {
    return { secure: true, sameSite: 'none' };
  }
  if (envSameSite === 'strict') {
    return { secure: https, sameSite: 'strict' };
  }
  if (envSameSite === 'lax') {
    return { secure: https, sameSite: 'lax' };
  }

  // Auto mode: cross-origin HTTPS in production (Vercel <-> Railway) requires SameSite=None + Secure
  if (process.env.NODE_ENV === 'production' && https) {
    return { secure: true, sameSite: 'none' };
  }
  return { secure: https, sameSite: 'lax' };
}

export async function issueSessionCookie(
  res: Response,
  userId: string,
  req?: Request
): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await repository.createAuthSession({
    userId,
    tokenHash,
    expiresAt
  });

  const { secure, sameSite } = resolveCookieSecurity(req);
  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure,
    sameSite,
    expires: expiresAt,
    path: '/'
  });

  return rawToken;
}

export function clearSessionCookie(res: Response, req?: Request): void {
  const { secure, sameSite } = resolveCookieSecurity(req);
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite,
    path: '/'
  });
}

function extractSessionToken(req: Request): string | null {
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (cookieToken && typeof cookieToken === 'string') {
    return cookieToken;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && /^Bearer\s+/i.test(authHeader)) {
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (bearerToken) return bearerToken;
  }
  return null;
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawToken = extractSessionToken(req);
    if (!rawToken) {
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'Silakan login terlebih dahulu untuk mengakses fitur ini.'
      );
    }

    const tokenHash = hashSessionToken(rawToken);
    const valid = await repository.findValidSession(tokenHash);
    if (!valid) {
      throw new AppError(
        401,
        'SESSION_EXPIRED',
        'Sesi kamu telah berakhir atau tidak valid. Silakan login kembali.'
      );
    }

    req.user = valid.user;
    req.sessionTokenHash = tokenHash;
    next();
  } catch (err) {
    next(err);
  }
}
