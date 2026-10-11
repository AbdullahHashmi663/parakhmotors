import type { Metadata } from 'next';
import { HomeExperience } from '@/components/HomeExperience';
import { getPublicInventory } from '@/lib/public-inventory';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  const initialVehicles = await getPublicInventory();
  return <HomeExperience initialVehicles={initialVehicles} />;
}
