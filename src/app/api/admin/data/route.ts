import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/backend/repositories/data-store';
import { getDatabaseHealth } from '@/backend/database';
import { requireAdmin } from '@/backend/auth';
import { ApiError, handleApiError } from '@/backend/utils/api-error';
import { readJsonObject } from '@/backend/utils/validation';

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const allData = await dataStore.getAllData();
    const health = await getDatabaseHealth();
    return NextResponse.json({ success: true, data: allData, status: { has_db_url: health.configured, db_connected: health.connected, source: health.source } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await readJsonObject(request);
    if (body.action !== 'reset_defaults') throw ApiError.badRequest('Invalid action parameter');
    const resetData = await dataStore.resetToDefaults();
    return NextResponse.json({ success: true, message: 'Default themes and dealership settings restored. Inventory and customer requests were preserved.', data: resetData }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error); }
}
