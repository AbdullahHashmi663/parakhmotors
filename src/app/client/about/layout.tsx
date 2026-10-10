import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "About Parakh", description: "Meet the people and principles behind Parakh Motors. Independent car inspections, personal sourcing and selling support in Lahore, Pakistan." };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
