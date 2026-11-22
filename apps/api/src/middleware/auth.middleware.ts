import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { repository } from '../lib/repository.js';
import { AppError } from '../utils/errors.js';
import { UserRecord } from '../lib/store.js';

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
  const secret = process.env.SESSION_SECRET || 'skillloop-default-dev-secret';
  return crypto.createHmac('sha256', secret).update(rawToken).digest('hex');
}

function isHttpsRequest(req?: Request): boolean {
  if (!req) return process.env.COOKIE_SECURE === 'true';
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto;
  return Boolean(req.secure || proto === 'https' || process.env.COOKIE_SECURE === 'true');
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

  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: isHttpsRequest(req),
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  });

  return rawToken;
}

export function clearSessionCookie(res: Response, req?: Request): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttpsRequest(req),
    sameSite: 'lax',
    path: '/'
  });
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (!rawToken || typeof rawToken !== 'string') {
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
