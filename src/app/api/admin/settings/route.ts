import { NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { dataStore } from '@/backend/repositories/data-store';
import { requireAdmin } from '@/backend/auth';
import { ApiError, handleApiError } from '@/backend/utils/api-error';
import { successResponse } from '@/backend/utils/api-response';
import { isValidEmail, isValidPhone, readJsonObject, textField } from '@/backend/utils/validation';
import type { DealershipSettings } from '@/types';
import { validateSiteContent } from '@/backend/utils/site-content-validation';

export async function GET() {
  try {
    return successResponse(await dataStore.getSettings());
  } catch (error) { return handleApiError(error); }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await readJsonObject(request, 512 * 1024);
    const updates: Partial<DealershipSettings> = {};
    const keys = ['dealershipName', 'tagline', 'phone', 'whatsapp', 'email', 'address', 'workingHours', 'announcement', 'currency', 'heroHeadline', 'heroSubheadline'] as const;
    for (const key of keys) {
      if (key in body) updates[key] = textField(body, key, { max: key === 'heroSubheadline' ? 2000 : 500, optional: !['dealershipName', 'phone', 'whatsapp', 'email', 'currency'].includes(key) });
    }
    if ('websiteContent' in body) updates.websiteContent = validateSiteContent(body.websiteContent);
    if (!Object.keys(updates).length) throw ApiError.badRequest('Provide at least one valid dealership setting');
    if (updates.email && !isValidEmail(updates.email)) throw ApiError.badRequest('Invalid dealership email address');
    if (updates.phone && !isValidPhone(updates.phone)) throw ApiError.badRequest('Invalid dealership phone number');
    if (updates.whatsapp && !isValidPhone(updates.whatsapp)) throw ApiError.badRequest('Invalid WhatsApp phone number');
    if (updates.currency && updates.currency !== 'PKR') throw ApiError.badRequest('Dealership prices are recorded in PKR');
    const updated = await dataStore.updateSettings(updates);
    try { revalidateTag('themes', { expire: 0 }); revalidateTag('site-content', { expire: 0 }); revalidatePath('/', 'layout'); } catch {}
    return successResponse(updated, { message: 'Dealership settings updated successfully' });
  } catch (error) { return handleApiError(error); }
}
