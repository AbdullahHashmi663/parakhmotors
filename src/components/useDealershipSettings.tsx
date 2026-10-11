'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { DealershipSettings } from '@/types';
import { normalizeSiteContent } from '@/lib/site-content';
import { defaultDealershipSettings } from '@/lib/dealership-settings';

export const defaultContact = defaultDealershipSettings;
export const SETTINGS_UPDATED_EVENT = 'parakh:settings-updated';
export const SETTINGS_UPDATED_KEY = 'pm_settings_updated';
const SettingsContext = createContext<DealershipSettings>(defaultContact);
const normalizeSettings = (value: DealershipSettings) => ({ ...defaultContact, ...value, websiteContent: normalizeSiteContent(value.websiteContent) });

export function DealershipSettingsProvider({ children, initialSettings }: { children: ReactNode; initialSettings: DealershipSettings }) {
  const [settings, setSettings] = useState(() => normalizeSettings(initialSettings));
  const revision = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    async function refresh() {
      const requestRevision = ++revision.current;
      try {
        const response = await fetch('/api/admin/settings', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) return;
        const result: { success: boolean; data?: DealershipSettings } = await response.json();
        if (!disposed && requestRevision === revision.current && result.success && result.data) setSettings(normalizeSettings(result.data));
      } catch { /* Keep the saved server content if the connection is unavailable. */ }
    }
    const onSaved = (event: Event) => {
      const saved = (event as CustomEvent<DealershipSettings>).detail;
      ++revision.current;
      if (saved) setSettings(normalizeSettings(saved));
      else void refresh();
    };
    const onStorage = (event: StorageEvent) => { if (event.key === SETTINGS_UPDATED_KEY) void refresh(); };
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    const timer = window.setInterval(onVisible, 60000);
    void refresh();
    window.addEventListener(SETTINGS_UPDATED_EVENT, onSaved);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener(SETTINGS_UPDATED_EVENT, onSaved);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}
export const useDealershipSettings = () => useContext(SettingsContext);
export const useWebsiteContent = () => useDealershipSettings().websiteContent;
