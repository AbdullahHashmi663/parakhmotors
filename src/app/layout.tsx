import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import { Suspense } from 'react';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ScrollToTop } from '@/components/ScrollToTop';
import { SiteMotion } from '@/components/SiteMotion';
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
  description: 'Buy, sell and find your next car with confidence. Independent 200+ point inspections, vehicle sourcing and personal deal support from Parakh Motors in Pakistan.',
  keywords: ['car inspection Pakistan', 'buy cars Lahore', 'sell my car', 'vehicle sourcing', 'Parakh Motors'],
  icons: { icon: '/brand/mark.svg?v=car-crest', apple: '/brand/apple-touch-icon.png?v=car-crest' },
  openGraph: { title: 'Parakh Motors | A better drive starts with trust.', description: 'Your next chapter, driven with confidence. Car inspections, buying, selling and sourcing in Pakistan.', images: [{ url: '/images/parakh-journey.webp', width: 1536, height: 1024, alt: 'Parakh Motors — a journey through the mountains of Pakistan' }], type: 'website', locale: 'en_PK', siteName: 'Parakh Motors' },
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
        <Suspense fallback={null}>
          <ScrollToTop />
          <SiteMotion />
        </Suspense>
        <ThemeProvider initialActiveTheme={activeTheme} initialThemes={themes}>
          <DealershipSettingsProvider initialSettings={settings}>
            <WhatsAppButton />
            {children}
          </DealershipSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
