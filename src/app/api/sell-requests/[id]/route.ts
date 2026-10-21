import { NextRequest } from 'next/server';
import { dataStore } from '@/backend/repositories/data-store';
import { successResponse } from '@/backend/utils/api-response';
import { handleApiError, ApiError } from '@/backend/utils/api-error';
import { requireAdmin } from '@/backend/auth';
import { enumField, readJsonObject, resourceId, sellStatuses } from '@/backend/utils/validation';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const body = await readJsonObject(request);
    const updated = await dataStore.updateSellRequestStatus(resourceId(id), enumField(body.status, sellStatuses, 'sell request status'));
    if (!updated) throw ApiError.notFound('Sell request not found');
    return successResponse(updated, { message: 'Sell request status updated' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const deleted = await dataStore.deleteSellRequest(resourceId(id));
    if (!deleted) throw ApiError.notFound('Sell request not found');
    return successResponse({ deletedId: id }, { message: 'Sell request deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
