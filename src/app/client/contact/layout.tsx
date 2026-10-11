import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Contact Parakh Motors in Lahore", description: "Talk to the Parakh Motors team in Gulberg III, Lahore. Contact us about car inspection, sourcing, buying and selling by phone, WhatsApp or message.", alternates: { canonical: '/client/contact' } };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
