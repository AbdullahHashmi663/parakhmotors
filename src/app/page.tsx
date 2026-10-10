import { HomeExperience } from '@/components/HomeExperience';

export default function Home() {
  // Mount the page once; the inventory refreshes within its existing collection UI.
  return <HomeExperience initialVehicles={[]} />;
}
