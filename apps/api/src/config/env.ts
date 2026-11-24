export interface ValidatedEnv {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  databaseUrl: string;
  sessionSecret: string;
  frontendOrigins: string[];
  cookieSameSite: 'lax' | 'none' | 'strict' | 'auto';
  cookieSecure: boolean;
}

const DEV_FALLBACK_SECRET = 'skillloop-default-dev-secret';
const PLACEHOLDER_SECRETS = new Set([
  DEV_FALLBACK_SECRET,
  'replace-with-a-long-random-secret-at-least-32-chars'
]);

export function parseAllowedOrigins(raw?: string): string[] {
  const source = raw || 'http://localhost:5173';
  return source
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[SkillLoop Env] SESSION_SECRET wajib diisi pada lingkungan production (minimal 32 karakter acak).'
    );
  }
  return DEV_FALLBACK_SECRET;
}

export function validateEnv(): ValidatedEnv {
  const rawNodeEnv = process.env.NODE_ENV || 'development';
  const nodeEnv: ValidatedEnv['nodeEnv'] =
    rawNodeEnv === 'production' || rawNodeEnv === 'test' ? rawNodeEnv : 'development';

  const rawPort = process.env.PORT ? Number(process.env.PORT) : 4000;
  if (!Number.isInteger(rawPort) || rawPort <= 0 || rawPort > 65535) {
    throw new Error(`[SkillLoop Env] PORT tidak valid: "${process.env.PORT}".`);
  }

  const databaseUrl = (process.env.DATABASE_URL || '').trim();
  const sessionSecret = getSessionSecret();
  const frontendOrigins = parseAllowedOrigins(process.env.FRONTEND_ORIGIN);

  const rawSameSite = (process.env.COOKIE_SAME_SITE || 'auto').trim().toLowerCase();
  const cookieSameSite: ValidatedEnv['cookieSameSite'] =
    rawSameSite === 'lax' || rawSameSite === 'none' || rawSameSite === 'strict'
      ? rawSameSite
      : 'auto';

  const cookieSecure = process.env.COOKIE_SECURE === 'true';

  if (nodeEnv === 'production') {
    const errors: string[] = [];

    if (!databaseUrl) {
      errors.push('DATABASE_URL wajib diisi di production (PostgreSQL connection string).');
    } else if (
      !databaseUrl.startsWith('postgresql://') &&
      !databaseUrl.startsWith('postgres://')
    ) {
      errors.push('DATABASE_URL harus menggunakan skema postgresql:// atau postgres://.');
    }

    if (sessionSecret.length < 32 || PLACEHOLDER_SECRETS.has(sessionSecret)) {
      errors.push(
        'SESSION_SECRET di production minimal 32 karakter acak dan tidak boleh memakai nilai placeholder.'
      );
    }

    if (errors.length > 0) {
      throw new Error(
        `[SkillLoop Env] Konfigurasi environment production belum valid:\n- ${errors.join('\n- ')}`
      );
    }

    if (
      frontendOrigins.length === 0 ||
      frontendOrigins.every((origin) => origin.includes('localhost'))
    ) {
      console.warn(
        '[SkillLoop Env] Peringatan: FRONTEND_ORIGIN di production masih mengarah ke localhost. Atur ke domain Vercel kamu agar CORS berjalan di production.'
      );
    }
  }

  return {
    nodeEnv,
    port: rawPort,
    databaseUrl,
    sessionSecret,
    frontendOrigins,
    cookieSameSite,
    cookieSecure
  };
}
