import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Suspense } from 'react';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ScrollToTop } from '@/components/ScrollToTop';
import { SiteMotion } from '@/components/SiteMotion';
import { WhatsAppButton } from '@/components/WhatsAppButton';

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
  icons: { icon: '/brand/mark.svg', apple: '/brand/apple-touch-icon.png' },
  openGraph: { title: 'Parakh Motors | A better drive starts with trust.', description: 'Your next chapter, driven with confidence. Car inspections, buying, selling and sourcing in Pakistan.', images: [{ url: '/images/parakh-journey.webp', width: 1536, height: 1024, alt: 'Parakh Motors — a journey through the mountains of Pakistan' }], type: 'website', locale: 'en_PK', siteName: 'Parakh Motors' },
};

async function getThemeData() {
  'use cache';
  cacheTag('themes');
  const activeTheme = await dataStore.getActiveTheme().catch(() => defaultThemes[0]);
  const themes = await dataStore.getThemes().catch(() => defaultThemes);
  return { activeTheme, themes };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { activeTheme, themes } = await getThemeData();
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=localStorage.getItem('pm_cached_active_theme_v1');if(c){var t=JSON.parse(c);if(t&&t.id&&t.id!==${JSON.stringify(activeTheme.id)}){var r=document.documentElement;r.dataset.theme=t.id;if(t.background)r.style.setProperty('--background',t.background);if(t.foreground)r.style.setProperty('--foreground',t.foreground);if(t.card_bg)r.style.setProperty('--card-bg',t.card_bg);if(t.border_color)r.style.setProperty('--border-color',t.border_color);if(t.primary)r.style.setProperty('--primary',t.primary);if(t.accent)r.style.setProperty('--accent',t.accent);if(t.glow_color)r.style.setProperty('--glow-color',t.glow_color);}}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <ScrollToTop />
          <SiteMotion />
          <WhatsAppButton />
        </Suspense>
        <ThemeProvider initialActiveTheme={activeTheme} initialThemes={themes}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
