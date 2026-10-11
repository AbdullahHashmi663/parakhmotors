import { NextRequest } from 'next/server';
import { requireAdmin } from '@/backend/auth';
import { dataStore } from '@/backend/repositories/data-store';
import { ApiError, handleApiError } from '@/backend/utils/api-error';
import { resourceId } from '@/backend/utils/validation';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    requireAdmin(request);
    const { id, photoId } = await context.params;
    resourceId(id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photoId)) throw ApiError.badRequest('Invalid photo ID');
    const photo = await dataStore.getSellRequestPhoto(id, photoId);
    if (!photo) throw ApiError.notFound('Car photo not found');
    return new Response(new Uint8Array(photo.data), {
      headers: {
        'Content-Type': photo.mimeType,
        'Content-Length': String(photo.data.length),
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "sandbox; default-src 'none'",
        'Content-Disposition': `inline; filename="car-photo-${photoId}.webp"`,
        'Vary': 'Cookie',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
