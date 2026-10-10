import { NextResponse } from 'next/server';
import { errorResponse } from './api-response';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new ApiError(message, 409, 'CONFLICT');
  }

  static internal(message = 'Internal server error') {
    return new ApiError(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return errorResponse(error.message, {
      status: error.statusCode,
      code: error.code,
      details: error.details,
    });
  }

  if (error instanceof Error) {
    console.error('[API Internal Error]', error.name);
    return errorResponse('We could not complete your request. Please try again shortly.', {
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
  }

  console.error('[API Unknown Error]');
  return errorResponse('An unknown server error occurred', {
    status: 500,
    code: 'UNKNOWN_ERROR',
  });
}
