import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Car Inspection", description: "Book an independent car inspection from PKR 7,000 or a complete deal package from PKR 30,000. Understand the car before you commit." };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
