import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_SECONDS, assertSameOrigin, checkLoginRateLimit, clearLoginFailures, createAdminSession, isAdminAuthenticated, recordLoginFailure, verifyAdminPassword } from '@/backend/auth';
import { handleApiError } from '@/backend/utils/api-error';
import { readJsonObject, textField } from '@/backend/utils/validation';

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdminAuthenticated(request) }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const key = checkLoginRateLimit(request);
    const body = await readJsonObject(request);
    const password = textField(body, 'password', { max: 1024 });
    if (!verifyAdminPassword(password)) {
      recordLoginFailure(key);
      return NextResponse.json({ success: false, message: 'Invalid administrative password' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    clearLoginFailures(key);
    const response = NextResponse.json({ success: true, message: 'Authentication successful' }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(ADMIN_COOKIE, createAdminSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: SESSION_SECONDS });
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
