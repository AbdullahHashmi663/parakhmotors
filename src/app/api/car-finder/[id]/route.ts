import { NextRequest } from 'next/server';
import { dataStore } from '@/backend/repositories/data-store';
import { successResponse } from '@/backend/utils/api-response';
import { handleApiError, ApiError } from '@/backend/utils/api-error';
import { requireAdmin } from '@/backend/auth';
import { enumField, findStatuses, readJsonObject, resourceId } from '@/backend/utils/validation';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    const body = await readJsonObject(request);
    const updated = await dataStore.updateFindRequestStatus(resourceId(id), enumField(body.status, findStatuses, 'car finder request status'));
    if (!updated) throw ApiError.notFound('Find request not found');
    return successResponse(updated, { message: 'Car finder request status updated' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    const deleted = await dataStore.deleteFindRequest(resourceId(id));
    if (!deleted) throw ApiError.notFound('Find request not found');
    return successResponse({ deletedId: id }, { message: 'Car finder request deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
