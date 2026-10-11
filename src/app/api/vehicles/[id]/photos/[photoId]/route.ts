import { dataStore } from '@/backend/repositories/data-store';
import { handleApiError, ApiError } from '@/backend/utils/api-error';
import { resourceId } from '@/backend/utils/validation';

export async function GET(_request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const { id, photoId } = await context.params;
    resourceId(id);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photoId)) throw ApiError.badRequest('Invalid photo ID');
    const photo = await dataStore.getVehiclePhoto(id, photoId);
    if (!photo) throw ApiError.notFound('Vehicle photo not found');
    return new Response(new Uint8Array(photo.data), {
      headers: {
        'Content-Type': photo.mimeType,
        'Content-Length': String(photo.data.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "sandbox; default-src 'none'",
        'Content-Disposition': `inline; filename="vehicle-photo-${photoId}.webp"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
