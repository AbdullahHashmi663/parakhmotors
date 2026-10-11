import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Privacy Policy", description: "Read how Parakh Motors handles personal information shared through our car sales, inspection and enquiry services.", alternates: { canonical: '/client/privacy-policy' } };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
