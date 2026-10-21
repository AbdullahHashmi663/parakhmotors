import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import { Suspense } from 'react';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ScrollToTop } from '@/components/ScrollToTop';
import { SiteMotionLoader } from '@/components/SiteMotionLoader';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { DealershipSettingsProvider } from '@/components/useDealershipSettings';
import { defaultDealershipSettings } from '@/lib/dealership-settings';

import { cacheTag } from 'next/cache';
import { dataStore } from '@/backend/repositories/data-store';
import { defaultThemes } from '@/lib/themes';
import { createThemeTokens } from '@/lib/theme-tokens';

const geist = localFont({ src: '../../public/fonts/geist-latin.woff2', variable: '--font-geist', display: 'swap', weight: '100 900' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://parakhmotors.com'),
  title: { default: 'Parakh Motors | A better drive starts with trust.', template: '%s | Parakh Motors' },
  description: 'Buy, sell and inspect cars with confidence. Parakh Motors offers carefully selected cars, independent vehicle inspections and personal buying and selling support in Lahore, Pakistan.',
  icons: { icon: '/brand/mark.svg?v=inspection-logo', apple: '/brand/apple-touch-icon.png?v=inspection-logo' },
  openGraph: { title: 'Parakh Motors | A better drive starts with trust.', description: 'Your next chapter, driven with confidence. Car inspections, buying, selling and sourcing in Pakistan.', images: [{ url: '/images/parakh-journey.webp', width: 1536, height: 1024, alt: 'Parakh Motors — a journey through the mountains of Pakistan' }], type: 'website', locale: 'en_PK', siteName: 'Parakh Motors' },
  twitter: { card: 'summary_large_image', title: 'Parakh Motors | A better drive starts with trust.', description: 'Buy, sell and inspect cars with confidence in Lahore, Pakistan.', images: ['/images/parakh-journey.webp'] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
};

async function getThemeData() {
  'use cache';
  cacheTag('themes');
  cacheTag('site-content');
  const activeTheme = await dataStore.getActiveTheme().catch(() => defaultThemes[0]);
  const themes = await dataStore.getThemes().catch(() => defaultThemes);
  const settings = await dataStore.getSettings().catch(() => defaultDealershipSettings);
  return { activeTheme, themes, settings };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { activeTheme, themes, settings } = await getThemeData();
  const { tokens, mode } = createThemeTokens(activeTheme);

  const themeTokensCss = Object.entries(tokens)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

  const themeCss = `
:root, html[data-theme] {
  --background: ${activeTheme.background};
  --foreground: ${activeTheme.foreground};
  --card-bg: ${activeTheme.card_bg};
  --border-color: ${activeTheme.border_color};
  --primary: ${activeTheme.primary};
  --accent: ${activeTheme.accent};
  --glow-color: ${activeTheme.glow_color};
${themeTokensCss}
  color-scheme: ${mode};
}
`;
  const businessData = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: settings.dealershipName,
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://parakhmotors.com',
    logo: new URL('/brand/mark.svg', process.env.NEXT_PUBLIC_SITE_URL || 'https://parakhmotors.com').toString(),
    image: new URL('/images/parakh-journey.webp', process.env.NEXT_PUBLIC_SITE_URL || 'https://parakhmotors.com').toString(),
    description: settings.tagline,
    telephone: settings.phone,
    email: settings.email,
    address: { '@type': 'PostalAddress', streetAddress: settings.address, addressLocality: 'Lahore', addressCountry: 'PK' },
    currenciesAccepted: settings.currency,
  };

  return (
    <html
      lang="en"
      className={geist.variable}
      data-theme={activeTheme.id}
      data-theme-mode={mode}
      style={{ colorScheme: mode }}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <style id="pm-active-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
        <Script id="pm-page-opening" strategy="beforeInteractive">{"if('scrollRestoration' in history){history.scrollRestoration='manual'}if(!location.hash){window.scrollTo({top:0,left:0,behavior:'instant'})}"}</Script>
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessData).replace(/</g, '\\u003c') }} />
        <Suspense fallback={null}>
          <ScrollToTop />
          <SiteMotionLoader />
        </Suspense>
        <ThemeProvider initialActiveTheme={activeTheme} initialThemes={themes}>
          <DealershipSettingsProvider initialSettings={settings}>
          <Suspense fallback={null}><WhatsAppButton /></Suspense>
            {children}
          </DealershipSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
