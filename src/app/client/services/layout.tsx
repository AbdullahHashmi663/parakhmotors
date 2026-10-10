import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Our Services", description: "Explore Parakh Motors car inspection, sourcing, selling and deal support services, with clear package prices and personal guidance." };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
