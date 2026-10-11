import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Car Buying, Selling and Inspection Services", description: "Explore car listings, independent inspections, vehicle sourcing and managed selling services from Parakh Motors in Lahore, Pakistan.", alternates: { canonical: '/client/services' } };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
