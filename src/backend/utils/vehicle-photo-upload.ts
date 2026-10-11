import { ApiError } from './api-error';
import { processVehiclePhoto, type ProcessedSellPhoto } from './sell-photo-upload';

export const MAX_VEHICLE_PHOTOS = 20;
const MAX_BODY_BYTES = 32 * 1024 * 1024;

export async function readVehicleSubmission(request: Request): Promise<{ details: Record<string, unknown>; photos: ProcessedSellPhoto[] }> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^multipart\/form-data\s*;/i.test(contentType)) throw ApiError.badRequest('Use a photo upload form for this request');
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new ApiError('Photo upload is too large. Upload fewer photos at a time.', 413, 'PAYLOAD_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) throw ApiError.badRequest('Vehicle details are required');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new ApiError('Photo upload is too large. Upload fewer photos at a time.', 413, 'PAYLOAD_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  let form: FormData;
  try {
    form = await new Request(request.url, { method: 'POST', headers: { 'Content-Type': contentType }, body: new Uint8Array(Buffer.concat(chunks)) }).formData();
  } catch {
    throw ApiError.badRequest('The vehicle form or photo uploads could not be read.');
  }
  for (const key of form.keys()) if (key !== 'details' && key !== 'photos') throw ApiError.badRequest('The vehicle form contains an unsupported field');
  const values = form.getAll('details');
  if (values.length !== 1 || typeof values[0] !== 'string' || Buffer.byteLength(values[0], 'utf8') > 64 * 1024) throw ApiError.badRequest('Vehicle details must be provided once as valid JSON');
  let details: unknown;
  try { details = JSON.parse(values[0]); } catch { throw ApiError.badRequest('Vehicle details contain invalid JSON'); }
  if (!details || typeof details !== 'object' || Array.isArray(details)) throw ApiError.badRequest('Vehicle details must be a JSON object');

  const files = form.getAll('photos');
  if (files.length > MAX_VEHICLE_PHOTOS) throw ApiError.badRequest(`Upload no more than ${MAX_VEHICLE_PHOTOS} vehicle photos`);
  const photos: ProcessedSellPhoto[] = [];
  for (const file of files) {
    if (typeof file === 'string') throw ApiError.badRequest('Photos must be image files');
    photos.push(await processVehiclePhoto(file));
  }
  return { details: details as Record<string, unknown>, photos };
}
