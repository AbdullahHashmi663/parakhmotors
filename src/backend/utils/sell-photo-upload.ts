import sharp from 'sharp';
import {
  MAX_SELL_PHOTOS, MAX_UPLOAD_PHOTO_BYTES, MAX_SELL_UPLOAD_BYTES, SELL_PHOTO_TYPES,
} from '@/lib/sell-photo-rules';
import { ApiError } from './api-error';
import { readJsonObject } from './validation';

export interface ProcessedSellPhoto {
  data: Buffer;
  mimeType: 'image/webp';
  width: number;
  height: number;
  size: number;
}

const MAX_DETAILS_BYTES = 64 * 1024;
const FORMAT_FOR_TYPE: Record<string, string> = {
  'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp',
};

function tooLarge(message = 'Photo upload is too large') {
  return new ApiError(message, 413, 'PAYLOAD_TOO_LARGE');
}

async function boundedMultipartBody(request: Request): Promise<Buffer> {
  if (Number(request.headers.get('content-length')) > MAX_SELL_UPLOAD_BYTES) throw tooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw ApiError.badRequest('A request body is required');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SELL_UPLOAD_BYTES) {
        await reader.cancel();
        throw tooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

function matchesSignature(data: Buffer, type: string): boolean {
  if (type === 'image/jpeg') return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  if (type === 'image/png') return data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return type === 'image/webp' && data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP';
}

function isAnimatedPng(data: Buffer): boolean {
  let offset = 8;
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    if (type === 'acTL') return true;
    if (type === 'IEND') break;
    offset += length + 12;
  }
  return false;
}

async function processPhoto(file: File, maxOriginalBytes: number, sizeLabel: string): Promise<ProcessedSellPhoto> {
  if (!(SELL_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    throw ApiError.badRequest('Upload JPG, PNG or WebP car photos');
  }
  if (!file.size) throw ApiError.badRequest('Empty photos cannot be uploaded');
  if (file.size > maxOriginalBytes) throw tooLarge(`Each uploaded photo must be ${sizeLabel} or smaller.`);
  const data = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(data, file.type)) throw ApiError.badRequest('A photo does not match its file type');
  try {
    const options = { limitInputPixels: 20_000_000, failOn: 'warning' as const };
    const metadata = await sharp(data, options).metadata();
    if (metadata.format !== FORMAT_FOR_TYPE[file.type] || !metadata.width || !metadata.height) {
      throw ApiError.badRequest('A photo does not contain a supported image');
    }
    if ((metadata.pages ?? 1) > 1 || metadata.loop !== undefined || metadata.delay !== undefined || (file.type === 'image/png' && isAnimatedPng(data))) {
      throw ApiError.badRequest('Please upload still photos instead of animated images');
    }
    // Sharp strips metadata by default. Decode again for a complete pixel validation.
    for (let scale = 1; scale >= 0.32768; scale *= 0.8) {
      const result = await sharp(data, options).autoOrient()
        .resize({ width: Math.floor(1600 * scale), height: Math.floor(1200 * scale), fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
      if (result.data.length <= MAX_UPLOAD_PHOTO_BYTES) {
        return { data: result.data, mimeType: 'image/webp', width: result.info.width, height: result.info.height, size: result.data.length };
      }
    }
    throw tooLarge('This photo could not be optimized. Please choose a smaller image.');
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.badRequest('A photo is damaged or too large to decode. Please choose another image.');
  }
}

export function processSellPhoto(file: File) {
  return processPhoto(file, MAX_UPLOAD_PHOTO_BYTES, '512 KB');
}

export function processVehiclePhoto(file: File) {
  return processPhoto(file, 5 * 1024 * 1024, '5 MB');
}

export async function readSellRequestSubmission(request: Request): Promise<{ details: Record<string, unknown>; photos: ProcessedSellPhoto[] }> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.toLowerCase().startsWith('application/json')) {
    return { details: await readJsonObject(request), photos: [] };
  }
  if (!/^multipart\/form-data\s*;/i.test(contentType)) throw ApiError.badRequest('Use JSON or a multipart photo upload for this request');
  const body = await boundedMultipartBody(request);
  let form: FormData;
  try {
    form = await new Request(request.url, { method: 'POST', headers: { 'Content-Type': contentType }, body: new Uint8Array(body) }).formData();
  } catch {
    throw ApiError.badRequest('The photo upload could not be read. Please select your photos again.');
  }
  for (const key of form.keys()) {
    if (key !== 'details' && key !== 'photos') throw ApiError.badRequest('The photo upload contains an unsupported field');
  }
  const detailsValues = form.getAll('details');
  if (detailsValues.length !== 1 || typeof detailsValues[0] !== 'string') throw ApiError.badRequest('Car details must be supplied once as JSON text');
  if (Buffer.byteLength(detailsValues[0], 'utf8') > MAX_DETAILS_BYTES) throw tooLarge('Car details are too large');
  let details: unknown;
  try { details = JSON.parse(detailsValues[0]); } catch { throw ApiError.badRequest('Car details contain invalid JSON'); }
  if (!details || typeof details !== 'object' || Array.isArray(details)) throw ApiError.badRequest('Car details must be a JSON object');
  const files = form.getAll('photos');
  if (files.length > MAX_SELL_PHOTOS) throw ApiError.badRequest(`Upload no more than ${MAX_SELL_PHOTOS} car photos`);
  const photos: ProcessedSellPhoto[] = [];
  for (const file of files) {
    if (typeof file === 'string') throw ApiError.badRequest('Photos must be image files');
    photos.push(await processSellPhoto(file));
  }
  return { details: details as Record<string, unknown>, photos };
}
