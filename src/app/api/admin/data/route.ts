import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { dataStore } from '@/backend/repositories/data-store';
import { getDatabaseHealth } from '@/backend/database';
import { requireAdmin } from '@/backend/auth';
import { ApiError, handleApiError } from '@/backend/utils/api-error';
import { readJsonObject } from '@/backend/utils/validation';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const allData = await dataStore.getAllData();
    const health = await getDatabaseHealth();
    return NextResponse.json({ success: true, data: allData, status: { has_db_url: health.configured, db_connected: health.connected, source: health.source } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await readJsonObject(request);
    if (body.action !== 'reset_defaults') throw ApiError.badRequest('Invalid action parameter');
    const resetData = await dataStore.resetToDefaults();
    try { revalidateTag('themes', { expire: 0 }); revalidatePath('/', 'layout'); } catch {}
    return NextResponse.json({ success: true, message: 'Default themes and dealership settings restored. Inventory and customer requests were preserved.', data: resetData }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error); }
}
