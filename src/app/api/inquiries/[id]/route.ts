import { NextRequest } from 'next/server';
import { InquiryController } from '@/backend/controllers/inquiry.controller';
import { dataStore } from '@/backend/repositories/data-store';
import { successResponse } from '@/backend/utils/api-response';
import { handleApiError, ApiError } from '@/backend/utils/api-error';
import { requireAdmin } from '@/backend/auth';
import { resourceId } from '@/backend/utils/validation';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return InquiryController.handleUpdateStatus(id, request);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    if (!id) throw ApiError.badRequest('Inquiry ID is required');
    const deleted = await dataStore.deleteInquiry(resourceId(id));
    if (!deleted) throw ApiError.notFound('Inquiry not found');
    return successResponse({ deletedId: id }, { message: 'Inquiry deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
