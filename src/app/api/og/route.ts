import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createElement } from 'react';
import { dataStore } from '@/backend/repositories/data-store';
import { getPublicVehicle } from '@/lib/public-inventory';
import { defaultThemes } from '@/lib/themes';
import { SeoImage, seoImageSize } from '@/lib/seo-image';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('vehicle');
  if (id !== null && !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) return new Response('Invalid vehicle', { status: 400 });
  const vehicle = id ? await getPublicVehicle(id) : undefined;
  if (id && !vehicle) return new Response('Vehicle not found', { status: 404 });
  const theme = await dataStore.getActiveTheme().catch(() => defaultThemes[0]);
  return new ImageResponse(createElement(SeoImage, { theme, vehicle }), {
    ...seoImageSize,
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, must-revalidate' },
  });
}
