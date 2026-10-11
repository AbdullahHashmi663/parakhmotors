import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Investor Cash Offer for Your Car", description: "Explore a direct investor cash offer for your car from Parakh Motors in Lahore. Share your vehicle details and our team will review the opportunity.", alternates: { canonical: '/client/investor' } };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
