import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "About Parakh Motors", description: "Meet the people and principles behind Parakh Motors in Lahore, Pakistan. Independent inspections, personal car sourcing and honest selling support for every journey.", alternates: { canonical: '/client/about' } };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
