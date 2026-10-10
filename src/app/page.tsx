import { HomeExperience } from '@/components/HomeExperience';
import { dataStore } from '@/backend/repositories/data-store';
import { Suspense } from 'react';
import { io } from 'next/cache';

export default function Home() {
  return <Suspense fallback={<HomeExperience initialVehicles={[]} />}><LiveHome /></Suspense>;
}

async function LiveHome() {
  await io();
  const vehicles = await dataStore.getVehicles().catch(() => []);
  return <HomeExperience initialVehicles={vehicles} />;
}
