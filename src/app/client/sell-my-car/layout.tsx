import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: "Sell Your Car", description: "Give your car a great next chapter. Compare listing and full selling services, then share your car's details with Parakh Motors." };

export default function PageLayout({ children }: { children: ReactNode }) { return children; }
