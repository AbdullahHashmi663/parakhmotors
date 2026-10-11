import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Find Your Next Car", description: "Tell Parakh Motors your budget, preferred model and needs. Our Lahore team will source suitable cars and guide you through your next purchase.", alternates: { canonical: '/client/car-finding' } };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
