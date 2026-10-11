import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Independent Car Inspection in Lahore", description: "Book an independent car inspection with Parakh Motors. Get a clear report on mechanical condition, body, interior and electrical systems before you buy.", alternates: { canonical: '/client/inspection' } };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
