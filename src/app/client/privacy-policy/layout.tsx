import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Privacy Policy", description: "How Parakh Motors handles information you share through enquiries, inspections, sourcing and selling requests." };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
