import { NextResponse } from 'next/server';
import type { ApiResponse, ApiErrorResponse } from '@/types';

export function successResponse<T>(
  data: T,
  options?: {
    message?: string;
    status?: number;
    meta?: Record<string, unknown>;
  }
): NextResponse<ApiResponse<T>> {
  const { message, status = 200, meta } = options || {};

  const payload: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    data,
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function errorResponse(
  message: string,
  options?: {
    status?: number;
    code?: string;
    details?: unknown;
  }
): NextResponse<ApiErrorResponse> {
  const { status = 400, code, details } = options || {};

  const payload: ApiErrorResponse = {
    success: false,
    error: {
      message,
      ...(code ? { code } : {}),
      ...(details ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
}
