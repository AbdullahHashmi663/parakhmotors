import { ApiError } from './api-error';

export async function readJsonObject(request: Request, maxBytes = 64 * 1024): Promise<Record<string, unknown>> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 1024 * 1024) throw new RangeError('Invalid JSON request size limit');
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw ApiError.badRequest('Use application/json for this request');
  }
  if (Number(request.headers.get('content-length')) > maxBytes) {
    throw new ApiError('Request body is too large', 413, 'PAYLOAD_TOO_LARGE');
  }
  const reader = request.body?.getReader();
  if (!reader) throw ApiError.badRequest('A JSON body is required');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new ApiError('Request body is too large', 413, 'PAYLOAD_TOO_LARGE');
    }
    chunks.push(value);
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw ApiError.badRequest('The request body must be a JSON object');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.badRequest('The request body contains invalid JSON');
  }
}

export function textField(body: Record<string, unknown>, key: string, options: { optional?: boolean; max?: number; min?: number } = {}): string {
  const value = body[key];
  if (options.optional && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) return '';
  if (typeof value !== 'string') throw ApiError.badRequest(`${key} must be text`);
  const clean = value.trim();
  if (clean.length < (options.min ?? 1) || clean.length > (options.max ?? 200)) {
    throw ApiError.badRequest(`${key} must contain ${options.min ?? 1}–${options.max ?? 200} characters`);
  }
  return clean;
}

export function numberField(body: Record<string, unknown>, key: string, min = 0, max = Number.MAX_SAFE_INTEGER, integer = false): number {
  const value = body[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw ApiError.badRequest(`${key} must be a valid ${integer ? 'whole ' : ''}number between ${min} and ${max}`);
  }
  return value;
}

export function enumField<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw ApiError.badRequest(`Invalid ${label}. Choose ${allowed.join(', ')}`);
  }
  return value as T;
}

export function contactFields(body: Record<string, unknown>, nameKey: string) {
  const name = textField(body, nameKey, { max: 120 });
  const email = textField(body, 'email', { optional: true, max: 254 }).toLowerCase();
  const phone = textField(body, 'phone', { max: 30 });
  if (email && !isValidEmail(email)) throw ApiError.badRequest('Invalid email address');
  if (!isValidPhone(phone)) throw ApiError.badRequest('Invalid phone number');
  return { name, email, phone };
}

export function resourceId(id: string): string {
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(id)) throw ApiError.badRequest('Invalid resource ID');
  return id;
}

export const inspectionStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const;
export const inquiryStatuses = ['new', 'in_review', 'contacted', 'resolved'] as const;
export const sellStatuses = ['received', 'valuation_provided', 'inspection_scheduled', 'listed'] as const;
export const findStatuses = ['active', 'options_found', 'fulfilled', 'closed'] as const;

export function assertRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter((f) => {
    const val = body[f];
    return val === undefined || val === null || val === '';
  });

  if (missing.length > 0) {
    throw ApiError.badRequest(`Missing required fields: ${missing.join(', ')}`, {
      missingFields: missing,
    });
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Accepts standard international and local Pakistani numbers (+923... or 03...)
  const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}$/;
  return typeof phone === 'string' && phoneRegex.test(phone.trim()) && phone.replace(/\D/g, '').length >= 10 && phone.replace(/\D/g, '').length <= 15;
}
