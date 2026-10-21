import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_SECONDS, assertSameOrigin, checkLoginRateLimit, clearLoginFailures, createAdminSession, isAdminAuthenticated, recordLoginFailure, assertAdminConfigured } from '@/backend/auth';
import { checkPersistentAuthLimit, consumeAdminCode, requestAdminCode, verifyAdminCredentials } from '@/backend/admin-accounts';
import { ApiError } from '@/backend/utils/api-error';
import { handleApiError } from '@/backend/utils/api-error';
import { readJsonObject, textField } from '@/backend/utils/validation';

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: await isAdminAuthenticated(request) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    assertAdminConfigured();
    const key = checkLoginRateLimit(request);
    const body = await readJsonObject(request, 4096);
    const username = textField(body, 'username', { max: 120 }).toLowerCase();
    const action = body.action || 'password';
    if (!['password', 'request_code', 'verify_code', 'reset_password'].includes(String(action))) throw ApiError.badRequest('Invalid sign-in action');
    if (action === 'request_code') {
      const purpose = body.purpose;
      if (purpose !== 'login' && purpose !== 'password_reset') throw ApiError.badRequest('Invalid code purpose');
      await checkPersistentAuthLimit('email-request-client', key, 10);
      await checkPersistentAuthLimit('email-request-account', username, 5);
      const challengeId = await requestAdminCode(username, purpose);
      return NextResponse.json({ success: true, challengeId, message: 'If the username matches an account, a code has been sent to its registered email.' }, { headers: { 'Cache-Control': 'no-store' } });
    }
    await checkPersistentAuthLimit('sign-in-client', key, 30);
    await checkPersistentAuthLimit('sign-in-account', username, 15);
    let account;
    if (action === 'password') {
      if (typeof body.password !== 'string' || !body.password.length || body.password.length > 1024) throw ApiError.badRequest('Enter your password');
      account = await verifyAdminCredentials(username, body.password);
    } else {
      const id = textField(body, 'challengeId', { max: 36 });
      const code = textField(body, 'code', { max: 8 });
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || !/^\d{8}$/.test(code)) throw ApiError.badRequest('Enter the eight-digit code from your email');
      if (action === 'reset_password') {
        if (typeof body.newPassword !== 'string' || body.newPassword.length < 12 || body.newPassword.length > 128) throw ApiError.badRequest('Choose a new password between 12 and 128 characters');
        if (body.newPassword !== body.confirmPassword) throw ApiError.badRequest('The new passwords do not match');
      }
      account = await consumeAdminCode(username, id, code, action === 'reset_password' ? 'password_reset' : 'login', action === 'reset_password' ? body.newPassword as string : undefined);
    }
    if (!account) {
      recordLoginFailure(key);
      return NextResponse.json({ success: false, message: action === 'password' ? 'The username or password was not recognised.' : 'The code is invalid or expired. Please request a new code.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    clearLoginFailures(key);
    const reset = action === 'reset_password';
    const response = NextResponse.json({ success: true, message: reset ? 'Password updated. Sign in with your new password.' : 'Authentication successful' }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(ADMIN_COOKIE, reset ? '' : createAdminSession(account), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: reset ? 0 : SESSION_SECONDS });
    return response;
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
    return response;
  } catch (error) { return handleApiError(error); }
}
