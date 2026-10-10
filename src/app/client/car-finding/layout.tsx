import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Find Your Next Car", description: "Personal car sourcing for budgets of PKR 40 Lac and above. Tell Parakh Motors what you need and let our team focus the search." };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
