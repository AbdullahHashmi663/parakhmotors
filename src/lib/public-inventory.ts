import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { dataStore } from '@/backend/repositories/data-store';
import type { Vehicle } from '@/types';

export async function getPublicInventory(): Promise<Vehicle[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('inventory');
  try {
    return (await dataStore.getVehicles()).filter((vehicle) => vehicle.status !== 'sold');
  } catch {
    return [];
  }
}

export async function getPublicVehicle(id: string): Promise<Vehicle | undefined> {
  const vehicles = await getPublicInventory();
  return vehicles.find((vehicle) => vehicle.id === id);
}
