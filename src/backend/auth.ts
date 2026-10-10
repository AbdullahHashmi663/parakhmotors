import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { ApiError } from './utils/api-error';

export const ADMIN_COOKIE = 'pm_admin_session';
export const SESSION_SECONDS = 8 * 60 * 60;

function sessionKey(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!secret || secret.length < 32 || !password) return null;
  return createHmac('sha256', secret).update(password).digest('hex');
}

export function assertAdminConfigured(): void {
  if (!sessionKey()) throw new ApiError('Administrative access is not configured', 503, 'ADMIN_UNAVAILABLE');
}

export function verifyAdminPassword(password: string): boolean {
  assertAdminConfigured();
  const expected = createHash('sha256').update(process.env.ADMIN_PASSWORD!).digest();
  const supplied = createHash('sha256').update(password).digest();
  return timingSafeEqual(expected, supplied);
}

export function createAdminSession(): string {
  assertAdminConfigured();
  const payload = Buffer.from(JSON.stringify({ expires: Math.floor(Date.now() / 1000) + SESSION_SECONDS, nonce: randomBytes(24).toString('hex') })).toString('base64url');
  const signature = createHmac('sha256', sessionKey()!).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function isAdminAuthenticated(request: NextRequest): boolean {
  const key = sessionKey();
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!key || !token || token.length > 512) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  try {
    const expected = createHmac('sha256', key).update(payload).digest();
    const supplied = Buffer.from(signature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
    const data: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || typeof data !== 'object' || !('expires' in data) || !('nonce' in data)) return false;
    return typeof data.expires === 'number' && data.expires > Date.now() / 1000 && typeof data.nonce === 'string';
  } catch {
    return false;
  }
}

export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw ApiError.forbidden('Cross-site requests are not allowed');
  if (origin) {
    try {
      if (new URL(origin).origin !== request.nextUrl.origin) throw ApiError.forbidden('Cross-site requests are not allowed');
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.forbidden('Invalid request origin');
    }
  }
}

export function requireAdmin(request: NextRequest): void {
  if (!isAdminAuthenticated(request)) throw ApiError.unauthorized('Sign in to the showroom administration');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) assertSameOrigin(request);
}

type Attempts = { count: number; until: number };
declare global { var __pmLoginAttempts: Map<string, Attempts> | undefined; }
const loginAttempts = globalThis.__pmLoginAttempts ??= new Map<string, Attempts>();

export function checkLoginRateLimit(request: NextRequest): string {
  // Direct clients can forge forwarding headers. Only accept them behind a configured trusted proxy.
  const address = process.env.TRUST_PROXY === 'true'
    ? request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
    : 'shared-admin-login';
  const key = createHash('sha256').update(address).digest('hex');
  const now = Date.now();
  for (const [entry, attempts] of loginAttempts) if (attempts.until <= now) loginAttempts.delete(entry);
  if (!loginAttempts.has(key) && loginAttempts.size >= 1000) throw new ApiError('Sign-in is temporarily busy. Please try again later.', 429, 'RATE_LIMITED');
  const attempts = loginAttempts.get(key);
  if (attempts && attempts.count >= 5) throw new ApiError('Too many sign-in attempts. Please try again in 15 minutes.', 429, 'RATE_LIMITED');
  return key;
}

export function recordLoginFailure(key: string): void {
  const previous = loginAttempts.get(key);
  loginAttempts.set(key, { count: (previous?.count ?? 0) + 1, until: previous?.until ?? Date.now() + 15 * 60 * 1000 });
}

export function clearLoginFailures(key: string): void { loginAttempts.delete(key); }
