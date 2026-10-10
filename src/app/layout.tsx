import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Suspense } from 'react';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ScrollToTop } from '@/components/ScrollToTop';
import { SiteMotion } from '@/components/SiteMotion';

const geist = localFont({ src: '../../public/fonts/geist-latin.woff2', variable: '--font-geist', display: 'swap', weight: '100 900' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://parakhmotors.com'),
  title: { default: 'Parakh Motors | A better drive starts with trust.', template: '%s | Parakh Motors' },
  description: 'Buy, sell and find your next car with confidence. Independent 200+ point inspections, vehicle sourcing and personal deal support from Parakh Motors in Pakistan.',
  keywords: ['car inspection Pakistan', 'buy cars Lahore', 'sell my car', 'vehicle sourcing', 'Parakh Motors'],
  icons: { icon: '/brand/mark.svg', apple: '/brand/apple-touch-icon.png' },
  openGraph: { title: 'Parakh Motors | A better drive starts with trust.', description: 'Your next chapter, driven with confidence. Car inspections, buying, selling and sourcing in Pakistan.', images: [{ url: '/images/parakh-journey.webp', width: 1536, height: 1024, alt: 'Parakh Motors — a journey through the mountains of Pakistan' }], type: 'website', locale: 'en_PK', siteName: 'Parakh Motors' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={geist.variable} data-scroll-behavior="smooth" suppressHydrationWarning><body><Suspense fallback={null}><ScrollToTop /><SiteMotion /></Suspense><ThemeProvider>{children}</ThemeProvider></body></html>;
}
