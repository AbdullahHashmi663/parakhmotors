'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { Theme } from '@/types';
import { defaultThemes } from '@/lib/themes';
import { api } from '@/lib/api-client';
import {
  setCachedThemes,
  setCachedActiveTheme,
  applyThemeTokensToDOM,
  ACTIVE_THEME_CACHE_KEY,
} from '@/lib/themeCache';

interface ThemeContextType {
  currentTheme: Theme;
  themes: Theme[];
  setTheme: (themeId: string) => Promise<void>;
  saveCustomTheme: (theme: Theme) => Promise<boolean>;
  deleteCustomTheme: (themeId: string) => Promise<boolean>;
  refreshThemesFromDb: () => Promise<void>;
  isLoading: boolean;
  isCached: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  initialThemes = defaultThemes,
  initialActiveTheme,
}: {
  children: ReactNode;
  initialThemes?: Theme[];
  initialActiveTheme?: Theme;
}) {
  const activeDefault =
    initialActiveTheme ||
    initialThemes.find((t) => t.is_active) ||
    defaultThemes[0];

  const [themes, setThemesState] = useState<Theme[]>(initialThemes);
  const [currentTheme, setCurrentThemeState] = useState<Theme>(activeDefault);
  const [isLoading, setIsLoading] = useState(false);
  const [isCached, setIsCached] = useState(true);
  const mutationRevision = useRef(0);
  const pendingMutations = useRef(0);
  const syncRequest = useRef(0);
  const syncInFlight = useRef(false);
  const refreshQueued = useRef(false);

  // Apply theme tokens to DOM immediately
  useEffect(() => {
    applyThemeTokensToDOM(currentTheme);
  }, [currentTheme]);

  // The saved server selection is authoritative across browsers and devices.
  const syncWithDatabase = useCallback(async () => {
    if (pendingMutations.current > 0) {
      refreshQueued.current = true;
      return false;
    }

    const request = ++syncRequest.current;
    const revision = mutationRevision.current;
    refreshQueued.current = false;
    syncInFlight.current = true;
    try {
      setIsLoading(true);
      const { data: dbThemes, activeTheme } = await api.admin.getThemes();
      // A response started before a save must not undo that newer selection.
      if (request !== syncRequest.current || revision !== mutationRevision.current) return false;
      if (dbThemes.length) {
        setThemesState(dbThemes);
        setCachedThemes(dbThemes);
        const active = activeTheme || dbThemes.find((theme) => theme.is_active) || dbThemes[0];
        setCurrentThemeState(active);
        setCachedActiveTheme(active);
        applyThemeTokensToDOM(active);
      }
      setIsCached(false);
      return true;
    } catch (err) {
      console.warn('Background theme sync skipped:', err);
      return false;
    } finally {
      if (request === syncRequest.current) {
        syncInFlight.current = false;
        setIsLoading(false);
      }
    }
  }, []);

  const cancelPendingSync = useCallback(() => { ++syncRequest.current; }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleRefresh = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => { void syncWithDatabase(); }, 150);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACTIVE_THEME_CACHE_KEY && event.storageArea === localStorage) scheduleRefresh();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') scheduleRefresh();
    };
    scheduleRefresh();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', scheduleRefresh);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(timeout);
      cancelPendingSync();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', scheduleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [syncWithDatabase, cancelPendingSync]);

  const beginMutation = () => {
    ++mutationRevision.current;
    ++pendingMutations.current;
    if (syncInFlight.current) refreshQueued.current = true;
  };
  const finishMutation = (refresh = true) => {
    ++mutationRevision.current;
    --pendingMutations.current;
    if (refresh && pendingMutations.current === 0 && refreshQueued.current) {
      void syncWithDatabase();
    }
  };

  // Apply a change only after the database confirms it was saved.
  const setTheme = async (themeId: string) => {
    const target = themes.find((t) => t.id === themeId);
    if (!target) throw new Error('This theme is no longer available. Refresh the studio and try again.');
    beginMutation();
    try {
      const { data: savedTheme } = await api.admin.setActiveTheme(themeId);

      setCurrentThemeState(savedTheme);
      applyThemeTokensToDOM(savedTheme);
      setCachedActiveTheme(savedTheme);
      const updatedThemes = themes.map((t) => ({
        ...t,
        is_active: t.id === themeId,
      }));
      setThemesState(updatedThemes);
      setCachedThemes(updatedThemes);
    } finally {
      finishMutation();
    }
  };

  const saveCustomTheme = async (theme: Theme): Promise<boolean> => {
    beginMutation();
    try {
      const { data: savedTheme } = await api.admin.saveTheme(theme);
      const updatedThemes = [
        ...themes.filter((t) => t.id !== savedTheme.id).map((t) => savedTheme.is_active ? { ...t, is_active: false } : t),
        savedTheme,
      ];
      setThemesState(updatedThemes);
      setCachedThemes(updatedThemes);
      if (savedTheme.is_active) {
        setCurrentThemeState(savedTheme);
        setCachedActiveTheme(savedTheme);
        applyThemeTokensToDOM(savedTheme);
      }
      return true;
    } catch {
      return false;
    } finally {
      finishMutation();
    }
  };

  const deleteCustomTheme = async (themeId: string): Promise<boolean> => {
    beginMutation();
    try {
      await api.admin.deleteTheme(themeId);
    } catch {
      finishMutation();
      return false;
    }
    finishMutation(false);
    return syncWithDatabase();
  };

  const refreshThemesFromDb = async () => {
    if (!await syncWithDatabase()) throw new Error('Unable to refresh themes. Please try again.');
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themes,
        setTheme,
        saveCustomTheme,
        deleteCustomTheme,
        refreshThemesFromDb,
        isLoading,
        isCached,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
