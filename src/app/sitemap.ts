import type { MetadataRoute } from 'next';
import { getPublicInventory } from '@/lib/public-inventory';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://parakhmotors.com';
const publicPages = [
  '/',
  '/client/about',
  '/client/car-finding',
  '/client/contact',
  '/client/inspection',
  '/client/investor',
  '/client/privacy-policy',
  '/client/sell-my-car',
  '/client/services',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vehicles = await getPublicInventory();
  return [
    ...publicPages.map((path) => ({
      url: new URL(path, siteUrl).toString(),
      changeFrequency: path === '/' ? 'weekly' as const : 'monthly' as const,
      priority: path === '/' ? 1 : 0.7,
    })),
    ...vehicles.map((vehicle) => ({
      url: new URL(`/cars/${encodeURIComponent(vehicle.id)}`, siteUrl).toString(),
      lastModified: new Date(vehicle.updatedAt || vehicle.createdAt),
      changeFrequency: 'weekly' as const,
      priority: vehicle.featured ? 0.9 : 0.8,
      images: vehicle.images.map((image) => new URL(image, siteUrl).toString()),
    })),
  ];
}
