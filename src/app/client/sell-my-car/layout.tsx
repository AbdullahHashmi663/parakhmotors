import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Sell Your Car in Lahore, Pakistan", description: "Sell your car with Parakh Motors. Choose a listing or managed sale, then share your vehicle details and photos to get started.", alternates: { canonical: '/client/sell-my-car' } };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
