import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/backend/repositories/data-store';
import { requireAdmin } from '@/backend/auth';
import { ApiError, handleApiError } from '@/backend/utils/api-error';
import { successResponse } from '@/backend/utils/api-response';
import { readJsonObject, resourceId, textField } from '@/backend/utils/validation';
import type { Theme } from '@/types';

export async function GET() {
  try {
    const themes = await dataStore.getThemes();
    const active = await dataStore.getActiveTheme();
    return NextResponse.json({ success: true, data: themes, activeTheme: active }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await readJsonObject(request);
    if (body.action === 'set_active') {
      const updated = await dataStore.setActiveTheme(resourceId(textField(body, 'themeId', { max: 120 })));
      if (!updated) throw ApiError.notFound('Theme not found');
      return successResponse(updated, { message: 'Active theme updated successfully' });
    }
    if (body.action === 'save_theme') {
      const raw = body.theme;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw ApiError.badRequest('A valid theme object is required');
      const input = raw as Record<string, unknown>;
      const theme: Theme = { id: resourceId(textField(input, 'id', { max: 120 })), name: textField(input, 'name', { max: 120 }), category: textField(input, 'category', { max: 120 }), description: textField(input, 'description', { optional: true, max: 1000 }), background: '', foreground: '', card_bg: '', border_color: '', primary: '', accent: '', glow_color: '', is_active: input.is_active === true };
      if (input.is_active !== undefined && typeof input.is_active !== 'boolean') throw ApiError.badRequest('is_active must be true or false');
      for (const key of ['background', 'foreground', 'card_bg', 'border_color', 'primary', 'accent', 'glow_color'] as const) {
        const value = textField(input, key, { max: 100 });
        if (!/^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\([\d\s.,%+-]+\)|[a-z]{1,20})$/i.test(value)) throw ApiError.badRequest(key + ' must be a valid CSS color');
        theme[key] = value;
      }
      return successResponse(await dataStore.saveTheme(theme), { message: 'Theme saved successfully' });
    }
    throw ApiError.badRequest('Unknown action parameter');
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);
    const id = resourceId(request.nextUrl.searchParams.get('id') || '');
    const themes = await dataStore.getThemes();
    if (!themes.some(theme => theme.id === id)) throw ApiError.notFound('Theme not found');
    if (themes.length <= 1) throw ApiError.conflict('Keep at least one theme available');
    if (!(await dataStore.deleteTheme(id))) throw ApiError.notFound('Theme not found');
    return successResponse({ deletedId: id }, { message: 'Theme deleted successfully' });
  } catch (error) { return handleApiError(error); }
}
