import { NextRequest } from 'next/server';
import { InspectionController } from '@/backend/controllers/inspection.controller';
import { dataStore } from '@/backend/repositories/data-store';
import { successResponse } from '@/backend/utils/api-response';
import { handleApiError, ApiError } from '@/backend/utils/api-error';
import { requireAdmin } from '@/backend/auth';
import { resourceId } from '@/backend/utils/validation';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return InspectionController.handleGetInspectionById(id, request);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return InspectionController.handleUpdateInspectionStatus(id, request);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!id) throw ApiError.badRequest('Inspection ID is required');
    const deleted = await dataStore.deleteInspection(resourceId(id));
    if (!deleted) throw ApiError.notFound('Inspection booking not found');
    return successResponse({ deletedId: id }, { message: 'Inspection booking deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
